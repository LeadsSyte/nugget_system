#!/usr/bin/env python3
"""
Google Ads Agent Dashboard - Simple Web Interface
Run with: python dashboard.py
Then open: http://localhost:5000
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
import threading

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

app = Flask(__name__)

# Store running processes
running_agents = {}

def get_available_accounts():
    """Get list of configured client accounts"""
    accounts = []

    # Look for .env.client_* files
    for env_file in Path('.').glob('.env.client_*'):
        account_id = env_file.stem.replace('.env.client_', '')

        # Read the file to get account details
        with open(env_file, 'r') as f:
            content = f.read()
            customer_id = None
            account_name = None

            for line in content.split('\n'):
                if line.startswith('GOOGLE_ADS_CUSTOMER_ID='):
                    customer_id = line.split('=')[1].strip()
                elif line.startswith('ACCOUNT_NAME='):
                    account_name = line.split('=', 1)[1].strip()

        if customer_id:
            # Format with dashes for display
            formatted_id = f"{customer_id[:3]}-{customer_id[3:6]}-{customer_id[6:]}"

            # Use account name if available, otherwise just the formatted ID
            if account_name:
                display_name = f"{account_name} ({formatted_id})"
            else:
                display_name = formatted_id

            accounts.append({
                'id': account_id,
                'customer_id': customer_id,
                'account_name': account_name or formatted_id,
                'formatted_id': formatted_id,
                'display_name': display_name,
                'env_file': str(env_file)
            })

    return sorted(accounts, key=lambda x: x['account_name'])

def get_pending_approvals():
    """Get all pending approval files"""
    approvals_dir = Path('approvals')
    if not approvals_dir.exists():
        return []

    approval_files = []
    for json_file in approvals_dir.glob('pending_actions_*.json'):
        # Skip decision files
        if '_decisions' in json_file.name:
            continue

        try:
            with open(json_file, 'r') as f:
                data = json.load(f)

            # Check if there's a corresponding decisions file
            decisions_file = json_file.parent / f"{json_file.stem}_decisions.json"
            has_decisions = decisions_file.exists()

            if has_decisions:
                with open(decisions_file, 'r') as f:
                    decisions_data = json.load(f)
                    decisions = decisions_data.get('decisions', {})
                    approved = sum(1 for d in decisions.values() if d.get('status') == 'approved')
                    rejected = sum(1 for d in decisions.values() if d.get('status') == 'rejected')
                    pending = sum(1 for d in decisions.values() if d.get('status') == 'pending')
            else:
                approved = 0
                rejected = 0
                pending = data.get('total_actions', 0)

            approval_files.append({
                'filename': json_file.name,
                'timestamp': data.get('timestamp'),
                'total_actions': data.get('total_actions', 0),
                'approved': approved,
                'rejected': rejected,
                'pending': pending,
                'has_decisions': has_decisions,
                'html_file': json_file.with_suffix('.html').name
            })
        except Exception as e:
            print(f"Error reading {json_file}: {e}")
            continue

    return sorted(approval_files, key=lambda x: x['timestamp'], reverse=True)

def get_recent_reports():
    """Get recent execution reports"""
    reports_dir = Path('reports')
    if not reports_dir.exists():
        return []

    reports = []
    for summary_file in reports_dir.glob('summary_*.txt'):
        try:
            with open(summary_file, 'r') as f:
                content = f.read()

            # Extract key info from summary
            timestamp = summary_file.stem.replace('summary_', '')

            reports.append({
                'filename': summary_file.name,
                'timestamp': timestamp,
                'content': content[:500]  # First 500 chars
            })
        except Exception as e:
            print(f"Error reading {summary_file}: {e}")
            continue

    return sorted(reports, key=lambda x: x['timestamp'], reverse=True)[:10]

@app.route('/')
def index():
    """Main dashboard page"""
    accounts = get_available_accounts()
    pending = get_pending_approvals()
    reports = get_recent_reports()

    return render_template('dashboard.html',
                         accounts=accounts,
                         pending_approvals=pending,
                         recent_reports=reports,
                         running_agents=running_agents)

@app.route('/api/run-agent', methods=['POST'])
def run_agent():
    """Run the agent for a specific account"""
    data = request.json
    account_id = data.get('account_id')

    if not account_id:
        return jsonify({'error': 'No account specified'}), 400

    # Check if already running
    if account_id in running_agents:
        return jsonify({'error': 'Agent already running for this account'}), 400

    # Copy the .env file
    env_file = Path(f'.env.client_{account_id}')
    if not env_file.exists():
        return jsonify({'error': f'Config file not found: {env_file}'}), 404

    try:
        # Copy env file to .env
        with open(env_file, 'r') as src:
            with open('.env', 'w') as dst:
                dst.write(src.read())

        # Run the agent in a background thread
        def run_agent_process():
            try:
                result = subprocess.run(
                    ['python', 'run_agent.py'],
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )
                running_agents[account_id] = {
                    'status': 'completed',
                    'exit_code': result.returncode,
                    'output': result.stdout,
                    'error': result.stderr
                }
            except subprocess.TimeoutExpired:
                running_agents[account_id] = {
                    'status': 'timeout',
                    'error': 'Agent execution timed out after 10 minutes'
                }
            except Exception as e:
                running_agents[account_id] = {
                    'status': 'error',
                    'error': str(e)
                }

        running_agents[account_id] = {
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }

        thread = threading.Thread(target=run_agent_process)
        thread.daemon = True
        thread.start()

        return jsonify({
            'success': True,
            'message': f'Agent started for account {account_id}'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/agent-status/<account_id>')
def agent_status(account_id):
    """Check status of running agent"""
    if account_id not in running_agents:
        return jsonify({'status': 'not_running'})

    return jsonify(running_agents[account_id])

@app.route('/api/approvals/<filename>')
def get_approval_data(filename):
    """Get approval data for a specific file"""
    try:
        filepath = Path('approvals') / filename
        with open(filepath, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/save-decisions', methods=['POST'])
def save_decisions():
    """Save approval decisions"""
    data = request.json
    filename = data.get('filename')
    decisions = data.get('decisions')

    if not filename or not decisions:
        return jsonify({'error': 'Missing data'}), 400

    try:
        # Create decisions filename
        base_filename = filename.replace('.json', '')
        decisions_filename = f"{base_filename}_decisions.json"
        decisions_filepath = Path('approvals') / decisions_filename

        # Save decisions
        decisions_data = {
            'timestamp': datetime.now().isoformat(),
            'decisions': decisions
        }

        with open(decisions_filepath, 'w') as f:
            json.dump(decisions_data, f, indent=2)

        return jsonify({
            'success': True,
            'decisions_file': decisions_filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/apply-approvals', methods=['POST'])
def apply_approvals():
    """Apply approved actions"""
    data = request.json
    decisions_filename = data.get('decisions_filename')

    if not decisions_filename:
        return jsonify({'error': 'No decisions file specified'}), 400

    try:
        decisions_filepath = Path('approvals') / decisions_filename
        if not decisions_filepath.exists():
            return jsonify({'error': 'Decisions file not found'}), 404

        # Run apply_approvals.py
        result = subprocess.run(
            ['python', 'apply_approvals.py', str(decisions_filepath)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        return jsonify({
            'success': result.returncode == 0,
            'output': result.stdout,
            'error': result.stderr,
            'exit_code': result.returncode
        })

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Apply approvals timed out'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/approvals/<filename>')
def serve_approval_file(filename):
    """Serve approval HTML files"""
    return send_file(Path('approvals') / filename)

if __name__ == '__main__':
    print("=" * 80)
    print("🚀 GOOGLE ADS AGENT DASHBOARD")
    print("=" * 80)
    print()
    print("Starting web server...")
    print()
    print("📊 Open your browser to: http://localhost:5000")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 80)
    print()

    app.run(debug=True, host='0.0.0.0', port=5000)

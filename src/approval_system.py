"""
Approval system - Manages action approval workflow
"""

import json
from pathlib import Path
from datetime import datetime

class ApprovalSystem:
    """Manages approval workflow for agent actions"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.approval_dir = Path('approvals')
        self.approval_dir.mkdir(exist_ok=True)

        self.approval_mode = config.get('approval.enabled', True)

    def save_pending_actions(self, actions):
        """
        Save actions that require approval

        Returns: path to approval file
        """
        if not actions:
            return None

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        approval_file = self.approval_dir / f'pending_actions_{timestamp}.json'

        # Separate actions by status
        pending_actions = [a for a in actions if a.get('status') == 'awaiting_approval']

        if not pending_actions:
            self.logger.info("No actions require approval")
            return None

        # Group actions by type for better organization
        grouped_actions = self._group_actions_by_type(pending_actions)

        approval_data = {
            'timestamp': datetime.now().isoformat(),
            'total_actions': len(pending_actions),
            'grouped_actions': grouped_actions,
            'all_actions': pending_actions
        }

        with open(approval_file, 'w') as f:
            json.dump(approval_data, f, indent=2)

        self.logger.info(f"Saved {len(pending_actions)} actions awaiting approval: {approval_file}")

        # Generate human-readable summary
        self._generate_approval_summary(approval_file, approval_data)

        # Generate HTML approval interface
        self._generate_html_approval(approval_file, approval_data)

        return approval_file

    def _group_actions_by_type(self, actions):
        """Group actions by type for easier review"""
        grouped = {}

        for action in actions:
            action_type = action.get('type', 'unknown')

            if action_type not in grouped:
                grouped[action_type] = []

            grouped[action_type].append(action)

        return grouped

    def _generate_approval_summary(self, approval_file, approval_data):
        """Generate a human-readable summary file"""
        summary_file = approval_file.with_suffix('.txt')

        with open(summary_file, 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("GOOGLE ADS AGENT - PENDING ACTIONS FOR APPROVAL\n")
            f.write("=" * 80 + "\n")
            f.write(f"Generated: {approval_data['timestamp']}\n")
            f.write(f"Total Actions: {approval_data['total_actions']}\n\n")

            for action_type, actions in approval_data['grouped_actions'].items():
                f.write(f"\n{'=' * 80}\n")
                f.write(f"{action_type.upper().replace('_', ' ')} ({len(actions)} actions)\n")
                f.write("=" * 80 + "\n\n")

                for i, action in enumerate(actions, 1):
                    f.write(f"[{i}] Campaign: {action.get('campaign_name', 'N/A')}\n")

                    if 'ad_group_name' in action:
                        f.write(f"    Ad Group: {action['ad_group_name']}\n")

                    # Type-specific details
                    if action_type == 'bid_adjustment':
                        f.write(f"    Keyword: {action.get('keyword', 'N/A')}\n")
                        f.write(f"    Current Bid: ${action.get('old_bid', 0):.2f}\n")
                        f.write(f"    New Bid: ${action.get('new_bid', 0):.2f}\n")
                        f.write(f"    Change: {action.get('change_percent', 0):+.1f}%\n")
                        f.write(f"    Confidence: {action.get('confidence', 'N/A')}\n")

                    elif action_type == 'create_ad':
                        f.write(f"    Headlines ({len(action.get('headlines', []))}):\n")
                        for headline in action.get('headlines', [])[:5]:
                            f.write(f"      - {headline}\n")
                        f.write(f"    Descriptions ({len(action.get('descriptions', []))}):\n")
                        for desc in action.get('descriptions', [])[:3]:
                            f.write(f"      - {desc}\n")
                        f.write(f"    Testing Hypothesis: {action.get('testing_hypothesis', 'N/A')}\n")

                    elif action_type == 'add_keyword':
                        f.write(f"    Keyword: {action.get('keyword_text', 'N/A')}\n")
                        f.write(f"    Match Type: {action.get('match_type', 'N/A')}\n")
                        f.write(f"    Recommended Bid: ${action.get('recommended_bid', 0):.2f}\n")
                        f.write(f"    Rationale: {action.get('rationale', 'N/A')}\n")

                    elif action_type == 'add_negative_keyword':
                        f.write(f"    Keyword: {action.get('keyword_text', 'N/A')}\n")
                        f.write(f"    Match Type: {action.get('match_type', 'N/A')}\n")
                        f.write(f"    Reason: {action.get('reason', 'N/A')}\n")

                    f.write(f"\n    JUSTIFICATION:\n")
                    f.write(f"    {action.get('justification', 'No justification provided')}\n")
                    f.write(f"\n    {'-' * 76}\n\n")

            f.write("\n" + "=" * 80 + "\n")
            f.write("TO APPROVE THESE ACTIONS:\n")
            f.write("1. Review each action and its justification\n")
            f.write("2. Run: python approve_actions.py <approval_file>\n")
            f.write("3. Follow the prompts to approve/reject individual actions\n")
            f.write("=" * 80 + "\n")

        self.logger.info(f"Generated approval summary: {summary_file}")

    def load_pending_actions(self, approval_file):
        """Load pending actions from file"""
        with open(approval_file, 'r') as f:
            approval_data = json.load(f)

        return approval_data['all_actions']

    def mark_action_approved(self, action):
        """Mark an action as approved"""
        action['status'] = 'approved'
        action['approved_at'] = datetime.now().isoformat()
        return action

    def mark_action_rejected(self, action, reason=''):
        """Mark an action as rejected"""
        action['status'] = 'rejected'
        action['rejected_at'] = datetime.now().isoformat()
        action['rejection_reason'] = reason
        return action

    def _generate_html_approval(self, approval_file, approval_data):
        """Generate interactive HTML approval interface"""
        html_file = approval_file.with_suffix('.html')
        decisions_file = approval_file.with_name(approval_file.stem + '_decisions.json')

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Ads Agent - Action Approval</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}

        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}

        .header h1 {{
            font-size: 32px;
            margin-bottom: 10px;
        }}

        .header p {{
            opacity: 0.9;
            font-size: 16px;
        }}

        .summary {{
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 2px solid #e9ecef;
        }}

        .summary-stats {{
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
        }}

        .stat {{
            text-align: center;
        }}

        .stat-value {{
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }}

        .stat-label {{
            color: #6c757d;
            font-size: 14px;
            margin-top: 5px;
        }}

        .actions-container {{
            padding: 30px;
        }}

        .action-group {{
            margin-bottom: 40px;
        }}

        .action-group-header {{
            background: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }}

        .action-card {{
            border: 2px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
        }}

        .action-card:hover {{
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}

        .action-card.approved {{
            border-color: #28a745;
            background: #f0fff4;
        }}

        .action-card.rejected {{
            border-color: #dc3545;
            background: #fff5f5;
        }}

        .action-header {{
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 2px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .action-title {{
            font-weight: bold;
            color: #333;
        }}

        .action-status {{
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }}

        .status-pending {{
            background: #ffc107;
            color: #000;
        }}

        .status-approved {{
            background: #28a745;
            color: white;
        }}

        .status-rejected {{
            background: #dc3545;
            color: white;
        }}

        .action-body {{
            padding: 20px;
        }}

        .action-details {{
            margin-bottom: 15px;
        }}

        .detail-row {{
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }}

        .detail-label {{
            font-weight: bold;
            color: #666;
            min-width: 150px;
        }}

        .detail-value {{
            color: #333;
            flex: 1;
        }}

        .justification {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }}

        .justification-title {{
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
        }}

        .action-buttons {{
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            padding: 15px 20px;
            background: #f8f9fa;
            border-top: 2px solid #e9ecef;
        }}

        .btn {{
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }}

        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }}

        .btn-approve {{
            background: #28a745;
            color: white;
        }}

        .btn-approve:hover {{
            background: #218838;
        }}

        .btn-reject {{
            background: #dc3545;
            color: white;
        }}

        .btn-reject:hover {{
            background: #c82333;
        }}

        .btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }}

        .bulk-actions {{
            background: white;
            padding: 20px 30px;
            border-bottom: 2px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .bulk-actions-buttons {{
            display: flex;
            gap: 15px;
        }}

        .btn-primary {{
            background: #667eea;
            color: white;
        }}

        .btn-primary:hover {{
            background: #5568d3;
        }}

        .btn-success {{
            background: #28a745;
            color: white;
        }}

        .btn-danger {{
            background: #dc3545;
            color: white;
        }}

        .list-item {{
            padding-left: 20px;
            margin: 5px 0;
        }}

        .change-positive {{
            color: #28a745;
            font-weight: bold;
        }}

        .change-negative {{
            color: #dc3545;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Google Ads Agent - Action Approval</h1>
            <p>Generated: {approval_data['timestamp']}</p>
        </div>

        <div class="summary">
            <div class="summary-stats">
                <div class="stat">
                    <div class="stat-value" id="total-actions">{approval_data['total_actions']}</div>
                    <div class="stat-label">Total Actions</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="approved-count" style="color: #28a745;">0</div>
                    <div class="stat-label">Approved</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="rejected-count" style="color: #dc3545;">0</div>
                    <div class="stat-label">Rejected</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="pending-count">{approval_data['total_actions']}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>
        </div>

        <div class="bulk-actions">
            <div>
                <strong>Bulk Actions:</strong>
            </div>
            <div class="bulk-actions-buttons">
                <button class="btn btn-success" onclick="approveAll()">✓ Approve All</button>
                <button class="btn btn-danger" onclick="rejectAll()">✗ Reject All</button>
                <button class="btn btn-primary" onclick="downloadDecisions()">💾 Download Decisions</button>
            </div>
        </div>

        <div class="actions-container" id="actions-container">
            <!-- Actions will be generated here by JavaScript -->
        </div>
    </div>

    <script>
        // Store approval data
        const approvalData = {json.dumps(approval_data, indent=2)};
        const decisionsFile = '{decisions_file.name}';

        // Track decisions
        let decisions = {{}};

        // Initialize decisions
        approvalData.all_actions.forEach((action, index) => {{
            decisions[index] = {{
                action: action,
                status: 'pending'
            }};
        }});

        // Render actions
        function renderActions() {{
            const container = document.getElementById('actions-container');
            container.innerHTML = '';

            Object.entries(approvalData.grouped_actions).forEach(([actionType, actions]) => {{
                const groupDiv = document.createElement('div');
                groupDiv.className = 'action-group';

                const groupHeader = document.createElement('div');
                groupHeader.className = 'action-group-header';
                groupHeader.textContent = actionType.replace(/_/g, ' ') + ` (${{actions.length}} actions)`;
                groupDiv.appendChild(groupHeader);

                actions.forEach((action, localIndex) => {{
                    const globalIndex = approvalData.all_actions.findIndex(a => JSON.stringify(a) === JSON.stringify(action));
                    const decision = decisions[globalIndex];

                    const card = createActionCard(action, globalIndex, decision.status);
                    groupDiv.appendChild(card);
                }});

                container.appendChild(groupDiv);
            }});

            updateStats();
        }}

        function createActionCard(action, index, status) {{
            const card = document.createElement('div');
            card.className = 'action-card' + (status !== 'pending' ? ' ' + status : '');
            card.id = 'action-' + index;

            let detailsHTML = '';

            // Generate details based on action type
            if (action.type === 'bid_adjustment') {{
                const changeClass = action.change_percent > 0 ? 'change-positive' : 'change-negative';
                detailsHTML = `
                    <div class="detail-row">
                        <div class="detail-label">Keyword:</div>
                        <div class="detail-value">${{action.keyword || 'N/A'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Current Bid:</div>
                        <div class="detail-value">$${{action.old_bid?.toFixed(2) || '0.00'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">New Bid:</div>
                        <div class="detail-value">$${{action.new_bid?.toFixed(2) || '0.00'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Change:</div>
                        <div class="detail-value"><span class="${{changeClass}}">${{action.change_percent > 0 ? '+' : ''}}${{action.change_percent?.toFixed(1) || '0'}}%</span></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Confidence:</div>
                        <div class="detail-value">${{action.confidence || 'N/A'}}</div>
                    </div>
                `;
            }} else if (action.type === 'create_ad') {{
                const headlines = action.headlines || [];
                const descriptions = action.descriptions || [];
                detailsHTML = `
                    <div class="detail-row">
                        <div class="detail-label">Headlines (${{headlines.length}}):</div>
                        <div class="detail-value">
                            ${{headlines.slice(0, 5).map(h => '<div class="list-item">• ' + h + '</div>').join('')}}
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Descriptions (${{descriptions.length}}):</div>
                        <div class="detail-value">
                            ${{descriptions.slice(0, 3).map(d => '<div class="list-item">• ' + d + '</div>').join('')}}
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Testing Hypothesis:</div>
                        <div class="detail-value">${{action.testing_hypothesis || 'N/A'}}</div>
                    </div>
                `;
            }} else if (action.type === 'add_keyword') {{
                detailsHTML = `
                    <div class="detail-row">
                        <div class="detail-label">Keyword:</div>
                        <div class="detail-value">${{action.keyword_text || 'N/A'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Match Type:</div>
                        <div class="detail-value">${{action.match_type || 'N/A'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Recommended Bid:</div>
                        <div class="detail-value">$${{action.recommended_bid?.toFixed(2) || '0.00'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Rationale:</div>
                        <div class="detail-value">${{action.rationale || 'N/A'}}</div>
                    </div>
                `;
            }} else if (action.type === 'add_negative_keyword') {{
                detailsHTML = `
                    <div class="detail-row">
                        <div class="detail-label">Negative Keyword:</div>
                        <div class="detail-value">${{action.keyword_text || 'N/A'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Match Type:</div>
                        <div class="detail-value">${{action.match_type || 'N/A'}}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Reason:</div>
                        <div class="detail-value">${{action.reason || 'N/A'}}</div>
                    </div>
                `;
            }}

            const statusClass = status === 'approved' ? 'status-approved' :
                               status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);

            card.innerHTML = `
                <div class="action-header">
                    <div class="action-title">
                        ${{action.campaign_name || 'N/A'}}
                        ${{action.ad_group_name ? ' → ' + action.ad_group_name : ''}}
                    </div>
                    <div class="action-status ${{statusClass}}">${{statusText}}</div>
                </div>
                <div class="action-body">
                    <div class="action-details">
                        ${{detailsHTML}}
                    </div>
                    <div class="justification">
                        <div class="justification-title">AI Justification:</div>
                        <div>${{action.justification || 'No justification provided'}}</div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-approve" onclick="approveAction(${{index}})" ${{status !== 'pending' ? 'disabled' : ''}}>
                        ✓ Approve
                    </button>
                    <button class="btn btn-reject" onclick="rejectAction(${{index}})" ${{status !== 'pending' ? 'disabled' : ''}}>
                        ✗ Reject
                    </button>
                </div>
            `;

            return card;
        }}

        function approveAction(index) {{
            decisions[index].status = 'approved';
            decisions[index].approved_at = new Date().toISOString();
            renderActions();
        }}

        function rejectAction(index) {{
            decisions[index].status = 'rejected';
            decisions[index].rejected_at = new Date().toISOString();
            renderActions();
        }}

        function approveAll() {{
            if (confirm('Are you sure you want to approve ALL actions?')) {{
                Object.keys(decisions).forEach(index => {{
                    if (decisions[index].status === 'pending') {{
                        decisions[index].status = 'approved';
                        decisions[index].approved_at = new Date().toISOString();
                    }}
                }});
                renderActions();
            }}
        }}

        function rejectAll() {{
            if (confirm('Are you sure you want to reject ALL actions?')) {{
                Object.keys(decisions).forEach(index => {{
                    if (decisions[index].status === 'pending') {{
                        decisions[index].status = 'rejected';
                        decisions[index].rejected_at = new Date().toISOString();
                    }}
                }});
                renderActions();
            }}
        }}

        function updateStats() {{
            const approved = Object.values(decisions).filter(d => d.status === 'approved').length;
            const rejected = Object.values(decisions).filter(d => d.status === 'rejected').length;
            const pending = Object.values(decisions).filter(d => d.status === 'pending').length;

            document.getElementById('approved-count').textContent = approved;
            document.getElementById('rejected-count').textContent = rejected;
            document.getElementById('pending-count').textContent = pending;
        }}

        function downloadDecisions() {{
            const decisionsData = {{
                timestamp: new Date().toISOString(),
                decisions: decisions
            }};

            const dataStr = JSON.stringify(decisionsData, null, 2);
            const dataBlob = new Blob([dataStr], {{ type: 'application/json' }});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = decisionsFile;
            link.click();
            URL.revokeObjectURL(url);

            alert('Decisions downloaded! Place this file in the approvals folder and run:\\n\\npython apply_approvals.py ' + decisionsFile);
        }}

        // Initialize
        renderActions();
    </script>
</body>
</html>
"""

        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        self.logger.info(f"Generated HTML approval interface: {html_file}")

#!/usr/bin/env python3
"""
Generate beautiful HTML reports from CSV files
Makes it easy to view performance data in a web browser
"""

import csv
import sys
from pathlib import Path
from datetime import datetime

def generate_html_report(csv_folder='reports'):
    """Generate an interactive HTML report from CSV files"""

    csv_path = Path(csv_folder)
    if not csv_path.exists():
        print(f"❌ Reports folder not found: {csv_folder}")
        return

    # Find the latest CSV files
    perf_files = sorted(csv_path.glob('performance_*.csv'))
    action_files = sorted(csv_path.glob('actions_*.csv'))

    if not perf_files and not action_files:
        print(f"❌ No CSV files found in {csv_folder}")
        return

    # Get the most recent files
    latest_perf = perf_files[-1] if perf_files else None
    latest_actions = action_files[-1] if action_files else None

    print(f"📊 Generating HTML report...")
    if latest_perf:
        print(f"   Performance: {latest_perf.name}")
    if latest_actions:
        print(f"   Actions: {latest_actions.name}")

    # Read CSV data
    performance_data = []
    actions_data = []

    if latest_perf and latest_perf.exists():
        with open(latest_perf, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            performance_data = list(reader)

    if latest_actions and latest_actions.exists():
        with open(latest_actions, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            actions_data = list(reader)

    # Generate HTML
    html_file = csv_path / f'report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Ads Performance Report - Lead Gen</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .header {{
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        h1 {{
            color: #667eea;
            font-size: 32px;
            margin-bottom: 10px;
        }}

        .subtitle {{
            color: #666;
            font-size: 16px;
        }}

        .section {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        h2 {{
            color: #667eea;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }}

        th {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }}

        td {{
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
        }}

        tr:hover {{
            background-color: #f5f5f5;
        }}

        .metric {{
            font-weight: 600;
            color: #333;
        }}

        .positive {{
            color: #27ae60;
        }}

        .negative {{
            color: #e74c3c;
        }}

        .warning {{
            color: #f39c12;
        }}

        .action-type {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }}

        .type-bid {{
            background: #3498db;
            color: white;
        }}

        .type-ad {{
            background: #9b59b6;
            color: white;
        }}

        .type-keyword {{
            background: #e67e22;
            color: white;
        }}

        .type-negative {{
            background: #e74c3c;
            color: white;
        }}

        .no-data {{
            text-align: center;
            padding: 40px;
            color: #999;
            font-style: italic;
        }}

        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }}

        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}

        .stat-value {{
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 5px;
        }}

        .stat-label {{
            font-size: 14px;
            opacity: 0.9;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Google Ads Performance Report</h1>
            <div class="subtitle">Lead Generation Campaign Analysis • Generated {datetime.now().strftime("%B %d, %Y at %I:%M %p")}</div>
        </div>
"""

    # Performance Summary Statistics
    if performance_data:
        total_conversions = sum(float(row.get('conversions', 0) or 0) for row in performance_data)
        total_cost = sum(float(row.get('cost', 0) or 0) for row in performance_data)
        total_clicks = sum(float(row.get('clicks', 0) or 0) for row in performance_data)
        avg_cpl = total_cost / total_conversions if total_conversions > 0 else 0

        html += f"""
        <div class="section">
            <h2>📊 Overall Performance</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value">{int(total_conversions)}</div>
                    <div class="stat-label">Total Leads</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avg_cpl:.2f}</div>
                    <div class="stat-label">Avg Cost Per Lead</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${total_cost:,.2f}</div>
                    <div class="stat-label">Total Spend</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{int(total_clicks)}</div>
                    <div class="stat-label">Total Clicks</div>
                </div>
            </div>
        </div>
"""

    # Performance Data Table
    if performance_data:
        html += """
        <div class="section">
            <h2>📈 Campaign Performance Details</h2>
            <table>
                <thead>
                    <tr>
"""
        # Add headers
        if performance_data:
            headers = performance_data[0].keys()
            for header in headers:
                html += f"                        <th>{header.replace('_', ' ').title()}</th>\n"

        html += """
                    </tr>
                </thead>
                <tbody>
"""

        for row in performance_data:
            html += "                    <tr>\n"
            for key, value in row.items():
                # Format numbers nicely
                if key in ['cost', 'avg_cpc', 'cost_per_conversion']:
                    try:
                        formatted_value = f"${float(value):,.2f}"
                    except:
                        formatted_value = value
                elif key in ['ctr', 'conversion_rate']:
                    try:
                        formatted_value = f"{float(value):.2f}%"
                    except:
                        formatted_value = value
                elif key in ['impressions', 'clicks', 'conversions']:
                    try:
                        formatted_value = f"{int(float(value)):,}"
                    except:
                        formatted_value = value
                else:
                    formatted_value = value

                html += f"                        <td>{formatted_value}</td>\n"
            html += "                    </tr>\n"

        html += """
                </tbody>
            </table>
        </div>
"""
    else:
        html += """
        <div class="section">
            <h2>📈 Campaign Performance</h2>
            <div class="no-data">No performance data available</div>
        </div>
"""

    # Actions Table
    if actions_data:
        html += """
        <div class="section">
            <h2>🎯 Recommended Actions</h2>
            <table>
                <thead>
                    <tr>
"""
        if actions_data:
            headers = actions_data[0].keys()
            for header in headers:
                html += f"                        <th>{header.replace('_', ' ').title()}</th>\n"

        html += """
                    </tr>
                </thead>
                <tbody>
"""

        for row in actions_data:
            html += "                    <tr>\n"
            for key, value in row.items():
                if key == 'type':
                    # Add colored badge for action type
                    badge_class = f"type-{value.split('_')[0]}" if value else "type-bid"
                    formatted_value = f'<span class="action-type {badge_class}">{value}</span>'
                else:
                    formatted_value = value

                html += f"                        <td>{formatted_value}</td>\n"
            html += "                    </tr>\n"

        html += """
                </tbody>
            </table>
        </div>
"""
    else:
        html += """
        <div class="section">
            <h2>🎯 Recommended Actions</h2>
            <div class="no-data">No actions recommended</div>
        </div>
"""

    html += """
    </div>
</body>
</html>
"""

    # Write HTML file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\n✅ HTML report generated: {html_file}")
    print(f"\n📋 To open the report:")
    print(f"   Windows: start {html_file.name}")
    print(f"   Mac: open {html_file.name}")
    print(f"   Linux: xdg-open {html_file.name}")
    print(f"\nOr just double-click the file in your {csv_folder} folder!")

    return html_file

if __name__ == '__main__':
    folder = sys.argv[1] if len(sys.argv) > 1 else 'reports'
    generate_html_report(folder)

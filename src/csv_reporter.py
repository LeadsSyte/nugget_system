"""
CSV Reporter - Exports performance data and actions to CSV files
"""

import csv
from pathlib import Path
from datetime import datetime
import json


class CSVReporter:
    """Generates CSV reports for easy Excel/Google Sheets import"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.reports_dir = Path('reports')
        self.reports_dir.mkdir(exist_ok=True)

        self.date_str = datetime.now().strftime('%Y%m%d')

    def export_performance_summary(self, campaign_analyses):
        """
        Export campaign performance to CSV

        Args:
            campaign_analyses: List of campaign analysis dicts
        """
        if not campaign_analyses:
            self.logger.info("No campaign data to export")
            return

        csv_file = self.reports_dir / f'performance_{self.date_str}.csv'

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'Date',
                'Campaign_ID',
                'Campaign_Name',
                'Impressions',
                'Clicks',
                'CTR_%',
                'Cost_USD',
                'Avg_CPC_USD',
                'Conversions',
                'Conversion_Rate_%',
                'Cost_Per_Conversion_USD',
                'ROAS',
                'Health_Status'
            ])

            writer.writeheader()

            for analysis in campaign_analyses:
                metrics = analysis['metrics']
                health = analysis['health_indicators']

                writer.writerow({
                    'Date': datetime.now().strftime('%Y-%m-%d'),
                    'Campaign_ID': analysis['campaign_id'],
                    'Campaign_Name': analysis['campaign_name'],
                    'Impressions': metrics['impressions'],
                    'Clicks': metrics['clicks'],
                    'CTR_%': round(metrics['ctr'], 2),
                    'Cost_USD': round(metrics['cost'], 2),
                    'Avg_CPC_USD': round(metrics['avg_cpc'], 2),
                    'Conversions': metrics['conversions'],
                    'Conversion_Rate_%': round(metrics['conversion_rate'], 2),
                    'Cost_Per_Conversion_USD': round(metrics['cost_per_conversion'], 2),
                    'ROAS': round(metrics['roas'], 2),
                    'Health_Status': health['overall_health']
                })

        self.logger.info(f"Performance data exported to: {csv_file}")
        return csv_file

    def export_actions(self, all_actions):
        """
        Export recommended actions to CSV

        Args:
            all_actions: List of action dicts
        """
        if not all_actions:
            self.logger.info("No actions to export")
            return

        csv_file = self.reports_dir / f'actions_{self.date_str}.csv'

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'Date',
                'Campaign_Name',
                'Ad_Group_Name',
                'Action_Type',
                'Target',
                'Old_Value',
                'New_Value',
                'Change_%',
                'Confidence',
                'Status',
                'Justification'
            ])

            writer.writeheader()

            for action in all_actions:
                action_type = action.get('type', 'unknown')

                # Format action details based on type
                if action_type == 'bid_adjustment':
                    target = action.get('keyword', 'N/A')
                    old_value = f"${action.get('old_bid', 0):.2f}"
                    new_value = f"${action.get('new_bid', 0):.2f}"
                    change = f"{action.get('change_percent', 0):+.1f}%"
                elif action_type == 'create_ad':
                    target = 'New Ad'
                    old_value = 'None'
                    new_value = f"{len(action.get('headlines', []))} headlines"
                    change = 'N/A'
                elif action_type == 'add_keyword':
                    target = action.get('keyword_text', 'N/A')
                    old_value = 'None'
                    new_value = f"${action.get('recommended_bid', 0):.2f}"
                    change = 'New'
                elif action_type == 'add_negative_keyword':
                    target = action.get('keyword_text', 'N/A')
                    old_value = 'None'
                    new_value = 'Negative'
                    change = 'N/A'
                else:
                    target = 'N/A'
                    old_value = 'N/A'
                    new_value = 'N/A'
                    change = 'N/A'

                writer.writerow({
                    'Date': datetime.now().strftime('%Y-%m-%d'),
                    'Campaign_Name': action.get('campaign_name', 'N/A'),
                    'Ad_Group_Name': action.get('ad_group_name', 'N/A'),
                    'Action_Type': action_type.replace('_', ' ').title(),
                    'Target': target,
                    'Old_Value': old_value,
                    'New_Value': new_value,
                    'Change_%': change,
                    'Confidence': action.get('confidence', 'N/A'),
                    'Status': action.get('status', 'N/A'),
                    'Justification': action.get('justification', 'N/A')[:200]  # Truncate long text
                })

        self.logger.info(f"Actions exported to: {csv_file}")
        return csv_file

    def export_decisions(self, decision_log_path):
        """
        Export AI decisions from JSONL to CSV

        Args:
            decision_log_path: Path to the decisions JSONL file
        """
        if not decision_log_path or not Path(decision_log_path).exists():
            self.logger.info("No decision log to export")
            return

        csv_file = self.reports_dir / f'decisions_{self.date_str}.csv'

        decisions = []
        with open(decision_log_path, 'r') as f:
            for line in f:
                if line.strip():
                    decisions.append(json.loads(line))

        if not decisions:
            self.logger.info("Decision log is empty")
            return

        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'Timestamp',
                'Campaign_Name',
                'Action_Type',
                'Decision_Data',
                'Justification'
            ])

            writer.writeheader()

            for decision in decisions:
                writer.writerow({
                    'Timestamp': decision.get('timestamp', 'N/A'),
                    'Campaign_Name': decision.get('campaign_name', 'N/A'),
                    'Action_Type': decision.get('action_type', 'N/A').replace('_', ' ').title(),
                    'Decision_Data': json.dumps(decision.get('decision_data', {})),
                    'Justification': decision.get('justification', 'N/A')[:500]  # Truncate
                })

        self.logger.info(f"Decisions exported to: {csv_file}")
        return csv_file

    def create_summary_report(self, campaign_analyses, all_actions):
        """
        Create a text summary report

        Args:
            campaign_analyses: List of campaign analysis dicts
            all_actions: List of action dicts
        """
        summary_file = self.reports_dir / f'summary_{self.date_str}.txt'

        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"GOOGLE ADS AGENT - DAILY SUMMARY REPORT\n")
            f.write("=" * 80 + "\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Performance summary
            f.write("CAMPAIGN PERFORMANCE:\n")
            f.write("-" * 80 + "\n")
            for analysis in campaign_analyses:
                metrics = analysis['metrics']
                f.write(f"\n{analysis['campaign_name']}\n")
                f.write(f"  Status: {analysis['health_indicators']['overall_health']}\n")
                f.write(f"  Impressions: {metrics['impressions']:,}\n")
                f.write(f"  Clicks: {metrics['clicks']:,}\n")
                f.write(f"  CTR: {metrics['ctr']:.2f}%\n")
                f.write(f"  Cost: ${metrics['cost']:,.2f}\n")
                f.write(f"  Conversions: {metrics['conversions']:.0f}\n")
                f.write(f"  ROAS: {metrics['roas']:.2f}x\n")

            # Actions summary
            f.write("\n" + "=" * 80 + "\n")
            f.write("RECOMMENDED ACTIONS:\n")
            f.write("-" * 80 + "\n")

            if all_actions:
                action_counts = {}
                for action in all_actions:
                    action_type = action.get('type', 'unknown')
                    action_counts[action_type] = action_counts.get(action_type, 0) + 1

                f.write(f"\nTotal Actions: {len(all_actions)}\n\n")
                for action_type, count in action_counts.items():
                    f.write(f"  - {action_type.replace('_', ' ').title()}: {count}\n")
            else:
                f.write("\nNo actions recommended at this time.\n")

            f.write("\n" + "=" * 80 + "\n")
            f.write("For detailed data, see the CSV files in the reports/ folder.\n")
            f.write("=" * 80 + "\n")

        self.logger.info(f"Summary report created: {summary_file}")
        return summary_file

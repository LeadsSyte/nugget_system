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

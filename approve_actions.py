#!/usr/bin/env python3
"""
Approval script - Review and approve/reject agent recommendations
"""

import sys
import json
from pathlib import Path

from src.config_loader import Config
from src.logger import AgentLogger
from src.google_ads_client import GoogleAdsManager
from src.bid_optimizer import BidOptimizer
from src.ad_copy_manager import AdCopyManager
from src.keyword_manager import KeywordManager
from src.gemini_brain import GeminiBrain


def display_action(action, index, total):
    """Display an action for review"""
    print("\n" + "=" * 80)
    print(f"ACTION {index + 1} of {total}")
    print("=" * 80)

    print(f"Type: {action['type'].replace('_', ' ').title()}")
    print(f"Campaign: {action.get('campaign_name', 'N/A')}")

    if 'ad_group_name' in action:
        print(f"Ad Group: {action['ad_group_name']}")

    # Display type-specific details
    if action['type'] == 'bid_adjustment':
        print(f"\nKeyword: {action.get('keyword')}")
        print(f"Current Bid: ${action.get('old_bid', 0):.2f}")
        print(f"New Bid: ${action.get('new_bid', 0):.2f}")
        print(f"Change: {action.get('change_percent', 0):+.1f}%")
        print(f"Confidence: {action.get('confidence', 'N/A')}")

    elif action['type'] == 'create_ad':
        print(f"\nHeadlines ({len(action.get('headlines', []))}):")
        for i, headline in enumerate(action.get('headlines', []), 1):
            print(f"  {i}. {headline}")
        print(f"\nDescriptions ({len(action.get('descriptions', []))}):")
        for i, desc in enumerate(action.get('descriptions', []), 1):
            print(f"  {i}. {desc}")
        print(f"\nTesting Hypothesis: {action.get('testing_hypothesis', 'N/A')}")

    elif action['type'] == 'add_keyword':
        print(f"\nKeyword: {action.get('keyword_text')}")
        print(f"Match Type: {action.get('match_type')}")
        print(f"Recommended Bid: ${action.get('recommended_bid', 0):.2f}")
        print(f"Rationale: {action.get('rationale', 'N/A')}")

    elif action['type'] == 'add_negative_keyword':
        print(f"\nKeyword: {action.get('keyword_text')}")
        print(f"Match Type: {action.get('match_type')}")
        print(f"Reason: {action.get('reason', 'N/A')}")

    elif action['type'] == 'pause_ad':
        print(f"\nAd ID: {action.get('ad_id')}")
        print(f"Reason: {action.get('reason', 'N/A')}")

    print(f"\n{'─' * 80}")
    print("JUSTIFICATION:")
    print(action.get('justification', 'No justification provided'))
    print("─" * 80)


def get_user_decision():
    """Get user's approval decision"""
    while True:
        response = input("\nApprove this action? [y/n/q to quit]: ").lower().strip()

        if response in ['y', 'yes']:
            return 'approve'
        elif response in ['n', 'no']:
            return 'reject'
        elif response in ['q', 'quit']:
            return 'quit'
        else:
            print("Invalid input. Please enter 'y' for yes, 'n' for no, or 'q' to quit.")


def main():
    """Main approval workflow"""
    if len(sys.argv) < 2:
        print("Usage: python approve_actions.py <approval_file>")
        sys.exit(1)

    approval_file = Path(sys.argv[1])

    if not approval_file.exists():
        print(f"Error: Approval file not found: {approval_file}")
        sys.exit(1)

    print("=" * 80)
    print("🔍 GOOGLE ADS AGENT - ACTION APPROVAL")
    print("=" * 80)
    print()

    # Load actions
    with open(approval_file, 'r') as f:
        approval_data = json.load(f)

    actions = approval_data['all_actions']

    print(f"Loaded {len(actions)} actions for review\n")
    print("You will review each action and decide whether to approve or reject it.\n")

    # Initialize components for applying actions
    config = Config()
    logger = AgentLogger(config)
    google_ads = GoogleAdsManager(config, logger)
    gemini_brain = GeminiBrain(config, logger)

    bid_optimizer = BidOptimizer(config, logger, gemini_brain, google_ads)
    ad_copy_manager = AdCopyManager(config, logger, gemini_brain, google_ads)
    keyword_manager = KeywordManager(config, logger, gemini_brain, google_ads)

    customer_id = config.get_google_ads_credentials()['login_customer_id']

    # Track results
    approved_count = 0
    rejected_count = 0
    applied_count = 0

    # Review each action
    for i, action in enumerate(actions):
        display_action(action, i, len(actions))

        decision = get_user_decision()

        if decision == 'quit':
            print("\nQuitting approval process...")
            break

        elif decision == 'approve':
            approved_count += 1
            print("✓ Action approved")

            # Apply the action
            success = apply_action(
                action,
                customer_id,
                bid_optimizer,
                ad_copy_manager,
                keyword_manager,
                logger
            )

            if success:
                applied_count += 1
                print("✓ Action applied successfully")
            else:
                print("✗ Failed to apply action - check logs for details")

        elif decision == 'reject':
            rejected_count += 1
            print("✗ Action rejected")

    # Summary
    print("\n" + "=" * 80)
    print("📊 APPROVAL SUMMARY")
    print("=" * 80)
    print(f"Total Actions: {len(actions)}")
    print(f"Approved: {approved_count}")
    print(f"Applied Successfully: {applied_count}")
    print(f"Rejected: {rejected_count}")
    print(f"Skipped: {len(actions) - approved_count - rejected_count}")
    print("=" * 80)

    print("\n✅ Approval process complete")


def apply_action(action, customer_id, bid_optimizer, ad_copy_manager, keyword_manager, logger):
    """Apply an approved action"""
    try:
        action_type = action['type']

        if action_type == 'bid_adjustment':
            # Note: This requires the criterion_id which we don't have in the action
            # In a production system, you'd need to fetch this or store it
            logger.warning("Bid adjustment requires criterion_id - manual implementation needed")
            return False

        elif action_type == 'create_ad':
            return ad_copy_manager.create_ad(
                customer_id=customer_id,
                ad_group_id=action['ad_group_id'],
                headlines=action['headlines'],
                descriptions=action['descriptions']
            )

        elif action_type == 'add_keyword':
            return keyword_manager.add_keyword(
                customer_id=customer_id,
                ad_group_id=action['ad_group_id'],
                keyword_text=action['keyword_text'],
                match_type=action['match_type'],
                cpc_bid=action['recommended_bid']
            )

        elif action_type == 'add_negative_keyword':
            return keyword_manager.add_negative_keyword(
                customer_id=customer_id,
                campaign_id=action['campaign_id'],
                keyword_text=action['keyword_text'],
                match_type=action['match_type']
            )

        elif action_type == 'pause_ad':
            logger.warning("Pause ad action requires manual implementation")
            return False

        else:
            logger.warning(f"Unknown action type: {action_type}")
            return False

    except Exception as e:
        logger.error(f"Error applying action: {e}")
        return False


if __name__ == "__main__":
    main()

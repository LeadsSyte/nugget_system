#!/usr/bin/env python3
"""
Apply Approvals - Processes approval decisions and applies approved actions
"""

import sys
import json
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.config_loader import Config
from src.logger import AgentLogger
from src.google_ads_client import GoogleAdsManager
from src.bid_optimizer import BidOptimizer
from src.ad_copy_manager import AdCopyManager
from src.keyword_manager import KeywordManager


def load_decisions(decisions_file):
    """Load decisions from JSON file"""
    with open(decisions_file, 'r') as f:
        data = json.load(f)

    return data['decisions']


def track_rejected_actions(rejected_actions, config):
    """Save rejected actions to a blacklist to prevent re-suggesting"""
    blacklist_file = Path('approvals') / 'rejected_actions_blacklist.json'

    # Load existing blacklist
    if blacklist_file.exists():
        with open(blacklist_file, 'r') as f:
            blacklist = json.load(f)
    else:
        blacklist = []

    # Add new rejected actions
    for action_idx, decision in rejected_actions.items():
        action = decision['action']

        # Create a signature for the action to prevent re-suggesting
        signature = {
            'type': action.get('type'),
            'campaign_id': action.get('campaign_id'),
            'ad_group_id': action.get('ad_group_id'),
            'rejected_at': decision.get('rejected_at')
        }

        # Add type-specific identifiers
        if action['type'] == 'bid_adjustment':
            signature['keyword'] = action.get('keyword')
        elif action['type'] == 'add_keyword':
            signature['keyword_text'] = action.get('keyword_text')
        elif action['type'] == 'add_negative_keyword':
            signature['keyword_text'] = action.get('keyword_text')

        blacklist.append(signature)

    # Save updated blacklist
    with open(blacklist_file, 'w') as f:
        json.dump(blacklist, f, indent=2)

    print(f"✓ Tracked {len(rejected_actions)} rejected actions in blacklist")
    return blacklist_file


def apply_approved_actions(approved_actions, config, logger):
    """Apply approved actions to Google Ads"""

    if not approved_actions:
        print("No approved actions to apply")
        return

    print(f"\n🚀 Applying {len(approved_actions)} approved actions...\n")

    # Initialize components
    google_ads = GoogleAdsManager(config, logger)

    # Group actions by type
    actions_by_type = {}
    for action_idx, decision in approved_actions.items():
        action = decision['action']
        action_type = action.get('type')

        if action_type not in actions_by_type:
            actions_by_type[action_type] = []

        actions_by_type[action_type].append(action)

    # Apply each type of action
    customer_id = config.get_google_ads_credentials()['customer_id']

    success_count = 0
    error_count = 0

    # Apply bid adjustments
    if 'bid_adjustment' in actions_by_type:
        print(f"💰 Applying {len(actions_by_type['bid_adjustment'])} bid adjustments...")
        for action in actions_by_type['bid_adjustment']:
            try:
                # Convert bid to micros (Google Ads uses micros: 1/1,000,000 of currency)
                new_bid_micros = int(action['new_bid'] * 1_000_000)

                # Apply bid adjustment through Google Ads API
                google_ads.update_keyword_bid(
                    customer_id=customer_id,
                    ad_group_id=action['ad_group_id'],
                    criterion_id=action.get('keyword_id') or action.get('criterion_id'),
                    new_bid_micros=new_bid_micros
                )
                print(f"  ✓ Updated bid for '{action['keyword']}' to ${action['new_bid']:.2f}")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error updating bid for '{action['keyword']}': {e}")
                logger.error(f"Bid update failed: {e}")
                error_count += 1

    # Apply ad copy creation
    if 'create_ad' in actions_by_type:
        print(f"\n📝 Creating {len(actions_by_type['create_ad'])} new ads...")
        for action in actions_by_type['create_ad']:
            try:
                google_ads.create_responsive_search_ad(
                    customer_id=customer_id,
                    ad_group_id=action['ad_group_id'],
                    headlines=action['headlines'],
                    descriptions=action['descriptions']
                )
                print(f"  ✓ Created new ad for ad group '{action['ad_group_name']}'")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error creating ad: {e}")
                logger.error(f"Ad creation failed: {e}")
                error_count += 1

    # Apply keyword additions
    if 'add_keyword' in actions_by_type:
        print(f"\n🔑 Adding {len(actions_by_type['add_keyword'])} keywords...")
        for action in actions_by_type['add_keyword']:
            try:
                # Convert bid to micros (Google Ads uses micros: 1/1,000,000 of currency)
                bid_in_micros = int(action['recommended_bid'] * 1_000_000)

                google_ads.add_keyword(
                    customer_id=customer_id,
                    ad_group_id=action['ad_group_id'],
                    keyword_text=action['keyword_text'],
                    match_type=action['match_type'],
                    cpc_bid_micros=bid_in_micros
                )
                print(f"  ✓ Added keyword '{action['keyword_text']}' [{action['match_type']}]")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error adding keyword '{action['keyword_text']}': {e}")
                logger.error(f"Keyword addition failed: {e}")
                error_count += 1

    # Apply negative keyword additions
    if 'add_negative_keyword' in actions_by_type:
        print(f"\n🚫 Adding {len(actions_by_type['add_negative_keyword'])} negative keywords...")
        for action in actions_by_type['add_negative_keyword']:
            try:
                google_ads.add_negative_keyword(
                    customer_id=customer_id,
                    campaign_id=action['campaign_id'],
                    keyword_text=action['keyword_text'],
                    match_type=action['match_type']
                )
                print(f"  ✓ Added negative keyword '{action['keyword_text']}' [{action['match_type']}]")
                success_count += 1
            except Exception as e:
                print(f"  ✗ Error adding negative keyword '{action['keyword_text']}': {e}")
                logger.error(f"Negative keyword addition failed: {e}")
                error_count += 1

    print(f"\n{'='*80}")
    print(f"✅ RESULTS:")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {error_count}")
    print(f"{'='*80}\n")


def main():
    """Main execution function"""

    if len(sys.argv) < 2:
        print("Usage: python apply_approvals.py <decisions_file.json>")
        print("\nExample: python apply_approvals.py approvals/pending_actions_20260108_165534_decisions.json")
        sys.exit(1)

    decisions_file = Path(sys.argv[1])

    if not decisions_file.exists():
        print(f"❌ Error: Decisions file not found: {decisions_file}")
        sys.exit(1)

    print("=" * 80)
    print("🚀 GOOGLE ADS AGENT - APPLY APPROVALS")
    print("=" * 80)
    print()

    try:
        # Load configuration
        config = Config()
        logger = AgentLogger(config)

        # Check if in dry run mode
        if config.is_dry_run():
            print("⚠️  DRY RUN MODE - No changes will be applied")
            print("    (Set safety.dry_run: false in config.yaml to apply changes)\n")

        # Load decisions
        print(f"📋 Loading decisions from: {decisions_file}")
        decisions = load_decisions(decisions_file)

        # Separate approved and rejected actions
        approved_actions = {
            idx: dec for idx, dec in decisions.items()
            if dec['status'] == 'approved'
        }

        rejected_actions = {
            idx: dec for idx, dec in decisions.items()
            if dec['status'] == 'rejected'
        }

        pending_actions = {
            idx: dec for idx, dec in decisions.items()
            if dec['status'] == 'pending'
        }

        print(f"   ✓ Approved: {len(approved_actions)}")
        print(f"   ✗ Rejected: {len(rejected_actions)}")
        print(f"   ⏳ Pending: {len(pending_actions)}")

        if pending_actions:
            print(f"\n⚠️  Warning: {len(pending_actions)} actions are still pending")
            print("   Please review all actions before applying")

        # Track rejected actions
        if rejected_actions:
            print(f"\n📝 Tracking rejected actions...")
            blacklist_file = track_rejected_actions(rejected_actions, config)
            print(f"   Blacklist saved to: {blacklist_file}")

        # Apply approved actions
        if approved_actions:
            if config.is_dry_run():
                print("\n⚠️  DRY RUN - Would have applied the following actions:")
                for idx, dec in approved_actions.items():
                    action = dec['action']
                    print(f"   • {action['type']}: {action.get('campaign_name', 'N/A')}")
            else:
                confirm = input(f"\n⚠️  Ready to apply {len(approved_actions)} actions. Continue? (yes/no): ")
                if confirm.lower() in ['yes', 'y']:
                    apply_approved_actions(approved_actions, config, logger)
                else:
                    print("❌ Aborted by user")
                    sys.exit(0)
        else:
            print("\nℹ️  No approved actions to apply")

        print("\n✅ APPROVAL PROCESSING COMPLETE")
        logger.info("Approval processing completed successfully")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

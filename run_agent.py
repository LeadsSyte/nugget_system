#!/usr/bin/env python3
"""
Google Ads Agent - Main orchestrator script
Run this daily to optimize your Google Ads campaigns with AI
"""

import sys
import traceback
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.config_loader import Config
from src.logger import AgentLogger
from src.google_ads_client import GoogleAdsManager
from src.gemini_brain import GeminiBrain
from src.bid_optimizer import BidOptimizer
from src.ad_copy_manager import AdCopyManager
from src.keyword_manager import KeywordManager
from src.performance_analyzer import PerformanceAnalyzer
from src.approval_system import ApprovalSystem
from src.email_notifier import EmailNotifier
from src.csv_reporter import CSVReporter


def main():
    """Main execution function"""

    print("=" * 80)
    print("🚀 GOOGLE ADS AGENT - ULTIMATE OPTIMIZATION")
    print("=" * 80)
    print()

    try:
        # Initialize configuration and logging
        print("📋 Loading configuration...")
        config = Config()
        logger = AgentLogger(config)

        logger.info("Google Ads Agent starting...")

        # Check if in dry run mode
        if config.is_dry_run():
            logger.warning("⚠️  DRY RUN MODE - No changes will be applied")

        # Check if approval mode is enabled
        approval_enabled = config.get('approval.enabled', True)
        if approval_enabled:
            logger.info("✓ Approval mode ENABLED - Actions will require your approval")
        else:
            logger.warning("⚠️  Approval mode DISABLED - Actions will be applied automatically")

        # Initialize components
        print("🔧 Initializing components...")
        google_ads = GoogleAdsManager(config, logger)
        gemini_brain = GeminiBrain(config, logger)
        performance_analyzer = PerformanceAnalyzer(config, logger)
        approval_system = ApprovalSystem(config, logger)
        email_notifier = EmailNotifier(config, logger)
        csv_reporter = CSVReporter(config, logger)

        # Initialize optimization modules
        bid_optimizer = BidOptimizer(config, logger, gemini_brain, google_ads)
        ad_copy_manager = AdCopyManager(config, logger, gemini_brain, google_ads)
        keyword_manager = KeywordManager(config, logger, gemini_brain, google_ads)

        logger.info("All components initialized successfully")

        # Get customer ID
        customer_id = config.get_google_ads_credentials()['login_customer_id']

        # Fetch campaigns
        print("\n📊 Fetching campaign data...")
        campaigns = google_ads.get_campaigns(customer_id)

        if not campaigns:
            logger.error("No active campaigns found. Exiting.")
            return

        logger.info(f"Found {len(campaigns)} active campaigns")

        # Analyze performance for all campaigns
        print("\n📈 Analyzing campaign performance...")
        all_campaign_analyses = []

        for campaign in campaigns:
            analysis = performance_analyzer.analyze_campaign_performance(campaign)
            all_campaign_analyses.append(analysis)

            # Log opportunities
            opportunities = performance_analyzer.identify_optimization_opportunities(analysis)
            if opportunities:
                logger.info(
                    f"Found {len(opportunities)} optimization opportunities "
                    f"for '{campaign['name']}'"
                )

        # Generate performance summary
        performance_summary = performance_analyzer.generate_performance_summary(
            all_campaign_analyses
        )
        print(performance_summary)
        logger.info("Performance analysis complete")

        # Collect all actions
        all_actions = []

        # Run optimizations for each campaign
        print("\n🤖 Running AI optimizations...")

        for campaign in campaigns:
            logger.info(f"Processing campaign: {campaign['name']}")

            # Bid optimization
            print(f"  💰 Optimizing bids for '{campaign['name']}'...")
            bid_actions = bid_optimizer.optimize_campaign_bids(customer_id, campaign)
            all_actions.extend(bid_actions)

            # Log each bid action
            for action in bid_actions:
                logger.log_decision(
                    action_type=action['type'],
                    campaign_id=action['campaign_id'],
                    campaign_name=action['campaign_name'],
                    decision_data={
                        'keyword': action.get('keyword'),
                        'old_bid': action.get('old_bid'),
                        'new_bid': action.get('new_bid'),
                        'change_percent': action.get('change_percent')
                    },
                    justification=action.get('justification', '')
                )

            # Ad copy management
            print(f"  📝 Managing ad copy for '{campaign['name']}'...")
            ad_actions = ad_copy_manager.manage_campaign_ads(customer_id, campaign)
            all_actions.extend(ad_actions)

            # Log ad actions
            for action in ad_actions:
                logger.log_decision(
                    action_type=action['type'],
                    campaign_id=action['campaign_id'],
                    campaign_name=action['campaign_name'],
                    decision_data={
                        'headlines': action.get('headlines', [])[:3],  # First 3
                        'descriptions': action.get('descriptions', [])[:2]  # First 2
                    } if action['type'] == 'create_ad' else {'ad_id': action.get('ad_id')},
                    justification=action.get('justification', '')
                )

            # Keyword management
            print(f"  🔑 Managing keywords for '{campaign['name']}'...")
            keyword_actions = keyword_manager.manage_campaign_keywords(customer_id, campaign)
            all_actions.extend(keyword_actions)

            # Log keyword actions
            for action in keyword_actions:
                logger.log_decision(
                    action_type=action['type'],
                    campaign_id=action['campaign_id'],
                    campaign_name=action['campaign_name'],
                    decision_data={
                        'keyword': action.get('keyword_text'),
                        'match_type': action.get('match_type'),
                        'recommended_bid': action.get('recommended_bid')
                    },
                    justification=action.get('justification', '')
                )

        # Summary of actions
        print("\n" + "=" * 80)
        print("📋 ACTIONS SUMMARY")
        print("=" * 80)

        action_counts = {}
        for action in all_actions:
            action_type = action.get('type', 'unknown')
            action_counts[action_type] = action_counts.get(action_type, 0) + 1

        actions_summary = f"Total Actions: {len(all_actions)}\n"
        for action_type, count in action_counts.items():
            actions_summary += f"  - {action_type.replace('_', ' ').title()}: {count}\n"

        print(actions_summary)

        # Handle approvals
        approval_file = None
        if approval_enabled and all_actions:
            print("\n⏳ Saving actions for approval...")
            approval_file = approval_system.save_pending_actions(all_actions)

            if approval_file:
                print(f"\n✓ Actions saved to: {approval_file}")
                print(f"✓ Text summary: {approval_file.with_suffix('.txt')}")
                print(f"✓ HTML approval interface: {approval_file.with_suffix('.html')}")
                print("\n📋 To review and approve actions:")
                print(f"   1. Open in browser: {approval_file.with_suffix('.html')}")
                print(f"   2. Click Approve/Reject buttons for each action")
                print(f"   3. Click 'Download Decisions' button")
                print(f"   4. Run: python apply_approvals.py <decisions_file.json>")
        elif all_actions:
            logger.info(f"{len(all_actions)} actions were executed automatically")

        # Send email notification
        if config.get('approval.email_notifications', True):
            print("\n📧 Sending email notification...")
            email_notifier.send_daily_summary(
                performance_summary=performance_summary,
                actions_summary=actions_summary,
                approval_file=approval_file
            )

        # Export to CSV
        print("\n📊 Exporting data to CSV...")
        performance_csv = csv_reporter.export_performance_summary(all_campaign_analyses)
        if all_actions:
            actions_csv = csv_reporter.export_actions(all_actions)

        # Export decisions if available
        decision_log_path = logger.decision_log_path
        csv_reporter.export_decisions(decision_log_path)

        # Create summary report
        summary_report = csv_reporter.create_summary_report(all_campaign_analyses, all_actions)

        if performance_csv:
            print(f"✓ Performance data: {performance_csv}")
        print(f"✓ Summary report: {summary_report}")
        print(f"✓ All reports saved in: reports/")

        print("\n" + "=" * 80)
        print("✅ AGENT EXECUTION COMPLETE")
        print("=" * 80)
        logger.info("Google Ads Agent completed successfully")

    except Exception as e:
        error_msg = f"Fatal error: {e}\n{traceback.format_exc()}"
        print(f"\n❌ ERROR: {e}")

        if 'logger' in locals():
            logger.critical(error_msg)

        if 'email_notifier' in locals():
            email_notifier.send_error_notification(error_msg)

        sys.exit(1)


if __name__ == "__main__":
    main()

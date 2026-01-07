"""
Bid optimization module - Analyzes performance and adjusts bids
"""

class BidOptimizer:
    """Handles bid optimization logic"""

    def __init__(self, config, logger, gemini_brain, google_ads_manager):
        self.config = config
        self.logger = logger
        self.gemini = gemini_brain
        self.ads_manager = google_ads_manager

        # Get bid configuration
        self.max_bid_change_percent = config.get('bidding.max_bid_change_percent', 20)
        self.min_bid = config.get('bidding.min_bid', 0.10)
        self.max_bid = config.get('bidding.max_bid', 50.00)
        self.auto_apply = config.get('bidding.auto_apply_bids', True)

    def optimize_campaign_bids(self, customer_id, campaign):
        """
        Optimize bids for all ad groups and keywords in a campaign

        Returns: list of actions taken
        """
        campaign_id = campaign['id']
        campaign_name = campaign['name']

        self.logger.info(f"Optimizing bids for campaign: {campaign_name}")

        actions = []

        # Get all ad groups
        ad_groups = self.ads_manager.get_ad_groups(customer_id, campaign_id)

        for ad_group in ad_groups:
            ad_group_actions = self._optimize_ad_group_bids(
                customer_id,
                campaign,
                ad_group
            )
            actions.extend(ad_group_actions)

        self.logger.info(f"Completed bid optimization for {campaign_name}: {len(actions)} actions")
        return actions

    def _optimize_ad_group_bids(self, customer_id, campaign, ad_group):
        """Optimize bids for keywords in an ad group"""
        actions = []

        # Get keywords for this ad group
        keywords = self.ads_manager.get_keywords(customer_id, ad_group['id'])

        if not keywords:
            self.logger.debug(f"No keywords found for ad group: {ad_group['name']}")
            return actions

        # Analyze each keyword
        for keyword in keywords:
            # Skip if insufficient data
            if keyword['impressions'] < self.config.get('performance.min_impressions_for_analysis', 1000):
                continue

            # Get AI recommendation
            recommendation = self.gemini.analyze_bid_performance(
                keyword_data=keyword,
                ad_group_data=ad_group,
                campaign_data=campaign
            )

            if not recommendation or 'recommended_bid' not in recommendation:
                continue

            recommended_bid = recommendation['recommended_bid']
            current_bid = keyword.get('cpc_bid', 0)

            # Validate bid is within constraints
            recommended_bid = self._validate_bid(current_bid, recommended_bid)

            # Check if change is significant enough (at least 5% change)
            if abs(recommended_bid - current_bid) / current_bid < 0.05:
                continue

            # Calculate change percentage
            change_percent = ((recommended_bid - current_bid) / current_bid) * 100

            action = {
                'type': 'bid_adjustment',
                'campaign_id': campaign['id'],
                'campaign_name': campaign['name'],
                'ad_group_id': ad_group['id'],
                'ad_group_name': ad_group['name'],
                'keyword': keyword['text'],
                'old_bid': current_bid,
                'new_bid': recommended_bid,
                'change_percent': change_percent,
                'justification': recommendation['justification'],
                'confidence': recommendation.get('confidence', 'medium'),
                'key_factors': recommendation.get('key_factors', [])
            }

            # Apply bid change if auto_apply is enabled
            if self.auto_apply and not self.config.is_dry_run():
                # Note: This would need the criterion_id which we'd get from the API
                # For now, we'll just log the action
                self.logger.info(
                    f"Would update bid for '{keyword['text']}': "
                    f"${current_bid:.2f} → ${recommended_bid:.2f} ({change_percent:+.1f}%)"
                )
                action['applied'] = False  # Mark as not applied (need criterion_id)
                action['status'] = 'pending_implementation'
            else:
                action['applied'] = False
                action['status'] = 'awaiting_approval'

            actions.append(action)

        return actions

    def _validate_bid(self, current_bid, recommended_bid):
        """Validate and constrain bid to acceptable range"""
        # Ensure bid is within min/max bounds
        recommended_bid = max(self.min_bid, min(self.max_bid, recommended_bid))

        # Ensure change doesn't exceed max_bid_change_percent
        if current_bid > 0:
            max_increase = current_bid * (1 + self.max_bid_change_percent / 100)
            max_decrease = current_bid * (1 - self.max_bid_change_percent / 100)

            recommended_bid = max(max_decrease, min(max_increase, recommended_bid))

        return round(recommended_bid, 2)

    def apply_bid_change(self, customer_id, ad_group_id, criterion_id, new_bid):
        """Apply a bid change"""
        new_bid_micros = int(new_bid * 1_000_000)

        success = self.ads_manager.update_keyword_bid(
            customer_id=customer_id,
            ad_group_id=ad_group_id,
            criterion_id=criterion_id,
            new_bid_micros=new_bid_micros
        )

        return success

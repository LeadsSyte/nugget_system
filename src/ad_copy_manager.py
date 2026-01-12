"""
Ad copy management module - Generates and tests ad variations
"""

class AdCopyManager:
    """Handles ad copy generation and A/B testing"""

    def __init__(self, config, logger, gemini_brain, google_ads_manager):
        self.config = config
        self.logger = logger
        self.gemini = gemini_brain
        self.ads_manager = google_ads_manager

        self.auto_create = config.get('ad_copy.auto_create_ads', True)
        self.variations_per_ad_group = config.get('ad_copy.variations_per_ad_group', 3)
        self.min_days_before_pause = config.get('ad_copy.min_days_before_pause', 14)

    def manage_campaign_ads(self, customer_id, campaign):
        """
        Manage ads for a campaign - create new variations and evaluate existing ones

        Returns: list of actions taken
        """
        campaign_id = campaign['id']
        campaign_name = campaign['name']

        self.logger.info(f"Managing ads for campaign: {campaign_name}")

        actions = []

        # Get all ad groups
        ad_groups = self.ads_manager.get_ad_groups(customer_id, campaign_id)

        for ad_group in ad_groups:
            # Evaluate existing ads
            evaluation_actions = self._evaluate_ad_group_ads(
                customer_id,
                campaign,
                ad_group
            )
            actions.extend(evaluation_actions)

            # Generate new ad variations
            creation_actions = self._generate_ad_variations(
                customer_id,
                campaign,
                ad_group
            )
            actions.extend(creation_actions)

        self.logger.info(f"Completed ad management for {campaign_name}: {len(actions)} actions")
        return actions

    def _evaluate_ad_group_ads(self, customer_id, campaign, ad_group):
        """Evaluate existing ads and recommend pause/keep decisions"""
        actions = []

        # Get ads for this ad group
        ads = self.ads_manager.get_ads(customer_id, ad_group['id'])

        if not ads:
            return actions

        # Get AI evaluation
        min_impressions = self.config.get('performance.min_impressions_for_analysis', 1000)
        evaluation = self.gemini.evaluate_ad_performance(ads, min_impressions)

        # Process ads to pause
        for ad_to_pause in evaluation.get('ads_to_pause', []):
            action = {
                'type': 'pause_ad',
                'campaign_id': campaign['id'],
                'campaign_name': campaign['name'],
                'ad_group_id': ad_group['id'],
                'ad_group_name': ad_group['name'],
                'ad_id': ad_to_pause['ad_id'],
                'reason': ad_to_pause['reason'],
                'justification': evaluation.get('justification', ''),
                'status': 'awaiting_approval'
            }
            actions.append(action)

        # Log top performers for reference
        for top_performer in evaluation.get('top_performers', []):
            self.logger.info(
                f"Top performing ad in {ad_group['name']}: "
                f"Ad {top_performer['ad_id']} - {top_performer['reason']}"
            )

        return actions

    def _generate_ad_variations(self, customer_id, campaign, ad_group):
        """Generate new ad copy variations for testing"""
        actions = []

        # Get existing ads and keywords
        existing_ads = self.ads_manager.get_ads(customer_id, ad_group['id'])
        keywords = self.ads_manager.get_keywords(customer_id, ad_group['id'])

        # Check if we need more ad variations
        active_ads = [ad for ad in existing_ads if ad['status'] == 'ENABLED']

        if len(active_ads) >= self.variations_per_ad_group:
            self.logger.debug(
                f"Ad group '{ad_group['name']}' has sufficient ad variations ({len(active_ads)})"
            )
            return actions

        # Generate new ad copy
        new_ads = self.gemini.generate_ad_copy(
            campaign_data=campaign,
            ad_group_data=ad_group,
            existing_ads=existing_ads,
            keywords=keywords
        )

        if not new_ads or not new_ads.get('headlines'):
            return actions

        # Create action for new ad
        action = {
            'type': 'create_ad',
            'campaign_id': campaign['id'],
            'campaign_name': campaign['name'],
            'ad_group_id': ad_group['id'],
            'ad_group_name': ad_group['name'],
            'headlines': new_ads['headlines'],
            'descriptions': new_ads['descriptions'],
            'justification': new_ads.get('justification', ''),
            'testing_hypothesis': new_ads.get('testing_hypothesis', ''),
            'status': 'awaiting_approval'
        }

        actions.append(action)

        return actions

    def create_ad(self, customer_id, ad_group_id, headlines, descriptions):
        """Create a new responsive search ad"""
        success = self.ads_manager.create_responsive_search_ad(
            customer_id=customer_id,
            ad_group_id=ad_group_id,
            headlines=headlines,
            descriptions=descriptions
        )

        return success

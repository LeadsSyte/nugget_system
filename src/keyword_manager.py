"""
Keyword management module - Adds and optimizes keywords
"""

class KeywordManager:
    """Handles keyword research and management"""

    def __init__(self, config, logger, gemini_brain, google_ads_manager):
        self.config = config
        self.logger = logger
        self.gemini = gemini_brain
        self.ads_manager = google_ads_manager

        self.auto_add_keywords = config.get('keywords.auto_add_keywords', True)
        self.auto_add_negatives = config.get('keywords.auto_add_negative_keywords', True)
        self.max_keyword_cpc = config.get('keywords.max_keyword_cpc', 10.00)

    def manage_campaign_keywords(self, customer_id, campaign):
        """
        Manage keywords for a campaign - add new ones and identify negatives

        Returns: list of actions taken
        """
        campaign_id = campaign['id']
        campaign_name = campaign['name']

        self.logger.info(f"Managing keywords for campaign: {campaign_name}")

        actions = []

        # Get all ad groups
        ad_groups = self.ads_manager.get_ad_groups(customer_id, campaign_id)

        for ad_group in ad_groups:
            # Suggest new keywords
            keyword_actions = self._suggest_new_keywords(
                customer_id,
                campaign,
                ad_group
            )
            actions.extend(keyword_actions)

        # Identify negative keywords at campaign level
        negative_actions = self._identify_negative_keywords(
            customer_id,
            campaign
        )
        actions.extend(negative_actions)

        self.logger.info(f"Completed keyword management for {campaign_name}: {len(actions)} actions")
        return actions

    def _suggest_new_keywords(self, customer_id, campaign, ad_group):
        """Suggest new keywords to add to an ad group"""
        actions = []

        # Get existing keywords
        existing_keywords = self.ads_manager.get_keywords(customer_id, ad_group['id'])

        # Get AI suggestions
        suggestions = self.gemini.suggest_keywords(
            campaign_data=campaign,
            ad_group_data=ad_group,
            existing_keywords=existing_keywords
        )

        if not suggestions or not suggestions.get('keywords'):
            return actions

        # Process each suggested keyword
        for keyword_suggestion in suggestions.get('keywords', []):
            keyword_text = keyword_suggestion.get('text', '')
            match_type = keyword_suggestion.get('match_type', 'PHRASE')
            recommended_bid = keyword_suggestion.get('recommended_bid', 1.0)

            # Validate bid
            if recommended_bid > self.max_keyword_cpc:
                recommended_bid = self.max_keyword_cpc

            action = {
                'type': 'add_keyword',
                'campaign_id': campaign['id'],
                'campaign_name': campaign['name'],
                'ad_group_id': ad_group['id'],
                'ad_group_name': ad_group['name'],
                'keyword_text': keyword_text,
                'match_type': match_type,
                'recommended_bid': recommended_bid,
                'rationale': keyword_suggestion.get('rationale', ''),
                'justification': suggestions.get('justification', ''),
                'expected_impact': suggestions.get('expected_impact', ''),
                'status': 'awaiting_approval'
            }

            actions.append(action)

        return actions

    def _identify_negative_keywords(self, customer_id, campaign):
        """Identify keywords that should be added as negatives based on actual search terms data"""
        actions = []

        # Fetch actual search terms data from Google Ads
        search_terms_data = self.ads_manager.get_search_terms(customer_id, campaign['id'])

        if not search_terms_data:
            self.logger.debug(f"No search terms data available for campaign: {campaign['name']}")
            return actions

        # Filter to terms with clicks but no conversions (wasted spend)
        wasted_terms = [
            term for term in search_terms_data
            if term['clicks'] > 0 and term['conversions'] == 0 and term['cost'] > 0
        ]

        if not wasted_terms:
            self.logger.debug(f"No wasted search terms found for campaign: {campaign['name']}")
            return actions

        # Get AI analysis
        analysis = self.gemini.identify_negative_keywords(
            campaign_data=campaign,
            search_terms_data=search_terms_data,
            current_performance={
                'ctr': campaign.get('clicks', 0) / campaign.get('impressions', 1),
                'cost': campaign.get('cost', 0),
                'conversions': campaign.get('conversions', 0)
            }
        )

        if not analysis or not analysis.get('negative_keywords'):
            return actions

        # Process each negative keyword suggestion
        for negative in analysis.get('negative_keywords', []):
            action = {
                'type': 'add_negative_keyword',
                'campaign_id': campaign['id'],
                'campaign_name': campaign['name'],
                'keyword_text': negative.get('text', ''),
                'match_type': negative.get('match_type', 'PHRASE'),
                'reason': negative.get('reason', ''),
                'justification': analysis.get('justification', ''),
                'expected_savings': analysis.get('expected_savings', ''),
                'status': 'awaiting_approval'
            }

            actions.append(action)

        return actions

    def add_keyword(self, customer_id, ad_group_id, keyword_text, match_type, cpc_bid):
        """Add a new keyword to an ad group"""
        cpc_bid_micros = int(cpc_bid * 1_000_000)

        # Convert match_type string to enum
        match_type_enum = self._get_match_type_enum(match_type)

        success = self.ads_manager.add_keyword(
            customer_id=customer_id,
            ad_group_id=ad_group_id,
            keyword_text=keyword_text,
            match_type=match_type_enum,
            cpc_bid_micros=cpc_bid_micros
        )

        return success

    def add_negative_keyword(self, customer_id, campaign_id, keyword_text, match_type):
        """Add a negative keyword to a campaign"""
        match_type_enum = self._get_match_type_enum(match_type)

        success = self.ads_manager.add_negative_keyword(
            customer_id=customer_id,
            campaign_id=campaign_id,
            keyword_text=keyword_text,
            match_type=match_type_enum
        )

        return success

    def _get_match_type_enum(self, match_type):
        """Convert match type string to Google Ads enum"""
        # This would use the actual Google Ads enum
        # For now, return the string
        return match_type

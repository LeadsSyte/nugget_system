"""
Google Ads API client wrapper
"""

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import tempfile
import yaml
from pathlib import Path

class GoogleAdsManager:
    """Wrapper for Google Ads API operations"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.client = self._initialize_client()

    def _initialize_client(self):
        """Initialize Google Ads API client"""
        credentials = self.config.get_google_ads_credentials()

        # Create temporary google-ads.yaml file
        google_ads_config = {
            'developer_token': credentials['developer_token'],
            'client_id': credentials['client_id'],
            'client_secret': credentials['client_secret'],
            'refresh_token': credentials['refresh_token'],
            'login_customer_id': credentials['login_customer_id'],
            'use_proto_plus': True
        }

        # Write to temp file
        temp_config = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml')
        yaml.dump(google_ads_config, temp_config)
        temp_config.close()

        # Initialize client
        client = GoogleAdsClient.load_from_storage(temp_config.name)

        # Cleanup temp file
        Path(temp_config.name).unlink()

        self.logger.info("Google Ads API client initialized successfully")
        return client

    def get_campaigns(self, customer_id):
        """Fetch all active campaigns for a customer"""
        try:
            ga_service = self.client.get_service("GoogleAdsService")

            query = """
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.advertising_channel_type,
                    campaign_budget.amount_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.conversions,
                    metrics.conversions_value
                FROM campaign
                WHERE campaign.status = 'ENABLED'
                AND segments.date DURING LAST_30_DAYS
            """

            response = ga_service.search(customer_id=customer_id, query=query)
            campaigns = []

            for row in response:
                campaigns.append({
                    'id': row.campaign.id,
                    'name': row.campaign.name,
                    'status': row.campaign.status.name,
                    'type': row.campaign.advertising_channel_type.name,
                    'budget': row.campaign_budget.amount_micros / 1_000_000,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'cost': row.metrics.cost_micros / 1_000_000,
                    'conversions': row.metrics.conversions,
                    'conversion_value': row.metrics.conversions_value
                })

            self.logger.info(f"Retrieved {len(campaigns)} active campaigns")
            return campaigns

        except GoogleAdsException as ex:
            self.logger.error(f"Google Ads API error: {ex}")
            return []

    def get_ad_groups(self, customer_id, campaign_id):
        """Fetch ad groups for a campaign"""
        try:
            ga_service = self.client.get_service("GoogleAdsService")

            query = f"""
                SELECT
                    ad_group.id,
                    ad_group.name,
                    ad_group.status,
                    ad_group.cpc_bid_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.ctr,
                    metrics.average_cpc,
                    metrics.cost_micros,
                    metrics.conversions,
                    metrics.cost_per_conversion
                FROM ad_group
                WHERE campaign.id = {campaign_id}
                AND ad_group.status = 'ENABLED'
                AND segments.date DURING LAST_30_DAYS
            """

            response = ga_service.search(customer_id=customer_id, query=query)
            ad_groups = []

            for row in response:
                ad_groups.append({
                    'id': row.ad_group.id,
                    'name': row.ad_group.name,
                    'status': row.ad_group.status.name,
                    'cpc_bid': row.ad_group.cpc_bid_micros / 1_000_000 if row.ad_group.cpc_bid_micros else None,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'ctr': row.metrics.ctr,
                    'avg_cpc': row.metrics.average_cpc / 1_000_000 if row.metrics.average_cpc else 0,
                    'cost': row.metrics.cost_micros / 1_000_000,
                    'conversions': row.metrics.conversions,
                    'cost_per_conversion': row.metrics.cost_per_conversion / 1_000_000 if row.metrics.cost_per_conversion else None
                })

            return ad_groups

        except GoogleAdsException as ex:
            self.logger.error(f"Error fetching ad groups: {ex}")
            return []

    def get_ads(self, customer_id, ad_group_id):
        """Fetch ads for an ad group"""
        try:
            ga_service = self.client.get_service("GoogleAdsService")

            query = f"""
                SELECT
                    ad_group_ad.ad.id,
                    ad_group_ad.ad.type,
                    ad_group_ad.ad.responsive_search_ad.headlines,
                    ad_group_ad.ad.responsive_search_ad.descriptions,
                    ad_group_ad.status,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.ctr,
                    metrics.conversions,
                    metrics.cost_micros
                FROM ad_group_ad
                WHERE ad_group.id = {ad_group_id}
                AND segments.date DURING LAST_30_DAYS
            """

            response = ga_service.search(customer_id=customer_id, query=query)
            ads = []

            for row in response:
                ad_data = {
                    'id': row.ad_group_ad.ad.id,
                    'type': row.ad_group_ad.ad.type_.name,
                    'status': row.ad_group_ad.status.name,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'ctr': row.metrics.ctr,
                    'conversions': row.metrics.conversions,
                    'cost': row.metrics.cost_micros / 1_000_000
                }

                # Extract RSA content if available
                if row.ad_group_ad.ad.responsive_search_ad.headlines:
                    ad_data['headlines'] = [h.text for h in row.ad_group_ad.ad.responsive_search_ad.headlines]
                    ad_data['descriptions'] = [d.text for d in row.ad_group_ad.ad.responsive_search_ad.descriptions]

                ads.append(ad_data)

            return ads

        except GoogleAdsException as ex:
            self.logger.error(f"Error fetching ads: {ex}")
            return []

    def get_keywords(self, customer_id, ad_group_id):
        """Fetch keywords for an ad group"""
        try:
            ga_service = self.client.get_service("GoogleAdsService")

            query = f"""
                SELECT
                    ad_group_criterion.keyword.text,
                    ad_group_criterion.keyword.match_type,
                    ad_group_criterion.cpc_bid_micros,
                    ad_group_criterion.quality_info.quality_score,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.ctr,
                    metrics.average_cpc,
                    metrics.conversions,
                    metrics.cost_per_conversion
                FROM keyword_view
                WHERE ad_group.id = {ad_group_id}
                AND ad_group_criterion.status = 'ENABLED'
                AND segments.date DURING LAST_30_DAYS
            """

            response = ga_service.search(customer_id=customer_id, query=query)
            keywords = []

            for row in response:
                keywords.append({
                    'text': row.ad_group_criterion.keyword.text,
                    'match_type': row.ad_group_criterion.keyword.match_type.name,
                    'cpc_bid': row.ad_group_criterion.cpc_bid_micros / 1_000_000 if row.ad_group_criterion.cpc_bid_micros else None,
                    'quality_score': row.ad_group_criterion.quality_info.quality_score,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'ctr': row.metrics.ctr,
                    'avg_cpc': row.metrics.average_cpc / 1_000_000 if row.metrics.average_cpc else 0,
                    'conversions': row.metrics.conversions,
                    'cost_per_conversion': row.metrics.cost_per_conversion / 1_000_000 if row.metrics.cost_per_conversion else None
                })

            return keywords

        except GoogleAdsException as ex:
            self.logger.error(f"Error fetching keywords: {ex}")
            return []

    def update_keyword_bid(self, customer_id, ad_group_id, criterion_id, new_bid_micros):
        """Update keyword bid"""
        try:
            ad_group_criterion_service = self.client.get_service("AdGroupCriterionService")
            operation = self.client.get_type("AdGroupCriterionOperation")

            criterion = operation.update
            criterion.resource_name = ad_group_criterion_service.ad_group_criterion_path(
                customer_id, ad_group_id, criterion_id
            )
            criterion.cpc_bid_micros = new_bid_micros

            # Set update mask
            self.client.copy_from(
                operation.update_mask,
                protobuf_helpers.field_mask(None, criterion._pb)
            )

            response = ad_group_criterion_service.mutate_ad_group_criteria(
                customer_id=customer_id,
                operations=[operation]
            )

            return True

        except GoogleAdsException as ex:
            self.logger.error(f"Error updating keyword bid: {ex}")
            return False

    def create_responsive_search_ad(self, customer_id, ad_group_id, headlines, descriptions):
        """Create a new responsive search ad"""
        try:
            ad_group_ad_service = self.client.get_service("AdGroupAdService")
            operation = self.client.get_type("AdGroupAdOperation")

            ad_group_ad = operation.create
            ad_group_ad.ad_group = ad_group_ad_service.ad_group_path(customer_id, ad_group_id)
            ad_group_ad.status = self.client.enums.AdGroupAdStatusEnum.ENABLED

            # Create responsive search ad
            rsa = ad_group_ad.ad.responsive_search_ad

            # Add headlines (minimum 3, maximum 15)
            for headline in headlines[:15]:
                headline_asset = self.client.get_type("AdTextAsset")
                headline_asset.text = headline
                rsa.headlines.append(headline_asset)

            # Add descriptions (minimum 2, maximum 4)
            for description in descriptions[:4]:
                description_asset = self.client.get_type("AdTextAsset")
                description_asset.text = description
                rsa.descriptions.append(description_asset)

            # Set final URL (you'll need to determine this from the ad group or campaign)
            # ad_group_ad.ad.final_urls.append("https://example.com")

            response = ad_group_ad_service.mutate_ad_group_ads(
                customer_id=customer_id,
                operations=[operation]
            )

            return True

        except GoogleAdsException as ex:
            self.logger.error(f"Error creating ad: {ex}")
            return False

    def add_keyword(self, customer_id, ad_group_id, keyword_text, match_type, cpc_bid_micros):
        """Add a new keyword to an ad group"""
        try:
            ad_group_criterion_service = self.client.get_service("AdGroupCriterionService")
            operation = self.client.get_type("AdGroupCriterionOperation")

            criterion = operation.create
            criterion.ad_group = ad_group_criterion_service.ad_group_path(customer_id, ad_group_id)
            criterion.status = self.client.enums.AdGroupCriterionStatusEnum.ENABLED
            criterion.keyword.text = keyword_text
            criterion.keyword.match_type = match_type
            criterion.cpc_bid_micros = cpc_bid_micros

            response = ad_group_criterion_service.mutate_ad_group_criteria(
                customer_id=customer_id,
                operations=[operation]
            )

            return True

        except GoogleAdsException as ex:
            self.logger.error(f"Error adding keyword: {ex}")
            return False

    def get_search_terms(self, customer_id, campaign_id):
        """Fetch search terms report for negative keyword analysis"""
        try:
            ga_service = self.client.get_service("GoogleAdsService")

            query = f"""
                SELECT
                    search_term_view.search_term,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.cost_micros,
                    ad_group.id,
                    ad_group.name
                FROM search_term_view
                WHERE campaign.id = {campaign_id}
                AND segments.date DURING LAST_30_DAYS
                AND metrics.impressions > 0
            """

            response = ga_service.search(customer_id=customer_id, query=query)
            search_terms = []

            for row in response:
                search_terms.append({
                    'search_term': row.search_term_view.search_term,
                    'impressions': row.metrics.impressions,
                    'clicks': row.metrics.clicks,
                    'conversions': row.metrics.conversions,
                    'cost': row.metrics.cost_micros / 1_000_000,
                    'ad_group_id': row.ad_group.id,
                    'ad_group_name': row.ad_group.name
                })

            return search_terms

        except GoogleAdsException as ex:
            self.logger.error(f"Error fetching search terms: {ex}")
            return []

    def add_negative_keyword(self, customer_id, campaign_id, keyword_text, match_type):
        """Add a negative keyword to a campaign"""
        try:
            campaign_criterion_service = self.client.get_service("CampaignCriterionService")
            operation = self.client.get_type("CampaignCriterionOperation")

            criterion = operation.create
            criterion.campaign = campaign_criterion_service.campaign_path(customer_id, campaign_id)
            criterion.negative = True
            criterion.keyword.text = keyword_text
            criterion.keyword.match_type = match_type

            response = campaign_criterion_service.mutate_campaign_criteria(
                customer_id=customer_id,
                operations=[operation]
            )

            return True

        except GoogleAdsException as ex:
            self.logger.error(f"Error adding negative keyword: {ex}")
            return False

#!/usr/bin/env python3
"""
Test script to verify keyword fetching from Google Ads API
"""

from src.config_loader import Config
from src.logger import AgentLogger
from src.google_ads_client import GoogleAdsManager

config = Config()
logger = AgentLogger(config)
google_ads = GoogleAdsManager(config, logger)

customer_id = config.get_google_ads_credentials()['login_customer_id']

# Get campaigns
campaigns = google_ads.get_campaigns(customer_id)
print(f"\n✓ Found {len(campaigns)} campaigns")

for campaign in campaigns:
    print(f"\n📊 Campaign: {campaign['name']}")
    print(f"   ID: {campaign['id']}")

    # Get ad groups
    ad_groups = google_ads.get_ad_groups(customer_id, campaign['id'])
    print(f"   ✓ Found {len(ad_groups)} ad groups")

    for ad_group in ad_groups[:2]:  # First 2 ad groups
        print(f"\n   📁 Ad Group: {ad_group['name']}")

        # Get keywords
        keywords = google_ads.get_keywords(customer_id, ad_group['id'])
        print(f"      ✓ Found {len(keywords)} keywords")

        if keywords:
            for kw in keywords[:3]:  # First 3 keywords
                print(f"         - {kw['text']}: {kw['impressions']} impressions, {kw['conversions']} conversions")
        else:
            print(f"         ⚠️ NO KEYWORDS RETURNED!")

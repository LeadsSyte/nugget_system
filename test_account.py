#!/usr/bin/env python3
"""Quick test to verify which Google Ads account will be used"""

from src.config_loader import Config
from src.logger import AgentLogger
from src.google_ads_client import GoogleAdsManager

print("=" * 60)
print("ACCOUNT VERIFICATION TEST")
print("=" * 60)

config = Config()
credentials = config.get_google_ads_credentials()

print(f"\nMCC Login ID: {credentials['login_customer_id']}")
print(f"Account to Optimize: {credentials['customer_id']}")

if credentials['customer_id'] == credentials['login_customer_id']:
    print("\n⚠️  WARNING: Using MCC account (no separate customer_id set)")
else:
    print(f"\n✓ Using separate account: {credentials['customer_id']}")

print("\nAttempting to fetch campaigns...")

try:
    logger = AgentLogger(config)
    google_ads = GoogleAdsManager(config, logger)
    campaigns = google_ads.get_campaigns(credentials['customer_id'])

    print(f"\n✓ Successfully connected!")
    print(f"✓ Found {len(campaigns)} active campaigns:")

    for campaign in campaigns[:5]:  # Show first 5
        print(f"   - {campaign['name']}")

    if len(campaigns) > 5:
        print(f"   ... and {len(campaigns) - 5} more")

except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 60)

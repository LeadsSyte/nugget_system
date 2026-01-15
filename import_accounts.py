#!/usr/bin/env python3
"""
Import Google Ads accounts from MCC
Fetches all accounts accessible in your MCC and creates config files
"""

import os
import sys
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.config_loader import Config

def get_accessible_accounts(client, mcc_id):
    """Fetch all accessible customer accounts"""
    ga_service = client.get_service("GoogleAdsService")

    query = """
        SELECT
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code,
            customer_client.time_zone,
            customer_client.manager,
            customer_client.status
        FROM customer_client
        WHERE customer_client.status = 'ENABLED'
        AND customer_client.manager = FALSE
    """

    try:
        response = ga_service.search(customer_id=str(mcc_id), query=query)
        accounts = []

        for row in response:
            accounts.append({
                'id': row.customer_client.id,
                'name': row.customer_client.descriptive_name,
                'currency': row.customer_client.currency_code,
                'timezone': row.customer_client.time_zone,
                'formatted_id': f"{str(row.customer_client.id)[:3]}-{str(row.customer_client.id)[3:6]}-{str(row.customer_client.id)[6:]}"
            })

        return sorted(accounts, key=lambda x: x['name'])

    except GoogleAdsException as ex:
        print(f"❌ Error fetching accounts: {ex}")
        return []

def create_account_config(account, base_env_content, mcc_id):
    """Create .env file for an account"""
    account_id = str(account['id'])
    env_filename = f".env.client_{account_id}"

    # Create content
    content = base_env_content.replace(
        'GOOGLE_ADS_CUSTOMER_ID=PLACEHOLDER',
        f'GOOGLE_ADS_CUSTOMER_ID={account_id}'
    )

    # Add account name
    content += f"\nACCOUNT_NAME={account['name']}\n"

    # Write file
    with open(env_filename, 'w') as f:
        f.write(content)

    print(f"  ✓ Created: {env_filename}")
    return env_filename

def main():
    print("=" * 80)
    print("🔍 GOOGLE ADS ACCOUNT IMPORTER")
    print("=" * 80)
    print()

    # Check if we have existing config
    existing_env_files = list(Path('.').glob('.env.client_*'))

    if not existing_env_files:
        print("❌ No existing .env.client_* files found!")
        print("   Please create at least one account config first.")
        print()
        print("   Run: copy .env .env.client_YOURACCOUNTID")
        sys.exit(1)

    # Use the first one as template
    template_file = existing_env_files[0]
    print(f"📄 Using template: {template_file}")
    print()

    # Read template
    with open(template_file, 'r') as f:
        template_content = f.read()

    # Extract credentials
    mcc_id = None
    for line in template_content.split('\n'):
        if line.startswith('GOOGLE_ADS_LOGIN_CUSTOMER_ID='):
            mcc_id = line.split('=')[1].strip()
            break

    if not mcc_id:
        print("❌ Could not find GOOGLE_ADS_LOGIN_CUSTOMER_ID in template!")
        sys.exit(1)

    print(f"🏢 MCC Account: {mcc_id}")
    print()

    # Create base template (remove account-specific fields)
    base_content = []
    for line in template_content.split('\n'):
        if line.startswith('GOOGLE_ADS_CUSTOMER_ID='):
            base_content.append('GOOGLE_ADS_CUSTOMER_ID=PLACEHOLDER')
        elif line.startswith('ACCOUNT_NAME='):
            continue  # Skip, we'll add it per account
        else:
            base_content.append(line)

    base_template = '\n'.join(base_content)

    # Initialize Google Ads client
    print("🔌 Connecting to Google Ads API...")
    try:
        # Create a temporary config to get credentials
        temp_config = Config()
        credentials = temp_config.get_google_ads_credentials()

        # Build client config
        google_ads_config = {
            'developer_token': credentials['developer_token'],
            'client_id': credentials['client_id'],
            'client_secret': credentials['client_secret'],
            'refresh_token': credentials['refresh_token'],
            'login_customer_id': credentials['login_customer_id'],
            'use_proto_plus': True
        }

        client = GoogleAdsClient.load_from_dict(google_ads_config)
        print("✓ Connected!")
        print()

    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        sys.exit(1)

    # Fetch accounts
    print("📥 Fetching accessible accounts from MCC...")
    accounts = get_accessible_accounts(client, mcc_id.replace('-', ''))

    if not accounts:
        print("❌ No accounts found!")
        sys.exit(1)

    print(f"✓ Found {len(accounts)} accounts!")
    print()

    # Check which accounts are already configured
    configured_ids = set()
    for env_file in existing_env_files:
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_ADS_CUSTOMER_ID='):
                    customer_id = line.split('=')[1].strip()
                    configured_ids.add(customer_id)

    # Display accounts
    print("=" * 80)
    print("AVAILABLE ACCOUNTS")
    print("=" * 80)
    print()

    for i, account in enumerate(accounts, 1):
        status = "✓ CONFIGURED" if str(account['id']) in configured_ids else "○ Not configured"
        print(f"{i:2d}. [{status}] {account['formatted_id']} - {account['name']}")
        print(f"    Currency: {account['currency']} | Timezone: {account['timezone']}")
        print()

    print("=" * 80)
    print()

    # Ask user what to do
    print("What would you like to do?")
    print("  1. Import ALL accounts")
    print("  2. Select specific accounts to import")
    print("  3. Import only unconfigured accounts")
    print("  0. Cancel")
    print()

    choice = input("Enter choice (0-3): ").strip()

    accounts_to_import = []

    if choice == '1':
        accounts_to_import = accounts

    elif choice == '2':
        print()
        print("Enter account numbers to import (comma-separated, e.g., 1,3,5):")
        selection = input("> ").strip()

        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            accounts_to_import = [accounts[i] for i in indices if 0 <= i < len(accounts)]
        except (ValueError, IndexError):
            print("❌ Invalid selection!")
            sys.exit(1)

    elif choice == '3':
        accounts_to_import = [a for a in accounts if str(a['id']) not in configured_ids]

    else:
        print("Cancelled.")
        sys.exit(0)

    if not accounts_to_import:
        print("No accounts to import!")
        sys.exit(0)

    # Confirm
    print()
    print(f"About to import {len(accounts_to_import)} account(s):")
    for account in accounts_to_import:
        print(f"  • {account['formatted_id']} - {account['name']}")
    print()

    confirm = input("Continue? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Cancelled.")
        sys.exit(0)

    # Import accounts
    print()
    print("=" * 80)
    print("IMPORTING ACCOUNTS")
    print("=" * 80)
    print()

    created_files = []
    for account in accounts_to_import:
        print(f"📝 Configuring: {account['name']} ({account['formatted_id']})")

        # Skip if already exists
        if str(account['id']) in configured_ids:
            print(f"  ⊘ Already configured, skipping")
            continue

        env_file = create_account_config(account, base_template, mcc_id)
        created_files.append(env_file)

    print()
    print("=" * 80)
    print("✅ IMPORT COMPLETE")
    print("=" * 80)
    print()
    print(f"Imported {len(created_files)} new account(s):")
    for filename in created_files:
        print(f"  • {filename}")
    print()
    print("🚀 You can now use these accounts in the dashboard!")
    print("   Run: start_dashboard.bat")
    print()

if __name__ == "__main__":
    main()

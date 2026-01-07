"""
Configuration loader for the Google Ads Agent
"""

import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

class Config:
    """Configuration manager for the agent"""

    def __init__(self, config_path="config.yaml"):
        # Load environment variables
        load_dotenv()

        # Load YAML configuration
        self.config_path = Path(config_path)
        with open(self.config_path, 'r') as f:
            self.config = yaml.safe_load(f)

        # Load API credentials from environment
        self.google_ads_config = {
            'developer_token': os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN'),
            'client_id': os.getenv('GOOGLE_ADS_CLIENT_ID'),
            'client_secret': os.getenv('GOOGLE_ADS_CLIENT_SECRET'),
            'refresh_token': os.getenv('GOOGLE_ADS_REFRESH_TOKEN'),
            'login_customer_id': os.getenv('GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
        }

        self.gemini_api_key = os.getenv('GEMINI_API_KEY')

        # Validate required credentials
        self._validate_credentials()

    def _validate_credentials(self):
        """Validate that all required credentials are present"""
        missing = []

        for key, value in self.google_ads_config.items():
            if not value:
                missing.append(f'GOOGLE_ADS_{key.upper()}')

        if not self.gemini_api_key:
            missing.append('GEMINI_API_KEY')

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Please copy .env.example to .env and fill in your credentials."
            )

    def get(self, key, default=None):
        """Get a configuration value by dot notation (e.g., 'gemini.model')"""
        keys = key.split('.')
        value = self.config

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default

        return value if value is not None else default

    def get_gemini_config(self):
        """Get Gemini configuration"""
        return self.config.get('gemini', {})

    def get_google_ads_credentials(self):
        """Get Google Ads API credentials"""
        return self.google_ads_config

    def is_dry_run(self):
        """Check if running in dry run mode"""
        return self.get('safety.dry_run', False)

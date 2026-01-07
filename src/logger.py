"""
Logging setup for the Google Ads Agent with decision tracking
"""

import logging
import colorlog
from pathlib import Path
from datetime import datetime
import json

class AgentLogger:
    """Enhanced logger with decision tracking"""

    def __init__(self, config):
        self.config = config
        self.log_dir = Path(config.get('logging.log_dir', 'logs'))
        self.decision_dir = Path(config.get('logging.decision_log_dir', 'decisions'))

        # Create directories
        self.log_dir.mkdir(exist_ok=True)
        self.decision_dir.mkdir(exist_ok=True)

        # Setup standard logger
        self.logger = self._setup_logger()

        # Decision log file for today
        self.decision_log_path = self.decision_dir / f"decisions_{datetime.now().strftime('%Y%m%d')}.jsonl"

    def _setup_logger(self):
        """Setup colored console and file logging"""
        logger = logging.getLogger('google_ads_agent')
        logger.setLevel(self.config.get('logging.level', 'INFO'))

        # Remove existing handlers
        logger.handlers = []

        # Console handler with colors
        console_handler = colorlog.StreamHandler()
        console_handler.setFormatter(colorlog.ColoredFormatter(
            '%(log_color)s%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        ))
        logger.addHandler(console_handler)

        # File handler
        log_file = self.log_dir / f"agent_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
        logger.addHandler(file_handler)

        return logger

    def log_decision(self, action_type, campaign_id, campaign_name, decision_data, justification):
        """
        Log AI decisions with justifications for audit trail

        Args:
            action_type: Type of action (bid_adjustment, ad_created, keyword_added, etc.)
            campaign_id: Campaign ID
            campaign_name: Campaign name
            decision_data: Dict with decision details (before/after values, etc.)
            justification: AI's reasoning for the decision
        """
        decision_entry = {
            'timestamp': datetime.now().isoformat(),
            'action_type': action_type,
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'decision_data': decision_data,
            'justification': justification
        }

        # Write to JSONL file (one JSON object per line)
        with open(self.decision_log_path, 'a') as f:
            f.write(json.dumps(decision_entry) + '\n')

        # Also log to standard logger
        self.logger.info(
            f"[{action_type}] Campaign: {campaign_name} | "
            f"Decision: {json.dumps(decision_data, indent=2)} | "
            f"Justification: {justification}"
        )

    def info(self, message):
        """Log info message"""
        self.logger.info(message)

    def warning(self, message):
        """Log warning message"""
        self.logger.warning(message)

    def error(self, message):
        """Log error message"""
        self.logger.error(message)

    def debug(self, message):
        """Log debug message"""
        self.logger.debug(message)

    def critical(self, message):
        """Log critical message"""
        self.logger.critical(message)

"""
Email notification system
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailNotifier:
    """Sends email notifications for agent actions"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger

        self.notification_email = config.config.get('notification_email')
        self.enabled = self.notification_email is not None

        if not self.enabled:
            self.logger.warning("Email notifications disabled - no notification email configured")

    def send_daily_summary(self, performance_summary, actions_summary, approval_file=None):
        """
        Send daily summary email

        Args:
            performance_summary: Performance analysis text
            actions_summary: Summary of actions taken
            approval_file: Path to approval file if actions require approval
        """
        if not self.enabled:
            self.logger.info("Email notifications disabled, skipping email")
            return

        subject = f"Google Ads Agent Daily Report - {datetime.now().strftime('%Y-%m-%d')}"

        body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; }}
        .header {{ background-color: #4285f4; color: white; padding: 20px; }}
        .section {{ margin: 20px 0; padding: 15px; background-color: #f5f5f5; }}
        .metric {{ font-size: 18px; font-weight: bold; color: #1a73e8; }}
        .action {{ margin: 10px 0; padding: 10px; border-left: 4px solid #34a853; }}
        .warning {{ border-left-color: #fbbc04; }}
        .critical {{ border-left-color: #ea4335; }}
        pre {{ background-color: #f5f5f5; padding: 10px; overflow-x: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Google Ads Agent Daily Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="section">
        <h2>📊 Performance Summary</h2>
        <pre>{performance_summary}</pre>
    </div>

    <div class="section">
        <h2>🤖 Agent Actions</h2>
        <p>{actions_summary}</p>
    </div>
"""

        if approval_file:
            body += f"""
    <div class="section warning">
        <h2>⚠️ Actions Requiring Approval</h2>
        <p>The agent has identified optimizations that require your approval.</p>
        <p><strong>Approval File:</strong> {approval_file}</p>
        <p>Review the approval file and run the approval script to implement changes.</p>
    </div>
"""

        body += """
    <div class="section">
        <h2>ℹ️ Next Steps</h2>
        <ul>
            <li>Review the performance metrics</li>
            <li>Check the decision logs for AI justifications</li>
            <li>Approve or reject pending actions</li>
        </ul>
    </div>
</body>
</html>
"""

        self._send_email(subject, body)

    def send_error_notification(self, error_message):
        """Send email notification for errors"""
        if not self.enabled:
            return

        subject = f"⚠️ Google Ads Agent Error - {datetime.now().strftime('%Y-%m-%d')}"

        body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="background-color: #ea4335; color: white; padding: 20px;">
        <h1>Google Ads Agent Error</h1>
        <p>An error occurred during the agent execution</p>
    </div>

    <div style="margin: 20px; padding: 15px; background-color: #f5f5f5;">
        <h2>Error Details</h2>
        <pre>{error_message}</pre>
    </div>

    <div style="margin: 20px;">
        <p>Please check the agent logs for more details.</p>
    </div>
</body>
</html>
"""

        self._send_email(subject, body)

    def _send_email(self, subject, html_body):
        """Send an email using SMTP (configured for Gmail)"""
        try:
            # Note: This is a simplified version
            # In production, you'd want to configure SMTP settings in config
            # For now, just log that we would send an email

            self.logger.info(f"Would send email to {self.notification_email}")
            self.logger.info(f"Subject: {subject}")
            self.logger.debug(f"Body: {html_body}")

            # Actual SMTP implementation would go here:
            # msg = MIMEMultipart('alternative')
            # msg['Subject'] = subject
            # msg['From'] = 'your-email@gmail.com'
            # msg['To'] = self.notification_email
            #
            # msg.attach(MIMEText(html_body, 'html'))
            #
            # with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            #     server.login('your-email@gmail.com', 'app-password')
            #     server.send_message(msg)

            self.logger.info(f"Email notification prepared successfully")

        except Exception as e:
            self.logger.error(f"Failed to send email notification: {e}")

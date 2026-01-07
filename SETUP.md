# 📘 Google Ads Agent - Complete Setup Guide

This guide will walk you through setting up the Google Ads Agent from scratch, even if you're not a programmer.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Python](#installing-python)
3. [Getting Google Ads API Access](#getting-google-ads-api-access)
4. [Getting Gemini API Key](#getting-gemini-api-key)
5. [Configuring the Agent](#configuring-the-agent)
6. [First Run](#first-run)
7. [Setting Up Daily Automation](#setting-up-daily-automation)
8. [Email Notifications](#email-notifications)

---

## Prerequisites

Before starting, make sure you have:

- ✅ A Google Ads account with active campaigns
- ✅ Admin access to your Google Ads account
- ✅ A Google Cloud account (free to create)
- ✅ Gemini API key (you mentioned you have this)
- ✅ A computer with internet access

---

## Installing Python

### Windows

1. Download Python from [python.org](https://www.python.org/downloads/)
2. Run the installer
3. **IMPORTANT**: Check "Add Python to PATH" during installation
4. Verify installation:
   ```cmd
   python --version
   ```

### Mac

1. Install Homebrew (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Python:
   ```bash
   brew install python
   ```

3. Verify installation:
   ```bash
   python3 --version
   ```

### Linux

```bash
sudo apt update
sudo apt install python3 python3-pip
python3 --version
```

---

## Getting Google Ads API Access

This is the most important part. Follow these steps carefully:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Create Project" (top navigation bar)
4. Name it something like "GoogleAdsAgent"
5. Click "Create"

### Step 2: Enable Google Ads API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google Ads API"
3. Click on it and press "Enable"
4. Wait for it to enable (takes a few seconds)

### Step 3: Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: "Google Ads Agent"
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Add your email
   - Click "Save and Continue"

4. Back to creating OAuth client ID:
   - Application type: **Desktop app**
   - Name: "Google Ads Agent"
   - Click "Create"

5. **SAVE THESE CREDENTIALS:**
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-xxxxx`)

### Step 4: Get Refresh Token

This is the tricky part. We need to generate a refresh token:

1. Download the OAuth2 credential file (JSON) you just created
2. Use Google's authentication script:

```bash
# Install the Google Ads library first
pip install google-ads

# Run the authentication helper
python -c "from google.ads.googleads import oauth2
import google_auth_oauthlib.flow

flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
    'path/to/your/client_secret.json',
    scopes=['https://www.googleapis.com/auth/adwords'])

credentials = flow.run_local_server(port=8080)
print('Refresh token:', credentials.refresh_token)"
```

Replace `path/to/your/client_secret.json` with the actual path to your downloaded JSON file.

3. A browser window will open
4. Sign in with your Google Ads account
5. Grant permissions
6. **SAVE THE REFRESH TOKEN** that's printed in the terminal

**Alternative Method (Easier):**

Use Google's OAuth2 Playground:

1. Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (top right)
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In "Step 1", find "Google Ads API v17" and select `https://www.googleapis.com/auth/adwords`
6. Click "Authorize APIs"
7. Sign in and grant permissions
8. Click "Exchange authorization code for tokens"
9. **SAVE THE REFRESH TOKEN** from the response

### Step 5: Get Developer Token

1. Go to [Google Ads](https://ads.google.com/)
2. Click Tools & Settings (wrench icon)
3. Under "Setup", click "API Center"
4. Apply for a developer token
5. Fill out the form:
   - Describe your use: "Automated campaign optimization using AI"
   - Wait for approval (usually 24-48 hours)

**IMPORTANT:** You can use a **test developer token** immediately while waiting for approval:
- Test token format: Usually starts with underscore or is provided in API Center
- Test mode only works with test accounts

### Step 6: Get Customer ID

1. In Google Ads, click your profile icon (top right)
2. Look for "Customer ID" (format: `123-456-7890`)
3. Remove the dashes: `1234567890`
4. **SAVE THIS** - this is your Login Customer ID

---

## Getting Gemini API Key

Since you already have a Gemini API key, skip to the next section. If you need to get one:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. **SAVE YOUR API KEY**

---

## Configuring the Agent

### Step 1: Clone or Download the Project

If you have the code:

```bash
cd nugget_system
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your favorite text editor:
   ```bash
   nano .env
   # or
   vim .env
   # or use a text editor like Notepad, TextEdit, etc.
   ```

3. Fill in your credentials:
   ```bash
   # Google Ads API Credentials
   GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
   GOOGLE_ADS_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
   GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890

   # Gemini API
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: Notification settings
   NOTIFICATION_EMAIL=your_email@example.com
   ```

4. Save and close the file

### Step 4: Verify Configuration

Run a quick test:

```bash
python -c "from src.config_loader import Config; c = Config(); print('✓ Configuration loaded successfully!')"
```

If you see "Configuration loaded successfully", you're good to go!

---

## First Run

### Test Run (Safe Mode)

First, let's run in dry-run mode (no changes will be made):

1. Edit `config.yaml`:
   ```yaml
   safety:
     dry_run: true  # Set to true for testing
   ```

2. Run the agent:
   ```bash
   python run_agent.py
   ```

3. Watch the output:
   - It will fetch your campaigns
   - Analyze performance
   - Generate recommendations
   - But NOT apply any changes

4. Check the logs:
   ```bash
   # View today's log
   cat logs/agent_$(date +%Y%m%d).log

   # View AI decisions
   cat decisions/decisions_$(date +%Y%m%d).jsonl
   ```

### Real Run (Approval Mode)

Once you're comfortable:

1. Edit `config.yaml`:
   ```yaml
   approval:
     enabled: true  # Require approval (recommended)

   safety:
     dry_run: false  # Actually make changes
   ```

2. Run the agent:
   ```bash
   python run_agent.py
   ```

3. Review the approval file:
   ```bash
   # Find the latest approval file
   ls -lt approvals/

   # View the summary
   cat approvals/pending_actions_XXXXXX.txt
   ```

4. Approve or reject actions:
   ```bash
   python approve_actions.py approvals/pending_actions_XXXXXX.json
   ```

5. Review each action and type `y` (approve), `n` (reject), or `q` (quit)

---

## Setting Up Daily Automation

### Linux/Mac (Using Cron)

1. Open crontab:
   ```bash
   crontab -e
   ```

2. Add this line (runs daily at 2 AM):
   ```bash
   0 2 * * * cd /path/to/nugget_system && /usr/bin/python3 run_agent.py >> /path/to/nugget_system/logs/cron.log 2>&1
   ```

3. Save and exit

### Windows (Using Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name: "Google Ads Agent"
4. Trigger: Daily
5. Time: 2:00 AM
6. Action: Start a program
   - Program: `C:\Path\To\Python\python.exe`
   - Arguments: `run_agent.py`
   - Start in: `C:\Path\To\nugget_system`
7. Finish

### Verifying Automation

After setting up, verify it runs:

```bash
# Check logs next day
cat logs/agent_$(date +%Y%m%d).log
```

---

## Email Notifications

### Using Gmail (Recommended)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to [Google Account](https://myaccount.google.com/)
   - Security > 2-Step Verification
   - App passwords
   - Select app: "Mail"
   - Select device: "Other" (name it "Google Ads Agent")
   - Click "Generate"
   - **SAVE THE PASSWORD**

3. Update the email notifier code (or we can configure SMTP settings in config)

For now, the email notifier logs what emails it would send. To enable actual sending, you'd need to configure SMTP settings.

---

## Troubleshooting

### "Missing required environment variables"

**Problem:** `.env` file not found or incomplete

**Solution:**
1. Check `.env` exists: `ls -la .env`
2. Verify all fields are filled
3. No spaces around `=` signs
4. No quotes unless necessary

### "Invalid credentials"

**Problem:** Google Ads API credentials are wrong or expired

**Solution:**
1. Regenerate refresh token
2. Check developer token status
3. Verify customer ID format (no dashes)

### "No active campaigns found"

**Problem:** Can't access campaigns

**Solution:**
1. Verify customer ID is correct
2. Check you have active campaigns
3. Ensure API access is enabled for the account

### "Gemini API error"

**Problem:** Gemini API key is invalid

**Solution:**
1. Verify API key is correct
2. Check quotas in [Google AI Studio](https://makersuite.google.com/)
3. Ensure billing is enabled if required

### Agent makes weird recommendations

**Problem:** AI is hallucinating or making bad decisions

**Solution:**
1. Check `decisions/` logs for justifications
2. Review the performance data being sent to Gemini
3. Adjust prompts in `src/gemini_brain.py` if needed
4. Use approval mode to catch bad decisions

---

## Next Steps

After successful setup:

1. **Run daily for a week in approval mode**
   - Review all recommendations
   - Build confidence in the AI decisions

2. **Monitor performance**
   - Check daily emails
   - Review decision logs
   - Compare campaign performance

3. **Tune configuration**
   - Adjust bid limits in `config.yaml`
   - Modify AI temperature for creativity
   - Set campaign-specific rules

4. **Go autonomous (optional)**
   - Once comfortable, set `approval.enabled: false`
   - Agent runs fully autonomously
   - Still logs all decisions for review

---

## Getting Help

If you get stuck:

1. **Check the logs**: Most errors are explained in `logs/`
2. **Read error messages**: They usually point to the issue
3. **Verify credentials**: 90% of issues are authentication-related
4. **Test components**: Run individual modules to isolate problems

---

## Security Best Practices

- ✅ Never commit `.env` to version control
- ✅ Keep API keys secret
- ✅ Use approval mode initially
- ✅ Monitor logs regularly
- ✅ Set conservative bid limits
- ✅ Review AI justifications weekly

---

**Congratulations! Your Google Ads Agent is ready to optimize your campaigns. 🎉**

Start in approval mode, build confidence, and then let it run autonomously!

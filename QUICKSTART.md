# ⚡ Quick Start Guide

Get your Google Ads Agent running in 5 minutes!

## Prerequisites Check

- [ ] Python 3.8+ installed
- [ ] Google Ads account with campaigns
- [ ] Gemini API key
- [ ] Google Ads API credentials (see SETUP.md if you don't have these yet)

## 1. Install

```bash
# Install dependencies
pip install -r requirements.txt
```

## 2. Configure

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

Fill in:
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GEMINI_API_KEY`

## 3. Test Run (Safe)

```bash
# First, enable dry-run mode in config.yaml
# Change: dry_run: true

python run_agent.py
```

This will:
- ✅ Connect to Google Ads
- ✅ Analyze campaigns
- ✅ Generate AI recommendations
- ❌ NOT make any changes

## 4. Review Output

Check the generated files:

```bash
# View logs
cat logs/agent_*.log

# View AI decisions
cat decisions/decisions_*.jsonl

# View approval summary (if generated)
cat approvals/pending_actions_*.txt
```

## 5. First Real Run

Once comfortable:

```bash
# Edit config.yaml
# Change: dry_run: false
# Ensure: approval.enabled: true

# Run the agent
python run_agent.py

# Review and approve actions
python approve_actions.py approvals/pending_actions_*.json
```

## Daily Workflow

1. **Agent runs** (manually or via cron)
2. **Review email** with performance summary
3. **Approve actions** via approval script
4. **Monitor results** in Google Ads

## Go Autonomous

When ready for hands-free operation:

```yaml
# config.yaml
approval:
  enabled: false  # Disable approval requirement
```

The agent will now run fully autonomously!

---

**Need Help?**
- See [SETUP.md](SETUP.md) for detailed setup
- See [README.md](README.md) for complete documentation
- Check `logs/` for error messages

**Ready to optimize! 🚀**

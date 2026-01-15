# Google Ads Lead Generation Optimizer - n8n Workflow

A complete n8n workflow that automatically analyzes Google Ads performance data using Claude AI and provides actionable optimization recommendations for lead generation campaigns.

## Features

- **Multi-Account Management**: Process multiple Google Ads accounts from a single configuration sheet
- **Comprehensive Data Analysis**: Analyzes campaigns, keywords, ads, and search terms
- **AI-Powered Recommendations**: Uses Claude Sonnet 4 to identify optimization opportunities
- **Automated Change Management**: Applies high-confidence changes automatically (with approval)
- **Email Reporting**: Sends detailed reports to stakeholders
- **Change Logging**: Tracks all modifications in a Google Sheet audit log

## Workflow Steps

1. **Manual Trigger** - Start the workflow on-demand
2. **Read Client Config** - Load account configurations from Google Sheets
3. **Loop Through Clients** - Process each account individually
4. **Fetch Google Ads Data** - Retrieve 7-day performance data via Google Ads API
5. **Claude AI Analysis** - Analyze data and generate recommendations
6. **Email Report** - Send findings to mike@syte.co.za
7. **Wait for Approval** - Pause for manual review (webhook approval coming soon)
8. **Apply Changes** - Execute approved optimizations via Google Ads API
9. **Log Changes** - Record all modifications to audit sheet

## Prerequisites

### Required Accounts & Access

1. **n8n Instance** (v1.0+ recommended)
2. **Google Ads Account** with API access
3. **Google Cloud Project** with Google Ads API enabled
4. **Google Sheets** for configuration and logging
5. **Claude API Key** (Anthropic)
6. **SMTP Email Account** for sending reports

### Google Ads API Setup

1. Go to [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/overview)
2. Create a developer token
3. Set up OAuth 2.0 credentials
4. Enable Google Ads API in Google Cloud Console

### Google Sheets Setup

#### Create Configuration Sheet

Create a Google Sheet with the following structure:

**Sheet Name:** `Client Config`

| Account ID | Account Name | Target CPL | Weekly Budget | Campaign IDs |
|------------|--------------|------------|---------------|--------------|
| 123-456-7890 | Client A | 25.00 | 1000 | 12345,67890,11111 |
| 098-765-4321 | Client B | 35.00 | 1500 | 22222,33333 |

**Columns:**
- `Account ID`: Google Ads customer ID (format: 123-456-7890)
- `Account Name`: Friendly name for the account
- `Target CPL`: Target cost per lead in dollars
- `Weekly Budget`: Weekly budget in dollars
- `Campaign IDs`: Comma-separated list of campaign IDs to monitor

#### Create Change Log Sheet

**Sheet Name:** `Change Log`

Create a sheet with these column headers:

| Timestamp | Account Name | Change Type | Entity | Reason | Expected Impact | Result | Details |
|-----------|--------------|-------------|--------|--------|-----------------|--------|---------|

This sheet will auto-populate as changes are made.

## Installation

### 1. Import Workflow to n8n

1. Open your n8n instance
2. Click **Workflows** → **Import from File**
3. Select `google-ads-lead-optimizer.json`
4. Click **Import**

### 2. Configure Credentials

You need to set up the following credentials in n8n:

#### Google Sheets OAuth2

1. Go to **Credentials** → **Add Credential**
2. Select **Google Sheets OAuth2 API**
3. Follow the OAuth setup process
4. Name it (e.g., "Google Sheets account")
5. Note the credential ID

#### Google Ads OAuth2

1. Go to **Credentials** → **Add Credential**
2. Select **Google Ads OAuth2 API**
3. Enter your:
   - Developer Token
   - Client ID
   - Client Secret
   - Manager Account ID (if applicable)
4. Complete OAuth authorization
5. Name it (e.g., "Google Ads account")
6. Note the credential ID

#### Claude API (Anthropic)

1. Go to **Credentials** → **Add Credential**
2. Select **Anthropic API** (or use HTTP Request with header auth)
3. Enter your Claude API key from https://console.anthropic.com/
4. Name it (e.g., "Claude API")
5. Note the credential ID

#### SMTP Email

1. Go to **Credentials** → **Add Credential**
2. Select **SMTP**
3. Enter your email server details:
   - Host
   - Port
   - User
   - Password
   - Use SSL/TLS (recommended)
4. Name it (e.g., "SMTP account")
5. Note the credential ID

### 3. Update Workflow Configuration

Open the workflow and update these nodes:

#### Node: "Read Client Config"
- Update `documentId` with your Google Sheet ID
- Update the credential reference if needed

#### Node: "Log Changes to Sheet"
- Update `documentId` with your Google Sheet ID (same as above)
- Update the credential reference if needed

#### Node: "Send Email Report"
- Verify the recipient email is correct (mike@syte.co.za)
- Update the `fromEmail` if needed
- Update credential reference

#### All HTTP Request Nodes
- Verify credential references match your setup

### 4. Replace Placeholder Credential IDs

Search and replace these placeholder IDs in the workflow JSON:

- `GOOGLE_SHEETS_CREDENTIAL_ID` → Your Google Sheets credential ID
- `GOOGLE_ADS_CREDENTIAL_ID` → Your Google Ads credential ID
- `CLAUDE_API_CREDENTIAL_ID` → Your Claude API credential ID
- `EMAIL_SMTP_CREDENTIAL_ID` → Your SMTP credential ID

You can find credential IDs in n8n by:
1. Go to **Credentials**
2. Click on a credential
3. The ID is in the URL: `credentials/{ID}/edit`

Or edit the workflow nodes directly in the UI to select credentials from dropdowns.

## Usage

### Running the Workflow

1. Open the workflow in n8n
2. Click **Execute Workflow** (or use the Manual Trigger)
3. Monitor execution in the workflow editor
4. Check your email for the optimization report

### Understanding the Email Report

The email includes:

**Performance Summary**
- Total impressions, clicks, conversions
- Total spend and actual CPL vs target CPL

**Key Insights**
- Claude's analysis of account health
- High-level observations and trends

**High Confidence Changes**
- Changes that will auto-apply (after approval)
- Typically includes pausing zero-conversion keywords
- Bid adjustments for underperforming terms
- Negative keyword additions

**Review Required**
- Strategic recommendations needing human decision
- Budget changes, campaign restructures, etc.

### Approving Changes

**Current Version (Manual Approval):**
- The workflow pauses at "Wait for Approval" node
- Review the email recommendations
- Manually trigger the next execution to apply changes

**Future Version (Webhook Approval):**
- Email will include approval/reject links
- Click to approve → workflow auto-resumes and applies changes
- Click to reject → workflow skips changes and logs decision

### Scheduling Automatic Runs

To run this workflow automatically:

1. Replace the **Manual Trigger** node with a **Schedule Trigger** (Cron node)
2. Set schedule (recommended: Monday mornings at 8 AM)
3. Example cron expression: `0 8 * * 1` (8 AM every Monday)
4. Save and activate the workflow

## Workflow Nodes Explained

### Data Fetching Nodes

- **Fetch Campaign Data**: Retrieves campaign-level metrics
- **Fetch Keyword Data**: Gets keyword performance including match types
- **Fetch Ad Data**: Analyzes ad-level performance
- **Fetch Search Terms**: Identifies wasted spend on irrelevant searches

### Processing Nodes

- **Merge Google Ads Data**: Combines all API responses
- **Prepare Data for Claude**: Formats data for AI analysis
- **Claude AI Analysis**: Generates optimization recommendations
- **Format Email Report**: Creates human-readable report
- **Prepare Change Mutations**: Converts recommendations to API operations

### Action Nodes

- **Apply Changes to Google Ads**: Executes mutations via API
- **Log Changes to Sheet**: Records audit trail

## Claude AI Prompt Structure

The workflow sends Claude:
- Account performance data (7-day window)
- Target CPL and budget constraints
- Campaign, keyword, ad, and search term metrics

Claude analyzes and returns JSON with:

```json
{
  "high_confidence_changes": [
    {
      "type": "pause_keyword|adjust_bid|add_negative|pause_ad",
      "entity_id": "resource_name",
      "entity_name": "friendly_name",
      "reason": "explanation",
      "expected_impact": "outcome",
      "action_details": {}
    }
  ],
  "review_required": [
    {
      "type": "budget_increase|campaign_restructure|new_keywords",
      "recommendation": "detailed_recommendation",
      "reason": "explanation",
      "estimated_impact": "potential_outcome"
    }
  ],
  "insights": "Brief summary of account health"
}
```

## Change Types

### Auto-Applied (High Confidence)

- **pause_keyword**: Pause keywords with zero conversions and >$10 spend
- **adjust_bid**: Reduce bids on high-cost, low-conversion keywords
- **add_negative**: Add negative keywords for irrelevant search terms
- **pause_ad**: Pause ads with poor CTR and zero conversions

### Manual Review Required

- **budget_increase**: Suggest budget increases for performing campaigns
- **campaign_restructure**: Recommend structural changes
- **new_keywords**: Suggest new keyword opportunities

## Troubleshooting

### Common Issues

**Issue: Google Ads API returns 401 Unauthorized**
- Solution: Re-authenticate your Google Ads OAuth2 credential
- Check developer token is active

**Issue: No data returned from Google Ads**
- Solution: Verify Campaign IDs are correct in config sheet
- Ensure campaigns have data in the last 7 days
- Check account ID format (use dashes: 123-456-7890)

**Issue: Claude API returns error**
- Solution: Verify API key is correct
- Check you have sufficient API credits
- Ensure model name is exactly: `claude-sonnet-4-20250514`

**Issue: Email not sending**
- Solution: Verify SMTP credentials
- Check firewall/port settings
- Test with a simple email send first

**Issue: Changes not applying**
- Solution: Check Google Ads API permissions
- Verify account has edit access
- Review mutation structure in "Prepare Change Mutations" node

### Debug Mode

To debug the workflow:

1. Open workflow in n8n editor
2. Click **Execute Workflow**
3. Click on each node to see input/output data
4. Check for errors (red nodes)
5. Review execution logs in n8n

### Testing Individual Nodes

Test specific parts:

1. **Test Google Ads API**: Run up to "Fetch Campaign Data" node
2. **Test Claude Analysis**: Run up to "Claude AI Analysis" node
3. **Test Email Only**: Run up to "Send Email Report" node

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data in production
3. **Limit Google Ads API access** to minimum required scopes
4. **Review changes** before auto-applying in production accounts
5. **Monitor the Change Log sheet** regularly
6. **Set budget limits** in Google Ads as a safety net

## Customization

### Modify Analysis Window

Change the 7-day window in **Prepare Google Ads Queries** node:

```javascript
startDate.setDate(startDate.getDate() - 7); // Change 7 to desired days
```

### Adjust Wasted Spend Threshold

In **Prepare Data for Claude** node:

```javascript
.filter(kw => parseFloat(kw.cost) > 10 && kw.conversions === 0)
// Change 10 to your threshold
```

### Change Email Recipient

Update in **Send Email Report** node parameters:

```
toEmail: "your-email@domain.com"
```

### Modify Claude Prompt

Edit the prompt in **Claude AI Analysis** node to:
- Change analysis focus
- Adjust confidence thresholds
- Request different output formats

## Future Enhancements

Planned improvements:

- [ ] Webhook-based approval system
- [ ] Slack/Teams notifications
- [ ] Multi-channel support (Facebook Ads, LinkedIn Ads)
- [ ] A/B test recommendations
- [ ] Predictive budget allocation
- [ ] Dashboard integration
- [ ] Automated bid strategy optimization
- [ ] Competitor analysis integration

## Support & Feedback

For issues, questions, or feature requests:
- Email: mike@syte.co.za
- Include workflow execution logs if reporting bugs

## License

MIT License - Free to use and modify for your needs.

## Version History

- **v1.0** (2026-01-15): Initial release
  - Multi-account support
  - Claude AI integration
  - Email reporting
  - Change logging
  - Manual approval workflow

---

**Note**: This workflow is designed for lead generation campaigns. For e-commerce or other campaign types, you may need to adjust metrics and optimization logic.

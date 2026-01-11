# Google Ads AI Optimization Tool - Design Documentation

**Company:** Syte (https://syte.co.za)
**Contact:** michaelh@syte.co.za
**Purpose:** Campaign optimization and reporting for client accounts
**Date:** January 2026

---

## 1. Executive Summary

This tool is an AI-powered Google Ads optimization system designed for digital marketing agencies to manage and optimize client campaigns. The system uses Google's Gemini AI to analyze campaign performance data and generate data-driven recommendations, with all changes requiring explicit human approval before implementation.

**Key Features:**
- Automated performance analysis and reporting
- AI-powered bid optimization recommendations
- Ad copy testing and suggestions
- Negative keyword identification
- Cost per lead optimization for lead generation campaigns
- Human-in-the-loop approval workflow

---

## 2. System Architecture

### Workflow Overview

```
┌─────────────────┐
│  Google Ads API │
│   (Data Fetch)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Performance     │
│ Analyzer        │
│ - Campaigns     │
│ - Ad Groups     │
│ - Keywords      │
│ - Search Terms  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini AI      │
│  Analysis       │
│ - Bid Decisions │
│ - Ad Copy       │
│ - Keywords      │
│ - Negatives     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approval System │
│ (HTML Interface)│
│ - Approve/      │
│   Reject        │
│   Buttons       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply Changes  │
│  (Approved Only)│
│  Google Ads API │
└─────────────────┘
```

### Technology Stack
- **Language:** Python 3.11+
- **Google Ads API:** v17
- **AI Engine:** Google Gemini 2.0 Flash
- **Authentication:** OAuth2
- **Interface:** HTML/JavaScript for approvals
- **Data Format:** JSON, CSV for reporting

---

## 3. Google Ads API Data Access Requirements

### 3.1 Data We Fetch (Read-Only)

**Campaign Level:**
- Campaign performance metrics (impressions, clicks, cost, conversions)
- Campaign status and settings
- Budget information

**Ad Group Level:**
- Ad group performance metrics
- Ad group bid amounts
- Ad group status

**Keyword Level:**
- Keyword text and match type
- Keyword performance (impressions, clicks, conversions, cost per conversion)
- Quality Score
- Current bid amounts

**Search Terms Report:**
- User search queries triggering ads
- Performance metrics per search term
- Used to identify negative keyword opportunities

**Ad Performance:**
- Ad copy (headlines, descriptions)
- Ad performance metrics
- Ad status

### 3.2 Data We Modify (Write Operations)

**All write operations require explicit human approval via our approval interface.**

- **Bid Adjustments:** Update keyword CPC bids based on performance
- **Ad Creation:** Create new responsive search ads
- **Keyword Management:** Add new keywords to ad groups
- **Negative Keywords:** Add negative keywords to campaigns

### 3.3 Data We DO NOT Access

- ❌ Billing information
- ❌ User personal data
- ❌ Competitor data
- ❌ Data from accounts we don't manage

---

## 4. User Workflow

### 4.1 Daily Automated Analysis

1. **Scheduled Execution** (Typically runs daily)
   - Agent fetches last 30 days of performance data from Google Ads
   - Analyzes campaign, ad group, and keyword performance
   - Identifies optimization opportunities

2. **AI Analysis** (Gemini 2.0)
   - Analyzes conversion rates and cost per lead
   - Identifies underperforming keywords (high cost, low conversions)
   - Identifies wasted spend (search terms with clicks but no conversions)
   - Suggests bid adjustments to maximize ROI
   - Generates ad copy variations for testing

3. **Recommendation Generation**
   - Creates actionable recommendations
   - Provides AI justification for each recommendation
   - Estimates expected impact

### 4.2 Human Approval Process

1. **Notification**
   - System generates HTML approval interface
   - User receives notification to review recommendations

2. **Review Interface**
   - User opens HTML file in browser
   - Sees all recommendations organized by type
   - Each recommendation shows:
     - Current performance metrics
     - Proposed change
     - AI justification
     - Expected impact

3. **Decision Making**
   - User clicks "Approve" or "Reject" for each recommendation
   - Can approve/reject in bulk
   - Downloads decisions as JSON file

4. **Implementation**
   - User runs apply script with decisions file
   - Only approved changes are implemented via Google Ads API
   - Rejected changes are blacklisted (won't be suggested again)

### 4.3 Reporting

- Performance data exported to CSV
- Summary reports generated
- All actions logged with timestamps and justifications

---

## 5. Security & Compliance

### 5.1 Data Security

- **OAuth2 Authentication:** Secure token-based authentication
- **Local Storage Only:** All data stored locally, not transmitted to third parties
- **No Data Reselling:** Data used exclusively for client campaign optimization
- **Audit Trail:** All actions logged with timestamps and justifications

### 5.2 Google Ads Policies Compliance

- **Human Oversight:** All changes require explicit human approval
- **Transparent Operations:** Full audit trail of all actions
- **Client Authorization:** Only access accounts we are authorized to manage
- **Policy Adherence:** Recommendations comply with Google Ads policies

### 5.3 Access Control

- **Dry Run Mode:** Safety mode logs actions without applying them
- **Maximum Change Limits:** Bid changes capped at 20% per day
- **Minimum Thresholds:** Only acts on statistically significant data (50+ impressions)

---

## 6. Screenshots & Interface Examples

### 6.1 HTML Approval Interface

**[INSERT SCREENSHOT: approval_interface.png]**

The approval interface shows:
- Summary statistics (total actions, approved, rejected, pending)
- Action cards organized by type (bid adjustments, ad creation, keywords)
- Approve/Reject buttons for each recommendation
- AI justification and performance metrics
- Bulk action buttons (Approve All, Reject All)
- Download decisions button

### 6.2 Performance Report

**[INSERT SCREENSHOT: performance_report.png]**

Shows campaign-level metrics:
- Conversions (leads)
- Cost per conversion
- Conversion rate
- Total spend
- Health indicators

### 6.3 Command Line Workflow

**[INSERT SCREENSHOT: agent_execution.png]**

Shows:
- Agent fetching campaign data
- AI optimization process
- Actions summary
- Approval file generation

---

## 7. Business Value

### 7.1 For Agencies

- **Efficiency:** Automate routine optimization tasks
- **Scalability:** Manage more clients with same resources
- **Data-Driven:** AI analysis of thousands of keywords
- **Transparency:** Full audit trail for client reporting

### 7.2 For Advertisers

- **Better ROI:** Continuous optimization based on performance data
- **Reduced Waste:** Identify and block irrelevant search terms
- **Improved Quality:** AI-generated ad copy variations
- **Lower Cost Per Lead:** Focus on lead generation efficiency

### 7.3 Use Cases

- **Lead Generation Campaigns:** Optimize for cost per lead
- **Budget Optimization:** Reduce wasted spend on non-converting keywords
- **Ad Testing:** Continuous ad copy improvement
- **Negative Keyword Management:** Prevent irrelevant clicks

---

## 8. API Usage Patterns

### 8.1 Read Operations (Daily)

- Fetch campaign performance: ~3-10 campaigns per account
- Fetch ad group data: ~10-30 ad groups per account
- Fetch keyword data: ~50-200 keywords per account
- Fetch search terms: Last 30 days of data

**Estimated API Calls:** 50-200 per account per day

### 8.2 Write Operations (As Approved)

- Bid updates: 0-20 per day (only if approved)
- Ad creation: 0-5 per day (only if approved)
- Keyword additions: 0-10 per day (only if approved)
- Negative keyword additions: 0-10 per day (only if approved)

**All write operations require human approval.**

---

## 9. Responsible AI Usage

### 9.1 AI Role

- **Advisory Only:** AI generates recommendations, humans make decisions
- **Explainable:** Every recommendation includes justification
- **Transparent:** Users see exact changes before approval
- **Auditable:** All AI decisions logged

### 9.2 Human Oversight

- **Required Approval:** No automated changes without human review
- **Override Capability:** Users can reject any recommendation
- **Learning from Feedback:** Rejected recommendations are not re-suggested

---

## 10. Contact Information

**Developer/Company:** Syte
**Email:** michaelh@syte.co.za
**Website:** https://syte.co.za
**Company Type:** Agency/SEM
**Intended Use:** Reporting in our Google Ads

For questions or clarifications about this API integration, please contact the developer via the email above.

---

## Appendix: Sample Output

### Sample Bid Adjustment Recommendation

```json
{
  "type": "bid_adjustment",
  "keyword": "laundry service quote",
  "current_bid": 5.50,
  "recommended_bid": 7.15,
  "change_percent": +30.0,
  "justification": "This keyword has a cost per lead of R180 (below target of R250) with 5 conversions in 30 days. Increasing bid by 30% will increase visibility while maintaining profitable CPL.",
  "performance": {
    "impressions": 156,
    "clicks": 12,
    "conversions": 5,
    "cost_per_conversion": 180.00
  }
}
```

### Sample Negative Keyword Recommendation

```json
{
  "type": "add_negative_keyword",
  "keyword": "free laundry service",
  "match_type": "PHRASE",
  "reason": "Search term 'free laundry service' received 15 clicks costing R225 with 0 conversions. Adding as negative keyword to prevent wasted spend.",
  "wasted_spend": 225.00
}
```

---

**End of Design Documentation**

*This document describes the current implementation as of January 2026. The system is designed with responsible AI practices, human oversight, and full compliance with Google Ads API policies.*

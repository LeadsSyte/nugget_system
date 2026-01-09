# A/B Test Guide - Measuring Exit-Intent Impact

This guide explains how to run a 50/50 A/B test to measure the conversion rate impact of the RIDE5 exit-intent popup.

## Overview

**Test Groups:**
- **Control Group (50%)**: Normal experience, no exit-intent popup
- **Test Group (50%)**: See exit-intent popup with RIDE5 offer

**Duration:** Run for at least 2-4 weeks to get statistically significant results

**Goal:** Measure if exit-intent popup increases conversion rate

---

## Installation for A/B Test

Use `hotleathers-personalization-abtest.js` instead of the regular version:

### Step 1: Upload A/B Test File

1. Shopify Admin → Online Store → Themes → Edit code
2. Assets folder → Add new asset
3. Upload `hotleathers-personalization-abtest.js`

### Step 2: Add to Theme

In `theme.liquid`, add before `</head>`:

```liquid
<!-- Hot Leathers Exit-Intent A/B Test -->
{% unless template contains 'checkout' %}
  <script src="{{ 'hotleathers-personalization-abtest.js' | asset_url }}" defer></script>
{% endunless %}
```

### Step 3: Configure Test Parameters

Open `hotleathers-personalization-abtest.js` and find (around line 15):

```javascript
const AB_TEST_CONFIG = {
  enabled: true,                    // Set to false to show to 100% (end test)
  testPercentage: 50,               // Percentage in TEST group (with exit-intent)
  testName: 'exit_intent_ride5',    // Name for tracking
  cookieDuration: 30                // Days to remember group assignment
};
```

**Key Settings:**
- `enabled: true` - A/B test is running
- `testPercentage: 50` - 50% see exit-intent, 50% don't
- `cookieDuration: 30` - User stays in same group for 30 days

---

## How It Works

### User Assignment

1. **First visit:** User is randomly assigned to Control or Test group
2. **Assignment stored:** Cookie + localStorage remembers their group
3. **Consistent experience:** Same user always sees same experience for 30 days

### What Gets Tracked

The script automatically tracks these events:

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `ab_test_assigned` | User assigned to group | First visit |
| `exit_intent_triggered` | Exit-intent detected | Mouse leaves page |
| `exit_intent_shown` | Popup displayed | After passing checks |
| `exit_intent_closed` | User closed popup | Click X or overlay |
| `exit_intent_code_copied` | Copied RIDE5 code | Click copy button |
| `exit_intent_cta_clicked` | Clicked "Apply" button | Click CTA |
| `converted` | User made purchase | Checkout complete |

### Where Data Goes

Events are automatically sent to:
- ✅ **Google Analytics 4** (if installed)
- ✅ **Google Universal Analytics** (if installed)
- ✅ **Facebook Pixel** (if installed)
- ✅ **Shopify Analytics** (if available)
- ✅ **Local Storage** (always)

---

## Measuring Results

### Method 1: Google Analytics 4 (Recommended)

#### View Test Groups

1. GA4 → **Reports** → **Engagement** → **Events**
2. Search for event: `ab_test_assigned`
3. Add secondary dimension: `test_group`
4. You'll see 50% "control" and 50% "test"

#### Measure Conversion Rate

1. GA4 → **Explore** → **Blank**
2. **Variables:**
   - Dimension: `Event name` = `ab_test_assigned`
   - Dimension: `test_group`
   - Metrics: `Event count`, `Conversions`
3. **Settings:**
   - Rows: `test_group`
   - Values: `Event count`, `Conversions`
   - Filters: Date range (your test period)

#### Calculate Results

```
Control Group Conversion Rate = (Control Conversions / Control Users) × 100
Test Group Conversion Rate = (Test Conversions / Test Users) × 100

Lift = ((Test Rate - Control Rate) / Control Rate) × 100
```

**Example:**
- Control: 1000 users, 25 conversions = 2.5% conversion rate
- Test: 1000 users, 35 conversions = 3.5% conversion rate
- Lift: ((3.5 - 2.5) / 2.5) × 100 = **40% lift** 🎉

### Method 2: Manual Tracking via Console

Check individual user data in browser console:

```javascript
// Check user's test group
HotLeathersPersonalization.getTestGroup()
// Returns: "control" or "test"

// Get full test data
HotLeathersPersonalization.getTestData()
// Returns object with all events
```

### Method 3: Export from localStorage

Get all user data:

```javascript
// In browser console:
function exportABTestData() {
  const data = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('hotleathers_ab_test')) {
      data.push({
        key: key,
        value: localStorage.getItem(key)
      });
    }
  }
  console.table(data);
  return data;
}

exportABTestData();
```

### Method 4: Shopify Analytics

1. Shopify Admin → **Analytics** → **Reports**
2. **Custom Reports** → Create new
3. Filter by:
   - Date range: Your test period
   - Source: Web
4. Compare:
   - Sessions
   - Orders
   - Conversion rate

**Note:** Shopify won't show A/B groups directly, but you can compare to baseline.

---

## Setting Up Google Analytics Tracking

If you don't have GA4 set up, here's how:

### Step 1: Create GA4 Property

1. Go to Google Analytics
2. Admin → Create Property
3. Property name: "Hot Leathers"
4. Set up web data stream
5. Copy **Measurement ID** (looks like G-XXXXXXXXXX)

### Step 2: Add GA4 to Shopify

In `theme.liquid`, add in `<head>`:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Measurement ID.

### Step 3: Track Conversions

Add to your **Order Status Page** (Settings → Checkout → Additional scripts):

```javascript
{% if first_time_accessed %}
<script>
  // Track conversion in A/B test
  if (typeof HotLeathersPersonalization !== 'undefined') {
    HotLeathersPersonalization.trackConversion();
  }

  // Also send to GA4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'purchase', {
      transaction_id: '{{ order.id }}',
      value: {{ order.total_price | divided_by: 100.0 }},
      currency: '{{ shop.currency }}',
      test_group: localStorage.getItem('hotleathers_ab_test_group')
    });
  }
</script>
{% endif %}
```

---

## Interpreting Results

### What to Look For

After 2-4 weeks with significant traffic:

#### 1. Sample Size
- **Minimum:** 100 conversions per group
- **Better:** 200+ conversions per group
- **Ideal:** 500+ conversions per group

#### 2. Statistical Significance
Use a calculator like: https://abtestguide.com/calc/

**Required for valid results:**
- P-value < 0.05 (95% confidence)
- At least 2 weeks of data
- Similar traffic patterns both weeks

#### 3. Key Metrics

| Metric | What to Track | Goal |
|--------|---------------|------|
| **Conversion Rate** | Orders / Visitors | Test > Control |
| **Revenue per Visitor** | Total Revenue / Visitors | Test > Control |
| **Average Order Value** | Total Revenue / Orders | No decrease |
| **Exit-Intent Engagement** | Popup interactions | 5-15% click rate |

### Decision Matrix

**If Test Group has:**

| Result | Action |
|--------|--------|
| +10% conversion rate | ✅ Strong win - Roll out to 100% |
| +5% conversion rate | ✅ Good win - Roll out to 100% |
| +2% conversion rate | ⚠️ Marginal - Run longer or roll out |
| 0% change | ⚠️ No impact - Consider modifications |
| -2% conversion rate | ❌ Negative - Turn off, try alternatives |

### Red Flags to Watch

🚩 **Don't proceed if:**
- Average order value drops significantly
- Customer complaints increase
- Site performance degrades
- Mobile conversion rate drops
- Bounce rate increases significantly

---

## Sample Results Report

After running the test, create a report:

```
EXIT-INTENT A/B TEST RESULTS
Hot Leathers - RIDE5 Discount
Test Period: January 1-30, 2026

CONTROL GROUP (No Exit-Intent):
- Users: 5,432
- Conversions: 136
- Conversion Rate: 2.50%
- Revenue: $45,620
- Revenue per Visitor: $8.40

TEST GROUP (With Exit-Intent):
- Users: 5,518
- Conversions: 182
- Conversion Rate: 3.30%
- Revenue: $61,490
- Revenue per Visitor: $11.14

RESULTS:
- Conversion Rate Lift: +32% ✅
- Revenue Lift: +32.5% ✅
- Statistical Significance: 99% ✅

EXIT-INTENT ENGAGEMENT:
- Popup Shown: 1,247 times
- Code Copied: 432 times (34.6%)
- CTA Clicked: 289 times (23.2%)
- Conversion from Popup: 87 orders

RECOMMENDATION:
Roll out to 100% of traffic. Strong positive impact on both conversion rate and revenue.
```

---

## Common Issues & Solutions

### Issue: Not Enough Traffic

**Problem:** Not reaching minimum sample size

**Solution:**
- Run test for 4-6 weeks instead of 2
- Increase ad spend to drive more traffic
- Consider lowering test percentage (30/70 split)

### Issue: Results Not Consistent Week-to-Week

**Problem:** Test group wins one week, control wins next

**Solution:**
- External factors (holidays, promotions)
- Run longer to smooth out variance
- Check for technical issues

### Issue: Mobile vs Desktop Difference

**Problem:** Works on desktop but not mobile

**Solution:**
- Analyze by device type
- Consider desktop-only deployment
- Improve mobile popup design

### Issue: Can't See Data in Analytics

**Problem:** Events not showing in GA4

**Solution:**
```javascript
// Test in browser console:
gtag('event', 'test_event', { test: 'hello' })

// Then check GA4 Realtime reports
// If this works, tracking is set up correctly
```

---

## Ending the Test

### Option 1: Roll Out to 100%

If test wins, switch to regular version:

1. Replace `hotleathers-personalization-abtest.js` with `hotleathers-personalization.js`
2. Update script tag in `theme.liquid`
3. All users now see exit-intent

### Option 2: Keep A/B Test Running

Want to keep split for ongoing monitoring:

```javascript
// Change testPercentage
const AB_TEST_CONFIG = {
  enabled: true,
  testPercentage: 100,  // ← Show to all, but keep tracking
  // ...
};
```

### Option 3: Turn Off Feature

If test loses:

```javascript
const AB_TEST_CONFIG = {
  enabled: false,  // ← Disables split test
  // ...
};
```

Or remove script entirely from theme.

---

## Advanced: Segmented Analysis

### By Device Type

In GA4 Explore:
- Add dimension: `Device category`
- Compare control vs test for mobile/desktop separately

### By Traffic Source

- Add dimension: `Source / medium`
- See if exit-intent works better for specific channels

### By New vs Returning

- Add dimension: `New vs returning`
- Might work better for first-time visitors

### By Geography

- Add dimension: `City` or `Region`
- Check if geo-targeted messages work better

---

## Budget & Timeline

### Recommended Test Plan

**Week 1-2:**
- Setup and initial monitoring
- Fix any technical issues
- Verify tracking works

**Week 3-4:**
- Primary data collection
- Mid-test analysis
- Adjust if major issues

**Week 5-6:**
- Extended collection if needed
- Final analysis
- Decision making

**Week 7:**
- Implementation of winner
- Documentation
- Monitoring post-rollout

### Cost Considerations

**A/B Testing Costs:**
- Development: Already done ✅
- Setup time: ~2 hours
- Monitoring time: ~2 hours/week
- Analysis time: ~4 hours
- **Total:** ~15 hours of internal time

**Expected Results:**
- If conversion rate improves 10-30%
- And average order value stays same
- ROI typically positive within 1 week of rollout

---

## Next Steps

1. ✅ Upload `hotleathers-personalization-abtest.js`
2. ✅ Add to theme with script tag
3. ✅ Set up Google Analytics tracking
4. ✅ Add conversion tracking to thank you page
5. ✅ Monitor daily for first week
6. ✅ Run test for 2-4 weeks
7. ✅ Analyze results
8. ✅ Make decision: roll out, modify, or cancel

---

## Questions?

### How do I check which group a specific customer is in?

In browser console on their device:
```javascript
HotLeathersPersonalization.getTestGroup()
```

### Can I force myself into test group?

Yes, in console:
```javascript
document.cookie = 'hotleathers_ab_test_group=test; path=/; max-age=2592000'
location.reload()
```

### Can I run multiple A/B tests?

Not recommended. Run one test at a time for clear results.

### What if I want 30/70 split instead of 50/50?

Change `testPercentage: 30` in the config (30% see exit-intent).

### How do I export all results?

Use Google Analytics export feature, or use the console command in Method 3 above.

---

**File:** `ABTEST_GUIDE.md`
**Version:** 1.0.0
**Last Updated:** January 2026

# Hot Leathers - Quick Reference Guide

## 🎯 What This Does

1. **Exit-Intent Popup**: Shows RIDE5 discount (5% off) when customers try to leave with items in cart
   - Only shows if NO discount already applied
   - Geo-targeted messaging (e.g., "Don't ride off without this, New York!")
   - Auto-applies discount when clicked

2. **Post-Purchase Upsell**: Shows RIDE5 discount on order confirmation page
   - Recommends relevant products based on what they bought
   - Shows discounted price with RIDE5 applied

---

## ⚡ Quick Install (15 minutes)

### Part 1: Exit-Intent Popup

1. **Upload file:**
   - Shopify Admin → Online Store → Themes → Edit code
   - Assets folder → Add new asset → Upload `hotleathers-personalization.js`

2. **Add to theme:**
   - Layout → `theme.liquid`
   - Find `</head>`
   - Add BEFORE it:
   ```liquid
   {% unless template contains 'checkout' %}
     <script src="{{ 'hotleathers-personalization.js' | asset_url }}" defer></script>
   {% endunless %}
   ```

3. **Test:**
   - Add item to cart
   - Move mouse to leave page
   - Popup should appear

### Part 2: Post-Purchase Upsell (Shopify Plus only)

1. **Customize products:**
   - Edit `thank-you-page-upsell.liquid`
   - Replace product handles, titles, prices with YOUR products
   - See line 150-180 in the file

2. **Add to Shopify:**
   - Settings → Checkout → Order status page
   - Find "Additional scripts"
   - Paste entire `thank-you-page-upsell.liquid` contents
   - Save

3. **Test:**
   - Enable test mode (Settings → Payments)
   - Place test order
   - Check order confirmation page

---

## 🎨 Key Customization Points

### Change Colors

In `hotleathers-personalization.js`, find:
```javascript
background: #1a1a1a;       // Dark background
border: 2px solid #ff6600;  // Orange border
color: #ff6600;            // Orange text
```

### Change Messages

```javascript
// Line ~330 - Location messages
const stateMessages = {
  'NY': `Don't ride off without this, New York! 🗽`,
  // Add more states...
};

// Line ~360 - Popup title
<h2 class="hl-popup-title">${locationMessage}</h2>
```

### Change Discount Code

```javascript
// Line ~15
const CONFIG = {
  discountCode: 'RIDE5',      // ← Change this
  discountPercent: 5,          // ← Change this
};
```

**ALSO update in Shopify Admin:**
- Discounts → Create/edit RIDE5 code
- Set to 5% off
- Cannot combine with other discounts

---

## ✅ Testing Checklist

### Exit-Intent Popup
- [ ] Shows when leaving with items in cart
- [ ] Does NOT show with empty cart
- [ ] Does NOT show when discount already applied
- [ ] Copy code button works
- [ ] Apply button redirects to cart with discount
- [ ] Close button works
- [ ] No JavaScript errors in console (F12)

### Post-Purchase Upsell
- [ ] Shows on order confirmation page
- [ ] Recommends relevant products
- [ ] Prices show discount correctly
- [ ] Links work
- [ ] No errors in console

### Site Safety
- [ ] Homepage loads normally
- [ ] Product pages work
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] Mobile responsive

---

## 🐛 Quick Troubleshooting

### Popup Not Showing?
```javascript
// Test in browser console (F12):
HotLeathersPersonalization.testExitPopup()
```

### Check Cart Status:
```javascript
fetch('/cart.js').then(r => r.json()).then(console.log)
```

### Check for Errors:
- Press F12
- Click Console tab
- Look for red errors

### Emergency Disable:
Comment out in `theme.liquid`:
```liquid
<!-- DISABLED
<script src="{{ 'hotleathers-personalization.js' | asset_url }}" defer></script>
-->
```

---

## 📊 What Gets Tracked

The script tracks (locally in browser):
- Visit count
- Products viewed
- Cart activity
- Location (approximate)
- Whether exit-intent was shown

**No data sent to external servers** - all stored in user's browser.

---

## 🎯 Discount Rules

**RIDE5 code must be set up in Shopify with:**
- ✅ 5% off
- ✅ Cannot combine with other discounts
- ✅ Valid for all products (or specify which)
- ✅ No expiration (or set your own)
- ✅ Unlimited uses (or set limit)

**To create/edit:**
1. Shopify Admin → Discounts
2. Create discount code
3. Code: `RIDE5`
4. Type: Percentage
5. Value: 5%
6. Applies to: All products
7. Can't be combined with other discounts: ✅ Check this
8. Save

---

## 📱 Mobile vs Desktop

**Desktop Exit-Intent:**
- Triggers when mouse moves to top of browser (leaving)

**Mobile Exit-Intent:**
- Triggers when scrolling rapidly up (common before back button)
- May need adjustment based on user behavior

---

## 🔧 Common Modifications

### Show on All Pages (Not Just Exit)
```javascript
// Remove exit-intent logic, show immediately:
setTimeout(() => {
  ExitIntentHandler.showExitPopup(null);
}, 5000); // Show after 5 seconds
```

### Change Popup Delay
```javascript
// Line ~415 - Currently 10 seconds
setTimeout(() => {
  this.attachListeners();
}, 10000); // ← Change this to 5000 for 5 seconds
```

### Disable Geo-Targeting
```javascript
// Line ~18
features: {
  exitIntent: true,
  geoTargeting: false,  // ← Change to false
}
```

---

## 📈 Success Metrics to Track

Monitor these in Shopify Analytics:
- Cart abandonment rate (should decrease)
- Discount code usage (RIDE5)
- Average order value
- Conversion rate

---

## 🆘 Emergency Contacts

### If Site Breaks:
1. Remove script tag from `theme.liquid`
2. Revert to previous theme version
3. Site immediately returns to normal

### Files to Keep Backed Up:
- Original `theme.liquid` (before changes)
- Original theme (duplicate)

---

## 📋 Product Recommendation Logic

Currently recommends based on:
- Jacket → Gloves, Helmet
- Gloves → Jacket
- Helmet → Gloves, Jacket

**To customize:**
Edit `thank-you-page-upsell.liquid` around line 150:

```javascript
const boughtJacket = purchased.some(p =>
  p.type.toLowerCase().includes('jacket')
);

if (boughtJacket && !boughtGloves) {
  recommendations.push({
    handle: 'YOUR-PRODUCT-HANDLE',
    title: 'Your Product Title',
    price: 49.99,
    image: '/path/to/image.jpg'
  });
}
```

---

## 🎯 Key Configuration Settings

```javascript
// In hotleathers-personalization.js:
const CONFIG = {
  storagePrefix: 'hotleathers_',     // Local storage prefix
  discountCode: 'RIDE5',             // Discount code
  discountPercent: 5,                // Discount amount
  debug: false,                       // Set true for console logs

  features: {
    exitIntent: true,                // Enable exit popup
    geoTargeting: true,              // Enable location messages
    productTracking: true            // Track viewed products
  }
};
```

---

## 💡 Pro Tips

1. **Test on duplicate theme first** - Never edit live theme directly
2. **Use browser console** - F12 to see what's happening
3. **Check discount setup** - Make sure RIDE5 exists in Shopify
4. **Mobile test** - Behavior is different on mobile
5. **Monitor analytics** - Track performance after launch

---

## 📞 Testing Commands

Open browser console (F12) and run:

```javascript
// Force show popup
HotLeathersPersonalization.testExitPopup()

// Check profile data
HotLeathersPersonalization.getProfile()

// Check cart
fetch('/cart.js').then(r => r.json()).then(console.log)

// Check active discount
fetch('/cart.js').then(r => r.json()).then(cart => {
  console.log('Has discount:', cart.total_discount > 0)
})
```

---

## ✨ Features Summary

| Feature | Description | Requires |
|---------|-------------|----------|
| Exit-Intent Popup | Shows RIDE5 offer when leaving | Standard Shopify |
| Discount Check | Verifies no existing discount | Standard Shopify |
| Geo-Targeting | Location-based messages | Standard Shopify |
| Post-Purchase Upsell | Thank you page offers | Shopify Plus |
| Product Tracking | Remembers viewed products | Standard Shopify |

---

## 🚀 Launch Day Checklist

1. [ ] Tested on duplicate theme
2. [ ] All scenarios verified (with/without discount, mobile/desktop)
3. [ ] No console errors
4. [ ] RIDE5 discount created in Shopify
5. [ ] Product recommendations customized
6. [ ] Backup of original theme saved
7. [ ] Team briefed on new feature
8. [ ] Analytics tracking ready
9. [ ] Rollback plan prepared
10. [ ] Publish and monitor!

---

**Files:**
- `hotleathers-personalization.js` - Exit-intent script
- `thank-you-page-upsell.liquid` - Post-purchase upsell
- `HOTLEATHERS_INSTALLATION.md` - Detailed installation guide

**Install Time:** ~15 minutes
**Testing Time:** ~30 minutes
**Total Time to Launch:** ~45 minutes

---

## Need Help?

See full installation guide: `HOTLEATHERS_INSTALLATION.md`

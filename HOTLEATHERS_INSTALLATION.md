# Hot Leathers Personalization Installation Guide

**IMPORTANT: This guide ensures SAFE installation that won't break your site**

## ⚠️ Safety First

Before starting:
1. ✅ Create a **duplicate theme** to test on first
2. ✅ Never edit your live theme directly
3. ✅ Test thoroughly before publishing
4. ✅ Have theme backups ready

---

## Part 1: Exit-Intent Popup with RIDE5 Discount

This shows the RIDE5 discount when customers are about to leave with items in their cart (only if they don't already have a discount).

### Step 1: Upload JavaScript File

1. Go to Shopify Admin → **Online Store** → **Themes**
2. Find your **DEVELOPMENT/DUPLICATE** theme (NOT the live one)
3. Click **Actions** → **Edit code**
4. In left sidebar, click **Assets** folder
5. Click **Add a new asset**
6. Upload `hotleathers-personalization.js`

### Step 2: Add Script to Theme

1. In left sidebar, find **Layout** → Click `theme.liquid`
2. Press `Ctrl+F` (or `Cmd+F` on Mac) and search for `</head>`
3. **Just BEFORE** the `</head>` tag, add this code:

```liquid
<!-- Hot Leathers Personalization - Exit Intent -->
{% unless template contains 'checkout' or template contains 'cart' %}
  <script src="{{ 'hotleathers-personalization.js' | asset_url }}" defer></script>
{% endunless %}
```

**Why the `unless` wrapper?**
- Prevents script from loading on checkout pages (Shopify doesn't allow custom scripts there)
- Avoids conflicts with cart page
- Makes it extra safe

4. Click **Save** in top right

### Step 3: Test the Exit-Intent Popup

**BEFORE going live, test on your duplicate theme:**

1. **Preview your duplicate theme**
2. Add a product to cart (don't checkout)
3. Move your mouse to leave the page (move cursor to top of browser)
4. You should see the exit-intent popup with RIDE5 offer

**To test in browser console:**
```javascript
// Open browser console (F12), paste this:
HotLeathersPersonalization.testExitPopup()
```

This will show the popup immediately for testing.

### Step 4: Verify Discount Check Works

**Test that popup respects existing discounts:**

1. Go to your test site
2. Add item to cart
3. Go to cart and apply ANY discount code
4. Try to exit the page
5. **Popup should NOT appear** (because you already have a discount)

6. Clear cart, add items again with NO discount
7. Try to exit
8. **Popup SHOULD appear**

✅ If both scenarios work, you're good!

### Step 5: Customize Styling (Optional)

The popup uses these colors:
- Background: `#1a1a1a` (dark)
- Accent: `#ff6600` (orange)
- Text: `#fff` (white)

To change colors, edit in `hotleathers-personalization.js`:

Find this section:
```javascript
.hl-popup-container {
  background: #1a1a1a;  // Change this
  border: 2px solid #ff6600;  // Change this
  ...
}
```

---

## Part 2: Post-Purchase Upsell (Thank You Page)

This shows RIDE5 discount on the order confirmation page for relevant products.

### IMPORTANT: Shopify Plus Required

Post-purchase scripts require **Shopify Plus**. If you have Shopify Plus, follow these steps:

### Step 1: Customize Product Recommendations

1. Open `thank-you-page-upsell.liquid`
2. Find the `getRecommendedProducts()` function
3. **Replace the product data** with your actual products:

```javascript
// Example: If they bought a jacket, recommend gloves
if (boughtJacket && !boughtGloves) {
  recommendations.push({
    handle: 'your-gloves-product-handle',  // ← CHANGE THIS
    title: 'Premium Leather Gloves',        // ← CHANGE THIS
    price: 49.99,                           // ← CHANGE THIS
    image: '/products/gloves.jpg'           // ← CHANGE THIS
  });
}
```

**How to find product handle:**
1. Go to Products in Shopify Admin
2. Open a product
3. Look at the URL: `https://yourstore.com/admin/products/12345678`
4. The handle is at the end of the product URL on your live site: `https://hotleathers.com/products/HANDLE-HERE`

**How to get image URL:**
1. Open product in Shopify
2. Right-click on product image
3. Select "Copy image address"
4. Paste into the `image` field

### Step 2: Add to Order Status Page

1. Go to Shopify Admin → **Settings** → **Checkout**
2. Scroll down to **Order status page**
3. Find the section **Additional scripts**
4. Copy the ENTIRE contents of `thank-you-page-upsell.liquid`
5. Paste into the **Additional scripts** box
6. Click **Save**

### Step 3: Test Post-Purchase Upsell

**To test safely:**

1. **Use Shopify's test mode:**
   - Settings → Payments → Enable test mode
   - Use test credit card: 4242 4242 4242 4242

2. Place a test order:
   - Add a jacket to cart
   - Complete checkout with test card
   - On order confirmation page, you should see upsell

3. Test different scenarios:
   - Order jacket → Should see gloves/helmet
   - Order gloves → Should see jacket
   - Order random item → Should see default products

### Step 4: Go Live

Once tested:

1. Settings → Payments → **Disable test mode**
2. The post-purchase upsell is now live!

---

## Part 3: Customizing for Your Products

### Update Recommendation Logic

Edit the logic to match your catalog:

```javascript
// Example 1: If they bought a vest, recommend a patch
const boughtVest = purchased.some(p =>
  p.type.toLowerCase().includes('vest') ||
  p.title.toLowerCase().includes('vest')
);

if (boughtVest) {
  recommendations.push({
    handle: 'biker-patches',
    title: 'Biker Patches Collection',
    price: 19.99,
    image: '/products/patches.jpg'
  });
}

// Example 2: If they bought anything, recommend care products
recommendations.push({
  handle: 'leather-care-kit',
  title: 'Leather Care Kit',
  price: 24.99,
  image: '/products/care-kit.jpg'
});
```

### Common Product Type Values

These are typical Shopify product types for motorcycle gear:
- `Jacket`
- `Vest`
- `Gloves`
- `Helmet`
- `Boots`
- `Pants`
- `Chaps`
- `Accessories`
- `Patches`

Check your actual product types in Shopify Admin → Products

---

## Part 4: Geo-Targeting Customization

The exit-intent popup shows different messages based on location.

### Current State-Specific Messages

Edit in `hotleathers-personalization.js`:

```javascript
const stateMessages = {
  'NY': `Don't ride off without this, New York! 🗽`,
  'CA': `California rider! Grab this before you go! 🌴`,
  'TX': `Hold up, Texas! We got you covered! 🤠`,
  // Add more states...
};
```

### To Add More States:

```javascript
'FL': `Florida rider! Don't miss this deal! ☀️`,
'PA': `Pennsylvania! One more thing! 🏍️`,
'OH': `Ohio rider! Check this out! 🏍️`,
'MI': `Michigan! Don't leave yet! 🏍️`,
```

---

## Part 5: Safety Checks & Verification

### Verification Checklist

After installation, verify everything works:

#### ✅ Exit-Intent Popup
- [ ] Popup shows when exiting with items in cart
- [ ] Popup does NOT show when cart is empty
- [ ] Popup does NOT show when discount already applied
- [ ] Copy code button works
- [ ] "Apply & Complete Order" button redirects correctly
- [ ] Close button works
- [ ] Popup styling matches your brand

#### ✅ Post-Purchase Upsell
- [ ] Shows on order confirmation page
- [ ] Recommends relevant products based on purchase
- [ ] RIDE5 discount code displays
- [ ] Product links work correctly
- [ ] Discount link applies correctly

#### ✅ Site Functionality
- [ ] Homepage loads normally
- [ ] Product pages load normally
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] No JavaScript errors in console (F12)

### How to Check for JavaScript Errors

1. Open your site
2. Press `F12` to open Developer Tools
3. Click **Console** tab
4. Look for red errors
5. **Should see NO errors related to Hot Leathers script**

If you see errors:
- Screenshot the error
- Check that file paths are correct
- Verify JavaScript file uploaded correctly

---

## Part 6: Troubleshooting

### Problem: Exit-Intent Popup Not Showing

**Check:**
1. Do you have items in cart? (Required)
2. Are you on desktop? (Mobile uses different trigger)
3. Wait 10 seconds after page load (required delay)
4. Check console for errors

**Force show for testing:**
```javascript
// In browser console (F12):
HotLeathersPersonalization.testExitPopup()
```

### Problem: Popup Shows Even With Discount Applied

**Check:**
1. Verify discount is actually applied in cart
2. Check cart.js response:
```javascript
// In browser console:
fetch('/cart.js')
  .then(r => r.json())
  .then(data => console.log('Cart:', data))
```
3. Look for `total_discount` or `cart_level_discount_applications`

### Problem: Post-Purchase Upsell Not Showing

**Check:**
1. Are you on Shopify Plus? (Required)
2. Is code in Settings → Checkout → Additional scripts?
3. Did you complete an actual order? (Must be real order, not just cart)
4. Check browser console for errors

### Problem: Discount Code Not Working

**Verify in Shopify Admin:**
1. Go to Discounts
2. Find RIDE5 discount code
3. Check:
   - ✅ Is active
   - ✅ Not expired
   - ✅ Has uses remaining
   - ✅ Applies to all products (or specify which)
   - ✅ Cannot be combined with other discounts

### Problem: Site is Broken

**Emergency fix:**

1. Go to theme code
2. Find the script tag you added in `theme.liquid`
3. Delete or comment it out:
```liquid
<!-- TEMPORARILY DISABLED
<script src="{{ 'hotleathers-personalization.js' | asset_url }}" defer></script>
-->
```
4. Save

**This immediately removes the script and your site returns to normal**

---

## Part 7: Going Live Safely

### Pre-Launch Checklist

Before publishing to your live theme:

1. ✅ Test on duplicate theme thoroughly
2. ✅ Test all scenarios (with/without discount, different products)
3. ✅ Test on mobile and desktop
4. ✅ Verify no console errors
5. ✅ Have backup of current live theme
6. ✅ Plan for rollback if needed

### Launch Steps

1. **Publish duplicate theme:**
   - Themes → Find your tested duplicate
   - Click **Actions** → **Publish**

2. **Monitor for 1 hour:**
   - Watch for customer issues
   - Check error logs
   - Test yourself on live site

3. **If issues arise:**
   - Immediately revert to previous theme
   - Fix issues on duplicate
   - Re-test before publishing again

---

## Part 8: Performance & Optimization

### Script Load Impact

The script is lightweight:
- File size: ~15KB
- Loads asynchronously (`defer`)
- Doesn't block page rendering
- Only initializes after 10 seconds

### Disable Features if Needed

To disable exit-intent but keep tracking:

```javascript
// In hotleathers-personalization.js, find:
const CONFIG = {
  features: {
    exitIntent: false,  // ← Change to false
    geoTargeting: true,
    productTracking: true
  }
};
```

---

## Part 9: Analytics & Tracking

### Track Popup Performance

Add to Google Analytics or your analytics tool:

```javascript
// When popup shows
window.addEventListener('hotleathers:exitIntentShown', function(e) {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exit_intent_shown', {
      discount_code: e.detail.discountCode
    });
  }

  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('trackCustom', 'ExitIntentShown', {
      discount_code: e.detail.discountCode
    });
  }
});
```

Add this to the bottom of `hotleathers-personalization.js`

---

## Part 10: Customization Examples

### Change Popup Colors to Match Brand

Find and edit these sections in the script:

```javascript
// Main container
.hl-popup-container {
  background: #1a1a1a;        // ← Dark background
  border: 2px solid #ff6600;  // ← Orange border
}

// Discount code
.hl-discount-code {
  color: #ff6600;  // ← Orange text
}

// CTA button
.hl-popup-cta {
  background: linear-gradient(135deg, #ff6600 0%, #ff8833 100%);  // ← Orange gradient
}
```

### Change Messages

```javascript
// In showExitPopup function:
<h2 class="hl-popup-title">${locationMessage}</h2>
<p class="hl-popup-subtitle">Complete your order and save ${CONFIG.discountPercent}%!</p>
```

Change to:
```javascript
<h2 class="hl-popup-title">Wait! Before You Go...</h2>
<p class="hl-popup-subtitle">Save 5% with code RIDE5 - Ride in style!</p>
```

---

## Part 11: FAQ

### Q: Will this work with my theme?
**A:** Yes, it's theme-independent and works with all Shopify themes.

### Q: Will it slow down my site?
**A:** No, the script is small (15KB) and loads asynchronously after the page.

### Q: What if customer already has a discount?
**A:** The popup won't show - it checks for existing discounts first.

### Q: Can I change the discount code?
**A:** Yes, edit `CONFIG.discountCode` in the script.

### Q: Can I use a different discount amount?
**A:** Yes, change the discount in Shopify Admin → Discounts, and update `CONFIG.discountPercent` in the script.

### Q: Will this work on mobile?
**A:** Yes, it has mobile-specific exit-intent detection.

### Q: Can I disable geo-targeting?
**A:** Yes, set `geoTargeting: false` in CONFIG.

### Q: What if I need to remove it?
**A:** Simply delete the script tag from theme.liquid - instant removal.

### Q: Does it work with Shopify POS?
**A:** No, this is for online store only.

### Q: Can I show the popup on all pages?
**A:** It only shows when customer has items in cart and tries to leave.

---

## Support & Testing Commands

### Browser Console Commands

```javascript
// Show popup immediately (testing)
HotLeathersPersonalization.testExitPopup()

// Check user profile
HotLeathersPersonalization.getProfile()

// Check cart contents
fetch('/cart.js').then(r => r.json()).then(console.log)

// Check for active discounts
fetch('/cart.js').then(r => r.json()).then(cart => {
  console.log('Has discount:', cart.total_discount > 0)
})
```

---

## Files Reference

- `hotleathers-personalization.js` - Main exit-intent script
- `thank-you-page-upsell.liquid` - Post-purchase upsell (Shopify Plus)
- `post-purchase-upsell.jsx` - Advanced post-purchase extension (optional)

---

## Final Safety Reminder

🚨 **NEVER edit your live theme directly**

Always:
1. Duplicate theme
2. Test on duplicate
3. Verify everything works
4. Then publish

If anything goes wrong, you can instantly revert to previous theme.

---

## Quick Start Summary

1. ✅ Upload `hotleathers-personalization.js` to Assets
2. ✅ Add script tag to `theme.liquid` before `</head>`
3. ✅ Test on duplicate theme
4. ✅ Customize product recommendations in thank-you page script
5. ✅ Add thank-you page script to Settings → Checkout
6. ✅ Test with test orders
7. ✅ Publish when ready

**Total install time: ~15 minutes**

---

Need help? Check the troubleshooting section or test in browser console using the commands above.

# Nugget Personalization Agent - Shopify Installation Guide

This guide will walk you through installing the Nugget Personalization Agent on your Shopify store. This script runs for **100% of users** and does not require VWO or any A/B testing platform.

## Table of Contents
- [Quick Installation](#quick-installation)
- [Detailed Step-by-Step Guide](#detailed-step-by-step-guide)
- [Verification](#verification)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## Quick Installation

### Option 1: Through Shopify Admin (Recommended)

1. Log in to your Shopify Admin
2. Go to **Online Store** → **Themes**
3. Click **Actions** → **Edit code** on your current theme
4. In the left sidebar, find and click on **theme.liquid** (under Layout)
5. Find the closing `</head>` tag
6. Paste this code **just before** the `</head>` tag:

```html
<!-- Nugget Personalization Agent -->
<script>
{{ 'personalization-agent.js' | asset_url | script_tag }}
</script>
```

7. Click **Save**
8. Upload the `personalization-agent.js` file:
   - In the left sidebar, find the **Assets** folder
   - Click **Add a new asset**
   - Click **Upload file** and select `personalization-agent.js`
   - Click **Upload**

9. Done! The personalization agent is now live.

---

## Detailed Step-by-Step Guide

### Step 1: Access Your Theme Code

1. Log in to your Shopify admin panel
2. From the left sidebar, click **Online Store**
3. Click on **Themes**
4. Find your currently active theme (it will have a "Current theme" badge)
5. Click the **Actions** dropdown button
6. Select **Edit code**

### Step 2: Upload the JavaScript File

1. In the left sidebar of the code editor, you'll see folders like:
   - Layout
   - Templates
   - Sections
   - Snippets
   - **Assets** ← Find this one
   - Config
   - Locales

2. Click on the **Assets** folder to expand it

3. Click the **Add a new asset** button (usually at the top)

4. In the popup:
   - Select **Upload file**
   - Click **Choose file**
   - Navigate to and select the `personalization-agent.js` file
   - Click **Upload**

5. Wait for the file to upload. You should see it appear in the Assets list.

### Step 3: Add the Script to Your Theme

1. In the left sidebar, find the **Layout** folder and click to expand it

2. Click on **theme.liquid** (this is your main layout file)

3. Find the `</head>` closing tag (usually around line 100-200)
   - Use Ctrl+F (Cmd+F on Mac) to search for `</head>`

4. **Just before** the `</head>` tag, add this code:

```html
<!-- Nugget Personalization Agent -->
<script src="{{ 'personalization-agent.js' | asset_url }}" defer></script>
```

**Example of what it should look like:**

```html
  ...other code...

  <!-- Nugget Personalization Agent -->
  <script src="{{ 'personalization-agent.js' | asset_url }}" defer></script>
</head>
<body>
  ...rest of your page...
```

5. Click **Save** in the top right corner

### Step 4: Verify Installation

See the [Verification](#verification) section below.

---

## Alternative Installation Methods

### Option 2: Using Shopify's Script Tag API (Advanced)

If you prefer to host the script externally or manage it programmatically:

1. Host `personalization-agent.js` on a CDN or your own server
2. Use Shopify's Script Tag API to inject it:

```bash
POST /admin/api/2024-01/script_tags.json
{
  "script_tag": {
    "event": "onload",
    "src": "https://your-cdn.com/personalization-agent.js"
  }
}
```

### Option 3: Using a Custom Liquid Section

1. Go to **Sections** in the theme code editor
2. Click **Add a new section**
3. Name it `personalization-script.liquid`
4. Add this code:

```liquid
<script src="{{ 'personalization-agent.js' | asset_url }}" defer></script>

{% schema %}
{
  "name": "Personalization Script",
  "settings": []
}
{% endschema %}
```

5. Save the section
6. Go to **theme.liquid** and add before `</head>`:

```liquid
{% section 'personalization-script' %}
```

---

## Verification

### Method 1: Browser Console Check

1. Visit your Shopify store in a web browser
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Type: `NuggetPersonalization.getProfile()`
5. Press Enter

**Expected Result:** You should see an object with user profile data:
```javascript
{
  firstVisit: "2024-01-07T...",
  visitCount: 1,
  lastVisit: "2024-01-07T...",
  viewedProducts: [],
  // ... more data
}
```

### Method 2: Check for Welcome Message

1. Visit your store
2. Open it again in a new tab or refresh after a few seconds
3. You should see a "Welcome back! Visit #2" message in the top-right corner

### Method 3: Check Network Tab

1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Refresh your store page
4. Look for `personalization-agent.js` in the list of loaded files
5. It should show status **200** (loaded successfully)

### Method 4: Check Body Classes

1. Open Developer Tools (F12)
2. Go to the **Elements** tab
3. Find the `<body>` tag
4. On first visit, it should have class: `nugget-first-visitor`
5. On return visits, it should have class: `nugget-returning-visitor`

---

## Configuration

### Enable Debug Mode

To see detailed logs in the browser console:

1. Open `personalization-agent.js` from your Shopify Assets
2. Find this line near the top:
```javascript
debug: false, // Set to true for console logging
```
3. Change it to:
```javascript
debug: true, // Set to true for console logging
```
4. Save the file

Now you'll see detailed logs like:
- `[Nugget Personalization] User profile initialized`
- `[Nugget Personalization] Page type: product`
- etc.

### Customize Welcome Message

To customize the welcome back message:

1. Open `personalization-agent.js`
2. Find the `showWelcomeBackMessage` function
3. Modify the HTML in `message.innerHTML`:

```javascript
message.innerHTML = `
  <div class="nugget-welcome-content">
    <p>Welcome back! We've missed you! 🎉</p>
    <button class="nugget-close" onclick="this.parentElement.parentElement.remove()">×</button>
  </div>
`;
```

### Customize Colors and Styling

The welcome message styling can be customized. Find this section:

```javascript
style.textContent = `
  .nugget-welcome-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000;  /* Change this color */
    color: #fff;       /* Change this color */
    padding: 15px 20px;
    border-radius: 8px;
    ...
  }
`;
```

### Disable Welcome Message

If you don't want the welcome back popup:

1. Open `personalization-agent.js`
2. Find the `personalizeForReturningVisitors` function
3. Comment out or remove this line:
```javascript
// this.showWelcomeBackMessage();  // Commented out
```

---

## Using Personalization Data in Your Theme

### CSS Targeting

The script adds classes to the `<body>` tag that you can use in your CSS:

```css
/* Style for first-time visitors */
.nugget-first-visitor .special-offer {
  display: block;
}

/* Style for returning visitors */
.nugget-returning-visitor .welcome-back-banner {
  display: block;
}

/* Style for product pages */
.nugget-page-product .recommendations {
  display: block;
}
```

### JavaScript API

Use the global API in your custom scripts:

```javascript
// Get user profile
const profile = NuggetPersonalization.getProfile();
console.log('User has visited', profile.visitCount, 'times');

// Track custom events
NuggetPersonalization.trackEvent('newsletter_signup', {
  email: 'user@example.com'
});

// Set user preferences
NuggetPersonalization.setPreference('favoriteColor', 'blue');

// Get user preferences
const color = NuggetPersonalization.getPreference('favoriteColor');
```

### Listen to Events

The script fires custom events you can listen to:

```javascript
// Listen for returning visitor detection
window.addEventListener('nugget:returningVisitor', function(e) {
  console.log('Welcome back! Visit #' + e.detail.visitCount);
});

// Listen for product history updates
window.addEventListener('nugget:productHistory', function(e) {
  console.log('User has viewed products:', e.detail.products);
});

// Listen for greeting updates
window.addEventListener('nugget:greeting', function(e) {
  console.log('Current greeting:', e.detail.greeting);
});
```

### Liquid Template Integration

You can use Liquid to show/hide content based on personalization:

```liquid
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile.isReturningVisitor) {
      // Show returning visitor content
      document.querySelector('.returning-visitor-banner').style.display = 'block';
    }
  });
</script>
```

---

## Advanced Features

### Product Recommendations

The script tracks viewed products. Use this data to show recommendations:

```javascript
window.addEventListener('nugget:productHistory', function(e) {
  const viewedProducts = e.detail.products;

  // Get the last 3 viewed products
  const recentlyViewed = viewedProducts.slice(0, 3);

  // Display them in your recommendations section
  displayRecommendations(recentlyViewed);
});
```

### Personalized Messaging

Use the time-based greeting:

```javascript
const greeting = localStorage.getItem('nugget_greeting');
document.querySelector('.hero-title').textContent = greeting + ', welcome to our store!';
```

### Cart Abandonment Detection

Track when users add items to cart:

```javascript
window.addEventListener('nugget:productHistory', function(e) {
  const profile = NuggetPersonalization.getProfile();

  if (profile.addedToCart && profile.addedToCart.length > 0) {
    // User has items in cart history
    console.log('User has previously added to cart');
  }
});
```

---

## Troubleshooting

### Script Not Loading

**Problem:** The personalization features aren't working.

**Solutions:**
1. Check that `personalization-agent.js` is in the Assets folder
2. Check the Network tab in Developer Tools for 404 errors
3. Verify the script tag in `theme.liquid` is correct
4. Clear your browser cache and try again
5. Check for JavaScript errors in the Console tab

### Welcome Message Not Showing

**Problem:** The "Welcome back" message doesn't appear.

**Solutions:**
1. Visit the site, then return in a new tab or after 24 hours
2. Clear your localStorage: In Console, run `localStorage.clear()`
3. Enable debug mode and check console logs
4. Verify the message isn't being blocked by other scripts/styles

### Product Tracking Not Working

**Problem:** Viewed products aren't being tracked.

**Solutions:**
1. Verify you're on a product page (check URL contains `/products/`)
2. Enable debug mode and look for "Product view tracked" logs
3. Check that Shopify Analytics is enabled on your store
4. Some themes may not have standard Shopify analytics integration

### LocalStorage Full

**Problem:** Browser shows "QuotaExceededError".

**Solutions:**
The script limits stored data:
- Last 50 viewed products
- Last 20 cart additions

If you still get this error:
1. Clear localStorage: `localStorage.clear()`
2. Reduce the limits in the code (find `slice(0, 50)` and change to smaller number)

### Conflicts with Other Scripts

**Problem:** The personalization script conflicts with other scripts.

**Solutions:**
1. Move the script to different position (try before other scripts or at end of `<body>`)
2. Check Console for JavaScript errors
3. Try removing `defer` from the script tag
4. Wrap your custom code in error handlers

---

## Performance Considerations

### Script Size
- The script is approximately 12KB unminified
- Consider minifying for production (use a tool like UglifyJS)
- The script loads asynchronously with `defer` attribute

### Storage Usage
- Uses localStorage for persistent data
- Typical storage: 5-10KB per user
- Data is cleaned automatically (keeps only recent items)

### Best Practices
1. Don't enable debug mode in production
2. Test on different devices and browsers
3. Monitor your site's performance metrics
4. Consider loading the script at the end of `<body>` if needed

---

## Migration from VWO

If you're migrating from VWO:

1. **Remove VWO code** from your theme (if you want complete replacement)
2. **Keep both** initially to compare behavior
3. **Data migration:** VWO and Nugget use different storage - data won't transfer automatically
4. **Testing:** Test on a development theme first

### Running Alongside VWO

If you want to run both (not recommended for same features):

1. Use different storage prefixes (change `storagePrefix` in CONFIG)
2. Target different elements/pages
3. Monitor for conflicts in Console

---

## Support and Customization

### Common Customizations

1. **Change storage duration:** Modify `cookieExpireDays` in CONFIG
2. **Change storage prefix:** Modify `storagePrefix` in CONFIG (useful for multiple stores)
3. **Add custom tracking:** Use `NuggetPersonalization.trackEvent()`
4. **Add custom preferences:** Use `setPreference()` and `getPreference()`

### Getting Help

If you encounter issues:

1. Enable debug mode and check console logs
2. Verify installation steps were followed correctly
3. Check for JavaScript errors in Console
4. Test in incognito/private browsing mode
5. Test on different browsers

---

## Security and Privacy

### Data Storage
- All data is stored locally in the user's browser
- No data is sent to external servers
- Users can clear data by clearing browser storage

### GDPR/Privacy Compliance
- Consider adding a cookie consent banner
- Provide users ability to opt-out
- Include in your privacy policy

Example opt-out code:
```javascript
// Allow users to opt-out
localStorage.setItem('nugget_opt_out', 'true');

// Check for opt-out in the script
if (localStorage.getItem('nugget_opt_out') === 'true') {
  // Don't initialize personalization
  return;
}
```

---

## Next Steps

After installation:

1. ✅ Verify the script is working (see [Verification](#verification))
2. ✅ Customize the welcome message to match your brand
3. ✅ Add CSS styling for personalization classes
4. ✅ Implement product recommendations
5. ✅ Test on mobile devices
6. ✅ Monitor performance impact
7. ✅ Build custom features using the API

---

## Quick Reference

### File Location
```
Assets/personalization-agent.js
```

### Script Tag Location
```
Layout/theme.liquid (before </head>)
```

### API Reference
```javascript
NuggetPersonalization.getProfile()
NuggetPersonalization.updateProfile(data)
NuggetPersonalization.trackEvent(name, data)
NuggetPersonalization.setPreference(key, value)
NuggetPersonalization.getPreference(key)
```

### Body Classes Added
```
.nugget-first-visitor
.nugget-returning-visitor
.nugget-page-home
.nugget-page-product
.nugget-page-collection
.nugget-page-cart
.nugget-page-checkout
.nugget-page-search
```

### Events Fired
```
nugget:returningVisitor
nugget:productHistory
nugget:greeting
```

---

**Version:** 1.0.0
**Last Updated:** January 2026
**Compatible with:** All Shopify themes

---

## Examples

See `EXAMPLES.md` for complete code examples and use cases.

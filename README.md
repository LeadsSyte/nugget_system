# Nugget Personalization Agent for Shopify

A powerful, standalone personalization solution for Shopify stores that works for 100% of users without requiring VWO or any A/B testing platform.

## Overview

The Nugget Personalization Agent tracks user behavior and personalizes the shopping experience based on:
- Visit history and frequency
- Viewed products and categories
- Cart activity
- Time of day
- User preferences

## Features

- **Returning Visitor Detection** - Welcome back messages and personalized content
- **Product Tracking** - Automatically tracks viewed products and collections
- **Cart Abandonment Detection** - Identifies users who added items but didn't checkout
- **Time-Based Personalization** - Greets users based on time of day
- **Customer Loyalty Tiers** - Automatically assigns tiers based on engagement
- **Privacy-Focused** - All data stored locally in user's browser
- **No External Dependencies** - Runs completely standalone
- **Easy Integration** - Simple JavaScript snippet
- **Customizable** - Extensive API for custom features

## Quick Start

1. Upload `personalization-agent.js` to your Shopify theme's Assets folder
2. Add this code to your `theme.liquid` file before the `</head>` tag:

```html
<script src="{{ 'personalization-agent.js' | asset_url }}" defer></script>
```

3. That's it! The personalization is now live for all users.

## Documentation

- **[Installation Guide](SHOPIFY_INSTALLATION_GUIDE.md)** - Complete step-by-step installation instructions
- **[Examples](EXAMPLES.md)** - Practical code examples and use cases
- **[Configuration](CONFIGURATION.md)** - Advanced customization options

## Files

### Base Personalization System
- `personalization-agent.js` - Main personalization script
- `SHOPIFY_INSTALLATION_GUIDE.md` - Detailed installation instructions
- `EXAMPLES.md` - Code examples and implementations
- `CONFIGURATION.md` - Configuration and customization guide

### Hot Leathers Customization
- `hotleathers-personalization.js` - Exit-intent with RIDE5 discount for hotleathers.com
- `thank-you-page-upsell.liquid` - Post-purchase upsell (Shopify Plus)
- `post-purchase-upsell.jsx` - Advanced post-purchase extension (optional)
- `HOTLEATHERS_INSTALLATION.md` - Complete Hot Leathers installation guide
- `HOTLEATHERS_QUICK_REFERENCE.md` - Quick reference and troubleshooting

## Hot Leathers Special Features

Custom implementation for hotleathers.com with:

### Exit-Intent with RIDE5 Discount
- Detects when customers are about to leave with items in cart
- Shows personalized popup with 5% off discount code (RIDE5)
- Geo-targeted messaging (e.g., "Don't ride off without this, New York!")
- **Only shows if no discount is already applied** (respects existing discounts)
- Safe implementation - won't break your site

### Post-Purchase Upsell
- Shows relevant product recommendations on order confirmation page
- Automatically applies RIDE5 discount to recommended products
- Smart recommendations based on what customer purchased
- Example: Bought jacket → Recommends gloves, helmet

See `HOTLEATHERS_INSTALLATION.md` for complete setup instructions.

## What It Does

### For First-Time Visitors
- Detects new visitors
- Shows welcome offers
- Displays trust signals
- Encourages newsletter signup

### For Returning Visitors
- Welcomes them back
- Shows visit count
- Displays recently viewed products
- Provides loyalty rewards
- Personalized product recommendations

## Browser Compatibility

Works on all modern browsers:
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires localStorage support

## Privacy & GDPR

- All data stored locally in user's browser
- No data sent to external servers
- Easy to add cookie consent integration
- User data export and deletion support
- Respects Do Not Track settings (configurable)

## Support

For issues or questions, refer to the documentation files or check the troubleshooting sections.

## Migration from VWO

This solution can completely replace VWO for personalization features. See the installation guide for migration instructions.

## Version

Current Version: 1.0.0
Last Updated: January 2026

## License

All rights reserved.

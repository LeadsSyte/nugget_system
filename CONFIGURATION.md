# Nugget Personalization Agent - Configuration Guide

This guide covers all configuration options and advanced customization for the Nugget Personalization Agent.

## Table of Contents
- [Basic Configuration](#basic-configuration)
- [Storage Configuration](#storage-configuration)
- [Feature Toggles](#feature-toggles)
- [Advanced Customization](#advanced-customization)
- [Performance Tuning](#performance-tuning)
- [Privacy and Compliance](#privacy-and-compliance)

---

## Basic Configuration

### CONFIG Object

All main configuration is in the `CONFIG` object at the top of `personalization-agent.js`:

```javascript
const CONFIG = {
  storagePrefix: 'nugget_',
  cookieExpireDays: 365,
  debug: false,
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storagePrefix` | String | `'nugget_'` | Prefix for all localStorage/cookie keys |
| `cookieExpireDays` | Number | `365` | Days before cookies expire |
| `debug` | Boolean | `false` | Enable console logging |

---

## Storage Configuration

### Change Storage Prefix

Useful if running multiple stores or want to avoid conflicts:

```javascript
const CONFIG = {
  storagePrefix: 'mystore_personalization_',
  // ... other config
};
```

### Cookie Expiration

Adjust how long user data persists:

```javascript
const CONFIG = {
  cookieExpireDays: 90,  // 90 days instead of 1 year
  // ... other config
};
```

For session-only (clears when browser closes):

```javascript
// In Utils.setCookie, change to:
setCookie: function(name, value) {
  // No expires = session only
  document.cookie = CONFIG.storagePrefix + name + '=' + value + ';path=/';
}
```

### Storage Limits

Control how much data is stored:

```javascript
// In UserProfile.trackProductView function:
profile.viewedProducts = viewedProducts.slice(0, 50);  // Last 50 products

// Change to store more/less:
profile.viewedProducts = viewedProducts.slice(0, 100);  // Last 100 products
profile.viewedProducts = viewedProducts.slice(0, 20);   // Last 20 products
```

```javascript
// In UserProfile.trackAddToCart function:
profile.addedToCart = addedToCart.slice(0, 20);  // Last 20 cart additions

// Adjust as needed:
profile.addedToCart = addedToCart.slice(0, 50);  // Store more
```

---

## Feature Toggles

### Disable Welcome Back Message

```javascript
// In PersonalizationEngine.personalizeForReturningVisitors:
personalizeForReturningVisitors: function() {
  if (this.profile.isReturningVisitor) {
    Utils.log('Returning visitor detected');
    document.body.classList.add('nugget-returning-visitor');

    window.dispatchEvent(new CustomEvent('nugget:returningVisitor', {
      detail: { visitCount: this.profile.visitCount }
    }));

    // Comment out this line to disable welcome message:
    // this.showWelcomeBackMessage();
  } else {
    document.body.classList.add('nugget-first-visitor');
    Utils.log('First-time visitor detected');
  }
}
```

### Disable Product Tracking

```javascript
// In PersonalizationEngine.trackPageContext:
trackPageContext: function() {
  // ... existing code ...

  // Comment out product tracking:
  /*
  if (pageType === 'product' && typeof window.ShopifyAnalytics !== 'undefined') {
    try {
      const meta = window.ShopifyAnalytics.meta;
      if (meta && meta.product) {
        UserProfile.trackProductView(
          meta.product.id,
          meta.product.title,
          meta.product.type
        );
      }
    } catch (e) {
      Utils.log('Error tracking product:', e);
    }
  }
  */
}
```

### Disable Specific Personalizations

Add feature flags to CONFIG:

```javascript
const CONFIG = {
  storagePrefix: 'nugget_',
  cookieExpireDays: 365,
  debug: false,

  // Feature flags
  features: {
    welcomeMessage: true,
    productTracking: true,
    cartTracking: true,
    timeBasedGreeting: true,
    bodyClasses: true,
    customEvents: true
  }
};
```

Then use in code:

```javascript
if (CONFIG.features.welcomeMessage) {
  this.showWelcomeBackMessage();
}

if (CONFIG.features.productTracking) {
  UserProfile.trackProductView(productId, productTitle, productType);
}
```

---

## Advanced Customization

### Custom User Profile Fields

Add custom fields to the user profile:

```javascript
// In UserProfile.init:
init: function() {
  let profile = Utils.getStorage('user_profile') || {
    firstVisit: new Date().toISOString(),
    visitCount: 0,
    lastVisit: null,
    viewedProducts: [],
    viewedCollections: [],
    addedToCart: [],
    purchaseHistory: [],
    preferences: {},

    // Add custom fields:
    customField1: null,
    customField2: [],
    metadata: {}
  };

  // ... rest of init code
}
```

### Custom Tracking Methods

Add new tracking methods to UserProfile:

```javascript
const UserProfile = {
  // ... existing methods ...

  trackNewsletterSignup: function(email) {
    const profile = this.get();
    profile.newsletterSignedUp = true;
    profile.newsletterEmail = email;
    profile.newsletterDate = new Date().toISOString();
    this.update(profile);
    Utils.log('Newsletter signup tracked');
  },

  trackSearch: function(query, resultsCount) {
    const profile = this.get();
    profile.searchHistory = profile.searchHistory || [];

    profile.searchHistory.unshift({
      query: query,
      resultsCount: resultsCount,
      timestamp: new Date().toISOString()
    });

    profile.searchHistory = profile.searchHistory.slice(0, 20);
    this.update(profile);
    Utils.log('Search tracked:', query);
  },

  trackCollectionView: function(collectionId, collectionTitle) {
    const profile = this.get();
    profile.viewedCollections = profile.viewedCollections || [];

    profile.viewedCollections.unshift({
      id: collectionId,
      title: collectionTitle,
      timestamp: new Date().toISOString()
    });

    profile.viewedCollections = profile.viewedCollections.slice(0, 30);
    this.update(profile);
    Utils.log('Collection view tracked:', collectionId);
  }
};
```

### Custom Personalization Rules

Add custom personalization logic:

```javascript
const PersonalizationEngine = {
  // ... existing code ...

  applyPersonalizations: function() {
    this.personalizeForReturningVisitors();
    this.personalizeProductRecommendations();
    this.personalizeMessaging();
    this.trackPageContext();

    // Add custom personalizations:
    this.customPersonalization1();
    this.customPersonalization2();
  },

  customPersonalization1: function() {
    // Example: VIP treatment for highly engaged users
    if (this.profile.visitCount > 20 && this.profile.viewedProducts.length > 50) {
      document.body.classList.add('nugget-vip-user');

      window.dispatchEvent(new CustomEvent('nugget:vipUser', {
        detail: {
          visitCount: this.profile.visitCount,
          viewedProducts: this.profile.viewedProducts.length
        }
      }));

      Utils.log('VIP user detected');
    }
  },

  customPersonalization2: function() {
    // Example: Detect product category preference
    const viewedProducts = this.profile.viewedProducts || [];

    if (viewedProducts.length >= 5) {
      const categories = viewedProducts.map(p => p.type).filter(Boolean);

      // Count category frequency
      const categoryCount = {};
      categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      // Find dominant category (>50% of views)
      for (const cat in categoryCount) {
        if (categoryCount[cat] / viewedProducts.length > 0.5) {
          document.body.setAttribute('data-preferred-category', cat.toLowerCase());
          Utils.log('Preferred category detected:', cat);
          break;
        }
      }
    }
  }
};
```

### Custom Events

Fire custom events for integration:

```javascript
// Example: Fire event when user becomes a "power user"
if (profile.visitCount === 10) {
  window.dispatchEvent(new CustomEvent('nugget:powerUser', {
    detail: {
      visitCount: profile.visitCount,
      message: 'User reached 10 visits!'
    }
  }));
}

// Example: Fire event for inactivity
const daysSinceLastVisit = (new Date() - new Date(profile.lastVisit)) / (1000 * 60 * 60 * 24);
if (daysSinceLastVisit > 30) {
  window.dispatchEvent(new CustomEvent('nugget:inactiveUser', {
    detail: {
      daysSinceLastVisit: Math.floor(daysSinceLastVisit)
    }
  }));
}
```

---

## Performance Tuning

### Lazy Loading

Load personalization after critical content:

```javascript
// At the bottom of the script, change initialization:
if (document.readyState === 'loading') {
  // Wait for window load instead of DOMContentLoaded
  window.addEventListener('load', function() {
    PersonalizationEngine.init();
  });
} else {
  // Small delay to not block rendering
  setTimeout(function() {
    PersonalizationEngine.init();
  }, 100);
}
```

### Debounce Expensive Operations

```javascript
// Add debounce utility
const Utils = {
  // ... existing utils ...

  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Use for expensive operations:
const debouncedTrackScroll = Utils.debounce(function(scrollDepth) {
  NuggetPersonalization.trackEvent('scroll', { depth: scrollDepth });
}, 500);

window.addEventListener('scroll', function() {
  const scrollDepth = window.scrollY / document.body.scrollHeight;
  debouncedTrackScroll(scrollDepth);
});
```

### Minification

For production, minify the script:

```bash
# Using UglifyJS
npm install -g uglify-js
uglifyjs personalization-agent.js -o personalization-agent.min.js -c -m

# Or using Terser (modern)
npm install -g terser
terser personalization-agent.js -o personalization-agent.min.js --compress --mangle
```

Then use the minified version in Shopify.

### Conditional Loading

Only load on certain pages:

```liquid
{% if template.name == 'index' or template.name == 'product' %}
  <script src="{{ 'personalization-agent.js' | asset_url }}" defer></script>
{% endif %}
```

---

## Privacy and Compliance

### GDPR Compliance

Add opt-out functionality:

```javascript
// Add to CONFIG:
const CONFIG = {
  // ... existing config ...
  respectDoNotTrack: true,
  requireConsent: false  // Set to true to require explicit consent
};

// Add consent check:
const PrivacyManager = {
  hasConsent: function() {
    if (CONFIG.requireConsent) {
      return localStorage.getItem('nugget_consent') === 'true';
    }
    return true;
  },

  giveConsent: function() {
    localStorage.setItem('nugget_consent', 'true');
    PersonalizationEngine.init();
  },

  revokeConsent: function() {
    localStorage.setItem('nugget_consent', 'false');
    this.clearAllData();
  },

  clearAllData: function() {
    // Clear all nugget data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CONFIG.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });

    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      if (c.trim().startsWith(CONFIG.storagePrefix)) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      }
    });
  },

  shouldTrack: function() {
    // Check Do Not Track
    if (CONFIG.respectDoNotTrack && navigator.doNotTrack === '1') {
      return false;
    }

    // Check consent
    if (!this.hasConsent()) {
      return false;
    }

    return true;
  }
};

// Use in initialization:
if (PrivacyManager.shouldTrack()) {
  PersonalizationEngine.init();
} else {
  Utils.log('Personalization disabled: no consent or DNT enabled');
}
```

### Expose Privacy Controls

Add to public API:

```javascript
window.NuggetPersonalization = {
  // ... existing API ...

  giveConsent: function() {
    PrivacyManager.giveConsent();
  },

  revokeConsent: function() {
    PrivacyManager.revokeConsent();
  },

  clearAllData: function() {
    PrivacyManager.clearAllData();
  },

  exportData: function() {
    // GDPR data export
    return {
      profile: UserProfile.get(),
      consent: localStorage.getItem('nugget_consent'),
      version: '1.0.0'
    };
  }
};
```

### Cookie Banner Integration

Example integration with common cookie consent tools:

```javascript
// For OneTrust
window.addEventListener('consent.onetrust', function(e) {
  if (e.detail.category === 'C0002') {  // Performance cookies
    NuggetPersonalization.giveConsent();
  }
});

// For Cookiebot
window.addEventListener('CookiebotOnAccept', function() {
  if (Cookiebot.consent.preferences) {
    NuggetPersonalization.giveConsent();
  }
});

// For custom cookie banner
document.getElementById('accept-cookies').addEventListener('click', function() {
  NuggetPersonalization.giveConsent();
});
```

---

## Multi-Store Configuration

If running multiple stores, isolate data:

```javascript
// Option 1: Use different prefix per store
const CONFIG = {
  storagePrefix: 'store1_nugget_',  // Change per store
  // ... other config
};

// Option 2: Use subdomain in prefix
const subdomain = window.location.hostname.split('.')[0];
const CONFIG = {
  storagePrefix: subdomain + '_nugget_',
  // ... other config
};

// Option 3: Store ID from Shopify
const CONFIG = {
  storagePrefix: 'shop_{{ shop.id }}_nugget_',  // Liquid variable
  // ... other config
};
```

---

## Testing Configuration

### Test Mode

Add a test mode for development:

```javascript
const CONFIG = {
  // ... existing config ...
  testMode: window.location.hostname === 'localhost' || window.location.search.includes('test=1')
};

// Use in code:
if (CONFIG.testMode) {
  console.log('TEST MODE: Would track product view', productId);
} else {
  UserProfile.trackProductView(productId, productTitle, productType);
}
```

### Mock Data for Testing

```javascript
// Add to Utils:
const Utils = {
  // ... existing utils ...

  loadMockData: function() {
    if (CONFIG.testMode) {
      const mockProfile = {
        firstVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        visitCount: 15,
        lastVisit: new Date().toISOString(),
        isReturningVisitor: true,
        viewedProducts: [
          { id: 1, title: 'Mock Product 1', type: 'Clothing' },
          { id: 2, title: 'Mock Product 2', type: 'Accessories' },
          { id: 3, title: 'Mock Product 3', type: 'Shoes' }
        ],
        addedToCart: [
          { id: 1, title: 'Mock Product 1', timestamp: new Date().toISOString() }
        ],
        preferences: {
          loyaltyTier: 'Gold',
          loyaltyDiscount: 15
        }
      };

      this.setStorage('user_profile', mockProfile);
      console.log('Mock data loaded');
    }
  }
};

// Load mock data in test mode:
if (CONFIG.testMode) {
  Utils.loadMockData();
}
```

---

## Environment-Specific Configuration

```javascript
// Detect environment
const ENV = {
  isDevelopment: window.location.hostname.includes('myshopify.com'),
  isProduction: !window.location.hostname.includes('myshopify.com'),
  isPreview: window.location.search.includes('preview_theme_id')
};

// Configure based on environment
const CONFIG = {
  storagePrefix: 'nugget_',
  cookieExpireDays: 365,
  debug: ENV.isDevelopment || ENV.isPreview,  // Auto-enable debug in dev

  features: {
    welcomeMessage: ENV.isProduction,  // Only in production
    productTracking: true,
    cartTracking: true
  }
};
```

---

## Summary

Key configuration areas:
- ✅ Basic settings in CONFIG object
- ✅ Storage limits and expiration
- ✅ Feature toggles for functionality
- ✅ Custom fields and tracking
- ✅ Performance optimization
- ✅ Privacy and GDPR compliance
- ✅ Multi-store support
- ✅ Testing and development modes

Refer to this guide when customizing the personalization agent for your specific needs!

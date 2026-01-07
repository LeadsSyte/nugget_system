/**
 * Nugget Personalization Agent for Shopify
 * Version: 1.0.0
 *
 * This script provides personalization features for 100% of users
 * without requiring VWO or other A/B testing platforms.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    storagePrefix: 'nugget_',
    cookieExpireDays: 365,
    debug: false, // Set to true for console logging
  };

  // Utility Functions
  const Utils = {
    log: function(message, data) {
      if (CONFIG.debug) {
        console.log('[Nugget Personalization]', message, data || '');
      }
    },

    // Local Storage helpers
    setStorage: function(key, value) {
      try {
        localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value));
        return true;
      } catch (e) {
        this.log('Storage error:', e);
        return false;
      }
    },

    getStorage: function(key) {
      try {
        const item = localStorage.getItem(CONFIG.storagePrefix + key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        this.log('Storage retrieval error:', e);
        return null;
      }
    },

    // Cookie helpers
    setCookie: function(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = CONFIG.storagePrefix + name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
    },

    getCookie: function(name) {
      const nameEQ = CONFIG.storagePrefix + name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }
  };

  // User Profile Manager
  const UserProfile = {
    init: function() {
      let profile = Utils.getStorage('user_profile') || {
        firstVisit: new Date().toISOString(),
        visitCount: 0,
        lastVisit: null,
        viewedProducts: [],
        viewedCollections: [],
        addedToCart: [],
        purchaseHistory: [],
        preferences: {}
      };

      profile.visitCount++;
      profile.lastVisit = new Date().toISOString();
      profile.isReturningVisitor = profile.visitCount > 1;

      Utils.setStorage('user_profile', profile);
      Utils.log('User profile initialized:', profile);
      return profile;
    },

    get: function() {
      return Utils.getStorage('user_profile');
    },

    update: function(data) {
      const profile = this.get();
      const updated = Object.assign({}, profile, data);
      Utils.setStorage('user_profile', updated);
      return updated;
    },

    trackProductView: function(productId, productTitle, productType) {
      const profile = this.get();
      const viewedProducts = profile.viewedProducts || [];

      // Add to beginning of array, limit to last 50 products
      viewedProducts.unshift({
        id: productId,
        title: productTitle,
        type: productType,
        timestamp: new Date().toISOString()
      });

      profile.viewedProducts = viewedProducts.slice(0, 50);
      this.update(profile);
      Utils.log('Product view tracked:', productId);
    },

    trackAddToCart: function(productId, productTitle) {
      const profile = this.get();
      const addedToCart = profile.addedToCart || [];

      addedToCart.unshift({
        id: productId,
        title: productTitle,
        timestamp: new Date().toISOString()
      });

      profile.addedToCart = addedToCart.slice(0, 20);
      this.update(profile);
      Utils.log('Add to cart tracked:', productId);
    }
  };

  // Personalization Engine
  const PersonalizationEngine = {
    profile: null,

    init: function() {
      this.profile = UserProfile.init();
      this.applyPersonalizations();
      this.setupEventListeners();
      Utils.log('Personalization engine initialized');
    },

    applyPersonalizations: function() {
      this.personalizeForReturningVisitors();
      this.personalizeProductRecommendations();
      this.personalizeMessaging();
      this.trackPageContext();
    },

    personalizeForReturningVisitors: function() {
      if (this.profile.isReturningVisitor) {
        Utils.log('Returning visitor detected');

        // Add custom class to body for CSS targeting
        document.body.classList.add('nugget-returning-visitor');

        // Fire custom event for other scripts
        window.dispatchEvent(new CustomEvent('nugget:returningVisitor', {
          detail: { visitCount: this.profile.visitCount }
        }));

        // Example: Show welcome back message
        this.showWelcomeBackMessage();
      } else {
        document.body.classList.add('nugget-first-visitor');
        Utils.log('First-time visitor detected');
      }
    },

    personalizeProductRecommendations: function() {
      const viewedProducts = this.profile.viewedProducts || [];

      if (viewedProducts.length > 0) {
        Utils.log('User has viewed products:', viewedProducts.length);

        // Fire event with viewed product data
        window.dispatchEvent(new CustomEvent('nugget:productHistory', {
          detail: { products: viewedProducts }
        }));

        // Get most viewed product types for recommendations
        const productTypes = viewedProducts.map(p => p.type).filter(Boolean);
        const typeFrequency = {};
        productTypes.forEach(type => {
          typeFrequency[type] = (typeFrequency[type] || 0) + 1;
        });

        Utils.setStorage('preferred_product_types', typeFrequency);
      }
    },

    personalizeMessaging: function() {
      const timeOfDay = new Date().getHours();
      let greeting = 'Hello';

      if (timeOfDay < 12) greeting = 'Good morning';
      else if (timeOfDay < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';

      // Store for use in templates
      Utils.setStorage('greeting', greeting);

      // Fire event
      window.dispatchEvent(new CustomEvent('nugget:greeting', {
        detail: { greeting: greeting }
      }));
    },

    showWelcomeBackMessage: function() {
      // Check if we should show the message (not shown in last 24 hours)
      const lastShown = Utils.getStorage('welcome_back_shown');
      const now = new Date().getTime();

      if (!lastShown || (now - lastShown) > 24 * 60 * 60 * 1000) {
        const message = document.createElement('div');
        message.id = 'nugget-welcome-back';
        message.className = 'nugget-welcome-message';
        message.innerHTML = `
          <div class="nugget-welcome-content">
            <p>Welcome back! Visit #${this.profile.visitCount}</p>
            <button class="nugget-close" onclick="this.parentElement.parentElement.remove()">×</button>
          </div>
        `;

        // Add basic styles
        const style = document.createElement('style');
        style.textContent = `
          .nugget-welcome-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000;
            color: #fff;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: nugget-slideIn 0.3s ease-out;
          }
          .nugget-welcome-content {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .nugget-welcome-content p {
            margin: 0;
            font-size: 14px;
          }
          .nugget-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }
          @keyframes nugget-slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `;

        document.head.appendChild(style);
        document.body.appendChild(message);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          if (message.parentElement) {
            message.remove();
          }
        }, 5000);

        Utils.setStorage('welcome_back_shown', now);
      }
    },

    trackPageContext: function() {
      // Detect page type
      const path = window.location.pathname;
      let pageType = 'other';

      if (path === '/' || path === '') pageType = 'home';
      else if (path.includes('/products/')) pageType = 'product';
      else if (path.includes('/collections/')) pageType = 'collection';
      else if (path.includes('/cart')) pageType = 'cart';
      else if (path.includes('/checkout')) pageType = 'checkout';
      else if (path.includes('/search')) pageType = 'search';

      Utils.log('Page type:', pageType);
      document.body.classList.add('nugget-page-' + pageType);

      // Track product page views
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
    },

    setupEventListeners: function() {
      // Track add to cart events
      document.addEventListener('click', (e) => {
        const button = e.target.closest('[name="add"], .add-to-cart, button[type="submit"][name="add"]');
        if (button) {
          Utils.log('Add to cart button clicked');

          // Try to get product info from form
          const form = button.closest('form');
          if (form) {
            try {
              const productId = form.querySelector('[name="id"]')?.value;
              const productTitle = document.querySelector('.product-title, h1')?.textContent?.trim();

              if (productId) {
                UserProfile.trackAddToCart(productId, productTitle);
              }
            } catch (e) {
              Utils.log('Error tracking add to cart:', e);
            }
          }
        }
      });

      Utils.log('Event listeners setup complete');
    }
  };

  // Public API
  window.NuggetPersonalization = {
    getProfile: function() {
      return UserProfile.get();
    },

    updateProfile: function(data) {
      return UserProfile.update(data);
    },

    trackEvent: function(eventName, eventData) {
      Utils.log('Custom event tracked:', eventName, eventData);
      window.dispatchEvent(new CustomEvent('nugget:' + eventName, {
        detail: eventData
      }));
    },

    setPreference: function(key, value) {
      const profile = UserProfile.get();
      profile.preferences = profile.preferences || {};
      profile.preferences[key] = value;
      UserProfile.update(profile);
    },

    getPreference: function(key) {
      const profile = UserProfile.get();
      return profile.preferences ? profile.preferences[key] : null;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      PersonalizationEngine.init();
    });
  } else {
    PersonalizationEngine.init();
  }

  Utils.log('Nugget Personalization Agent loaded');
})();

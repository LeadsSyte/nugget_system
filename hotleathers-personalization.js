/**
 * Hot Leathers Personalization Agent with RIDE5 Discount
 * Version: 1.0.0 - Customized for hotleathers.com
 *
 * Features:
 * - Exit-intent popup with RIDE5 discount (only if no discount active)
 * - Geo-targeted messaging
 * - Cart abandonment prevention
 * - Safe implementation (won't break site)
 */

(function() {
  'use strict';

  // Safety wrapper - if anything fails, site continues working
  try {

    // Configuration
    const CONFIG = {
      storagePrefix: 'hotleathers_',
      discountCode: 'RIDE5',
      discountPercent: 5,
      debug: false,

      // Feature flags
      features: {
        exitIntent: true,
        geoTargeting: true,
        productTracking: true
      }
    };

    // Utility Functions
    const Utils = {
      log: function(message, data) {
        if (CONFIG.debug) {
          console.log('[Hot Leathers Personalization]', message, data || '');
        }
      },

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
          return null;
        }
      },

      // Check if user already has a discount applied
      hasActiveDiscount: function() {
        try {
          // Method 1: Check cart for discount codes
          if (typeof fetch !== 'undefined') {
            return fetch('/cart.js')
              .then(response => response.json())
              .then(cart => {
                // Check if cart has any discount codes or if total_discount > 0
                const hasDiscount = cart.total_discount > 0 ||
                                   (cart.cart_level_discount_applications &&
                                    cart.cart_level_discount_applications.length > 0);

                this.log('Active discount check:', hasDiscount);
                return hasDiscount;
              })
              .catch(err => {
                this.log('Error checking discount:', err);
                return false;
              });
          }

          // Fallback: Check if discount input field has value
          const discountInput = document.querySelector('input[name="discount"]');
          if (discountInput && discountInput.value) {
            return Promise.resolve(true);
          }

          return Promise.resolve(false);
        } catch (e) {
          this.log('Error in hasActiveDiscount:', e);
          return Promise.resolve(false);
        }
      },

      // Get cart item count
      getCartCount: function() {
        try {
          return fetch('/cart.js')
            .then(response => response.json())
            .then(cart => cart.item_count || 0)
            .catch(() => 0);
        } catch (e) {
          return Promise.resolve(0);
        }
      },

      // Get user's location (approximate)
      getUserLocation: function() {
        try {
          // Try to get location from Shopify's customer data
          if (typeof Shopify !== 'undefined' && Shopify.shop) {
            return this.getStorage('user_location') || null;
          }

          // Try IP-based geolocation (free service)
          return fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              const location = {
                city: data.city,
                state: data.region_code,
                country: data.country_code
              };
              this.setStorage('user_location', location);
              this.log('Location detected:', location);
              return location;
            })
            .catch(err => {
              this.log('Location detection error:', err);
              return null;
            });
        } catch (e) {
          this.log('Error getting location:', e);
          return Promise.resolve(null);
        }
      },

      // Generate location-specific message
      getLocationMessage: function(location) {
        if (!location) return "Riding out of here?";

        const state = location.state || '';
        const city = location.city || '';

        // Custom messages by state
        const stateMessages = {
          'NY': `Don't ride off without this, New York! 🗽`,
          'CA': `California rider! Grab this before you go! 🌴`,
          'TX': `Hold up, Texas! We got you covered! 🤠`,
          'FL': `Florida rider! Don't leave empty-handed! ☀️`,
          'PA': `Pennsylvania! One more thing before you go! 🏍️`,
          'IL': `Chicago-area rider? Check this out! 🌆`,
          'OH': `Ohio! Don't ride off without this! 🏍️`,
          'MI': `Michigan rider! Wait up! 🏍️`,
          'AZ': `Arizona! Hot deal before you go! 🌵`,
          'NV': `Nevada rider! Lucky you! 🎰`
        };

        return stateMessages[state] || `Hey ${city || 'rider'}! Before you go... 🏍️`;
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
          addedToCart: [],
          exitIntentShown: false,
          location: null
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
      }
    };

    // Exit Intent Handler
    const ExitIntentHandler = {
      shown: false,
      enabled: CONFIG.features.exitIntent,

      init: function() {
        if (!this.enabled) return;

        const profile = UserProfile.get();

        // Don't show if already shown in this session
        if (profile.exitIntentShown) {
          Utils.log('Exit intent already shown this session');
          return;
        }

        // Wait 10 seconds before enabling exit intent
        setTimeout(() => {
          this.attachListeners();
          Utils.log('Exit intent listeners attached');
        }, 10000);
      },

      attachListeners: function() {
        // Desktop exit intent (mouse leaving viewport)
        document.addEventListener('mouseout', (e) => {
          if (!this.shown && e.clientY < 10 && e.relatedTarget === null) {
            this.handleExitIntent();
          }
        });

        // Mobile exit intent (back button simulation - scroll to top quickly)
        let lastScrollTop = 0;
        let scrollUpCount = 0;

        window.addEventListener('scroll', () => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          if (scrollTop < lastScrollTop && scrollTop < 100) {
            scrollUpCount++;
            if (scrollUpCount > 2 && !this.shown) {
              this.handleExitIntent();
            }
          } else {
            scrollUpCount = 0;
          }

          lastScrollTop = scrollTop;
        });
      },

      handleExitIntent: async function() {
        if (this.shown) return;

        Utils.log('Exit intent triggered');

        try {
          // Check if user has items in cart
          const cartCount = await Utils.getCartCount();
          if (cartCount === 0) {
            Utils.log('No items in cart, skipping exit intent');
            return;
          }

          // Check if user already has a discount
          const hasDiscount = await Utils.hasActiveDiscount();
          if (hasDiscount) {
            Utils.log('User already has discount, skipping exit intent');
            return;
          }

          // Get user location for personalized message
          const location = await Utils.getUserLocation();

          // Show the popup
          this.showExitPopup(location);

          // Mark as shown
          this.shown = true;
          UserProfile.update({ exitIntentShown: true });

        } catch (error) {
          Utils.log('Error handling exit intent:', error);
        }
      },

      showExitPopup: function(location) {
        // Check if popup already exists
        if (document.getElementById('hotleathers-exit-popup')) {
          return;
        }

        const locationMessage = Utils.getLocationMessage(location);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'hotleathers-exit-popup';
        overlay.innerHTML = `
          <div class="hl-popup-overlay">
            <div class="hl-popup-container">
              <button class="hl-popup-close" aria-label="Close">&times;</button>

              <div class="hl-popup-content">
                <div class="hl-popup-icon">🏍️</div>
                <h2 class="hl-popup-title">${locationMessage}</h2>
                <p class="hl-popup-subtitle">Complete your order and save ${CONFIG.discountPercent}%!</p>

                <div class="hl-discount-box">
                  <div class="hl-discount-label">USE CODE:</div>
                  <div class="hl-discount-code">${CONFIG.discountCode}</div>
                  <button class="hl-copy-code" data-code="${CONFIG.discountCode}">
                    <span class="copy-text">Copy Code</span>
                    <span class="copied-text" style="display:none;">Copied! ✓</span>
                  </button>
                </div>

                <p class="hl-popup-note">*Cannot be combined with other discounts</p>

                <button class="hl-popup-cta">Apply & Complete Order →</button>
              </div>
            </div>
          </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .hl-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: hlFadeIn 0.3s ease-out;
          }

          @keyframes hlFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes hlSlideUp {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .hl-popup-container {
            background: #1a1a1a;
            border: 2px solid #ff6600;
            border-radius: 12px;
            max-width: 500px;
            width: 100%;
            position: relative;
            animation: hlSlideUp 0.4s ease-out;
            box-shadow: 0 10px 40px rgba(255, 102, 0, 0.3);
          }

          .hl-popup-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            color: #999;
            font-size: 32px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
            transition: color 0.2s;
            z-index: 1;
          }

          .hl-popup-close:hover {
            color: #ff6600;
          }

          .hl-popup-content {
            padding: 40px 30px 30px;
            text-align: center;
          }

          .hl-popup-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }

          .hl-popup-title {
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .hl-popup-subtitle {
            color: #ccc;
            font-size: 16px;
            margin: 0 0 25px;
          }

          .hl-discount-box {
            background: #2a2a2a;
            border: 2px dashed #ff6600;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }

          .hl-discount-label {
            color: #999;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }

          .hl-discount-code {
            color: #ff6600;
            font-size: 32px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            margin-bottom: 15px;
            letter-spacing: 2px;
          }

          .hl-copy-code {
            background: #333;
            color: #fff;
            border: 1px solid #555;
            padding: 8px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }

          .hl-copy-code:hover {
            background: #444;
            border-color: #ff6600;
          }

          .hl-copy-code:active {
            transform: scale(0.95);
          }

          .hl-popup-note {
            color: #888;
            font-size: 12px;
            margin: 15px 0 20px;
            font-style: italic;
          }

          .hl-popup-cta {
            background: linear-gradient(135deg, #ff6600 0%, #ff8833 100%);
            color: #fff;
            border: none;
            padding: 15px 40px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .hl-popup-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 102, 0, 0.4);
          }

          .hl-popup-cta:active {
            transform: translateY(0);
          }

          /* Mobile responsive */
          @media (max-width: 600px) {
            .hl-popup-container {
              margin: 20px;
            }

            .hl-popup-content {
              padding: 35px 20px 25px;
            }

            .hl-popup-title {
              font-size: 20px;
            }

            .hl-discount-code {
              font-size: 28px;
            }
          }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        // Add event listeners
        const closeButton = overlay.querySelector('.hl-popup-close');
        const ctaButton = overlay.querySelector('.hl-popup-cta');
        const copyButton = overlay.querySelector('.hl-copy-code');

        // Close popup
        const closePopup = () => {
          overlay.style.animation = 'hlFadeIn 0.2s ease-out reverse';
          setTimeout(() => {
            if (overlay.parentElement) {
              overlay.remove();
            }
          }, 200);
        };

        closeButton.addEventListener('click', closePopup);

        // Close on overlay click
        overlay.querySelector('.hl-popup-overlay').addEventListener('click', (e) => {
          if (e.target === overlay.querySelector('.hl-popup-overlay')) {
            closePopup();
          }
        });

        // Copy code button
        copyButton.addEventListener('click', function(e) {
          e.preventDefault();
          const code = this.getAttribute('data-code');

          // Copy to clipboard
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
              showCopied(this);
            });
          } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showCopied(this);
          }

          function showCopied(button) {
            button.querySelector('.copy-text').style.display = 'none';
            button.querySelector('.copied-text').style.display = 'inline';
            setTimeout(() => {
              button.querySelector('.copy-text').style.display = 'inline';
              button.querySelector('.copied-text').style.display = 'none';
            }, 2000);
          }
        });

        // CTA button - apply code and go to cart
        ctaButton.addEventListener('click', function() {
          // Apply discount code
          const discountCode = CONFIG.discountCode;

          // Method 1: Redirect to cart with discount
          window.location.href = `/discount/${discountCode}?redirect=/cart`;
        });

        // Track that popup was shown
        Utils.log('Exit intent popup shown');

        // Fire custom event
        window.dispatchEvent(new CustomEvent('hotleathers:exitIntentShown', {
          detail: { discountCode: CONFIG.discountCode }
        }));
      }
    };

    // Initialize everything when DOM is ready
    const init = function() {
      Utils.log('Hot Leathers Personalization initializing...');

      // Initialize user profile
      const profile = UserProfile.init();

      // Initialize exit intent (after 10 second delay)
      ExitIntentHandler.init();

      // Make API available globally
      window.HotLeathersPersonalization = {
        getProfile: () => UserProfile.get(),
        updateProfile: (data) => UserProfile.update(data),
        showExitIntent: () => ExitIntentHandler.handleExitIntent(),
        testExitPopup: () => ExitIntentHandler.showExitPopup(null) // For testing
      };

      Utils.log('Hot Leathers Personalization initialized');
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

  } catch (error) {
    // Silent fail - site continues working
    console.error('Hot Leathers Personalization error:', error);
  }

})();

/**
 * Hot Leathers Personalization Agent - A/B TEST VERSION
 * Version: 1.0.0-AB-TEST
 *
 * This version runs exit-intent for 50% of traffic
 * to measure conversion rate lift
 */

(function() {
  'use strict';

  try {

    // ============================================
    // A/B TEST CONFIGURATION
    // ============================================
    const AB_TEST_CONFIG = {
      enabled: true,                    // Set to false to disable A/B test (show to 100%)
      testPercentage: 50,               // Percentage of users in TEST group (show exit-intent)
      testName: 'exit_intent_ride5',    // Name for tracking
      cookieDuration: 30                // Days to remember group assignment
    };

    // Configuration
    const CONFIG = {
      storagePrefix: 'hotleathers_',
      discountCode: 'RIDE5',
      discountPercent: 5,
      debug: false,

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
          console.log('[Hot Leathers AB Test]', message, data || '');
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
      },

      hasActiveDiscount: function() {
        try {
          if (typeof fetch !== 'undefined') {
            return fetch('/cart.js')
              .then(response => response.json())
              .then(cart => {
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
          return Promise.resolve(false);
        } catch (e) {
          this.log('Error in hasActiveDiscount:', e);
          return Promise.resolve(false);
        }
      },

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

      getUserLocation: function() {
        try {
          const cached = this.getStorage('user_location');
          if (cached) return Promise.resolve(cached);

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

      getLocationMessage: function(location) {
        if (!location) return "Riding out of here?";

        const state = location.state || '';
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

        return stateMessages[state] || `Hey ${location.city || 'rider'}! Before you go... 🏍️`;
      }
    };

    // ============================================
    // A/B TEST MANAGER
    // ============================================
    const ABTestManager = {
      init: function() {
        if (!AB_TEST_CONFIG.enabled) {
          // A/B test disabled, everyone gets exit-intent
          this.userGroup = 'test';
          Utils.log('A/B test disabled - showing exit-intent to all users');
          return 'test';
        }

        // Check if user already assigned to a group
        let group = Utils.getCookie('ab_test_group');

        if (!group) {
          // Assign user to a group
          const random = Math.random() * 100;
          group = random < AB_TEST_CONFIG.testPercentage ? 'test' : 'control';

          // Store group assignment
          Utils.setCookie('ab_test_group', group, AB_TEST_CONFIG.cookieDuration);
          Utils.setStorage('ab_test_group', group);

          Utils.log('User assigned to group:', group);
        } else {
          Utils.log('User already in group:', group);
        }

        this.userGroup = group;
        this.trackAssignment(group);

        return group;
      },

      isInTestGroup: function() {
        return this.userGroup === 'test';
      },

      trackAssignment: function(group) {
        // Track group assignment
        Utils.setStorage('ab_test_data', {
          group: group,
          testName: AB_TEST_CONFIG.testName,
          assignedAt: new Date().toISOString(),
          exitIntentShown: false,
          exitIntentClicked: false,
          converted: false
        });

        // Fire event for external analytics
        window.dispatchEvent(new CustomEvent('hotleathers:abTestAssigned', {
          detail: {
            group: group,
            testName: AB_TEST_CONFIG.testName
          }
        }));

        // Send to Google Analytics if available
        this.sendToAnalytics('ab_test_assigned', {
          test_name: AB_TEST_CONFIG.testName,
          test_group: group
        });
      },

      trackEvent: function(eventName, data) {
        const testData = Utils.getStorage('ab_test_data') || {};
        testData[eventName] = true;
        testData[eventName + '_at'] = new Date().toISOString();

        if (data) {
          testData[eventName + '_data'] = data;
        }

        Utils.setStorage('ab_test_data', testData);
        Utils.log('AB Test Event:', eventName, testData);

        // Fire custom event
        window.dispatchEvent(new CustomEvent('hotleathers:abTestEvent', {
          detail: {
            group: this.userGroup,
            event: eventName,
            data: data,
            testName: AB_TEST_CONFIG.testName
          }
        }));

        // Send to analytics
        this.sendToAnalytics(eventName, {
          test_name: AB_TEST_CONFIG.testName,
          test_group: this.userGroup,
          ...data
        });
      },

      sendToAnalytics: function(eventName, data) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
          gtag('event', eventName, data);
          Utils.log('Sent to GA4:', eventName, data);
        }

        // Google Universal Analytics
        if (typeof ga !== 'undefined') {
          ga('send', 'event', 'AB Test', eventName, this.userGroup);
          Utils.log('Sent to GA Universal:', eventName);
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
          fbq('trackCustom', eventName, data);
          Utils.log('Sent to Facebook Pixel:', eventName);
        }

        // Shopify Analytics
        if (typeof window.ShopifyAnalytics !== 'undefined') {
          try {
            window.ShopifyAnalytics.lib.track(eventName, data);
            Utils.log('Sent to Shopify Analytics:', eventName);
          } catch (e) {
            Utils.log('Shopify Analytics error:', e);
          }
        }
      },

      getTestData: function() {
        return Utils.getStorage('ab_test_data');
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

        // Check if user is in test group
        if (!ABTestManager.isInTestGroup()) {
          Utils.log('User in CONTROL group - exit-intent disabled');
          return;
        }

        Utils.log('User in TEST group - exit-intent enabled');

        const profile = UserProfile.get();

        if (profile.exitIntentShown) {
          Utils.log('Exit intent already shown this session');
          return;
        }

        setTimeout(() => {
          this.attachListeners();
          Utils.log('Exit intent listeners attached');
        }, 10000);
      },

      attachListeners: function() {
        // Desktop exit intent
        document.addEventListener('mouseout', (e) => {
          if (!this.shown && e.clientY < 10 && e.relatedTarget === null) {
            this.handleExitIntent();
          }
        });

        // Mobile exit intent
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
        ABTestManager.trackEvent('exit_intent_triggered');

        try {
          const cartCount = await Utils.getCartCount();
          if (cartCount === 0) {
            Utils.log('No items in cart, skipping exit intent');
            return;
          }

          const hasDiscount = await Utils.hasActiveDiscount();
          if (hasDiscount) {
            Utils.log('User already has discount, skipping exit intent');
            ABTestManager.trackEvent('exit_intent_blocked_has_discount');
            return;
          }

          const location = await Utils.getUserLocation();

          this.showExitPopup(location);

          this.shown = true;
          UserProfile.update({ exitIntentShown: true });
          ABTestManager.trackEvent('exit_intent_shown');

        } catch (error) {
          Utils.log('Error handling exit intent:', error);
        }
      },

      showExitPopup: function(location) {
        if (document.getElementById('hotleathers-exit-popup')) {
          return;
        }

        const locationMessage = Utils.getLocationMessage(location);

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

        const closeButton = overlay.querySelector('.hl-popup-close');
        const ctaButton = overlay.querySelector('.hl-popup-cta');
        const copyButton = overlay.querySelector('.hl-copy-code');

        const closePopup = () => {
          ABTestManager.trackEvent('exit_intent_closed');
          overlay.style.animation = 'hlFadeIn 0.2s ease-out reverse';
          setTimeout(() => {
            if (overlay.parentElement) {
              overlay.remove();
            }
          }, 200);
        };

        closeButton.addEventListener('click', closePopup);

        overlay.querySelector('.hl-popup-overlay').addEventListener('click', (e) => {
          if (e.target === overlay.querySelector('.hl-popup-overlay')) {
            closePopup();
          }
        });

        copyButton.addEventListener('click', function(e) {
          e.preventDefault();
          const code = this.getAttribute('data-code');

          ABTestManager.trackEvent('exit_intent_code_copied');

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
              showCopied(this);
            });
          } else {
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

        ctaButton.addEventListener('click', function() {
          ABTestManager.trackEvent('exit_intent_cta_clicked');
          window.location.href = `/discount/${CONFIG.discountCode}?redirect=/cart`;
        });

        Utils.log('Exit intent popup shown');

        window.dispatchEvent(new CustomEvent('hotleathers:exitIntentShown', {
          detail: { discountCode: CONFIG.discountCode }
        }));
      }
    };

    // Initialize
    const init = function() {
      Utils.log('Hot Leathers A/B Test initializing...');

      // Initialize A/B test and get user group
      ABTestManager.init();

      // Initialize user profile
      const profile = UserProfile.init();

      // Initialize exit intent (only for test group)
      ExitIntentHandler.init();

      // Make API available globally
      window.HotLeathersPersonalization = {
        getProfile: () => UserProfile.get(),
        updateProfile: (data) => UserProfile.update(data),
        showExitIntent: () => ExitIntentHandler.handleExitIntent(),
        testExitPopup: () => ExitIntentHandler.showExitPopup(null),

        // A/B Test API
        getTestGroup: () => ABTestManager.userGroup,
        getTestData: () => ABTestManager.getTestData(),
        isInTestGroup: () => ABTestManager.isInTestGroup(),
        trackConversion: () => ABTestManager.trackEvent('converted')
      };

      Utils.log('Hot Leathers A/B Test initialized - Group:', ABTestManager.userGroup);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

  } catch (error) {
    console.error('Hot Leathers Personalization error:', error);
  }

})();

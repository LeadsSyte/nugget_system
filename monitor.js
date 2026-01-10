/**
 * Revenue Recovery Listener
 * Monitors user friction on registration/deposit forms and triggers context-aware Zipchat concierge
 *
 * @version 1.0.0
 * @author CRO Engineering Team
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Timing thresholds
        DWELL_TIME_THRESHOLD: 20000, // 20 seconds
        EXIT_INTENT_THRESHOLD: 10, // pixels from top
        EXIT_INTENT_VELOCITY: 50, // pixels per 100ms
        DEBOUNCE_DELAY: 500, // ms

        // Selectors
        FORM_SELECTOR: 'form[name="registration"], form[id*="register"], form[id*="deposit"], form.registration-form, form.deposit-form',
        ERROR_SELECTORS: [
            '.error-message',
            '.validation-red',
            '.field-error',
            '.error',
            '[class*="error"]',
            '[aria-invalid="true"]'
        ],

        // State tracking
        triggers: {
            dwellTime: false,
            errorDetection: false,
            exitIntent: false
        },

        // Track which fields have already triggered
        triggeredFields: new Set(),

        // Concierge card shown state
        cardShown: false
    };

    // State management
    let dwellTimer = null;
    let currentField = null;
    let lastMouseY = 0;
    let lastMouseTime = Date.now();
    let isZipChatReady = false;

    /**
     * Initialize the Revenue Recovery Listener
     */
    function init() {
        console.log('[RRL] Revenue Recovery Listener initializing...');

        // Wait for Zipchat to be ready
        waitForZipChat(() => {
            isZipChatReady = true;
            console.log('[RRL] Zipchat detected and ready');
        });

        // Find and monitor forms
        const forms = document.querySelectorAll(CONFIG.FORM_SELECTOR);

        if (forms.length === 0) {
            console.warn('[RRL] No registration/deposit forms found. Waiting for dynamic content...');
            // Use MutationObserver to watch for forms added later
            watchForForms();
        } else {
            console.log(`[RRL] Found ${forms.length} form(s) to monitor`);
            forms.forEach(attachFormListeners);
        }

        // Attach exit intent listener
        attachExitIntentListener();

        // Inject custom styles
        injectStyles();
    }

    /**
     * Wait for Zipchat to load
     */
    function waitForZipChat(callback, maxAttempts = 30) {
        let attempts = 0;

        const checkZipChat = setInterval(() => {
            attempts++;

            // Check for Zipchat global object
            if (window.ZipChat || window.zipchat || window.$crisp || window.Intercom) {
                clearInterval(checkZipChat);

                // Normalize the API
                if (window.ZipChat) {
                    window.ZipChatAPI = window.ZipChat;
                } else if (window.zipchat) {
                    window.ZipChatAPI = window.zipchat;
                } else if (window.$crisp) {
                    // Crisp fallback (some Zipchat implementations use Crisp)
                    window.ZipChatAPI = {
                        open: () => window.$crisp.push(['do', 'chat:open']),
                        close: () => window.$crisp.push(['do', 'chat:close']),
                        hide: () => window.$crisp.push(['do', 'chat:hide']),
                        show: () => window.$crisp.push(['do', 'chat:show']),
                        sendMessage: (msg) => window.$crisp.push(['do', 'message:send', ['text', msg]])
                    };
                }

                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkZipChat);
                console.warn('[RRL] Zipchat not detected after 30 attempts. Proceeding anyway...');
                callback();
            }
        }, 1000);
    }

    /**
     * Watch for forms added dynamically
     */
    function watchForForms() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && node.matches(CONFIG.FORM_SELECTOR)) {
                            console.log('[RRL] New form detected:', node);
                            attachFormListeners(node);
                        } else if (node.querySelectorAll) {
                            const forms = node.querySelectorAll(CONFIG.FORM_SELECTOR);
                            forms.forEach(attachFormListeners);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Attach listeners to a form
     */
    function attachFormListeners(form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        console.log(`[RRL] Attaching listeners to ${inputs.length} fields`);

        inputs.forEach((input) => {
            // Focus event - start dwell timer
            input.addEventListener('focus', handleFieldFocus);

            // Input event - reset dwell timer
            input.addEventListener('input', handleFieldInput);

            // Blur event - clear dwell timer
            input.addEventListener('blur', handleFieldBlur);
        });

        // Watch for error messages in the form
        watchForErrors(form);
    }

    /**
     * Handle field focus - TRIGGER A (Dwell Time) start
     */
    function handleFieldFocus(event) {
        currentField = event.target;
        const fieldName = getFieldName(currentField);

        console.log(`[RRL] User focused on: ${fieldName}`);

        // Clear any existing timer
        if (dwellTimer) {
            clearTimeout(dwellTimer);
        }

        // Start dwell timer
        dwellTimer = setTimeout(() => {
            // Check if user hasn't already triggered this field
            const fieldId = getFieldIdentifier(currentField);
            if (!CONFIG.triggeredFields.has(fieldId)) {
                console.log(`[RRL] TRIGGER A: Dwell time exceeded on ${fieldName}`);
                CONFIG.triggers.dwellTime = true;
                triggerConcierge('dwell', fieldName, currentField);
            }
        }, CONFIG.DWELL_TIME_THRESHOLD);
    }

    /**
     * Handle field input - reset dwell timer
     */
    function handleFieldInput(event) {
        // User is typing, reset the dwell timer
        if (dwellTimer) {
            clearTimeout(dwellTimer);
        }

        // Restart dwell timer
        dwellTimer = setTimeout(() => {
            const fieldName = getFieldName(event.target);
            const fieldId = getFieldIdentifier(event.target);

            if (!CONFIG.triggeredFields.has(fieldId)) {
                console.log(`[RRL] TRIGGER A: Dwell time exceeded on ${fieldName} (during input)`);
                CONFIG.triggers.dwellTime = true;
                triggerConcierge('dwell', fieldName, event.target);
            }
        }, CONFIG.DWELL_TIME_THRESHOLD);
    }

    /**
     * Handle field blur - clear dwell timer
     */
    function handleFieldBlur(event) {
        if (dwellTimer) {
            clearTimeout(dwellTimer);
            dwellTimer = null;
        }
        currentField = null;
    }

    /**
     * Watch for error messages - TRIGGER B
     */
    function watchForErrors(form) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if the added node is an error element
                        CONFIG.ERROR_SELECTORS.forEach((selector) => {
                            if (node.matches && node.matches(selector)) {
                                handleErrorDetected(node);
                            }
                        });
                    }
                });

                // Check for attribute changes (aria-invalid, etc.)
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-invalid') {
                    if (mutation.target.getAttribute('aria-invalid') === 'true') {
                        handleErrorDetected(mutation.target);
                    }
                }
            });
        });

        observer.observe(form, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-invalid', 'class']
        });

        // Also check for existing errors on interval
        setInterval(() => {
            CONFIG.ERROR_SELECTORS.forEach((selector) => {
                const errors = form.querySelectorAll(selector);
                errors.forEach((error) => {
                    if (isVisible(error)) {
                        handleErrorDetected(error);
                    }
                });
            });
        }, 2000);
    }

    /**
     * Handle error detection - TRIGGER B
     */
    function handleErrorDetected(errorElement) {
        if (CONFIG.triggers.errorDetection) return; // Already triggered

        // Find the associated field
        const field = findAssociatedField(errorElement);
        const fieldName = field ? getFieldName(field) : 'this field';

        console.log(`[RRL] TRIGGER B: Error detected on ${fieldName}`);
        CONFIG.triggers.errorDetection = true;

        triggerConcierge('error', fieldName, field);
    }

    /**
     * Attach exit intent listener - TRIGGER C
     */
    function attachExitIntentListener() {
        let exitIntentFired = false;

        document.addEventListener('mousemove', (event) => {
            const currentY = event.clientY;
            const currentTime = Date.now();
            const timeDelta = currentTime - lastMouseTime;
            const yDelta = lastMouseY - currentY; // Negative when moving up

            // Calculate velocity (pixels per 100ms)
            const velocity = timeDelta > 0 ? (yDelta / timeDelta) * 100 : 0;

            // Check if moving toward top with high velocity
            if (
                !exitIntentFired &&
                currentY <= CONFIG.EXIT_INTENT_THRESHOLD &&
                velocity >= CONFIG.EXIT_INTENT_VELOCITY &&
                yDelta > 0
            ) {
                console.log(`[RRL] TRIGGER C: Exit intent detected (velocity: ${velocity.toFixed(2)}px/100ms)`);
                CONFIG.triggers.exitIntent = true;
                exitIntentFired = true;

                const fieldName = currentField ? getFieldName(currentField) : 'registration';
                triggerConcierge('exit', fieldName, currentField);
            }

            lastMouseY = currentY;
            lastMouseTime = currentTime;
        });
    }

    /**
     * Trigger the concierge card
     */
    function triggerConcierge(triggerType, fieldName, field) {
        // Don't show multiple cards
        if (CONFIG.cardShown) {
            console.log('[RRL] Concierge card already shown, skipping...');
            return;
        }

        // Mark field as triggered
        if (field) {
            CONFIG.triggeredFields.add(getFieldIdentifier(field));
        }

        CONFIG.cardShown = true;

        // Create and show the concierge card
        showConciergeCard(triggerType, fieldName, field);

        // Track event (integrate with your analytics)
        trackEvent('concierge_triggered', {
            trigger_type: triggerType,
            field_name: fieldName,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Show the custom Concierge Card
     */
    function showConciergeCard(triggerType, fieldName, field) {
        // Remove any existing card
        const existingCard = document.getElementById('rrl-concierge-card');
        if (existingCard) {
            existingCard.remove();
        }

        // Create card element
        const card = document.createElement('div');
        card.id = 'rrl-concierge-card';
        card.className = 'rrl-concierge-card';

        // Customize message based on trigger type
        let message = '';
        let ctaText = 'Get Help Now';

        switch (triggerType) {
            case 'dwell':
                message = `Need a hand with the <strong>${fieldName}</strong>? I'm here to speed this up for you.`;
                ctaText = 'Yes, Help Me';
                break;
            case 'error':
                message = `Having trouble with <strong>${fieldName}</strong>? Let me help you fix this quickly.`;
                ctaText = 'Fix This Now';
                break;
            case 'exit':
                message = `Wait! Before you go — need help completing your <strong>${fieldName}</strong>?`;
                ctaText = 'Get Instant Help';
                break;
        }

        // Build card HTML
        card.innerHTML = `
            <div class="rrl-card-header">
                <svg class="rrl-concierge-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="rrl-card-title">VIP Concierge</span>
                <button class="rrl-close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="rrl-card-body">
                <p class="rrl-message">${message}</p>
                <button class="rrl-cta-btn">${ctaText}</button>
            </div>
        `;

        // Append to body
        document.body.appendChild(card);

        // Trigger slide-in animation
        setTimeout(() => {
            card.classList.add('rrl-show');
        }, 100);

        // Attach event listeners
        const closeBtn = card.querySelector('.rrl-close-btn');
        const ctaBtn = card.querySelector('.rrl-cta-btn');

        closeBtn.addEventListener('click', () => {
            dismissConciergeCard(card, false);
        });

        ctaBtn.addEventListener('click', () => {
            openZipChatWithContext(fieldName, field);
            dismissConciergeCard(card, true);
        });

        // Auto-dismiss after 30 seconds if no interaction
        setTimeout(() => {
            if (document.body.contains(card)) {
                dismissConciergeCard(card, false);
            }
        }, 30000);
    }

    /**
     * Dismiss the concierge card
     */
    function dismissConciergeCard(card, wasAccepted) {
        card.classList.remove('rrl-show');

        setTimeout(() => {
            if (document.body.contains(card)) {
                card.remove();
            }
            CONFIG.cardShown = false;
        }, 300);

        trackEvent('concierge_dismissed', {
            accepted: wasAccepted,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Open Zipchat with context injection
     */
    function openZipChatWithContext(fieldName, field) {
        console.log('[RRL] Opening Zipchat with context for:', fieldName);

        // Gather context
        const context = gatherUserContext(fieldName, field);

        // Try different Zipchat API methods
        if (window.ZipChatAPI) {
            // Method 1: Try to set context before opening
            if (typeof window.ZipChatAPI.setContext === 'function') {
                window.ZipChatAPI.setContext(context);
            }

            // Method 2: Send a hidden system message
            if (typeof window.ZipChatAPI.sendMessage === 'function') {
                const systemMessage = `[SYSTEM] User is currently stuck on the "${fieldName}" during registration. Help them complete it so they can get their welcome bonus. Current context: ${JSON.stringify(context)}`;

                // Send as metadata if supported
                window.ZipChatAPI.sendMessage(systemMessage);
            }

            // Method 3: Set user data/metadata
            if (typeof window.ZipChatAPI.setUserData === 'function') {
                window.ZipChatAPI.setUserData({
                    stuck_field: fieldName,
                    context: context,
                    trigger_time: new Date().toISOString()
                });
            }

            // Open the chat
            if (typeof window.ZipChatAPI.open === 'function') {
                window.ZipChatAPI.open();
            } else if (typeof window.ZipChatAPI.show === 'function') {
                window.ZipChatAPI.show();
            }
        } else {
            console.warn('[RRL] Zipchat API not available. Opening chat manually...');

            // Fallback: Try to click the Zipchat button
            const zipChatButton = document.querySelector('[id*="zipchat"], [class*="zipchat"], .crisp-client, #crisp-chatbox');
            if (zipChatButton) {
                zipChatButton.click();
            }
        }

        trackEvent('zipchat_opened', {
            field_name: fieldName,
            context: context,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Gather user context for the AI
     */
    function gatherUserContext(fieldName, field) {
        const context = {
            stuck_field: fieldName,
            field_type: field ? field.type : 'unknown',
            field_value: field ? field.value : '',
            page_url: window.location.href,
            page_title: document.title,
            time_on_page: Math.floor((Date.now() - performance.timing.navigationStart) / 1000),
            form_completion: calculateFormCompletion()
        };

        // Add field-specific hints
        if (field) {
            context.field_label = getFieldLabel(field);
            context.field_placeholder = field.placeholder || '';
            context.field_required = field.hasAttribute('required');
            context.field_pattern = field.pattern || '';
        }

        return context;
    }

    /**
     * Calculate form completion percentage
     */
    function calculateFormCompletion() {
        const forms = document.querySelectorAll(CONFIG.FORM_SELECTOR);
        if (forms.length === 0) return 0;

        let totalFields = 0;
        let filledFields = 0;

        forms.forEach((form) => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach((input) => {
                if (input.type !== 'hidden' && input.type !== 'submit') {
                    totalFields++;
                    if (input.value && input.value.trim() !== '') {
                        filledFields++;
                    }
                }
            });
        });

        return totalFields > 0 ? Math.floor((filledFields / totalFields) * 100) : 0;
    }

    /**
     * Get a human-readable field name
     */
    function getFieldName(field) {
        if (!field) return 'this field';

        // Try label
        const label = getFieldLabel(field);
        if (label) return label;

        // Try name attribute
        if (field.name) {
            return field.name
                .replace(/[-_]/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase();
        }

        // Try id
        if (field.id) {
            return field.id
                .replace(/[-_]/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase();
        }

        // Try placeholder
        if (field.placeholder) {
            return field.placeholder.toLowerCase();
        }

        // Fallback to type
        return field.type || 'field';
    }

    /**
     * Get field label
     */
    function getFieldLabel(field) {
        if (!field) return null;

        // Try associated label
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) return label.textContent.trim();
        }

        // Try parent label
        const parentLabel = field.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.replace(field.value, '').trim();
        }

        return null;
    }

    /**
     * Get unique field identifier
     */
    function getFieldIdentifier(field) {
        if (!field) return Math.random().toString();
        return field.id || field.name || field.type + '_' + Math.random();
    }

    /**
     * Find field associated with an error element
     */
    function findAssociatedField(errorElement) {
        // Try parent container with input
        const container = errorElement.closest('.form-group, .field-group, .input-group, div');
        if (container) {
            const input = container.querySelector('input, select, textarea');
            if (input) return input;
        }

        // Try sibling input
        const sibling = errorElement.previousElementSibling || errorElement.nextElementSibling;
        if (sibling && (sibling.tagName === 'INPUT' || sibling.tagName === 'SELECT' || sibling.tagName === 'TEXTAREA')) {
            return sibling;
        }

        // Try aria-describedby
        const errorId = errorElement.id;
        if (errorId) {
            const field = document.querySelector(`[aria-describedby="${errorId}"]`);
            if (field) return field;
        }

        return currentField; // Fallback to current focused field
    }

    /**
     * Check if element is visible
     */
    function isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               element.offsetWidth > 0 &&
               element.offsetHeight > 0;
    }

    /**
     * Inject custom styles
     */
    function injectStyles() {
        const styleId = 'rrl-custom-styles';

        // Don't inject if already exists
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Hide default Zipchat bubble */
            #zipchat-widget,
            .zipchat-widget,
            [id*="zipchat-launcher"],
            [class*="zipchat-launcher"],
            .crisp-client .cc-tlyw,
            .crisp-client .cc-kxkl {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            /* Concierge Card Styles */
            .rrl-concierge-card {
                position: fixed;
                right: -400px;
                bottom: 24px;
                width: 360px;
                max-width: calc(100vw - 32px);
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                transition: right 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                border: 1px solid rgba(255, 215, 0, 0.3);
            }

            .rrl-concierge-card.rrl-show {
                right: 24px;
            }

            .rrl-card-header {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 215, 0, 0.05);
            }

            .rrl-concierge-icon {
                color: #ffd700;
                margin-right: 10px;
                flex-shrink: 0;
            }

            .rrl-card-title {
                color: #ffd700;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                flex-grow: 1;
            }

            .rrl-close-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
                line-height: 1;
            }

            .rrl-close-btn:hover {
                color: rgba(255, 255, 255, 1);
            }

            .rrl-card-body {
                padding: 24px 20px;
            }

            .rrl-message {
                color: rgba(255, 255, 255, 0.9);
                font-size: 15px;
                line-height: 1.6;
                margin: 0 0 20px 0;
            }

            .rrl-message strong {
                color: #ffd700;
                font-weight: 600;
            }

            .rrl-cta-btn {
                width: 100%;
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                color: #1a1a2e;
                border: none;
                border-radius: 8px;
                padding: 14px 24px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .rrl-cta-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
                background: linear-gradient(135deg, #ffed4e 0%, #ffd700 100%);
            }

            .rrl-cta-btn:active {
                transform: translateY(0);
            }

            /* Mobile responsiveness */
            @media (max-width: 480px) {
                .rrl-concierge-card {
                    right: -100%;
                    bottom: 16px;
                    width: calc(100vw - 32px);
                }

                .rrl-concierge-card.rrl-show {
                    right: 16px;
                }

                .rrl-message {
                    font-size: 14px;
                }

                .rrl-cta-btn {
                    font-size: 14px;
                    padding: 12px 20px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Track events (integrate with your analytics platform)
     */
    function trackEvent(eventName, eventData) {
        console.log(`[RRL] Event: ${eventName}`, eventData);

        // Google Analytics 4
        if (window.gtag) {
            window.gtag('event', eventName, eventData);
        }

        // Google Analytics Universal
        if (window.ga) {
            window.ga('send', 'event', 'Revenue_Recovery', eventName, JSON.stringify(eventData));
        }

        // Facebook Pixel
        if (window.fbq) {
            window.fbq('trackCustom', eventName, eventData);
        }

        // Custom tracking
        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...eventData
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API for testing and debugging
    window.RevenueRecoveryListener = {
        version: '1.0.0',
        config: CONFIG,
        forceTestTrigger: function(type) {
            const fieldName = currentField ? getFieldName(currentField) : 'test field';
            triggerConcierge(type || 'dwell', fieldName, currentField);
        },
        resetState: function() {
            CONFIG.triggeredFields.clear();
            CONFIG.cardShown = false;
            CONFIG.triggers = {
                dwellTime: false,
                errorDetection: false,
                exitIntent: false
            };
        }
    };

})();

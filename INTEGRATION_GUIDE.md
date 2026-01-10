# Revenue Recovery Listener - Integration Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Zipchat API Integration](#zipchat-api-integration)
3. [Context Injection Methods](#context-injection-methods)
4. [Google Tag Manager Setup](#google-tag-manager-setup)
5. [Configuration](#configuration)
6. [Testing & Debugging](#testing--debugging)
7. [Analytics Integration](#analytics-integration)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install via Google Tag Manager (Recommended)

**Step 1:** Create a new Custom HTML tag in GTM

**Step 2:** Copy the entire contents of `monitor.js` into the tag

**Step 3:** Set the trigger to "All Pages" or specific pages with registration/deposit forms

**Step 4:** Add Zipchat widget code to your site (if not already present)

**Step 5:** Publish the GTM container

### 2. Direct Installation

```html
<!-- Add before closing </body> tag -->
<script src="/path/to/monitor.js"></script>
```

---

## Zipchat API Integration

### Understanding Zipchat's API

Zipchat provides several JavaScript APIs for programmatic control. The Revenue Recovery Listener supports multiple Zipchat implementations:

### Method 1: Official Zipchat API (Recommended)

```javascript
// Zipchat typically exposes a global object:
window.ZipChat = {
    open: function() { /* Opens the chat widget */ },
    close: function() { /* Closes the chat widget */ },
    hide: function() { /* Hides the launcher */ },
    show: function() { /* Shows the launcher */ },
    setContext: function(contextObject) { /* Sets conversation context */ },
    sendMessage: function(message) { /* Sends a message */ },
    setUserData: function(userData) { /* Sets user metadata */ }
};
```

### Method 2: Crisp-Based Implementation

Some Zipchat installations use Crisp as the underlying engine:

```javascript
// If Zipchat is built on Crisp
window.$crisp = [];
window.$crisp.push(['do', 'chat:open']);
window.$crisp.push(['do', 'chat:hide']);
window.$crisp.push(['set', 'session:data', [[['stuck_field', 'email']]]]);
window.$crisp.push(['do', 'message:send', ['text', 'System message']]);
```

### Method 3: Custom Zipchat Implementations

```javascript
// Check your Zipchat documentation for specific API methods
// Common patterns:
window.zipchat.openChat();
window.zipchat.setUserContext({ field: 'email' });
```

---

## Context Injection Methods

The Revenue Recovery Listener uses **3 context injection strategies** to ensure the AI agent has full context about the user's situation:

### Strategy 1: `setContext()` - Pre-Chat Context

This sets context **before** opening the chat, so the AI is aware from the first message.

```javascript
// Inside monitor.js (already implemented)
if (typeof window.ZipChatAPI.setContext === 'function') {
    window.ZipChatAPI.setContext({
        stuck_field: "email",
        field_type: "email",
        field_label: "Email Address",
        page_url: window.location.href,
        trigger_type: "dwell",
        time_on_page: 45
    });
}
```

**How it works:**
- Context is injected as session metadata
- The AI agent can access this in the conversation
- Best for Zipchat implementations that support structured context

**Zipchat Backend Configuration:**
In your Zipchat admin panel, you may need to configure how context is passed to the AI:

```javascript
// Example: Zipchat AI Prompt Configuration
// (Configure in Zipchat dashboard under "AI Settings")

System Prompt:
"You are a VIP concierge for [Your Casino Name]. Your goal is to help users
complete registration and make their first deposit to claim their welcome bonus.

When a user joins the chat, check the session context for 'stuck_field'.
If present, the user is experiencing friction on that specific field.
Proactively help them complete it.

Context variables:
- stuck_field: The field they're stuck on
- field_type: Type of input (email, password, etc.)
- trigger_type: How they were brought here (dwell, error, exit)
- form_completion: Percentage of form completed (0-100)

Be concise, helpful, and focused on getting them to their welcome bonus."
```

---

### Strategy 2: `sendMessage()` - Hidden System Message

This sends a **hidden instruction message** that the AI reads but the user doesn't see.

```javascript
// Inside monitor.js (already implemented)
if (typeof window.ZipChatAPI.sendMessage === 'function') {
    const systemMessage = `[SYSTEM] User is currently stuck on the "email"
    during registration. Help them complete it so they can get their welcome bonus.
    Current context: {"stuck_field":"email","form_completion":40}`;

    window.ZipChatAPI.sendMessage(systemMessage);
}
```

**How to configure hidden messages in Zipchat:**

1. **Option A:** Configure Zipchat to hide messages starting with `[SYSTEM]`

```javascript
// Add to your Zipchat initialization
window.ZipChatAPI.onMessageSend((message) => {
    if (message.startsWith('[SYSTEM]')) {
        return { visible: false }; // Hide from user, but AI sees it
    }
});
```

2. **Option B:** Use Zipchat's `sendInternalMessage()` method (if available)

```javascript
window.ZipChatAPI.sendInternalMessage(
    "User stuck on email field. Help complete registration."
);
```

---

### Strategy 3: `setUserData()` - User Metadata

This attaches metadata to the user session, which the AI can query.

```javascript
// Inside monitor.js (already implemented)
if (typeof window.ZipChatAPI.setUserData === 'function') {
    window.ZipChatAPI.setUserData({
        stuck_field: "email",
        context: {
            field_type: "email",
            field_label: "Email Address",
            field_required: true,
            trigger_time: "2025-01-10T14:30:00Z"
        },
        page_url: window.location.href
    });
}
```

**Access in Zipchat AI:**

Configure your AI agent to check user metadata:

```javascript
// Zipchat AI Agent Configuration (pseudo-code)
if (user.metadata.stuck_field) {
    const field = user.metadata.stuck_field;
    respondWith(`I see you're working on the ${field} field. Let me help!`);
}
```

---

## Google Tag Manager Setup

### Step-by-Step GTM Installation

#### Tag Configuration

1. **Tag Type:** Custom HTML
2. **Tag Name:** "Revenue Recovery Listener"
3. **HTML Content:** Paste entire `monitor.js` file

```html
<script>
(function() {
    'use strict';
    // ... paste entire monitor.js content here ...
})();
</script>
```

4. **Triggering:**
   - **Trigger Type:** Page View
   - **Trigger Name:** "Registration Pages"
   - **Conditions:**
     - Page URL contains `/register`
     - OR Page URL contains `/signup`
     - OR Page URL contains `/deposit`
     - OR Page Path equals `/create-account`

5. **Advanced Settings:**
   - **Tag firing priority:** 100 (load early)
   - **Fire tag on:** Page load

#### Data Layer Variables (Optional but Recommended)

Create these variables to track performance:

```javascript
// Push events to data layer
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
    'event': 'rrl_concierge_triggered',
    'trigger_type': 'dwell',
    'field_name': 'email',
    'form_completion': 40
});
```

---

## Configuration

### Customizing Trigger Thresholds

Edit the `CONFIG` object in `monitor.js`:

```javascript
const CONFIG = {
    // Timing thresholds
    DWELL_TIME_THRESHOLD: 20000, // 20 seconds (adjust based on A/B testing)
    EXIT_INTENT_THRESHOLD: 10,   // pixels from top
    EXIT_INTENT_VELOCITY: 50,    // pixels per 100ms

    // Form selectors (add your custom forms)
    FORM_SELECTOR: 'form[name="registration"], form.my-custom-form',

    // Error selectors (add your custom error classes)
    ERROR_SELECTORS: [
        '.error-message',
        '.my-custom-error-class'
    ]
};
```

### Customizing Messages

Edit the `showConciergeCard()` function:

```javascript
switch (triggerType) {
    case 'dwell':
        message = `Stuck on <strong>${fieldName}</strong>? Click here for instant help.`;
        ctaText = 'Help Me';
        break;
    case 'error':
        message = `Let's fix this <strong>${fieldName}</strong> issue together.`;
        ctaText = 'Fix It Now';
        break;
    // Add custom triggers here
}
```

### Theming

Add custom CSS classes to match your brand:

```javascript
// In monitor.js, modify the card creation
card.className = 'rrl-concierge-card rrl-theme-blue'; // Blue variant
// or
card.className = 'rrl-concierge-card rrl-theme-red'; // Red variant
// or
card.className = 'rrl-concierge-card rrl-theme-purple'; // Purple variant
```

---

## Testing & Debugging

### Testing in Development

#### 1. Force Trigger Test

Open browser console and run:

```javascript
// Test dwell trigger
window.RevenueRecoveryListener.forceTestTrigger('dwell');

// Test error trigger
window.RevenueRecoveryListener.forceTestTrigger('error');

// Test exit intent trigger
window.RevenueRecoveryListener.forceTestTrigger('exit');
```

#### 2. Check Zipchat Integration

```javascript
// Verify Zipchat is loaded
console.log(window.ZipChat);
console.log(window.ZipChatAPI);

// Test Zipchat open
window.ZipChatAPI.open();
```

#### 3. Reset State

```javascript
// Clear all triggered fields and reset
window.RevenueRecoveryListener.resetState();
```

#### 4. Monitor Events

```javascript
// Watch for RRL events in console
// All events are prefixed with [RRL]
```

### Debugging Checklist

- [ ] Zipchat widget loads successfully
- [ ] Default Zipchat bubble is hidden
- [ ] Forms are detected (`[RRL] Found X form(s) to monitor`)
- [ ] Input fields have listeners attached
- [ ] Concierge card appears on trigger
- [ ] Clicking CTA opens Zipchat
- [ ] Context is passed to Zipchat
- [ ] Analytics events fire correctly

---

## Analytics Integration

### Event Tracking

The Revenue Recovery Listener automatically tracks these events:

| Event Name | Description | Data |
|------------|-------------|------|
| `concierge_triggered` | When card appears | `trigger_type`, `field_name`, `timestamp` |
| `concierge_dismissed` | When card is closed | `accepted`, `timestamp` |
| `zipchat_opened` | When chat opens | `field_name`, `context`, `timestamp` |

### Google Analytics 4 Integration

Already integrated! Events automatically fire to GA4:

```javascript
gtag('event', 'concierge_triggered', {
    trigger_type: 'dwell',
    field_name: 'email',
    timestamp: '2025-01-10T14:30:00Z'
});
```

### Custom Analytics Platforms

Add your tracking in the `trackEvent()` function:

```javascript
function trackEvent(eventName, eventData) {
    // Your custom analytics
    if (window.mixpanel) {
        window.mixpanel.track(eventName, eventData);
    }

    if (window.amplitude) {
        window.amplitude.track(eventName, eventData);
    }

    if (window.heap) {
        window.heap.track(eventName, eventData);
    }
}
```

---

## Troubleshooting

### Issue: Zipchat doesn't open when CTA is clicked

**Solution 1:** Check Zipchat API method names

```javascript
// Add console logging
console.log('Available ZipChat methods:', Object.keys(window.ZipChat));
```

Adjust the API calls in `openZipChatWithContext()` based on what's available.

**Solution 2:** Check for conflicts with Content Security Policy (CSP)

```html
<!-- Add to <head> if needed -->
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' 'unsafe-inline' https://cdn.zipchat.ai;">
```

---

### Issue: Default bubble still appears

**Solution:** Add more specific selectors to hide it

```css
/* Add to concierge-card.css */
#your-specific-zipchat-id {
    display: none !important;
}
```

Inspect the Zipchat element in DevTools to find its ID/class.

---

### Issue: Form not detected

**Solution:** Add your form selector to CONFIG

```javascript
FORM_SELECTOR: 'form[name="registration"], form#your-form-id, .your-form-class'
```

Or use the MutationObserver to watch for dynamically loaded forms (already implemented).

---

### Issue: Context not reaching AI

**Solution 1:** Verify Zipchat backend configuration

Contact Zipchat support to ensure:
- Context variables are enabled
- AI prompt references the context
- Session metadata is accessible to AI

**Solution 2:** Use sendMessage() as fallback

The system message method is more reliable:

```javascript
window.ZipChatAPI.sendMessage(`[SYSTEM] User stuck on ${fieldName}`);
```

---

### Issue: Exit intent too sensitive

**Solution:** Adjust thresholds

```javascript
CONFIG = {
    EXIT_INTENT_THRESHOLD: 20, // Increase pixels from top
    EXIT_INTENT_VELOCITY: 100  // Increase required velocity
};
```

---

## Advanced: Custom Zipchat API Wrapper

If your Zipchat implementation uses custom methods, create a wrapper:

```javascript
// Add after Zipchat loads
window.ZipChatAPI = {
    open: function() {
        // Your custom open method
        window.YourChatObject.show();
    },
    setContext: function(ctx) {
        // Your custom context method
        window.YourChatObject.setSessionData(ctx);
    },
    sendMessage: function(msg) {
        // Your custom message method
        window.YourChatObject.send({ text: msg, hidden: true });
    }
};
```

---

## Performance Considerations

- **Lazy Load:** The script only activates when forms are detected
- **Debouncing:** Event listeners use debouncing to prevent excessive triggers
- **Memory:** Triggered fields are tracked to prevent duplicate cards
- **Network:** No external dependencies except Zipchat

---

## Security

- **No PII Collection:** The script does NOT collect passwords or sensitive data
- **Field Values:** Empty values are passed in context (not actual passwords)
- **XSS Protection:** All user-generated content is sanitized
- **CSP Compatible:** Inline styles use nonces (if configured)

---

## Support

For issues specific to:
- **Revenue Recovery Listener:** Check console for `[RRL]` logs
- **Zipchat Integration:** Contact Zipchat support
- **Google Tag Manager:** Check GTM preview mode

---

## Changelog

### v1.0.0 (2025-01-10)
- Initial release
- Three friction triggers (dwell, error, exit)
- Zipchat API integration
- Custom concierge card UI
- Analytics integration
- Mobile responsive

---

## Next Steps

1. **A/B Test Thresholds:** Test different dwell times (15s vs 20s vs 30s)
2. **Message Variants:** Test different concierge card messages
3. **Measure Impact:** Track conversion rate lift (registration completion, FTD rate)
4. **Expand Triggers:** Add abandonment cart trigger, payment failure trigger
5. **Personalization:** Show different messages for VIP vs new users

---

**Built for high-stakes CRO. Ship fast, optimize faster.** 🚀

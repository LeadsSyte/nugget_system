/**
 * VitaMing.net Personalization Demo
 * Paste this in console to demonstrate all personalization capabilities
 */

(function() {
    'use strict';

    console.log('%c🎯 VitaMing Personalization Demo Started', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');

    // Helper function for visual feedback
    const showNotification = (message, type = 'info') => {
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `<strong>🎯 Personalization:</strong><br>${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .personalization-highlight {
            outline: 3px solid #FF9800 !important;
            outline-offset: 3px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { outline-color: #FF9800; }
            50% { outline-color: #FFC107; }
        }
    `;
    document.head.appendChild(style);

    // ===========================================
    // 1. VISITOR SEGMENTATION
    // ===========================================
    const detectVisitorType = () => {
        console.log('%c1. Visitor Segmentation', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const visits = localStorage.getItem('vitaming_visits') || 0;
        const newVisits = parseInt(visits) + 1;
        localStorage.setItem('vitaming_visits', newVisits);

        let segment = 'new';
        if (newVisits > 5) segment = 'loyal';
        else if (newVisits > 1) segment = 'returning';

        console.log(`   ✓ Visit count: ${newVisits}`);
        console.log(`   ✓ Segment: ${segment.toUpperCase()}`);

        showNotification(`Welcome back! Visit #${newVisits} - ${segment.toUpperCase()} customer`, 'info');

        return segment;
    };

    // ===========================================
    // 2. DYNAMIC HERO BANNER
    // ===========================================
    const personalizeHero = (segment) => {
        console.log('%c2. Dynamic Hero Personalization', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const messages = {
            new: '🎁 Welcome! Get 20% off your first order',
            returning: '👋 Welcome back! Your favorites are waiting',
            loyal: '⭐ VIP Customer: Exclusive 30% off today!'
        };

        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 999998;
            font-size: 18px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = messages[segment];
        document.body.prepend(banner);

        console.log(`   ✓ Hero message: "${messages[segment]}"`);
        showNotification('Hero banner personalized!', 'success');
    };

    // ===========================================
    // 3. PRODUCT RECOMMENDATIONS
    // ===========================================
    const showRecommendations = () => {
        console.log('%c3. Product Recommendations', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const recommendations = [
            { name: 'Vitamin D3 5000 IU', reason: 'Based on winter season' },
            { name: 'Omega-3 Fish Oil', reason: 'Popular with your segment' },
            { name: 'Multivitamin Complex', reason: 'Frequently bought together' }
        ];

        recommendations.forEach(rec => {
            console.log(`   ✓ ${rec.name} - ${rec.reason}`);
        });

        showNotification(`${recommendations.length} personalized products recommended`, 'info');
    };

    // ===========================================
    // 4. CART ABANDONMENT TRACKING
    // ===========================================
    const setupCartTracking = () => {
        console.log('%c4. Cart Abandonment Tracking', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const cartItems = ['Vitamin C 1000mg', 'Zinc Supplement'];
        localStorage.setItem('vitaming_cart', JSON.stringify(cartItems));
        localStorage.setItem('vitaming_cart_timestamp', Date.now());

        console.log(`   ✓ Cart tracked: ${cartItems.length} items`);
        console.log(`   ✓ Items: ${cartItems.join(', ')}`);

        showNotification('Cart tracking active - abandonment emails enabled', 'warning');
    };

    // ===========================================
    // 5. GEOLOCATION PERSONALIZATION
    // ===========================================
    const personalizeByLocation = async () => {
        console.log('%c5. Geolocation Personalization', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            console.log(`   ✓ Location: ${data.city}, ${data.country_name}`);
            console.log(`   ✓ Currency: ${data.currency}`);
            console.log(`   ✓ Timezone: ${data.timezone}`);

            localStorage.setItem('vitaming_location', JSON.stringify(data));
            showNotification(`Location detected: ${data.city}, ${data.country_name}`, 'success');

            // Simulate free shipping for local customers
            if (data.country_code === 'US') {
                console.log('   ✓ Free shipping enabled for US customers');
                showNotification('🚚 Free shipping available in your area!', 'success');
            }
        } catch (e) {
            console.log('   ⚠ Geolocation API unavailable (demo mode)');
            showNotification('Location: Demo Mode (US)', 'info');
        }
    };

    // ===========================================
    // 6. URGENCY & SCARCITY
    // ===========================================
    const addUrgencyElements = () => {
        console.log('%c6. Urgency & Scarcity Triggers', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const urgencyMessages = [
            '⏰ Sale ends in 2 hours!',
            '🔥 Only 3 left in stock',
            '👥 12 people viewing this item',
            '📦 Order in 1 hour for same-day shipping'
        ];

        urgencyMessages.forEach(msg => console.log(`   ✓ ${msg}`));

        showNotification(urgencyMessages[0], 'warning');
        setTimeout(() => showNotification(urgencyMessages[1], 'warning'), 3500);
    };

    // ===========================================
    // 7. BEHAVIORAL TRIGGERS
    // ===========================================
    const setupBehavioralTriggers = () => {
        console.log('%c7. Behavioral Triggers', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        // Scroll depth tracking
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > maxScroll) {
                maxScroll = Math.round(scrollPercent);
                if (maxScroll >= 50 && maxScroll < 52) {
                    console.log(`   ✓ 50% scroll reached - trigger engaged`);
                    showNotification('💎 Exclusive offer unlocked!', 'success');
                }
            }
        });

        // Time on page
        setTimeout(() => {
            console.log('   ✓ 10 seconds on page - engagement trigger');
            showNotification('🎯 Still browsing? Chat with our vitamin expert!', 'info');
        }, 10000);

        // Exit intent (simplified)
        document.addEventListener('mouseout', (e) => {
            if (e.clientY < 50 && !localStorage.getItem('vitaming_exit_shown')) {
                console.log('   ✓ Exit intent detected');
                localStorage.setItem('vitaming_exit_shown', 'true');
                showNotification('⚠️ Wait! Take 15% off before you go', 'warning');
            }
        });

        console.log('   ✓ Scroll tracking: Active');
        console.log('   ✓ Time triggers: Set');
        console.log('   ✓ Exit intent: Armed');
    };

    // ===========================================
    // 8. A/B TEST ASSIGNMENT
    // ===========================================
    const assignABTest = () => {
        console.log('%c8. A/B Test Assignment', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const variant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem('vitaming_ab_test', variant);

        const tests = {
            A: 'Blue CTA buttons + Free shipping banner',
            B: 'Green CTA buttons + Money-back guarantee'
        };

        console.log(`   ✓ Assigned to variant: ${variant}`);
        console.log(`   ✓ Configuration: ${tests[variant]}`);

        showNotification(`A/B Test: Variant ${variant}`, 'info');
    };

    // ===========================================
    // 9. DYNAMIC PRICING
    // ===========================================
    const showDynamicPricing = (segment) => {
        console.log('%c9. Dynamic Pricing', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const discounts = {
            new: 20,
            returning: 10,
            loyal: 30
        };

        const discount = discounts[segment];
        console.log(`   ✓ Discount applied: ${discount}%`);
        console.log(`   ✓ Original: $29.99 → Sale: $${(29.99 * (1 - discount/100)).toFixed(2)}`);

        showNotification(`💰 Your ${discount}% discount is now active!`, 'success');
    };

    // ===========================================
    // 10. SOCIAL PROOF
    // ===========================================
    const addSocialProof = () => {
        console.log('%c10. Social Proof', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const proofMessages = [
            '✓ 10,000+ five-star reviews',
            '✓ Trusted by 250,000+ customers',
            '✓ Featured in Health Magazine',
            '✓ Certified by NSF & USP'
        ];

        proofMessages.forEach(msg => console.log(`   ${msg}`));

        // Create floating social proof
        setTimeout(() => {
            const proof = document.createElement('div');
            proof.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 999999;
                font-size: 13px;
                max-width: 300px;
            `;
            proof.innerHTML = `
                <strong>🎉 Sarah from New York</strong><br>
                just purchased <i>Vitamin D3</i><br>
                <span style="color: #666; font-size: 11px;">2 minutes ago</span>
            `;
            document.body.appendChild(proof);

            setTimeout(() => proof.remove(), 5000);
        }, 5000);

        showNotification('Social proof elements activated', 'success');
    };

    // ===========================================
    // 11. PERSONALIZED EMAIL CAPTURE
    // ===========================================
    const setupEmailCapture = (segment) => {
        console.log('%c11. Email Capture', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const incentives = {
            new: 'Get 20% off + free shipping',
            returning: 'Exclusive early access to new products',
            loyal: 'VIP-only deals + free samples'
        };

        console.log(`   ✓ Incentive: ${incentives[segment]}`);
        console.log('   ✓ Popup trigger: After 15 seconds or 25% scroll');

        showNotification(`Email popup ready: "${incentives[segment]}"`, 'info');
    };

    // ===========================================
    // 12. SESSION REPLAY & ANALYTICS
    // ===========================================
    const trackSession = () => {
        console.log('%c12. Session Analytics', 'background: #2196F3; color: white; padding: 5px; font-weight: bold;');

        const sessionData = {
            sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
            startTime: new Date().toISOString(),
            pageViews: 1,
            clicks: 0,
            formInteractions: 0,
            device: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };

        localStorage.setItem('vitaming_session', JSON.stringify(sessionData));

        console.log(`   ✓ Session ID: ${sessionData.sessionId}`);
        console.log(`   ✓ Device: ${sessionData.device}`);
        console.log('   ✓ Tracking: Clicks, scrolls, forms, heatmaps');

        showNotification('Session tracking & analytics active', 'success');
    };

    // ===========================================
    // EXECUTE ALL PERSONALIZATIONS
    // ===========================================
    setTimeout(() => {
        const segment = detectVisitorType();
        personalizeHero(segment);
        showRecommendations();
        setupCartTracking();
        personalizeByLocation();
        addUrgencyElements();
        setupBehavioralTriggers();
        assignABTest();
        showDynamicPricing(segment);
        addSocialProof();
        setupEmailCapture(segment);
        trackSession();

        console.log('%c✨ All Personalization Features Activated!', 'background: #4CAF50; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
        console.log('%cCheck the page for visual changes and notifications', 'color: #666; font-style: italic;');

        setTimeout(() => {
            showNotification('🎯 12 personalization features active!', 'success');
        }, 8000);
    }, 500);

    // Add control panel
    console.log('\n%c🎮 CONTROL COMMANDS:', 'background: #9C27B0; color: white; padding: 5px; font-weight: bold;');
    console.log('%cwindow.clearVitamingData()', 'color: #2196F3', '- Clear all tracking data');
    console.log('%cwindow.showVitamingData()', 'color: #2196F3', '- Display all stored data');

    window.clearVitamingData = () => {
        Object.keys(localStorage).filter(k => k.startsWith('vitaming_')).forEach(k => localStorage.removeItem(k));
        console.log('%c✓ All VitaMing data cleared', 'color: #4CAF50; font-weight: bold;');
        location.reload();
    };

    window.showVitamingData = () => {
        console.log('%c📊 STORED DATA:', 'background: #FF5722; color: white; padding: 5px; font-weight: bold;');
        Object.keys(localStorage).filter(k => k.startsWith('vitaming_')).forEach(key => {
            console.log(`   ${key}:`, localStorage.getItem(key));
        });
    };

})();

/**
 * VitaMing.net AI Web Closer Demo
 * Product: Gut Shield Plus - Search Term: "How to stop bloating"
 * Paste this in console on: https://vitaming.net/products/gut-shield-plus
 */

(function() {
    'use strict';

    console.log('%c🤖 VitaMing AI Web Closer Activated', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; font-size: 18px; font-weight: bold; border-radius: 8px;');

    // ========================================
    // CONFIGURATION
    // ========================================
    const CONFIG = {
        searchTerm: 'How to stop bloating',
        product: 'Gut Shield Plus',
        productBenefit: 'clinically proven to reduce bloating in 14 days',
        visitThreshold: 3, // visits to be considered "existing"
        scrollTrigger: 30, // % scroll to trigger AI
        exitIntentEnabled: true,
        aiName: 'Sarah',
        aiRole: 'Wellness Specialist'
    };

    // ========================================
    // VISITOR RECOGNITION
    // ========================================
    const recognizeVisitor = () => {
        const visits = parseInt(localStorage.getItem('vitaming_visits') || '0');
        const newVisits = visits + 1;
        localStorage.setItem('vitaming_visits', newVisits);
        localStorage.setItem('vitaming_last_visit', new Date().toISOString());

        const isExisting = visits >= CONFIG.visitThreshold;
        const customerType = isExisting ? 'existing' : 'new';

        console.log('%c👤 Visitor Recognition', 'background: #2196F3; color: white; padding: 5px 10px; font-weight: bold;');
        console.log(`   Visit Count: ${newVisits}`);
        console.log(`   Customer Type: ${customerType.toUpperCase()}`);
        console.log(`   Search Term: "${CONFIG.searchTerm}"`);

        return { visits: newVisits, isExisting, customerType };
    };

    // ========================================
    // SEARCH TERM PERSONALIZATION
    // ========================================
    const personalizeBySearchTerm = (searchTerm, customerType) => {
        console.log('%c🔍 Search Term Personalization', 'background: #2196F3; color: white; padding: 5px 10px; font-weight: bold;');

        const messaging = {
            new: {
                headline: `Stop Bloating Naturally`,
                subheadline: `You searched "${searchTerm}" - We have the solution`,
                offer: `First-time customer: 25% OFF + Free Shipping`,
                urgency: `Limited time: 127 bottles sold today`
            },
            existing: {
                headline: `Welcome Back! Ready to Fix Your Bloating?`,
                subheadline: `Based on your search for "${searchTerm}"`,
                offer: `Loyal customer: 30% OFF your next order`,
                urgency: `Your favorite Gut Shield Plus is back in stock`
            }
        };

        const content = messaging[customerType];

        console.log(`   Headline: ${content.headline}`);
        console.log(`   Offer: ${content.offer}`);

        return content;
    };

    // ========================================
    // AI CLOSER CHAT INTERFACE
    // ========================================
    const createAICloser = (visitor, messaging) => {
        // Remove any existing closer
        const existing = document.getElementById('vitaming-ai-closer');
        if (existing) existing.remove();

        // Create AI Closer Container
        const closer = document.createElement('div');
        closer.id = 'vitaming-ai-closer';
        closer.style.cssText = `
            position: fixed;
            left: -450px;
            top: 50%;
            transform: translateY(-50%);
            width: 400px;
            max-height: 80vh;
            background: white;
            border-radius: 0 16px 16px 0;
            box-shadow: 4px 0 30px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            transition: left 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        // Header with AI Avatar
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        header.innerHTML = `
            <div style="width: 50px; height: 50px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                🤖
            </div>
            <div>
                <div style="font-weight: bold; font-size: 18px;">${CONFIG.aiName}</div>
                <div style="font-size: 13px; opacity: 0.9;">${CONFIG.aiRole}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; margin-right: 5px;"></span>
                    Online Now
                </div>
            </div>
        `;

        // Search Term Recognition Banner
        const searchBanner = document.createElement('div');
        searchBanner.style.cssText = `
            background: #FFF3E0;
            border-left: 4px solid #FF9800;
            padding: 12px 15px;
            font-size: 13px;
            color: #E65100;
        `;
        searchBanner.innerHTML = `
            <strong>🔍 I noticed you searched:</strong><br>
            <span style="font-style: italic;">"${CONFIG.searchTerm}"</span>
        `;

        // Chat Messages Container
        const chatContainer = document.createElement('div');
        chatContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f5f5f5;
        `;

        // Create chat messages
        const messages = [
            {
                text: visitor.isExisting
                    ? `Hi again! I see you're back. ${messaging.headline}`
                    : `Hi there! I'm ${CONFIG.aiName}, your personal wellness guide. I noticed you're looking for solutions to bloating.`,
                delay: 800,
                isAI: true
            },
            {
                text: `Great news! Our ${CONFIG.product} is ${CONFIG.productBenefit}. 💊`,
                delay: 2000,
                isAI: true
            },
            {
                text: visitor.isExisting
                    ? `As a valued customer, I've activated a special <strong>30% loyalty discount</strong> just for you! 🎁`
                    : `For first-time customers, I can offer you <strong>25% OFF + Free Shipping</strong> today! 🎁`,
                delay: 3500,
                isAI: true
            },
            {
                text: `⏰ ${messaging.urgency}`,
                delay: 5000,
                isAI: true,
                isUrgent: true
            },
            {
                text: `Would you like me to apply your discount and help you complete your order? 💬`,
                delay: 6500,
                isAI: true,
                showButtons: true
            }
        ];

        // Add messages with typing animation
        messages.forEach((msg, index) => {
            setTimeout(() => {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = `
                    margin-bottom: 15px;
                    animation: slideInMessage 0.3s ease-out;
                `;

                const bubble = document.createElement('div');
                bubble.style.cssText = `
                    background: ${msg.isUrgent ? '#FFF3E0' : 'white'};
                    border: ${msg.isUrgent ? '2px solid #FF9800' : 'none'};
                    padding: 12px 16px;
                    border-radius: 16px 16px 16px 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                    position: relative;
                `;
                bubble.innerHTML = msg.text;

                messageDiv.appendChild(bubble);

                // Add action buttons for last message
                if (msg.showButtons) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = `
                        margin-top: 15px;
                        display: flex;
                        gap: 10px;
                    `;

                    const yesBtn = document.createElement('button');
                    yesBtn.textContent = '✅ Yes, Apply Discount';
                    yesBtn.style.cssText = `
                        flex: 1;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 13px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    `;
                    yesBtn.onmouseover = () => yesBtn.style.transform = 'scale(1.05)';
                    yesBtn.onmouseout = () => yesBtn.style.transform = 'scale(1)';
                    yesBtn.onclick = () => {
                        showConfirmation(visitor.isExisting ? 30 : 25);
                    };

                    const questionBtn = document.createElement('button');
                    questionBtn.textContent = '💬 I have questions';
                    questionBtn.style.cssText = `
                        flex: 1;
                        background: white;
                        color: #667eea;
                        border: 2px solid #667eea;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s;
                    `;
                    questionBtn.onmouseover = () => {
                        questionBtn.style.background = '#667eea';
                        questionBtn.style.color = 'white';
                    };
                    questionBtn.onmouseout = () => {
                        questionBtn.style.background = 'white';
                        questionBtn.style.color = '#667eea';
                    };
                    questionBtn.onclick = () => {
                        showFAQ();
                    };

                    buttonContainer.appendChild(yesBtn);
                    buttonContainer.appendChild(questionBtn);
                    messageDiv.appendChild(buttonContainer);
                }

                chatContainer.appendChild(messageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, msg.delay);
        });

        // Footer with trust signals
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 15px 20px;
            background: white;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        `;
        footer.innerHTML = `
            <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>⭐⭐⭐⭐⭐<br><strong>4.9/5</strong><br>12,847 reviews</div>
                <div>🚚<br><strong>Free Ship</strong><br>Orders $50+</div>
                <div>💰<br><strong>30-Day</strong><br>Money Back</div>
            </div>
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255,255,255,0.3);
            border: none;
            color: white;
            font-size: 28px;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.5)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
        closeBtn.onclick = () => {
            closer.style.left = '-450px';
            setTimeout(() => showReengageTab(), 2000);
        };

        // Assemble
        header.appendChild(closeBtn);
        closer.appendChild(header);
        closer.appendChild(searchBanner);
        closer.appendChild(chatContainer);
        closer.appendChild(footer);
        document.body.appendChild(closer);

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInMessage {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);

        return closer;
    };

    // ========================================
    // CONFIRMATION SCREEN
    // ========================================
    const showConfirmation = (discount) => {
        const closer = document.getElementById('vitaming-ai-closer');
        if (!closer) return;

        const chatContainer = closer.querySelector('div[style*="flex: 1"]');
        chatContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <div style="font-size: 24px; font-weight: bold; color: #4CAF50; margin-bottom: 10px;">
                    Discount Applied!
                </div>
                <div style="font-size: 18px; color: #666; margin-bottom: 30px;">
                    Your ${discount}% OFF code: <strong style="color: #667eea;">WELLNESS${discount}</strong>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Your Price:</div>
                    <div style="font-size: 32px; font-weight: bold;">
                        <span style="text-decoration: line-through; opacity: 0.6; font-size: 20px;">$49.99</span>
                        $${(49.99 * (1 - discount/100)).toFixed(2)}
                    </div>
                    <div style="font-size: 13px; opacity: 0.8; margin-top: 5px;">+ FREE Shipping</div>
                </div>
                <button onclick="window.scrollTo(0,0)" style="
                    width: 100%;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    🛒 Add to Cart & Checkout
                </button>
                <div style="margin-top: 15px; font-size: 12px; color: #999;">
                    ⏰ Code expires in 15 minutes
                </div>
            </div>
        `;
    };

    // ========================================
    // FAQ SCREEN
    // ========================================
    const showFAQ = () => {
        const closer = document.getElementById('vitaming-ai-closer');
        if (!closer) return;

        const chatContainer = closer.querySelector('div[style*="flex: 1"]');
        chatContainer.innerHTML = `
            <div style="padding: 10px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333;">
                    💬 Common Questions About Bloating
                </div>
                ${[
                    { q: 'How fast does it work?', a: 'Most customers notice reduced bloating within 7-14 days of consistent use.' },
                    { q: 'Is it safe?', a: 'Yes! All-natural ingredients, no harmful additives. Third-party tested for purity.' },
                    { q: 'What causes bloating?', a: 'Usually gut bacteria imbalance, poor digestion, or food sensitivities. Our formula addresses all three.' },
                    { q: 'Money-back guarantee?', a: 'Absolutely! 30-day full refund if you\'re not satisfied. No questions asked.' }
                ].map(faq => `
                    <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 5px; font-size: 14px;">
                            ${faq.q}
                        </div>
                        <div style="font-size: 13px; color: #666; line-height: 1.5;">
                            ${faq.a}
                        </div>
                    </div>
                `).join('')}
                <button onclick="document.getElementById('vitaming-ai-closer').querySelector('div[style*=\\'flex: 1\\']').scrollTop = 0" style="
                    width: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 15px;
                ">
                    ✅ Got it! Apply My Discount
                </button>
            </div>
        `;

        chatContainer.querySelector('button').onclick = () => {
            const visitor = recognizeVisitor();
            showConfirmation(visitor.isExisting ? 30 : 25);
        };
    };

    // ========================================
    // RE-ENGAGE TAB (when closed)
    // ========================================
    const showReengageTab = () => {
        let tab = document.getElementById('vitaming-reengage-tab');
        if (tab) return;

        tab = document.createElement('div');
        tab.id = 'vitaming-reengage-tab';
        tab.style.cssText = `
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            border-radius: 0 8px 8px 0;
            cursor: pointer;
            z-index: 999998;
            box-shadow: 2px 0 12px rgba(0,0,0,0.3);
            writing-mode: vertical-rl;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s;
        `;
        tab.innerHTML = '💬 Need Help? Click Here';
        tab.onmouseover = () => tab.style.paddingLeft = '20px';
        tab.onmouseout = () => tab.style.paddingLeft = '12px';
        tab.onclick = () => {
            tab.remove();
            const closer = document.getElementById('vitaming-ai-closer');
            if (closer) {
                closer.style.left = '0';
            }
        };

        document.body.appendChild(tab);
    };

    // ========================================
    // SCROLL TRIGGER
    // ========================================
    let hasTriggered = false;
    const setupScrollTrigger = (closer) => {
        console.log('%c📜 Scroll Trigger Armed', 'background: #2196F3; color: white; padding: 5px 10px; font-weight: bold;');
        console.log(`   Trigger at ${CONFIG.scrollTrigger}% scroll depth`);

        const checkScroll = () => {
            if (hasTriggered) return;

            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

            if (scrollPercent >= CONFIG.scrollTrigger) {
                hasTriggered = true;
                console.log(`%c🎯 Scroll trigger activated at ${Math.round(scrollPercent)}%`, 'color: #4CAF50; font-weight: bold;');

                setTimeout(() => {
                    closer.style.left = '0';
                }, 500);

                window.removeEventListener('scroll', checkScroll);
            }
        };

        window.addEventListener('scroll', checkScroll);
    };

    // ========================================
    // EXIT INTENT
    // ========================================
    const setupExitIntent = (closer) => {
        if (!CONFIG.exitIntentEnabled) return;

        console.log('%c🚪 Exit Intent Armed', 'background: #2196F3; color: white; padding: 5px 10px; font-weight: bold;');

        let exitShown = sessionStorage.getItem('vitaming_exit_shown');

        document.addEventListener('mouseleave', (e) => {
            if (exitShown) return;
            if (e.clientY > 50) return; // Only trigger if mouse leaves from top
            if (hasTriggered) return; // Already shown via scroll

            exitShown = true;
            sessionStorage.setItem('vitaming_exit_shown', '1');

            console.log('%c⚠️ Exit intent detected!', 'color: #FF9800; font-weight: bold;');

            closer.style.left = '0';
            hasTriggered = true;

            // Add urgent exit message
            setTimeout(() => {
                const chatContainer = closer.querySelector('div[style*="flex: 1"]');
                const urgentMsg = document.createElement('div');
                urgentMsg.style.cssText = `
                    background: #FFF3E0;
                    border: 2px solid #FF9800;
                    padding: 15px;
                    border-radius: 12px;
                    margin: 10px;
                    font-size: 14px;
                    font-weight: bold;
                    color: #E65100;
                    text-align: center;
                    animation: pulse 1s infinite;
                `;
                urgentMsg.innerHTML = '⚠️ Wait! Your discount is about to expire!';
                chatContainer.appendChild(urgentMsg);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 1000);
        });
    };

    // ========================================
    // INITIALIZE
    // ========================================
    const init = () => {
        console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
        console.log('%c🚀 INITIALIZATION SEQUENCE', 'background: #667eea; color: white; padding: 8px 15px; font-weight: bold;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #667eea;');

        // Step 1: Recognize visitor
        const visitor = recognizeVisitor();

        // Step 2: Personalize messaging
        const messaging = personalizeBySearchTerm(CONFIG.searchTerm, visitor.customerType);

        // Step 3: Create AI Closer
        console.log('%c🤖 Creating AI Closer Interface', 'background: #2196F3; color: white; padding: 5px 10px; font-weight: bold;');
        const closer = createAICloser(visitor, messaging);

        // Step 4: Setup triggers
        setupScrollTrigger(closer);
        setupExitIntent(closer);

        console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
        console.log('%c✅ AI WEB CLOSER READY', 'background: #4CAF50; color: white; padding: 8px 15px; font-weight: bold;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
        console.log('\n%c📋 ACTIVE FEATURES:', 'color: #667eea; font-weight: bold; font-size: 14px;');
        console.log('   ✓ New/Existing customer recognition');
        console.log('   ✓ Search term personalization');
        console.log('   ✓ Scroll trigger (30% depth)');
        console.log('   ✓ Exit intent detection');
        console.log('   ✓ AI conversational interface');
        console.log('   ✓ Dynamic discount application');
        console.log('\n%c🎮 Try scrolling down or moving your mouse to the top of the page!', 'color: #FF9800; font-style: italic;');
    };

    // Execute on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

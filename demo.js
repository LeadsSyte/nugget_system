(function() {
    'use strict';

    // ============================================
    // 🎯 CUSTOMIZE FOR EACH CLIENT
    // ============================================
    const CLIENT = {
        name: 'Dana',
        company: 'Hot Leathers',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg', // Replace with their LinkedIn photo

        monthlyVisitors: '42,000',
        conversionRate: '2.1%',
        monthlyRevenue: '$85K',

        city: 'JHB',
        searchKeyword: 'leather motorcycle jacket',
        vehicle: 'Honda'
    };

    // ============================================
    // PAGE MODIFICATIONS
    // ============================================
    const PageMods = {
        addLeftPanel() {
            const panel = document.createElement('div');
            panel.id = 'perks-panel';
            panel.style.cssText = 'position:fixed;left:20px;top:150px;width:320px;background:rgba(255,255,255,0.98);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.3);border:4px solid #4CAF50;z-index:999997;animation:panelSlide 1s;font-family:Arial,sans-serif;overflow:hidden';
            panel.innerHTML = '<style>@keyframes panelSlide{from{transform:translateX(-400px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes elementFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}</style><div id="panel-header" style="background:linear-gradient(135deg,#4CAF50,#2d8b3e);padding:20px;color:#fff;opacity:0"><div style="font-size:18px;font-weight:bold;margin-bottom:8px">⚡ NEW CUSTOMER PERKS</div><div style="font-size:13px;opacity:0.95">Personalized just for you</div></div><div id="panel-content" style="padding:24px"></div>';
            document.body.appendChild(panel);
            console.log('✅ Left personalization panel added');
        },

        animatePanelElements() {
            // Header appears first
            setTimeout(() => {
                const header = document.getElementById('panel-header');
                if (header) {
                    header.style.animation = 'elementFade 0.6s forwards';
                    header.style.opacity = '1';
                }
            }, 500);

            // Add elements one by one
            const content = document.getElementById('panel-content');
            if (!content) return;

            // Title
            setTimeout(() => {
                const title = document.createElement('div');
                title.style.cssText = 'font-size:15px;font-weight:bold;color:#4CAF50;margin-bottom:16px;opacity:0;animation:elementFade 0.6s forwards';
                title.innerHTML = '🎯 What personalization means:';
                content.appendChild(title);
            }, 1200);

            // Benefit 1
            setTimeout(() => {
                const benefit1 = document.createElement('div');
                benefit1.style.cssText = 'font-size:14px;color:#333;line-height:1.8;margin-bottom:12px;opacity:0;animation:elementFade 0.6s forwards';
                benefit1.innerHTML = '✓ Products matched to your style';
                content.appendChild(benefit1);
            }, 1800);

            // Benefit 2
            setTimeout(() => {
                const benefit2 = document.createElement('div');
                benefit2.style.cssText = 'font-size:14px;color:#333;line-height:1.8;margin-bottom:12px;opacity:0;animation:elementFade 0.6s forwards';
                benefit2.innerHTML = '✓ Faster delivery to <strong>'+CLIENT.city+'</strong>';
                content.appendChild(benefit2);
            }, 2400);

            // Benefit 3
            setTimeout(() => {
                const benefit3 = document.createElement('div');
                benefit3.style.cssText = 'font-size:14px;color:#333;line-height:1.8;margin-bottom:12px;opacity:0;animation:elementFade 0.6s forwards';
                benefit3.innerHTML = '✓ Recommendations for <strong>'+CLIENT.vehicle+'</strong> riders';
                content.appendChild(benefit3);
            }, 3000);

            // Code section
            setTimeout(() => {
                const codeSection = document.createElement('div');
                codeSection.style.cssText = 'margin-top:20px;padding:16px;background:rgba(76,175,80,0.1);border-radius:10px;text-align:center;opacity:0;animation:elementFade 0.6s forwards';
                codeSection.innerHTML = '<div style="font-size:13px;color:#666;margin-bottom:8px">Your exclusive code:</div><div style="font-size:24px;font-weight:bold;color:#4CAF50;letter-spacing:2px">TheDon</div><div style="font-size:12px;color:#999;margin-top:4px">20% off your first order</div>';
                content.appendChild(codeSection);
            }, 3600);
        },

    };

    // ============================================
    // AI AVATAR
    // ============================================
    const Avatar = {
        render() {
            const container = document.createElement('div');
            container.id = 'syte-avatar';
            container.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:2147483647;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
            container.innerHTML = '<style>@keyframes avatarEnter{0%{transform:scale(0) translateY(100px);opacity:0}70%{transform:scale(1.1) translateY(-10px)}100%{transform:scale(1) translateY(0);opacity:1}}@keyframes avatarBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes morphMagic{0%{transform:scale(1) rotate(0)}25%{transform:scale(1.15) rotate(5deg)}50%{transform:scale(0) rotate(180deg);opacity:0}75%{transform:scale(1.15) rotate(-5deg);opacity:0.7}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes moneyGlow{0%,100%{box-shadow:0 0 30px rgba(76,175,80,0.6)}50%{box-shadow:0 0 50px rgba(76,175,80,1),0 0 70px rgba(255,215,0,0.6)}}@keyframes msgSlide{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes moneyFall{0%{transform:translateY(-50px) rotate(0);opacity:1}100%{transform:translateY(600px) rotate(720deg);opacity:0}}</style><div id="money-rain" style="position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:2147483645;display:none"></div><button onclick="document.getElementById(\'syte-avatar\').remove()" style="position:absolute;top:-60px;right:0;padding:10px 18px;background:rgba(0,0,0,0.85);color:#fff;border:2px solid #666;border-radius:10px;cursor:pointer;font-size:13px;font-weight:bold;pointer-events:auto;transition:all 0.2s" onmouseover="this.style.background=\'#f44336\'" onmouseout="this.style.background=\'rgba(0,0,0,0.85)\'">❌ Close Demo</button><div id="avatar-circle" style="width:150px;height:150px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;border:5px solid #fff;box-shadow:0 10px 40px rgba(0,0,0,0.3);animation:avatarEnter 1s cubic-bezier(0.68,-0.55,0.265,1.55),avatarBob 2.5s ease-in-out infinite 1s;position:relative;overflow:hidden;pointer-events:auto"><div id="avatar-robot" style="font-size:75px;transition:all 0.6s;filter:drop-shadow(2px 2px 5px rgba(0,0,0,0.3))">🤖</div><div id="avatar-photo" style="position:absolute;width:100%;height:100%;opacity:0;transition:opacity 0.6s;background:#000"><div style="width:100%;height:100%;background-image:url('+CLIENT.photoURL+');background-size:cover;background-position:center"></div></div></div><div id="avatar-bubble" style="position:absolute;bottom:165px;right:0;background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.3);width:420px;max-width:calc(100vw - 60px);border:3px solid #667eea;overflow:hidden;opacity:0;transform:scale(0.8);transition:all 0.4s;pointer-events:auto"><div id="avatar-header" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:16px 20px;color:#fff"><div style="font-weight:bold;font-size:14px">🤖 AI Tour Guide</div><div style="font-size:11px;opacity:0.9">Watch what happens...</div></div><div id="avatar-messages" style="padding:20px;max-height:380px;overflow-y:auto"></div><div style="position:absolute;bottom:-20px;right:65px;width:0;height:0;border-left:20px solid transparent;border-right:20px solid transparent;border-top:20px solid #fff;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1))"></div></div>';

            document.body.appendChild(container);

            setTimeout(() => {
                document.getElementById('avatar-bubble').style.opacity = '1';
                document.getElementById('avatar-bubble').style.transform = 'scale(1)';
            }, 1200);

            console.log('✅ Avatar rendered');
        },

        msg(content, type) {
            const colors = {normal:'#f0f4ff',highlight:'#fff9e6',important:'#ffe6f0',personal:'#e6ffe6',cta:'#fff'};
            const msg = document.createElement('div');
            msg.innerHTML = content;
            msg.style.cssText = 'background:'+(colors[type]||'#f0f4ff')+';padding:14px 18px;border-radius:14px;margin-bottom:12px;color:#333;font-size:14px;line-height:1.6;animation:msgSlide 0.4s;box-shadow:0 2px 8px rgba(0,0,0,0.06);border-left:3px solid #667eea';
            document.getElementById('avatar-messages').appendChild(msg);
            document.getElementById('avatar-messages').scrollTop = 999999;
        },

        runDemo() {
            setTimeout(() => this.msg('Hey '+CLIENT.name+'! 👋 Watch what happens to this page...','normal'), 1500);
            setTimeout(() => {
                this.msg('First, a personalized panel appears on the left...','normal');
                PageMods.addLeftPanel();
                PageMods.animatePanelElements();
            }, 3500);
            setTimeout(() => this.msg('<strong>See the panel?</strong> Each element appears one by one - showing perks personalized for you!','highlight'), 8000);
            setTimeout(() => this.msg('Delivery to <strong>'+CLIENT.city+'</strong>, recommendations for <strong>'+CLIENT.vehicle+'</strong> riders, and your exclusive code <strong>TheDon</strong>','normal'), 11000);
            setTimeout(() => this.msg('Your site gets <strong>'+CLIENT.monthlyVisitors+' visitors/month</strong> at <strong>'+CLIENT.conversionRate+' CR</strong> = <strong>'+CLIENT.monthlyRevenue+'/month</strong>','normal'), 14500);
            setTimeout(() => this.msg('<strong>Customers convert better when they feel understood.</strong> When it\'s personal.','highlight'), 17500);
            setTimeout(() => this.msg('They buy more when they see products matched to <strong>their interests</strong>.','important'), 20500);
            setTimeout(() => this.msg('<div style="text-align:center;padding:20px;background:rgba(102,126,234,0.1);border-radius:12px;border:2px solid #667eea"><div style="font-size:17px;font-weight:bold;color:#667eea;margin-bottom:10px">Let me show you something... 👀</div><div style="font-size:14px;color:#666">(Watch what I can do with personalization)</div></div>','cta'), 23500);
            setTimeout(() => this.triggerMorph(), 26500);
        },

        triggerMorph() {
            this.msg('With personalization I can better cater to the person I\'m speaking to. For example, if I knew you were <strong>wearing an orange hat</strong> I might suggest something orange...','normal');

            setTimeout(() => {
                this.msg('Or if I knew you like <strong>coffee</strong> I might suggest a coffee-themed jacket...','normal');
            }, 3000);

            // Transform to photo
            setTimeout(() => {
                document.getElementById('avatar-circle').style.animation = 'morphMagic 2.2s cubic-bezier(0.68,-0.55,0.265,1.55),moneyGlow 2s ease-in-out infinite';

                setTimeout(() => {
                    document.getElementById('avatar-robot').style.opacity = '0';
                    document.getElementById('avatar-robot').style.transform = 'scale(0) rotate(360deg)';

                    setTimeout(() => {
                        document.getElementById('avatar-photo').style.opacity = '1';
                        document.getElementById('avatar-header').innerHTML = '<div style="display:flex;align-items:center;gap:12px"><div style="width:45px;height:45px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,215,0,0.8);box-shadow:0 0 20px rgba(76,175,80,0.6)"><div style="width:100%;height:100%;background-image:url('+CLIENT.photoURL+');background-size:cover;background-position:center"></div></div><div><div style="font-weight:bold;font-size:15px">👤 '+CLIENT.name+'</div><div style="font-size:11px;opacity:0.9">Personalized greeting</div></div></div>';
                        this.msg('I might even greet you by name... <strong>'+CLIENT.name+'</strong>','important');
                    }, 500);
                }, 1100);
            }, 6000);

            // Say it's too creepy and revert back
            setTimeout(() => {
                this.msg('But... <strong>that\'s too creepy</strong> so I wouldn\'t do that for real...','highlight');

                setTimeout(() => {
                    // Reverse transform back to robot
                    document.getElementById('avatar-circle').style.animation = 'morphMagic 2.2s cubic-bezier(0.68,-0.55,0.265,1.55) reverse';

                    setTimeout(() => {
                        document.getElementById('avatar-photo').style.opacity = '0';

                        setTimeout(() => {
                            document.getElementById('avatar-robot').style.opacity = '1';
                            document.getElementById('avatar-robot').style.transform = 'scale(1) rotate(0)';
                            document.getElementById('avatar-header').innerHTML = '<div style="font-weight:bold;font-size:14px">🤖 AI Tour Guide</div><div style="font-size:11px;opacity:0.9">Back to normal!</div>';
                            document.getElementById('avatar-circle').style.animation = 'avatarBob 2.5s ease-in-out infinite';
                        }, 500);
                    }, 1100);
                }, 1500);
            }, 10000);

            // Final message
            setTimeout(() => {
                this.msg('That\'s personalization! <strong>Every visitor</strong> gets their own customized experience. 🎯','highlight');
            }, 15000);
        },

    };

    // ============================================
    // INITIALIZE
    // ============================================
    Avatar.render();
    Avatar.runDemo();

    console.log('%c✅ SYTE DEMO V5.0 READY!', 'background:#4CAF50;color:#fff;font-size:18px;padding:12px;font-weight:bold');
    console.log('Client: '+CLIENT.company+' ('+CLIENT.name+')');
    console.log('✨ New: Minimal design - Left panel only with animated reveals');

})();

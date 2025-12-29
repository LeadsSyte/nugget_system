(function() {
    'use strict';

    // ============================================
    // 🎯 CUSTOMIZE FOR EACH CLIENT
    // ============================================
    const CLIENT = {
        name: 'Mike',
        company: 'Hot Leathers',
        photoURL: 'https://randomuser.me/api/portraits/men/32.jpg', // Replace with their LinkedIn photo

        monthlyVisitors: '42,000',
        conversionRate: '2.1%',
        monthlyRevenue: '$85K',

        city: 'Sturgis',
        searchKeyword: 'leather motorcycle jacket',
        vehicle: 'Honda',

        facts: [
            "You restored a '73 Shovelhead last winter",
            "You ride to Sturgis every August",
            "You started Hot Leathers 40 years ago"
        ]
    };

    // ============================================
    // PAGE MODIFICATIONS
    // ============================================
    const PageMods = {
        addTopBanner() {
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#2d2d2d,#1a1a1a);color:#fff;text-align:center;padding:12px 20px;border-bottom:3px solid #4CAF50;z-index:999998;animation:slideDown 0.6s;box-shadow:0 2px 12px rgba(0,0,0,0.3)';
            banner.innerHTML = '<style>@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes bannerTextFade{0%{opacity:0;transform:translateY(-5px)}10%{opacity:1;transform:translateY(0)}90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(5px)}}</style><div id="banner-text" style="font-size:16px;font-weight:bold;color:#4CAF50;font-family:Arial,sans-serif;min-height:24px"></div>';
            document.body.insertBefore(banner, document.body.firstChild);

            // Start banner text rotation
            this.startBannerRotation();
            console.log('✅ Top banner added with dynamic text');
        },

        startBannerRotation() {
            const messages = [
                '💰 Personalized for <strong>'+CLIENT.name+'</strong> <span style="color:#ffd700;margin-left:15px">GET 20% OFF</span> <span id="gimme-code" style="background:#4CAF50;color:#fff;padding:6px 16px;border:2px solid #ffd700;font-size:14px;letter-spacing:2px;cursor:pointer;display:inline-block;margin-left:10px;font-family:Arial,sans-serif;border-radius:4px">GIMME</span>',
                '📍 Knowing you live in <strong>'+CLIENT.city+'</strong>, we\'d deliver tomorrow!',
                '🏍️ We\'d also show you the best gear for your <strong>'+CLIENT.vehicle+'</strong>'
            ];

            let currentIndex = 0;
            const textElement = document.getElementById('banner-text');

            if (!textElement) return;

            // Function to update banner text
            const updateBannerText = () => {
                textElement.style.animation = 'none';
                setTimeout(() => {
                    textElement.innerHTML = messages[currentIndex];
                    textElement.style.animation = 'bannerTextFade 5s ease-in-out';

                    // Re-attach click handler for GIMME code if it exists
                    const codeElement = document.getElementById('gimme-code');
                    if (codeElement) {
                        codeElement.onclick = function() {
                            navigator.clipboard.writeText('GIMME');
                            this.textContent = '✓ COPIED!';
                            setTimeout(() => this.textContent = 'GIMME', 2000);
                        };
                    }

                    currentIndex = (currentIndex + 1) % messages.length;
                }, 50);
            };

            // Initial text
            updateBannerText();

            // Rotate every 5 seconds
            setInterval(updateBannerText, 5000);
        },

        replaceHeroBanner() {
            document.querySelectorAll('img').forEach(img => {
                if (img.width > 600 || img.naturalWidth > 600) {
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,rgba(0,0,0,0.90),rgba(26,26,26,0.93));display:flex;align-items:center;justify-content:center;flex-direction:column;padding:40px 20px;z-index:100;animation:overlayFade 0.8s';
                    overlay.innerHTML = '<style>@keyframes overlayFade{from{opacity:0}to{opacity:1}}@keyframes textFade{0%{opacity:0;transform:translateY(10px)}10%{opacity:1;transform:translateY(0)}90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}</style><div style="font-size:56px;font-weight:bold;color:#4CAF50;text-align:center;font-family:Impact,Arial Black,sans-serif;letter-spacing:4px;margin-bottom:30px">💰 '+CLIENT.name.toUpperCase()+'</div><div id="dynamic-text" style="font-size:42px;font-weight:bold;color:#fff;text-align:center;font-family:Impact,sans-serif;margin-bottom:25px;line-height:1.4;min-height:120px"></div><div style="font-size:24px;color:#ffd700;text-align:center;font-family:Arial,sans-serif;margin-bottom:35px;max-width:900px;line-height:1.5">Every one of your '+CLIENT.monthlyVisitors+' monthly visitors<br>sees THEIR OWN personalized experience</div><div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center"><span style="font-size:32px;color:#fff;font-weight:bold;font-family:Impact,sans-serif">USE CODE:</span><span style="background:#4CAF50;color:#fff;padding:18px 40px;border:5px solid #ffd700;letter-spacing:8px;font-size:40px;font-family:Impact,sans-serif;box-shadow:0 8px 25px rgba(0,0,0,0.5)">GIMME</span></div>';

                    const parent = img.closest('div,section,main');
                    if (parent) {
                        parent.style.position = 'relative';
                        parent.appendChild(overlay);

                        // Start dynamic text rotation
                        this.startTextRotation();
                        console.log('✅ Hero banner replaced with dynamic text');
                    }
                }
            });
        },

        startTextRotation() {
            const messages = [
                "MORE PERSONALIZATION =<br>MORE MONEY FOR YOU",
                "CUSTOMERS SEE<br>THEMSELVES IN YOUR STORE",
                "EACH VISITOR GETS<br>THEIR OWN TWIN",
                "PERSONALIZED EXPERIENCES<br>MEAN HIGHER CONVERSIONS",
                "THEY BUY MORE WHEN<br>IT FEELS PERSONAL"
            ];

            let currentIndex = 0;
            const textElement = document.getElementById('dynamic-text');

            if (!textElement) return;

            // Function to update text
            const updateText = () => {
                textElement.style.animation = 'none';
                setTimeout(() => {
                    textElement.innerHTML = messages[currentIndex];
                    textElement.style.animation = 'textFade 4s ease-in-out';
                    currentIndex = (currentIndex + 1) % messages.length;
                }, 50);
            };

            // Initial text
            updateText();

            // Rotate every 4 seconds
            setInterval(updateText, 4000);
        },

        addPersonalizationBox() {
            const hero = document.querySelector('main,.main-content,[role="main"],.hero,.banner');
            if (hero) {
                const box = document.createElement('div');
                box.innerHTML = '<style>@keyframes boxFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style><div style="position:relative;background:rgba(76,175,80,0.08);padding:30px;margin:20px auto;max-width:1200px;border-left:5px solid #4CAF50;animation:boxFade 1s;border-radius:8px"><div style="font-size:20px;color:#4CAF50;font-weight:bold;margin-bottom:12px;font-family:Impact,sans-serif">⚡ PERSONALIZED FOR '+CLIENT.name.toUpperCase()+'</div><div style="font-size:16px;color:#333;line-height:1.6;font-family:Arial,sans-serif">Based on your interests in <strong>'+CLIENT.searchKeyword+'</strong> and your location in <strong>'+CLIENT.city+'</strong> - here are our top recommendations for riders like you.</div></div>';
                hero.insertBefore(box, hero.firstChild);
                console.log('✅ Personalization box added');
            }
        },

        addFloatingProof() {
            const proof = document.createElement('div');
            proof.innerHTML = '<style>@keyframes proofSlide{from{transform:translateX(350px);opacity:0}to{transform:translateX(0);opacity:1}}</style><div style="position:fixed;top:70px;right:20px;background:rgba(255,255,255,0.98);padding:20px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);border:3px solid #4CAF50;z-index:999997;max-width:280px;animation:proofSlide 1s;font-family:Arial,sans-serif"><div style="font-size:14px;font-weight:bold;color:#4CAF50;margin-bottom:10px">✅ VERIFIED RIDER</div><div style="font-size:13px;color:#666;line-height:1.5">We\'ve matched you with gear that fits your style and riding preferences.</div><div style="margin-top:12px;padding-top:12px;border-top:2px solid #eee;font-size:12px;color:#999">🔒 Your data is safe and private</div></div>';
            document.body.appendChild(proof);
            console.log('✅ Floating proof added');
        }
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
            setTimeout(() => { this.msg('First, the top banner appears with your name...','normal'); PageMods.addTopBanner(); }, 3500);
            setTimeout(() => this.msg('<strong>See? It says YOUR name:</strong> "Personalized for '+CLIENT.name+'"','highlight'), 5000);
            setTimeout(() => this.msg('<strong>Now watch the banner text change!</strong> It tells a personalization story...','highlight'), 8000);
            setTimeout(() => this.msg('First your name... then your city ('+CLIENT.city+')... then your vehicle ('+CLIENT.vehicle+')','normal'), 11000);
            setTimeout(() => { this.msg('Now watch the hero banner transform...','normal'); PageMods.replaceHeroBanner(); }, 14000);
            setTimeout(() => this.msg('<strong>The hero text rotates too!</strong> Each message shows a different benefit.','highlight'), 17000);
            setTimeout(() => { this.msg('Adding your personalized recommendations...','normal'); PageMods.addPersonalizationBox(); }, 20000);
            setTimeout(() => PageMods.addFloatingProof(), 22000);
            setTimeout(() => this.msg('Your site gets <strong>'+CLIENT.monthlyVisitors+' visitors/month</strong> at <strong>'+CLIENT.conversionRate+' CR</strong> = <strong>'+CLIENT.monthlyRevenue+'/month</strong>','normal'), 23500);
            setTimeout(() => this.msg('<strong>Customers convert better when they feel understood.</strong> When it\'s personal.','highlight'), 26500);
            setTimeout(() => this.msg('They buy more when talking to <strong>their twin</strong>. Someone who <em>gets them</em>.','important'), 29500);
            setTimeout(() => this.msg('<div style="text-align:center;padding:20px;background:rgba(102,126,234,0.1);border-radius:12px;border:2px solid #667eea"><div style="font-size:17px;font-weight:bold;color:#667eea;margin-bottom:10px">Watch this... 👀</div><div style="font-size:14px;color:#666">(Look at the avatar)</div></div>','cta'), 32500);
            setTimeout(() => this.triggerMorph(), 35500);
        },

        triggerMorph() {
            this.msg('⚡ Transforming...','important');
            document.getElementById('avatar-circle').style.animation = 'morphMagic 2.2s cubic-bezier(0.68,-0.55,0.265,1.55),moneyGlow 2s ease-in-out infinite';

            setTimeout(() => {
                document.getElementById('avatar-robot').style.opacity = '0';
                document.getElementById('avatar-robot').style.transform = 'scale(0) rotate(360deg)';

                setTimeout(() => {
                    document.getElementById('avatar-photo').style.opacity = '1';
                    document.getElementById('avatar-header').innerHTML = '<div style="display:flex;align-items:center;gap:12px"><div style="width:45px;height:45px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,215,0,0.8);box-shadow:0 0 20px rgba(76,175,80,0.6)"><div style="width:100%;height:100%;background-image:url('+CLIENT.photoURL+');background-size:cover;background-position:center"></div></div><div><div style="font-weight:bold;font-size:15px">💰 '+CLIENT.name+'\'s Twin</div><div style="font-size:11px;opacity:0.9">This is how customers see themselves</div></div></div>';
                    this.makeItRain();
                }, 500);
            }, 1100);

            setTimeout(() => this.showFinale(), 2800);
        },

        makeItRain() {
            const rain = document.getElementById('money-rain');
            rain.style.display = 'block';

            const symbols = ['💵','💰','💸','💴','💶','💷','🤑'];
            for (let i = 0; i < 80; i++) {
                setTimeout(() => {
                    const money = document.createElement('div');
                    money.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                    money.style.cssText = 'position:absolute;left:'+Math.random()*100+'%;top:-50px;font-size:'+(Math.random()*20+25)+'px;animation:moneyFall '+(Math.random()*2+3)+'s linear;opacity:'+(Math.random()*0.5+0.5)+';pointer-events:none';
                    rain.appendChild(money);
                    setTimeout(() => money.remove(), 6000);
                }, i * 60);
            }

            setTimeout(() => rain.style.display = 'none', 8000);
            console.log('💰 MAKING IT RAIN!');
        },

        showFinale() {
            setTimeout(() => this.msg('<strong>This is '+CLIENT.name+'.</strong> This is YOU.','personal'), 1000);
            setTimeout(() => this.msg(CLIENT.facts[0]+'. '+CLIENT.facts[1]+'.','personal'), 3500);
            setTimeout(() => this.msg('When your customers visit, <strong>they see THEMSELVES</strong>. Not a generic store. <em>Themselves</em>.','important'), 6500);
            setTimeout(() => this.msg('<div style="padding:24px;background:linear-gradient(135deg,rgba(76,175,80,0.2) 0%,rgba(255,215,0,0.2) 100%);border-radius:16px;border:3px solid #4CAF50"><div style="font-size:22px;font-weight:bold;margin-bottom:16px;color:#000;text-align:center">💰 More Personalization = More Money</div><div style="font-size:16px;line-height:1.7;text-align:center"><strong>A more personalized experience for YOUR customers.</strong><br><span style="font-size:20px;color:#4CAF50;font-weight:bold">More money for YOU.</span></div><div style="margin-top:18px;padding-top:18px;border-top:2px solid rgba(76,175,80,0.3);font-size:14px;text-align:center;color:#666">Each of your <strong>'+CLIENT.monthlyVisitors+' visitors</strong> gets their own twin</div></div>','important'), 10000);
        }
    };

    // ============================================
    // INITIALIZE
    // ============================================
    Avatar.render();
    Avatar.runDemo();

    console.log('%c✅ SYTE DEMO V3.4 READY!', 'background:#4CAF50;color:#fff;font-size:18px;padding:12px;font-weight:bold');
    console.log('Client: '+CLIENT.company+' ('+CLIENT.name+')');
    console.log('✨ New: Dynamic banner tells personalization story + Rotating hero text');

})();

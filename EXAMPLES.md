# Nugget Personalization Agent - Examples

This document provides practical examples of how to use the Nugget Personalization Agent in your Shopify store.

## Table of Contents
- [Basic Examples](#basic-examples)
- [Shopify Liquid Examples](#shopify-liquid-examples)
- [CSS Personalization](#css-personalization)
- [Advanced JavaScript Examples](#advanced-javascript-examples)
- [Complete Feature Examples](#complete-feature-examples)

---

## Basic Examples

### Example 1: Show Welcome Banner for Returning Visitors

Add this to your homepage section or `sections/index-template.liquid`:

```liquid
<div class="welcome-banner" style="display: none;">
  <h2 id="welcome-greeting">Welcome back!</h2>
  <p>Check out what's new since your last visit.</p>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile && profile.isReturningVisitor) {
      document.querySelector('.welcome-banner').style.display = 'block';

      // Add greeting
      const greeting = localStorage.getItem('nugget_greeting');
      if (greeting) {
        document.querySelector('#welcome-greeting').textContent = greeting + '! Welcome back!';
      }
    }
  });
</script>
```

### Example 2: Show First-Time Visitor Discount

```liquid
<div class="first-time-discount" style="display: none;">
  <div class="discount-content">
    <h3>Welcome! Get 10% off your first order</h3>
    <p>Use code: <strong>FIRST10</strong></p>
  </div>
</div>

<style>
  .first-time-discount {
    background: #f0f8ff;
    padding: 20px;
    text-align: center;
    border: 2px dashed #4CAF50;
    margin: 20px 0;
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile && !profile.isReturningVisitor) {
      document.querySelector('.first-time-discount').style.display = 'block';
    }
  });
</script>
```

### Example 3: Display Visit Counter

```liquid
<div class="visit-stats">
  <p>Your visit: <span id="visit-count">-</span></p>
  <p>Member since: <span id="first-visit">-</span></p>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile) {
      document.getElementById('visit-count').textContent = '#' + profile.visitCount;

      const firstVisit = new Date(profile.firstVisit);
      document.getElementById('first-visit').textContent = firstVisit.toLocaleDateString();
    }
  });
</script>
```

---

## Shopify Liquid Examples

### Example 4: Recently Viewed Products Section

Create a new section `sections/recently-viewed.liquid`:

```liquid
<div class="recently-viewed-section" style="display: none;">
  <h2>Recently Viewed Products</h2>
  <div id="recently-viewed-products" class="product-grid"></div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile && profile.viewedProducts && profile.viewedProducts.length > 0) {
      const container = document.getElementById('recently-viewed-products');
      const section = document.querySelector('.recently-viewed-section');

      // Show section
      section.style.display = 'block';

      // Get last 4 viewed products
      const recentProducts = profile.viewedProducts.slice(0, 4);

      // Fetch product details and render
      recentProducts.forEach(function(product) {
        fetchProductDetails(product.id, function(productData) {
          if (productData) {
            const productCard = createProductCard(productData);
            container.appendChild(productCard);
          }
        });
      });
    }
  });

  function fetchProductDetails(productId, callback) {
    // Use Shopify's product JSON endpoint
    fetch('/products.json?limit=250')
      .then(response => response.json())
      .then(data => {
        const product = data.products.find(p => p.id == productId);
        callback(product);
      })
      .catch(error => console.error('Error fetching product:', error));
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const image = product.images && product.images[0] ? product.images[0] : '';

    card.innerHTML = `
      <a href="/products/${product.handle}">
        <img src="${image}" alt="${product.title}" loading="lazy">
        <h3>${product.title}</h3>
        <p class="price">{{ currency_symbol }}${(product.variants[0].price / 100).toFixed(2)}</p>
      </a>
    `;

    return card;
  }
</script>

<style>
  .recently-viewed-section {
    margin: 40px 0;
    padding: 20px;
  }

  #recently-viewed-products {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .product-card img {
    width: 100%;
    height: auto;
  }
</style>
```

### Example 5: Personalized Hero Banner

In your `sections/hero-banner.liquid`:

```liquid
<div class="hero-banner">
  <h1 id="hero-title">Welcome to Our Store</h1>
  <p id="hero-subtitle">Discover amazing products</p>
  <a href="/collections/all" class="btn">Shop Now</a>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();
    const greeting = localStorage.getItem('nugget_greeting') || 'Hello';

    if (profile) {
      const title = document.getElementById('hero-title');
      const subtitle = document.getElementById('hero-subtitle');

      if (profile.isReturningVisitor) {
        title.textContent = greeting + '! Welcome Back!';

        if (profile.visitCount > 5) {
          subtitle.textContent = 'Thank you for being a loyal customer! 💎';
        } else {
          subtitle.textContent = 'Great to see you again! Check out our new arrivals.';
        }
      } else {
        title.textContent = greeting + '! Welcome to Our Store';
        subtitle.textContent = 'First time here? Get 10% off with code WELCOME10';
      }
    }
  });
</script>
```

### Example 6: Product Page - Show Related Products Based on History

In `templates/product.liquid` or in your product template:

```liquid
<div class="related-products" style="display: none;">
  <h2>You May Also Like</h2>
  <div id="related-products-container"></div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();

    if (profile && profile.viewedProducts && profile.viewedProducts.length > 1) {
      // Get current product ID
      const currentProductId = {{ product.id }};

      // Filter out current product
      const otherProducts = profile.viewedProducts.filter(p => p.id != currentProductId);

      if (otherProducts.length > 0) {
        document.querySelector('.related-products').style.display = 'block';

        // Show up to 3 related products
        const relatedProducts = otherProducts.slice(0, 3);

        relatedProducts.forEach(function(product) {
          // Create product card (simplified)
          const card = document.createElement('div');
          card.innerHTML = `
            <div class="product-card">
              <h3>${product.title}</h3>
              <p>Previously viewed</p>
            </div>
          `;
          document.getElementById('related-products-container').appendChild(card);
        });
      }
    }
  });
</script>
```

---

## CSS Personalization

### Example 7: Different Styles for First-Time vs Returning Visitors

Add to your `assets/theme.css` or in a `<style>` tag:

```css
/* Hide certain elements for first-time visitors */
.nugget-first-visitor .members-only-banner {
  display: none;
}

/* Show special offers for first-time visitors */
.nugget-first-visitor .first-time-offer {
  display: block;
}

/* Hide first-time offers for returning visitors */
.nugget-returning-visitor .first-time-offer {
  display: none;
}

/* Show loyalty rewards for returning visitors */
.nugget-returning-visitor .loyalty-program {
  display: block;
  background: #fffbea;
  border: 2px solid #ffd700;
  padding: 20px;
  margin: 20px 0;
}

/* Different header styles based on page type */
.nugget-page-home .header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nugget-page-product .header {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

/* Highlight add to cart button for returning visitors */
.nugget-returning-visitor .add-to-cart-button {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

### Example 8: Time-Based Personalization Styles

```css
/* Different banners based on time of day (set via JavaScript) */
body[data-time="morning"] .time-banner {
  background: linear-gradient(135deg, #FFE985 0%, #FA742B 100%);
}

body[data-time="afternoon"] .time-banner {
  background: linear-gradient(135deg, #74EBD5 0%, #9FACE6 100%);
}

body[data-time="evening"] .time-banner {
  background: linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%);
}
```

JavaScript to set the time attribute:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const hour = new Date().getHours();
  let timeOfDay = 'evening';

  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 18) timeOfDay = 'afternoon';

  document.body.setAttribute('data-time', timeOfDay);
});
```

---

## Advanced JavaScript Examples

### Example 9: Smart Product Recommendations

```javascript
window.addEventListener('nugget:productHistory', function(e) {
  const viewedProducts = e.detail.products;

  // Analyze product types
  const productTypes = {};
  viewedProducts.forEach(function(product) {
    if (product.type) {
      productTypes[product.type] = (productTypes[product.type] || 0) + 1;
    }
  });

  // Find most viewed type
  let topType = null;
  let maxCount = 0;
  for (const type in productTypes) {
    if (productTypes[type] > maxCount) {
      maxCount = productTypes[type];
      topType = type;
    }
  }

  if (topType) {
    console.log('User prefers:', topType);

    // Fetch products of this type
    fetch(`/collections/${topType.toLowerCase().replace(/\s+/g, '-')}/products.json`)
      .then(response => response.json())
      .then(data => {
        displayRecommendations(data.products);
      })
      .catch(error => console.log('Could not load recommendations'));
  }
});

function displayRecommendations(products) {
  const container = document.getElementById('smart-recommendations');
  if (!container) return;

  container.innerHTML = '<h2>Recommended for You</h2>';

  products.slice(0, 4).forEach(function(product) {
    const card = createProductCard(product);
    container.appendChild(card);
  });

  container.style.display = 'block';
}
```

### Example 10: Cart Abandonment Reminder

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const profile = NuggetPersonalization.getProfile();

  // Check if user added to cart but didn't checkout
  if (profile && profile.addedToCart && profile.addedToCart.length > 0) {
    const lastAddedTime = new Date(profile.addedToCart[0].timestamp);
    const now = new Date();
    const hoursSince = (now - lastAddedTime) / (1000 * 60 * 60);

    // If added to cart more than 2 hours ago, show reminder
    if (hoursSince > 2 && hoursSince < 48) {
      showCartReminder(profile.addedToCart[0]);
    }
  }
});

function showCartReminder(lastProduct) {
  const banner = document.createElement('div');
  banner.className = 'cart-reminder-banner';
  banner.innerHTML = `
    <p>Don't forget: <strong>${lastProduct.title}</strong> is waiting in your cart!</p>
    <a href="/cart" class="btn">Complete Your Purchase</a>
    <button onclick="this.parentElement.remove()">×</button>
  `;

  document.body.insertBefore(banner, document.body.firstChild);
}
```

### Example 11: Customer Loyalty Tier System

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const profile = NuggetPersonalization.getProfile();

  if (profile) {
    let tier = 'Bronze';
    let discount = 5;

    if (profile.visitCount >= 20) {
      tier = 'Platinum';
      discount = 20;
    } else if (profile.visitCount >= 10) {
      tier = 'Gold';
      discount = 15;
    } else if (profile.visitCount >= 5) {
      tier = 'Silver';
      discount = 10;
    }

    // Store tier in profile
    NuggetPersonalization.setPreference('loyaltyTier', tier);
    NuggetPersonalization.setPreference('loyaltyDiscount', discount);

    // Display tier badge
    displayLoyaltyBadge(tier, discount);
  }
});

function displayLoyaltyBadge(tier, discount) {
  const badge = document.createElement('div');
  badge.className = 'loyalty-badge loyalty-' + tier.toLowerCase();
  badge.innerHTML = `
    <span class="tier-icon">⭐</span>
    <span class="tier-name">${tier} Member</span>
    <span class="tier-benefit">${discount}% Off All Orders</span>
  `;

  const header = document.querySelector('.site-header');
  if (header) {
    header.appendChild(badge);
  }
}
```

### Example 12: Personalized Search Results

```javascript
// Add to your search page
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('/search')) {
    const profile = NuggetPersonalization.getProfile();

    if (profile && profile.viewedProducts && profile.viewedProducts.length > 0) {
      // Boost search results based on viewed product types
      personalizeSearchResults(profile);
    }
  }
});

function personalizeSearchResults(profile) {
  // Get preferred types
  const preferredTypes = JSON.parse(localStorage.getItem('nugget_preferred_product_types') || '{}');

  // Find search result elements (adjust selector for your theme)
  const searchResults = document.querySelectorAll('.search-result-item');

  searchResults.forEach(function(result) {
    const productType = result.getAttribute('data-product-type');

    if (productType && preferredTypes[productType]) {
      // Boost this result
      result.classList.add('personalized-result');
      result.style.order = '-1'; // Move to top

      // Add badge
      const badge = document.createElement('span');
      badge.className = 'personalized-badge';
      badge.textContent = 'Recommended for you';
      result.appendChild(badge);
    }
  });
}
```

---

## Complete Feature Examples

### Example 13: Complete Personalized Homepage

Create `sections/personalized-homepage.liquid`:

```liquid
<div class="personalized-homepage">
  <!-- Hero Section -->
  <div class="hero-section">
    <h1 id="hero-greeting">Welcome to Our Store</h1>
    <p id="hero-subtitle">Discover amazing products</p>
  </div>

  <!-- First-Time Visitor Section -->
  <div class="first-time-section" style="display: none;">
    <h2>New Here? Start Your Journey!</h2>
    <div class="benefits-grid">
      <div class="benefit">✅ Free Shipping on Orders $50+</div>
      <div class="benefit">🎁 10% Off First Order</div>
      <div class="benefit">💯 100% Satisfaction Guarantee</div>
    </div>
  </div>

  <!-- Returning Visitor Section -->
  <div class="returning-section" style="display: none;">
    <h2>Welcome Back!</h2>
    <div id="user-stats"></div>
    <div id="recently-viewed"></div>
  </div>

  <!-- Personalized Recommendations -->
  <div id="personalized-recommendations" style="display: none;">
    <h2>Picked Just For You</h2>
    <div id="recommendations-grid"></div>
  </div>
</div>

<style>
  .personalized-homepage {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .hero-section {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    margin-bottom: 40px;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }

  .benefit {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: center;
    font-size: 16px;
  }

  #recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .loyalty-badge {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1000;
  }

  .loyalty-platinum { border-left: 4px solid #e5e4e2; }
  .loyalty-gold { border-left: 4px solid #ffd700; }
  .loyalty-silver { border-left: 4px solid #c0c0c0; }
  .loyalty-bronze { border-left: 4px solid #cd7f32; }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();
    const greeting = localStorage.getItem('nugget_greeting') || 'Hello';

    if (!profile) return;

    // Update hero
    document.getElementById('hero-greeting').textContent = greeting + '!';

    if (profile.isReturningVisitor) {
      // Show returning visitor content
      document.querySelector('.returning-section').style.display = 'block';

      // Update subtitle
      document.getElementById('hero-subtitle').textContent =
        `Visit #${profile.visitCount} - Thanks for coming back!`;

      // Show user stats
      document.getElementById('user-stats').innerHTML = `
        <div class="user-stats">
          <div class="stat">
            <strong>${profile.visitCount}</strong>
            <span>Total Visits</span>
          </div>
          <div class="stat">
            <strong>${profile.viewedProducts ? profile.viewedProducts.length : 0}</strong>
            <span>Products Viewed</span>
          </div>
          <div class="stat">
            <strong>Member Since</strong>
            <span>${new Date(profile.firstVisit).toLocaleDateString()}</span>
          </div>
        </div>
      `;

      // Show recently viewed
      if (profile.viewedProducts && profile.viewedProducts.length > 0) {
        const recentlyViewed = document.getElementById('recently-viewed');
        recentlyViewed.innerHTML = '<h3>Recently Viewed</h3><div class="product-list"></div>';

        profile.viewedProducts.slice(0, 3).forEach(function(product) {
          const item = document.createElement('div');
          item.className = 'product-item';
          item.innerHTML = `<p>${product.title}</p>`;
          recentlyViewed.querySelector('.product-list').appendChild(item);
        });
      }

      // Show personalized recommendations
      showPersonalizedRecommendations(profile);

    } else {
      // Show first-time visitor content
      document.querySelector('.first-time-section').style.display = 'block';
      document.getElementById('hero-subtitle').textContent =
        'Get 10% off your first order with code WELCOME10';
    }
  });

  function showPersonalizedRecommendations(profile) {
    // This would integrate with your product catalog
    document.getElementById('personalized-recommendations').style.display = 'block';

    // Example: Show products based on viewed types
    const preferredTypes = JSON.parse(localStorage.getItem('nugget_preferred_product_types') || '{}');

    console.log('Showing recommendations based on preferences:', preferredTypes);
    // Implement actual product fetching here
  }
</script>
```

### Example 14: Complete Product Detail Page Personalization

Add to your `templates/product.liquid`:

```liquid
<!-- Personalized product page elements -->
<div id="personalized-product-elements">
  <!-- Returning visitor urgency -->
  <div class="urgency-banner" style="display: none;">
    <p>⚡ You viewed this before! Only <span id="stock-level">5</span> left in stock!</p>
  </div>

  <!-- First-time visitor trust signals -->
  <div class="trust-signals" style="display: none;">
    <div class="trust-item">✓ Free Returns</div>
    <div class="trust-item">✓ Secure Checkout</div>
    <div class="trust-item">✓ 1000+ Happy Customers</div>
  </div>

  <!-- Loyalty discount -->
  <div class="loyalty-discount" style="display: none;">
    <p>🎉 Your <span id="tier-name"></span> discount: <span id="discount-percent"></span>% off this item!</p>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const profile = NuggetPersonalization.getProfile();
    const currentProductId = {{ product.id }};

    if (!profile) return;

    // Check if user viewed this product before
    const viewedBefore = profile.viewedProducts &&
                        profile.viewedProducts.some(p => p.id == currentProductId);

    if (viewedBefore && profile.isReturningVisitor) {
      document.querySelector('.urgency-banner').style.display = 'block';
    }

    if (!profile.isReturningVisitor) {
      document.querySelector('.trust-signals').style.display = 'flex';
    }

    // Show loyalty discount
    const tier = NuggetPersonalization.getPreference('loyaltyTier');
    const discount = NuggetPersonalization.getPreference('loyaltyDiscount');

    if (tier && discount) {
      document.querySelector('.loyalty-discount').style.display = 'block';
      document.getElementById('tier-name').textContent = tier;
      document.getElementById('discount-percent').textContent = discount;
    }

    // Track this product view
    {% if product.id and product.title %}
      setTimeout(function() {
        NuggetPersonalization.getProfile(); // Triggers tracking
      }, 2000); // Track after 2 seconds
    {% endif %}
  });
</script>
```

---

## Testing Your Personalization

### Clear Data for Testing

```javascript
// In browser console, run these to test different scenarios:

// Reset to first-time visitor
localStorage.clear();
location.reload();

// Simulate returning visitor
const profile = NuggetPersonalization.getProfile();
profile.visitCount = 10;
profile.isReturningVisitor = true;
NuggetPersonalization.updateProfile(profile);
location.reload();

// Add fake product views
NuggetPersonalization.updateProfile({
  viewedProducts: [
    { id: 1234, title: 'Test Product 1', type: 'Clothing' },
    { id: 5678, title: 'Test Product 2', type: 'Accessories' }
  ]
});
```

---

These examples should give you a solid foundation for implementing personalization features in your Shopify store. Mix and match these examples based on your specific needs!

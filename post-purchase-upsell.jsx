/**
 * Hot Leathers Post-Purchase Upsell Extension
 * For Shopify Plus Post-Purchase Page
 *
 * This shows RIDE5 discount offer for additional relevant products
 * after the customer completes their purchase.
 */

import React, { useState, useEffect } from 'react';
import {
  extend,
  render,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Text,
  Layout,
  View,
  Banner,
  useExtensionApi,
  useExtensionData,
} from '@shopify/checkout-ui-extensions-react';

render('Checkout::PostPurchase::ShouldRender', () => <App />);

function App() {
  const {
    storage,
    done,
    query,
    inputData: { initialPurchase },
  } = useExtensionApi();

  const [loading, setLoading] = useState(true);
  const [upsellProducts, setUpsellProducts] = useState([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function fetchUpsellProducts() {
      try {
        // Get purchased products
        const purchasedProducts = initialPurchase.lineItems.map(item => ({
          id: item.product.id,
          type: item.product.productType,
          vendor: item.product.vendor,
          tags: item.product.tags || []
        }));

        console.log('Purchased products:', purchasedProducts);

        // Determine relevant upsell products based on what they bought
        const recommendedProducts = await getRecommendedProducts(purchasedProducts);

        setUpsellProducts(recommendedProducts);
        setLoading(false);

        // Only show post-purchase if we have recommendations
        if (recommendedProducts.length > 0) {
          // Show the post-purchase page
          return { behavior: 'SHOW' };
        } else {
          // Skip post-purchase page
          return { behavior: 'SKIP' };
        }
      } catch (error) {
        console.error('Error fetching upsell products:', error);
        setLoading(false);
        return { behavior: 'SKIP' };
      }
    }

    fetchUpsellProducts();
  }, []);

  async function getRecommendedProducts(purchasedProducts) {
    // Logic to determine what to recommend
    // This is simplified - customize based on your catalog

    const recommendations = [];

    // Example logic: If they bought a jacket, recommend gloves
    const boughtJacket = purchasedProducts.some(p =>
      p.type?.toLowerCase().includes('jacket') ||
      p.tags.some(tag => tag.toLowerCase().includes('jacket'))
    );

    const boughtGloves = purchasedProducts.some(p =>
      p.type?.toLowerCase().includes('glove') ||
      p.tags.some(tag => tag.toLowerCase().includes('glove'))
    );

    const boughtHelmet = purchasedProducts.some(p =>
      p.type?.toLowerCase().includes('helmet') ||
      p.tags.some(tag => tag.toLowerCase().includes('helmet'))
    );

    // Recommendation logic
    if (boughtJacket && !boughtGloves) {
      recommendations.push('gloves');
    }

    if (boughtJacket && !boughtHelmet) {
      recommendations.push('helmet');
    }

    if (boughtGloves && !boughtJacket) {
      recommendations.push('jacket');
    }

    // You'll need to replace these with actual product IDs from your store
    // Example: Fetch products by collection or type
    // For now, returning mock data structure

    const mockProducts = [
      {
        id: 'gid://shopify/Product/YOUR_PRODUCT_ID_1',
        title: 'Premium Leather Gloves',
        price: '49.99',
        image: 'https://cdn.shopify.com/...',
        variantId: 'gid://shopify/ProductVariant/YOUR_VARIANT_ID_1'
      },
      {
        id: 'gid://shopify/Product/YOUR_PRODUCT_ID_2',
        title: 'Riding Gear Essentials',
        price: '79.99',
        image: 'https://cdn.shopify.com/...',
        variantId: 'gid://shopify/ProductVariant/YOUR_VARIANT_ID_2'
      }
    ];

    // Return up to 2 products
    return mockProducts.slice(0, 2);
  }

  async function handleAcceptOffer(product) {
    setCalculating(true);

    try {
      // Create discount code for this order
      const discountCode = 'RIDE5';

      // Add the upsell product to a new order with discount
      const result = await query(
        `mutation addProductToOrder($variantId: ID!, $quantity: Int!, $discountCode: String) {
          changeset {
            addVariant(variantId: $variantId, quantity: $quantity, discountCode: $discountCode) {
              id
              price {
                amount
              }
            }
          }
        }`,
        {
          variables: {
            variantId: product.variantId,
            quantity: 1,
            discountCode: discountCode
          },
        }
      );

      console.log('Add to order result:', result);

      // Show success and close
      done();

    } catch (error) {
      console.error('Error adding product:', error);
      setCalculating(false);
    }
  }

  function handleDeclineOffer() {
    // Close post-purchase page
    done();
  }

  if (loading) {
    return (
      <Layout>
        <BlockStack spacing="base">
          <Text size="large">Loading your personalized offer...</Text>
        </BlockStack>
      </Layout>
    );
  }

  if (upsellProducts.length === 0) {
    // No products to show, skip
    done();
    return null;
  }

  const upsellProduct = upsellProducts[0]; // Show first product

  // Calculate discounted price
  const originalPrice = parseFloat(upsellProduct.price);
  const discountedPrice = originalPrice * 0.95; // 5% off

  return (
    <Layout>
      <BlockStack spacing="loose">
        {/* Header Banner */}
        <CalloutBanner title="🏍️ Wait! Complete Your Ride!">
          <Text>
            Get 5% off with code <strong>RIDE5</strong> - Perfect addition to your order!
          </Text>
        </CalloutBanner>

        {/* Product Details */}
        <View border="base" cornerRadius="base" padding="base">
          <BlockStack spacing="base">
            <Heading level={2}>{upsellProduct.title}</Heading>

            {upsellProduct.image && (
              <Image
                source={upsellProduct.image}
                alt={upsellProduct.title}
              />
            )}

            <BlockStack spacing="tight">
              <Text size="large" appearance="subdued">
                <s>${originalPrice.toFixed(2)}</s>
              </Text>
              <Text size="extraLarge" emphasis="bold">
                ${discountedPrice.toFixed(2)} with RIDE5
              </Text>
              <Text size="small" appearance="success">
                Save ${(originalPrice - discountedPrice).toFixed(2)} (5% OFF)
              </Text>
            </BlockStack>

            <Text appearance="subdued" size="small">
              *This discount cannot be combined with other offers
            </Text>
          </BlockStack>
        </View>

        {/* Action Buttons */}
        <BlockStack spacing="base">
          <Button
            primary
            loading={calculating}
            onPress={() => handleAcceptOffer(upsellProduct)}
          >
            Add to Order - Save 5% →
          </Button>

          <Button
            onPress={handleDeclineOffer}
            plain
          >
            No thanks, continue
          </Button>
        </BlockStack>

        {/* Trust Signals */}
        <Banner status="info">
          <BlockStack spacing="tight">
            <Text size="small">✓ Free Shipping on Orders $75+</Text>
            <Text size="small">✓ 30-Day Returns</Text>
            <Text size="small">✓ Secure Checkout</Text>
          </BlockStack>
        </Banner>
      </BlockStack>
    </Layout>
  );
}

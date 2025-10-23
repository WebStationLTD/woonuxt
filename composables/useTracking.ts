/**
 * useTracking Composable
 * Централизирано управление на tracking събития за Meta Pixel, GA4, Google Ads и GTM
 */

export interface TrackingProduct {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  brand?: string;
  variant?: string;
  sku?: string;
}

export interface TrackingPurchase {
  orderId: string;
  total: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  products: TrackingProduct[];
  coupon?: string;
}

export function useTracking() {
  const config = useRuntimeConfig();

  // Проверка дали tracking е активиран
  const isEnabled = config.public.TRACKING_ENABLED;
  const isDebug = config.public.TRACKING_DEBUG;

  /**
   * Debug log функция
   */
  function debugLog(eventName: string, data?: any) {
    if (isDebug) {
      console.log(`🎯 Tracking Event: ${eventName}`, data || "");
    }
  }

  /**
   * Изпраща generic event към всички платформи
   */
  function trackEvent(eventName: string, params: any = {}) {
    if (!isEnabled || !process.client) return;

    debugLog(eventName, params);

    // Meta Pixel
    if (window.fbq) {
      window.fbq("track", eventName, params);
    }

    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", eventName, params);
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    }
  }

  /**
   * View Content - Проследяване на преглед на продукт
   */
  function trackViewContent(product: TrackingProduct) {
    if (!isEnabled || !process.client) return;

    debugLog("ViewContent", product);

    // Meta Pixel - ViewContent
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.price,
        currency: "BGN",
      });
    }

    // Google Analytics 4 - view_item
    if (window.gtag) {
      window.gtag("event", "view_item", {
        currency: "BGN",
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            item_brand: product.brand,
            price: product.price,
          },
        ],
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              item_category: product.category,
              item_brand: product.brand,
              price: product.price,
              quantity: 1,
            },
          ],
        },
      });
    }
  }

  /**
   * Add to Cart - Проследяване на добавяне в количка
   */
  function trackAddToCart(product: TrackingProduct) {
    if (!isEnabled || !process.client) return;

    debugLog("AddToCart", product);

    const quantity = product.quantity || 1;
    const value = product.price * quantity;

    // Meta Pixel - AddToCart
    if (window.fbq) {
      window.fbq("track", "AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: value,
        currency: "BGN",
      });
    }

    // Google Analytics 4 - add_to_cart
    if (window.gtag) {
      window.gtag("event", "add_to_cart", {
        currency: "BGN",
        value: value,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            item_brand: product.brand,
            price: product.price,
            quantity: quantity,
          },
        ],
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "add_to_cart",
        ecommerce: {
          currency: "BGN",
          value: value,
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              item_category: product.category,
              item_brand: product.brand,
              price: product.price,
              quantity: quantity,
            },
          ],
        },
      });
    }
  }

  /**
   * Remove from Cart - Проследяване на премахване от количка
   */
  function trackRemoveFromCart(product: TrackingProduct) {
    if (!isEnabled || !process.client) return;

    debugLog("RemoveFromCart", product);

    const quantity = product.quantity || 1;
    const value = product.price * quantity;

    // Meta Pixel - няма стандартно събитие, използваме custom
    if (window.fbq) {
      window.fbq("trackCustom", "RemoveFromCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: value,
        currency: "BGN",
      });
    }

    // Google Analytics 4 - remove_from_cart
    if (window.gtag) {
      window.gtag("event", "remove_from_cart", {
        currency: "BGN",
        value: value,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            item_brand: product.brand,
            price: product.price,
            quantity: quantity,
          },
        ],
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "remove_from_cart",
        ecommerce: {
          currency: "BGN",
          value: value,
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              item_category: product.category,
              item_brand: product.brand,
              price: product.price,
              quantity: quantity,
            },
          ],
        },
      });
    }
  }

  /**
   * Initiate Checkout - Проследяване на начало на checkout процес
   */
  function trackInitiateCheckout(
    cartValue: number,
    products: TrackingProduct[]
  ) {
    if (!isEnabled || !process.client) return;

    debugLog("InitiateCheckout", { value: cartValue, products });

    // Meta Pixel - InitiateCheckout
    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_ids: products.map((p) => p.id),
        contents: products.map((p) => ({
          id: p.id,
          quantity: p.quantity || 1,
        })),
        value: cartValue,
        currency: "BGN",
        num_items: products.reduce((sum, p) => sum + (p.quantity || 1), 0),
      });
    }

    // Google Analytics 4 - begin_checkout
    if (window.gtag) {
      window.gtag("event", "begin_checkout", {
        currency: "BGN",
        value: cartValue,
        items: products.map((p) => ({
          item_id: p.id,
          item_name: p.name,
          item_category: p.category,
          item_brand: p.brand,
          price: p.price,
          quantity: p.quantity || 1,
        })),
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: "BGN",
          value: cartValue,
          items: products.map((p) => ({
            item_id: p.id,
            item_name: p.name,
            item_category: p.category,
            item_brand: p.brand,
            price: p.price,
            quantity: p.quantity || 1,
          })),
        },
      });
    }
  }

  /**
   * Purchase - Проследяване на завършена покупка
   */
  function trackPurchase(purchase: TrackingPurchase) {
    if (!isEnabled || !process.client) return;

    debugLog("Purchase", purchase);

    const currency = purchase.currency || "BGN";

    // Meta Pixel - Purchase
    if (window.fbq) {
      window.fbq("track", "Purchase", {
        content_ids: purchase.products.map((p) => p.id),
        contents: purchase.products.map((p) => ({
          id: p.id,
          quantity: p.quantity || 1,
        })),
        value: purchase.total,
        currency: currency,
        num_items: purchase.products.reduce(
          (sum, p) => sum + (p.quantity || 1),
          0
        ),
      });
    }

    // Google Analytics 4 - purchase
    if (window.gtag) {
      window.gtag("event", "purchase", {
        transaction_id: purchase.orderId,
        value: purchase.total,
        tax: purchase.tax || 0,
        shipping: purchase.shipping || 0,
        currency: currency,
        coupon: purchase.coupon || "",
        items: purchase.products.map((p) => ({
          item_id: p.id,
          item_name: p.name,
          item_category: p.category,
          item_brand: p.brand,
          price: p.price,
          quantity: p.quantity || 1,
        })),
      });
    }

    // Google Ads Conversion
    if (window.gtag && config.public.GOOGLE_ADS_ID) {
      window.gtag("event", "conversion", {
        send_to: `${config.public.GOOGLE_ADS_ID}/purchase`,
        value: purchase.total,
        currency: currency,
        transaction_id: purchase.orderId,
      });
    }

    // GTM Data Layer - Woocommerce Purchase Event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "woocommerce_purchase",
        ecommerce: {
          transaction_id: purchase.orderId,
          value: purchase.total,
          tax: purchase.tax || 0,
          shipping: purchase.shipping || 0,
          currency: currency,
          coupon: purchase.coupon || "",
          items: purchase.products.map((p) => ({
            item_id: p.id,
            item_name: p.name,
            item_category: p.category,
            item_brand: p.brand,
            price: p.price,
            quantity: p.quantity || 1,
          })),
        },
      });

      // И стандартно GA4 purchase събитие
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: purchase.orderId,
          value: purchase.total,
          tax: purchase.tax || 0,
          shipping: purchase.shipping || 0,
          currency: currency,
          coupon: purchase.coupon || "",
          items: purchase.products.map((p) => ({
            item_id: p.id,
            item_name: p.name,
            item_category: p.category,
            item_brand: p.brand,
            price: p.price,
            quantity: p.quantity || 1,
          })),
        },
      });
    }
  }

  /**
   * Search - Проследяване на търсене
   */
  function trackSearch(searchTerm: string, results?: number) {
    if (!isEnabled || !process.client) return;

    debugLog("Search", { search_term: searchTerm, results });

    // Meta Pixel - Search
    if (window.fbq) {
      window.fbq("track", "Search", {
        search_string: searchTerm,
        content_category: "product",
      });
    }

    // Google Analytics 4 - search
    if (window.gtag) {
      window.gtag("event", "search", {
        search_term: searchTerm,
        ...(results !== undefined && { results }),
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "search",
        search_term: searchTerm,
        ...(results !== undefined && { results }),
      });
    }
  }

  /**
   * Lead - Проследяване на генериране на lead (напр. contact form)
   */
  function trackLead(leadType?: string) {
    if (!isEnabled || !process.client) return;

    debugLog("Lead", { lead_type: leadType });

    // Meta Pixel - Lead
    if (window.fbq) {
      window.fbq("track", "Lead", {
        content_category: leadType || "contact_form",
      });
    }

    // Google Analytics 4 - generate_lead
    if (window.gtag) {
      window.gtag("event", "generate_lead", {
        lead_type: leadType || "contact_form",
      });
    }

    // GTM Data Layer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "generate_lead",
        lead_type: leadType || "contact_form",
      });
    }
  }

  return {
    trackEvent,
    trackViewContent,
    trackAddToCart,
    trackRemoveFromCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackLead,
  };
}

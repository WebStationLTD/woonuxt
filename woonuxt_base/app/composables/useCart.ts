import type { AddToCartInput } from '#gql';

/**
 * @name useCart
 * @description A composable that handles the cart in local storage
 */
export function useCart() {
  const { storeSettings } = useAppConfig();

  const cart = useState<Cart | null>('cart', () => null);
  const isShowingCart = useState<boolean>('isShowingCart', () => false);
  const isUpdatingCart = useState<boolean>('isUpdatingCart', () => false);
  const isUpdatingCoupon = useState<boolean>('isUpdatingCoupon', () => false);
  const paymentGateways = useState<PaymentGateways | null>('paymentGateways', () => null);
  const { logGQLError, clearAllCookies } = useHelpers();

  /** Refesh the cart from the server
   * @returns {Promise<boolean>} - A promise that resolves
   * to true if the cart was successfully refreshed
   */
  async function refreshCart(): Promise<boolean> {
    try {
      const { cart, customer, viewer, paymentGateways, loginClients } = await GqlGetCart();
      const { updateCustomer, updateViewer, updateLoginClients } = useAuth();

      if (cart) updateCart(cart);
      if (customer) updateCustomer(customer);
      if (viewer) updateViewer(viewer);
      if (paymentGateways) updatePaymentGateways(paymentGateways);
      if (loginClients) updateLoginClients(loginClients.filter((client) => client !== null));

      return true; // Cart was successfully refreshed
    } catch (error: any) {
      logGQLError(error);
      clearAllCookies();
      resetInitialState();
      return false; // Cart was not successfully refreshed
    } finally {
      isUpdatingCart.value = false;
    }
  }

  function resetInitialState() {
    cart.value = null;
    paymentGateways.value = null;
  }

  function updateCart(payload?: Cart | null): void {
    cart.value = payload || null;
  }

  function updatePaymentGateways(payload: PaymentGateways): void {
    paymentGateways.value = payload;
  }

  // toggle the cart visibility
  function toggleCart(state: boolean | undefined = undefined): void {
    isShowingCart.value = state ?? !isShowingCart.value;
  }

  // add an item to the cart
  async function addToCart(input: AddToCartInput): Promise<void> {
    isUpdatingCart.value = true;

    try {
      const { addToCart } = await GqlAddToCart({ input });
      if (addToCart?.cart) {
        cart.value = addToCart.cart;

        // Показваме success нотификация
        const { showCartSuccess } = useNotifications();

        // Намираме добавения продукт за да получим името му
        const cartItems = addToCart.cart.contents?.nodes || [];
        const addedItem = cartItems.find((item: any) => item.product?.node?.databaseId === input.productId);

        const productName = addedItem?.product?.node?.name || addedItem?.variation?.node?.name || 'Продуктът';
        const quantity = input.quantity || 1;

        showCartSuccess(productName, quantity);

        // 🎯 TRACKING: AddToCart Event
        if (addedItem && process.client) {
          const { trackAddToCart } = useTracking();
          const product = addedItem.product?.node || addedItem.variation?.node;

          if (product) {
            trackAddToCart({
              id: product.databaseId,
              name: product.name || productName,
              price: parseFloat(product.price?.replace(/[^\d.]/g, '') || '0'),
              quantity: quantity,
              category: product.productCategories?.nodes?.[0]?.name,
              brand: product.attributes?.nodes?.find((attr: any) => attr.name === 'pa_brands')?.options?.[0],
              sku: product.sku,
            });
          }
        }
      }

      // Auto open the cart when an item is added to the cart if the setting is enabled
      const { storeSettings } = useAppConfig();
      if (storeSettings.autoOpenCart && !isShowingCart.value) toggleCart(true);
    } catch (error: any) {
      // Показваме error нотификация при грешка
      const { showError } = useNotifications();
      showError('Грешка при добавяне', 'Възникна проблем при добавяне на продукта в количката');
      logGQLError(error);
    }
  }

  // remove an item from the cart
  async function removeItem(key: string) {
    isUpdatingCart.value = true;

    // 🎯 TRACKING: RemoveFromCart Event - вземаме данните ПРЕДИ премахване
    if (process.client && cart.value?.contents?.nodes) {
      const itemToRemove = cart.value.contents.nodes.find((item: any) => item.key === key);

      if (itemToRemove) {
        const { trackRemoveFromCart } = useTracking();
        const product = itemToRemove.product?.node || itemToRemove.variation?.node;

        if (product) {
          trackRemoveFromCart({
            id: product.databaseId,
            name: product.name || 'Продукт',
            price: parseFloat(product.price?.replace(/[^\d.]/g, '') || '0'),
            quantity: itemToRemove.quantity || 1,
            category: product.productCategories?.nodes?.[0]?.name,
            brand: product.attributes?.nodes?.find((attr: any) => attr.name === 'pa_brands')?.options?.[0],
            sku: product.sku,
          });
        }
      }
    }

    const { updateItemQuantities } = await GqlUpDateCartQuantity({ key, quantity: 0 });
    updateCart(updateItemQuantities?.cart);
  }

  // update the quantity of an item in the cart
  async function updateItemQuantity(key: string, quantity: number): Promise<void> {
    isUpdatingCart.value = true;
    try {
      const { updateItemQuantities } = await GqlUpDateCartQuantity({ key, quantity });
      updateCart(updateItemQuantities?.cart);
    } catch (error: any) {
      logGQLError(error);
    }
  }

  // empty the cart
  async function emptyCart(): Promise<void> {
    try {
      isUpdatingCart.value = true;
      const { emptyCart } = await GqlEmptyCart();
      updateCart(emptyCart?.cart);
    } catch (error: any) {
      logGQLError(error);
    }
  }

  // Update shipping method
  async function updateShippingMethod(shippingMethods: string) {
    isUpdatingCart.value = true;
    const { updateShippingMethod } = await GqlChangeShippingMethod({ shippingMethods });
    updateCart(updateShippingMethod?.cart);
  }

  // Apply coupon
  async function applyCoupon(code: string): Promise<{ message: string | null }> {
    try {
      isUpdatingCoupon.value = true;
      const { applyCoupon } = await GqlApplyCoupon({ code });
      updateCart(applyCoupon?.cart);
      isUpdatingCoupon.value = false;
    } catch (error: any) {
      isUpdatingCoupon.value = false;
      logGQLError(error);
    }
    return { message: null };
  }

  // Remove coupon
  async function removeCoupon(code: string): Promise<void> {
    try {
      isUpdatingCart.value = true;
      const { removeCoupons } = await GqlRemoveCoupons({ codes: [code] });
      updateCart(removeCoupons?.cart);
    } catch (error) {
      logGQLError(error);
      isUpdatingCart.value = false;
    }
  }

  // Stop the loading spinner when the cart is updated
  watch(cart, (val) => {
    isUpdatingCart.value = false;
  });

  // Check if all products in the cart are virtual
  const allProductsAreVirtual = computed(() => {
    const nodes = cart.value?.contents?.nodes || [];
    return nodes.length === 0 ? false : nodes.every((node) => (node.product?.node as SimpleProduct)?.virtual === true);
  });

  // Check if the billing address is enabled
  const isBillingAddressEnabled = computed(() => (storeSettings.hideBillingAddressForVirtualProducts ? !allProductsAreVirtual.value : true));

  return {
    cart,
    isShowingCart,
    isUpdatingCart,
    isUpdatingCoupon,
    paymentGateways,
    isBillingAddressEnabled,
    updateCart,
    refreshCart,
    toggleCart,
    addToCart,
    removeItem,
    updateItemQuantity,
    emptyCart,
    updateShippingMethod,
    applyCoupon,
    removeCoupon,
  };
}

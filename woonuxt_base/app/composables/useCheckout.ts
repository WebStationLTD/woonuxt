import type { CheckoutInput, CreateAccountInput, UpdateCustomerInput } from '#gql';

export function useCheckout() {
  const orderInput = useState<any>('orderInput', () => {
    return {
      customerNote: '',
      paymentMethod: '',
      shipToDifferentAddress: false,
      metaData: [{ key: 'order_via', value: 'WooNuxt' }],
    };
  });

  const isProcessingOrder = useState<boolean>('isProcessingOrder', () => false);

  // if Country or State are changed, calculate the shipping rates again
  async function updateShippingLocation() {
    const { customer, viewer } = useAuth();
    const { isUpdatingCart, refreshCart } = useCart();

    isUpdatingCart.value = true;

    try {
      if (!viewer?.value?.id) {
        throw new Error('Viewer ID is missing.');
      }

      const { updateCustomer } = await GqlUpdateCustomer({
        input: {
          id: viewer.value.id,
          shipping: orderInput.value.shipToDifferentAddress ? customer.value.shipping : customer.value.billing,
          billing: customer.value.billing,
        } as UpdateCustomerInput,
      });

      if (updateCustomer) await refreshCart();
    } catch (error) {
      // Error updating shipping location
    } finally {
      isUpdatingCart.value = false;
    }
  }

  async function openPayPalWindow(redirectUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const width = 750;
      const height = 750;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2 + 80;
      const payPalWindow = window.open(redirectUrl, '', `width=${width},height=${height},top=${top},left=${left}`);
      const timer = setInterval(() => {
        if (payPalWindow && payPalWindow.closed) {
          clearInterval(timer);
          resolve(true);
        }
      }, 500);
    });
  }

  const processCheckout = async (isPaid = false): Promise<any> => {
    const { customer, loginUser } = useAuth();
    const router = useRouter();
    const { replaceQueryParam } = useHelpers();
    const { cart, emptyCart, refreshCart } = useCart();

    isProcessingOrder.value = true;

    const { username, password, shipToDifferentAddress } = orderInput.value;
    const billing = customer.value?.billing;
    const shipping = shipToDifferentAddress ? customer.value?.shipping : billing;
    const shippingMethod = cart.value?.chosenShippingMethods;

    try {
      let checkoutPayload: CheckoutInput = {
        billing,
        shipping,
        shippingMethod,
        metaData: orderInput.value.metaData,
        paymentMethod: orderInput.value.paymentMethod.id,
        customerNote: orderInput.value.customerNote,
        shipToDifferentAddress,
        transactionId: orderInput.value.transactionId,
        isPaid,
      };
      // Create account
      if (orderInput.value.createAccount) {
        checkoutPayload.account = { username, password } as CreateAccountInput;
      } else {
        // Remove account from checkoutPayload if not creating account otherwise it will create an account anyway
        checkoutPayload.account = null;
      }

      const { checkout } = await GqlCheckout(checkoutPayload);

      // Login user if account was created during checkout
      if (orderInput.value.createAccount) {
        await loginUser({ username, password });
      }

      const orderId = checkout?.order?.databaseId;
      const orderKey = checkout?.order?.orderKey;
      const orderInputPaymentId = orderInput.value.paymentMethod.id;
      const isPayPal = orderInputPaymentId === 'paypal' || orderInputPaymentId === 'ppcp-gateway';
      const isBorica = orderInputPaymentId === 'borica_emv';

      // Съхраняваме данните за поръчката в localStorage
      if (checkout?.order) {
        try {
          localStorage.setItem(
            'lastOrder',
            JSON.stringify({
              id: orderId,
              key: orderKey,
              total: checkout.order.rawTotal,
              status: checkout.order.status,
              date: checkout.order.date,
              paymentMethod: checkout.order.paymentMethod,
              paymentMethodTitle: checkout.order.paymentMethodTitle,
            }),
          );
        } catch (e) {
          // Не може да се запише поръчката в localStorage
        }
      }

      // PayPal redirect
      if ((await checkout?.redirect) && isPayPal) {
        const frontEndUrl = window.location.origin;
        let redirectUrl = checkout?.redirect ?? '';
        const payPalReturnUrl = `${frontEndUrl}/checkout/order-received/${orderId}/?key=${orderKey}&from_paypal=true`;
        const payPalCancelUrl = `${frontEndUrl}/checkout/?cancel_order=true&from_paypal=true`;

        redirectUrl = replaceQueryParam('return', payPalReturnUrl, redirectUrl);
        redirectUrl = replaceQueryParam('cancel_return', payPalCancelUrl, redirectUrl);
        redirectUrl = replaceQueryParam('bn', 'WooNuxt_Cart', redirectUrl);

        const isPayPalWindowClosed = await openPayPalWindow(redirectUrl);

        if (isPayPalWindowClosed) {
          // За регистрирани потребители, продължаваме към страницата с детайли за поръчката
          if (customer.value?.email && customer.value.email !== 'guest') {
            router.push(`/checkout/order-received/${orderId}/?key=${orderKey}&fetch_delay=true`);
          } else {
            // За гост потребители, пренасочваме към страницата за благодарности
            router.push('/thank-you');
          }
        }
      }
      // Borica redirect - ИЗПОЛЗВАМЕ WP плъгина
      else if ((await checkout?.redirect) && isBorica) {
        const redirectUrl = checkout?.redirect ?? '';

        console.log('🔄 Using WordPress Borica plugin redirect:', {
          redirectUrl,
          orderId,
          orderKey,
        });

        // Пренасочваме към WordPress Borica URL
        // WordPress ще генерира Borica формата и ще пренасочи към gateway
        window.location.href = redirectUrl;
        return checkout;
      } else {
        // За регистрирани потребители, продължаваме към страницата с детайли за поръчката
        if (customer.value?.email && customer.value.email !== 'guest') {
          router.push(`/checkout/order-received/${orderId}/?key=${orderKey}`);
        } else {
          // За гост потребители, пренасочваме към страницата за благодарности
          router.push('/thank-you');
        }
      }

      if ((await checkout?.result) !== 'success') {
        alert('There was an error processing your order. Please try again.');
        window.location.reload();
        return checkout;
      } else {
        await emptyCart();
        await refreshCart();
      }
    } catch (error: any) {
      const errorMessage = error?.gqlErrors?.[0].message;

      if (errorMessage?.includes('An account is already registered with your email address')) {
        alert('An account is already registered with your email address');
        return null;
      }

      alert(errorMessage);
      return null;
    } finally {
      isProcessingOrder.value = false;
    }
  };

  return {
    orderInput,
    isProcessingOrder,
    processCheckout,
    updateShippingLocation,
  };
}

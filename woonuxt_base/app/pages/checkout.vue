<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, CreateSourceData, StripeCardElement } from '@stripe/stripe-js';

const { t } = useI18n();
const { query } = useRoute();
const router = useRouter();
const { cart, isUpdatingCart, paymentGateways, refreshCart } = useCart();
const { viewer, customer } = useAuth();
const { orderInput, isProcessingOrder, processCheckout } = useCheckout();
const { initiatePayment, redirectToGateway, validatePaymentData, generateOrderDescription, extractAmountFromCart } = useBorica();
const tbiLoanPayment = useTBILoan();
const runtimeConfig = useRuntimeConfig();
const stripeKey = runtimeConfig.public?.STRIPE_PUBLISHABLE_KEY as string | null;

// Динамичен текст на бутона според метода на плащане
const buttonText = computed<string>(() => {
  if (isProcessingOrder.value) {
    return t('messages.general.processing');
  }
  
  const paymentMethodId = orderInput.value.paymentMethod?.id;
  
  // Ако е наложен платеж или банков превод -> "Поръчване"
  if (paymentMethodId === 'cod' || paymentMethodId === 'bacs') {
    return 'Поръчване';
  }
  
  // За всички останали (картови плащания) -> "Към плащане"
  return t('messages.shop.checkoutButton');
});

const isCheckoutDisabled = computed<boolean>(() => isProcessingOrder.value || isUpdatingCart.value || !orderInput.value.paymentMethod);

const isInvalidEmail = ref<boolean>(false);
const stripe: Stripe | null = stripeKey ? await loadStripe(stripeKey) : null;
const elements = ref();
const isPaid = ref<boolean>(false);

onBeforeMount(async () => {
  if (query.cancel_order) window.close();

  // Показваме грешки за Borica плащания
  if (query.payment_error) {
    const errorMessage = getPaymentErrorMessage(query.payment_error as string);
    if (errorMessage) {
      alert(errorMessage);
    }
  }
});

// 🎯 Refresh cart and TRACKING: InitiateCheckout при влизане в checkout страница
onMounted(async () => {
  // Refresh the cart first to ensure it's up-to-date
  refreshCart();

  if (process.client && cart.value && !cart.value.isEmpty) {
    const { trackInitiateCheckout } = useTracking();

    // Изчисляваме общата стойност
    const cartTotal = parseFloat(cart.value.total?.replace(/[^\d.]/g, '') || '0');

    // Подготвяме продуктите
    const products = (cart.value.contents?.nodes || []).map((item: any) => {
      const product = item.product?.node || item.variation?.node;
      return {
        id: product?.databaseId || '',
        name: product?.name || '',
        price: parseFloat(product?.price?.replace(/[^\d.]/g, '') || '0'),
        quantity: item.quantity || 1,
        category: product?.productCategories?.nodes?.[0]?.name,
        brand: product?.attributes?.nodes?.find((attr: any) => attr.name === 'pa_brands')?.options?.[0],
        sku: product?.sku,
      };
    });

    trackInitiateCheckout(cartTotal, products);
  }
});

function getPaymentErrorMessage(errorType: string): string {
  switch (errorType) {
    case 'borica':
      return 'Плащането чрез Борика е неуспешно. Моля, опитайте отново.';
    case 'borica_unknown':
      return 'Възникна неочаквана грешка при плащането чрез Борика.';
    case 'missing_params':
      return 'Липсват параметри за обработка на плащането.';
    case 'processing_failed':
      return 'Грешка при обработка на плащането. Моля, свържете се с нас.';
    case 'borica_generation':
      return 'Не може да се генерира Borica payment URL. Моля, опитайте отново.';
    case 'borica_cancelled':
      return 'Плащането чрез Borica е отменено.';
    default:
      return 'Възникна грешка при плащането. Моля, опитайте отново.';
  }
}

const payNow = async () => {
  buttonText.value = t('messages.general.processing');

  try {
    const method = orderInput.value.paymentMethod?.id;

    if (method === 'stripe' && stripe && elements.value) {
      const { stripePaymentIntent } = await GqlGetStripePaymentIntent();
      const clientSecret = stripePaymentIntent?.clientSecret || '';

      const cardElement = elements.value.getElement('card') as StripeCardElement;

      const { setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      const { source } = await stripe.createSource(cardElement as CreateSourceData);

      if (source) orderInput.value.metaData.push({ key: '_stripe_source_id', value: source.id });
      if (setupIntent) orderInput.value.metaData.push({ key: '_stripe_intent_id', value: setupIntent.id });

      isPaid.value = setupIntent?.status === 'succeeded' || false;
      orderInput.value.transactionId = source?.created?.toString() || new Date().getTime().toString();
    } else if (method === 'cod') {
      isPaid.value = false;
      orderInput.value.transactionId = new Date().getTime().toString();
      orderInput.value.metaData.push({ key: '_chosen_payment_method', value: 'cash_on_delivery' });
    } else if (method === 'borica_emv') {
      // Използваме custom Borica интеграция
      await handleBoricaPayment();
      return; // Не продължаваме с нормалния checkout flow

    } else if(method === 'tbi_bank') {
      await handleTBIButtonPayment();
      return; // Не продължаваме с нормалния checkout flow
    } else {
      isPaid.value = false;
      orderInput.value.transactionId = new Date().getTime().toString();
      orderInput.value.metaData.push({ key: '_chosen_payment_method', value: method });
    }

    const order = await processCheckout(isPaid.value);

    if (order?.databaseId) {
      router.push('/thank-you');
    } else {
      throw new Error('Няма order ID за redirect!');
    }
  } catch (error) {
    buttonText.value = t('messages.shop.placeOrder');
  }
};

const handleStripeElement = (stripeElements: StripeElements): void => {
  elements.value = stripeElements;
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const checkEmailOnBlur = (email?: string | null): void => {
  if (email) isInvalidEmail.value = !emailRegex.test(email);
};

const checkEmailOnInput = (email?: string | null): void => {
  if (email && isInvalidEmail.value) isInvalidEmail.value = !emailRegex.test(email);
};

// Обработка на Borica плащане
const handleBoricaPayment = async (): Promise<void> => {
  console.log('🔵 handleBoricaPayment() STARTED');

  try {
    buttonText.value = 'Подготвяне на плащането...';

    // Проверяваме дали има количка
    if (!cart.value || cart.value.isEmpty) {
      throw new Error('Количката е празна');
    }

    const checkout = await createOrder('borica_emv');

    const orderId = checkout.order.databaseId;
    console.log('Order created successfully:', { orderId, orderKey: checkout.order.orderKey });

    const { customer } = useAuth();
    const billing = customer.value?.billing;
    // Подготвяме данните за Borica плащане
    const amount = extractAmountFromCart(cart.value);
    const firstName = billing?.firstName || customer.value?.firstName || '';
    const lastName = billing?.lastName || customer.value?.lastName || '';
    const paymentData = {
      orderId: orderId.toString(),
      amount: amount,
      currency: 'BGN',
      description: generateOrderDescription({ orderId }),
      customerEmail: billing?.email || customer.value?.email || '',
      customerName: [firstName, lastName].filter(Boolean).join(' ').toUpperCase(),
    };

    console.log('Borica payment data:', paymentData);

    // Валидираме данните
    if (!validatePaymentData(paymentData)) {
      return;
    }

    buttonText.value = 'Пренасочване към Борика...';

    // Инициализираме плащането
    const result = await initiatePayment(paymentData);

    if (result.success && result.formData) {
      // Пренасочваме към Borica gateway
      console.log('🚀 REDIRECTING TO BORICA GATEWAY NOW!');
      redirectToGateway(result.formData);
      // ВАЖНО: След redirect функцията трябва да спре изпълнението
      return;
    } else {
      throw new Error(result.error || 'Грешка при инициализиране на плащането');
    }
  } catch (error: any) {
    console.error('Borica payment error:', error);
    buttonText.value = t('messages.shop.placeOrder');

    // Показваме грешка на потребителя
    const { showError } = useNotifications();

    let errorMessage = 'Възникна грешка при обработка на плащането';

    if (error?.gqlErrors?.[0]?.message) {
      errorMessage = error.gqlErrors[0].message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    showError('Грешка при плащане', errorMessage);
  }

  console.log('🔚 handleBoricaPayment() function COMPLETED - SHOULD NOT CONTINUE TO processCheckout()');
};

const handleTBIButtonPayment = async (): Promise<void> => {
  buttonText.value = 'Пренасочване към TBI...';

  try {
    const checkout = await createOrder('tbi_bank', [{ key: '_tbi_checkout_status', value: 'Draft' }]);
    const orderId = checkout.order.databaseId;

    const result = await tbiLoanPayment.initiateTBILoanPayment({ orderId: orderId });

    if(result.error === 0) {
      window.location.href = result.url;
    } else {
      throw new Error("Failed to register order");
    }
  } catch (error) {
    buttonText.value = t('messages.shop.placeOrder');
  }
}

const createOrder = async (paymentMethod: string = 'borica_emv', extraMetaData: any = []): Promise<any> => {
  try {
    // Проверяваме дали има количка
    if (!cart.value || cart.value.isEmpty) {
      throw new Error('Количката е празна');
    }

    // Подготвяме метаданните без да променяме orderInput преждевременно
    const metadata = [
      { key: 'order_via', value: 'WooNuxt' },
      { key: '_chosen_payment_method', value: paymentMethod },
      ...extraMetaData,
    ];

    // Подготвяме checkout payload за Borica
    const { customer } = useAuth();
    const billing = customer.value?.billing;
    const shipping = orderInput.value.shipToDifferentAddress ? customer.value?.shipping : billing;
    const shippingMethod = cart.value?.chosenShippingMethods;

    const checkoutPayload = {
      billing,
      shipping,
      shippingMethod,
      metaData: metadata,
      paymentMethod: paymentMethod,
      customerNote: orderInput.value.customerNote || '',
      shipToDifferentAddress: orderInput.value.shipToDifferentAddress || false,
      transactionId: new Date().getTime().toString(),
      isPaid: false,
      account: orderInput.value.createAccount
        ? {
            username: orderInput.value.username,
            password: orderInput.value.password,
          }
        : null,
    };

    console.log('Creating Borica order with payload:', {
      paymentMethod: checkoutPayload.paymentMethod,
      amount: cart.value.total,
      hasCustomer: !!billing?.email,
      metaData: checkoutPayload.metaData,
    });

    // Създаваме поръчката директно чрез GraphQL (БЕЗ да минаваме през processCheckout)
    const { checkout } = await GqlCheckout(checkoutPayload);

    console.log('DEBUG: Checkout response:', checkout);

    if (!checkout?.order?.databaseId) {
      console.error('Checkout failed:', checkout);
      throw new Error('Не може да се създаде поръчката. Моля, проверете данните си.');
    }

    return checkout;
  } catch (error) {
    console.error('Order creation error:', error);
  }
}

useSeoMeta({
  title: t('messages.shop.checkout'),
});
</script>

<template>
  <div class="flex flex-col min-h-[600px]">
    <template v-if="cart && customer">
      <div v-if="cart.isEmpty" class="flex flex-col items-center justify-center flex-1 mb-12">
        <Icon name="ion:cart-outline" size="156" class="opacity-25 mb-5" />
        <h2 class="text-2xl font-bold mb-2">{{ $t('messages.shop.cartEmpty') }}</h2>
        <span class="text-gray-400 mb-4">{{ $t('messages.shop.addProductsInYourCart') }}</span>
        <NuxtLink
          to="/magazin"
          class="flex items-center justify-center gap-3 p-2 px-3 mt-4 font-semibold text-center text-white rounded-lg shadow-md bg-primary hover:bg-primary-dark">
          {{ $t('messages.shop.browseOurProducts') }}
        </NuxtLink>
      </div>

      <form v-else class="container flex flex-wrap items-start gap-8 my-16 justify-evenly lg:gap-20" @submit.prevent="payNow">
        <div class="grid w-full max-w-2xl gap-8 checkout-form md:flex-1">
          <div>
            <h2 class="w-full mb-3 text-2xl font-semibold">{{ $t('messages.billing.billingDetails') }}</h2>
            <BillingDetails :model-value="customer?.billing || {}" />
          </div>

          <label v-if="cart.availableShippingMethods && cart.availableShippingMethods.length > 0" for="shipToDifferentAddress" class="flex items-center gap-2">
            <span>{{ $t('messages.billing.differentAddress') }}</span>
            <input id="shipToDifferentAddress" v-model="orderInput.shipToDifferentAddress" type="checkbox" name="shipToDifferentAddress" />
          </label>

          <Transition name="scale-y" mode="out-in">
            <div v-if="orderInput.shipToDifferentAddress">
              <h2 class="mb-4 text-xl font-semibold">{{ $t('messages.general.shippingDetails') }}</h2>
              <ShippingDetails :model-value="customer?.shipping || {}" />
            </div>
          </Transition>

          <div v-if="cart.availableShippingMethods && cart.availableShippingMethods.length">
            <h3 class="mb-4 text-xl font-semibold">{{ $t('messages.general.shippingSelect') }}</h3>
            <ShippingOptions :options="cart.availableShippingMethods?.[0]?.rates || []" :active-option="cart.chosenShippingMethods?.[0] || ''" />
          </div>

          <div v-if="paymentGateways?.nodes.length" class="mt-2 col-span-full">
            <h2 class="mb-4 text-xl font-semibold">{{ $t('messages.billing.paymentOptions') }}</h2>
            <PaymentOptions v-model="orderInput.paymentMethod" class="mb-4" :paymentGateways />
            <StripeElement v-if="stripe" v-show="orderInput.paymentMethod?.id == 'stripe'" :stripe @updateElement="handleStripeElement" />
          </div>

          <div>
            <h2 class="mb-4 text-xl font-semibold">{{ $t('messages.shop.orderNote') }} ({{ $t('messages.general.optional') }})</h2>
            <textarea
              id="order-note"
              v-model="orderInput.customerNote"
              name="order-note"
              class="w-full min-h-[100px]"
              rows="4"
              :placeholder="$t('messages.shop.orderNotePlaceholder')"></textarea>
          </div>

          <!-- СКРИТО: Линкове за регистрация и логин скрити по искане на клиента -->
          <!-- <div v-if="!viewer && customer?.billing" class="flex flex-col md:flex-row md:gap-8 text-sm text-gray-500">
            <p>
              {{ $t('messages.account.alreadyRegistered') }}
              <NuxtLink to="/my-account" class="text-primary font-semibold">{{ $t('messages.account.login') }}</NuxtLink>
            </p>
            <p>
              Нямате профил? Можете да се регистрирате
              <NuxtLink to="/my-account" class="text-primary font-semibold">тук</NuxtLink>!
            </p>
          </div> -->
        </div>

        <OrderSummary>
          <button
            class="flex items-center justify-center w-full gap-3 p-3 mt-4 font-semibold text-center text-white rounded-lg shadow-md bg-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-400"
            :disabled="isCheckoutDisabled">
            {{ buttonText }}<LoadingIcon v-if="isProcessingOrder" color="#fff" size="18" />
          </button>
        </OrderSummary>
      </form>
    </template>
    <LoadingIcon v-else class="m-auto" />
  </div>
</template>

<style lang="postcss">
.checkout-form input[type='text'],
.checkout-form input[type='email'],
.checkout-form input[type='tel'],
.checkout-form input[type='password'],
.checkout-form textarea,
.checkout-form select,
.checkout-form .StripeElement {
  @apply bg-white border rounded-md outline-none border-gray-300 shadow-sm w-full py-2 px-4;
}

.checkout-form input.has-error,
.checkout-form textarea.has-error {
  @apply border-red-500;
}

.checkout-form label {
  @apply my-1.5 text-xs text-gray-600 uppercase;
}

.checkout-form .StripeElement {
  padding: 1rem 0.75rem;
}
</style>

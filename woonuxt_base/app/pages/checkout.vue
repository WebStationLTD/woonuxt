<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, CreateSourceData, StripeCardElement } from '@stripe/stripe-js';

const { t } = useI18n();
const { query } = useRoute();
const router = useRouter();
const { cart, isUpdatingCart, paymentGateways } = useCart();
const { customer, viewer } = useAuth();
const { orderInput, isProcessingOrder, processCheckout } = useCheckout();
const { initiatePayment, redirectToGateway, validatePaymentData, generateOrderDescription, extractAmountFromCart } = useBorica();
const runtimeConfig = useRuntimeConfig();
const stripeKey = runtimeConfig.public?.STRIPE_PUBLISHABLE_KEY as string | null;

const buttonText = ref<string>(isProcessingOrder.value ? t('messages.general.processing') : t('messages.shop.checkoutButton'));
const isCheckoutDisabled = computed<boolean>(() => isProcessingOrder.value || isUpdatingCart.value || !orderInput.value.paymentMethod);

const isInvalidEmail = ref<boolean>(false);
const stripe: Stripe | null = stripeKey ? await loadStripe(stripeKey) : null;
const elements = ref();
const isPaid = ref<boolean>(false);

// Debug състояние за Borica
const debugMode = ref<boolean>(true); // Включен debug режим
const debugInfo = ref<any>(null);

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
  try {
    buttonText.value = 'Подготвяне на плащането...';

    // Проверяваме дали има количка
    if (!cart.value || cart.value.isEmpty) {
      throw new Error('Количката е празна');
    }

    // Подготвяме метаданните без да променяме orderInput преждевременно
    const metadata = [
      { key: 'order_via', value: 'WooNuxt' },
      { key: '_chosen_payment_method', value: 'borica_emv' },
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
      paymentMethod: 'borica_emv', // Използваме оригиналния Borica method
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

    console.log('🔍 DEBUG: Checkout response:', {
      hasOrder: !!checkout?.order,
      hasRedirect: !!checkout?.redirect,
      redirectUrl: checkout?.redirect,
      result: checkout?.result,
    });

    if (!checkout?.order?.databaseId) {
      console.error('Checkout failed:', checkout);
      throw new Error('Не може да се създаде поръчката. Моля, проверете данните си.');
    }

    // ВАЖНО: НЕ използваме checkout.redirect от WP плъгина!
    if (checkout?.redirect) {
      console.log('🚨 WARNING: WP plugin generated redirect URL, but we are IGNORING it:', checkout.redirect);
    }

    const orderId = checkout.order.databaseId;
    console.log('Order created successfully:', { orderId, orderKey: checkout.order.orderKey });

    // Обновяваме payment method-а на поръчката да е Borica (след създаване)
    try {
      const updatePayload = {
        orderId: orderId,
        paymentMethod: 'borica_emv',
        metaData: [
          { key: '_payment_method', value: 'borica_emv' },
          { key: '_payment_method_title', value: 'Borica EMV' },
          { key: 'order_via', value: 'WooNuxt Borica Custom' },
        ],
      };

      console.log('🔄 Updating order payment method to Borica:', updatePayload);
      // Тук може да добавим GraphQL mutation за обновяване ако е нужно
    } catch (error) {
      console.log('⚠️ Could not update payment method, but continuing with Borica payment');
    }

    // Подготвяме данните за Borica плащане
    const amount = extractAmountFromCart(cart.value);
    const paymentData = {
      orderId: orderId.toString(),
      amount: amount,
      currency: 'BGN',
      description: generateOrderDescription({ orderId }),
      customerEmail: billing?.email || customer.value?.email || '',
    };

    console.log('Borica payment data:', paymentData);

    // Валидираме данните
    if (!validatePaymentData(paymentData)) {
      return;
    }

    buttonText.value = 'Пренасочване към Борика...';

    // Записваме debug информация преди заявката
    console.log('🔄 DEBUG: About to call initiatePayment with data:', paymentData);

    // Инициализираме плащането
    const result = await initiatePayment(paymentData);

    console.log('🔄 DEBUG: initiatePayment returned:', result);

    if (result.success && result.formData) {
      // Debug информация
      debugInfo.value = {
        step: 'payment_ready',
        timestamp: new Date().toISOString(),
        paymentData,
        apiDebugInfo: result.debugInfo, // Debug информация от API заявката
        boricaResult: {
          success: result.success,
          gatewayUrl: result.gatewayUrl,
          hasFormData: !!result.formData,
          formDataPreview: result.formData?.substring(0, 200) + '...',
          formData: result.formData, // Пълната форма за последваща употреба
        },
        nextStep: 'redirect_to_borica',
        message: 'Готов за пренасочване към Борика. Провери данните по-долу.',
      };

      buttonText.value = 'DEBUG: Готов за Борика - виж данните по-долу';

      if (!debugMode.value) {
        // Пренасочваме към Borica gateway
        console.log('🚀 REDIRECTING TO BORICA GATEWAY NOW!');
        redirectToGateway(result.formData);
        // ВАЖНО: След redirect функцията трябва да спре изпълнението
        return;
      } else {
        console.log('DEBUG MODE: Спряно пренасочване към Борика');
      }
    } else {
      debugInfo.value = {
        step: 'payment_failed',
        timestamp: new Date().toISOString(),
        paymentData,
        apiDebugInfo: result.debugInfo, // Debug информация от API заявката
        error: result.error,
        message: 'Грешка при инициализиране на плащането',
      };
      throw new Error(result.error || 'Грешка при инициализиране на плащането');
    }
  } catch (error: any) {
    console.error('Borica payment error:', error);
    buttonText.value = t('messages.shop.placeOrder');

    // Debug информация за грешката
    debugInfo.value = {
      step: 'payment_error',
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name,
        message: error?.message,
        gqlErrors: error?.gqlErrors,
        stack: error?.stack?.substring(0, 500),
        fullError: error,
      },
      message: 'Възникна грешка при обработка на плащането',
    };

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

  console.log('🔚 handleBoricaPayment() function COMPLETED');
};

// Функция за продължаване към Борика след debug преглед
const proceedToBorica = () => {
  if (debugInfo.value?.boricaResult?.formData) {
    console.log('Proceeding to Borica gateway after debug review');
    const { redirectToGateway } = useBorica();
    redirectToGateway(debugInfo.value.boricaResult.formData);
  }
};

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

          <!-- Debug Control Panel -->
          <div v-if="debugMode" class="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-bold text-yellow-800">🐛 DEBUG MODE</h3>
              <button @click="debugMode = false" class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700">Изключи Debug</button>
            </div>
            <p class="text-sm text-yellow-700 mb-3">Debug режимът е включен. Няма да се пренасочваш към Борика докато не го изключиш.</p>

            <div v-if="debugInfo && orderInput.paymentMethod?.id === 'borica_emv'" class="space-y-2">
              <button
                v-if="debugInfo.step === 'payment_ready'"
                @click="proceedToBorica()"
                class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                ✅ Продължи към Борика
              </button>
            </div>
          </div>
        </OrderSummary>
      </form>
    </template>
    <LoadingIcon v-else class="m-auto" />

    <!-- Debug Information Panel -->
    <div v-if="debugMode && debugInfo" class="fixed bottom-4 right-4 max-w-2xl bg-white border-2 border-blue-500 rounded-lg shadow-2xl z-50">
      <div class="bg-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 class="font-bold">🔍 DEBUG INFO</h3>
        <button @click="debugInfo = null" class="text-white hover:text-gray-200">✕</button>
      </div>
      <div class="p-4 max-h-96 overflow-y-auto">
        <div class="mb-3">
          <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
            {{ debugInfo.step }}
          </span>
          <span class="ml-2 text-sm text-gray-500">{{ debugInfo.timestamp }}</span>
        </div>

        <div class="mb-3 p-3 bg-gray-50 rounded"><strong>Съобщение:</strong> {{ debugInfo.message }}</div>

        <!-- API Debug информация -->
        <div v-if="debugInfo.apiDebugInfo" class="mb-3">
          <div class="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 class="font-semibold text-blue-800 mb-2">🔗 API Заявка информация</h4>
            <div class="text-sm space-y-1">
              <div>
                <strong>Статус:</strong>
                <span :class="debugInfo.apiDebugInfo.step === 'request_completed' ? 'text-green-600' : 'text-red-600'">
                  {{ debugInfo.apiDebugInfo.step }}
                </span>
              </div>
              <div v-if="debugInfo.apiDebugInfo.responseTime"><strong>Време за отговор:</strong> {{ debugInfo.apiDebugInfo.responseTime }}</div>
              <div v-if="debugInfo.apiDebugInfo.response">
                <strong>Отговор:</strong>
                <ul class="ml-4 list-disc">
                  <li>Успешен: {{ debugInfo.apiDebugInfo.response.success ? 'Да' : 'Не' }}</li>
                  <li>Има форма: {{ debugInfo.apiDebugInfo.response.hasFormData ? 'Да' : 'Не' }}</li>
                  <li>Дължина на формата: {{ debugInfo.apiDebugInfo.response.formDataLength || 'N/A' }}</li>
                  <li>Брой параметри: {{ debugInfo.apiDebugInfo.response.parametersCount || 0 }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <details class="mb-3">
          <summary class="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">📊 Пълни подробности (кликни за разгъване)</summary>
          <pre class="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
        </details>
      </div>
    </div>
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

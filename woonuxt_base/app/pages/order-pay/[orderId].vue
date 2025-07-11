<script setup lang="ts">
const { query, params } = useRoute();
const router = useRouter();
const { t } = useI18n();

const orderId = computed(() => params.orderId as string);
const orderKey = computed(() => query.key as string);
const paymentMethod = computed(() => query.payment_method as string);

const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  // Проверка дали имаме валидни параметри
  if (!orderId.value) {
    errorMessage.value = 'Липсва ID на поръчката';
    isLoading.value = false;
    return;
  }

  try {
    // Директно пренасочваме към WordPress order-pay
    // WordPress ще обработи плащането автоматично
    await processBoricaPayment();
  } catch (error: any) {
    errorMessage.value = error?.message || 'Възникна грешка при обработка на поръчката';
    isLoading.value = false;
  }
});

async function processBoricaPayment() {
  try {
    // Опростен подход - пренасочваме директно към WooCommerce order-pay URL
    // WordPress ще генерира Borica redirect автоматично
    const runtimeConfig = useRuntimeConfig();
    const baseUrl = runtimeConfig.public?.GQL_HOST?.replace('/graphql', '') || '';

    // Построяване на order-pay URL със всички нужни параметри
    const wpOrderPayUrl = new URL(`${baseUrl}/checkout/order-pay/${orderId.value}/`);
    wpOrderPayUrl.searchParams.set('pay_for_order', 'true');
    wpOrderPayUrl.searchParams.set('key', orderKey.value || '');

    // Пренасочваме към WordPress order-pay страницата
    window.location.href = wpOrderPayUrl.toString();
  } catch (error: any) {
    // Fallback - пренасочваме към checkout
    await router.push(`/checkout?payment_error=borica_generation&order=${orderId.value}`);
  }
}

// SEO мета
useSeoMeta({
  title: 'Обработка на плащане',
  robots: 'noindex,nofollow',
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <div class="text-center">
        <template v-if="isLoading">
          <!-- Loading spinner -->
          <div class="mx-auto mb-4 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            {{ t('messages.general.processing') }}
          </h2>

          <p class="text-sm text-gray-600 mb-4">Подготвяме вашето плащане...</p>

          <!-- Order info -->
          <div v-if="orderId" class="bg-gray-100 rounded-lg p-3 text-sm">
            <p class="text-gray-700"><strong>Поръчка:</strong> #{{ orderId }}</p>
            <p v-if="paymentMethod" class="text-gray-700 mt-1"><strong>Метод:</strong> {{ paymentMethod }}</p>
          </div>
        </template>

        <template v-else-if="errorMessage">
          <!-- Error state -->
          <div class="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Icon name="ion:warning" class="w-8 h-8 text-red-600" />
          </div>

          <h2 class="text-xl font-semibold text-red-800 mb-2">Грешка</h2>

          <p class="text-sm text-red-600 mb-4">
            {{ errorMessage }}
          </p>

          <div class="space-y-2">
            <button @click="router.push('/checkout')" class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
              Назад към checkout
            </button>

            <button @click="router.push('/my-account')" class="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
              Моят акаунт
            </button>
          </div>
        </template>

        <!-- Warning message -->
        <div class="mt-6 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p class="text-xs text-yellow-800">Моля, не затваряйте тази страница докато не бъдете пренасочени.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

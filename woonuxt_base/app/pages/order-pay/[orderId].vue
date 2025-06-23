<script setup lang="ts">
import { OrderStatusEnum } from '#woo';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const orderId = computed(() => route.params.orderId as string);
const orderKey = computed(() => route.query.key as string);
const paymentMethod = computed(() => route.query.payment_method as string);

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
    // Получаваме информация за поръчката
    const { order } = await GqlGetOrder({
      id: orderId.value,
    });

    if (!order) {
      errorMessage.value = 'Поръчката не е намерена';
      isLoading.value = false;
      return;
    }

    // Ако поръчката е вече платена, пренасочваме към успех
    if (order.status === OrderStatusEnum.PROCESSING || order.status === OrderStatusEnum.COMPLETED) {
      await router.push(`/thank-you?order=${orderId.value}&key=${orderKey.value}`);
      return;
    }

    // За Borica плащания, генерираме payment URL
    if (paymentMethod.value === 'borica_emv') {
      await processBoricaPayment();
    } else {
      // За други payment methods
      await router.push(`/checkout?order=${orderId.value}`);
    }
  } catch (error) {
    console.error('Грешка при обработка на order-pay:', error);
    errorMessage.value = 'Възникна грешка при обработка на поръчката';
    isLoading.value = false;
  }
});

async function processBoricaPayment() {
  try {
    const runtimeConfig = useRuntimeConfig();
    const baseUrl = runtimeConfig.public?.GQL_HOST?.replace('/graphql', '') || '';

    // Заявка към WordPress за генериране на Borica payment URL
    const response = (await $fetch(`${baseUrl}/wp-json/wc/v3/orders/${orderId.value}/payment-url`, {
      method: 'GET',
      query: {
        payment_method: 'borica_emv',
        order_key: orderKey.value,
      },
    })) as { payment_url?: string };

    if (response?.payment_url) {
      // Пренасочваме към Borica
      window.location.href = response.payment_url;
    } else {
      throw new Error('Не може да се генерира payment URL');
    }
  } catch (error) {
    console.error('Грешка при генериране на Borica URL:', error);

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

<script setup lang="ts">
import type { SavedOrder } from '~/types/tracking';

// Извличане на информация за последната поръчка от localStorage
const order = ref<SavedOrder | null>(null);
const { emptyCart } = useCart();
const { formatDate } = useHelpers();
const { formatDualPrice } = usePriceFormatter();
const { t } = useI18n();

onMounted(() => {
  // Проверка дали сме в браузър
  if (process.client) {
    try {
      getOrder();
    } catch (e) {
      // Грешка при извличане на данни за поръчката
    }
  }

  async function getOrder() {
    await emptyCart();

    const savedOrder = localStorage.getItem('lastOrder');

    if(!savedOrder) {
      return;
    }

    order.value = JSON.parse(savedOrder) as SavedOrder;

    trackPurchase(order.value);
  }

  async function trackPurchase(order: SavedOrder) {
    const trackedOrders = sessionStorage.getItem('tracked_orders');
    const trackedOrderIds = trackedOrders ? JSON.parse(trackedOrders) : [];

    if(trackedOrderIds.includes(order.id)) {
      return;
    }

    const { trackPurchase } = useTracking();

    const products = (order.lineItems.nodes || []).map((item: any) => {
      const product = item.product?.node || item.variation?.node;
      return {
        id: product?.databaseId || item.productId || '',
        name: product?.name || item.name || '',
        price: parseFloat(item.total || '0') / (item.quantity || 1), // Цена за единица
        quantity: item.quantity || 1,
        category: product?.productCategories?.nodes?.[0]?.name,
        brand: product?.attributes?.nodes?.find((attr: any) => attr.name === 'pa_brands')?.options?.[0],
        sku: product?.sku,
      };
    });

    console.log(products);

    // Изпращаме Purchase tracking
    trackPurchase({
      orderId: order.id,
      total: parseFloat(order.total),
      shipping: parseFloat(order.shippingTotal?.toString().replace(/[^\d.]/g, '') || '0'),
      currency: 'BGN',
      products: products,
    });

    // Запазваме че сме tracking-нали тази поръчка
    trackedOrderIds.push(order.id);
    sessionStorage.setItem('tracked_orders', JSON.stringify(trackedOrderIds));
  }
});

// Алиас за форматиране на цени в order контекст
const formatOrderPrice = (price: string | null | undefined): string => formatDualPrice(price, true);

// Функция за превод на статус на поръчката
const translateOrderStatus = (status: string | null | undefined): string => {
  if (!status) return '';
  
  const statusMap: { [key: string]: string } = {
    'PENDING': 'Чакаща',
    'PROCESSING': 'Обработва се',
    'ON_HOLD': 'На изчакване',
    'COMPLETED': 'Завършена',
    'CANCELLED': 'Отменена',
    'REFUNDED': 'Възстановена',
    'FAILED': 'Неуспешна',
  };
  
  return statusMap[status] || status;
};
</script>

<template>
  <div class="container my-8">
    <h1 class="mb-8 text-3xl font-semibold text-primary">{{ $t('messages.shop.orderReceived') }}</h1>

    <!-- Благодарствено съобщение -->
    <div class="mb-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
      <div class="flex items-start">
        <Icon name="ion:checkmark-circle" size="32" class="text-green-500 mr-4 flex-shrink-0 mt-1" />
        <div>
          <h3 class="text-lg font-semibold text-green-900 mb-2">{{ $t('messages.shop.orderThanks') }}</h3>
          <p class="text-green-800">Ще получите имейл с детайлите за поръчката.</p>
        </div>
      </div>
    </div>

    <div v-if="order" class="my-8 p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">{{ $t('messages.shop.orderSummary') }}</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">{{ $t('messages.shop.order') }}:</div>
          <div class="font-semibold">#{{ order.id }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500 mb-1">{{ $t('messages.general.date') }}:</div>
          <div class="font-semibold">{{ formatDate(order.date) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500 mb-1">{{ $t('messages.general.status') }}:</div>
          <div class="font-semibold">{{ translateOrderStatus(order.status) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500 mb-1">{{ $t('messages.general.paymentMethod') }}:</div>
          <div class="font-semibold">{{ order.paymentMethodTitle }}</div>
        </div>
      </div>

      <div class="border-t pt-4">
        <div class="flex justify-between items-center mb-2">
          <div class="font-semibold">{{ $t('messages.shop.total') }}</div>
          <div class="font-bold text-xl text-primary">{{ formatOrderPrice(order.total) }}</div>
        </div>
      </div>
    </div>

    <!-- Бързи действия -->
    <div class="grid md:grid-cols-2 gap-6 my-8">
      <!-- Продължи с пазаруване -->
      <NuxtLink
        to="/magazin"
        class="flex items-center justify-between p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:shadow-lg transition-all duration-300 group">
        <div>
          <h4 class="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">Продължи с пазаруване</h4>
          <p class="text-sm text-gray-600">Разгледайте още продукти</p>
        </div>
        <Icon name="ion:arrow-forward" size="24" class="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </NuxtLink>

      <!-- Към началото -->
      <NuxtLink
        to="/"
        class="flex items-center justify-between p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:shadow-lg transition-all duration-300 group">
        <div>
          <h4 class="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">Към началната страница</h4>
          <p class="text-sm text-gray-600">Вижте нашите оферти</p>
        </div>
        <Icon name="ion:home" size="24" class="text-gray-400 group-hover:text-primary transition-all" />
      </NuxtLink>
    </div>

    <!-- Контакти -->
    <div class="my-8 text-center">
      <p class="text-gray-600 mb-4">Имате въпроси относно поръчката?</p>
      <NuxtLink
        to="/contact"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium">
        <Icon name="ion:mail" size="20" />
        Свържете се с нас
      </NuxtLink>
    </div>
  </div>
</template>

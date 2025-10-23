<script setup lang="ts">
import { OrderStatusEnum } from '#woo';

const { query, params, name } = useRoute();
const { customer } = useAuth();
const { formatDate, formatPrice } = useHelpers();
const { formatDualPrice } = usePriceFormatter();
const { t } = useI18n();

const order = ref<Order | null>(null);
const fetchDelay = ref<boolean>(query.fetch_delay === 'true');
const delayLength = 2500;
const isLoaded = ref<boolean>(false);
const errorMessage = ref('');

const isGuest = computed(() => !customer.value?.email);
const isSummaryPage = computed<boolean>(() => name === 'order-summary');
const isCheckoutPage = computed<boolean>(() => name === 'order-received');
const orderIsNotCompleted = computed<boolean>(() => order.value?.status !== OrderStatusEnum.COMPLETED);
const hasDiscount = computed<boolean>(() => !!parseFloat(order.value?.rawDiscountTotal || '0'));
const downloadableItems = computed(() => order.value?.downloadableItems?.nodes || []);

// Алиас за форматиране на цени в order контекст
const formatOrderPrice = (price: string | null | undefined): string => formatDualPrice(price, true);

onBeforeMount(() => {
  /**
   * This is to close the child PayPal window we open on the checkout page.
   * It will fire off an event that redirects the parent window to the order summary page.
   */
  if (isCheckoutPage.value && (query.cancel_order || query.from_paypal || query.PayerID)) window.close();
});

onMounted(async () => {
  await getOrder();
  /**
   * WooCommerce sometimes takes a while to update the order status.
   * This is a workaround to fetch the order again after a delay.
   * The length of the delay might need to be adjusted depending on your server.
   */

  if (isCheckoutPage.value && fetchDelay.value && orderIsNotCompleted.value) {
    setTimeout(() => {
      getOrder();
    }, delayLength);
  }
});

async function getOrder() {
  try {
    // Всички потребители използват една и съща заявка (без key параметър)
    const data = await GqlGetOrder({ id: params.orderId as string });
    if (data.order) {
      order.value = data.order;

      // 🎯 TRACKING: Purchase event само ако сме на checkout страницата (не на order summary)
      // и само ако поръчката е успешна
      if (process.client && isCheckoutPage.value && order.value) {
        // Проверяваме дали вече сме tracking-нали тази поръчка (за да не го правим многократно)
        const trackedOrders = sessionStorage.getItem('tracked_orders');
        const trackedOrderIds = trackedOrders ? JSON.parse(trackedOrders) : [];

        if (!trackedOrderIds.includes(order.value.databaseId)) {
          const { trackPurchase } = useTracking();

          // Подготвяме продуктите
          const products = (order.value.lineItems?.nodes || []).map((item: any) => {
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

          // Изпращаме Purchase tracking
          trackPurchase({
            orderId: order.value.databaseId?.toString() || '',
            total: parseFloat(order.value.total?.replace(/[^\d.]/g, '') || '0'),
            tax: parseFloat(order.value.totalTax?.replace(/[^\d.]/g, '') || '0'),
            shipping: parseFloat(order.value.shippingTotal?.replace(/[^\d.]/g, '') || '0'),
            currency: 'BGN',
            products: products,
            coupon: order.value.couponLines?.nodes?.[0]?.code,
          });

          // Запазваме че сме tracking-нали тази поръчка
          trackedOrderIds.push(order.value.databaseId);
          sessionStorage.setItem('tracked_orders', JSON.stringify(trackedOrderIds));
        }
      }
    } else {
      errorMessage.value = 'Could not find order';
    }
  } catch (err: any) {
    // Ако има грешка, показваме я
    errorMessage.value = err?.gqlErrors?.[0].message || 'Could not find order';
  }
  isLoaded.value = true;
}

const refreshOrder = async () => {
  isLoaded.value = false;
  await getOrder();
};

useSeoMeta({
  title() {
    return isSummaryPage.value ? t('messages.shop.orderSummary') : t('messages.shop.orderReceived');
  },
});
</script>

<template>
  <div
    class="w-full min-h-[600px] flex items-center p-4 text-gray-800 md:bg-white md:rounded-xl md:mx-auto md:shadow-lg md:my-24 md:mt-8 md:max-w-3xl md:p-16 flex-col">
    <LoadingIcon v-if="!isLoaded" class="flex-1" />
    <template v-else>
      <div v-if="order" class="w-full">
        <template v-if="isSummaryPage">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/my-account?tab=orders"
              class="inline-flex items-center justify-center p-2 border rounded-md"
              title="Back to orders"
              aria-label="Back to orders">
              <Icon name="ion:chevron-back-outline" />
            </NuxtLink>
            <h1 class="text-xl font-semibold">{{ $t('messages.shop.orderSummary') }}</h1>
          </div>
        </template>
        <template v-else-if="isCheckoutPage">
          <div class="flex items-center justify-between w-full mb-2">
            <h1 class="text-xl font-semibold">{{ $t('messages.shop.orderReceived') }}</h1>
            <button
              v-if="orderIsNotCompleted"
              type="button"
              class="inline-flex items-center justify-center p-2 bg-white border rounded-md"
              title="Refresh order"
              aria-label="Refresh order"
              @click="refreshOrder">
              <Icon name="ion:refresh-outline" />
            </button>
          </div>
          <p>{{ $t('messages.shop.orderThanks') }}</p>
        </template>
        <hr class="my-8" />
      </div>
      <div v-if="order" class="flex-1 w-full">
        <div class="flex items-start justify-between">
          <div class="w-[21%]">
            <div class="mb-2 text-xs text-gray-400 uppercase">{{ $t('messages.shop.order') }}</div>
            <div class="leading-none">#{{ order.databaseId! }}</div>
          </div>
          <div class="w-[21%]">
            <div class="mb-2 text-xs text-gray-400 uppercase">{{ $t('messages.general.date') }}</div>
            <div class="leading-none">{{ formatDate(order.date) }}</div>
          </div>
          <div class="w-[21%]">
            <div class="mb-2 text-xs text-gray-400 uppercase">{{ $t('messages.general.status') }}</div>
            <OrderStatusLabel v-if="order.status" :order="order" />
          </div>
          <div class="w-[21%]">
            <div class="mb-2 text-xs text-gray-400 uppercase">{{ $t('messages.general.paymentMethod') }}</div>
            <div class="leading-none">{{ order.paymentMethodTitle }}</div>
          </div>
        </div>

        <template v-if="order.lineItems">
          <hr class="my-8" />

          <div class="grid gap-2">
            <div v-for="item in order.lineItems.nodes" :key="item.id" class="flex items-center justify-between gap-8">
              <NuxtLink v-if="item.product?.node" :to="`/produkt/${item.product.node.slug}`">
                <NuxtImg
                  class="w-16 h-16 rounded-xl"
                  :src="item.variation?.node?.image?.sourceUrl || item.product.node?.image?.sourceUrl || '/images/placeholder.png'"
                  :alt="item.variation?.node?.image?.altText || item.product.node?.image?.altText || 'Product image'"
                  :title="item.variation?.node?.image?.title || item.product.node?.image?.title || 'Product image'"
                  width="64"
                  height="64"
                  loading="lazy" />
              </NuxtLink>
              <div class="flex-1 leading-tight">
                {{ item.variation ? item.variation?.node?.name : item.product?.node.name! }}
              </div>
              <div class="text-sm text-gray-600">Qty. {{ item.quantity }}</div>
              <span class="text-sm font-semibold">{{ formatPrice(item.total!) }}</span>
            </div>
          </div>
        </template>

        <hr class="my-8" />

        <div v-if="downloadableItems.length && !orderIsNotCompleted">
          <DownloadableItems :downloadableItems="downloadableItems" />
          <hr class="my-8" />
        </div>

        <div>
          <div class="flex justify-between">
            <span>{{ $t('messages.shop.subtotal') }}</span>
            <span>{{ formatOrderPrice(order.rawSubtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('messages.general.tax') }}</span>
            <span>{{ formatOrderPrice(order.rawTotalTax) }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('messages.general.shipping') }}</span>
            <span>{{ formatOrderPrice(order.rawShippingTotal) }}</span>
          </div>
          <!-- СКРИТО: Показване на отстъпки скрито по искане на клиента -->
          <!-- <div v-if="hasDiscount" class="flex justify-between text-primary">
            <span>{{ $t('messages.shop.discount') }}</span>
            <span>- {{ formatOrderPrice(order.rawDiscountTotal) }}</span>
          </div> -->
          <hr class="my-8" />
          <div class="flex justify-between">
            <span class>{{ $t('messages.shop.total') }}</span>
            <span class="font-semibold">{{ formatOrderPrice(order.rawTotal) }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="errorMessage" class="flex flex-col items-center justify-center flex-1 w-full gap-4 text-center">
        <Icon name="ion:sad-outline" size="96" class="text-gray-700" />
        <h1 class="text-xl font-semibold">Error</h1>
        <div v-if="errorMessage" class="text-sm text-red-500" v-html="errorMessage" />
      </div>
    </template>
  </div>
</template>

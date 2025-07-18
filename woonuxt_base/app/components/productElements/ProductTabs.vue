<script setup lang="ts">
const { product } = defineProps({
  product: { type: Object as PropType<Product>, required: true },
});
const { storeSettings } = useAppConfig();

const initialTab = product.description ? 0 : 1;
const show = ref(initialTab);
</script>

<template>
  <div>
    <nav class="border-b flex gap-8 tabs">
      <button v-if="product.description" type="button" :class="show === 0 ? 'active' : ''" @click.prevent="show = 0">
        {{ $t('messages.shop.productDescription') }}
      </button>
      <button v-if="storeSettings.showReviews" type="button" :class="show === 1 ? 'active' : ''" @click.prevent="show = 1">
        {{ $t('messages.shop.reviews') }} ({{ product.reviewCount }})
      </button>
    </nav>
    <div class="tab-contents">
      <div v-if="show === 0 && product.description" class="font-light mt-8 prose prose-lg max-w-none" v-html="product.description" />
      <ProductReviews v-if="show === 1" :product="product" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.tabs button {
  @apply border-transparent border-b-2 text-lg pb-8;
  margin-bottom: -1px;
}

.tabs button.active {
  @apply border-primary text-primary;
}

/* Responsive video стилове */
.tab-contents :deep(video) {
  @apply w-full h-auto;
  aspect-ratio: 16 / 9;
  max-width: 100%;
}

/* За контейнери на видео съдържание */
.tab-contents :deep(.wp-block-video),
.tab-contents :deep(.wp-video) {
  @apply w-full;
  max-width: 100% !important;
}

/* Специфично за WordPress .wp-video с inline стилове в табовете */
.tab-contents :deep(div.wp-video) {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

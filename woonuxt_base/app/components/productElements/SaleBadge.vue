<script setup lang="ts">
import { StockStatusEnum } from '#woo';

const { t } = useI18n();
const { node } = defineProps({
  node: { type: Object, required: true },
});

const { storeSettings } = useAppConfig();

const salePercentage = computed((): string => {
  if (!node?.rawSalePrice || !node?.rawRegularPrice) return '';
  const salePrice = parseFloat(node?.rawSalePrice);
  const regularPrice = parseFloat(node?.rawRegularPrice);
  return Math.round(((salePrice - regularPrice) / regularPrice) * 100) + ` %`;
});

const isOutOfStock = computed(() => {
  if (node?.type === 'VARIABLE') {
    // За вариационни продукти проверяваме дали всички вариации са изчерпани
    const allVariations = node?.variations?.nodes || [];
    return allVariations.length > 0 && allVariations.every((variation: any) => variation.stockStatus === StockStatusEnum.OUT_OF_STOCK);
  }

  return node?.stockStatus === StockStatusEnum.OUT_OF_STOCK;
});

const showSaleBadge = computed(() => {
  // Не показваме Sale badge ако продуктът е изчерпан
  return node.rawSalePrice && storeSettings.saleBadge !== 'hidden' && !isOutOfStock.value;
});

const textToDisplay = computed(() => {
  if (storeSettings?.saleBadge === 'percent') return salePercentage.value;
  return t('messages.shop.onSale') ? t('messages.shop.onSale') : 'Sale';
});
</script>

<template>
  <span v-if="showSaleBadge" class="red-badge">{{ textToDisplay }}</span>
</template>

<style lang="postcss" scoped>
.red-badge {
  @apply rounded-md bg-red-400 text-xs text-white tracking-tight px-1.5 leading-6 z-10;
  background: #000 linear-gradient(0deg, #9c0100, #9c0100);
}
</style>

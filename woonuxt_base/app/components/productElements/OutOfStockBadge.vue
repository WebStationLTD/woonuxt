<script setup lang="ts">
import { StockStatusEnum } from '#woo';

const { node } = defineProps({
  node: { type: Object, required: true },
});

const isOutOfStock = computed(() => {
  if (node?.type === 'VARIABLE') {
    // За вариационни продукти проверяваме дали всички вариации са изчерпани
    const allVariations = node?.variations?.nodes || [];
    return allVariations.length > 0 && allVariations.every((variation: any) => variation.stockStatus === StockStatusEnum.OUT_OF_STOCK);
  }

  return node?.stockStatus === StockStatusEnum.OUT_OF_STOCK;
});
</script>

<template>
  <span v-if="isOutOfStock" class="out-of-stock-badge">Изчерпан</span>
</template>

<style lang="postcss" scoped>
.out-of-stock-badge {
  @apply rounded-md bg-gray-500 text-xs text-white tracking-tight px-1.5 leading-6 z-10;
  background: #6b7280;
}
</style>

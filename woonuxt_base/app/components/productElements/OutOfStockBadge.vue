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
  <span v-if="isOutOfStock" class="sold-out-overlay">ПРОДАДЕН</span>
</template>

<style lang="postcss" scoped>
.sold-out-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  z-index: 20;
  color: rgba(255, 67, 1);
  font-weight: bold;
  text-transform: uppercase;
  pointer-events: none;
  white-space: nowrap;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.1em;
  /* Правим квадрата голям колкото снимката */
  width: 140%;
  height: 140%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

/* Адаптивни размери на шрифта */
@media (max-width: 640px) {
  .sold-out-overlay {
    font-size: 1.25rem;
    width: 150%;
    height: 150%;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .sold-out-overlay {
    font-size: 1.5rem;
    width: 145%;
    height: 145%;
  }
}

@media (min-width: 1025px) {
  .sold-out-overlay {
    font-size: 2rem;
    width: 140%;
    height: 140%;
  }
}

@media (min-width: 1280px) {
  .sold-out-overlay {
    font-size: 2.25rem;
    width: 135%;
    height: 135%;
  }
}
</style>

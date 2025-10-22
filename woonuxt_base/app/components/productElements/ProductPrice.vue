<script setup lang="ts">
interface ProductPriceProps {
  regularPrice?: string | null;
  salePrice?: string | null;
}

const { regularPrice, salePrice } = defineProps<ProductPriceProps>();
const { formatDualPrice } = usePriceFormatter();

// Computed properties за форматираните цени
const formattedRegularPrice = computed(() => formatDualPrice(regularPrice));
const formattedSalePrice = computed(() => formatDualPrice(salePrice));
</script>

<template>
  <div v-if="regularPrice" class="flex flex-wrap gap-1 font-semibold">
    <span :class="{ 'text-gray-400 line-through font-normal': salePrice }">{{ formattedRegularPrice }}</span>
    <span v-if="salePrice" class="text-red-600">{{ formattedSalePrice }}</span>
  </div>
</template>

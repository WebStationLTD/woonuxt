<script setup>
const { updateShippingMethod } = useCart();
const { formatDualPrice } = usePriceFormatter();

const props = defineProps({
  options: { type: Array, required: true },
  activeOption: { type: String, required: true },
});

const setActiveOption = async (id) => {
  await updateShippingMethod(id);
};

// Форматираме цената на доставката в двоен формат (лв. / €)
const formatShippingCost = (cost) => {
  if (!cost) return formatDualPrice(0, true);
  
  // Парсваме цената (може да е string или number)
  const costNum = typeof cost === 'string' ? parseFloat(cost.replace(/[^\d.]/g, '')) : cost;
  
  return formatDualPrice(costNum, true);
};
</script>

<template>
  <div class="grid gap-4 shipping-options">
    <div
      v-for="option in options"
      :key="option.id"
      class="flex items-center justify-between option"
      :class="{ 'active-option': option.id === activeOption }"
      @click="setActiveOption(option.id)">
      <div>
        <div class="text-sm leading-tight text-gray-500" v-html="option.label"></div>
        <div class="font-semibold text-gray-600">{{ formatShippingCost(option.cost) }}</div>
      </div>

      <icon name="ion:checkmark-circle" size="20" class="ml-auto text-primary checkmark opacity-0" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.shipping-options {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  .option {
    @apply bg-white border rounded-lg text-gray-600 cursor-pointer flex flex-1 text-sm py-3 px-4 gap-2 items-center hover:border-purple-300;

    &.active-option {
      @apply border-primary cursor-default border-opacity-50 shadow-sm pointer-events-none;

      & .checkmark {
        @apply opacity-100;
      }
    }
  }
}
</style>

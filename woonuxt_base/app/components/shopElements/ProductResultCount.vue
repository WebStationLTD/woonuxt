<script setup lang="ts">
const { products, currentPage, productsPerPage, pageInfo } = useProducts();
const { t } = useI18n();

// Изчисляваме стартовия номер за текущата страница
const startProduct = computed(() => {
  return (currentPage.value - 1) * productsPerPage.value + 1;
});

// Изчисляваме крайния номер за текущата страница
const endProduct = computed(() => {
  return (currentPage.value - 1) * productsPerPage.value + (products.value?.length || 0);
});

// По-ясно съобщение за резултатите
const resultMessage = computed(() => {
  const productsCount = products.value?.length || 0;
  if (productsCount === 0) return '';

  if (pageInfo.hasNextPage) {
    // Има още страници - показваме "Страница X"
    return `${t('messages.shop.productResultCount.showing')} ${startProduct.value} ${t('messages.shop.productResultCount.to')} ${endProduct.value} (Страница ${currentPage.value})`;
  } else {
    // Последна страница - показваме общия брой
    return `${t('messages.shop.productResultCount.showing')} ${startProduct.value} ${t('messages.shop.productResultCount.to')} ${endProduct.value}`;
  }
});
</script>

<template>
  <div class="text-sm font-light" v-if="(products?.length || 0) !== 0">
    {{ resultMessage }}
  </div>
</template>

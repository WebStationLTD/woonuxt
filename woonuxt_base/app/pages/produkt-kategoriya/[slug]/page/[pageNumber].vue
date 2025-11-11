<script setup lang="ts">
// ⚡ КРИТИЧНО: Този файл обработва URL-и от типа /produkt-kategoriya/[slug]/page/[pageNumber]
// и redirect-ва към основния [slug].vue като запазва всички филтри

const route = useRoute();

// Извличаме параметрите
const categorySlug = String(route.params.slug);
const pageNumber = String(route.params.pageNumber);

// ⚡ ВАЖНО: Запазваме ВСИЧКИ query параметри (включително филтри)
const queryParams = { ...route.query };

// Добавяме page параметъра
queryParams.page = pageNumber;

// Redirect към основната категория страница
await navigateTo(
  {
    path: `/produkt-kategoriya/${categorySlug}`,
    query: queryParams,
  },
  {
    replace: true,
  }
);
</script>

<template>
  <div>Loading...</div>
</template>

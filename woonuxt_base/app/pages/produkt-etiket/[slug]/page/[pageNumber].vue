<script setup lang="ts">
// Този файл автоматично препраща към основната етикет страница
// с правилните параметри за pagination

const route = useRoute();

// Извличаме параметрите
const tagSlug = route.params.slug as string;
const pageNumber = route.params.pageNumber as string;

// Конструираме URL с query параметри
const queryParams = new URLSearchParams({
  ...(route.query as Record<string, string>),
  page: pageNumber,
});

const redirectUrl = `/produkt-etiket/${tagSlug}?${queryParams.toString()}`;

// Препращаме към основната етикет страница
await navigateTo(redirectUrl, {
  replace: true,
});
</script>

<template>
  <div>Loading...</div>
</template>

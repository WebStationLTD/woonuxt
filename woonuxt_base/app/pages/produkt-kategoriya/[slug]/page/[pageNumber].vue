<script setup lang="ts">
// Този файл автоматично препраща към основната категория страница
// с правилните параметри за pagination

const route = useRoute();

// Извличаме параметрите
const categorySlug = route.params.slug as string;
const pageNumber = route.params.pageNumber as string;

// Конструираме URL с query параметри
const queryParams = new URLSearchParams({
  ...(route.query as Record<string, string>),
  page: pageNumber,
});

const redirectUrl = `/produkt-kategoriya/${categorySlug}?${queryParams.toString()}`;

// Препращаме към основната категория страница
await navigateTo(redirectUrl, {
  replace: true,
});
</script>

<template>
  <div>Loading...</div>
</template>

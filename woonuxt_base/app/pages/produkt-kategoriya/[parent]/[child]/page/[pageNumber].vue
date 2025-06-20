<script setup lang="ts">
// Този файл автоматично препраща към child категория страницата
// с правилните параметри за pagination

const route = useRoute();

// Извличаме параметрите
const parentSlug = route.params.parent as string;
const childSlug = route.params.child as string;
const pageNumber = route.params.pageNumber as string;

// Конструираме URL с query параметри
const queryParams = new URLSearchParams({
  ...(route.query as Record<string, string>),
  page: pageNumber,
});

const redirectUrl = `/produkt-kategoriya/${parentSlug}/${childSlug}?${queryParams.toString()}`;

// Препращаме към child категория страницата
await navigateTo(redirectUrl, {
  replace: true,
});
</script>

<template>
  <div>Loading...</div>
</template>

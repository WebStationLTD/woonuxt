<script setup lang="ts">
const route = useRoute();
const { loadProductsPage, products, isLoading } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();

// Reactive номер на страницата от URL
const pageNumber = computed(() => {
  const num = parseInt(route.params.pageNumber as string);
  return isNaN(num) || num < 1 ? 1 : num;
});

// SEO метаданни
useHead(() => ({
  title: `Страница ${pageNumber.value} - Продукти`,
  meta: [
    { name: 'description', content: `Разгледайте нашите продукти на страница ${pageNumber.value}` },
    { property: 'og:title', content: `Страница ${pageNumber.value} - Продукти` },
    { property: 'og:description', content: `Разгледайте нашите продукти на страница ${pageNumber.value}` },
  ],
  link: [{ rel: 'canonical', href: `/products/page/${pageNumber.value}` }],
}));

// Функция за зареждане на продукти за текущата страница
const loadPageProducts = async () => {
  try {
    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    // Конвертираме orderby в GraphQL формат ако има
    let graphqlOrderBy = 'DATE';
    if (route.query.orderby === 'price') graphqlOrderBy = 'PRICE';
    else if (route.query.orderby === 'rating') graphqlOrderBy = 'RATING';
    else if (route.query.orderby === 'alphabetically') graphqlOrderBy = 'NAME_IN';
    else if (route.query.orderby === 'date') graphqlOrderBy = 'DATE';
    else if (route.query.orderby === 'discount') graphqlOrderBy = 'DATE';

    // Винаги използваме loadProductsPage за да можем да подадем конкретния номер на страницата
    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри
      const filters = buildGraphQLFilters();
      await loadProductsPage(pageNumber.value, undefined, graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница без филтри
      await loadProductsPage(pageNumber.value);
    }
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
  }
};

// Зареждаме продуктите след hydration
onMounted(() => {
  loadPageProducts();
});

// Watcher за промени в номера на страницата
watch(
  () => route.params.pageNumber,
  (newPageNumber, oldPageNumber) => {
    if (newPageNumber !== oldPageNumber) {
      loadPageProducts();
    }
  },
);

// Watcher за промени в query параметрите (филтри, сортиране)
watch(
  () => route.query,
  () => {
    if (process.client) {
      loadPageProducts();
    }
  },
);
</script>

<template>
  <div class="container mx-auto px-2 py-6">
    <!-- Loading индикатор -->
    <div v-if="isLoading" class="w-full flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Основен layout - винаги се показва когато не зарежда -->
    <div v-else class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main class="flex-1 min-w-0">
        <!-- Header с контроли - показва се само ако има продукти -->
        <div v-if="products?.length" class="flex items-center justify-between w-full gap-4 mb-8">
          <ProductResultCount />
          <div class="flex items-center gap-4">
            <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings?.showOrderByDropdown" />
            <ShowFilterTrigger v-if="storeSettings?.showFilters" class="lg:hidden" />
          </div>
        </div>

        <!-- Grid с продукти или съобщение за липса на продукти -->
        <ProductGrid v-if="products?.length" />
        <NoProductsFound v-else>
          <div class="text-center py-8">
            <h2 class="text-xl">Страница {{ pageNumber }}</h2>
            <p>Няма продукти на тази страница.</p>
          </div>
        </NoProductsFound>
      </main>
    </div>
  </div>
</template>

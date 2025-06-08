<script setup lang="ts">
const route = useRoute();
const { loadProductsPage, products, isLoading } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();

// Проследяваме дали някога сме зареждали данни
const hasEverLoaded = ref(false);

// Получаваме slug-а на категорията от URL
const categorySlug = computed(() => route.params.slug as string);

// SEO метаданни за категорийната страница
useHead(() => ({
  title: `${categorySlug.value} - Продукти`,
  meta: [
    { name: 'description', content: `Продукти от категория ${categorySlug.value}` },
    { property: 'og:title', content: `${categorySlug.value} - Продукти` },
    { property: 'og:description', content: `Продукти от категория ${categorySlug.value}` },
  ],
  link: [{ rel: 'canonical', href: `/product-category/${categorySlug.value}` }],
}));

// Функция за зареждане на продукти от категорията (първа страница)
const loadCategoryProducts = async () => {
  if (!process.client) return;

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

    // Винаги зареждаме първа страница (page 1)
    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри
      const filters = buildGraphQLFilters();
      await loadProductsPage(1, [categorySlug.value], graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме първата страница от категорията
      await loadProductsPage(1, [categorySlug.value]);
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  }
};

// Зареждаме продуктите от категорията след hydration
onMounted(() => {
  loadCategoryProducts();
});

// Watcher за промени в query параметрите (филтри, сортиране)
watch(
  () => route.query,
  () => {
    if (process.client) {
      loadCategoryProducts();
    }
  },
);

// Computed за показване на loading състояние
const shouldShowLoading = computed(() => {
  return isLoading.value || !hasEverLoaded.value;
});

// Computed за показване на NoProductsFound
const shouldShowNoProducts = computed(() => {
  return hasEverLoaded.value && !isLoading.value && (!products.value || products.value.length === 0);
});
</script>

<template>
  <div class="container mx-auto px-2 py-6">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main class="flex-1 min-w-0">
        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8 c3">
            <div class="h-6 bg-gray-200 rounded-md w-32 animate-pulse"></div>
            <div class="flex items-center gap-4">
              <div class="h-8 bg-gray-200 rounded-md w-24 animate-pulse hidden md:block"></div>
              <div class="h-8 bg-gray-200 rounded-md w-10 animate-pulse lg:hidden"></div>
            </div>
          </div>

          <!-- Products grid skeleton -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            <div v-for="i in 12" :key="i" class="space-y-3">
              <div class="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Pagination skeleton -->
          <div class="flex justify-center mt-8">
            <div class="flex gap-2">
              <div v-for="i in 5" :key="i" class="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Заредено съдържание -->
        <div v-else-if="products?.length" class="space-y-8">
          <!-- Header с контроли -->
          <div class="flex items-center justify-between w-full gap-4 mb-8 c4">
            <ProductResultCount />
            <div class="flex items-center gap-4">
              <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings?.showOrderByDropdown" />
              <div v-if="storeSettings?.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts">
          <div class="text-center py-8">
            <h2 class="text-xl">{{ categorySlug }}</h2>
            <p>Няма продукти в тази категория.</p>
          </div>
        </NoProductsFound>
      </main>
    </div>
  </div>
</template>

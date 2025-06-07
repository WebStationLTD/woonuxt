<script setup lang="ts">
const { loadProductsPage, loadProductsWithFilters, products, isLoading, currentPage, pageInfo, resetProductsState } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

let shopTitle = 'Products';
let shopDescription = 'Discover our products';
let seoDataSet = false;

// Проследяваме дали някога сме зареждали данни
const hasEverLoaded = ref(false);

// Резервни SEO данни веднага
useHead({
  title: shopTitle,
  meta: [{ name: 'description', content: shopDescription }],
});

// SEO данни са в резервните метаданни горе

// Get route instance once
const route = useRoute();

// Race condition protection
let isNavigating = false;

// Функция за зареждане на продукти според URL
const loadProductsFromRoute = async () => {
  if (isNavigating) {
    console.log('🚫 Navigation already in progress, skipping...');
    return;
  }

  isNavigating = true;

  try {
    // Reset products състоянието за чист старт
    resetProductsState();

    // Определяме страницата от URL
    let pageNumber = 1;

    // Проверяваме дали сме в /products/page/N формат
    if (route.path.startsWith('/products/page/')) {
      const pathParts = route.path.split('/');
      const pageIndex = pathParts.indexOf('page');
      if (pageIndex !== -1 && pathParts[pageIndex + 1]) {
        const pageParam = pathParts[pageIndex + 1];
        if (pageParam) {
          const parsedPage = parseInt(pageParam);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            pageNumber = parsedPage;
          }
        }
      }
    }

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри
      const filters = buildGraphQLFilters();

      // Конвертираме orderby в GraphQL формат
      let graphqlOrderBy = 'DATE';
      const orderBy = Array.isArray(route.query.orderby) ? route.query.orderby[0] : route.query.orderby;
      if (orderBy && typeof orderBy === 'string') {
        if (orderBy === 'price') graphqlOrderBy = 'PRICE';
        else if (orderBy === 'rating') graphqlOrderBy = 'RATING';
        else if (orderBy === 'alphabetically') graphqlOrderBy = 'NAME_IN';
        else if (orderBy === 'date') graphqlOrderBy = 'DATE';
        else if (orderBy === 'discount') graphqlOrderBy = 'DATE';
      }

      await loadProductsPage(pageNumber, undefined, graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме първата страница
      await loadProductsPage(pageNumber);
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // Принудително обновяване на currentPage за правилна синхронизация с pagination
    currentPage.value = pageNumber;

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  } finally {
    isNavigating = false;
  }
};

// Зареждаме продуктите веднага при SSR и след hydration
onMounted(async () => {
  // Изчакваме един tick за да се установи правилно route състоянието
  await nextTick();
  await loadProductsFromRoute();
});

// За SSR зареждане при извикване на страницата
if (process.server) {
  loadProductsFromRoute();
}

// Слушаме за промени в route-а
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      loadProductsFromRoute();
    }
  },
);

// Допълнителен watcher за промени в path за да се улавя навигацията между страници
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      // Reset loading състоянието при навигация за да се покаже skeleton
      hasEverLoaded.value = false;
      loadProductsFromRoute();
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
    <div class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main class="flex-1 min-w-0">
        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8">
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
          <div class="flex items-center justify-between w-full gap-4 mb-8">
            <ProductResultCount />
            <div class="flex items-center gap-4">
              <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
              <ShowFilterTrigger v-if="storeSettings.showFilters" class="lg:hidden" />
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Could not fetch products from your store. Please check your configuration. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

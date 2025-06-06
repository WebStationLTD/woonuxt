<script setup lang="ts">
const { loadProductsPage, loadProductsWithFilters, products, isLoading, currentPage, pageInfo } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

let shopTitle = 'Products';
let shopDescription = 'Discover our products';
let seoDataSet = false;

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
    // Определяме страницата от URL
    let pageNumber = 1;

    // Проверяваме дали сме в /products/page/N формат
    if (route.path.startsWith('/products/page/')) {
      const pathParts = route.path.split('/');
      const pageIndex = pathParts.indexOf('page');
      if (pageIndex !== -1 && pathParts[pageIndex + 1]) {
        const parsedPage = parseInt(pathParts[pageIndex + 1]);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          pageNumber = parsedPage;
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
      // Ако няма филтри, зареждаме конкретната страница
      await loadProductsPage(pageNumber);
    }

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
  } finally {
    isNavigating = false;
  }
};

// Зареждаме продуктите след hydration
onMounted(() => {
  loadProductsFromRoute();
});

// Слушаме за промени в route-а
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      loadProductsFromRoute();
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
      <aside v-if="storeSettings.showFilters" class="lg:w-80 flex-shrink-0">
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
            <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
            <ShowFilterTrigger v-if="storeSettings.showFilters" class="lg:hidden" />
          </div>
        </div>

        <!-- Grid с продукти или съобщение за липса на продукти -->
        <ProductGrid v-if="products?.length" />
        <NoProductsFound v-else> Could not fetch products from your store. Please check your configuration. </NoProductsFound>

        <!-- Debug информация премахната за production -->

        <!-- Пагинация -->
        <PaginationServer v-if="products?.length" />
      </main>
    </div>
  </div>
</template>

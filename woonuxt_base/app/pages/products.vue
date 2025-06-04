<script setup lang="ts">
const { loadProductsPage, loadProductsWithFilters, products, isLoading } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const route = useRoute();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

let shopTitle = 'Products';
let shopDescription = 'Discover our products';
let seoDataSet = false;

try {
  // Зареждаме SEO данни за страницата с продукти
  const { data: pagesData } = await useAsyncGql('getShopPage');
  const productPage = pagesData.value?.page;

  // Анализ на получената информация
  if (!productPage) {
    console.error('Не е намерена страница products в WordPress');
  } else {
    // Проверяваме дали имаме SEO данни
    if (!productPage.seo) {
      console.error('Страницата няма SEO данни от Yoast');
    } else {
      // Използваме SEO данните от Yoast
      shopTitle = productPage.seo.title || productPage.title || 'Products';
      shopDescription = productPage.seo.metaDesc || productPage.content || 'Discover our products';

      // Задаваме SEO метаданните
      useHead({
        title: shopTitle,
        meta: [
          { name: 'description', content: shopDescription },
          { property: 'og:title', content: productPage.seo.opengraphTitle || shopTitle },
          { property: 'og:description', content: productPage.seo.opengraphDescription || shopDescription },
          { name: 'robots', content: productPage.seo.metaRobotsNoindex ? 'noindex' : 'index' },
          { name: 'robots', content: productPage.seo.metaRobotsNofollow ? 'nofollow' : 'follow' },
        ],
        link: [{ rel: 'canonical', href: productPage.seo.canonical || '/products' }],
      });

      // Добавяне на структурирани данни (schema.org)
      if (productPage.seo.schema?.raw) {
        useHead({
          script: [
            {
              type: 'application/ld+json',
              innerHTML: productPage.seo.schema.raw,
            },
          ],
        });
      }

      seoDataSet = true; // Маркираме, че сме задали SEO данни
    }
  }

  // Ако не сме задали SEO данни, използваме резервни стойности
  if (!seoDataSet) {
    console.warn('Използваме резервни SEO данни за продуктовата страница');
    useHead({
      title: 'Products',
      meta: [{ name: 'description', content: 'Discover our products' }],
    });
  }
} catch (error) {
  console.error('Грешка при зареждане на SEO данни:', error);

  // Резервно решение
  useHead({
    title: 'Products',
    meta: [{ name: 'description', content: 'Discover our products' }],
  });
}

// Проверяваме дали има филтри или сортиране в URL и зареждаме продуктите
const hasFilters = route.query.filter;
const hasOrderBy = route.query.orderby;

if (hasFilters || hasOrderBy) {
  // Ако има филтри или сортиране, зареждаме със серверните филтри
  const filters = buildGraphQLFilters();

  // Конвертираме orderby в GraphQL формат
  let graphqlOrderBy = 'DATE';
  if (route.query.orderby === 'price') graphqlOrderBy = 'PRICE';
  else if (route.query.orderby === 'rating') graphqlOrderBy = 'RATING';
  else if (route.query.orderby === 'alphabetically') graphqlOrderBy = 'NAME_IN';
  else if (route.query.orderby === 'date') graphqlOrderBy = 'DATE';
  else if (route.query.orderby === 'discount') graphqlOrderBy = 'DATE';

  await loadProductsWithFilters(undefined, graphqlOrderBy, filters);
} else {
  // Ако няма филтри, зареждаме първата страница нормално
  await loadProductsPage(1);
}
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
      </main>
    </div>
  </div>
</template>

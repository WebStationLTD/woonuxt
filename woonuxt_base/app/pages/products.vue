<script setup lang="ts">
const { setProducts, updateProductList, products } = useProducts();
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

// Получаване на всички продукти
const { data } = await useAsyncGql('getProducts');
const allProducts = data.value?.products?.nodes as Product[];
setProducts(allProducts);

onMounted(() => {
  if (!isQueryEmpty.value) updateProductList();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'products') return;
    updateProductList();
  },
);
</script>

<template>
  <div class="container flex items-start gap-16 px-2" v-if="allProducts?.length">
    <Filters v-if="storeSettings.showFilters" />

    <div class="w-full">
      <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
        <ProductResultCount />
        <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
        <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
      </div>
      <ProductGrid />
    </div>
  </div>
  <NoProductsFound v-else>Could not fetch products from your store. Please check your configuration.</NoProductsFound>
</template>

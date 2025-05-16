<script setup lang="ts">
const { setProducts, updateProductList } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();
const slug = route.params.slug as string;

// Получаване на данни за категорията и SEO информацията чрез getProductCategories
const { data: categoryData } = await useAsyncGql('getProductCategories', { first: 1, slug: [slug] });
const productCategory = categoryData.value?.productCategories?.nodes?.[0] || null;

// Получаване на продуктите в категорията
const { data } = await useAsyncGql('getProducts', { slug });
const productsInCategory = (data.value?.products?.nodes || []) as Product[];
setProducts(productsInCategory);

onMounted(() => {
  if (!isQueryEmpty.value) updateProductList();
});

watch(
  () => route.query,
  () => {
    if (route.name !== 'produkt-kategoriya-slug') return;
    updateProductList();
  },
);

// Използване на SEO данни от Yoast ако са налични
const categoryTitle = productCategory?.seo?.title || productCategory?.name || 'Products';
const categoryDescription = productCategory?.seo?.metaDesc || productCategory?.description || 'Products in this category';

useHead({
  title: categoryTitle,
  meta: [
    { name: 'description', content: categoryDescription },
    { property: 'og:title', content: productCategory?.seo?.opengraphTitle || categoryTitle },
    { property: 'og:description', content: productCategory?.seo?.opengraphDescription || categoryDescription },
  ],
  link: [{ rel: 'canonical', href: productCategory?.seo?.canonical || '' }],
});

// Добавяне на структурирани данни (schema.org) ако са налични в Yoast
if (productCategory?.seo?.schema?.raw) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: productCategory.seo.schema.raw,
      },
    ],
  });
}
</script>

<template>
  <div class="container flex items-start gap-16 px-2" v-if="productsInCategory.length">
    <Filters v-if="storeSettings.showFilters" :hide-categories="true" />

    <div class="w-full">
      <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
        <ProductResultCount />
        <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
        <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
      </div>
      <ProductGrid />
    </div>
  </div>
</template>

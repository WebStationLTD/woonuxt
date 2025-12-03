<script lang="ts" setup>
const { frontEndUrl } = useHelpers();

// Получаване на SEO данни от Yoast SEO за страницата с всички категории
const { data: seoData } = await useAsyncGql('getCategoriesPage');
const categoriesSeo = seoData.value?.page?.seo || null;

// Получаване на всички продуктови категории
const { data } = await useAsyncGql('getProductCategories', { first: 100, hideEmpty: true });
const productCategories = data.value.productCategories?.nodes as ProductCategory[];

// Използване на SEO данни от Yoast ако са налични
const categoriesTitle = categoriesSeo?.title || 'Leaderfitness - всички продуктови категории';
const categoriesDescription = categoriesSeo?.metaDesc || 'Leaderfitness - всички продуктови категории | Фитнес екипировка, дрехи, тренировъчно оборудване';

useHead({
  title: categoriesTitle,
  meta: [
    { name: 'description', content: categoriesDescription },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: categoriesSeo?.opengraphTitle || categoriesTitle },
    { property: 'og:description', content: categoriesSeo?.opengraphDescription || categoriesDescription },
  ],
  link: [{ rel: 'canonical', href: categoriesSeo?.canonical || `${frontEndUrl || 'https://leaderfitness.net'}/categories` }],
});

// Добавяне на структурирани данни (schema.org) ако са налични в Yoast
// ВАЖНО: Поправяме цените - заменяме запетая с точка (Schema.org изисква точка)
if (categoriesSeo?.schema?.raw) {
  let schemaRaw = categoriesSeo.schema.raw;
  try {
    const schemaObj = JSON.parse(schemaRaw);
    const priceFields = ['price', 'lowPrice', 'highPrice'];
    const fixPrices = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const key in obj) {
        if (priceFields.includes(key) && typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(',', '.');
        } else if (typeof obj[key] === 'object') {
          fixPrices(obj[key]);
        }
      }
      return obj;
    };
    fixPrices(schemaObj);
    schemaRaw = JSON.stringify(schemaObj);
  } catch (e) {
    schemaRaw = schemaRaw
      .replace(/"price"\s*:\s*"(\d+),(\d+)"/g, '"price":"$1.$2"')
      .replace(/"lowPrice"\s*:\s*"(\d+),(\d+)"/g, '"lowPrice":"$1.$2"')
      .replace(/"highPrice"\s*:\s*"(\d+),(\d+)"/g, '"highPrice":"$1.$2"');
  }
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: schemaRaw,
      },
    ],
  });
}
</script>

<template>
  <main class="container">
    <div v-if="productCategories?.length" class="grid grid-cols-2 gap-4 my-6 md:grid-cols-3 lg:gap-8 xl:grid-cols-4">
      <CategoryCard
        v-for="(category, i) in productCategories"
        :key="i"
        :node="category"
        :all-categories="productCategories"
        :image-loading="i <= 2 ? 'eager' : 'lazy'" />
    </div>
  </main>
</template>

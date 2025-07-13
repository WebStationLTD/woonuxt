<script lang="ts" setup>
const { frontEndUrl } = useHelpers();

// Получаване на всички марки от Perfect Brands плъгина
const { data } = await useAsyncGql('getProducts' as any, {
  first: 500, // Зареждаме повече продукти за да видим всички марки
  orderby: 'DATE',
  order: 'DESC',
});

// Извличаме уникални марки от продуктите
const brands = computed(() => {
  if (!data.value?.products?.nodes) return [];

  const uniqueBrands = new Map();

  for (const product of data.value.products.nodes) {
    if (product.pwbBrands && product.pwbBrands.length > 0) {
      for (const brand of product.pwbBrands) {
        if (!uniqueBrands.has(brand.slug)) {
          uniqueBrands.set(brand.slug, brand);
        }
      }
    }
  }

  return Array.from(uniqueBrands.values());
});

// SEO за страницата с всички марки
const brandsTitle = 'Всички марки - Leaderfitness';
const brandsDescription = 'Прегледайте всички марки в Leaderfitness магазина | Фитнес екипировка, дрехи, тренировъчно оборудване от водещи марки';

useHead({
  title: brandsTitle,
  meta: [
    { name: 'description', content: brandsDescription },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: brandsTitle },
    { property: 'og:description', content: brandsDescription },
  ],
  link: [{ rel: 'canonical', href: `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/marki` }],
});
</script>

<template>
  <main class="container">
    <div class="my-6">
      <!-- Breadcrumb навигация -->
      <div class="flex text-sm leading-none text-gray-400 gap-1 items-center mb-6">
        <span>
          <NuxtLink to="/" class="hover:text-primary">{{ $t('messages.general.home') }}</NuxtLink>
          <span> /</span>
        </span>
        <span class="text-gray-800">Всички марки</span>
      </div>

      <!-- Заглавие -->
      <h1 class="text-3xl font-bold mb-8">Всички марки</h1>

      <!-- Списък с марки -->
      <div v-if="brands.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <NuxtLink
          v-for="brand in brands"
          :key="brand.databaseId"
          :to="`/marka-produkt/${brand.slug}`"
          class="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 group">
          <div class="text-center">
            <h3 class="font-medium text-gray-900 group-hover:text-primary transition-colors duration-300">
              {{ brand.name }}
            </h3>
            <p v-if="brand.count" class="text-sm text-gray-500 mt-1">{{ brand.count }} {{ brand.count === 1 ? 'продукт' : 'продукта' }}</p>
            <div v-if="brand.description" class="text-xs text-gray-400 mt-2 line-clamp-2">
              {{ brand.description }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Няма марки -->
      <div v-else class="text-center py-12">
        <div class="text-gray-500 text-lg mb-4">
          <Icon name="ion:business-outline" size="48" class="mx-auto mb-4" />
          Няма налични марки
        </div>
        <NuxtLink to="/magazin" class="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Разгледай всички продукти
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

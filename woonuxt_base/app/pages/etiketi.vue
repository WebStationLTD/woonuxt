<script lang="ts" setup>
const { frontEndUrl } = useHelpers();

// Получаване на всички продуктови етикети
const { data } = await useAsyncGql('getProductTags' as any, { first: 100, hideEmpty: true });
const productTags = (data.value?.productTags?.nodes as any[]) || [];

// SEO за страницата с всички етикети
const tagsTitle = 'Всички етикети - Leaderfitness';
const tagsDescription = 'Прегледайте всички продуктови етикети в Leaderfitness магазина | Фитнес екипировка, дрехи, тренировъчно оборудване';

useHead({
  title: tagsTitle,
  meta: [
    { name: 'description', content: tagsDescription },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: tagsTitle },
    { property: 'og:description', content: tagsDescription },
  ],
  link: [{ rel: 'canonical', href: `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/etiketi` }],
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
        <span class="text-gray-800">Всички етикети</span>
      </div>

      <!-- Заглавие -->
      <h1 class="text-3xl font-bold mb-8">Всички етикети</h1>

      <!-- Списък с етикети -->
      <div v-if="productTags?.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <NuxtLink
          v-for="tag in productTags"
          :key="tag.databaseId"
          :to="`/produkt-etiket/${tag.slug}`"
          class="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 group">
          <div class="text-center">
            <h3 class="font-medium text-gray-900 group-hover:text-primary transition-colors duration-300">
              {{ tag.name }}
            </h3>
            <p v-if="tag.count" class="text-sm text-gray-500 mt-1">{{ tag.count }} {{ tag.count === 1 ? 'продукт' : 'продукта' }}</p>
            <div v-if="tag.description" class="text-xs text-gray-400 mt-2 line-clamp-2">
              {{ tag.description }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Няма етикети -->
      <div v-else class="text-center py-12">
        <div class="text-gray-500 text-lg mb-4">
          <Icon name="ion:pricetag-outline" size="48" class="mx-auto mb-4" />
          Няма налични етикети
        </div>
        <NuxtLink to="/magazin" class="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Разгледай всички продукти
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

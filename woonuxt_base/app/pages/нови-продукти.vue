<script setup lang="ts">
import { ProductsOrderByEnum, OrderEnum } from '#woo';

const { t } = useI18n();

// SEO Meta данни
useSeoMeta({
  title: 'Нови продукти | Leaderfitness',
  description: 'Открийте най-новите продукти в нашия магазин. Последни постъпления и най-актуални предложения.',
});

// Зареждаме най-новите 24 продукта
const { data, pending, error } = await useAsyncGql('getProducts', {
  first: 24,
  orderby: ProductsOrderByEnum.DATE,
  order: OrderEnum.DESC,
});

const products = computed(() => data.value?.products?.nodes || []);
const hasProducts = computed(() => products.value.length > 0);

// Breadcrumb данни
const breadcrumbs = [
  { name: 'Начало', href: '/' },
  { name: 'Нови продукти', href: '/нови-продукти' },
];
</script>

<template>
  <main class="container py-6 xl:max-w-7xl">
    <!-- Breadcrumb навигация -->
    <nav class="mb-6" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-2 text-sm text-gray-500">
        <li v-for="(item, index) in breadcrumbs" :key="item.href" class="flex items-center">
          <NuxtLink v-if="index < breadcrumbs.length - 1" :to="item.href" class="hover:text-primary transition-colors">
            {{ item.name }}
          </NuxtLink>
          <span v-else class="text-gray-900 font-medium">{{ item.name }}</span>
          <Icon v-if="index < breadcrumbs.length - 1" name="ion:chevron-forward-outline" size="16" class="mx-2 text-gray-400" />
        </li>
      </ol>
    </nav>

    <!-- Заглавие на страницата -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Нови продукти</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">Открийте най-новите постъпления в нашия магазин. Актуални предложения и последни модели.</p>
    </div>

    <!-- Loading състояние -->
    <div v-if="pending" class="flex justify-center items-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Error състояние -->
    <div v-else-if="error" class="text-center py-16">
      <Icon name="ion:alert-circle-outline" size="48" class="mx-auto text-red-500 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Възникна грешка</h2>
      <p class="text-gray-600">Моля, опитайте отново по-късно.</p>
    </div>

    <!-- Продукти -->
    <div v-else-if="hasProducts">
      <!-- Брой продукти -->
      <div class="mb-6 text-center">
        <p class="text-sm text-gray-500">Показани са {{ products.length }} най-нови продукта</p>
      </div>

      <!-- Grid със продукти (Tailwind responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop) -->
      <div class="my-4 lg:my-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 transition-all">
        <div
          v-for="(product, index) in products"
          :key="product.databaseId"
          class="product-card rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full bg-white p-2 w-full">
          <ProductCard :node="product" :index="index" />
        </div>
      </div>

      <!-- Призив за действие -->
      <div class="mt-12 text-center">
        <div class="bg-gray-50 rounded-xl p-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Търсите нещо конкретно?</h3>
          <p class="text-gray-600 mb-6">Разгледайте всички наши продукти или потърсете в определена категория.</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/magazin"
              class="inline-flex items-center gap-2 bg-[#9c0100] text-white px-6 py-3 rounded-xl hover:bg-[#000000] transition-colors text-base font-semibold shadow-md">
              <Icon name="ion:grid-outline" size="20" />
              Всички продукти
            </NuxtLink>
            <NuxtLink
              to="/categories"
              class="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all text-base font-semibold">
              <Icon name="ion:list-outline" size="20" />
              Категории
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Няма продукти -->
    <div v-else class="text-center py-16">
      <Icon name="ion:cube-outline" size="48" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Няма налични продукти</h2>
      <p class="text-gray-600 mb-6">В момента няма нови продукти за показване.</p>
      <NuxtLink
        to="/magazin"
        class="inline-flex items-center gap-2 bg-[#9c0100] text-white px-6 py-3 rounded-xl hover:bg-[#000000] transition-colors text-base font-semibold shadow-md">
        <Icon name="ion:grid-outline" size="20" />
        Разгледайте всички продукти
      </NuxtLink>
    </div>
  </main>
</template>

<!-- Стиловете са премахнати поради Vite/Windows Unicode проблем с <style scoped> в кирилски файлове -->
<!-- Grid стиловете са добавени inline в template с Tailwind класове -->

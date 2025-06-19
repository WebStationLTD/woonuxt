<script setup lang="ts">
const { generateCategoryUrl } = useCategoryUrls();

const { product } = defineProps<{ product: Product }>();

const primaryCategory = computed(() => product.productCategories?.nodes[0]);

// Получаваме всички категории за да можем да генерираме правилните URL-и
const { data: categoriesData } = await useAsyncGql('getProductCategories', { hideEmpty: false });
const allCategories = computed(() => categoriesData.value?.productCategories?.nodes || []);

const format = computed(() => [
  { name: 'Магазин', slug: '/magazin' },
  {
    name: primaryCategory.value?.name,
    slug: primaryCategory.value ? generateCategoryUrl(primaryCategory.value, allCategories.value) : '',
  },
  { name: product.name },
]);
</script>

<template>
  <div class="flex text-sm leading-none text-gray-400 gap-1 items-center">
    <span>
      <NuxtLink to="/" class="hover:text-primary">{{ $t('messages.general.home') }}</NuxtLink>
      <span> /</span>
    </span>
    <span v-for="(link, i) in format" :key="link.name || i">
      <NuxtLink v-if="link.slug" :to="decodeURIComponent(link.slug)" class="hover:text-primary">{{ link.name }}</NuxtLink>
      <span v-else class="text-gray-800">{{ link.name }}</span>
      <span v-if="i + 1 < format.length"> /</span>
    </span>
  </div>
</template>

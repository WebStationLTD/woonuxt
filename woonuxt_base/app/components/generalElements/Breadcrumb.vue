<script setup lang="ts">
const { generateCategoryUrl } = useCategoryUrls();
const { frontEndUrl } = useHelpers();

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

// Structured Data за Google (винаги съдържа ВСИЧКИ елементи)
const breadcrumbSchema = computed(() => {
  const baseUrl = frontEndUrl || 'https://leaderfitness.net';
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Начало',
      item: baseUrl,
    },
  ];

  // Добавяме всички елементи от format
  format.value.forEach((link, index) => {
    if (link.name) {
      itemListElement.push({
        '@type': 'ListItem',
        position: index + 2,
        name: link.name,
        ...(link.slug && { item: `${baseUrl}${link.slug}` }),
      });
    }
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
});

// Добавяме schema в head за SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(breadcrumbSchema.value),
    },
  ],
});
</script>

<template>
  <!-- Мобилна версия: скрита на desktop -->
  <div class="flex md:hidden text-xs leading-tight text-gray-400 gap-1.5 items-center py-2 mb-3">
    <NuxtLink to="/" class="hover:text-primary shrink-0" aria-label="Начало" title="Начало">
      <Icon name="ion:home" size="14" class="text-gray-400" aria-hidden="true" />
    </NuxtLink>
    <span class="shrink-0">/</span>
    
    <!-- Показваме само последните 2 елемента на мобилно -->
    <template v-for="(link, i) in format.slice(-2)" :key="link.name || i">
      <NuxtLink 
        v-if="link.slug" 
        :to="decodeURIComponent(link.slug)" 
        class="hover:text-primary shrink-0 line-clamp-1"
        :title="link.name">
        {{ link.name }}
      </NuxtLink>
      <span 
        v-else 
        class="text-gray-800 font-medium line-clamp-2 leading-relaxed"
        :title="link.name">
        {{ link.name }}
      </span>
      <span v-if="i + 1 < format.slice(-2).length" class="shrink-0 mx-0.5"> /</span>
    </template>
  </div>

  <!-- Desktop версия: скрита на мобилно -->
  <div class="hidden md:flex text-sm leading-none text-gray-400 gap-1 items-center flex-wrap py-2 mb-6">
    <span class="flex items-center gap-1">
      <NuxtLink to="/" class="hover:text-primary">{{ $t('messages.general.home') }}</NuxtLink>
      <span>/</span>
    </span>
    <span v-for="(link, i) in format" :key="link.name || i" class="flex items-center gap-1">
      <NuxtLink v-if="link.slug" :to="decodeURIComponent(link.slug)" class="hover:text-primary">{{ link.name }}</NuxtLink>
      <span v-else class="text-gray-800">{{ link.name }}</span>
      <span v-if="i + 1 < format.length">/</span>
    </span>
  </div>
</template>


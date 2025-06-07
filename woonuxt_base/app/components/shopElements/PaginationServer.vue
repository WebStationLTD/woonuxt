<script setup lang="ts">
const { pageInfo, currentPage, isLoading } = useProducts();
const route = useRoute();

// Cached computed properties за оптимизация
const basePath = computed(() => {
  // Проверяваме за новите български пътища
  if (route.name === 'produkt-kategoriya-slug' && route.params.categorySlug) {
    return `/produkt-kategoriya/${route.params.categorySlug}`;
  } else if (route.path.startsWith('/produkt-kategoriya/') && route.params.categorySlug) {
    return `/produkt-kategoriya/${route.params.categorySlug}`;
  }
  // Резервна проверка за старите пътища (ако все още се използват)
  else if (route.name === 'product-category-slug' && route.params.slug) {
    return `/product-category/${route.params.slug}`;
  } else if (route.path.startsWith('/product-category/') && route.params.slug) {
    return `/product-category/${route.params.slug}`;
  }
  return '/products';
});

const queryParams = computed(() => ({ ...route.query }));

// Функция за генериране на URL за дадена страница (само за computed properties)
const buildPageUrl = (pageNumber: number) => {
  // За първата страница не добавяме page
  if (pageNumber === 1) {
    return {
      path: basePath.value,
      query: queryParams.value,
    };
  } else {
    // За останалите страници добавяме /page/N
    return {
      path: `${basePath.value}/page/${pageNumber}`,
      query: queryParams.value,
    };
  }
};

// Изчисляваме диапазона от страници за показване
const visiblePages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  const currentPageValue = currentPage.value;

  // За да прецизно определим колко страници имаме, използваме логика
  // Тъй като не знаем общия брой страници, показваме до 5 страници около текущата
  const startPage = Math.max(1, currentPageValue - 2);
  const endPage = currentPageValue + 2;

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

// Cached URLs за всички видими страници
const pageUrls = computed(() => {
  const urls = new Map();
  for (const pageNumber of visiblePages.value) {
    urls.set(pageNumber, buildPageUrl(pageNumber));
  }
  return urls;
});

// Предишна страница
const previousPageUrl = computed(() => {
  if (currentPage.value <= 1) return null;
  return buildPageUrl(currentPage.value - 1);
});

// Следваща страница
const nextPageUrl = computed(() => {
  if (!pageInfo.hasNextPage) return null;
  return buildPageUrl(currentPage.value + 1);
});
</script>

<template>
  <div class="flex flex-wrap justify-center mt-8 mb-16 col-span-full tabular-nums">
    <!-- Pagination -->
    <nav v-if="pageInfo.hasNextPage || currentPage > 1" class="flex-wrap inline-flex self-end -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
      <!-- PREV -->
      <NuxtLink v-if="previousPageUrl" :to="previousPageUrl" class="prev" :class="{ 'opacity-50': isLoading }" aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </NuxtLink>
      <span v-else class="prev cursor-not-allowed opacity-50" aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </span>

      <!-- NUMBERS -->
      <template v-for="pageNumber in visiblePages" :key="pageNumber">
        <NuxtLink v-if="pageNumber !== currentPage" :to="pageUrls.get(pageNumber)" class="page-number" :class="{ 'opacity-50': isLoading }">
          {{ pageNumber }}
        </NuxtLink>
        <span v-else :aria-current="'page'" class="page-number page-number-current">
          {{ pageNumber }}
        </span>
      </template>

      <!-- NEXT -->
      <NuxtLink v-if="nextPageUrl" :to="nextPageUrl" class="next" :class="{ 'opacity-50': isLoading }" aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="20" class="w-5 h-5" />
      </NuxtLink>
      <span v-else class="next cursor-not-allowed opacity-50" aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="20" class="w-5 h-5" />
      </span>
    </nav>

    <!-- Loading indicator за пагинация -->
    <div v-if="isLoading" class="flex items-center gap-2 mt-4">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span class="text-sm text-gray-600">Зареждане...</span>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.prev,
.next,
.page-number {
  @apply bg-white border font-medium border-gray-300 text-sm p-2 text-gray-500 relative inline-flex items-center hover:bg-gray-50 focus:z-10 transition-colors no-underline;
}

.prev {
  @apply rounded-l-md;
}

.next {
  @apply rounded-r-md;
}

.page-number {
  @apply px-3;
}

.page-number-current {
  @apply bg-primary border-primary border bg-opacity-10 text-primary z-10;
}

.prev:hover,
.next:hover,
.page-number:hover {
  @apply bg-gray-50 text-gray-700;
}

.prev.opacity-50:hover,
.next.opacity-50:hover {
  @apply bg-white;
}
</style>

<script setup lang="ts">
interface Props {
  categoryCount?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  categoryCount: null,
});

const { pageInfo, currentPage, isLoading, productsPerPage } = useProducts();
const route = useRoute();

// Cached computed properties за оптимизация
const basePath = computed(() => {
  // Проверяваме за етикети първо
  if ((route.name === 'produkt-etiket-slug' || route.name === 'produkt-etiket-page-pager') && (route.params.tagSlug || route.params.slug)) {
    const tagSlug = route.params.tagSlug || route.params.slug;
    return `/produkt-etiket/${tagSlug}`;
  }
  // Проверяваме за етикети с path prefix
  else if (route.path.startsWith('/produkt-etiket/')) {
    const pathSegments = route.path.split('/');
    const tagSlug = pathSegments[2]; // /produkt-etiket/[slug]
    if (tagSlug && tagSlug !== 'page') {
      return `/produkt-etiket/${tagSlug}`;
    }
  }
  // Проверяваме за марки първо
  else if ((route.name === 'marka-produkt-slug' || route.name === 'marka-produkt-page-pager') && (route.params.brandSlug || route.params.slug)) {
    const brandSlug = route.params.brandSlug || route.params.slug;
    return `/marka-produkt/${brandSlug}`;
  }
  // Проверяваме за марки с path prefix
  else if (route.path.startsWith('/marka-produkt/')) {
    const pathSegments = route.path.split('/');
    const brandSlug = pathSegments[2]; // /marka-produkt/[slug]
    if (brandSlug && brandSlug !== 'page') {
      return `/marka-produkt/${brandSlug}`;
    }
  }
  // Проверяваме за йерархични категории (parent/child)
  else if (
    (route.name === 'produkt-kategoriya-parent-child' || route.name === 'produkt-kategoriya-parent-child-pager') &&
    route.params.parent &&
    route.params.child
  ) {
    const path = `/produkt-kategoriya/${route.params.parent}/${route.params.child}`;
    return path;
  }
  // Проверяваме за родителски категории (slug)
  else if (route.params.slug && route.path.startsWith('/produkt-kategoriya/')) {
    return `/produkt-kategoriya/${route.params.slug}`;
  }
  // Проверяваме за новите български пътища (плоски категории)
  else if (route.name === 'produkt-kategoriya-slug' && route.params.categorySlug) {
    return `/produkt-kategoriya/${route.params.categorySlug}`;
  } else if (route.path.startsWith('/produkt-kategoriya/') && route.params.categorySlug) {
    return `/produkt-kategoriya/${route.params.categorySlug}`;
  }
  return '/magazin';
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

// Изчисляваме общия брой страници базиран на реални данни или приблизителна оценка
const estimatedTotalPages = computed(() => {
  const currentPageValue = currentPage.value;

  // Ако имаме надежден categoryCount, използваме точния брой страници
  if (props.categoryCount && props.categoryCount > 0) {
    const totalPages = Math.ceil(props.categoryCount / productsPerPage.value);

    // DEBUG: Показваме точните изчисления
    console.log(`🔢 PAGINATION DEBUG: categoryCount=${props.categoryCount}, productsPerPage=${productsPerPage.value}, totalPages=${totalPages}`);
    console.log(
      `📊 МАТЕМАТИКА: ${props.categoryCount} ÷ ${productsPerPage.value} = ${props.categoryCount / productsPerPage.value} → Math.ceil = ${totalPages}`,
    );

    return totalPages;
  }

  // Ако няма следваща страница, текущата е последната
  if (!pageInfo.hasNextPage) {
    return currentPageValue;
  }

  // За cursor-based pagination без точен count, използваме консервативна оценка
  let estimatedPages;

  if (currentPageValue <= 5) {
    // На първите страници, предполагаме поне още 5-7 страници
    estimatedPages = Math.max(currentPageValue + 7, 12);
  } else if (currentPageValue <= 10) {
    // На средни страници, предполагаме още 5-6 страници
    estimatedPages = currentPageValue + 6;
  } else {
    // На високи страници, консервативна оценка
    estimatedPages = currentPageValue + 5;
  }

  return estimatedPages;
});

// Изчисляваме диапазона от страници за показване
const visiblePages = computed(() => {
  const pages = [];
  const currentPageValue = currentPage.value;
  const maxEstimatedPage = estimatedTotalPages.value;

  // Разширяваме диапазона до 7 страници
  const startPage = Math.max(1, currentPageValue - 3);
  const endPage = Math.min(maxEstimatedPage, currentPageValue + 3);

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

// Първа страница (показваме само ако не е вече видима в numbers)
const firstPageUrl = computed(() => {
  const startPage = Math.max(1, currentPage.value - 3);
  if (startPage > 1) {
    return buildPageUrl(1);
  }
  return null;
});

// Последна страница
const lastPageUrl = computed(() => {
  const currentPageValue = currentPage.value;
  const maxEstimatedPage = estimatedTotalPages.value;
  const endPage = Math.min(maxEstimatedPage, currentPageValue + 3);

  // Ако имаме надежден categoryCount, винаги показваме последната страница
  if (props.categoryCount && props.categoryCount > 0 && endPage < maxEstimatedPage) {
    return buildPageUrl(maxEstimatedPage);
  }

  // За cursor-based pagination показваме "последна страница" ако има hasNextPage
  // И не показваме вече последната в текущия диапазон
  if (!props.categoryCount && pageInfo.hasNextPage && endPage < maxEstimatedPage) {
    return buildPageUrl(maxEstimatedPage);
  }

  return null;
});

// Проверяваме дали трябва да показваме "..." преди последната страница
const shouldShowDotsBeforeLast = computed(() => {
  const currentPageValue = currentPage.value;
  const maxEstimatedPage = estimatedTotalPages.value;
  const endPage = Math.min(maxEstimatedPage, currentPageValue + 3);

  // Показваме "..." преди последната ако има gap до последната страница
  return endPage < maxEstimatedPage - 1;
});

// Проверяваме дали трябва да показваме "..." след първата страница
const shouldShowDotsAfterFirst = computed(() => {
  const currentPageValue = currentPage.value;
  const startPage = Math.max(1, currentPageValue - 3);

  return startPage > 2;
});
</script>

<template>
  <div class="flex flex-wrap justify-center mt-8 mb-16 col-span-full tabular-nums">
    <!-- Pagination -->
    <nav v-if="pageInfo.hasNextPage || currentPage > 1" class="flex-wrap inline-flex self-end -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
      <!-- FIRST PAGE -->
      <NuxtLink v-if="firstPageUrl" :to="firstPageUrl" class="first-page" :class="{ 'opacity-50': isLoading }" aria-label="First page" title="Първа страница">
        <Icon name="ion:chevron-back-outline" size="16" class="w-4 h-4" />
        <Icon name="ion:chevron-back-outline" size="16" class="w-4 h-4 -ml-1" />
      </NuxtLink>

      <!-- PREV -->
      <NuxtLink
        v-if="previousPageUrl"
        :to="previousPageUrl"
        class="prev"
        :class="{ 'opacity-50': isLoading, 'rounded-l-md': !firstPageUrl }"
        aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </NuxtLink>
      <span v-else class="prev cursor-not-allowed opacity-50" :class="{ 'rounded-l-md': !firstPageUrl }" aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </span>

      <!-- DOTS AFTER FIRST -->
      <span v-if="shouldShowDotsAfterFirst" class="page-number cursor-default"> ... </span>

      <!-- NUMBERS -->
      <template v-for="pageNumber in visiblePages" :key="pageNumber">
        <NuxtLink v-if="pageNumber !== currentPage" :to="pageUrls.get(pageNumber)" class="page-number" :class="{ 'opacity-50': isLoading }">
          {{ pageNumber }}
        </NuxtLink>
        <span v-else :aria-current="'page'" class="page-number page-number-current">
          {{ pageNumber }}
        </span>
      </template>

      <!-- DOTS BEFORE LAST -->
      <span v-if="shouldShowDotsBeforeLast" class="page-number cursor-default"> ... </span>

      <!-- LAST PAGE -->
      <NuxtLink v-if="lastPageUrl" :to="lastPageUrl" class="last-page" :class="{ 'opacity-50': isLoading }" aria-label="Last page" title="Последна страница">
        <Icon name="ion:chevron-forward-outline" size="16" class="w-4 h-4" />
        <Icon name="ion:chevron-forward-outline" size="16" class="w-4 h-4 -ml-1" />
      </NuxtLink>

      <!-- NEXT -->
      <NuxtLink v-if="nextPageUrl" :to="nextPageUrl" class="next" :class="{ 'opacity-50': isLoading, 'rounded-r-md': !lastPageUrl }" aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="20" class="w-5 h-5" />
      </NuxtLink>
      <span v-else class="next cursor-not-allowed opacity-50" :class="{ 'rounded-r-md': !lastPageUrl }" aria-label="Next">
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
.first-page,
.last-page,
.prev,
.next,
.page-number {
  @apply bg-white border font-medium border-gray-300 text-sm p-2 text-gray-500 relative inline-flex items-center hover:bg-gray-50 focus:z-10 transition-colors no-underline;
}

.first-page {
  @apply rounded-l-md;
}

.last-page {
  @apply rounded-r-md;
}

.prev {
  /* rounded-l-md само ако няма first-page */
}

.next {
  /* rounded-r-md само ако няма last-page */
}

.page-number {
  @apply px-3;
}

.page-number-current {
  @apply bg-primary border-primary border bg-opacity-10 text-primary z-10;
}

.first-page:hover,
.last-page:hover,
.prev:hover,
.next:hover,
.page-number:hover {
  @apply bg-gray-50 text-gray-700;
}

.first-page.opacity-50:hover,
.last-page.opacity-50:hover,
.prev.opacity-50:hover,
.next.opacity-50:hover {
  @apply bg-white;
}

.page-number.cursor-default:hover {
  @apply bg-white text-gray-500;
}
</style>

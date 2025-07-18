<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const {
  loadProductsPage,
  loadProductsWithFilters,
  products,
  isLoading,
  resetProductsState,
  pageInfo,
  currentPage,
  loadProductsPageOptimized,
  jumpToPageOptimized,
  productsPerPage,
} = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
const { frontEndUrl } = useHelpers();
const route = useRoute();

// Проследяваме дали някога сме зареждали данни
const hasEverLoaded = ref(false);

interface Tag {
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  count?: number | null;
  databaseId?: number | null;
  uri?: string | null;
}

const currentSlug = ref('');
const currentPageNumber = ref(1);

// ПОПРАВКА: Използваме правилния параметър и декодираме URL-а
const routeSlug = route.params.tagSlug || route.params.slug; // Първо опитваме tagSlug, после slug
const decodedSlug = routeSlug ? decodeURIComponent(String(routeSlug)) : '';
const slug = decodedSlug;

// ⚡ ОПТИМИЗАЦИЯ 1: SMART CACHING (като в magazin.vue)
const TAG_CACHE_KEY = `woonuxt_tag_${slug}`;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минути
const CACHE_VERSION = 'v1';

// Функции за кеширане
const getCachedTagData = (): { tag: Tag | null; count: number | null } | null => {
  if (!process.client) return null;

  try {
    const cached = sessionStorage.getItem(TAG_CACHE_KEY);
    if (!cached) return null;

    const { tag, count, timestamp, version } = JSON.parse(cached);
    const now = Date.now();

    if (version !== CACHE_VERSION || now - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(TAG_CACHE_KEY);
      return null;
    }

    return { tag, count };
  } catch (error) {
    return null;
  }
};

const setCachedTagData = (tag: Tag, count: number): void => {
  if (!process.client) return;

  try {
    const cacheData = {
      tag,
      count,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(TAG_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

// ⚡ ОПТИМИЗАЦИЯ 2: БАТЧИРАНА SSR ЗАЯВКА - само 1 заявка вместо 2!
let matchingTag: Tag | null = null;
let realProductCount: number | null = null;

// Първо проверяваме кеша
const cachedData = getCachedTagData();
if (cachedData) {
  matchingTag = cachedData.tag;
  realProductCount = cachedData.count;
} else {
  // САМО 1 GraphQL заявка при SSR вместо 2!
  const { data: tagData } = await useAsyncGql(
    'getProductTags' as any,
    {
      slug: [slug],
      hideEmpty: false,
      first: 10, // Намалено от 20 на 10 за бързина
    } as any,
  );

  if (tagData.value?.productTags?.nodes?.[0]) {
    matchingTag = tagData.value.productTags.nodes[0] as Tag;
    // Използваме count от етикета директно вместо отделна заявка!
    realProductCount = matchingTag.count || 0;

    // Кешираме данните веднага
    if (process.client && matchingTag && realProductCount !== null) {
      setCachedTagData(matchingTag, realProductCount);
    }
  }
}

// Fallback ако няма етикет
if (!matchingTag) {
  throw showError({ statusCode: 404, statusMessage: 'Етикетът не е намерен' });
}

// Reactive ref за runtime промени
const matchingTagRef = ref<Tag | null>(matchingTag);

// Ref за филтриран count при филтриране
const filteredTagCount = ref<number | null>(null);

// ⚡ ОПТИМИЗАЦИЯ 3: Функция за асинхронно зареждане на точен count (lazy loading)
const loadPreciseCount = async () => {
  if (!process.client || realProductCount === null) return;

  try {
    // Зареждаме точния count асинхронно БЕЗ да блокираме UI
    const { data: countData } = await useAsyncGql(
      'getProductsCount' as any,
      {
        productTag: [slug],
      } as any,
    );

    if (countData.value?.products?.edges) {
      const preciseCount = countData.value.products.edges.length;
      if (preciseCount !== realProductCount) {
        realProductCount = preciseCount;
        // Обновяваме кеша с точния count
        if (matchingTag) {
          setCachedTagData(matchingTag, preciseCount);
        }
      }
    }
  } catch (error) {
    // Ignore errors, use cached count
  }
};

// ⚡ ОПТИМИЗАЦИЯ 4: Proactive cache warming
const warmUpCache = async () => {
  if (!process.client) return;

  // Зареждаме точния count в background
  setTimeout(async () => {
    if (process.client) {
      await loadPreciseCount();
    }
  }, 100);
};

// Функция за генериране на SEO данни според страницата (взета от категориите)
const generateTagSeoMeta = () => {
  // Получаваме номера на страницата
  let pageNumber = 1;

  // ВАЖНО: Приоритизираме query.page параметъра (от pagination redirect-ите)
  if (route.query.page) {
    const parsedPage = parseInt(route.query.page as string);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNumber = parsedPage;
    }
  }
  // След това проверяваме route.params.pageNumber (резервен)
  else if (route.params.pageNumber) {
    const parsedPage = parseInt(route.params.pageNumber as string);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNumber = parsedPage;
    }
  }

  // Използваме етикетните данни като база
  const baseTitle = matchingTag?.name ? `Етикет: ${matchingTag.name}` : 'Етикет';
  const baseDescription = matchingTag?.description || `Продукти с етикет ${matchingTag?.name}`;

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}`
      : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме и задаваме първоначалните SEO метаданни
const initialTagSeoMeta = generateTagSeoMeta();

useSeoMeta({
  title: initialTagSeoMeta.title,
  description: initialTagSeoMeta.description,
  ogTitle: initialTagSeoMeta.title,
  ogDescription: initialTagSeoMeta.description,
  ogType: 'website',
  ogUrl: initialTagSeoMeta.canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: initialTagSeoMeta.title,
  twitterDescription: initialTagSeoMeta.description,
  robots: 'index, follow',
});

// Reactive refs за SEO links
const headLinks = ref([{ rel: 'canonical', href: initialTagSeoMeta.canonicalUrl }]);

useHead({
  link: headLinks,
});

// Cache за да не извикваме функцията твърде често
let lastLinksUpdate = '';

// Функция за динамично обновяване на next/prev links с точен брой продукти
const updateTagNextPrevLinks = () => {
  const currentSeoMeta = generateTagSeoMeta();
  const updatedTagLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount || matchingTag?.count || 0;
  const totalPages = Math.ceil(totalProductCount / productsPerPage.value);

  // Prev link
  if (currentSeoMeta.pageNumber > 1) {
    const prevUrl =
      currentSeoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}`
        : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedTagLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link - използваме точното изчисление на база реалния брой продукти
  let hasNextPage = false;

  // При филтри разчитаме на pageInfo
  const hasFilters = route.query.filter;
  if (hasFilters) {
    hasNextPage = pageInfo?.hasNextPage || false;
  } else {
    // БЕЗ филтри - използваме точния брой продукти
    hasNextPage = realProductCount ? currentSeoMeta.pageNumber < totalPages : pageInfo?.hasNextPage;
  }

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedTagLinks.push({ rel: 'next', href: nextUrl });
  }

  // Canonical link винаги се обновява
  updatedTagLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  // КРИТИЧНО: Проверяваме дали има промяна преди обновяване
  const newLinksStr = JSON.stringify(updatedTagLinks);
  if (newLinksStr !== lastLinksUpdate) {
    headLinks.value = updatedTagLinks;
    lastLinksUpdate = newLinksStr;
  }
};

// Функция за извличане на параметри от route
const extractRouteParams = () => {
  let slug = '';
  let pageNumber = 1;

  // Първо извличаме slug от правилния параметър
  if (route.params.slug) {
    slug = String(route.params.slug);
  } else if (route.params.tagSlug) {
    slug = String(route.params.tagSlug);
  }

  // ВАЖНО: Приоритизираме query.page параметъра (от pagination redirect-ите)
  if (route.query.page) {
    const parsed = parseInt(String(route.query.page));
    if (!isNaN(parsed) && parsed > 0) {
      pageNumber = parsed;
    }
  }
  // След това проверяваме за страница в URL пътя (резервен)
  else if (route.params.pageNumber) {
    const parsed = parseInt(String(route.params.pageNumber));
    if (!isNaN(parsed) && parsed > 0) {
      pageNumber = parsed;
    }
  }

  return { slug, pageNumber };
};

// Функция за обновяване на SEO метаданните при промяна на route
const updateTagSeoMeta = () => {
  const newSeoMeta = generateTagSeoMeta();

  useSeoMeta({
    title: newSeoMeta.title,
    description: newSeoMeta.description,
    ogTitle: newSeoMeta.title,
    ogDescription: newSeoMeta.description,
    ogUrl: newSeoMeta.canonicalUrl,
    twitterTitle: newSeoMeta.title,
    twitterDescription: newSeoMeta.description,
  });

  // Обновяваме и rel=prev/next links при навигация
  updateTagNextPrevLinks();
};

// Race condition protection
let isNavigating = false;

// Проследяване на предишни query параметри
let previousQuery = ref({
  orderby: null as string | null,
  order: null as string | null,
  filter: null as string | null,
});

// ⚡ ОПТИМИЗАЦИЯ 5: Функция за парсене на филтри (както в magazin.vue)
const parseFiltersFromQuery = (filterQuery: string) => {
  const filters: any = {};

  if (!filterQuery || typeof filterQuery !== 'string') return filters;

  // Функция за извличане на филтър стойности с validation
  const getFilterValues = (filterName: string): string[] => {
    const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
    if (!match || !match[1]) return [];

    return match[1].split(',').filter((val) => val && val.trim());
  };

  // Ценови филтър
  const priceRange = getFilterValues('price');
  if (priceRange.length === 2 && priceRange[0] && priceRange[1]) {
    const minPrice = parseFloat(priceRange[0]);
    const maxPrice = parseFloat(priceRange[1]);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      filters.minPrice = minPrice;
      filters.maxPrice = maxPrice;
    }
  }

  // OnSale филтър - само ако има валидна стойност
  const onSale = getFilterValues('sale');
  if (onSale.length > 0 && onSale.includes('true')) {
    filters.onSale = true;
  }

  // Search филтър
  const searchTerm = getFilterValues('search');
  if (searchTerm.length > 0 && searchTerm[0]) {
    filters.search = searchTerm[0];
  }

  return filters;
};

// Основна функция за зареждане на продукти (СИЛНО ОПТИМИЗИРАНА)
const loadTagProducts = async () => {
  if (isNavigating) {
    return;
  }

  isNavigating = true;

  try {
    const { slug, pageNumber } = extractRouteParams();

    if (!slug) {
      resetProductsState();
      currentSlug.value = '';
      hasEverLoaded.value = true;
      return;
    }

    const targetPageNumber = pageNumber;

    resetProductsState();
    currentSlug.value = slug;
    currentPageNumber.value = targetPageNumber;

    // КРИТИЧНО: Проверяваме за невалидни страници ПРЕДИ зареждане
    if (pageNumber > 1 && process.client && !route.query.filter) {
      const totalProducts = realProductCount || matchingTag?.count || 0;
      if (totalProducts > 0) {
        const maxPages = Math.ceil(totalProducts / productsPerPage.value);
        if (pageNumber > maxPages) {
          throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува в този етикет. Максимална страница: ${maxPages}` });
        }
      }
    }

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    if (hasFilters || hasOrderBy) {
      // Парсваме филтрите директно от route.query.filter с validation
      const filters = hasFilters ? parseFiltersFromQuery(route.query.filter as string) : {};

      // Конвертираме orderby в GraphQL формат
      let graphqlOrderBy = 'DATE';
      const orderBy = Array.isArray(route.query.orderby) ? route.query.orderby[0] : route.query.orderby;
      if (orderBy && typeof orderBy === 'string') {
        if (orderBy === 'price') graphqlOrderBy = 'PRICE';
        else if (orderBy === 'rating') graphqlOrderBy = 'RATING';
        else if (orderBy === 'alphabetically') graphqlOrderBy = 'NAME_IN';
        else if (orderBy === 'date') graphqlOrderBy = 'DATE';
        else if (orderBy === 'discount') graphqlOrderBy = 'DATE';
      }

      // КРИТИЧНО: Правилна логика за cursor-based пагинация
      if (pageNumber > 1) {
        await jumpToPageOptimized(pageNumber, [], graphqlOrderBy, filters, [slug]);

        if (process.client && Object.keys(filters).length > 0 && (!products.value || products.value.length === 0)) {
          throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува с тези филтри в етикета` });
        }
      } else {
        await loadProductsPageOptimized(pageNumber, [], graphqlOrderBy, filters, undefined, [slug]);
      }

      // КРИТИЧНО: Зареждаме filtered count при филтриране
      if (process.client && Object.keys(filters).length > 0) {
        await loadTagCount(filters);
      }
    } else {
      // Ако няма филтри, използваме супер бързата функция
      if (pageNumber > 1) {
        await jumpToPageOptimized(pageNumber, [], 'DATE', {}, [slug]);

        if (process.client && (!products.value || products.value.length === 0)) {
          const totalProducts = realProductCount || matchingTag?.count || 0;
          const maxPages = totalProducts > 0 ? Math.ceil(totalProducts / productsPerPage.value) : 1;
          throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува в този етикет. Максимална страница: ${maxPages}` });
        }
      } else {
        await loadProductsPageOptimized(pageNumber, [], 'DATE', {}, undefined, [slug]);
      }

      // Reset tag count
      filteredTagCount.value = null;
    }

    hasEverLoaded.value = true;

    await nextTick();
    currentPage.value = targetPageNumber;

    await nextTick();
    updateTagNextPrevLinks();

    await nextTick();
  } catch (error) {
    hasEverLoaded.value = true;
  } finally {
    isNavigating = false;
  }
};

// Зареждаме при mount
onMounted(async () => {
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ⚡ ОПТИМИЗАЦИЯ 6: Proactive cache warming за по-бързи последващи заявки
  if (process.client) {
    warmUpCache();
  }

  await nextTick();
  await loadTagProducts();
  await nextTick();
  updateTagNextPrevLinks();
});

// За SSR зареждане - ПРЕМАХНАТО за по-бърза SSR!
// if (process.server) {
//   loadTagProducts();
// }

// Следене на промени в route
watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      await nextTick();
      loadTagProducts();
      updateTagSeoMeta();
    }
  },
);

// Допълнителен watcher за промени в path
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      // Reset loading състоянието при навигация за да се покаже skeleton
      hasEverLoaded.value = false;
      loadTagProducts();
      updateTagSeoMeta();
    }
  },
);

// Watcher за промени в query параметрите (филтри и сортиране)
watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    if (process.client && JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      // Проверяваме дали са се променили sorting/filtering параметрите
      const newOrderBy = newQuery.orderby as string | null;
      const newOrder = newQuery.order as string | null;
      const newFilter = newQuery.filter as string | null;

      const sortingOrFilteringChanged =
        newOrderBy !== previousQuery.value.orderby || newOrder !== previousQuery.value.order || newFilter !== previousQuery.value.filter;

      // Ако са се променили sorting/filtering параметрите И сме на страница > 1
      if (sortingOrFilteringChanged && route.params.pageNumber) {
        const currentPageNumber = parseInt(String(route.params.pageNumber) || '1');

        if (currentPageNumber > 1) {
          // Изграждаме URL за страница 1 с новите sorting/filtering параметри
          const queryParams = new URLSearchParams();
          if (newOrderBy) queryParams.set('orderby', newOrderBy);
          if (newOrder) queryParams.set('order', newOrder);
          if (newFilter) queryParams.set('filter', newFilter);

          const queryString = queryParams.toString();
          const newUrl = `/produkt-etiket/${slug}${queryString ? `?${queryString}` : ''}`;

          // Обновяваме предишните стойности преди redirect
          previousQuery.value = {
            orderby: newOrderBy,
            order: newOrder,
            filter: newFilter,
          };

          await navigateTo(newUrl, { replace: true });
          return;
        }
      }

      // Обновяваме предишните стойности
      previousQuery.value = {
        orderby: newOrderBy,
        order: newOrder,
        filter: newFilter,
      };

      // Reset loading състоянието при промяна на филтри
      hasEverLoaded.value = false;
      loadTagProducts();
    }
  },
);

// Watcher за промени в pageInfo за динамично обновяване на next/prev links
watch(
  () => pageInfo,
  () => {
    if (process.client) {
      updateTagNextPrevLinks();
    }
  },
  { deep: true },
);

// Watcher за филтри - актуализира правилния count при промяна на филтрите
watch(
  () => route.query.filter,
  async (newFilter) => {
    if (process.client && newFilter) {
      const filters = parseFiltersFromQuery(newFilter as string);
      await loadTagCount(filters);
    } else if (process.client && !newFilter) {
      // Когато няма филтри, нулираме filtered count
      filteredTagCount.value = null;
    }
  },
);

// Computed за показване на loading състояние
const shouldShowLoading = computed(() => {
  return isLoading.value || !hasEverLoaded.value;
});

// Computed за показване на NoProductsFound
const shouldShowNoProducts = computed(() => {
  return hasEverLoaded.value && !isLoading.value && (!products.value || products.value.length === 0);
});

// Computed за правилен count за pagination
const tagCount = computed(() => {
  // Парсваме филтрите директно от URL за актуална проверка
  const hasFilters = route.query.filter;

  if (hasFilters) {
    const filters = parseFiltersFromQuery(route.query.filter as string);

    // Проверяваме за ВСИЧКИ типове филтри
    const hasAnyFilters = filters.onSale || filters.search || filters.minPrice !== undefined || filters.maxPrice !== undefined;

    if (hasAnyFilters) {
      // При всякакви филтри използваме филтрирания count
      return filteredTagCount.value;
    }
  }

  // Без филтри използваме оригиналния count от етикета
  return realProductCount || matchingTag?.count;
});

// ⚡ ОПТИМИЗАЦИЯ 7: Функция за зареждане на filtered count при всякакви филтри (СУПЕР ОПТИМИЗИРАНА)
const loadTagCount = async (filters: any) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  // Проверяваме за всички типове филтри
  const hasAnyFilters = filters.onSale || filters.search || (filters.minPrice !== undefined && filters.maxPrice !== undefined);

  if (hasAnyFilters) {
    try {
      // Използваме ULTRA ГОЛЯМА first стойност за да получим всички резултати
      let totalFilteredCount = 0;
      let hasNextPage = true;
      let cursor = null;
      const batchSize = 1000; // Голям batch за по-малко заявки
      let batchCount = 0;
      const maxBatches = 5; // Максимум 5 batches = 5000 продукта

      while (hasNextPage && batchCount < maxBatches) {
        const variables: any = {
          first: batchSize,
        };

        if (cursor) {
          variables.after = cursor;
        }

        // Добавяме всички филтри ако са налични
        variables.productTag = [slug]; // Етикет филтър
        if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
        if (filters.onSale !== undefined) variables.onSale = filters.onSale;
        if (filters.search) variables.search = filters.search;

        // Използваме основната getProducts заявка която поддържа всички филтри
        const { data } = await useAsyncGql('getProducts' as any, variables);

        const result = data.value?.products;
        if (result) {
          const batchProducts = result.nodes || [];
          totalFilteredCount += batchProducts.length;

          hasNextPage = result.pageInfo?.hasNextPage || false;
          cursor = result.pageInfo?.endCursor || null;

          // Ако batch-ът не е пълен, значи сме достигнали края
          if (batchProducts.length < batchSize) {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }

        batchCount++;
      }

      filteredTagCount.value = totalFilteredCount > 0 ? totalFilteredCount : null;
    } catch (error) {
      filteredTagCount.value = null;
    }
  } else {
    filteredTagCount.value = null;
  }
};
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <div :key="currentSlug || 'no-tag'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="hidden lg:block lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentSlug" class="flex-1 min-w-0">
        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8">
            <div class="h-6 bg-gray-200 rounded-md w-32 animate-pulse"></div>
            <div class="flex items-center gap-4">
              <div class="h-8 bg-gray-200 rounded-md w-24 animate-pulse hidden lg:block"></div>
              <div class="h-8 bg-gray-200 rounded-md w-10 animate-pulse lg:hidden"></div>
            </div>
          </div>

          <!-- Products grid skeleton -->
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            <div v-for="i in 12" :key="i" class="space-y-3">
              <div class="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div class="space-y-2">
                <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Pagination skeleton -->
          <div class="flex justify-center mt-8">
            <div class="flex gap-2">
              <div v-for="i in 5" :key="i" class="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        <!-- Заредено съдържание -->
        <div v-else-if="products?.length" class="space-y-8">
          <!-- Header с контроли -->
          <div class="flex items-center justify-between w-full gap-4 mb-2 sm:mb-8">
            <ProductResultCount />
            <div class="flex items-center gap-4">
              <OrderByDropdown class="hidden lg:inline-flex" v-if="storeSettings?.showOrderByDropdown" />
              <div v-if="storeSettings?.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer :category-count="tagCount" />

          <!-- Описание на етикета -->
          <TaxonomyDescription v-if="matchingTagRef?.description" :description="matchingTagRef.description" :name="matchingTagRef.name" :max-height="200" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Няма намерени продукти с този етикет. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

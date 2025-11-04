<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';

// Зареждаме @vueform/slider CSS САМО на страници с филтри
import '@vueform/slider/themes/default.css';

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
  seconddesc?: string | null;
  count?: number | null;
  databaseId?: number | null;
  uri?: string | null;
}

// ПОПРАВКА: Използваме правилния параметър и декодираме URL-а
const routeSlug = route.params.tagSlug || route.params.slug; // Първо опитваме tagSlug, после slug
const decodedSlug = routeSlug ? decodeURIComponent(String(routeSlug)) : '';
const slug = decodedSlug;

// ⚡ КРИТИЧНО: Инициализираме currentSlug СЪС SLUG от URL-а за да се рендира при SSR!
const currentSlug = ref(slug);
const currentPageNumber = ref(1);

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

// ⚡ ФАЗА 1.2: ПРЕМАХНАТ TOP-LEVEL AWAIT - ще зареждаме async в onMounted
let matchingTag: Tag | null = null;
let realProductCount: number | null = null;

// ⚡ ВАЖНО: При SSR все още трябва да заредим tag data синхронно
if (process.server) {
  // САМО при SSR - батчирана заявка
  const { data: tagData } = await useAsyncGql(
    'getProductTags' as any,
    {
      slug: [slug],
      hideEmpty: false,
      first: 10,
    } as any,
  );

  if (tagData.value?.productTags?.nodes?.[0]) {
    matchingTag = tagData.value.productTags.nodes[0] as Tag;
    realProductCount = matchingTag.count || 0;
  }
  
  if (!matchingTag) {
    throw showError({ statusCode: 404, statusMessage: 'Етикетът не е намерен' });
  }
} else {
  // ⚡ При CLIENT - проверяваме кеша веднага (синхронно, БЕЗ await)
  const cachedData = getCachedTagData();
  if (cachedData) {
    matchingTag = cachedData.tag;
    realProductCount = cachedData.count;
    console.log('✅ CACHE HIT (TAG): Using cached tag data');
  }
  // Ако няма кеш, ще заредим в onMounted БЕЗ да блокираме initial render
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

  // Използваме етикетните данни като база (reactive ref за динамични обновления)
  const tag = matchingTagRef.value || matchingTag;
  const baseTitle = tag?.name ? `Етикет: ${tag.name}` : 'Етикет';
  const baseDescription = tag?.description || `Продукти с етикет ${tag?.name}`;

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-etiket/${slug}`
      : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-etiket/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме SEO метаданните (статични за SSR, реактивни за client)
// ⚡ КРИТИЧНО: За SSR генерираме ВЕДНЪЖ, за client използваме computed
const ssrTagSeoMeta = generateTagSeoMeta();
const initialTagSeoMeta = computed(() => generateTagSeoMeta());

useSeoMeta({
  title: () => initialTagSeoMeta.value.title,
  description: () => initialTagSeoMeta.value.description,
  ogTitle: () => initialTagSeoMeta.value.title,
  ogDescription: () => initialTagSeoMeta.value.description,
  ogType: 'website',
  ogUrl: () => initialTagSeoMeta.value.canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: () => initialTagSeoMeta.value.title,
  twitterDescription: () => initialTagSeoMeta.value.description,
  robots: 'index, follow',
});

// Reactive refs за SEO links (използваме SSR стойност за initial render)
const headLinks = ref([{ rel: 'canonical', href: ssrTagSeoMeta.canonicalUrl }]);

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
        ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-etiket/${slug}`
        : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-etiket/${slug}/page/${currentSeoMeta.pageNumber - 1}`;

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
    const nextUrl = `${frontEndUrl || 'https://leaderfitness.net'}/produkt-etiket/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
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

// ⚡ ПРЕМАХНАТО: updateTagSeoMeta() - вече не е нужна!
// Reactive computed tagSeoMeta автоматично се обновява когато matchingTagRef се промени.

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
    currentPage.value = targetPageNumber;

    // ⚡ ОПТИМИЗАЦИЯ: Обновяваме next/prev links БЕЗ await (не блокира)
    nextTick(() => updateTagNextPrevLinks());
  } catch (error) {
    hasEverLoaded.value = true;
  } finally {
    isNavigating = false;
  }
};

// ⚡ ФАЗА 1.2: ОПТИМИЗИРАН onMounted с async tag loading
onMounted(async () => {
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ⚡ КРИТИЧНО: При client-side навигация ВИНАГИ зареждаме актуални tag data!
  if (process.client) {
    // Ако няма кеш или е стар етикет, зареждаме нов
    const cachedData = getCachedTagData();
    const needsRefresh = !cachedData || cachedData.tag?.slug !== slug;
    
    if (needsRefresh) {
      console.log('🔄 CLIENT (TAG): Loading tag data async (no cache or different tag)');
      try {
        const { data: tagData } = await useAsyncGql(
          'getProductTags' as any,
          {
            slug: [slug],
            hideEmpty: false,
            first: 10,
          } as any,
        );

        if (tagData.value?.productTags?.nodes?.[0]) {
          matchingTag = tagData.value.productTags.nodes[0] as Tag;
          realProductCount = matchingTag.count || 0;
          matchingTagRef.value = matchingTag;
          
          // Кешираме данните
          setCachedTagData(matchingTag, realProductCount);
          console.log('✅ CLIENT (TAG): Tag data loaded and cached');
        } else {
          throw showError({ statusCode: 404, statusMessage: 'Етикетът не е намерен' });
        }
      } catch (error) {
        console.error('Failed to load tag:', error);
        throw showError({ statusCode: 404, statusMessage: 'Етикетът не е намерен' });
      }
    } else {
      console.log('✅ CLIENT (TAG): Using cached tag data');
      matchingTag = cachedData.tag;
      realProductCount = cachedData.count;
      matchingTagRef.value = matchingTag;
    }
  }

  // ⚡ HYBRID: Ако има SSR продукти, зареждаме останалите
  const hasSSRProducts = products.value.length > 0 && products.value.length < productsPerPage.value;
  
  if (hasSSRProducts || products.value.length === 0) {
    await loadTagProducts();
  }

  // ⚡ ОПТИМИЗАЦИЯ: Cache warming в requestIdleCallback (не блокира main thread)
  if (process.client && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      warmUpCache();
    }, { timeout: 2000 });
  } else if (process.client) {
    setTimeout(() => warmUpCache(), 100);
  }
  
  // ⚡ ОПТИМИЗАЦИЯ: SEO links се обновяват в следващия tick БЕЗ blocking
  nextTick(() => {
    updateTagNextPrevLinks();
  });
});

// ⚠️ НЕ зареждаме продукти на SSR - skeleton се рендерира, продукти client-side
// if (process.server) {
//   await loadTagProducts();
// }

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.1: SMART UNIFIED ROUTE WATCHER с DEBOUNCE
// Вместо 3 отделни watchers (fullPath, path, query) - 1 оптимизиран watcher
let tagNavigationDebounceTimer: NodeJS.Timeout | null = null;
let isTagNavigating = false;

watch(
  () => ({
    path: route.path,
    query: route.query,
    fullPath: route.fullPath,
  }),
  async (newRoute, oldRoute) => {
    if (!process.client) return;
    if (newRoute.fullPath === oldRoute.fullPath) return;

    if (isTagNavigating) {
      if (tagNavigationDebounceTimer) clearTimeout(tagNavigationDebounceTimer);
      tagNavigationDebounceTimer = null;
    }

    if (tagNavigationDebounceTimer) {
      clearTimeout(tagNavigationDebounceTimer);
    }

    tagNavigationDebounceTimer = setTimeout(async () => {
      if (isTagNavigating) return;
      isTagNavigating = true;

      try {
        // СЛУЧАЙ 1: Промяна в пътя (различен tag или страница)
        const pathChanged = newRoute.path !== oldRoute.path;

        if (pathChanged) {
          hasEverLoaded.value = false;
          await loadTagProducts();
          // ⚡ ПРЕМАХНАТО: updateTagSeoMeta() - reactive computed ще се обнови автоматично!
          return;
        }

        // СЛУЧАЙ 2: Промяна само в query параметрите (филтри/сортиране)
        const queryChanged = JSON.stringify(newRoute.query) !== JSON.stringify(oldRoute.query);

        if (queryChanged) {
          const newOrderBy = newRoute.query.orderby as string | null;
          const newOrder = newRoute.query.order as string | null;
          const newFilter = newRoute.query.filter as string | null;

          const sortingOrFilteringChanged =
            newOrderBy !== previousQuery.value.orderby || 
            newOrder !== previousQuery.value.order || 
            newFilter !== previousQuery.value.filter;

          if (sortingOrFilteringChanged && route.params.pageNumber) {
            const currentPageNumber = parseInt(String(route.params.pageNumber) || '1');

            if (currentPageNumber > 1) {
              const queryParams = new URLSearchParams();
              if (newOrderBy) queryParams.set('orderby', newOrderBy);
              if (newOrder) queryParams.set('order', newOrder);
              if (newFilter) queryParams.set('filter', newFilter);

              const queryString = queryParams.toString();
              const newUrl = `/produkt-etiket/${slug}${queryString ? `?${queryString}` : ''}`;

              previousQuery.value = {
                orderby: newOrderBy,
                order: newOrder,
                filter: newFilter,
              };

              await navigateTo(newUrl, { replace: true });
              return;
            }
          }

          previousQuery.value = {
            orderby: newOrderBy,
            order: newOrder,
            filter: newFilter,
          };

          hasEverLoaded.value = false;
          await loadTagProducts();
        }
      } finally {
        isTagNavigating = false;
        tagNavigationDebounceTimer = null;
      }
    }, 50);
  },
  { deep: true }
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
      // ⚡ СУПЕР БЪРЗО: Използваме getProductsCount вместо getProducts!
      const variables: any = {
        productTag: [slug], // Етикет филтър
        first: 2000, // Достатъчно за повечето случаи
      };

      // Добавяме всички филтри
      if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
      if (filters.onSale !== undefined) variables.onSale = filters.onSale;
      if (filters.search) variables.search = filters.search;

      // ⚡ КРИТИЧНО: Добавяме attributeFilter
      const runtimeConfig = useRuntimeConfig();
      const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES) ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES : [];

      const attributeFilters: any[] = [];
      globalProductAttributes.forEach((attr: any) => {
        if (filters[attr.slug] && Array.isArray(filters[attr.slug])) {
          attributeFilters.push({
            taxonomy: attr.slug,
            terms: filters[attr.slug],
            operator: 'IN',
          });
        }
      });

      if (attributeFilters.length > 0) {
        variables.attributeFilter = attributeFilters;
      }

      // ⚡ БЪРЗО: getProductsCount връща само cursor-и, БЕЗ продуктни данни!
      const { data } = await useAsyncGql('getProductsCount', variables);
      
      if (data.value?.products?.edges) {
        filteredTagCount.value = data.value.products.edges.length;
      } else {
        filteredTagCount.value = null;
      }
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
          <Filters :hide-categories="true" :tag-slug="currentSlug" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentSlug" class="flex-1 min-w-0">
        <!-- Breadcrumb навигация -->
        <nav v-if="matchingTagRef">
          <!-- Мобилна версия: скрита на desktop -->
          <div class="flex md:hidden text-xs leading-tight text-gray-400 gap-1.5 items-center py-2 mb-3">
            <NuxtLink to="/" class="hover:text-primary shrink-0">
              <Icon name="ion:home" size="14" class="text-gray-400" />
            </NuxtLink>
            <span class="shrink-0">/</span>
            <NuxtLink to="/magazin" class="hover:text-primary shrink-0 line-clamp-1">
              Магазин
            </NuxtLink>
            <span class="shrink-0 mx-0.5">/</span>
            <span class="text-gray-800 font-medium line-clamp-2 leading-relaxed" :title="`Етикет: ${matchingTagRef.name}`">
              Етикет: {{ matchingTagRef.name }}
            </span>
          </div>

          <!-- Desktop версия: скрита на мобилно -->
          <div class="hidden md:block mb-6 text-sm text-gray-600">
            <ol class="flex items-center space-x-2">
              <li>
                <NuxtLink to="/" class="hover:text-gray-900">{{ $t('messages.general.home') }}</NuxtLink>
              </li>
              <li>
                <span class="mx-2">/</span>
                <NuxtLink to="/magazin" class="hover:text-gray-900">Магазин</NuxtLink>
              </li>
              <li>
                <span class="mx-2">/</span>
                <span class="text-gray-900 font-medium">Етикет: {{ matchingTagRef.name }}</span>
              </li>
            </ol>
          </div>
        </nav>

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
          <!-- H1 Заглавие за SEO -->
          <h1 v-if="matchingTagRef?.name && currentPageNumber === 1" class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {{ matchingTagRef.name }}
          </h1>

          <!-- Първо описание над продуктите (под H1) -->
          <TopTaxonomyDescription
            v-if="matchingTagRef?.description && currentPageNumber === 1"
            :description="matchingTagRef.description"
            :name="matchingTagRef.name"
            :max-height="120" />

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

          <!-- Второ описание под продуктите -->
          <SecondTaxonomyDescription
            v-if="matchingTagRef?.seconddesc"
            :description="matchingTagRef.seconddesc"
            :name="matchingTagRef.name"
            :max-height="200" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Няма намерени продукти с този етикет. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

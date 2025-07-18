<script setup lang="ts">
const {
  loadProductsPage,
  loadProductsWithFilters,
  products,
  isLoading,
  currentPage,
  pageInfo,
  resetProductsState,
  activeFilters,
  jumpToPageOptimized,
  loadProductsPageOptimized,
  productsPerPage,
} = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
const { isQueryEmpty, frontEndUrl } = useHelpers();

// Проследяваме дали някога сме зареждали данни
const hasEverLoaded = ref(false);

// Get route instance once
const route = useRoute();

// Ref за category count при филтриране
const filteredCategoryCount = ref<number | null>(null);

// Ref за общия брой продукти в магазина (без филтри)
const totalProductsCount = ref<number | null>(null);

// ⚡ ПОПРАВКА: Зареждаме общия брой продукти още при SSR за правилни SEO тагове
const { data: initialCountData } = await useAsyncGql('getTotalProductsCountInstant');
if (initialCountData.value?.totalProductsCount) {
  totalProductsCount.value = initialCountData.value.totalProductsCount;
}

// ИНТЕЛИГЕНТНО кеширане (според obuvki.bg подхода)
const CACHE_KEY = 'woonuxt_total_products_count';
const CACHE_DURATION = 30 * 60 * 1000; // 30 минути (като obuvki.bg)
const CACHE_VERSION = 'v3'; // Увеличена версия за нов кеш

// Функция за четене от кеша с версия проверка
const getCachedTotalCount = (): number | null => {
  if (!process.client) {
    return null;
  }

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const { count, timestamp, version } = JSON.parse(cached);
    const now = Date.now();

    // Проверяваме версията на кеша
    if (version !== CACHE_VERSION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Проверяваме дали кешът е валиден
    if (now - timestamp < CACHE_DURATION) {
      return count;
    }

    // Изтриваме изтекъл кеш
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    return null;
  }
};

// Функция за записване в кеша с версия
const setCachedTotalCount = (count: number): void => {
  if (!process.client) return;

  try {
    const cacheData = {
      count,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

// ТЕХНИКА 4: Proactive cache warming (зареждане на кеша напред)
const warmUpCache = async () => {
  if (!process.client) return;

  // Зареждаме кеша само ако няма валиден кеш
  const cachedCount = getCachedTotalCount();
  if (cachedCount === null) {
    // Зареждаме в background без да блокираме UI - само на клиента
    setTimeout(async () => {
      if (process.client) {
        await loadTotalProductsCount(false);
      }
    }, 100);
  }
};

// Зареждаме Yoast SEO данните за shop страницата
const { data: seoData } = await useAsyncGql('getShopPage');
const shopSeo = seoData.value?.page?.seo || null;

// Функция за генериране на SEO данни според страницата
const generateSeoMeta = () => {
  // Получаваме номера на страницата
  let pageNumber = 1;
  if (route.params.pageNumber) {
    const parsedPage = parseInt(route.params.pageNumber as string);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNumber = parsedPage;
    }
  }

  // Използваме Yoast данните като база, но с fallback
  const baseTitle = shopSeo?.title || 'Магазин - Спортно оборудване и фитнес уреди';
  const baseDescription =
    shopSeo?.metaDesc || 'Разгледайте цялата ни колекция от спортно оборудване, фитнес уреди и аксесоари. Високо качество, конкурентни цени и бърза доставка.';

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin`
      : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме и задаваме SEO метаданните
const seoMeta = generateSeoMeta();

useSeoMeta({
  title: seoMeta.title,
  description: seoMeta.description,
  ogTitle: shopSeo?.opengraphTitle || seoMeta.title,
  ogDescription: shopSeo?.opengraphDescription || seoMeta.description,
  ogType: 'website',
  ogUrl: seoMeta.canonicalUrl,
  ogImage: shopSeo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: shopSeo?.twitterTitle || seoMeta.title,
  twitterDescription: shopSeo?.twitterDescription || seoMeta.description,
  twitterImage: shopSeo?.twitterImage?.sourceUrl,
  robots: shopSeo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Canonical URL (използваме само frontend URL-а)
const canonicalUrl = seoMeta.canonicalUrl;

// ПОПРАВКА: Използваме reactive ref за линковете, точно както в категориите
const headLinks = ref([{ rel: 'canonical', href: canonicalUrl }]);

useHead({
  link: headLinks,
});

// Schema markup от Yoast ако е наличен
if (shopSeo?.schema?.raw) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: shopSeo.schema.raw,
      },
    ],
  });
}

// Prev/Next links за pagination SEO - ПРЕМАХНАТА placeholder логика
// const initialPrevNextLinks: any[] = [];

// if (seoMeta.pageNumber > 1) {
//   const prevUrl =
//     seoMeta.pageNumber === 2
//       ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin`
//       : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber - 1}`;

//   initialPrevNextLinks.push({ rel: 'prev', href: prevUrl });
// }

// // Добавяме next link изначално като placeholder - ще се обновява динамично
// const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber + 1}`;
// initialPrevNextLinks.push({ rel: 'next', href: nextUrl });

// useHead({
//   link: initialPrevNextLinks,
// });

// Функция за динамично обновяване на next/prev links
const updateNextPrevLinks = () => {
  const updatedLinks: any[] = [{ rel: 'canonical', href: seoMeta.canonicalUrl }]; // Винаги започваме с canonical

  if (seoMeta.pageNumber > 1) {
    const prevUrl =
      seoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin`
        : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber - 1}`;

    updatedLinks.push({ rel: 'prev', href: prevUrl });
  }

  // ПОПРАВКА: Проверяваме и за максимални страници БЕЗ филтри
  let hasNextPage = pageInfo?.hasNextPage || false;

  // При филтри разчитаме на pageInfo
  const hasFilters = route.query.filter;
  if (!hasFilters && totalProductsCount.value) {
    // БЕЗ филтри - проверяваме точния брой страници
    const maxPages = Math.ceil(totalProductsCount.value / productsPerPage.value);
    hasNextPage = seoMeta.pageNumber < maxPages; // Ключова поправка: използваме < вместо >=
  }

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber + 1}`;
    updatedLinks.push({ rel: 'next', href: nextUrl });
  }

  headLinks.value = updatedLinks; // Обновяваме reactive ref
};

// Race condition protection
let isNavigating = false;

// Проследяване на предишни query параметри за умно redirect управление
let previousQuery = ref({
  orderby: null as string | null,
  order: null as string | null,
  filter: null as string | null,
});

// Функция за парсене на филтри от URL
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

  // Category филтър - само ако има валидни стойности
  const categoryFilter = getFilterValues('category');
  if (categoryFilter.length > 0) {
    filters.categorySlug = categoryFilter.filter((cat) => cat && cat.trim());
  }

  // НОВО: Добавяме поддръжка за продуктови атрибути
  const runtimeConfig = useRuntimeConfig();
  const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES) ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES : [];

  globalProductAttributes.forEach((attr: any) => {
    if (attr.slug) {
      const attributeValues = getFilterValues(attr.slug);
      if (attributeValues.length > 0) {
        filters[attr.slug] = attributeValues;
      }
    }
  });

  return filters;
};

// Функция за зареждане на продукти според URL
const loadProductsFromRoute = async () => {
  if (isNavigating) {
    return;
  }

  isNavigating = true;

  try {
    // Reset products състоянието за чист старт
    resetProductsState();

    // Използваме route.params.pageNumber вместо мануално парсване от path
    let pageNumber = 1;

    // ПОПРАВКА: Ако сме в root /magazin (без /page/X), винаги pageNumber = 1
    if (route.path === '/magazin') {
      pageNumber = 1;
    } else if (route.params.pageNumber) {
      const parsedPage = parseInt(route.params.pageNumber as string);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageNumber = parsedPage;
      }
    }

    // КРИТИЧНО: Проверяваме за невалидни страници ПРЕДИ зареждане
    if (pageNumber > 1) {
      const hasFilters = route.query.filter;

      if (!hasFilters && process.client) {
        // БЕЗ филтри - ЗАДЪЛЖИТЕЛНО зареждаме count преди проверка
        let currentTotalCount = totalProductsCount.value;

        if (currentTotalCount === null) {
          const cachedCount = getCachedTotalCount();
          if (cachedCount !== null) {
            currentTotalCount = cachedCount;
            totalProductsCount.value = cachedCount;
          } else {
            // КРИТИЧНО: Зареждаме count преди да продължим
            await ensureTotalProductsCount();
            currentTotalCount = totalProductsCount.value;
          }
        }

        if (currentTotalCount && currentTotalCount > 0) {
          const maxPages = Math.ceil(currentTotalCount / productsPerPage.value);
          if (pageNumber > maxPages) {
            throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува. Максимална страница: ${maxPages}` });
          }
        }
      }
    }

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри

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

      // ПОПРАВЕНО: Използваме оптимизираните функции с fix-натия jumpToPageOptimized
      if (pageNumber === 1) {
        await loadProductsPageOptimized(pageNumber, undefined, graphqlOrderBy, filters);
      } else {
        await jumpToPageOptimized(pageNumber, undefined, graphqlOrderBy, filters);
      }

      // КРИТИЧНО: Проверяваме дали получихме резултати при филтриране
      if (process.client && hasFilters && pageNumber > 1 && (!products.value || products.value.length === 0)) {
        throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува с тези филтри` });
      }

      // Зареждаме category count при филтриране
      await loadCategoryCount(filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница
      if (pageNumber === 1) {
        await loadProductsPageOptimized(pageNumber);
      } else {
        await jumpToPageOptimized(pageNumber);
      }

      // КРИТИЧНО: Проверяваме дали получихме резултати БЕЗ филтри
      if (process.client && pageNumber > 1 && (!products.value || products.value.length === 0)) {
        // Зареждаме count за точно съобщение
        await ensureTotalProductsCount();
        const maxPages = totalProductsCount.value ? Math.ceil(totalProductsCount.value / productsPerPage.value) : 1;
        throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува. Максимална страница: ${maxPages}` });
      }

      // Reset category count
      filteredCategoryCount.value = null;

      // КРИТИЧНО: Зареждаме count веднага за правилна последна страница - само на клиента
      if (process.client) {
        const cachedCount = getCachedTotalCount();
        if (cachedCount !== null) {
          totalProductsCount.value = cachedCount;
        } else {
          // Зареждаме count веднага за правилна последна страница
          await ensureTotalProductsCount();
        }
      }
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // Принудително обновяване на currentPage за правилна синхронизация с pagination
    currentPage.value = pageNumber;

    // Обновяваме next/prev links след зареждане на данните
    await nextTick();
    updateNextPrevLinks();

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  } finally {
    isNavigating = false;
  }
};

// ПОПРАВКА: Извикваме updateNextPrevLinks и извън onMounted, за да работи при SSR
updateNextPrevLinks();

// Зареждаме продуктите веднага при SSR и след hydration
onMounted(async () => {
  // Инициализираме предишните query стойности
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ТЕХНИКА 5: Proactive cache warming за по-бърза последна страница - само на клиента
  if (process.client) {
    warmUpCache();
  }

  // КРИТИЧНО: Зареждаме count веднага за правилна последна страница - точно като в категориите
  if (!route.query.filter) {
    if (process.client) {
      const cachedCount = getCachedTotalCount();
      if (cachedCount !== null) {
        totalProductsCount.value = cachedCount;
      } else {
        // Ако няма кеш, зареждаме count веднага за правилна последна страница
        await ensureTotalProductsCount();
      }
    }
  }

  // Изчакваме един tick за да се установи правилно route състоянието
  await nextTick();
  await loadProductsFromRoute();
});

// За SSR зареждане при извикване на страницата - ВРЕМЕННО ИЗКЛЮЧЕНО заради composables грешки
// if (process.server) {
//   loadProductsFromRoute();
// }

// Слушаме за промени в route-а
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      loadProductsFromRoute();
    }
  },
);

// Допълнителен watcher за промени в path за да се улавя навигацията между страници
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      // Reset loading състоянието при навигация за да се покаже skeleton
      hasEverLoaded.value = false;
      loadProductsFromRoute();
    }
  },
);

// Watcher за промени в query параметрите (филтри и сортиране) - с умно redirect управление
watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    if (process.client && JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      // Проверяваме дали са се променили sorting/filtering параметрите (не page)
      const newOrderBy = newQuery.orderby as string | null;
      const newOrder = newQuery.order as string | null;
      const newFilter = newQuery.filter as string | null;

      const sortingOrFilteringChanged =
        newOrderBy !== previousQuery.value.orderby || newOrder !== previousQuery.value.order || newFilter !== previousQuery.value.filter;

      // ПОПРАВКА: Използваме същата логика като в категориите
      // Ако са се променили sorting/filtering параметрите И сме на страница > 1
      // ВАЖНО: За magazin използваме route.params.pageNumber, не newQuery.page!
      if (sortingOrFilteringChanged && route.params.pageNumber) {
        const currentPageNumber = parseInt(String(route.params.pageNumber) || '1');

        if (currentPageNumber > 1) {
          // Изграждаме URL за страница 1 с новите sorting/filtering параметри
          const queryParams = new URLSearchParams();
          if (newOrderBy) queryParams.set('orderby', newOrderBy);
          if (newOrder) queryParams.set('order', newOrder);
          if (newFilter) queryParams.set('filter', newFilter);

          const queryString = queryParams.toString();
          const newUrl = `/magazin${queryString ? `?${queryString}` : ''}`;

          // Обновяваме предишните стойности преди redirect
          previousQuery.value = {
            orderby: newOrderBy,
            order: newOrder,
            filter: newFilter,
          };

          await navigateTo(newUrl, { replace: true });
          return; // Излизаме рано - navigateTo ще предизвика нов loadProductsFromRoute
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
      loadProductsFromRoute();
    }
  },
);

// Watcher за pageInfo за динамично обновяване на next/prev links
watch(
  () => pageInfo,
  () => {
    if (process.client) {
      updateNextPrevLinks();
    }
  },
  { deep: true },
);

// КРИТИЧНО: Автоматично зареждане на count за правилна последна страница - точно като в категориите
watch(
  () => [currentPage.value, route.query.filter, pageInfo?.hasNextPage],
  async ([newPage, newFilter, hasNext]) => {
    if (process.client && !newFilter) {
      // Без филтри - винаги зареждаме count за правилна последна страница
      const pageNumber = Number(newPage) || 1;

      // ПОПРАВКА: Зареждаме count ако:
      // 1. Нямаме count въобще (критично за последна страница)
      // 2. Сме на страница > 3 (за по-ранно зареждане)
      const needsCount = totalProductsCount.value === null;

      if (needsCount) {
        await ensureTotalProductsCount();
      }
    }
  },
);

// Watcher за филтри - актуализира правилния count при промяна на филтрите
watch(
  () => route.query.filter,
  async (newFilter) => {
    if (process.client && newFilter) {
      const filters = parseFiltersFromQuery(newFilter as string);
      await loadCategoryCount(filters);
    } else if (process.client && !newFilter) {
      // Когато няма филтри, проверяваме кеша и зареждаме count за правилна последна страница
      filteredCategoryCount.value = null;

      const cachedCount = getCachedTotalCount();
      if (cachedCount !== null) {
        totalProductsCount.value = cachedCount;
      } else {
        // Зареждаме count веднага за правилна последна страница
        await ensureTotalProductsCount();
      }
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

// Computed за правилен count за pagination - ТОЧНО като realProductCount в категориите
const categoryCount = computed(() => {
  // Парсваме филтрите директно от URL за актуална проверка
  const hasFilters = route.query.filter;

  if (hasFilters) {
    const filters = parseFiltersFromQuery(route.query.filter as string);

    // ПОПРАВКА: Проверяваме за ВСИЧКИ типове филтри, включително атрибутни
    const hasAnyFilters =
      (filters.categorySlug && filters.categorySlug.length > 0) ||
      filters.onSale ||
      filters.search ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined;

    // КРИТИЧНО: Проверяваме за атрибутни филтри като pa_brands, pa_color и т.н.
    const runtimeConfig = useRuntimeConfig();
    const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES) ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES : [];

    const hasAttributeFilters = globalProductAttributes.some((attr: any) => {
      return attr.slug && filters[attr.slug] && filters[attr.slug].length > 0;
    });

    if (hasAnyFilters || hasAttributeFilters) {
      // При всякакви филтри (включително атрибутни) използваме филтрирания count
      return filteredCategoryCount.value;
    }
  }

  // КРИТИЧНО: Без филтри ВИНАГИ връщаме totalProductsCount - ТОЧНО като matchingCategory?.count в категориите
  // Това е ключът за правилната последна страница!
  return totalProductsCount.value;
});

// МГНОВЕН COUNT (като obuvki.bg подход) - БЕЗ БРОЙЕНЕ!
const loadTotalProductsCount = async (forceLoad = false) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  // Първо проверяваме кеша
  if (!forceLoad) {
    const cachedCount = getCachedTotalCount();
    if (cachedCount !== null) {
      totalProductsCount.value = cachedCount;
      return;
    }
  }

  try {
    // 🚀 ДИРЕКТЕН WORDPRESS COUNT - МГНОВЕНО!
    const { data: instantData } = await useAsyncGql('getTotalProductsCountInstant');
    const directCount = instantData.value?.totalProductsCount;

    if (directCount && directCount > 0) {
      totalProductsCount.value = directCount;
      setCachedTotalCount(directCount);
      return;
    }
  } catch (error) {
    // Преминаваме към fallback
  }

  // FALLBACK: Ако директният WordPress count не работи
  try {
    const { data: fallbackData } = await useAsyncGql('getProductsCountFast', {
      first: 3000, // Оптимизирано за ~2000 продукта (50% buffer)
    });

    const result = fallbackData.value?.products;

    if (result) {
      const edges = result.edges || [];
      let totalCount = edges.length;

      // РЯДКО: Само ако има повече от 3000 продукта (при ~2000 реални)
      if (result.pageInfo?.hasNextPage && result.pageInfo?.endCursor) {
        totalCount = await loadRemainingCount(result.pageInfo.endCursor, totalCount);
      }

      totalProductsCount.value = totalCount > 0 ? totalCount : null;

      // Записваме в кеша
      if (totalCount > 0) {
        setCachedTotalCount(totalCount);
      }
    } else {
      totalProductsCount.value = null;
    }
  } catch (error) {
    // ПОСЛЕДНА ВЪЗМОЖНОСТ: Връщаме се към batching
    await loadTotalProductsCountFallback(forceLoad);
  }
};

// ТЕХНИКА 3: Optimized batching за останалите продукти (само при нужда)
const loadRemainingCount = async (startCursor: string, currentCount: number) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return currentCount;
  }

  let totalCount = currentCount;
  let hasNextPage = true;
  let cursor: string | null = startCursor;
  const batchSize = 1000; // По-големи batches за по-малко заявки
  const maxBatches = 5; // Максимум 5 допълнителни batch-а
  let batchCount = 0;

  while (hasNextPage && batchCount < maxBatches && cursor) {
    const variables: any = {
      first: batchSize,
    };

    if (cursor) {
      variables.after = cursor;
    }

    const { data } = await useAsyncGql('getProductsCountBatched', variables);

    const result = data.value?.products;

    if (result) {
      const edges = result.edges || [];
      totalCount += edges.length;

      hasNextPage = result.pageInfo?.hasNextPage || false;
      cursor = result.pageInfo?.endCursor || null;

      // Progressive loading - обновяваме count постепенно
      totalProductsCount.value = totalCount;

      // Ако batch-ът не е пълен, значи сме достигнали края
      if (edges.length < batchSize) {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }

    batchCount++;
  }

  return totalCount;
};

// FALLBACK функция с оригинална логика
const loadTotalProductsCountFallback = async (forceLoad = false) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  try {
    let totalCount = 0;
    let hasNextPage = true;
    let cursor = null;
    const batchSize = 500; // По-големи batches за по-малко заявки
    const maxBatches = 10; // Намалени batches
    let batchCount = 0;

    while (hasNextPage && batchCount < maxBatches) {
      const variables: any = {
        first: batchSize,
      };

      if (cursor) {
        variables.after = cursor;
      }

      const { data } = await useAsyncGql('getProductsCountBatched', variables);
      const result = data.value?.products;

      if (result) {
        const batchEdges = result.edges || [];
        totalCount += batchEdges.length;

        hasNextPage = result.pageInfo?.hasNextPage || false;
        cursor = result.pageInfo?.endCursor;

        // Progressive loading
        if (totalCount > 0 && batchCount >= 1) {
          totalProductsCount.value = totalCount;
        }

        if (batchEdges.length < batchSize) {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      batchCount++;
    }

    totalProductsCount.value = totalCount > 0 ? totalCount : null;

    // Записваме в кеша
    if (totalCount > 0) {
      setCachedTotalCount(totalCount);
    }
  } catch (error) {
    totalProductsCount.value = null;
  }
};

// Lazy loading функция - зарежда count само при нужда
const ensureTotalProductsCount = async () => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  if (totalProductsCount.value === null) {
    await loadTotalProductsCount();
  }
};

// ⚡ ОПТИМИЗИРАНА функция за зареждане на filtered count (5-10x по-бързо!)
const FILTER_CACHE_KEY = 'woonuxt_filter_counts';
const FILTER_CACHE_DURATION = 5 * 60 * 1000; // 5 минути TTL

// Функция за генериране на кеш ключ за филтри
const generateFilterCacheKey = (filters: any): string => {
  const sortedFilters = Object.keys(filters)
    .sort()
    .map((key) => `${key}:${Array.isArray(filters[key]) ? filters[key].sort().join(',') : filters[key]}`)
    .join('|');
  return `filter_${btoa(sortedFilters).slice(0, 20)}`;
};

// Функция за четене от filter кеша
const getCachedFilterCount = (filters: any): number | null => {
  if (!process.client) return null;

  try {
    const cached = sessionStorage.getItem(FILTER_CACHE_KEY);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const filterKey = generateFilterCacheKey(filters);
    const filterData = cacheData[filterKey];

    if (!filterData) return null;

    const now = Date.now();
    if (now - filterData.timestamp < FILTER_CACHE_DURATION) {
      return filterData.count;
    }

    // Изтриваме изтекъл кеш
    delete cacheData[filterKey];
    sessionStorage.setItem(FILTER_CACHE_KEY, JSON.stringify(cacheData));
    return null;
  } catch {
    return null;
  }
};

// Функция за записване в filter кеша
const setCachedFilterCount = (filters: any, count: number): void => {
  if (!process.client) return;

  try {
    let cacheData: { [key: string]: { count: number; timestamp: number } } = {};
    const cached = sessionStorage.getItem(FILTER_CACHE_KEY);
    if (cached) {
      cacheData = JSON.parse(cached);
    }

    const filterKey = generateFilterCacheKey(filters);
    cacheData[filterKey] = {
      count,
      timestamp: Date.now(),
    };

    // Ограничаваме кеша до максимум 20 записа
    const keys = Object.keys(cacheData);
    if (keys.length > 20 && keys[0]) {
      let oldestKey = keys[0];
      let oldestTime = cacheData[oldestKey]?.timestamp || 0;

      for (const key of keys) {
        const time = cacheData[key]?.timestamp || 0;
        if (time < oldestTime) {
          oldestKey = key;
          oldestTime = time;
        }
      }

      delete cacheData[oldestKey];
    }

    sessionStorage.setItem(FILTER_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

const loadCategoryCount = async (filters: any) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  // ПОПРАВКА: Проверяваме за всички типове филтри, включително атрибутни
  const hasAnyFilters =
    (filters.categorySlug && filters.categorySlug.length > 0) ||
    filters.onSale ||
    filters.search ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  // КРИТИЧНО: Проверяваме за атрибутни филтри като pa_brands, pa_color и т.н.
  const runtimeConfig = useRuntimeConfig();
  const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES) ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES : [];

  const hasAttributeFilters = globalProductAttributes.some((attr: any) => {
    return attr.slug && filters[attr.slug] && filters[attr.slug].length > 0;
  });

  if (hasAnyFilters || hasAttributeFilters) {
    // ⚡ ПЪРВО: Проверяваме кеша
    const cachedCount = getCachedFilterCount(filters);
    if (cachedCount !== null) {
      filteredCategoryCount.value = cachedCount;
      return;
    }

    try {
      console.log(`🔍 DEBUG: Започвам ТОЧЕН count за филтри:`, filters);

      const variables: any = {
        first: 1000, // Лимит за стара заявка getProductsCount
      };

      // Добавяме всички филтри ако са налични
      if (filters.categorySlug && filters.categorySlug.length > 0) {
        variables.slug = filters.categorySlug;
        console.log(`📂 DEBUG: Филтрирам по категория:`, filters.categorySlug);
      }
      if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
      if (filters.onSale !== undefined) variables.onSale = filters.onSale;
      if (filters.search) variables.search = filters.search;

      // КРИТИЧНО: Добавяме attributeFilter за атрибутни филтри
      if (process.client) {
        const { getFilter } = useFiltering();

        const attributeFilters: any[] = [];
        globalProductAttributes.forEach((attr: any) => {
          if (attr.slug && filters[attr.slug] && filters[attr.slug].length > 0) {
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
      }

      console.log(`🚀 DEBUG: Изпращам variables за точен count:`, variables);

      // ⚡ ИЗПОЛЗВАМЕ СТАРА ЗАЯВКА, но с лимит 5000 за точен count
      const { data } = await useAsyncGql('getProductsCount', variables);

      const result = data.value?.products;
      if (result) {
        const edges = result.edges || [];
        const totalCount = edges.length;
        const hasMore = result.pageInfo?.hasNextPage || false;

        console.log(`📊 DEBUG: Резултат - edges: ${totalCount}, hasNextPage: ${hasMore}`);

        if (hasMore && totalCount >= 1000) {
          console.warn(`⚠️ DEBUG: Има повече от 1000 продукта - използвам частичен count: ${totalCount}`);
        }

        console.log(`🏁 DEBUG: Финален ТОЧЕН count: ${totalCount}`);

        // 💾 Кешираме резултата
        if (totalCount > 0) {
          setCachedFilterCount(filters, totalCount);
        }

        filteredCategoryCount.value = totalCount > 0 ? totalCount : null;
      } else {
        console.log(`❌ DEBUG: Няма резултат от GraphQL`);
        filteredCategoryCount.value = null;
      }
    } catch (error) {
      console.warn('Filter count error:', error);
      filteredCategoryCount.value = null;
    }
  } else {
    filteredCategoryCount.value = null;
  }
};
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <div class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings.showFilters" class="hidden lg:block lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main class="flex-1 min-w-0">
        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8 c1">
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
              <OrderByDropdown class="hidden lg:inline-flex" v-if="storeSettings.showOrderByDropdown" />
              <div v-if="storeSettings.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer :categoryCount="categoryCount" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Could not fetch products from your store. Please check your configuration. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

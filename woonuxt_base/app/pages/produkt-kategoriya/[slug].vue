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

interface Category {
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  seconddesc?: string | null;
  count?: number | null;
  databaseId?: number | null;
  image?: {
    sourceUrl?: string | null;
    altText?: string | null;
    title?: string | null;
  } | null;
  children?: {
    nodes?: Category[] | null;
  } | null;
  parent?: {
    node?: {
      slug?: string | null;
      name?: string | null;
      databaseId?: number | null;
    } | null;
  } | null;
  seo?: {
    title?: string | null;
    metaDesc?: string | null;
    opengraphTitle?: string | null;
    opengraphDescription?: string | null;
    canonical?: string | null;
    metaKeywords?: string | null;
    metaRobotsNoindex?: string | null;
    metaRobotsNofollow?: string | null;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    opengraphImage?: {
      sourceUrl?: string | null;
      altText?: string | null;
    } | null;
    twitterImage?: {
      sourceUrl?: string | null;
      altText?: string | null;
    } | null;
    schema?: {
      raw?: string | null;
    } | null;
  } | null;
}

// ПОПРАВКА: Използваме правилния параметър и декодираме URL-а
const routeSlug = route.params.categorySlug || route.params.slug; // Първо опитваме categorySlug, после slug
const decodedSlug = routeSlug ? decodeURIComponent(String(routeSlug)) : '';

// ⚡ КРИТИЧНО: Инициализираме currentSlug СЪС SLUG от URL-а за да се рендира при SSR!
const currentSlug = ref(decodedSlug);
const currentPageNumber = ref(1);
const slug = decodedSlug;

// ⚡ ОПТИМИЗАЦИЯ 1: SMART CACHING (като в magazin.vue)
const CATEGORY_CACHE_KEY = `woonuxt_category_${slug}`;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минути
const CACHE_VERSION = 'v1';

// Функции за кеширане
const getCachedCategoryData = (): { category: Category | null; count: number | null } | null => {
  if (!process.client) return null;

  try {
    const cached = sessionStorage.getItem(CATEGORY_CACHE_KEY);
    if (!cached) return null;

    const { category, count, timestamp, version } = JSON.parse(cached);
    const now = Date.now();

    if (version !== CACHE_VERSION || now - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CATEGORY_CACHE_KEY);
      return null;
    }

    return { category, count };
  } catch (error) {
    return null;
  }
};

const setCachedCategoryData = (category: Category, count: number): void => {
  if (!process.client) return;

  try {
    const cacheData = {
      category,
      count,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

// ⚡ ФАЗА 1.2: ПРЕМАХНАТ TOP-LEVEL AWAIT - ще зареждаме async в onMounted
// Това позволява по-бързо initial render при client-side navigation
let matchingCategory: Category | null = null;
let realProductCount: number | null = null;

// ⚡ ВАЖНО: При SSR зареждаме category data И products count ПАРАЛЕЛНО (като в child.vue)
if (process.server) {
  // ⚡ ОПТИМИЗАЦИЯ: Promise.all зарежда 2те заявки едновременно вместо последователно!
  const [categoryData, productsCountData] = await Promise.all([
    useAsyncGql('getProductCategories', {
      slug: [slug],
      hideEmpty: false,
      first: 10,
    }),
    useAsyncGql('getProductsCount', {
      slug: [slug],
    }),
  ]);

  if (categoryData.data.value?.productCategories?.nodes?.[0]) {
    matchingCategory = categoryData.data.value.productCategories.nodes[0] as Category;
    // Използваме точния count от getProductsCount вместо category.count
    realProductCount = productsCountData.data.value?.products?.edges?.length || matchingCategory.count || 0;
  }

  if (!matchingCategory) {
    throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
  }
} else {
  // ⚡ При CLIENT - проверяваме кеша веднага (синхронно, БЕЗ await)
  const cachedData = getCachedCategoryData();
  if (cachedData) {
    matchingCategory = cachedData.category;
    realProductCount = cachedData.count;
  }
  // Ако няма кеш, ще заредим в onMounted БЕЗ да блокираме initial render
}

// Reactive ref за runtime промени
const matchingCategoryRef = ref<Category | null>(matchingCategory);

// Ref за филтриран count при филтриране (взето от magazin.vue)
const filteredCategoryCount = ref<number | null>(null);

// ⚡ ОПТИМИЗАЦИЯ: loadPreciseCount е премахната!
// WooCommerce GraphQL API вече връща точен count в getProductCategories
// Не е нужна отделна заявка - спестяваме 300-800ms!

// Функция за генериране на SEO данни според страницата (взета от /magazin)
const generateCategorySeoMeta = () => {
  // Получаваме номера на страницата - използваме същата логика като extractRouteParams
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

  // Използваме категорийните SEO данни като база (вместо Yoast)
  const category = matchingCategoryRef.value || matchingCategory;
  const baseTitle = category?.seo?.title || category?.name || 'Категория';
  const baseDescription = category?.seo?.metaDesc || category?.description || `Продукти в категория ${category?.name}`;

  // Генерираме динамичен title и description точно като в /magazin
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${slug}`
      : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме SEO метаданните (статични за SSR, реактивни за client)
// ⚡ КРИТИЧНО: За SSR генерираме ВЕДНЪЖ и запазваме като fallback
const ssrCategorySeoMeta = generateCategorySeoMeta();
const initialCategorySeoMeta = computed(() => {
  const seoMeta = generateCategorySeoMeta();
  // ⚡ КРИТИЧНО: Ако title е undefined, връщаме SSR данните
  return seoMeta.title && seoMeta.title !== 'undefined' ? seoMeta : ssrCategorySeoMeta;
});

useSeoMeta({
  title: () => initialCategorySeoMeta.value.title || ssrCategorySeoMeta.title,
  description: () => initialCategorySeoMeta.value.description || ssrCategorySeoMeta.description,
  ogTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphTitle || initialCategorySeoMeta.value.title || ssrCategorySeoMeta.title,
  ogDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphDescription || initialCategorySeoMeta.value.description || ssrCategorySeoMeta.description,
  ogType: 'website',
  ogUrl: () => initialCategorySeoMeta.value.canonicalUrl || ssrCategorySeoMeta.canonicalUrl,
  ogImage: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterTitle || initialCategorySeoMeta.value.title || ssrCategorySeoMeta.title,
  twitterDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterDescription || initialCategorySeoMeta.value.description || ssrCategorySeoMeta.description,
  twitterImage: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterImage?.sourceUrl,
  robots: () => (matchingCategoryRef.value || matchingCategory)?.seo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Reactive refs за SEO links (използваме SSR стойност за initial render)
const headLinks = ref([{ rel: 'canonical', href: ssrCategorySeoMeta.canonicalUrl }]);

useHead({
  link: headLinks,
});

// Schema markup от категорията ако е наличен
if (matchingCategory?.seo?.schema?.raw) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: matchingCategory.seo.schema.raw,
      },
    ],
  });
}

// Cache за да не извикваме функцията твърде често
let lastLinksUpdate = '';

// Функция за динамично обновяване на next/prev links с точен брой продукти
const updateCategoryNextPrevLinks = () => {
  if (process.client && (window as any).debugPagination) {
    console.log('🔗 updateCategoryNextPrevLinks called!');
  }

  const currentSeoMeta = generateCategorySeoMeta(); // Генерираме динамичните SEO данни
  const updatedCategoryLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount || matchingCategory?.count || 0;
  const totalPages = Math.ceil(totalProductCount / productsPerPage.value);

  if (process.client && (window as any).debugPagination) {
    console.log('🔗 Debug data:', {
      currentPage: currentSeoMeta.pageNumber,
      totalProductCount,
      totalPages,
      realProductCount,
      hasRealCount: !!realProductCount,
    });
  }

  // Prev link
  if (currentSeoMeta.pageNumber > 1) {
    const prevUrl =
      currentSeoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${slug}`
        : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${slug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedCategoryLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link - използваме точното изчисление на база реалния брой продукти
  let hasNextPage = false;

  // При филтри разчитаме на pageInfo
  const hasFilters = route.query.filter;
  if (hasFilters) {
    hasNextPage = pageInfo?.hasNextPage || false;
  } else {
    // БЕЗ филтри - използваме точния брой продукти
    hasNextPage = realProductCount
      ? currentSeoMeta.pageNumber < totalPages // Точно изчисление ако имаме реален count
      : pageInfo?.hasNextPage; // Fallback към pageInfo за cursor-based
  }

  if (process.client && (window as any).debugPagination) {
    console.log('🔗 Next page logic:', {
      realProductCount: !!realProductCount,
      currentPage: currentSeoMeta.pageNumber,
      totalPages,
      calculation: `${currentSeoMeta.pageNumber} < ${totalPages} = ${currentSeoMeta.pageNumber < totalPages}`,
      pageInfoHasNext: pageInfo?.hasNextPage,
      finalHasNextPage: hasNextPage,
    });
  }

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedCategoryLinks.push({ rel: 'next', href: nextUrl });
    if (process.client && (window as any).debugPagination) {
      console.log('✅ Adding rel=next:', nextUrl);
    }
  } else {
    if (process.client && (window as any).debugPagination) {
      console.log('❌ NO rel=next - on last page!');
    }
  }

  // Добавяме canonical URL за текущата страница
  updatedCategoryLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  if (process.client && (window as any).debugPagination) {
    console.log(
      '🔗 Final links array:',
      updatedCategoryLinks.map((link) => `${link.rel}: ${link.href}`),
    );
  }

  // Обновяваме reactive ref вместо извикване на useHead()
  headLinks.value = updatedCategoryLinks;

  if (process.client && (window as any).debugPagination) {
    console.log(
      '🔗 headLinks.value updated:',
      headLinks.value.map((link) => `${link.rel}: ${link.href}`),
    );
  }
};

// Функция за извличане на параметри от route (точно като в /magazin)
const extractRouteParams = () => {
  let slug = '';
  let pageNumber = 1;

  // Първо извличаме slug от правилния параметър
  if (route.params.slug) {
    slug = String(route.params.slug);
  } else if (route.params.categorySlug) {
    slug = String(route.params.categorySlug);
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
const updateCategorySeoMeta = () => {
  const newSeoMeta = generateCategorySeoMeta();

  useSeoMeta({
    title: newSeoMeta.title,
    description: newSeoMeta.description,
    keywords: () => (matchingCategoryRef.value || matchingCategory)?.seo?.metaKeywords,
    ogTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphTitle || newSeoMeta.title,
    ogDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphDescription || newSeoMeta.description,
    ogUrl: newSeoMeta.canonicalUrl,
    twitterTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterTitle || newSeoMeta.title,
    twitterDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterDescription || newSeoMeta.description,
  });

  // Обновяваме и rel=prev/next links при навигация
  updateCategoryNextPrevLinks();
};

// Race condition protection (точно като в /magazin)
let isNavigating = false;

// Проследяване на предишни query параметри за умно redirect управление
let previousQuery = ref({
  orderby: null as string | null,
  order: null as string | null,
  filter: null as string | null,
});

// ⚡ ОПТИМИЗАЦИЯ 5: Функция за парсене на филтри (както в magazin.vue)
const parseFiltersFromQuery = (filterQuery: string) => {
  const filters: any = {};
  const runtimeConfig = useRuntimeConfig();

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

  // ⚡ КРИТИЧНО: Добавяме и атрибутните филтри (ТОЧНО като в magazin.vue)
  const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as any[]) || [];
  globalProductAttributes.forEach((attr) => {
    const attributeValues = getFilterValues(attr.slug);
    if (attributeValues.length > 0) {
      filters[attr.slug] = attributeValues;
    }
  });

  return filters;
};

// Основна функция за зареждане на продукти (СИЛНО ОПТИМИЗИРАНА)
const loadCategoryProducts = async () => {
  try {
    const { slug, pageNumber } = extractRouteParams();

    if (!slug) {
      resetProductsState();
      currentSlug.value = '';
      hasEverLoaded.value = true;
      return;
    }

    // ВАЖНО: Запазваме pageNumber преди reset за да не го загубим
    const targetPageNumber = pageNumber;

    // ⚡ КРИТИЧНО: Сетваме isLoading ПРЕДИ reset за да се покаже skeleton!
    isLoading.value = true;
    resetProductsState();
    currentSlug.value = slug;
    currentPageNumber.value = targetPageNumber;

    // КРИТИЧНО: Проверяваме за невалидни страници ПРЕДИ зареждане (като в magazin.vue)
    if (pageNumber > 1 && process.client && !route.query.filter) {
      // БЕЗ филтри - проверяваме спрямо броя продукти в категорията
      const totalProducts = realProductCount || matchingCategory?.count || 0;
      if (totalProducts > 0) {
        const maxPages = Math.ceil(totalProducts / productsPerPage.value);
        if (pageNumber > maxPages) {
          throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува в тази категория. Максимална страница: ${maxPages}` });
        }
      }
    }

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    // ⚡ КРИТИЧНО: Използваме локалния slug, не глобалната константа!
    const categoryIdentifier = [slug];

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

      // КРИТИЧНО: Добавяме attributeFilter (ТОЧНО КАТО В /magazin)
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

      // ПОПРАВЕНО: Използваме categoryIdentifier вместо [slug]
      if (pageNumber === 1) {
        await loadProductsPageOptimized(pageNumber, categoryIdentifier, graphqlOrderBy, { ...filters, attributeFilter: attributeFilters });
      } else {
        await jumpToPageOptimized(pageNumber, categoryIdentifier, graphqlOrderBy, { ...filters, attributeFilter: attributeFilters });
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
        await loadProductsPageOptimized(pageNumber, categoryIdentifier);
      } else {
        await jumpToPageOptimized(pageNumber, categoryIdentifier);
      }

      // КРИТИЧНО: Проверяваме дали получихме резултати БЕЗ филтри
      if (process.client && pageNumber > 1 && (!products.value || products.value.length === 0)) {
        // Зареждаме count за точно съобщение
        const maxPages = realProductCount ? Math.ceil(realProductCount / productsPerPage.value) : 1;
        throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува. Максимална страница: ${maxPages}` });
      }

      // Reset category count
      filteredCategoryCount.value = null;
    }

    // ⚡ КРИТИЧНО: Маркираме че сме зареждали данни ВИНАГИ след успешна заявка
    // (дори ако няма продукти - за да може да се покаже "Няма намерени продукти")
    hasEverLoaded.value = true;

    // Принудително обновяване на currentPage за правилна синхронизация с pagination
    currentPage.value = targetPageNumber;

    // Обновяваме next/prev links след зареждане на данните
    await nextTick();
    updateCategoryNextPrevLinks();

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    console.error('loadCategoryProducts error:', error);
    // НЕ сетваме hasEverLoaded = true при грешка, за да не показваме "Няма намерени продукти"
  }
};

// ⚡ ФАЗА 1.2 + 1.3: ОПТИМИЗИРАН onMounted с async category loading
onMounted(async () => {
  // Инициализираме предишните query стойности (синхронно - бързо)
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ⚡ КРИТИЧНО: При client-side проверяваме дали имаме валидни category data!
  // При hard refresh или нова категория, зареждаме данните
  if (process.client) {
    // ИЗВЛИЧАМЕ актуалния slug от route-а (не използваме top-level константа!)
    const actualSlug = route.params.slug ? decodeURIComponent(String(route.params.slug)) : (route.params.categorySlug ? decodeURIComponent(String(route.params.categorySlug)) : '');
    
    // ТОЧНО КАТО В CHILD.VUE: Проверяваме дали трябва да refresh-нем данните
    const needsRefresh = !matchingCategory || matchingCategory.slug !== actualSlug;
    
    if (needsRefresh) {
      try {
        // ПАРАЛЕЛНО зареждане на category data И product count (като в child.vue)
        const [categoryData, productsCountData] = await Promise.all([
          useAsyncGql('getProductCategories', { slug: [actualSlug], hideEmpty: false, first: 10 }),
          useAsyncGql('getProductsCount', { slug: [actualSlug] }),
        ]);

        if (categoryData.data.value?.productCategories?.nodes?.[0]) {
          matchingCategory = categoryData.data.value.productCategories.nodes[0] as Category;
          matchingCategoryRef.value = matchingCategory;
        } else {
          throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
        }

        // Получаваме точния брой продукти (като в child.vue)
        if (productsCountData.data.value?.products?.edges) {
          realProductCount = productsCountData.data.value.products.edges.length;
        }

        // Кешираме данните
        setCachedCategoryData(matchingCategory, realProductCount);
      } catch (error) {
        console.error('Failed to load category:', error);
        throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
      }
    } else {
      // Използваме съществуващите данни
      matchingCategoryRef.value = matchingCategory;
    }
  }

  // ⚡ КРИТИЧНО: При филтри ТРЯБВА да await-нем за да избегнем race conditions
  // БЕЗ филтри - паралелизираме за по-бързо зареждане
  const hasFilters = route.query.filter || route.query.orderby;
  
  if (hasFilters) {
    // При филтри ВИНАГИ презареждаме И ЧАКАМЕ, защото SSR не може да ги обработи правилно
    hasEverLoaded.value = false;
    await loadCategoryProducts();
  } else if (products.value.length === 0 || !hasEverLoaded.value) {
    // БЕЗ филтри - зареждаме паралелно (Filters компонентът ще зареди своите данни паралелно)
    loadCategoryProducts().catch((error) => {
      console.error('❌ Грешка при зареждане на продукти:', error);
    });
  }

  // ⚡ ОПТИМИЗАЦИЯ: Премахнато cache warming - използваме built-in count от GraphQL!

  // ⚡ ОПТИМИЗАЦИЯ: SEO links се обновяват в следващия tick БЕЗ blocking
  nextTick(() => {
    updateCategoryNextPrevLinks();
  });
});

// ⚠️ ВАЖНО: Зареждаме продукти на SSR САМО ако няма филтри в URL-а!
// При SSR в Nuxt 3, route.query е празен, което води до грешни резултати при филтри
if (process.server) {
  const event = useRequestEvent();
  const url = event?.node?.req?.url || '';
  const hasQueryParams = url.includes('?');
  
  if (!hasQueryParams) {
    await loadCategoryProducts();
  }
}

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.1: SMART UNIFIED ROUTE WATCHER с DEBOUNCE
// Вместо 3 отделни watchers (fullPath, path, query) - 1 оптимизиран watcher
// Намалява броя на re-renders и елиминира race conditions

let navigationDebounceTimer: NodeJS.Timeout | null = null;
// isNavigating вече е дефиниран по-горе (ред 428) и се използва и от loadCategoryProducts

// Unified watcher който обработва всички route промени
watch(
  () => route.fullPath,
  async (newFullPath, oldFullPath) => {
    if (!process.client) return;

    // Проверяваме дали наистина има промяна
    if (newFullPath === oldFullPath) return;

    // Debounce за да избегнем множество едновременни заявки
    if (navigationDebounceTimer) {
      clearTimeout(navigationDebounceTimer);
    }

    navigationDebounceTimer = setTimeout(async () => {
      // ⚡ ВАЖНО: Поставяме флага в началото на timeout-а
      isNavigating = true;

      try {
        // Проверяваме дали има промяна в query параметрите (філтри/сортиране)
        const newOrderBy = route.query.orderby as string | null;
        const newOrder = route.query.order as string | null;
        const newFilter = route.query.filter as string | null;

        const sortingOrFilteringChanged =
          newOrderBy !== previousQuery.value.orderby || newOrder !== previousQuery.value.order || newFilter !== previousQuery.value.filter;

        // Redirect към страница 1 ако променяме філтри/сортиране на страница > 1
        if (sortingOrFilteringChanged && route.params.pageNumber) {
          const currentPageNumber = parseInt(String(route.params.pageNumber) || '1');

          if (currentPageNumber > 1) {
            const queryParams = new URLSearchParams();
            if (newOrderBy) queryParams.set('orderby', newOrderBy);
            if (newOrder) queryParams.set('order', newOrder);
            if (newFilter) queryParams.set('filter', newFilter);

            const queryString = queryParams.toString();
            const newUrl = `/produkt-kategoriya/${slug}${queryString ? `?${queryString}` : ''}`;

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

        // Зареждаме продуктите
        hasEverLoaded.value = false;
        await loadCategoryProducts();
      } finally {
        isNavigating = false;
        navigationDebounceTimer = null;
      }
    }, 100); // 100ms debounce - достатъчен за да избегнем race conditions
  },
  { deep: true },
);

// Watcher за промени в pageInfo за динамично обновяване на next/prev links
watch(
  () => pageInfo,
  () => {
    if (process.client) {
      updateCategoryNextPrevLinks();
    }
  },
  { deep: true },
);

// Watcher за филтри - актуализира правилния count при промяна на филтрите (взет от magazin.vue)
// ⚡ ОПТИМИЗАЦИЯ: Debounce за да избегнем race condition с loadCategoryProducts
let filterCountDebounceTimer: NodeJS.Timeout | null = null;
watch(
  () => route.query.filter,
  async (newFilter) => {
    if (!process.client) return;

    // Чистим предишния timer
    if (filterCountDebounceTimer) {
      clearTimeout(filterCountDebounceTimer);
    }

    // ⚡ КРИТИЧНО: Изчакваме loadCategoryProducts() да завърши преди да зареждаме count
    filterCountDebounceTimer = setTimeout(async () => {
      if (newFilter) {
        // Зареждаме count САМО ако не сме в процес на navigation
        if (!isNavigating) {
          const filters = parseFiltersFromQuery(newFilter as string);
          await loadCategoryCount(filters);
        }
      } else {
        // Когато няма филтри, нулираме filtered count
        filteredCategoryCount.value = null;
      }
    }, 150); // 150ms debounce - изчакваме loadCategoryProducts да стартира
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

// Computed за правилен count за pagination - същата логика като в magazin.vue
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
      filters.maxPrice !== undefined ||
      Object.keys(filters).some((key) => key.startsWith('pa_'));

    if (hasAnyFilters) {
      // При всякакви филтри използваме филтрирания count
      return filteredCategoryCount.value;
    }
  }

  // Без филтри използваме оригиналния count от категорията
  return realProductCount || matchingCategory?.count;
});

// ⚡ ОПТИМИЗАЦИЯ 7: Функция за зареждане на filtered count при всякакви филтри (СУПЕР ОПТИМИЗИРАНА)
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
    filters.maxPrice !== undefined ||
    Object.keys(filters).some((key) => key.startsWith('pa_'));

  if (hasAnyFilters) {
    try {
      // ⚡ СУПЕР БЪРЗО: Използваме getProductsCount вместо getProducts!
      const variables: any = {
        slug: [slug], // Категория филтър
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
        filteredCategoryCount.value = data.value.products.edges.length;
      } else {
        filteredCategoryCount.value = null;
      }
    } catch (error) {
      filteredCategoryCount.value = null;
    }
  } else {
    filteredCategoryCount.value = null;
  }
};
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <!-- Основен layout -->
    <div :key="currentSlug || 'no-category'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="hidden lg:block lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" :category-slug="currentSlug" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentSlug" class="flex-1 min-w-0">
        <!-- Breadcrumb навигация -->
        <nav v-if="matchingCategoryRef">
          <!-- Мобилна версия: скрита на desktop -->
          <div class="flex md:hidden text-xs leading-tight text-gray-400 gap-1.5 items-center py-2 mb-3">
            <NuxtLink to="/" class="hover:text-primary shrink-0" aria-label="Начало" title="Начало">
              <Icon name="ion:home" size="14" class="text-gray-400" aria-hidden="true" />
            </NuxtLink>
            <span class="shrink-0">/</span>
            <NuxtLink to="/magazin" class="hover:text-primary shrink-0 line-clamp-1" title="Магазин">
              Магазин
            </NuxtLink>
            <span class="shrink-0 mx-0.5">/</span>
            <span class="text-gray-800 font-medium line-clamp-2 leading-relaxed" :title="matchingCategoryRef.name">
              {{ matchingCategoryRef.name }}
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
                <span class="text-gray-900 font-medium">{{ matchingCategoryRef.name }}</span>
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
          <h1 v-if="matchingCategoryRef?.name && currentPageNumber === 1" class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {{ matchingCategoryRef.name }}
          </h1>

          <!-- Първо описание над продуктите (под H1) -->
          <TopTaxonomyDescription
            v-if="matchingCategoryRef?.description && currentPageNumber === 1"
            :description="matchingCategoryRef.description"
            :name="matchingCategoryRef.name"
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

          <!-- Секция с подкатегории - показва се само ако има children и сме на първа страница без филтри -->
          <SubcategoriesSection
            v-if="matchingCategoryRef?.children?.nodes?.length && currentPageNumber === 1 && !route.query.filter"
            :category="matchingCategoryRef" />

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer :category-count="categoryCount" />

          <!-- Второ описание под продуктите -->
          <SecondTaxonomyDescription
            v-if="matchingCategoryRef?.seconddesc"
            :description="matchingCategoryRef.seconddesc"
            :name="matchingCategoryRef.name"
            :max-height="200" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Няма намерени продукти в тази категория. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

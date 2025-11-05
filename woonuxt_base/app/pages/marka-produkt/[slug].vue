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

interface Brand {
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  count?: number | null;
  databaseId?: number | null;
}

// ПОПРАВКА: Използваме правилния параметър и декодираме URL-а
const routeSlug = route.params.brandSlug || route.params.slug; // Първо опитваме brandSlug, после slug
const decodedSlug = routeSlug ? decodeURIComponent(String(routeSlug)) : '';
const slug = decodedSlug;

// ⚡ КРИТИЧНО: Инициализираме currentSlug СЪС SLUG от URL-а за да се рендира при SSR!
const currentSlug = ref(slug);
const currentPageNumber = ref(1);

// Премахнахме кеширането за по-надеждно зареждане

// ⚡ ОПРОСТЕНО: Използваме count от GraphQL отговора
let matchingBrand: Brand | null = null;
const realProductCount = ref<number | null>(null);

// ⚡ ВАЖНО: При SSR зареждаме brand data синхронно
if (process.server) {
  console.log('🔥 BRAND DEBUG: Searching for brand with slug:', slug);

  // Минимална заявка за намиране на марката с точен count
  const { data: allProductsData } = await useAsyncGql(
  'getProducts' as any,
  {
    first: 50, // Намалено - трябва ни само един продукт от марката
    orderby: 'DATE',
    order: 'DESC',
    search: slug, // Търсим директно по slug
  } as any,
);

console.log('🔥 BRAND DEBUG: Initial products search returned:', allProductsData.value?.products?.nodes?.length || 0, 'products');

// Намираме марката от първия продукт и използваме count от GraphQL
if (allProductsData.value?.products?.nodes) {
  const products = allProductsData.value.products.nodes;
  console.log('🔥 BRAND DEBUG: Searching through', products.length, 'products for brand');

  // Намираме първия продукт с марка която съответства на slug-а
  for (const product of products) {
    if (product?.pwbBrands && product.pwbBrands.length > 0) {
      for (const brand of product.pwbBrands) {
        const brandSlug = brand.slug?.toLowerCase();
        const searchSlug = slug.toLowerCase();

        console.log('🔥 BRAND DEBUG: Comparing brandSlug:', brandSlug, 'with searchSlug:', searchSlug);

        // Exact match или partial match
        if (brandSlug === searchSlug || brandSlug?.includes(searchSlug) || searchSlug?.includes(brandSlug || '')) {
          matchingBrand = {
            slug: brand.slug,
            name: brand.name,
            description: brand.description,
            count: brand.count, // ⚡ ИЗПОЛЗВАМЕ ДИРЕКТНО COUNT ОТ GraphQL!
            databaseId: brand.databaseId,
          };

          // ⚡ ДИРЕКТНО ИЗПОЛЗВАМЕ COUNT ОТ GraphQL
          realProductCount.value = brand.count || 0;

          console.log('🔥 BRAND DEBUG: Found matching brand with exact count:', matchingBrand);
          console.log('🔥 BRAND DEBUG: Set realProductCount from GraphQL to:', realProductCount.value);
          break;
        }
      }
      if (matchingBrand) break; // Излизаме от външния цикъл ако сме намерили марката
    }
  }
}

// FALLBACK: Ако не намерихме марката от първата заявка, опитваме с по-голяма
if (!matchingBrand) {
  try {
    const { data: fallbackData } = await useAsyncGql('getProducts' as any, {
      first: 200, // Намалено - не трябва да зареждаме много
      orderby: 'DATE',
      order: 'DESC',
    });

    if (fallbackData.value?.products?.nodes) {
      const fallbackProducts = fallbackData.value.products.nodes;

      for (const product of fallbackProducts) {
        if (product?.pwbBrands && product.pwbBrands.length > 0) {
          for (const brand of product.pwbBrands) {
            const brandSlug = brand.slug?.toLowerCase();
            const searchSlug = slug.toLowerCase();

            if (brandSlug === searchSlug || brandSlug?.includes(searchSlug) || searchSlug?.includes(brandSlug || '')) {
              matchingBrand = {
                slug: brand.slug,
                name: brand.name,
                description: brand.description,
                count: brand.count, // ⚡ ИЗПОЛЗВАМЕ ДИРЕКТНО COUNT ОТ GraphQL!
                databaseId: brand.databaseId,
              };

              // ⚡ ДИРЕКТНО ИЗПОЛЗВАМЕ COUNT ОТ GraphQL
              realProductCount.value = brand.count || 0;

              console.log('🔥 BRAND DEBUG: Found brand in fallback with exact count:', realProductCount.value);
              break;
            }
          }
          if (matchingBrand) break;
        }
      }
    }
  } catch (error) {
    console.error('Fallback search failed:', error);
  }
}

  // Ако все още няма марка
  if (!matchingBrand) {
    throw showError({ statusCode: 404, statusMessage: 'Марката не е намерена' });
  }

  // ⚡ КРИТИЧНО: Получаваме ТОЧНИЯ брой продукти с ЛЕКА заявка (само cursor-и, БЕЗ nodes!)
  try {
    const { data: productsCountData } = await useAsyncGql('getProductsCount', {
      search: slug,
      first: 2000, // Достатъчно голям за повечето марки
    });

    if (productsCountData.value?.products?.edges) {
      const actualCount = productsCountData.value.products.edges.length;
      console.log('🔥 BRAND DEBUG: SSR REAL count from getProductsCount:', actualCount);
      console.log('🔥 BRAND DEBUG: SSR OLD count from brand.count:', realProductCount.value);
      
      // Презаписваме с точния count
      realProductCount.value = actualCount;
      
      console.log('🔥 BRAND DEBUG: SSR FINAL realProductCount.value:', realProductCount.value);
    } else {
      console.log('🔥 BRAND DEBUG: SSR getProductsCount returned no data, keeping brand.count:', realProductCount.value);
    }
  } catch (error) {
    console.error('❌ BRAND DEBUG: SSR getProductsCount failed, keeping brand.count:', error);
  }
}

// Reactive ref за runtime промени
const matchingBrandRef = ref<Brand | null>(matchingBrand);

// Ref за филтриран count при филтриране
const filteredBrandCount = ref<number | null>(null);

// ⚡ ПРЕМАХНАТА: Не е нужна тъй като имаме точен count от GraphQL!

// Функция за генериране на SEO данни според страницата
const generateBrandSeoMeta = () => {
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

  // Използваме марката данни като база (reactive ref за динамични обновления)
  const brand = matchingBrandRef.value || matchingBrand;
  const baseTitle = brand?.name ? `Марка: ${brand.name}` : 'Марка';
  const baseDescription = brand?.description || `Продукти от марка ${brand?.name}`;

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://leaderfitness.net'}/marka-produkt/${slug}`
      : `${frontEndUrl || 'https://leaderfitness.net'}/marka-produkt/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме SEO метаданните (статични за SSR, реактивни за client)
// ⚡ КРИТИЧНО: За SSR генерираме ВЕДНЪЖ, за client използваме computed
const ssrBrandSeoMeta = generateBrandSeoMeta();
const initialBrandSeoMeta = computed(() => generateBrandSeoMeta());

useSeoMeta({
  title: () => initialBrandSeoMeta.value.title,
  description: () => initialBrandSeoMeta.value.description,
  ogTitle: () => initialBrandSeoMeta.value.title,
  ogDescription: () => initialBrandSeoMeta.value.description,
  ogType: 'website',
  ogUrl: () => initialBrandSeoMeta.value.canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: () => initialBrandSeoMeta.value.title,
  twitterDescription: () => initialBrandSeoMeta.value.description,
  robots: 'index, follow',
});

// Reactive refs за SEO links (използваме SSR стойност за initial render)
const headLinks = ref([{ rel: 'canonical', href: ssrBrandSeoMeta.canonicalUrl }]);

// ⚡ LCP ОПТИМИЗАЦИЯ: Helper за генериране на Vercel Image URL
const getVercelImageUrl = (originalUrl: string, width: number) => {
  // Vercel Image Optimization формат: /_vercel/image?url=ENCODED_URL&w=WIDTH&q=QUALITY
  // ВАЖНО: Vercel автоматично използва q=50 за малки размери (320px) и q=80 за големи
  const encodedUrl = encodeURIComponent(originalUrl);
  const quality = width <= 320 ? 50 : 80; // Adaptive quality (като NuxtImg)
  return `/_vercel/image?url=${encodedUrl}&w=${width}&q=${quality}`;
};

// ⚡ LCP ОПТИМИЗАЦИЯ: Preload първите 3 продуктни снимки (за по-бърз LCP)
const preloadImages = computed(() => {
  const links: any[] = [];
  
  // Вземаме първите 3 продукта (само на SSR за да са в initial HTML)
  if (process.server && products.value?.length) {
    const firstProducts = products.value.slice(0, 3);
    
    firstProducts.forEach((product: any, index: number) => {
      const imageUrl = product?.image?.producCardSourceUrl || product?.image?.sourceUrl;
      
      if (imageUrl) {
        // Генерираме Vercel Image URLs за различни резолюции (като NuxtImg)
        const img320 = getVercelImageUrl(imageUrl, 320); // За 140w физически
        const img640 = getVercelImageUrl(imageUrl, 640); // За 280w физически и 2x DPI
        
        links.push({
          rel: 'preload',
          as: 'image',
          href: img640, // Основен URL (desktop размер)
          fetchpriority: index === 0 ? 'high' : 'auto', // Само първата снимка е high priority
          crossOrigin: 'anonymous', // ВАЖНО: Nuxt изисква camelCase! (не 'crossorigin')
          // imagesrcset с Vercel URLs (като в NuxtImg резултата)
          imagesrcset: `${img320} 140w, ${img320} 280w, ${img640} 560w`,
          imagesizes: '(max-width: 768px) 140px, 280px',
        });
      }
    });
  }
  
  return links;
});

useHead({
  link: computed(() => [...headLinks.value, ...preloadImages.value]),
});

// Cache за да не извикваме функцията твърде често
let lastLinksUpdate = '';

// Функция за динамично обновяване на next/prev links с точен брой продукти
const updateBrandNextPrevLinks = () => {
  const currentSeoMeta = generateBrandSeoMeta();
  const updatedBrandLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount.value || matchingBrand?.count || 0;
  const totalPages = Math.ceil(totalProductCount / productsPerPage.value);
  
  // 🐛 DEBUG: Проверяваме защо винаги показва 12 страници
  console.log('🔍 PAGINATION DEBUG:', {
    realProductCount: realProductCount.value,
    matchingBrandCount: matchingBrand?.count,
    totalProductCount,
    productsPerPage: productsPerPage.value,
    totalPages,
    currentPage: currentSeoMeta.pageNumber,
  });

  // Prev link
  if (currentSeoMeta.pageNumber > 1) {
    const prevUrl =
      currentSeoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://leaderfitness.net'}/marka-produkt/${slug}`
        : `${frontEndUrl || 'https://leaderfitness.net'}/marka-produkt/${slug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedBrandLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link - използваме точното изчисление на база реалния брой продукти
  let hasNextPage = false;

  // При филтри разчитаме на pageInfo
  const hasFilters = route.query.filter;
  if (hasFilters) {
    hasNextPage = pageInfo?.hasNextPage || false;
  } else {
    // БЕЗ филтри - използваме точния брой продукти
    hasNextPage = realProductCount.value ? currentSeoMeta.pageNumber < totalPages : pageInfo?.hasNextPage;
  }

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://leaderfitness.net'}/marka-produkt/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedBrandLinks.push({ rel: 'next', href: nextUrl });
  }

  // Canonical link винаги се обновява
  updatedBrandLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  // КРИТИЧНО: Проверяваме дали има промяна преди обновяване
  const newLinksStr = JSON.stringify(updatedBrandLinks);
  if (newLinksStr !== lastLinksUpdate) {
    headLinks.value = updatedBrandLinks;
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
  } else if (route.params.brandSlug) {
    slug = String(route.params.brandSlug);
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

// ⚡ ПРЕМАХНАТО: updateBrandSeoMeta() - вече не е нужна!
// Reactive computed brandSeoMeta автоматично се обновява когато matchingBrandRef се промени.

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

// Основна функция за зареждане на продукти (КОПИРАНО ОТ ЕТИКЕТИТЕ - СЪЩАТА ЛОГИКА!)
const loadBrandProducts = async () => {
  console.log('🔥 BRAND DEBUG: Starting loadBrandProducts');

  if (isNavigating) {
    console.log('🔥 BRAND DEBUG: Already navigating, skipping');
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
      const totalProducts = realProductCount.value || matchingBrand?.count || 0;
      if (totalProducts > 0) {
        const maxPages = Math.ceil(totalProducts / productsPerPage.value);
        if (pageNumber > maxPages) {
          // ⚡ REDIRECT към последна валидна страница вместо 404 за да избегнем infinite loop
          console.warn(`⚠️ Page ${pageNumber} exceeds max ${maxPages}, redirecting to page ${maxPages}`);
          await navigateTo(`/marka-produkt/${slug}/page/${maxPages}`, { replace: true });
          return;
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

      console.log('🔥 BRAND DEBUG: Has filters or orderBy:', { hasFilters, hasOrderBy, filters, graphqlOrderBy });

      // BACK TO SEARCH: Добавяме search по марка към филтрите (но с DEBUG)
      if (matchingBrand?.name) {
        console.log('🔥 BRAND DEBUG: Adding brand search filter:', matchingBrand.name);

        // Ако има search в филтрите, комбинираме го с марката
        if (filters.search && !filters.search.includes(matchingBrand.name)) {
          filters.search = `${filters.search} ${matchingBrand.name}`;
        } else {
          filters.search = matchingBrand.name;
        }

        console.log('🔥 BRAND DEBUG: Final search filter:', filters.search);
      }

      // КРИТИЧНО: Правилна логика за cursor-based пагинация (КОПИРАНО ОТ ЕТИКЕТИТЕ)
      if (pageNumber > 1) {
        console.log('🔥 BRAND DEBUG: Jump to page:', pageNumber, 'with filters:', filters);

        await jumpToPageOptimized(pageNumber, [], graphqlOrderBy, filters);

        console.log('🔥 BRAND DEBUG: After jumpToPageOptimized, products:', products.value?.length);

        if (process.client && Object.keys(filters).length > 1 && (!products.value || products.value.length === 0)) {
          throw showError({ statusCode: 404, statusMessage: `Страница ${pageNumber} не съществува с тези филтри в марката` });
        }
      } else {
        console.log('🔥 BRAND DEBUG: Load page 1 with filters:', filters);

        await loadProductsPageOptimized(pageNumber, [], graphqlOrderBy, filters);

        console.log('🔥 BRAND DEBUG: After loadProductsPageOptimized, products:', products.value?.length);
      }

      // КРИТИЧНО: Зареждаме filtered count при филтриране
      if (process.client && Object.keys(filters).length > 1) {
        // > 1 защото винаги има search
        await loadBrandCount(filters);
      }
    } else {
      console.log('🔥 BRAND DEBUG: No filters - using search approach');

      // BACK TO SEARCH: Използваме search подхода ТОЧНО като етикетите
      const brandFilters = { search: matchingBrand?.name || '' };

      console.log('🔥 BRAND DEBUG: Brand filters for no-filters case:', brandFilters);

      if (pageNumber > 1) {
        console.log('🔥 BRAND DEBUG: Jump to page (no filters):', pageNumber, 'with brandFilters:', brandFilters);

        await jumpToPageOptimized(pageNumber, [], 'DATE', brandFilters);

        console.log('🔥 BRAND DEBUG: After jumpToPageOptimized (no filters), products:', products.value?.length);

        if (process.client && (!products.value || products.value.length === 0)) {
          const totalProducts = realProductCount.value || matchingBrand?.count || 0;
          const maxPages = totalProducts > 0 ? Math.ceil(totalProducts / productsPerPage.value) : 1;
          console.log('🔥 BRAND DEBUG: No products found, total:', totalProducts, 'maxPages:', maxPages);
          // ⚡ REDIRECT към последна валидна страница вместо 404
          console.warn(`⚠️ Page ${pageNumber} has no products, redirecting to page ${maxPages}`);
          await navigateTo(`/marka-produkt/${slug}/page/${maxPages}`, { replace: true });
          return;
        }
      } else {
        console.log('🔥 BRAND DEBUG: Load page 1 (no filters) with brandFilters:', brandFilters);

        await loadProductsPageOptimized(pageNumber, [], 'DATE', brandFilters);

        console.log('🔥 BRAND DEBUG: After loadProductsPageOptimized (no filters), products:', products.value?.length);
      }

      // Reset brand count
      filteredBrandCount.value = null;
    }

    hasEverLoaded.value = true;
    currentPage.value = targetPageNumber;

    // ⚡ ОПТИМИЗАЦИЯ: Обновяваме next/prev links БЕЗ await (не блокира)
    nextTick(() => updateBrandNextPrevLinks());
  } catch (error) {
    hasEverLoaded.value = true;
  } finally {
    isNavigating = false;
  }
};

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.3: ПАРАЛЕЛИЗИРАН onMounted
onMounted(async () => {
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ⚡ КРИТИЧНО: При client-side навигация ВИНАГИ зареждаме актуални brand data!
  if (process.client) {
    // Проверяваме дали трябва да refresh-нем данните (нова марка или няма кеш)
    const needsRefresh = !matchingBrand || matchingBrand.slug?.toLowerCase() !== slug.toLowerCase();
    
    if (needsRefresh) {
      console.log('🔥 BRAND DEBUG: Loading brand data on client (no cache or different brand)...');
      try {
        const { data: allProductsData } = await useAsyncGql(
          'getProducts' as any,
          {
            first: 50,
            orderby: 'DATE',
            order: 'DESC',
            search: slug,
          } as any,
        );

        if (allProductsData.value?.products?.nodes) {
          const products = allProductsData.value.products.nodes;
          for (const product of products) {
            if (product?.pwbBrands && product.pwbBrands.length > 0) {
              for (const brand of product.pwbBrands) {
                const brandSlug = brand.slug?.toLowerCase();
                if (brandSlug === slug.toLowerCase() || brandSlug?.includes(slug.toLowerCase())) {
                  matchingBrand = {
                    slug: brand.slug,
                    name: brand.name,
                    description: brand.description,
                    count: brand.count,
                    databaseId: brand.databaseId,
                  };
                  realProductCount.value = brand.count || 0;
                  matchingBrandRef.value = matchingBrand;
                  break;
                }
              }
            }
            if (matchingBrand) break;
          }
        }

        if (!matchingBrand) {
          throw showError({ statusCode: 404, statusMessage: 'Марката не е намерена' });
        }

        // ⚡ КРИТИЧНО: Получаваме ТОЧНИЯ брой продукти с ЛЕКА заявка
        try {
          const { data: productsCountData } = await useAsyncGql('getProductsCount', {
            search: slug,
            first: 2000,
          });

          if (productsCountData.value?.products?.edges) {
            const actualCount = productsCountData.value.products.edges.length;
            console.log('🔥 BRAND DEBUG: Client REAL count from getProductsCount:', actualCount);
            realProductCount.value = actualCount;
        }
      } catch (error) {
        console.error('❌ BRAND DEBUG: Client getProductsCount failed, keeping brand.count:', error);
      }
    } catch (error) {
      console.error('Failed to load brand:', error);
      throw showError({ statusCode: 404, statusMessage: 'Марката не е намерена' });
    }
    } else {
      // Данните вече са налични от SSR или предишна навигация
      matchingBrandRef.value = matchingBrand;
    }
  }

  // ⚡ HYBRID: Ако има SSR продукти, зареждаме останалите
  const hasSSRProducts = products.value.length > 0 && products.value.length < productsPerPage.value;
  
  if (hasSSRProducts || products.value.length === 0) {
    await loadBrandProducts();
  }
  
  // ⚡ ОПТИМИЗАЦИЯ: SEO links се обновяват в следващия tick БЕЗ blocking
  nextTick(() => {
    updateBrandNextPrevLinks();
  });
});

// ⚡ HYBRID: SSR зарежда САМО първите 12 продукта (за LCP), останалите client-side
if (process.server) {
  try {
    const { data } = await useAsyncGql('getProductsOptimized', {
      first: 12,
      search: slug,
      orderby: 'DATE',
    });
    
    if (data.value?.products?.nodes) {
      products.value = data.value.products.nodes;
      pageInfo.hasNextPage = data.value.products.pageInfo?.hasNextPage || false;
      pageInfo.endCursor = data.value.products.pageInfo?.endCursor || '';
      hasEverLoaded.value = true;
    }
  } catch (error) {
    console.error('SSR product load failed:', error);
  }
}

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.1: SMART UNIFIED ROUTE WATCHER с DEBOUNCE
// Вместо 3 отделни watchers (fullPath, path, query) - 1 оптимизиран watcher
let brandNavigationDebounceTimer: NodeJS.Timeout | null = null;
let isBrandNavigating = false;

watch(
  () => ({
    path: route.path,
    query: route.query,
    fullPath: route.fullPath,
  }),
  async (newRoute, oldRoute) => {
    if (!process.client) return;
    if (newRoute.fullPath === oldRoute.fullPath) return;

    if (isBrandNavigating) {
      if (brandNavigationDebounceTimer) clearTimeout(brandNavigationDebounceTimer);
      brandNavigationDebounceTimer = null;
    }

    if (brandNavigationDebounceTimer) {
      clearTimeout(brandNavigationDebounceTimer);
    }

    brandNavigationDebounceTimer = setTimeout(async () => {
      if (isBrandNavigating) return;
      isBrandNavigating = true;

      try {
        // СЛУЧАЙ 1: Промяна в пътя (различна марка или страница)
        const pathChanged = newRoute.path !== oldRoute.path;

        if (pathChanged) {
          hasEverLoaded.value = false;
          await loadBrandProducts();
          // ⚡ ПРЕМАХНАТО: updateBrandSeoMeta() - reactive computed ще се обнови автоматично!
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
              const newUrl = `/marka-produkt/${slug}${queryString ? `?${queryString}` : ''}`;

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
          await loadBrandProducts();
        }
      } finally {
        isBrandNavigating = false;
        brandNavigationDebounceTimer = null;
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
      updateBrandNextPrevLinks();
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

      // Добавяме search по марка към филтрите
      const brandName = matchingBrand?.name;
      if (brandName) {
        if (filters.search && !filters.search.includes(brandName)) {
          filters.search = `${filters.search} ${brandName}`;
        } else {
          filters.search = brandName;
        }
      }

      await loadBrandCount(filters);
    } else if (process.client && !newFilter) {
      // Когато няма филтри, нулираме filtered count
      filteredBrandCount.value = null;
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
const brandCount = computed(() => {
  // Парсваме филтрите директно от URL за актуална проверка
  const hasFilters = route.query.filter;

  if (hasFilters) {
    const filters = parseFiltersFromQuery(route.query.filter as string);

    // Проверяваме за ВСИЧКИ типове филтри (без search защото той винаги е с марката)
    const hasAnyFilters =
      filters.onSale || (filters.search && filters.search !== matchingBrand?.name) || filters.minPrice !== undefined || filters.maxPrice !== undefined;

    if (hasAnyFilters) {
      // При всякакви филтри използваме филтрирания count
      return filteredBrandCount.value;
    }
  }

  // Без филтри използваме оригиналния count от марката
  return realProductCount.value || matchingBrand?.count;
});

// ⚡ ОПТИМИЗИРАНА: Функция за зареждане на filtered count (СЪЩАТА ЛОГИКА КАТО ЕТИКЕТИТЕ)
const loadBrandCount = async (filters: any) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    return;
  }

  // Проверяваме за всички типове филтри (без search защото той винаги е с марката)
  const hasAnyFilters =
    filters.onSale || (filters.search && filters.search !== matchingBrand?.name) || (filters.minPrice !== undefined && filters.maxPrice !== undefined);

  if (hasAnyFilters) {
    try {
      // ⚡ СУПЕР БЪРЗО: Използваме getProductsCount вместо getProducts!
      const variables: any = {
        search: filters.search || slug, // Search съдържа марката
        first: 2000, // Достатъчно за повечето случаи
      };

      // Добавяме всички филтри
      if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
      if (filters.onSale !== undefined) variables.onSale = filters.onSale;

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
        filteredBrandCount.value = data.value.products.edges.length;
      } else {
        filteredBrandCount.value = null;
      }
    } catch (error) {
      filteredBrandCount.value = null;
    }
  } else {
    filteredBrandCount.value = null;
  }
};
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <div :key="currentSlug || 'no-brand'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="hidden lg:block lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" :brand-slug="currentSlug" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentSlug" class="flex-1 min-w-0">
        <!-- Breadcrumb навигация -->
        <nav v-if="matchingBrandRef">
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
            <span class="text-gray-800 font-medium line-clamp-2 leading-relaxed" :title="`Марка: ${matchingBrandRef.name}`">
              Марка: {{ matchingBrandRef.name }}
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
                <span class="text-gray-900 font-medium">Марка: {{ matchingBrandRef.name }}</span>
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
          <PaginationServer :category-count="brandCount" />

          <!-- Описание на марката -->
          <TaxonomyDescription
            v-if="matchingBrandRef?.description"
            :description="matchingBrandRef.description"
            :name="matchingBrandRef.name"
            :max-height="200" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Няма намерени продукти от тази марка. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

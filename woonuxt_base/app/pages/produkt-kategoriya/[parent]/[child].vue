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
  productsPerPage,
  loadProductsPageOptimized,
  jumpToPageOptimized,
  currentPage,
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
  databaseId?: number | null;
  id?: string | null;
  count?: number | null;
  uri?: string | null;
  image?: {
    sourceUrl?: string | null;
    altText?: string | null;
    title?: string | null;
  } | null;
  parent?: {
    node?: {
      slug?: string | null;
      name?: string | null;
      databaseId?: number | null;
    } | null;
  } | null;
  children?: {
    nodes?: Category[] | null;
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

// КЛЮЧОВО: Зареждаме ДИРЕКТНО категорията по child slug (същия подход като single product)
const parentSlug = route.params.parent as string;
const childSlug = route.params.child as string;

// ⚡ КРИТИЧНО: Инициализираме slugs от URL-а за да се рендира при SSR!
const currentParentSlug = ref(parentSlug);
const currentChildSlug = ref(childSlug);
const currentPageNumber = ref(1);

// Ref за филтриран count при филтриране (трябва да е дефиниран ПРЕДИ loadCategoryProducts)
const filteredCategoryCount = ref<number | null>(null);

// ⚡ ОПТИМИЗАЦИЯ: Session Storage Cache за child категории
const CHILD_CATEGORY_CACHE_KEY = `woonuxt_child_category_${parentSlug}_${childSlug}`;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минути
const CACHE_VERSION = 'v1';

// Функции за кеширане
const getCachedChildCategoryData = (): { category: Category | null; parent: Category | null; count: number | null } | null => {
  if (!process.client) return null;

  try {
    const cached = sessionStorage.getItem(CHILD_CATEGORY_CACHE_KEY);
    if (!cached) return null;

    const { category, parent, count, timestamp, version } = JSON.parse(cached);
    const now = Date.now();

    if (version !== CACHE_VERSION || now - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CHILD_CATEGORY_CACHE_KEY);
      return null;
    }

    return { category, parent, count };
  } catch (error) {
    return null;
  }
};

const setCachedChildCategoryData = (category: Category, parent: Category | null, count: number): void => {
  if (!process.client) return;

  try {
    const cacheData = {
      category,
      parent,
      count,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    sessionStorage.setItem(CHILD_CATEGORY_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

let matchingCategory: Category | null = null;
let parentCategory: Category | null = null;
let realProductCount: number | null = null;

// ⚡ ВАЖНО: При SSR зареждаме category data синхронно
if (process.server) {
  const { data: categoryData } = await useAsyncGql('getProductCategories', { slug: [childSlug], hideEmpty: true });

  if (categoryData.value?.productCategories?.nodes?.[0]) {
    matchingCategory = categoryData.value.productCategories.nodes[0];

    // ⚡ ОПТИМИЗАЦИЯ: Използваме built-in count от GraphQL API (без излишна заявка!)
    // WooCommerce GraphQL API вече връща точен count - не е нужна отделна заявка
    realProductCount = matchingCategory.count || 0;

    // Ако има parent информация в данните
    if (matchingCategory.parent?.node) {
      parentCategory = matchingCategory.parent.node as Category;
    }
  }

  // Fallback ако няма категория
  if (!matchingCategory) {
    throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
  }

  // Schema.org CollectionPage markup
  useCollectionPageSchema({
    name: matchingCategory.name || '',
    description: matchingCategory.description || '',
    slug: matchingCategory.slug || '',
    parentSlug: parentCategory?.slug,
    image: matchingCategory.image?.sourceUrl,
    count: realProductCount || 0,
  });
} else {
  // ⚡ ОПТИМИЗАЦИЯ: При CLIENT - проверяваме кеша веднага (синхронно, БЕЗ await)
  const cachedData = getCachedChildCategoryData();
  if (cachedData) {
    matchingCategory = cachedData.category;
    parentCategory = cachedData.parent;
    realProductCount = cachedData.count;
  }
  // Ако няма кеш, ще заредим в onMounted БЕЗ да блокираме initial render
}

// Reactive refs за runtime промени
const matchingCategoryRef = ref<Category | null>(matchingCategory);
const parentCategoryRef = ref<Category | null>(parentCategory);

// Функция за генериране на SEO данни според страницата (взета от основната категория)
const generateChildCategorySeoMeta = () => {
  // ⚡ КРИТИЧНО: Извличаме актуалните slugs от route-а вместо top-level константи!
  const actualParentSlug = route.params.parent ? decodeURIComponent(String(route.params.parent)) : parentSlug;
  const actualChildSlug = route.params.child ? decodeURIComponent(String(route.params.child)) : childSlug;
  
  // Получаваме номера на страницата (проверяваме и params и query)
  let pageNumber = 1;

  // Първо проверяваме route.params.pageNumber (от URL структурата)
  if (route.params.pageNumber) {
    const parsedPage = parseInt(route.params.pageNumber as string);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNumber = parsedPage;
    }
  }
  // След това проверяваме route.query.page (от redirect-ите)
  else if (route.query.page) {
    const parsedPage = parseInt(route.query.page as string);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      pageNumber = parsedPage;
    }
  }

  // Използваме категорийните SEO данни като база
  const category = matchingCategoryRef.value || matchingCategory;
  const parent = parentCategoryRef.value || parentCategory;
  
  // ⚡ КРИТИЧНО: Проверяваме дали category съответства на актуалния slug!
  const isCategoryMatching = category?.slug === actualChildSlug;
  
  const baseTitle = isCategoryMatching && category?.seo?.title 
    ? category.seo.title 
    : isCategoryMatching && category?.name 
      ? `${category.name} | ${parent?.name || 'Категории'}`
      : `${actualChildSlug} | ${actualParentSlug}`;
      
  const baseDescription = isCategoryMatching && category?.seo?.metaDesc 
    ? category.seo.metaDesc 
    : isCategoryMatching && category?.description 
      ? category.description 
      : `Продукти в категория ${actualChildSlug}`;

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${actualParentSlug}/${actualChildSlug}`
      : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${actualParentSlug}/${actualChildSlug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме SEO метаданните (статични за SSR, реактивни за client)
// ⚡ КРИТИЧНО: За SSR генерираме ВЕДНЪЖ, за client използваме computed
const initialChildSeoMeta = generateChildCategorySeoMeta();
const childCategorySeoMeta = computed(() => {
  const seoMeta = generateChildCategorySeoMeta();
  // ⚡ КРИТИЧНО: Ако title е undefined, връщаме SSR данните
  return seoMeta.title && seoMeta.title !== 'undefined' ? seoMeta : initialChildSeoMeta;
});

useSeoMeta({
  title: () => childCategorySeoMeta.value.title || initialChildSeoMeta.title,
  description: () => childCategorySeoMeta.value.description || initialChildSeoMeta.description,
  keywords: () => (matchingCategoryRef.value || matchingCategory)?.seo?.metaKeywords,
  ogTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphTitle || childCategorySeoMeta.value.title || initialChildSeoMeta.title,
  ogDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphDescription || childCategorySeoMeta.value.description || initialChildSeoMeta.description,
  ogType: 'website',
  ogUrl: () => childCategorySeoMeta.value.canonicalUrl || initialChildSeoMeta.canonicalUrl,
  ogImage: () => (matchingCategoryRef.value || matchingCategory)?.seo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterTitle || childCategorySeoMeta.value.title || initialChildSeoMeta.title,
  twitterDescription: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterDescription || childCategorySeoMeta.value.description || initialChildSeoMeta.description,
  twitterImage: () => (matchingCategoryRef.value || matchingCategory)?.seo?.twitterImage?.sourceUrl,
  robots: () => (matchingCategoryRef.value || matchingCategory)?.seo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Reactive refs за SEO links (използваме SSR стойност за initial render)
const headLinks = ref([{ rel: 'canonical', href: initialChildSeoMeta.canonicalUrl }]);

useHead({
  link: headLinks,
});

// Schema markup от категорията ако е наличен
// ВАЖНО: Поправяме цените - заменяме запетая с точка (Schema.org изисква точка)
if (matchingCategory?.seo?.schema?.raw) {
  let schemaRaw = matchingCategory.seo.schema.raw;
  try {
    const schemaObj = JSON.parse(schemaRaw);
    const priceFields = ['price', 'lowPrice', 'highPrice'];
    const fixPrices = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const key in obj) {
        if (priceFields.includes(key) && typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(',', '.');
        } else if (typeof obj[key] === 'object') {
          fixPrices(obj[key]);
        }
      }
      return obj;
    };
    fixPrices(schemaObj);
    schemaRaw = JSON.stringify(schemaObj);
  } catch (e) {
    schemaRaw = schemaRaw
      .replace(/"price"\s*:\s*"(\d+),(\d+)"/g, '"price":"$1.$2"')
      .replace(/"lowPrice"\s*:\s*"(\d+),(\d+)"/g, '"lowPrice":"$1.$2"')
      .replace(/"highPrice"\s*:\s*"(\d+),(\d+)"/g, '"highPrice":"$1.$2"');
  }
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: schemaRaw,
      },
    ],
  });
}

// Cache за да не извикваме функцията твърде често (точно като в категориите)
let lastLinksUpdate = '';

// Функция за динамично обновяване на next/prev links с точен брой продукти (точно като в категориите)
const updateChildCategoryNextPrevLinks = () => {
  const currentSeoMeta = generateChildCategorySeoMeta(); // Генерираме динамичните SEO данни
  const updatedChildLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount || matchingCategory?.count || 0;
  const totalPages = Math.ceil(totalProductCount / productsPerPage.value);

  // Prev link
  if (currentSeoMeta.pageNumber > 1) {
    const prevUrl =
      currentSeoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${parentSlug}/${childSlug}`
        : `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedChildLinks.push({ rel: 'prev', href: prevUrl });
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

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://leaderfitness.net'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedChildLinks.push({ rel: 'next', href: nextUrl });
  }

  // Добавяме canonical URL за текущата страница
  updatedChildLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  // Обновяваме reactive ref вместо извикване на useHead() (точно като в категориите)
  headLinks.value = updatedChildLinks;
};

// Функция за извличане на параметри от route
const extractRouteParams = () => {
  let parentSlug = '';
  let childSlug = '';
  let pageNumber = 1;

  if (route.name === 'produkt-kategoriya-parent-child-pager') {
    // За пагинационния route
    if (route.params.parent) {
      parentSlug = String(route.params.parent);
    }
    if (route.params.child) {
      childSlug = String(route.params.child);
    }
    if (route.params.pageNumber) {
      const parsed = parseInt(String(route.params.pageNumber));
      if (!isNaN(parsed) && parsed > 0) {
        pageNumber = parsed;
      }
    }
  } else if (route.name === 'produkt-kategoriya-parent-child') {
    // За обикновения parent/child route
    if (route.params.parent) {
      parentSlug = String(route.params.parent);
    }
    if (route.params.child) {
      childSlug = String(route.params.child);
    }
  }

  // Проверяваме и query.page параметъра (от redirect-ите)
  if (route.query.page) {
    const parsed = parseInt(String(route.query.page));
    if (!isNaN(parsed) && parsed > 0) {
      pageNumber = parsed;
    }
  }

  return { parentSlug, childSlug, pageNumber };
};

// Race condition protection (точно като в родителските категории)
let isNavigating = false;

// Проследяване на предишни query параметри за умно redirect управление
let previousQuery = ref({
  orderby: null as string | null,
  order: null as string | null,
  filter: null as string | null,
});

// ⚡ ОПТИМИЗАЦИЯ: Функция за парсене на филтри (както в /magazin)
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

  // ⚡ КРИТИЧНО: Добавяме и атрибутните филтри
  const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as any[]) || [];
  globalProductAttributes.forEach((attr) => {
    const attributeValues = getFilterValues(attr.slug);
    if (attributeValues.length > 0) {
      filters[attr.slug] = attributeValues;
    }
  });

  return filters;
};

// Основна функция за зареждане на продукти
const loadCategoryProducts = async () => {
  if (isNavigating) {
    return;
  }

  isNavigating = true;
  const { parentSlug, childSlug, pageNumber } = extractRouteParams();

  // Ако няма parent или child slug, reset-ваме и излизаме
  if (!parentSlug || !childSlug) {
    resetProductsState();
    currentParentSlug.value = '';
    currentChildSlug.value = '';
    hasEverLoaded.value = true;
    return;
  }

    // ⚡ ВАЖНО: НЕ изчистваме продуктите! Показваме старите докато зареждаме новите
    // resetProductsState(); // ПРЕМАХНАТО - създава race condition!
    
    // Само update-ваме текущите стойности
    currentParentSlug.value = parentSlug;
    currentChildSlug.value = childSlug;
    currentPageNumber.value = pageNumber;

  try {
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

    // Използваме childSlug директно за по-надеждно зареждане
    const categoryIdentifier = [childSlug];

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

      // КРИТИЧНО: Добавяме attributeFilter
      const runtimeConfig = useRuntimeConfig();
      const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as any[]) || [];

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

      // ПОПРАВЕНО: Използваме оптимизираните функции с fix-натия jumpToPageOptimized
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
    currentPage.value = pageNumber;

    // ⚡ ОПТИМИЗАЦИЯ: Обновяваме next/prev links БЕЗ await (не блокира)
    nextTick(() => updateChildCategoryNextPrevLinks());
  } catch (error) {
    // НЕ сетваме hasEverLoaded = true при грешка, за да не показваме "Няма намерени продукти"
    console.error('loadCategoryProducts error:', error);
  } finally {
    isNavigating = false;
    // useProducts.ts ще изключи isLoading в своя finally блок
  }
};

// ⚡ ПРЕМАХНАТО: updateChildCategorySeoMeta() - вече не е нужна!
// Reactive computed childCategorySeoMeta автоматично се обновява когато matchingCategoryRef се промени.

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.3: ПАРАЛЕЛИЗИРАН onMounted (като в родителските категории)
onMounted(async () => {
  // Инициализираме предишните query стойности (синхронно - бързо)
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // ⚡ КРИТИЧНО: При client-side навигация ВИНАГИ зареждаме актуални category data!
  if (process.client) {
    // Извличаме актуалния child slug от route-а
    const actualChildSlug = route.params.child ? decodeURIComponent(String(route.params.child)) : '';
    
    // Проверяваме дали трябва да refresh-нем данните (нова категория или няма данни)
    const needsRefresh = !matchingCategory || matchingCategory.slug !== actualChildSlug;
    
    if (needsRefresh) {
      try {
        // ⚡ ОПТИМИЗАЦИЯ: Една заявка вместо две! 
        // getProductCategories вече връща точен count - не е нужна getProductsCount
        const { data: categoryData } = await useAsyncGql('getProductCategories', { 
          slug: [actualChildSlug], 
          hideEmpty: true 
        });

        if (categoryData.value?.productCategories?.nodes?.[0]) {
          matchingCategory = categoryData.value.productCategories.nodes[0];
          matchingCategoryRef.value = matchingCategory;

          // ⚡ ОПТИМИЗАЦИЯ: Директно използваме built-in count от GraphQL
          realProductCount = matchingCategory.count || 0;

          // Ако има parent информация
          if (matchingCategory.parent?.node) {
            parentCategory = matchingCategory.parent.node as Category;
            parentCategoryRef.value = parentCategory;
          }

          // ⚡ ОПТИМИЗАЦИЯ: Кешираме данните за по-бързо повторно посещение
          setCachedChildCategoryData(matchingCategory, parentCategory, realProductCount);
        } else {
          throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
        }
      } catch (error) {
        console.error('Failed to load category:', error);
        throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
      }
    } else {
      matchingCategoryRef.value = matchingCategory;
      if (parentCategory) {
        parentCategoryRef.value = parentCategory;
      }
    }
  }

  // ⚡ КРИТИЧНО: При филтри ТРЯБВА да await-нем за да избегнем race conditions
  // БЕЗ филтри - паралелизираме за по-бързо зареждане
  const hasFilters = route.query.filter || route.query.orderby;
  
  if (hasFilters) {
    // Force reload И ЧАКАМЕ - SSR данните са грешни при филтри
    hasEverLoaded.value = false; // Reset флага
    await loadCategoryProducts();
  } else if (products.value.length === 0 || !hasEverLoaded.value) {
    // БЕЗ филтри - зареждаме паралелно (Filters компонентът ще зареди своите данни паралелно)
    loadCategoryProducts().catch((error) => {
      console.error('❌ Грешка при зареждане на подкатегория:', error);
    });
  }
  
  // ⚡ ОПТИМИЗАЦИЯ: SEO links се обновяват в следващия tick БЕЗ blocking
  nextTick(() => {
    updateChildCategoryNextPrevLinks();
  });
});

// ⚠️ ВАЖНО: Зареждаме продукти на SSR САМО ако няма филтри в URL-а!
// При SSR в Nuxt 3, route.query е празен, което води до грешни резултати при филтри
if (process.server) {
  // Проверяваме дали URL-ът съдържа query параметри
  const event = useRequestEvent();
  const url = event?.node?.req?.url || '';
  const hasQueryParams = url.includes('?');
  
  // Зареждаме САМО ако няма query параметри (филтри/сортиране)
  if (!hasQueryParams) {
    await loadCategoryProducts();

    // Schema.org ItemList markup
    if (products.value.length > 0) {
      useItemListSchema(products, matchingCategory?.name || 'Продукти');
    }
  }
  // Ако има query параметри, client-side ще зареди правилните данни в onMounted
}

// ⚡ ОПТИМИЗАЦИЯ НИВО 1.1: SMART UNIFIED ROUTE WATCHER с DEBOUNCE (като в родителските категории)
// Вместо 3 отделни watchers (fullPath, path, query) - 1 оптимизиран watcher
let childNavigationDebounceTimer: NodeJS.Timeout | null = null;
let isChildNavigating = false;

watch(
  () => ({
    path: route.path,
    query: route.query,
    fullPath: route.fullPath,
  }),
  async (newRoute, oldRoute) => {
    if (!process.client) return;
    if (newRoute.fullPath === oldRoute.fullPath) return;

    // Предотвратяваме multiple concurrent navigation handlers
    if (isChildNavigating) {
      if (childNavigationDebounceTimer) clearTimeout(childNavigationDebounceTimer);
      childNavigationDebounceTimer = null;
    }

    if (childNavigationDebounceTimer) {
      clearTimeout(childNavigationDebounceTimer);
    }

    childNavigationDebounceTimer = setTimeout(async () => {
      if (isChildNavigating) return;
      isChildNavigating = true;

      try {
        // СЛУЧАЙ 1: Промяна в пътя (различна категория или страница)
        const pathChanged = newRoute.path !== oldRoute.path;

        if (pathChanged) {
          hasEverLoaded.value = false;
          await loadCategoryProducts();
          // ⚡ ПРЕМАХНАТО: updateChildCategorySeoMeta() - reactive computed ще се обнови автоматично!
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

          if (sortingOrFilteringChanged && (newRoute.query.page || route.params.pageNumber)) {
            const currentPageNumber = newRoute.query.page ? 
              parseInt(String(newRoute.query.page)) : 
              parseInt(String(route.params.pageNumber) || '1');

            if (currentPageNumber > 1) {
              const queryParams = new URLSearchParams();
              if (newOrderBy) queryParams.set('orderby', newOrderBy);
              if (newOrder) queryParams.set('order', newOrder);
              if (newFilter) queryParams.set('filter', newFilter);

              const queryString = queryParams.toString();
              const { parentSlug, childSlug } = extractRouteParams();
              const newUrl = `/produkt-kategoriya/${parentSlug}/${childSlug}${queryString ? `?${queryString}` : ''}`;

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
          await loadCategoryProducts();
        }
      } finally {
        isChildNavigating = false;
        childNavigationDebounceTimer = null;
      }
    }, 50);
  },
  { deep: true }
);

// Watcher за pageInfo промени (точно като в /magazin)
watch(
  () => pageInfo,
  () => {
    if (process.client) {
      updateChildCategoryNextPrevLinks();
    }
  },
  { deep: true },
);

// Watcher за филтри - актуализира правилния count при промяна на филтрите (взет от magazin.vue)
// ⚡ ОПТИМИЗАЦИЯ: Debounce за да избегнем race condition с loadCategoryProducts
let childFilterCountDebounceTimer: NodeJS.Timeout | null = null;
watch(
  () => route.query.filter,
  async (newFilter) => {
    if (!process.client) return;

    // Чистим предишния timer
    if (childFilterCountDebounceTimer) {
      clearTimeout(childFilterCountDebounceTimer);
    }

    // ⚡ КРИТИЧНО: Изчакваме loadCategoryProducts() да завърши преди да зареждаме count
    childFilterCountDebounceTimer = setTimeout(async () => {
      if (newFilter) {
        // Зареждаме count САМО ако не сме в процес на navigation
        if (!isChildNavigating) {
          // Парсваме филтрите със същата логика като в loadCategoryProducts
          const filterQuery = newFilter as string;

          const getFilterValues = (filterName: string): string[] => {
            const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
            if (!match || !match[1]) return [];
            return match[1].split(',').filter((val) => val && val.trim());
          };

          const filters: any = {};

          // OnSale филтър
          const onSale = getFilterValues('sale');
          if (onSale.length > 0 && onSale.includes('true')) {
            filters.onSale = true;
          }

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

          // Search филтър
          const searchTerm = getFilterValues('search');
          if (searchTerm.length > 0 && searchTerm[0]) {
            filters.search = searchTerm[0];
          }

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

// Computed за правилен count за pagination
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

// ⚡ ОПТИМИЗАЦИЯ: Функция за зареждане на filtered count
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
        slug: [childSlug], // Категория филтър
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
    <div :key="`${currentParentSlug}-${currentChildSlug}` || 'no-category'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="hidden lg:block lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" :category-slug="currentChildSlug" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentChildSlug" class="flex-1 min-w-0">
        <!-- Breadcrumb навигация -->
        <nav v-if="parentCategoryRef && matchingCategoryRef">
          <!-- Мобилна версия: скрита на desktop -->
          <div class="flex md:hidden text-xs leading-tight text-gray-400 gap-1.5 items-center py-2 mb-3">
            <NuxtLink to="/" class="hover:text-primary shrink-0" aria-label="Начало" title="Начало">
              <Icon name="ion:home" size="14" class="text-gray-400" aria-hidden="true" />
            </NuxtLink>
            <span class="shrink-0">/</span>
            <NuxtLink :to="`/produkt-kategoriya/${parentCategoryRef.slug}`" class="hover:text-primary shrink-0 line-clamp-1" :title="parentCategoryRef.name" :aria-label="parentCategoryRef.name">
              {{ parentCategoryRef.name }}
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
                <NuxtLink :to="`/produkt-kategoriya/${parentCategoryRef.slug}`" class="hover:text-gray-900">
                  {{ parentCategoryRef.name }}
                </NuxtLink>
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
          <!-- H1 Заглавие skeleton -->
          <div class="h-8 sm:h-10 bg-gray-200 rounded-md w-64 animate-pulse mb-4"></div>

          <!-- Описание skeleton (TopTaxonomyDescription) -->
          <div class="space-y-2 mb-6">
            <div class="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>

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

        <!-- No products found -->
        <NoProductsFound v-else-if="shouldShowNoProducts">
          <div class="text-center">
            <h2 class="text-xl font-bold mb-4">Не са намерени продукти в тази категория</h2>
            <div class="mt-4 text-sm text-gray-600">
              <p>Опитайте да промените филтрите или изберете друга категория.</p>
              <div v-if="matchingCategoryRef?.name && parentCategoryRef?.name" class="mt-2">
                <p>Категория: {{ parentCategoryRef.name }} > {{ matchingCategoryRef.name }}</p>
              </div>
            </div>
          </div>
        </NoProductsFound>
      </main>
    </div>
  </div>
</template>

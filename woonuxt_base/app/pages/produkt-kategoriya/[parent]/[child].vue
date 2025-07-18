<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';

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

const currentParentSlug = ref('');
const currentChildSlug = ref('');
const currentPageNumber = ref(1);

// КЛЮЧОВО: Зареждаме ДИРЕКТНО категорията по child slug (същия подход като single product)
const parentSlug = route.params.parent as string;
const childSlug = route.params.child as string;
const { data: categoryData } = await useAsyncGql('getProductCategories', { slug: [childSlug], hideEmpty: true });

// Получаваме точния брой продукти с ЛЕКА заявка (само cursor-и, без тежки данни)
const { data: productsCountData } = await useAsyncGql('getProductsCount', {
  slug: [childSlug],
});

let matchingCategory: Category | null = null;
let parentCategory: Category | null = null;
let realProductCount: number | null = null;

if (categoryData.value?.productCategories?.nodes?.[0]) {
  matchingCategory = categoryData.value.productCategories.nodes[0];

  // Ако има parent информация в данните
  if (matchingCategory.parent?.node) {
    parentCategory = matchingCategory.parent.node as Category;
  }
}

// Получаваме точния брой от ЛЕКА заявка (само cursor-и, без снимки/вариации/и т.н.)
if (productsCountData.value?.products?.edges) {
  realProductCount = productsCountData.value.products.edges.length;
}

// Fallback ако няма категория
if (!matchingCategory) {
  throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
}

// Reactive refs за runtime промени
const matchingCategoryRef = ref<Category | null>(matchingCategory);
const parentCategoryRef = ref<Category | null>(parentCategory);

// Функция за генериране на SEO данни според страницата (взета от основната категория)
const generateChildCategorySeoMeta = () => {
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
  const baseTitle = matchingCategory?.seo?.title || `${matchingCategory?.name} | ${parentCategory?.name || 'Категории'}` || `${childSlug} | ${parentSlug}`;
  const baseDescription = matchingCategory?.seo?.metaDesc || matchingCategory?.description || `Продукти в категория ${matchingCategory?.name || childSlug}`;

  // Генерираме динамичен title и description
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
      : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме и задаваме SEO метаданните
const childCategorySeoMeta = generateChildCategorySeoMeta();

useSeoMeta({
  title: childCategorySeoMeta.title,
  description: childCategorySeoMeta.description,
  keywords: matchingCategory?.seo?.metaKeywords,
  ogTitle: matchingCategory?.seo?.opengraphTitle || childCategorySeoMeta.title,
  ogDescription: matchingCategory?.seo?.opengraphDescription || childCategorySeoMeta.description,
  ogType: 'website',
  ogUrl: childCategorySeoMeta.canonicalUrl,
  ogImage: matchingCategory?.seo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: matchingCategory?.seo?.twitterTitle || childCategorySeoMeta.title,
  twitterDescription: matchingCategory?.seo?.twitterDescription || childCategorySeoMeta.description,
  twitterImage: matchingCategory?.seo?.twitterImage?.sourceUrl,
  robots: matchingCategory?.seo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Reactive refs за SEO links (точно като в категориите)
const headLinks = ref([{ rel: 'canonical', href: childCategorySeoMeta.canonicalUrl }]);

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
        ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
        : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber - 1}`;

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
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber + 1}`;
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

  // Винаги reset-ваме за чисто състояние при зареждане
  resetProductsState();

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

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // Принудително обновяване на currentPage за правилна синхронизация с pagination
    currentPage.value = pageNumber;

    // Обновяваме next/prev links след зареждане на данните
    await nextTick();
    updateChildCategoryNextPrevLinks();

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  } finally {
    isNavigating = false;
  }
};

// Функция за обновяване на SEO метаданните при промяна на route
const updateChildCategorySeoMeta = () => {
  const newSeoMeta = generateChildCategorySeoMeta();

  useSeoMeta({
    title: newSeoMeta.title,
    description: newSeoMeta.description,
    keywords: matchingCategory?.seo?.metaKeywords,
    ogTitle: matchingCategory?.seo?.opengraphTitle || newSeoMeta.title,
    ogDescription: matchingCategory?.seo?.opengraphDescription || newSeoMeta.description,
    ogUrl: newSeoMeta.canonicalUrl,
    twitterTitle: matchingCategory?.seo?.twitterTitle || newSeoMeta.title,
    twitterDescription: matchingCategory?.seo?.twitterDescription || newSeoMeta.description,
  });

  // Обновяваме и rel=prev/next links при навигация (точно като в родителските категории)
  updateChildCategoryNextPrevLinks();
};

// Зареждаме при mount
onMounted(async () => {
  // Инициализираме предишните query стойности
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  await nextTick();
  await loadCategoryProducts();
  // Задаваме началните rel=prev/next links (точно като в родителските категории)
  await nextTick();
  updateChildCategoryNextPrevLinks();
});

// За SSR зареждане при извикване на страницата (точно като в родителските категории)
if (process.server) {
  loadCategoryProducts();
}

// Следене на промени в route
watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      await nextTick();
      loadCategoryProducts();
      // Обновяваме и SEO данните при навигация
      updateChildCategorySeoMeta();
    }
  },
);

// Допълнителен watcher за промени в path за да се улавя навигацията между страници (точно като в родителските категории)
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      // Reset loading състоянието при навигация за да се покаже skeleton
      hasEverLoaded.value = false;
      loadCategoryProducts();
      // Обновяваме и SEO данните при навигация
      updateChildCategorySeoMeta();
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

      // Ако са се променили sorting/filtering параметрите И сме на страница > 1
      if (sortingOrFilteringChanged && (newQuery.page || route.params.pageNumber)) {
        const currentPageNumber = newQuery.page ? parseInt(String(newQuery.page)) : parseInt(String(route.params.pageNumber) || '1');

        if (currentPageNumber > 1) {
          // Изграждаме URL за страница 1 с новите sorting/filtering параметри
          const queryParams = new URLSearchParams();
          if (newOrderBy) queryParams.set('orderby', newOrderBy);
          if (newOrder) queryParams.set('order', newOrder);
          if (newFilter) queryParams.set('filter', newFilter);

          const queryString = queryParams.toString();
          const { parentSlug, childSlug } = extractRouteParams();
          const newUrl = `/produkt-kategoriya/${parentSlug}/${childSlug}${queryString ? `?${queryString}` : ''}`;

          // Обновяваме предишните стойности преди redirect
          previousQuery.value = {
            orderby: newOrderBy,
            order: newOrder,
            filter: newFilter,
          };

          await navigateTo(newUrl, { replace: true });
          return; // Излизаме рано - navigateTo ще предизвика нов loadCategoryProducts
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
      loadCategoryProducts();
    }
  },
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
watch(
  () => route.query.filter,
  async (newFilter) => {
    if (process.client && newFilter) {
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
    } else if (process.client && !newFilter) {
      // Когато няма филтри, нулираме filtered count
      filteredCategoryCount.value = null;
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

// Ref за филтриран count при филтриране (взето от magazin.vue)
const filteredCategoryCount = ref<number | null>(null);

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
      // ПОПРАВКА: Използваме ULTRA ГОЛЯМА first стойност за да получим всички резултати
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
        variables.slug = [childSlug]; // Категория филтър
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

        // Използваме основната getProducts заявка която поддържа всички филтри
        const { data } = await useAsyncGql('getProducts', variables);

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

      filteredCategoryCount.value = totalFilteredCount > 0 ? totalFilteredCount : null;
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
        <nav v-if="parentCategoryRef && matchingCategoryRef" class="mb-6 text-sm text-gray-600">
          <ol class="flex items-center space-x-2">
            <li>
              <NuxtLink to="/" class="hover:text-gray-900">Начало</NuxtLink>
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
        </nav>

        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8 c6">
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
          <PaginationServer :category-count="categoryCount" />

          <!-- Описание на категорията -->
          <TaxonomyDescription
            v-if="matchingCategoryRef?.description"
            :description="matchingCategoryRef.description"
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

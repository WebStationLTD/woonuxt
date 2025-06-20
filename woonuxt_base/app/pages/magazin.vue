<script setup lang="ts">
const { loadProductsPage, loadProductsWithFilters, products, isLoading, currentPage, pageInfo, resetProductsState } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
const { isQueryEmpty } = useHelpers();

// Проследяваме дали някога сме зареждали данни
const hasEverLoaded = ref(false);

// Get route instance once
const route = useRoute();

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
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin/page/${pageNumber}`;

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

// Canonical URL (използваме Yoast canonical ако е зададен за първата страница)
const canonicalUrl = seoMeta.pageNumber === 1 && shopSeo?.canonical ? shopSeo.canonical : seoMeta.canonicalUrl;

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
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

// Prev/Next links за pagination SEO
const initialPrevNextLinks: any[] = [];

if (seoMeta.pageNumber > 1) {
  const prevUrl =
    seoMeta.pageNumber === 2
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber - 1}`;

  initialPrevNextLinks.push({ rel: 'prev', href: prevUrl });
}

// Добавяме next link изначално като placeholder - ще се обновява динамично
const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber + 1}`;
initialPrevNextLinks.push({ rel: 'next', href: nextUrl });

useHead({
  link: initialPrevNextLinks,
});

// Функция за динамично обновяване на next/prev links
const updateNextPrevLinks = () => {
  const updatedLinks: any[] = [];

  if (seoMeta.pageNumber > 1) {
    const prevUrl =
      seoMeta.pageNumber === 2
        ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin`
        : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber - 1}`;

    updatedLinks.push({ rel: 'prev', href: prevUrl });
  }

  if (pageInfo?.hasNextPage) {
    const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/magazin/page/${seoMeta.pageNumber + 1}`;
    updatedLinks.push({ rel: 'next', href: nextUrl });
  }

  useHead({
    link: updatedLinks,
  });
};

// Race condition protection
let isNavigating = false;

// Функция за локално парсане на филтри от query string
const parseFiltersFromQuery = (filterQuery: string) => {
  const filters: any = {};

  if (!filterQuery || typeof filterQuery !== 'string') return filters;

  // Функция за извличане на филтър стойности с validation
  const getFilterValues = (filterName: string): string[] => {
    const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
    if (!match || !match[1]) return [];

    const values = match[1].split(',').filter((val) => val && val.trim());
    return values;
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
    if (route.params.pageNumber) {
      const parsedPage = parseInt(route.params.pageNumber as string);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        pageNumber = parsedPage;
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

      await loadProductsPage(pageNumber, undefined, graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница
      await loadProductsPage(pageNumber);
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

// Зареждаме продуктите веднага при SSR и след hydration
onMounted(async () => {
  // Изчакваме един tick за да се установи правилно route състоянието
  await nextTick();
  await loadProductsFromRoute();
});

// За SSR зареждане при извикване на страницата
if (process.server) {
  loadProductsFromRoute();
}

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

// Watcher за промени в query параметрите (филтри и сортиране)
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (process.client && JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
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

// Computed за показване на loading състояние
const shouldShowLoading = computed(() => {
  return isLoading.value || !hasEverLoaded.value;
});

// Computed за показване на NoProductsFound
const shouldShowNoProducts = computed(() => {
  return hasEverLoaded.value && !isLoading.value && (!products.value || products.value.length === 0);
});
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <div class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings.showFilters" class="lg:w-80 flex-shrink-0">
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
              <div class="h-8 bg-gray-200 rounded-md w-24 animate-pulse hidden md:block"></div>
              <div class="h-8 bg-gray-200 rounded-md w-10 animate-pulse lg:hidden"></div>
            </div>
          </div>

          <!-- Products grid skeleton -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
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
              <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
              <div v-if="storeSettings.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts"> Could not fetch products from your store. Please check your configuration. </NoProductsFound>
      </main>
    </div>
  </div>
</template>

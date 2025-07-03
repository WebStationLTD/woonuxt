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
  count?: number | null;
  databaseId?: number | null;
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

const currentSlug = ref('');
const currentPageNumber = ref(1);

// ПОПРАВКА: Използваме правилния параметър и декодираме URL-а
const routeSlug = route.params.categorySlug || route.params.slug; // Първо опитваме categorySlug, после slug
const decodedSlug = routeSlug ? decodeURIComponent(String(routeSlug)) : '';

const slug = decodedSlug;

// Заявяваме ДИРЕКТНО конкретната категория (същия подход като в подкатегориите)
const { data: categoryData } = await useAsyncGql('getProductCategories', { slug: [slug], hideEmpty: false });

// Получаваме точния брой продукти с ЛЕКА заявка (само cursor-и, без тежки данни)
const { data: productsCountData } = await useAsyncGql('getProductsCount', {
  slug: [slug],
});

let matchingCategory: Category | null = null;
let realProductCount: number | null = null;

if (categoryData.value?.productCategories?.nodes?.[0]) {
  matchingCategory = categoryData.value.productCategories.nodes[0] as Category;
}

// Получаваме точния брой от ЛЕКА заявка (само cursor-и, без снимки/вариации/и т.н.)
if (productsCountData.value?.products?.edges) {
  realProductCount = productsCountData.value.products.edges.length;
}

// Fallback ако няма категория
if (!matchingCategory) {
  throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
}

// Reactive ref за runtime промени
const matchingCategoryRef = ref<Category | null>(matchingCategory);

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
  const baseTitle = matchingCategory?.seo?.title || matchingCategory?.name || 'Категория';
  const baseDescription = matchingCategory?.seo?.metaDesc || matchingCategory?.description || `Продукти в категория ${matchingCategory?.name}`;

  // Генерираме динамичен title и description точно като в /magazin
  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageNumber > 1) {
    finalTitle = `${baseTitle} - Страница ${pageNumber}`;
    finalDescription = `${baseDescription} - Страница ${pageNumber}`;
  }

  const canonicalUrl =
    pageNumber === 1
      ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
      : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме и задаваме първоначалните SEO метаданни
const initialCategorySeoMeta = generateCategorySeoMeta();

useSeoMeta({
  title: initialCategorySeoMeta.title,
  description: initialCategorySeoMeta.description,
  ogTitle: matchingCategory?.seo?.opengraphTitle || initialCategorySeoMeta.title,
  ogDescription: matchingCategory?.seo?.opengraphDescription || initialCategorySeoMeta.description,
  ogType: 'website',
  ogUrl: initialCategorySeoMeta.canonicalUrl,
  ogImage: matchingCategory?.seo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: matchingCategory?.seo?.twitterTitle || initialCategorySeoMeta.title,
  twitterDescription: matchingCategory?.seo?.twitterDescription || initialCategorySeoMeta.description,
  twitterImage: matchingCategory?.seo?.twitterImage?.sourceUrl,
  robots: matchingCategory?.seo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Reactive refs за SEO links
const headLinks = ref([{ rel: 'canonical', href: initialCategorySeoMeta.canonicalUrl }]);

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
  const productsPerPageValue = 12; // Стандартната стойност
  const totalPages = Math.ceil(totalProductCount / productsPerPageValue);

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
        ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
        : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedCategoryLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link - използваме точното изчисление на база реалния брой продукти
  const hasNextPage = realProductCount
    ? currentSeoMeta.pageNumber < totalPages // Точно изчисление ако имаме реален count
    : pageInfo?.hasNextPage; // Fallback към pageInfo за cursor-based

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
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
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

// Извличаме slug и страница от route
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
    keywords: matchingCategory?.seo?.metaKeywords,
    ogTitle: matchingCategory?.seo?.opengraphTitle || newSeoMeta.title,
    ogDescription: matchingCategory?.seo?.opengraphDescription || newSeoMeta.description,
    ogUrl: newSeoMeta.canonicalUrl,
    twitterTitle: matchingCategory?.seo?.twitterTitle || newSeoMeta.title,
    twitterDescription: matchingCategory?.seo?.twitterDescription || newSeoMeta.description,
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

// Основна функция за зареждане на продукти
const loadCategoryProducts = async () => {
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

    // ВАЖНО: Запазваме pageNumber преди reset за да не го загубим
    const targetPageNumber = pageNumber;

    resetProductsState();
    currentSlug.value = slug;
    currentPageNumber.value = targetPageNumber;

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри
      let filters: any = {};

      // Използваме същата логика за парсене на филтри като в /magazin страницата
      if (hasFilters) {
        const filterQuery = route.query.filter as string;

        // Функция за извличане на филтър стойности с validation (copy от products.vue)
        const getFilterValues = (filterName: string): string[] => {
          const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
          if (!match || !match[1]) return [];

          const values = match[1].split(',').filter((val) => val && val.trim());
          return values;
        };

        // OnSale филтър - само ако има валидна стойност
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
      }

      // Конвертираме orderby в GraphQL формат
      let graphqlOrderBy = 'DATE';
      if (hasOrderBy) {
        const orderBy = String(route.query.orderby);
        if (orderBy === 'price') graphqlOrderBy = 'PRICE';
        else if (orderBy === 'rating') graphqlOrderBy = 'RATING';
        else if (orderBy === 'alphabetically') graphqlOrderBy = 'NAME_IN';
        else if (orderBy === 'date') graphqlOrderBy = 'DATE';
        else if (orderBy === 'discount') graphqlOrderBy = 'DATE';
      }

      // КРИТИЧНО: Правилна логика за cursor-based пагинация
      if (pageNumber > 1) {
        // За страница > 1 ВИНАГИ използваме jumpToPageOptimized - дори при сортиране/филтри
        await jumpToPageOptimized(pageNumber, [slug], graphqlOrderBy, filters);
      } else {
        // За страница 1 използваме loadProductsPageOptimized (работи без cursor)
        await loadProductsPageOptimized(pageNumber, [slug], graphqlOrderBy, filters);
      }
    } else {
      // Ако няма филтри, използваме супер бързата функция за конкретна страница
      if (pageNumber > 1) {
        await jumpToPageOptimized(pageNumber, [slug]);
      } else {
        await loadProductsPageOptimized(pageNumber, [slug]);
      }
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // КРИТИЧНО: Принудително задаваме currentPage СЛЕД loadProductsPage
    await nextTick();
    currentPage.value = targetPageNumber;

    // Обновяваме next/prev links след като данните са заредени
    await nextTick();
    updateCategoryNextPrevLinks();

    // Принудително завършване на loading състоянието
    await nextTick();
  } catch (error) {
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  } finally {
    isNavigating = false;
  }
};

// Зареждаме при mount
onMounted(async () => {
  // Инициализираме предишните query стойности
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  // Изчакваме един tick за да се установи правилно route състоянието (точно като в /magazin)
  await nextTick();
  await loadCategoryProducts();
  // Задаваме началните rel=prev/next links
  await nextTick();
  updateCategoryNextPrevLinks();
});

// За SSR зареждане при извикване на страницата (точно като в /magazin)
if (process.server) {
  loadCategoryProducts();
}

// Следене на промени в route
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      loadCategoryProducts();
      // Обновяваме и SEO данните при навигация
      updateCategorySeoMeta();
    }
  },
);

// Допълнителен watcher за промени в path за да се улавя навигацията між страници (точно като в /magazin)
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && process.client) {
      // Reset loading състоянието при навигация за да се покаже skeleton
      hasEverLoaded.value = false;
      loadCategoryProducts();
      // Обновяваме и SEO данните при навигация
      updateCategorySeoMeta();
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

      // DEBUG MODE - activate with: window.debugPagination = true
      if (process.client && (window as any).debugPagination) {
        console.log('🔍 Query change detected:', {
          sortingOrFilteringChanged,
          previousOrderBy: previousQuery.value.orderby,
          newOrderBy,
          previousOrder: previousQuery.value.order,
          newOrder,
          previousFilter: previousQuery.value.filter,
          newFilter,
        });
      }

      // Ако са се променили sorting/filtering параметрите И сме на страница > 1
      if (sortingOrFilteringChanged && (newQuery.page || route.params.pageNumber)) {
        const currentPageNumber = newQuery.page ? parseInt(String(newQuery.page)) : parseInt(String(route.params.pageNumber) || '1');

        if (currentPageNumber > 1) {
          if (process.client && (window as any).debugPagination) {
            console.log('🔄 Sorting/filtering changed on page > 1, redirecting to page 1');
          }

          // Изграждаме URL за страница 1 с новите sorting/filtering параметри
          const queryParams = new URLSearchParams();
          if (newOrderBy) queryParams.set('orderby', newOrderBy);
          if (newOrder) queryParams.set('order', newOrder);
          if (newFilter) queryParams.set('filter', newFilter);

          const queryString = queryParams.toString();
          const { slug } = extractRouteParams();
          const newUrl = `/produkt-kategoriya/${slug}${queryString ? `?${queryString}` : ''}`;

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

// Watcher за pageInfo промени (като в /magazin)
watch(
  () => pageInfo,
  () => {
    if (process.client) {
      updateCategoryNextPrevLinks();
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
    <!-- Основен layout -->
    <div :key="currentSlug || 'no-category'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main v-if="currentSlug" class="flex-1 min-w-0">
        <!-- Loading състояние с skeleton -->
        <div v-if="shouldShowLoading" class="space-y-8">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between w-full gap-4 mb-8 c6">
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
              <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings?.showOrderByDropdown" />
              <div v-if="storeSettings?.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer :category-count="realProductCount || matchingCategory?.count" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <NoProductsFound v-else-if="shouldShowNoProducts">
          <div class="text-center">
            <h2 class="text-xl font-bold mb-4">Не са намерени продукти в тази категория</h2>
            <div class="mt-4 text-sm text-gray-600">
              <p>Опитайте да промените филтрите или изберете друга категория.</p>
            </div>
          </div>
        </NoProductsFound>
      </main>
    </div>
  </div>
</template>

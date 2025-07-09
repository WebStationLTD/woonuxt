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

// Заявяваме ДИРЕКТНО конкретния етикет (същия подход като в категориите)
const { data: tagData } = await useAsyncGql(
  'getProductTags' as any,
  {
    slug: [slug],
    hideEmpty: false,
    first: 20,
  } as any,
);

// Получаваме точния брой продукти с ЛЕКА заявка (само cursor-и, без тежки данни)
const { data: productsCountData } = await useAsyncGql(
  'getProductsCount' as any,
  {
    productTag: [slug],
  } as any,
);

let matchingTag: Tag | null = null;
let realProductCount: number | null = null;

if (tagData.value?.productTags?.nodes?.[0]) {
  matchingTag = tagData.value.productTags.nodes[0] as Tag;
}

// Получаваме точния брой от ЛЕКА заявка
if (productsCountData.value?.products?.edges) {
  realProductCount = productsCountData.value.products.edges.length;
}

// Fallback ако няма етикет
if (!matchingTag) {
  throw showError({ statusCode: 404, statusMessage: 'Етикетът не е намерен' });
}

// Reactive ref за runtime промени
const matchingTagRef = ref<Tag | null>(matchingTag);

// Ref за филтриран count при филтриране
const filteredTagCount = ref<number | null>(null);

// Функция за генериране на SEO данни според страницата
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

  // Използваме етикетните данни като база (без SEO данни за сега)
  const baseTitle = matchingTag?.name || 'Етикет';
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

// Schema markup няма да има за етикетите засега

// Функция за динамично обновяване на next/prev links с точен брой продукти
const updateTagNextPrevLinks = () => {
  if (process.client && (window as any).debugPagination) {
    console.log('🔗 updateTagNextPrevLinks called!');
  }

  const currentSeoMeta = generateTagSeoMeta();
  const updatedTagLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount || matchingTag?.count || 0;
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
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-etiket/${slug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedTagLinks.push({ rel: 'next', href: nextUrl });
    if (process.client && (window as any).debugPagination) {
      console.log('✅ Adding rel=next:', nextUrl);
    }
  } else {
    if (process.client && (window as any).debugPagination) {
      console.log('❌ NO rel=next - on last page!');
    }
  }

  // Добавяме canonical URL за текущата страница
  updatedTagLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  // Обновяваме reactive ref
  headLinks.value = updatedTagLinks;
};

// Извличаме slug и страница от route
const extractRouteParams = () => {
  let slug = '';
  let pageNumber = 1;

  // Първо извличаме slug от правилния параметър
  if (route.params.slug) {
    slug = String(route.params.slug);
  } else if (route.params.tagSlug) {
    slug = String(route.params.tagSlug);
  }

  // ВАЖНО: Приоритизираме query.page параметъра
  if (route.query.page) {
    const parsed = parseInt(String(route.query.page));
    if (!isNaN(parsed) && parsed > 0) {
      pageNumber = parsed;
    }
  }
  // След това проверяваме за страница в URL пътя
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

// Основна функция за зареждане на продукти
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
      let filters: any = {};

      if (hasFilters) {
        const filterQuery = route.query.filter as string;

        const getFilterValues = (filterName: string): string[] => {
          const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
          if (!match || !match[1]) return [];

          const values = match[1].split(',').filter((val) => val && val.trim());
          return values;
        };

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

// Функция за зареждане на filtered count при всякакви филтри (взета от категориите)
const loadTagCount = async (filters: any) => {
  // КРИТИЧНО: Само на клиента
  if (!process.client) {
    console.log('⚠️ loadTagCount на сървъра, спираме изпълнението');
    return;
  }

  // Проверяваме за всички типове филтри
  const hasAnyFilters = filters.onSale || (filters.minPrice !== undefined && filters.maxPrice !== undefined) || filters.search;

  if (hasAnyFilters) {
    try {
      // Създаваме variables с ВСИЧКИ филтри за точен count
      const variables: any = {
        first: 1000, // Зареждаме достатъчно за да получим точния count
        productTag: [slug], // Добавяме етикета
      };

      // Добавяме всички филтри ако са налични
      if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
      if (filters.onSale !== undefined) variables.onSale = filters.onSale;
      if (filters.search) variables.search = filters.search;

      console.log('🔍 TAG: Loading filtered count with filters:', filters);
      console.log('📡 TAG: GraphQL variables:', variables);

      // Използваме основната getProducts заявка която поддържа всички филтри
      const { data } = await useAsyncGql('getProducts' as any, variables);

      const result = data.value?.products;
      const allProducts = result?.nodes || [];
      filteredTagCount.value = allProducts.length > 0 ? allProducts.length : null;

      console.log('✅ TAG: Filtered count loaded:', filteredTagCount.value);
    } catch (error) {
      console.error('Error loading filtered count:', error);
      filteredTagCount.value = null;
    }
  } else {
    filteredTagCount.value = null;
  }
};

// Зареждаме при mount
onMounted(async () => {
  previousQuery.value = {
    orderby: (route.query.orderby as string | null) || null,
    order: (route.query.order as string | null) || null,
    filter: (route.query.filter as string | null) || null,
  };

  await nextTick();
  await loadTagProducts();
  await nextTick();
  updateTagNextPrevLinks();
});

// За SSR зареждане
if (process.server) {
  loadTagProducts();
}

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
      hasEverLoaded.value = false;
      loadTagProducts();
      updateTagSeoMeta();
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
          const { slug } = extractRouteParams();
          const newUrl = `/produkt-etiket/${slug}${queryString ? `?${queryString}` : ''}`;

          // Обновяваме предишните стойности преди redirect
          previousQuery.value = {
            orderby: newOrderBy,
            order: newOrder,
            filter: newFilter,
          };

          await navigateTo(newUrl, { replace: true });
          return; // Излизаме рано - navigateTo ще предизвика нов loadTagProducts
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

// Watcher за pageInfo промени
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
      // Парсваме филтрите със същата логика като в loadTagProducts
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

// Computed за правилен count за pagination - същата логика като в категориите
const tagCount = computed(() => {
  // Парсваме филтрите директно от URL за актуална проверка
  const hasFilters = route.query.filter;

  if (hasFilters) {
    // Парсваме филтрите със същата логика като в loadTagProducts
    const filterQuery = route.query.filter as string;

    const getFilterValues = (filterName: string): string[] => {
      const match = filterQuery.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
      if (!match || !match[1]) return [];
      return match[1].split(',').filter((val) => val && val.trim());
    };

    const onSale = getFilterValues('sale');
    const priceRange = getFilterValues('price');
    const searchTerm = getFilterValues('search');

    // Проверяваме дали има ВСЯКАКВИ филтри
    const hasAnyFilters =
      (onSale.length > 0 && onSale.includes('true')) || (priceRange.length === 2 && priceRange[0] && priceRange[1]) || (searchTerm.length > 0 && searchTerm[0]);

    if (hasAnyFilters) {
      // При всякакви филтри използваме филтрирания count
      return filteredTagCount.value;
    }
  }

  // Без филтри използваме оригиналния count от етикета
  return realProductCount || matchingTag?.count;
});

// Computed свойства за template
const tagTitle = computed(() => matchingTag?.name || 'Етикет');
const tagDescription = computed(() => matchingTag?.description || '');
const showDescription = computed(() => tagDescription.value && tagDescription.value.trim().length > 0);

// Изнасяме storeSettings извън useAppConfig за достъп в template-а
const storeSettingsLocal = storeSettings;
</script>

<template>
  <div class="container mx-auto px-2 py-4 sm:py-6">
    <!-- Основен layout -->
    <div :key="currentSlug || 'no-tag'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettingsLocal?.showFilters" class="lg:w-80 flex-shrink-0">
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
              <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettingsLocal?.showOrderByDropdown" />
              <div v-if="storeSettingsLocal?.showFilters" class="flex items-center gap-2 lg:hidden">
                <span class="text-sm font-light">Филтри</span>
                <ShowFilterTrigger />
              </div>
            </div>
          </div>

          <!-- Grid с продукти -->
          <ProductGrid />

          <!-- Пагинация -->
          <PaginationServer :category-count="tagCount" />
        </div>

        <!-- No products found - показва се само когато сме сигурни че няма продукти -->
        <div v-else-if="shouldShowNoProducts">
          <!-- Съобщение за липса на продукти -->
          <NoProductsFound>
            <div class="text-center">
              <h2 class="text-xl font-bold mb-4">Не са намерени продукти с този етикет</h2>
              <div class="mt-4 text-sm text-gray-600">
                <p>Опитайте да промените филтрите или изберете друг етикет.</p>
              </div>
            </div>
          </NoProductsFound>
        </div>
      </main>
    </div>
  </div>
</template>

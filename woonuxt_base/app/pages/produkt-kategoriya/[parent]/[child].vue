<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const { loadProductsPage, loadProductsWithFilters, products, isLoading, resetProductsState, pageInfo } = useProducts();
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
  console.log('🔗 updateChildCategoryNextPrevLinks called!');

  const currentSeoMeta = generateChildCategorySeoMeta(); // Генерираме динамичните SEO данни
  const updatedChildLinks: any[] = [];

  // Изчисляваме общия брой страници на база на реалния брой продукти
  const totalProductCount = realProductCount || matchingCategory?.count || 0;
  const productsPerPageValue = 12; // Стандартната стойност
  const totalPages = Math.ceil(totalProductCount / productsPerPageValue);

  console.log('🔗 Debug data:', {
    currentPage: currentSeoMeta.pageNumber,
    totalProductCount,
    totalPages,
    realProductCount,
    hasRealCount: !!realProductCount,
  });

  // Prev link
  if (currentSeoMeta.pageNumber > 1) {
    const prevUrl =
      currentSeoMeta.pageNumber === 2
        ? `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
        : `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber - 1}`;

    updatedChildLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link - използваме точното изчисление на база реалния брой продукти
  const hasNextPage = realProductCount
    ? currentSeoMeta.pageNumber < totalPages // Точно изчисление ако имаме реален count
    : pageInfo?.hasNextPage; // Fallback към pageInfo за cursor-based

  console.log('🔗 Next page logic:', {
    realProductCount: !!realProductCount,
    currentPage: currentSeoMeta.pageNumber,
    totalPages,
    calculation: `${currentSeoMeta.pageNumber} < ${totalPages} = ${currentSeoMeta.pageNumber < totalPages}`,
    pageInfoHasNext: pageInfo?.hasNextPage,
    finalHasNextPage: hasNextPage,
  });

  if (hasNextPage) {
    const nextUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${currentSeoMeta.pageNumber + 1}`;
    updatedChildLinks.push({ rel: 'next', href: nextUrl });
    console.log('✅ Adding rel=next:', nextUrl);
  } else {
    console.log('❌ NO rel=next - on last page!');
  }

  // Добавяме canonical URL за текущата страница
  updatedChildLinks.push({ rel: 'canonical', href: currentSeoMeta.canonicalUrl });

  console.log(
    '🔗 Final links array:',
    updatedChildLinks.map((link) => `${link.rel}: ${link.href}`),
  );

  // Обновяваме reactive ref вместо извикване на useHead() (точно като в категориите)
  headLinks.value = updatedChildLinks;

  console.log(
    '🔗 headLinks.value updated:',
    headLinks.value.map((link) => `${link.rel}: ${link.href}`),
  );
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
    // Използваме childSlug директно за по-надеждно зареждане
    const categoryIdentifier = [childSlug];

    // Проверяваме дали има филтри или сортиране в URL
    const hasFilters = route.query.filter;
    const hasOrderBy = route.query.orderby;

    if (hasFilters || hasOrderBy) {
      // Ако има филтри или сортиране, зареждаме със серверните филтри
      let filters: any = {};

      // Използваме същата логика за парсене на филтри
      if (hasFilters) {
        const filterQuery = route.query.filter as string;

        // Функция за извличане на филтър стойности с validation
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

      await loadProductsPage(pageNumber, categoryIdentifier, graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница
      await loadProductsPage(pageNumber, categoryIdentifier);
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // КРИТИЧНО: Принудително задаваме currentPageNumber СЛЕД loadProductsPage (точно като в родителските категории)
    await nextTick();
    currentPageNumber.value = pageNumber;

    // Обновяваме next/prev links след като данните са заредени
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

// Watcher за промени в query параметрите (филтри и сортиране) (точно като в родителските категории)
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (process.client && JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
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
    console.log('🔔 Child Category: pageInfo watcher triggered - process.client:', process.client, 'pageInfo:', pageInfo);
    if (process.client) {
      console.log('🔄 Child Category: Calling updateChildCategoryNextPrevLinks from watcher');
      updateChildCategoryNextPrevLinks();
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
    <div :key="`${currentParentSlug}-${currentChildSlug}` || 'no-category'" class="flex flex-col lg:flex-row gap-0 sm:gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings?.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" />
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
          <PaginationServer :category-count="realProductCount || matchingCategoryRef?.count" />
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

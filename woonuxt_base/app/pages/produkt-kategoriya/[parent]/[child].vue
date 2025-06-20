<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const { loadProductsPage, loadProductsWithFilters, products, isLoading, resetProductsState, pageInfo } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { storeSettings } = useAppConfig();
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

let matchingCategory: Category | null = null;
let parentCategory: Category | null = null;

if (categoryData.value?.productCategories?.nodes?.[0]) {
  matchingCategory = categoryData.value.productCategories.nodes[0];

  // Ако има parent информация в данните
  if (matchingCategory.parent?.node) {
    parentCategory = matchingCategory.parent.node as Category;
  }
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
  // Получаваме номера на страницата
  let pageNumber = 1;
  if (route.params.pageNumber) {
    const parsedPage = parseInt(route.params.pageNumber as string);
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
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${pageNumber}`;

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

// Canonical URL (използваме категорийния canonical ако е зададен за първата страница)
const canonicalUrl =
  childCategorySeoMeta.pageNumber === 1 && matchingCategory?.seo?.canonical ? matchingCategory.seo.canonical : childCategorySeoMeta.canonicalUrl;

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
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

// Prev/Next links за pagination SEO
if (childCategorySeoMeta.pageNumber > 1) {
  const prevUrl =
    childCategorySeoMeta.pageNumber === 2
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${childCategorySeoMeta.pageNumber - 1}`;

  useHead({
    link: [{ rel: 'prev', href: prevUrl }],
  });
}

// Next link ще добавим динамично когато знаем че има още страници
const updateChildCategoryNextPrevLinks = () => {
  if (pageInfo?.hasNextPage) {
    const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${childCategorySeoMeta.pageNumber + 1}`;
    useHead({
      link: [{ rel: 'next', href: nextUrl }],
    });
  }
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

  return { parentSlug, childSlug, pageNumber };
};

// Основна функция за зареждане на продукти
const loadCategoryProducts = async () => {
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

    // Обновяваме next/prev links след като данните са заредени
    updateChildCategoryNextPrevLinks();
  } catch (error) {
    hasEverLoaded.value = true;
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

  // Обновяваме canonical URL
  const newCanonicalUrl = newSeoMeta.pageNumber === 1 && matchingCategory?.seo?.canonical ? matchingCategory.seo.canonical : newSeoMeta.canonicalUrl;

  useHead({
    link: [{ rel: 'canonical', href: newCanonicalUrl }],
  });

  // Обновяваме prev/next links
  const prevNextLinks: any[] = [];

  if (newSeoMeta.pageNumber > 1) {
    const prevUrl =
      newSeoMeta.pageNumber === 2
        ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}`
        : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${newSeoMeta.pageNumber - 1}`;

    prevNextLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link ще се добави когато знаем че има още страници
  if (pageInfo?.hasNextPage) {
    const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${parentSlug}/${childSlug}/page/${newSeoMeta.pageNumber + 1}`;
    prevNextLinks.push({ rel: 'next', href: nextUrl });
  }

  useHead({
    link: prevNextLinks,
  });
};

// Зареждаме при mount
onMounted(async () => {
  await nextTick();
  loadCategoryProducts();
});

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

// Watcher за pageInfo промени
watch(
  () => pageInfo,
  () => {
    if (pageInfo && process.client) {
      updateChildCategorySeoMeta();
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
          <PaginationServer />
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

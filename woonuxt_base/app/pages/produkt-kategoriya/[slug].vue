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

// Заявяваме всички категории ВКЛЮЧИТЕЛНО празни (hideEmpty: false)
const { data: categoryData } = await useAsyncGql('getProductCategories', { first: 100, hideEmpty: false });

let matchingCategory: Category | null = null;

if (categoryData.value?.productCategories?.nodes) {
  // Търсим в основните категории
  matchingCategory = (categoryData.value.productCategories.nodes.find((cat: any) => cat.slug === slug) as Category) || null;

  // Ако не е намерена в основните, търсим в дъщерните
  if (!matchingCategory) {
    for (const parentCat of categoryData.value.productCategories.nodes) {
      if (parentCat.children?.nodes) {
        const foundChild = parentCat.children.nodes.find((child: any) => child.slug === slug) as Category;
        if (foundChild) {
          matchingCategory = foundChild;
          break;
        }
      }
    }
  }
}

// Fallback ако няма категория
if (!matchingCategory) {
  throw showError({ statusCode: 404, statusMessage: 'Категорията не е намерена' });
}

// Reactive ref за runtime промени
const matchingCategoryRef = ref<Category | null>(matchingCategory);

// Функция за генериране на SEO данни според страницата (взета от /magazin)
const generateCategorySeoMeta = () => {
  // Получаваме номера на страницата точно като в /magazin
  let pageNumber = 1;
  if (route.params.pageNumber) {
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
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${pageNumber}`;

  return {
    title: finalTitle,
    description: finalDescription,
    canonicalUrl: canonicalUrl,
    pageNumber: pageNumber,
  };
};

// Генерираме и задаваме SEO метаданните
const categorySeoMeta = generateCategorySeoMeta();

useSeoMeta({
  title: categorySeoMeta.title,
  description: categorySeoMeta.description,
  ogTitle: matchingCategory?.seo?.opengraphTitle || categorySeoMeta.title,
  ogDescription: matchingCategory?.seo?.opengraphDescription || categorySeoMeta.description,
  ogType: 'website',
  ogUrl: categorySeoMeta.canonicalUrl,
  ogImage: matchingCategory?.seo?.opengraphImage?.sourceUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: matchingCategory?.seo?.twitterTitle || categorySeoMeta.title,
  twitterDescription: matchingCategory?.seo?.twitterDescription || categorySeoMeta.description,
  twitterImage: matchingCategory?.seo?.twitterImage?.sourceUrl,
  robots: matchingCategory?.seo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// Canonical URL (използваме категорийния canonical ако е зададен за първата страница)
const canonicalUrl = categorySeoMeta.pageNumber === 1 && matchingCategory?.seo?.canonical ? matchingCategory.seo.canonical : categorySeoMeta.canonicalUrl;

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

// Prev/Next links за pagination SEO (взети от /magazin)
const initialCategoryPrevNextLinks: any[] = [];

if (categorySeoMeta.pageNumber > 1) {
  const prevUrl =
    categorySeoMeta.pageNumber === 2
      ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
      : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${categorySeoMeta.pageNumber - 1}`;

  initialCategoryPrevNextLinks.push({ rel: 'prev', href: prevUrl });
}

// Добавяме next link изначално като placeholder - ще се обновява динамично
const categoryNextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${categorySeoMeta.pageNumber + 1}`;
initialCategoryPrevNextLinks.push({ rel: 'next', href: categoryNextUrl });

useHead({
  link: initialCategoryPrevNextLinks,
});

// Функция за динамично обновяване на next/prev links
const updateCategoryNextPrevLinks = () => {
  const updatedCategoryLinks: any[] = [];

  if (categorySeoMeta.pageNumber > 1) {
    const prevUrl =
      categorySeoMeta.pageNumber === 2
        ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
        : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${categorySeoMeta.pageNumber - 1}`;

    updatedCategoryLinks.push({ rel: 'prev', href: prevUrl });
  }

  if (pageInfo?.hasNextPage) {
    const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${categorySeoMeta.pageNumber + 1}`;
    updatedCategoryLinks.push({ rel: 'next', href: nextUrl });
  }

  useHead({
    link: updatedCategoryLinks,
  });
};

// Извличаме slug и страница от route
const extractRouteParams = () => {
  let slug = '';
  let pageNumber = 1;

  if (route.name === 'produkt-kategoriya-page-pager') {
    // За пагинационния route
    if (route.params.categorySlug) {
      slug = String(route.params.categorySlug);
    }
    if (route.params.pageNumber) {
      const parsed = parseInt(String(route.params.pageNumber));
      if (!isNaN(parsed) && parsed > 0) {
        pageNumber = parsed;
      }
    }
  } else if (route.name === 'produkt-kategoriya-slug') {
    // За обикновения категориен route
    if (route.params.categorySlug) {
      slug = String(route.params.categorySlug);
    }
  } else if (route.params?.slug) {
    // Резервна проверка за стари route-ове
    slug = String(route.params.slug);
  }

  return { slug, pageNumber };
};

// Основна функция за зареждане на продукти
const loadCategoryProducts = async () => {
  const { slug, pageNumber } = extractRouteParams();

  if (!slug) {
    resetProductsState();
    currentSlug.value = '';
    hasEverLoaded.value = true;
    return;
  }

  resetProductsState();
  currentSlug.value = slug;
  currentPageNumber.value = pageNumber;

  try {
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

      await loadProductsPage(pageNumber, [slug], graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница
      await loadProductsPage(pageNumber, [slug]);
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;

    // Обновяваме next/prev links след като данните са заредени
    updateCategoryNextPrevLinks();
  } catch (error) {
    hasEverLoaded.value = true; // Маркираме като опитано дори при грешка
  }
};

// Функция за обновяване на SEO метаданните при промяна на route (като в /magazin)
const updateCategorySeoMeta = () => {
  const newSeoMeta = generateCategorySeoMeta();

  useSeoMeta({
    title: newSeoMeta.title,
    description: newSeoMeta.description,
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
        ? `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}`
        : `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${newSeoMeta.pageNumber - 1}`;

    prevNextLinks.push({ rel: 'prev', href: prevUrl });
  }

  // Next link ще се добави когато знаем че има още страници
  if (pageInfo?.hasNextPage) {
    const nextUrl = `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${slug}/page/${newSeoMeta.pageNumber + 1}`;
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
      updateCategorySeoMeta();
    }
  },
);

// Watcher за pageInfo промени (като в /magazin)
watch(
  () => pageInfo,
  () => {
    if (pageInfo && process.client) {
      updateCategorySeoMeta();
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
          <PaginationServer />
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

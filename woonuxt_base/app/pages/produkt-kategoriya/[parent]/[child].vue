<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, watchEffect } from 'vue';

const { loadProductsPage, loadProductsWithFilters, products, isLoading, resetProductsState } = useProducts();
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
const matchingCategory = ref<Category | null>(null);
const parentCategory = ref<Category | null>(null);

// Зареждаме категориите
const { data: categoriesData } = await useAsyncGql('getProductCategories');
const allCategories = computed(() => categoriesData.value?.productCategories?.nodes || []);

// Функция за намиране на категория по slug в йерархията
const findCategoryInHierarchy = (categories: Category[], slug: string): Category | null => {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    // Проверяваме в децата
    if (category.children?.nodes) {
      const found = findCategoryInHierarchy(category.children.nodes, slug);
      if (found) return found;
    }
  }
  return null;
};

// Безопасно декодиране на URI
const safeDecodeURI = (uri: string): string => {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
};

// Функция за намиране на родителска категория по slug
const findParentCategory = (categories: Category[], parentSlug: string): Category | null => {
  const decodedParentSlug = safeDecodeURI(parentSlug);
  return categories.find((cat) => cat.slug === parentSlug || cat.slug === decodedParentSlug || safeDecodeURI(cat.slug || '') === decodedParentSlug) || null;
};

// Функция за намиране на детска категория в рамките на родител
const findChildInParent = (parent: Category, childSlug: string): Category | null => {
  if (!parent.children?.nodes) return null;
  const decodedChildSlug = safeDecodeURI(childSlug);
  return (
    parent.children.nodes.find(
      (child) => child.slug === childSlug || child.slug === decodedChildSlug || safeDecodeURI(child.slug || '') === decodedChildSlug,
    ) || null
  );
};

// Извличаме route параметри
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

// Основна функция за зареждане
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
    // Изчакваме категориите да се заредят
    if (!categoriesData.value) {
      await nextTick();
      if (!categoriesData.value) {
        hasEverLoaded.value = true;
        return;
      }
    }

    // Намираме родителската категория
    if (allCategories.value.length > 0) {
      parentCategory.value = findParentCategory(allCategories.value, parentSlug);

      if (parentCategory.value) {
        // Намираме детската категория в рамките на родителя
        matchingCategory.value = findChildInParent(parentCategory.value, childSlug);
      }
    }

    // Ако не намерим точно съвпадение, опитваме се да намерим детската категория в цялата йерархия
    if (!matchingCategory.value && allCategories.value.length > 0) {
      matchingCategory.value = findCategoryInHierarchy(allCategories.value, childSlug);
    }

    // Ако няма намерена категория, излизаме
    if (!matchingCategory.value) {
      hasEverLoaded.value = true;
      return;
    }

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

      await loadProductsPage(pageNumber, [childSlug], graphqlOrderBy, filters);
    } else {
      // Ако няма филтри, зареждаме конкретната страница
      await loadProductsPage(pageNumber, [childSlug]);
    }

    // Маркираме че сме зареждали данни поне веднъж
    hasEverLoaded.value = true;
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
    hasEverLoaded.value = true;
  }
};

// SEO данни
const seoTitle = computed(() => {
  if (matchingCategory.value?.seo?.title) {
    return matchingCategory.value.seo.title;
  }
  if (matchingCategory.value?.name) {
    return `${matchingCategory.value.name} | ${parentCategory.value?.name || 'Категории'}`;
  }
  return `${currentChildSlug.value} | ${currentParentSlug.value}`;
});

const seoDescription = computed(() => {
  if (matchingCategory.value?.seo?.metaDesc) {
    return matchingCategory.value.seo.metaDesc;
  }
  if (matchingCategory.value?.description) {
    return matchingCategory.value.description;
  }
  return `Продукти в категория ${matchingCategory.value?.name || currentChildSlug.value}`;
});

const canonicalUrl = computed(() => {
  if (matchingCategory.value?.seo?.canonical) {
    return matchingCategory.value.seo.canonical;
  }
  return `${process.env.APP_HOST || 'https://woonuxt-ten.vercel.app'}/produkt-kategoriya/${currentParentSlug.value}/${currentChildSlug.value}`;
});

const ogTitle = computed(() => {
  return matchingCategory.value?.seo?.opengraphTitle || seoTitle.value;
});

const ogDescription = computed(() => {
  return matchingCategory.value?.seo?.opengraphDescription || seoDescription.value;
});

const ogImage = computed(() => {
  return matchingCategory.value?.seo?.opengraphImage?.sourceUrl || null;
});

const twitterTitle = computed(() => {
  return matchingCategory.value?.seo?.twitterTitle || seoTitle.value;
});

const twitterDescription = computed(() => {
  return matchingCategory.value?.seo?.twitterDescription || seoDescription.value;
});

const twitterImage = computed(() => {
  return matchingCategory.value?.seo?.twitterImage?.sourceUrl || ogImage.value;
});

const metaRobots = computed(() => {
  const noindex = matchingCategory.value?.seo?.metaRobotsNoindex === 'noindex';
  const nofollow = matchingCategory.value?.seo?.metaRobotsNofollow === 'nofollow';

  if (noindex && nofollow) return 'noindex, nofollow';
  if (noindex) return 'noindex';
  if (nofollow) return 'nofollow';
  return 'index, follow';
});

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

// SEO setup - изчакваме данните да се заредят преди да задаваме мета тагове
watchEffect(() => {
  // Задаваме SEO само когато имаме зареденa категория
  if (matchingCategory.value) {
    useSeoMeta({
      title: seoTitle,
      description: seoDescription,
      keywords: matchingCategory.value?.seo?.metaKeywords,
      ogTitle: ogTitle,
      ogDescription: ogDescription,
      ogType: 'website',
      ogUrl: canonicalUrl,
      twitterCard: 'summary_large_image',
      twitterTitle: twitterTitle,
      twitterDescription: twitterDescription,
      robots: metaRobots,
      ogImage: ogImage,
      twitterImage: twitterImage,
    });

    // Canonical URL
    useHead({
      link: [{ rel: 'canonical', href: canonicalUrl.value }],
    });

    // Schema markup
    if (matchingCategory.value?.seo?.schema?.raw) {
      useHead({
        script: [
          {
            type: 'application/ld+json',
            innerHTML: matchingCategory.value.seo.schema.raw,
          },
        ],
      });
    }
  }
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
        <nav v-if="parentCategory && matchingCategory" class="mb-6 text-sm text-gray-600">
          <ol class="flex items-center space-x-2">
            <li>
              <NuxtLink to="/" class="hover:text-gray-900">Начало</NuxtLink>
            </li>
            <li>
              <span class="mx-2">/</span>
              <NuxtLink :to="`/produkt-kategoriya/${parentCategory.slug}`" class="hover:text-gray-900">
                {{ parentCategory.name }}
              </NuxtLink>
            </li>
            <li>
              <span class="mx-2">/</span>
              <span class="text-gray-900 font-medium">{{ matchingCategory.name }}</span>
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
              <div v-if="matchingCategory?.name && parentCategory?.name" class="mt-2">
                <p>Категория: {{ parentCategory.name }} > {{ matchingCategory.name }}</p>
              </div>
            </div>
          </div>
        </NoProductsFound>
      </main>
    </div>
  </div>
</template>

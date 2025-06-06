<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

const { loadProductsPage, loadProductsWithFilters, products, isLoading } = useProducts();
const { buildGraphQLFilters } = useFiltering();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();

// По-детайлно логване за дебъг (премахнато за производство)

// Извличане на slug параметъра от различни източници
let slugFromParams = '';

// 1. Опитваме от route.params.slug
if (route.params && route.params.slug) {
  slugFromParams = typeof route.params.slug === 'string' ? route.params.slug : String(route.params.slug);
}

// 2. Ако липсва, опитваме да го извлечем от path
if (!slugFromParams && route.path) {
  const pathParts = route.path.split('/');
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) slugFromParams = lastPart;
  }
}

// 3. Ако все още липсва, извличаме от fullPath
if (!slugFromParams && route.fullPath) {
  const pathParts = route.fullPath.split('/');
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      const withoutQuery = lastPart.split('?')[0];
      if (withoutQuery) slugFromParams = withoutQuery;
    }
  }
}

// Проверяваме дали slug-а съдържа кирилица или други специални символи
let decodedSlug = slugFromParams;
try {
  if (slugFromParams) {
    decodedSlug = decodeURIComponent(slugFromParams);
  }
} catch (error) {
  console.error('Грешка при декодиране на URL:', error);
}

const slug = ref(slugFromParams);

// Дефинираме типа за категорията
interface Category {
  slug?: string | null;
  name?: string | null;
  databaseId?: number | null;
  id?: string | null;
  description?: string | null;
  count?: number | null;
  uri?: string | null;
  image?: any;
  children?: { nodes: any[] } | null;
  seo?: {
    title?: string | null;
    metaDesc?: string | null;
    metaKeywords?: string | null;
    metaRobotsNoindex?: string | null;
    metaRobotsNofollow?: string | null;
    opengraphTitle?: string | null;
    opengraphDescription?: string | null;
    opengraphImage?: any;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    twitterImage?: any;
    canonical?: string | null;
    schema?: { raw?: string | null } | null;
  } | null;
}

const matchingCategory = ref<Category | null>(null);
const categoryTitle = ref('');
const categoryDescription = ref('');

// Зареждаме категориите
const { data: categoriesData } = await useAsyncGql('getProductCategories');
const allCategories = computed(() => categoriesData.value?.productCategories?.nodes || []);

// Опитваме се първо да намерим категорията
if (slug.value) {
  matchingCategory.value = allCategories.value.find((cat: Category) => cat.slug && (cat.slug === slug.value || cat.slug === decodedSlug)) || null;
}

// Зареждаме продуктите с новата серверна пагинация
try {
  // Проверяваме дали има филтри или сортиране в URL
  const hasFilters = route.query.filter;
  const hasOrderBy = route.query.orderby;
  let filters;
  let graphqlOrderBy = 'DATE';

  if (hasFilters) {
    filters = buildGraphQLFilters();
  }

  if (hasOrderBy) {
    if (route.query.orderby === 'price') graphqlOrderBy = 'PRICE';
    else if (route.query.orderby === 'rating') graphqlOrderBy = 'RATING';
    else if (route.query.orderby === 'alphabetically') graphqlOrderBy = 'NAME_IN';
    else if (route.query.orderby === 'date') graphqlOrderBy = 'DATE';
    else if (route.query.orderby === 'discount') graphqlOrderBy = 'DATE';
  }

  if (matchingCategory.value && matchingCategory.value.slug) {
    // Зареждаме продукти за конкретната категория
    if (hasFilters || hasOrderBy) {
      await loadProductsWithFilters([matchingCategory.value.slug], graphqlOrderBy, filters);
    } else {
      await loadProductsPage(1, [matchingCategory.value.slug]);
    }
  } else if (slug.value) {
    // Опитваме директно със slug-а
    if (hasFilters || hasOrderBy) {
      await loadProductsWithFilters([slug.value], graphqlOrderBy, filters);
    } else {
      await loadProductsPage(1, [slug.value]);
    }
  } else {
    // Зареждаме всички продукти
    if (hasFilters || hasOrderBy) {
      await loadProductsWithFilters(undefined, graphqlOrderBy, filters);
    } else {
      await loadProductsPage(1);
    }
  }
} catch (error) {
  console.error('Грешка при зареждане на продукти:', error);
}

// Използване на SEO данни от Yoast ако са налични
categoryTitle.value = matchingCategory.value?.seo?.title || matchingCategory.value?.name || decodedSlug || 'All Products';
categoryDescription.value =
  matchingCategory.value?.seo?.metaDesc ||
  matchingCategory.value?.description ||
  `Products in category ${matchingCategory.value?.name || decodedSlug || 'All Products'}`;

useHead({
  title: categoryTitle.value,
  meta: [
    { name: 'description', content: categoryDescription.value },
    { property: 'og:title', content: matchingCategory.value?.seo?.opengraphTitle || categoryTitle.value },
    { property: 'og:description', content: matchingCategory.value?.seo?.opengraphDescription || categoryDescription.value },
  ],
  link: [{ rel: 'canonical', href: matchingCategory.value?.seo?.canonical || '' }],
});

// Добавяне на структурирани данни (schema.org) ако са налични в Yoast
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
</script>

<template>
  <div class="container mx-auto px-2 py-6">
    <!-- Loading индикатор -->
    <div v-if="isLoading" class="w-full flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Съдържание когато има продукти -->
    <div v-else-if="products && products.length" class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar с филтри - вляво -->
      <aside v-if="storeSettings.showFilters" class="lg:w-80 flex-shrink-0">
        <div class="sticky top-4">
          <Filters :hide-categories="true" />
        </div>
      </aside>

      <!-- Main съдържание - отдясно -->
      <main class="flex-1 min-w-0">
        <!-- Header с контроли -->
        <div class="flex items-center justify-between w-full gap-4 mb-8">
          <ProductResultCount />
          <div class="flex items-center gap-4">
            <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
            <ShowFilterTrigger v-if="storeSettings.showFilters" class="lg:hidden" />
          </div>
        </div>

        <!-- Grid с продукти -->
        <ProductGrid />
      </main>
    </div>

    <!-- Няма продукти -->
    <NoProductsFound v-else>
      <div class="text-center">
        <h2 class="text-xl font-bold mb-4">{{ slug ? 'No products found in this category.' : 'All Products' }}</h2>
        <div v-if="slug" class="mt-4 text-sm text-gray-600 border p-4 rounded text-left inline-block">
          <p><strong>URL slug:</strong> {{ slug || 'Not provided' }}</p>
          <p><strong>Decoded slug:</strong> {{ decodedSlug || 'Not decoded' }}</p>
        </div>
        <div v-else class="mt-4 text-sm text-gray-600">
          <p>Please select a category from the menu.</p>
        </div>
      </div>
    </NoProductsFound>
  </div>
</template>

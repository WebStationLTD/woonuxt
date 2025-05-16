<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

const { setProducts, updateProductList, products } = useProducts();
const { isQueryEmpty } = useHelpers();
const { storeSettings } = useAppConfig();
const route = useRoute();

// За да контролираме показването на компонентите
const isLoading = ref(true);

// По-детайлно логване за дебъг
console.log('Текущ route:', {
  fullPath: route.fullPath,
  path: route.path,
  name: route.name,
  params: route.params,
});

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

console.log('Извлечен slug:', slugFromParams);

// Проверяваме дали slug-а е празен
if (!slugFromParams) {
  console.log('Използваме всички продукти, тъй като slug е празен');
} else {
  console.log('Slug от URL (преди декодиране):', slugFromParams);
}

// Проверяваме дали slug-а съдържа кирилица или други специални символи
let decodedSlug = slugFromParams;
try {
  if (slugFromParams) {
    decodedSlug = decodeURIComponent(slugFromParams);
    console.log('Декодиран slug:', decodedSlug);
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

  console.log('Намерена категория:', matchingCategory.value);
}

// Ако имаме категория, зареждаме продуктите
if (matchingCategory.value && matchingCategory.value.slug) {
  try {
    const { data: productsData } = await useAsyncGql('getProducts', { slug: [matchingCategory.value.slug] });
    const categoryProducts = productsData.value?.products?.nodes || [];

    if (categoryProducts && categoryProducts.length > 0) {
      console.log(`Заредени ${categoryProducts.length} продукта от категория ${matchingCategory.value.slug}`);
      setProducts(categoryProducts);
    } else {
      // Ако нямаме продукти директно, опитваме да заредим всички и филтрираме
      console.log('Опитваме филтриране по категория ID');
      const { data: allProductsData } = await useAsyncGql('getProducts');
      const allProducts = allProductsData.value?.products?.nodes || [];

      if (allProducts && allProducts.length > 0) {
        console.log(`Заредени ${allProducts.length} общо продукта, филтрираме по категория ID`);

        // Филтриране по категория ID
        if (matchingCategory.value && matchingCategory.value.databaseId) {
          const filteredProducts = allProducts.filter((product: any) =>
            product.productCategories?.nodes?.some((cat: any) => cat.databaseId === matchingCategory.value?.databaseId),
          );

          console.log(`Филтрирани ${filteredProducts.length} продукта по категория ID`);

          if (filteredProducts.length > 0) {
            setProducts(filteredProducts);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    }
  } catch (error) {
    console.error('Грешка при зареждане на продукти:', error);
    setProducts([]);
  }
} else if (slug.value) {
  // Нямаме намерена категория, но опитваме директно със slug-а
  try {
    const { data: productsData } = await useAsyncGql('getProducts', { slug: [slug.value] });
    const categoryProducts = productsData.value?.products?.nodes || [];
    setProducts(categoryProducts || []);
  } catch (error) {
    console.error('Грешка при зареждане на продукти по slug:', error);
    setProducts([]);
  }
} else {
  // Ако нямаме slug, зареждаме всички продукти
  try {
    const { data: allProductsData } = await useAsyncGql('getProducts');
    const allProducts = allProductsData.value?.products?.nodes || [];
    setProducts(allProducts || []);
  } catch (error) {
    console.error('Грешка при зареждане на всички продукти:', error);
    setProducts([]);
  }
}

// Преминаваме към режим "зареден" след кратко време
setTimeout(() => {
  isLoading.value = false;
}, 500);

// Актуализиране на списъка с продукти при нужда
onMounted(() => {
  if (!isQueryEmpty.value) updateProductList();
});

// Следим за промени в заявката
watch(
  () => route.query,
  () => {
    if (route.name !== 'produkt-kategoriya-slug') return;
    updateProductList();
  },
);

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
  <div class="container px-2">
    <div v-if="!isLoading && products && products.length" class="flex items-start gap-16">
      <Filters v-if="storeSettings.showFilters" :hide-categories="true" />

      <div class="w-full">
        <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
          <ProductResultCount />
          <OrderByDropdown class="hidden md:inline-flex" v-if="storeSettings.showOrderByDropdown" />
          <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
        </div>
        <ProductGrid />
      </div>
    </div>
    <div v-else-if="isLoading" class="py-16 text-center">
      <div class="inline-block p-4 text-gray-500">
        <div class="h-8 w-8 border-t-2 border-primary border-solid rounded-full mx-auto animate-spin mb-4"></div>
        <p>Loading products...</p>
      </div>
    </div>
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

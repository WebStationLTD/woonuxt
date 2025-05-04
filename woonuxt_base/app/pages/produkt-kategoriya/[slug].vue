<script setup lang="ts">
import { ref } from 'vue';

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
let slug = '';

// 1. Опитваме от route.params.slug
if (route.params && route.params.slug) {
  slug = typeof route.params.slug === 'string' ? route.params.slug : String(route.params.slug);
}

// 2. Ако липсва, опитваме да го извлечем от path
if (!slug && route.path) {
  const pathParts = route.path.split('/');
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) slug = lastPart;
  }
}

// 3. Ако все още липсва, извличаме от fullPath
if (!slug && route.fullPath) {
  const pathParts = route.fullPath.split('/');
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      const withoutQuery = lastPart.split('?')[0];
      if (withoutQuery) slug = withoutQuery;
    }
  }
}

console.log('Извлечен slug:', slug);

// Проверяваме дали slug-а е празен
if (!slug) {
  console.log('Използваме всички продукти, тъй като slug е празен');
} else {
  console.log('Slug от URL (преди декодиране):', slug);
}

// Проверяваме дали slug-а съдържа кирилица или други специални символи
let decodedSlug = slug;
try {
  if (slug) {
    decodedSlug = decodeURIComponent(slug);
    console.log('Декодиран slug:', decodedSlug);
  }
} catch (error) {
  console.error('Грешка при декодиране на URL:', error);
}

// Функция за зареждане на всички продукти
async function loadAllProducts() {
  console.log('Зареждаме всички продукти');
  try {
    const { data } = await useAsyncGql('getProducts');
    const allProducts = data?.value?.products?.nodes || [];
    console.log(`Заредени ${allProducts.length} продукта`);
    setProducts(allProducts as Product[]);
    return allProducts;
  } catch (error) {
    console.error('Грешка при зареждане на всички продукти:', error);
    setProducts([]);
    return [];
  }
}

// Функция за зареждане на продукти по категория
async function loadProductsByCategory(categorySlug: string) {
  console.log(`Зареждаме продукти по категория: ${categorySlug}`);
  try {
    const { data } = await useAsyncGql('getProducts', { slug: [categorySlug] });
    const categoryProducts = data?.value?.products?.nodes || [];
    console.log(`Заредени ${categoryProducts.length} продукта от категория ${categorySlug}`);
    setProducts(categoryProducts as Product[]);
    return categoryProducts;
  } catch (error) {
    console.error('Грешка при зареждане на продукти по категория:', error);
    setProducts([]);
    return [];
  }
}

// Основна логика за зареждане на данни
async function loadData() {
  try {
    // Зареждаме всички категории за дебъг
    const { data: categoriesData } = await useAsyncGql('getProductCategories');
    const allCategories = categoriesData?.value?.productCategories?.nodes || [];
    console.log(
      'Заредени категории:',
      allCategories.map((cat) => ({
        name: cat.name,
        slug: cat.slug,
        databaseId: cat.databaseId,
      })),
    );

    // Намираме съвпадаща категория ако имаме slug
    let matchingCategory = null;
    let categoryProducts: any[] = [];

    if (slug) {
      // Използваме any тип, за да избегнем типовите проблеми с GraphQL резултатите
      matchingCategory = allCategories.find((cat) => cat.slug && (cat.slug === slug || cat.slug === decodedSlug));

      console.log('Намерена категория:', matchingCategory);

      // Зареждаме продукти по категория
      if (matchingCategory && matchingCategory.slug) {
        categoryProducts = await loadProductsByCategory(matchingCategory.slug);
      } else {
        // Опитваме директно със slug-а
        categoryProducts = await loadProductsByCategory(slug);
      }

      // Ако нямаме продукти, филтрираме всички продукти по категория ID
      if (categoryProducts.length === 0 && matchingCategory && matchingCategory.databaseId) {
        console.log('Опитваме филтриране по ID на категория');
        const allProducts = await loadAllProducts();

        // Филтриране по категория ID
        const filteredProducts = allProducts.filter((product) =>
          product.productCategories?.nodes?.some((cat) => cat.databaseId === matchingCategory?.databaseId),
        );

        console.log(`Филтрирани ${filteredProducts.length} продукта по категория ID`);

        if (filteredProducts.length > 0) {
          setProducts(filteredProducts as Product[]);
          categoryProducts = filteredProducts;
        }
      }
    } else {
      // Ако нямаме slug, показваме всички продукти
      await loadAllProducts();
    }

    // Актуализираме списъка с продукти при нужда
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

    // Задаваме заглавието според намерената категория
    useHead({
      title: `Category: ${matchingCategory?.name || decodedSlug || 'All Products'}`,
      meta: [{ name: 'description', content: `Products in category ${matchingCategory?.name || decodedSlug || 'All Products'}` }],
    });
  } catch (error: any) {
    console.error('Грешка при зареждане на данни:', error);
    if (error.graphQLErrors) {
      console.error('GraphQL грешки:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('Мрежова грешка:', error.networkError);
    }
    setProducts([]);
  } finally {
    // Независимо от резултата, сменяме състоянието на зареждане
    // Забавяме малко смяната на състоянието, за да не мига UI
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  }
}

// Изпълняваме основната логика
loadData();
</script>

<template>
  <div class="container">
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

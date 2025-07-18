<script lang="ts" setup>
import { StockStatusEnum, ProductTypesEnum, type AddToCartInput } from '#woo';

const route = useRoute();
const { storeSettings } = useAppConfig();
const { arraysEqual, formatArray, checkForVariationTypeOfAny } = useHelpers();
const { addToCart, isUpdatingCart } = useCart();
const { t } = useI18n();
const slug = route.params.slug as string;
const runtimeConfig = useRuntimeConfig();
const productCategoryPermalink = runtimeConfig?.public?.PRODUCT_CATEGORY_PERMALINK || '/produkt-kategoriya/';
const { generateTagUrl } = useTagUrls();

const { data } = await useAsyncGql('getProduct', { slug });
if (!data.value?.product) {
  throw showError({ statusCode: 404, statusMessage: t('messages.shop.productNotFound') });
}

const product = ref<Product>(data?.value?.product);
const quantity = ref<number>(1);
const activeVariation = ref<Variation | null>(null);
const variation = ref<VariationAttribute[]>([]);
const indexOfTypeAny = computed<number[]>(() => checkForVariationTypeOfAny(product.value));
const attrValues = ref();
const isSimpleProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.SIMPLE);
const isVariableProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.VARIABLE);
const isExternalProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.EXTERNAL);

const relatedProducts = computed(() => {
  return (product.value.related?.nodes?.slice(0, 4) || []) as Product[];
});

const type = computed(() => activeVariation.value || product.value);
const selectProductInput = computed<any>(() => ({ productId: type.value?.databaseId, quantity: quantity.value })) as ComputedRef<AddToCartInput>;

const mergeLiveStockStatus = (payload: Product): void => {
  product.value.stockStatus = payload.stockStatus ?? product.value?.stockStatus;

  payload.variations?.nodes?.forEach((variation: Variation, index: number) => {
    if (product.value?.variations?.nodes[index]) {
      product.value.variations.nodes[index].stockStatus = variation.stockStatus;
    }
  });
};

onMounted(async () => {
  try {
    const { product } = await GqlGetStockStatus({ slug });
    if (product) mergeLiveStockStatus(product as Product);
  } catch (error: any) {
    // Error loading stock status
  }
});

const updateSelectedVariations = (variations: VariationAttribute[]): void => {
  if (!product.value.variations) return;

  attrValues.value = variations.map((el) => ({ attributeName: el.name, attributeValue: el.value }));
  const clonedVariations = JSON.parse(JSON.stringify(variations));
  const getActiveVariation = product.value.variations?.nodes.filter((variation: any) => {
    // If there is any variation of type ANY set the value to ''
    if (variation.attributes) {
      // Set the value of the variation of type ANY to ''
      indexOfTypeAny.value.forEach((index) => (clonedVariations[index].value = ''));

      return arraysEqual(formatArray(variation.attributes.nodes), formatArray(clonedVariations));
    }
  });

  // Set variation to the selected variation if it exists
  activeVariation.value = getActiveVariation?.[0] || null;

  selectProductInput.value.variationId = activeVariation.value?.databaseId ?? null;
  selectProductInput.value.variation = activeVariation.value ? attrValues.value : null;
  variation.value = variations;
};

const stockStatus = computed(() => {
  if (isVariableProduct.value) {
    return activeVariation.value?.stockStatus || StockStatusEnum.OUT_OF_STOCK;
  }
  return type.value?.stockStatus || StockStatusEnum.OUT_OF_STOCK;
});

const disabledAddToCart = computed(() => {
  const isOutOfStock = stockStatus.value === StockStatusEnum.OUT_OF_STOCK;
  const isInvalidType = !type.value;
  const isCartUpdating = isUpdatingCart.value;
  const isValidActiveVariation = isVariableProduct.value ? !!activeVariation.value : true;
  return isInvalidType || isOutOfStock || isCartUpdating || !isValidActiveVariation;
});

// Извличане на warranty и delivery текст от meta fields
const warrantyText = computed(() => {
  // Търсим по различни възможни ключове за ACF и обикновени meta fields
  const possibleKeys = ['warranty_text', '_warranty_text', 'field_warranty', 'garanciya'];

  for (const key of possibleKeys) {
    const meta = product.value?.metaData?.find((meta: any) => meta.key === key);
    if (meta?.value && !meta.value.startsWith('field_')) {
      return meta.value;
    }
  }

  // Ако не намерим директна стойност, търсим field reference и после стойността
  const fieldRef = product.value?.metaData?.find((meta: any) => meta.key === 'warranty_text' || meta.key === '_warranty_text');

  if (fieldRef?.value?.startsWith('field_')) {
    const actualValue = product.value?.metaData?.find((meta: any) => meta.key === fieldRef.value);
    return actualValue?.value || '';
  }

  return '';
});

const deliveryText = computed(() => {
  // Търсим по различни възможни ключове за ACF и обикновени meta fields
  const possibleKeys = ['free_delivery_text', '_free_delivery_text', 'field_delivery', 'bezplatna_dostavka'];

  for (const key of possibleKeys) {
    const meta = product.value?.metaData?.find((meta: any) => meta.key === key);
    if (meta?.value && !meta.value.startsWith('field_')) {
      return meta.value;
    }
  }

  // Ако не намерим директна стойност, търсим field reference и после стойността
  const fieldRef = product.value?.metaData?.find((meta: any) => meta.key === 'free_delivery_text' || meta.key === '_free_delivery_text');

  if (fieldRef?.value?.startsWith('field_')) {
    const actualValue = product.value?.metaData?.find((meta: any) => meta.key === fieldRef.value);
    return actualValue?.value || '';
  }

  return '';
});

const showProductFeatures = computed(() => {
  return warrantyText.value || deliveryText.value;
});
</script>

<template>
  <main class="container relative py-6 xl:max-w-7xl">
    <div v-if="product">
      <SEOHead :info="product" />
      <Breadcrumb :product class="mb-6" v-if="storeSettings.showBreadcrumbOnSingleProduct" />

      <div class="flex flex-col gap-10 md:flex-row md:justify-between lg:gap-24">
        <div v-if="product.image" class="relative flex-1">
          <OutOfStockBadge :node="type" class="absolute top-4 left-4 z-20" />
          <ProductImageGallery
            class="relative"
            :main-image="product.image"
            :gallery="product.galleryImages!"
            :node="type"
            :activeVariation="activeVariation || {}" />
        </div>
        <div v-else class="relative flex-1">
          <OutOfStockBadge :node="type" class="absolute top-4 left-4 z-20" />
          <NuxtImg class="relative skeleton" src="/images/placeholder.jpg" :alt="product?.name || 'Product'" />
        </div>

        <div class="lg:max-w-md xl:max-w-lg md:py-2 w-full">
          <div class="mb-4">
            <h1 class="flex flex-wrap items-center gap-2 mb-3 text-2xl font-sesmibold">
              {{ type.name }}
              <LazyWPAdminLink :link="`/wp-admin/post.php?post=${product.databaseId}&action=edit`">Edit</LazyWPAdminLink>
            </h1>

            <!-- Цена на отделен ред -->
            <div class="mb-3">
              <ProductPrice class="text-3xl font-bold text-[#dc2626]" :sale-price="type.salePrice" :regular-price="type.regularPrice" />
            </div>

            <StarRating :rating="product.averageRating || 0" :count="product.reviewCount || 0" v-if="storeSettings.showReviews" />
          </div>

          <div class="grid gap-2 my-8 text-sm empty:hidden">
            <!-- Скрит блок за наличност - може да се активира при нужда -->
            <!-- <div v-if="!isExternalProduct" class="flex items-center gap-2">
              <span class="text-gray-400">{{ $t('messages.shop.availability') }}: </span>
              <StockStatus :stockStatus @updated="mergeLiveStockStatus" />
            </div> -->
            <div class="flex items-center gap-2" v-if="storeSettings.showSKU && product.sku">
              <span class="text-gray-400">{{ $t('messages.shop.sku') }}: </span>
              <span>{{ product.sku || 'N/A' }}</span>
            </div>
          </div>

          <div class="mb-8 font-light prose prose-lg max-w-none" v-html="product.shortDescription || product.description" />

          <hr />

          <form @submit.prevent="addToCart(selectProductInput)">
            <AttributeSelections
              v-if="isVariableProduct && product.attributes && product.variations"
              class="mt-4 mb-8"
              :attributes="product.attributes.nodes"
              :defaultAttributes="product.defaultAttributes"
              :variations="product.variations.nodes"
              @attrs-changed="updateSelectedVariations" />
            <div
              v-if="isVariableProduct || isSimpleProduct"
              class="fixed bottom-0 left-0 z-50 flex items-center w-full gap-4 p-4 mt-12 bg-white md:static md:bg-transparent bg-opacity-90 md:p-0">
              <input
                v-model="quantity"
                type="number"
                min="1"
                aria-label="Quantity"
                class="bg-white border rounded-lg flex text-left p-2.5 w-20 gap-4 items-center justify-center focus:outline-none" />
              <AddToCartButton class="flex-1 w-full md:max-w-xs" :disabled="disabledAddToCart" :class="{ loading: isUpdatingCart }" />
            </div>
            <a
              v-if="isExternalProduct && product.externalUrl"
              :href="product.externalUrl"
              target="_blank"
              class="rounded-lg flex font-bold bg-gray-800 text-white text-center min-w-[150px] p-2.5 gap-4 items-center justify-center focus:outline-none">
              {{ product?.buttonText || 'View product' }}
            </a>
          </form>

          <!-- Product Features Section -->
          <div v-if="showProductFeatures" class="my-8">
            <div class="flex flex-col gap-3">
              <div v-if="warrantyText" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-center w-8 h-8 bg-[#9c0100] rounded-full">
                  <Icon name="ion:shield-checkmark" class="text-white" size="18" />
                </div>
                <span class="text-sm font-medium text-gray-700">{{ warrantyText }}</span>
              </div>
              <div v-if="deliveryText" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-center w-8 h-8 bg-[#9c0100] rounded-full">
                  <Icon name="ion:car" class="text-white" size="18" />
                </div>
                <span class="text-sm font-medium text-gray-700">{{ deliveryText }}</span>
              </div>
            </div>
          </div>

          <div v-if="storeSettings.showProductCategoriesOnSingleProduct && product.productCategories">
            <div class="grid gap-2 my-8 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-gray-400">{{ $t('messages.shop.category', 2) }}:</span>
                <div class="product-categories">
                  <NuxtLink
                    v-for="category in product.productCategories.nodes"
                    :key="category.databaseId"
                    :to="
                      category.parent?.node?.slug
                        ? `${productCategoryPermalink}${decodeURIComponent(category.parent.node.slug)}/${decodeURIComponent(category?.slug || '')}`
                        : `${productCategoryPermalink}${decodeURIComponent(category?.slug || '')}`
                    "
                    class="hover:text-primary"
                    :title="category.name"
                    >{{ category.name }}<span class="comma">, </span>
                  </NuxtLink>
                </div>
              </div>
            </div>
            <hr />
          </div>

          <div class="flex flex-wrap gap-4">
            <WishlistButton :product />
            <ShareButton :product />
          </div>
        </div>
      </div>
      <div v-if="product.description || product.reviews" class="my-32">
        <ProductTabs :product />
      </div>

      <!-- Етикети на продукта -->
      <div v-if="product.productTags && product.productTags.nodes && product.productTags.nodes.length > 0" class="my-16">
        <div class="relative bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl p-8 shadow-sm border border-gray-100">
          <!-- Декоративен елемент -->
          <div class="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-20"></div>
          <div class="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full opacity-15"></div>

          <h3 class="text-xl font-semibold text-gray-800 mb-6 relative z-10">Вижте още...</h3>
          <div class="flex flex-wrap gap-4 relative z-10">
            <NuxtLink v-for="tag in product.productTags.nodes" :key="tag.databaseId" :to="generateTagUrl(tag)" :title="tag.name" class="clothing-tag"
              >{{ tag.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="my-32" v-if="relatedProducts.length && storeSettings.showRelatedProducts">
        <div class="mb-4 text-xl font-semibold">{{ $t('messages.shop.youMayLike') }}</div>
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          <div
            v-for="(relatedItem, i) in relatedProducts"
            :key="relatedItem.databaseId"
            class="product-card rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full bg-white p-2 w-full">
            <ProductCard :node="relatedItem" :index="i" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.product-categories > a:last-child .comma {
  display: none;
}

input[type='number']::-webkit-inner-spin-button {
  opacity: 1;
}

/* Стилове за етикети като дрешни етикети */
.clothing-tag {
  position: relative;
  display: inline-block;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 9.5px 16px 9.5px 16px;
  margin-right: 8px;
  text-decoration: none;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: visible;
  margin-left: 18px;
}

/* Заострен връх като стрела отляво - по-дълъг */
.clothing-tag::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
  border-right: 18px solid #6b7280;
}

/* Бяла точица в етикета */
.clothing-tag::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Hover ефект */
.clothing-tag:hover {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.clothing-tag:hover::before {
  border-right-color: #374151;
}

/* Активен ефект */
.clothing-tag:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

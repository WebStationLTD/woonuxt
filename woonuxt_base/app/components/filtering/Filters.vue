<script setup lang="ts">
import { TaxonomyEnum } from '#woo';

const { isFiltersActive } = useFiltering();
const { removeBodyClass } = useHelpers();
const runtimeConfig = useRuntimeConfig();
const { storeSettings } = useAppConfig();

// Props: hide-categories и category-slug за контекстуални филтри
const { hideCategories, categorySlug } = defineProps({
  hideCategories: { type: Boolean, default: false },
  categorySlug: { type: String, default: null },
});

const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as WooNuxtFilter[]) || [];
const taxonomies = globalProductAttributes.map((attr) => {
  // ПОПРАВКА: Не премахваме pa_ префикса, само конвертираме в UPPERCASE и заменяме _
  if (attr?.slug?.startsWith('pa_')) {
    // За pa_ атрибути: pa_размер -> PAРАЗМЕР
    return attr.slug.toUpperCase().replace(/_/g, '') as TaxonomyEnum;
  } else {
    // За останалите: размер -> РАЗМЕР
    return attr?.slug?.toUpperCase() as TaxonomyEnum;
  }
}) as TaxonomyEnum[];

// Function to close mobile filters
const closeMobileFilters = () => {
  removeBodyClass('show-filters');
};

// КОНТЕКСТУАЛНИ VS ГЛОБАЛНИ ФИЛТРИ
let terms: any[] = [];

if (categorySlug && categorySlug.trim().length > 0) {
  // КОНТЕКСТУАЛНИ ФИЛТРИ: Зареждаме термини само от продуктите в тази категория
  console.log('🎯 Зареждам КОНТЕКСТУАЛНИ филтри за категория:', categorySlug);

  try {
    // Зареждаме продуктите от категорията
    const { data: productsData } = await useAsyncGql('getProducts', {
      slug: [categorySlug],
      first: 500,
    });

    const categoryProducts = productsData.value?.products?.nodes || [];
    console.log('🔍 Получени продукти от категорията:', categoryProducts.length);

    if (categoryProducts.length > 0) {
      // Създаваме термини от продуктните данни
      const termMap = new Map<string, any>();

      for (const product of categoryProducts) {
        const productAny = product as any;

        // От product.terms (марки, етикети)
        if (productAny.terms?.nodes) {
          for (const term of productAny.terms.nodes) {
            if (term.slug && term.name && term.taxonomyName) {
              const key = `${term.taxonomyName}-${term.slug}`;
              if (!termMap.has(key)) {
                termMap.set(key, {
                  slug: term.slug,
                  name: term.name,
                  taxonomyName: term.taxonomyName,
                  databaseId: term.databaseId || 0,
                  count: 0,
                });
              }
              termMap.get(key)!.count++;
            }
          }
        }

        // От product.attributes (размери, цветове)
        if (productAny.attributes?.nodes) {
          for (const attr of productAny.attributes.nodes) {
            const taxonomyName = `PA${attr.name?.toUpperCase()?.replace(/\s+/g, '') || 'UNKNOWN'}`;

            // От options (за прости атрибути)
            if (attr.options && Array.isArray(attr.options)) {
              for (const option of attr.options) {
                if (typeof option === 'string' && option.trim()) {
                  const slug = option.toLowerCase().replace(/\s+/g, '-');
                  const key = `${taxonomyName}-${slug}`;
                  if (!termMap.has(key)) {
                    termMap.set(key, {
                      slug: slug,
                      name: option,
                      taxonomyName: taxonomyName,
                      databaseId: 0,
                      count: 0,
                    });
                  }
                  termMap.get(key)!.count++;
                }
              }
            }

            // От terms (за глобални атрибути)
            if (attr.terms?.nodes) {
              for (const term of attr.terms.nodes) {
                if (term.slug && term.name && term.taxonomyName) {
                  const key = `${term.taxonomyName}-${term.slug}`;
                  if (!termMap.has(key)) {
                    termMap.set(key, {
                      slug: term.slug,
                      name: term.name,
                      taxonomyName: term.taxonomyName,
                      databaseId: term.databaseId || 0,
                      count: 0,
                    });
                  }
                  termMap.get(key)!.count++;
                }
              }
            }
          }
        }
      }

      terms = Array.from(termMap.values());
      console.log('✅ Създадени контекстуални термини:', terms.length);
    } else {
      console.log('🔄 FALLBACK: Няма продукти, използвам глобални термини');
      // Fallback към глобални термини
      const { data } = await useAsyncGql('getAllTerms', {
        taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
        hideEmpty: true,
      });
      terms = data.value?.terms?.nodes || [];
    }
  } catch (error) {
    console.error('❌ Грешка при контекстуални филтри:', error);
    // Fallback към глобални термини
    const { data } = await useAsyncGql('getAllTerms', {
      taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
      hideEmpty: true,
    });
    terms = data.value?.terms?.nodes || [];
  }
} else {
  // ГЛОБАЛНИ ФИЛТРИ: Зареждаме всички термини (стария код)
  console.log('🌍 Зареждам ГЛОБАЛНИ филтри');

  let { data } = await useAsyncGql('getAllTerms', { taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY] });
  terms = data.value?.terms?.nodes || [];

  // Ако няма категории, опитваме без hideEmpty (включва и празни категории)
  if (terms.filter((term) => term.taxonomyName === 'product_cat').length === 0) {
    try {
      const fallbackResult = await useAsyncGql('getAllTerms', {
        taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
        hideEmpty: false,
      });

      if (fallbackResult.data.value?.terms?.nodes) {
        terms = fallbackResult.data.value.terms.nodes;
      }

      // Ако и това не работи, опитваме само категории
      if (terms.filter((term) => term.taxonomyName === 'product_cat').length === 0) {
        const categoriesOnlyResult = await useAsyncGql('getAllTerms', {
          taxonomies: [TaxonomyEnum.PRODUCTCATEGORY],
          hideEmpty: false,
          first: 50,
        });

        if (categoriesOnlyResult.data.value?.terms?.nodes) {
          const categoryTerms = categoriesOnlyResult.data.value.terms.nodes;
          terms = [...terms, ...categoryTerms];
        }
      }
    } catch (error) {
      // Тихо игнорираме грешки от fallback заявките
    }
  }
}

// Filter out the product category terms and the global product attributes with their terms
const productCategoryTerms = terms?.filter((term) => term.taxonomyName === 'product_cat') || [];

// ПОПРАВКА: Добавяме по-интелигентно мачване на термините
const attributesWithTerms = globalProductAttributes.map((attr) => {
  // Опитваме точно мачване първо
  let attributeTerms = terms?.filter((term) => term.taxonomyName === attr.slug) || [];

  // ПОПРАВКА: Ако няма точно мачване и имаме pa_ префикс, опитваме с конвертирания формат
  if (attributeTerms.length === 0 && attr.slug?.startsWith('pa_')) {
    // Конвертираме обратно от ENUM към реалното име
    // pa_brands -> PABRANDS -> търсим в terms с taxonomyName = pa_brands
    const enumFormat = attr.slug.toUpperCase().replace(/_/g, '');

    // Намираме кои термини отговарят на този enum
    attributeTerms =
      terms?.filter((term) => {
        if (!term.taxonomyName) return false;
        const termEnumFormat = term.taxonomyName.toUpperCase().replace(/_/g, '');
        return termEnumFormat === enumFormat;
      }) || [];
  }

  // Ако и това не работи, опитваме без pa_ префикса
  if (attributeTerms.length === 0 && attr.slug?.startsWith('pa_')) {
    const slugWithoutPrefix = attr.slug.replace('pa_', '');
    attributeTerms =
      terms?.filter(
        (term) =>
          term.taxonomyName === slugWithoutPrefix ||
          term.taxonomyName === `pa_${slugWithoutPrefix}` ||
          term.taxonomyName?.toLowerCase() === attr.slug?.toLowerCase(),
      ) || [];
  }

  return { ...attr, terms: attributeTerms };
});
</script>

<template>
  <!-- Desktop филтри - остават на мястото си -->
  <aside id="filters" class="hidden md:block">
    <div class="relative z-30 grid mb-12 space-y-8 divide-y">
      <PriceFilter />
      <CategoryFilter v-if="!hideCategories" :terms="productCategoryTerms" />
      <div v-for="attribute in attributesWithTerms" :key="attribute.slug">
        <ColorFilter v-if="attribute.slug == 'pa_color' || attribute.slug == 'pa_colour'" :attribute />
        <GlobalFilter v-else :attribute />
      </div>
      <OnSaleFilter />
      <!-- ВРЕМЕННО СКРИТ - StarRatingFilter -->
      <!-- <LazyStarRatingFilter v-if="storeSettings.showReviews" /> -->
      <LazyResetFiltersButton v-if="isFiltersActive" />
    </div>
  </aside>

  <!-- Mobile филтри - teleport до body -->
  <Teleport to="body">
    <aside id="mobile-filters" class="block md:hidden">
      <!-- Back/Close button -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-50">
        <h2 class="text-lg font-semibold">Филтри</h2>
        <button @click="closeMobileFilters" class="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Затвори филтрите">
          <Icon name="ion:close" size="24" />
        </button>
      </div>

      <div class="p-4">
        <OrderByDropdown class="block w-full mb-4" />
        <div class="relative z-30 grid mb-12 space-y-8 divide-y">
          <PriceFilter />
          <CategoryFilter v-if="!hideCategories" :terms="productCategoryTerms" />
          <div v-for="attribute in attributesWithTerms" :key="attribute.slug">
            <ColorFilter v-if="attribute.slug == 'pa_color' || attribute.slug == 'pa_colour'" :attribute />
            <GlobalFilter v-else :attribute />
          </div>
          <OnSaleFilter />
          <!-- ВРЕМЕННО СКРИТ - StarRatingFilter -->
          <!-- <LazyStarRatingFilter v-if="storeSettings.showReviews" /> -->
          <LazyResetFiltersButton v-if="isFiltersActive" />
        </div>
      </div>
    </aside>
    <div class="fixed inset-0 hidden bg-black bg-opacity-50 filter-overlay" style="z-index: 99998 !important" @click="closeMobileFilters"></div>
  </Teleport>
</template>

<style lang="postcss">
.show-filters .filter-overlay {
  @apply block;
}
.show-filters {
  overflow: hidden;
}

#filters {
  @apply w-[280px];

  & .slider-connect {
    @apply bg-primary;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.price-input {
  @apply border rounded-xl outline-none leading-tight w-full p-2 transition-all;

  &.active {
    @apply border-gray-400 pl-6;
  }
}

@media (max-width: 768px) {
  #mobile-filters {
    @apply bg-white h-full fixed top-0 right-0 w-full max-w-sm transform transition-transform duration-300 ease-in-out translate-x-full overflow-y-auto;
    z-index: 99999 !important;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  }

  .show-filters #mobile-filters {
    @apply translate-x-0;
  }
}
</style>

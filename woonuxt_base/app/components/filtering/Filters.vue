<script setup lang="ts">
import { TaxonomyEnum } from '#woo';

const { isFiltersActive } = useFiltering();
const { removeBodyClass } = useHelpers();
const runtimeConfig = useRuntimeConfig();
const { storeSettings } = useAppConfig();

// hide-categories prop is used to hide the category filter on the product category page
const { hideCategories } = defineProps({ hideCategories: { type: Boolean, default: false } });

const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as WooNuxtFilter[]) || [];
const taxonomies = globalProductAttributes.map((attr) => attr?.slug?.toUpperCase().replace('_', '')) as TaxonomyEnum[];

// Debug информация
console.log('Filters.vue - Loading terms with taxonomies:', [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY]);

// Първо опитваме с hideEmpty: true (default)
let { data, error } = await useAsyncGql('getAllTerms', { taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY] });

let terms = data.value?.terms?.nodes || [];

// Ако няма категории, опитваме без hideEmpty (включва и празни категории)
if (terms.filter((term) => term.taxonomyName === 'product_cat').length === 0) {
  console.log('Filters.vue - No categories found with hideEmpty:true, trying with hideEmpty:false');
  const fallbackResult = await useAsyncGql('getAllTerms', {
    taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
    hideEmpty: false,
  });

  if (fallbackResult.data.value?.terms?.nodes) {
    terms = fallbackResult.data.value.terms.nodes;
    console.log('Filters.vue - Fallback loaded terms:', terms.length);
  }

  // Ако и това не работи, опитваме само категории
  if (terms.filter((term) => term.taxonomyName === 'product_cat').length === 0) {
    console.log('Filters.vue - Still no categories, trying categories only');
    const categoriesOnlyResult = await useAsyncGql('getAllTerms', {
      taxonomies: [TaxonomyEnum.PRODUCTCATEGORY],
      hideEmpty: false,
      first: 50,
    });

    if (categoriesOnlyResult.data.value?.terms?.nodes) {
      const categoryTerms = categoriesOnlyResult.data.value.terms.nodes;
      terms = [...terms, ...categoryTerms];
      console.log('Filters.vue - Categories only loaded:', categoryTerms.length);
    }
  }
}

// Debug за грешки
if (error.value) {
  console.error('Filters.vue - GraphQL error loading terms:', error.value);
}

// Debug за резултатите
console.log('Filters.vue - Total terms loaded:', terms.length);
console.log('Filters.vue - Terms data:', terms);

// Filter out the product category terms and the global product attributes with their terms
const productCategoryTerms = terms?.filter((term) => term.taxonomyName === 'product_cat') || [];

// Debug за категориите
console.log('Filters.vue - Product category terms:', productCategoryTerms.length, productCategoryTerms);

// Filter out the color attribute and the rest of the global product attributes
const attributesWithTerms = globalProductAttributes.map((attr) => ({ ...attr, terms: terms?.filter((term) => term.taxonomyName === attr.slug) || [] }));
</script>

<template>
  <aside id="filters">
    <OrderByDropdown class="block w-full md:hidden" />
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
  <div class="fixed inset-0 z-50 hidden bg-black opacity-25 filter-overlay" @click="removeBodyClass('show-filters')"></div>
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
  #filters {
    @apply bg-white h-full p-8 transform pl-2 transition-all ease-in-out bottom-0 left-4 -translate-x-[110vw] duration-300 overflow-auto fixed;

    box-shadow:
      -100px 0 0 white,
      -200px 0 0 white,
      -300px 0 0 white;
    z-index: 60;
  }

  .show-filters #filters {
    @apply transform-none;
  }
}
</style>

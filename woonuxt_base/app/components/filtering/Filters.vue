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

// Function to close mobile filters
const closeMobileFilters = () => {
  removeBodyClass('show-filters');
};

// Зареждаме terms с fallback стратегия
let { data } = await useAsyncGql('getAllTerms', { taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY] });
let terms = data.value?.terms?.nodes || [];

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

// Filter out the product category terms and the global product attributes with their terms
const productCategoryTerms = terms?.filter((term) => term.taxonomyName === 'product_cat') || [];

// Filter out the color attribute and the rest of the global product attributes
const attributesWithTerms = globalProductAttributes.map((attr) => ({ ...attr, terms: terms?.filter((term) => term.taxonomyName === attr.slug) || [] }));
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

<script setup lang="ts">
import { TaxonomyEnum } from '#woo';
import { useCategoryFilters } from '../../composables/useCategoryFilters';

const { isFiltersActive } = useFiltering();
const { removeBodyClass } = useHelpers();
const runtimeConfig = useRuntimeConfig();
const { storeSettings } = useAppConfig();

// Използваме новия оптимизиран composable за контекстуални филтри
const { loadCategoryFilters, loading: categoryFiltersLoading } = useCategoryFilters();

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

// ⚡ ОПТИМИЗИРАНИ ФИЛТРИ с lazy loading и кеширане
const terms = ref<any[]>([]);
const loadingTerms = ref(false);

// Кеш за глобални термини
const GLOBAL_TERMS_CACHE_KEY = 'woonuxt_global_terms';
const GLOBAL_TERMS_CACHE_DURATION = 10 * 60 * 1000; // 10 минути

const getCachedGlobalTerms = (): any[] | null => {
  if (!process.client) return null;

  try {
    const cached = sessionStorage.getItem(GLOBAL_TERMS_CACHE_KEY);
    if (!cached) return null;

    const { terms: cachedTerms, timestamp } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < GLOBAL_TERMS_CACHE_DURATION) {
      return cachedTerms;
    }

    sessionStorage.removeItem(GLOBAL_TERMS_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

const setCachedGlobalTerms = (termsData: any[]): void => {
  if (!process.client) return;

  try {
    const cacheData = {
      terms: termsData,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(GLOBAL_TERMS_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
};

// Функция за зареждане на термини (lazy)
const loadTerms = async () => {
  if (loadingTerms.value) return;
  loadingTerms.value = true;

  try {
    if (categorySlug && categorySlug.trim().length > 0) {
      // КОНТЕКСТУАЛНИ ФИЛТРИ за категории
      console.log('🎯 Зареждам контекстуални филтри за:', categorySlug);
      const contextualTerms = await loadCategoryFilters(categorySlug);

      if (contextualTerms.length > 0) {
        terms.value = contextualTerms;
        return;
      }

      console.log('🔄 FALLBACK: Зареждам глобални филтри');
    }

    // ГЛОБАЛНИ ФИЛТРИ - първо проверяваме кеша
    const cachedTerms = getCachedGlobalTerms();
    if (cachedTerms && cachedTerms.length > 0) {
      console.log('⚡ КЕШИРАНИ глобални филтри:', cachedTerms.length);
      terms.value = cachedTerms;
      return;
    }

    // Зареждаме глобални термини асинхронно
    console.log('🌐 Зареждам глобални филтри от сървъра...');

    const { data } = await useAsyncGql('getAllTerms', {
      taxonomies: [...taxonomies, TaxonomyEnum.PRODUCTCATEGORY],
      hideEmpty: true,
      first: 200, // Ограничаваме до 200 термина за бързина
    });

    let globalTerms = data.value?.terms?.nodes || [];

    // Fallback логика за категории ако няма резултати
    if (globalTerms.filter((term) => term.taxonomyName === 'product_cat').length === 0) {
      try {
        const categoriesOnlyResult = await useAsyncGql('getAllTerms', {
          taxonomies: [TaxonomyEnum.PRODUCTCATEGORY],
          hideEmpty: false,
          first: 50,
        });

        if (categoriesOnlyResult.data.value?.terms?.nodes) {
          const categoryTerms = categoriesOnlyResult.data.value.terms.nodes;
          globalTerms = [...globalTerms, ...categoryTerms];
        }
      } catch {
        // Ignore fallback errors
      }
    }

    console.log('✅ Заредени глобални филтри:', globalTerms.length);

    // Кешираме резултата
    setCachedGlobalTerms(globalTerms);
    terms.value = globalTerms;
  } catch (error) {
    console.error('❌ Грешка при зареждане на филтри:', error);
    terms.value = [];
  } finally {
    loadingTerms.value = false;
  }
};

// SSR: Зареждаме само ако има categorySlug (контекстуални филтри)
if (categorySlug && categorySlug.trim().length > 0) {
  await loadTerms();
}

// Client: Lazy loading за глобални филтри
onMounted(() => {
  if (!categorySlug || categorySlug.trim().length === 0) {
    // За /magazin - зареждаме асинхронно след mount
    setTimeout(() => {
      loadTerms();
    }, 100);
  }
});

// Filter out the product category terms and the global product attributes with their terms
const productCategoryTerms = computed(() => terms.value?.filter((term: any) => term.taxonomyName === 'product_cat') || []);

// ПОПРАВКА: Добавяме по-интелигентно мачване на термините
const attributesWithTerms = computed(() =>
  globalProductAttributes.map((attr) => {
    // Опитваме точно мачване първо
    let attributeTerms = terms.value?.filter((term: any) => term.taxonomyName === attr.slug) || [];

    // ПОПРАВКА: Ако няма точно мачване и имаме pa_ префикс, опитваме с конвертирания формат
    if (attributeTerms.length === 0 && attr.slug?.startsWith('pa_')) {
      // Конвертираме обратно от ENUM към реалното име
      // pa_brands -> PABRANDS -> търсим в terms с taxonomyName = pa_brands
      const enumFormat = attr.slug.toUpperCase().replace(/_/g, '');

      // Намираме кои термини отговарят на този enum
      attributeTerms =
        terms.value?.filter((term: any) => {
          if (!term.taxonomyName) return false;
          const termEnumFormat = term.taxonomyName.toUpperCase().replace(/_/g, '');
          return termEnumFormat === enumFormat;
        }) || [];
    }

    // Ако и това не работи, опитваме без pa_ префикса
    if (attributeTerms.length === 0 && attr.slug?.startsWith('pa_')) {
      const slugWithoutPrefix = attr.slug.replace('pa_', '');
      attributeTerms =
        terms.value?.filter(
          (term: any) =>
            term.taxonomyName === slugWithoutPrefix ||
            term.taxonomyName === `pa_${slugWithoutPrefix}` ||
            term.taxonomyName?.toLowerCase() === attr.slug?.toLowerCase(),
        ) || [];
    }

    return { ...attr, terms: attributeTerms };
  }),
);
</script>

<template>
  <!-- Desktop филтри - остават на мястото си -->
  <aside id="filters" class="hidden lg:block">
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
    <aside id="mobile-filters" class="block lg:hidden">
      <!-- Back/Close button -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-50">
        <h2 class="text-lg font-semibold">Филтри</h2>
        <button @click="closeMobileFilters" class="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Затвори филтрите">
          <Icon name="ion:close" size="24" />
        </button>
      </div>

      <div class="p-4">
        <div class="mb-4">
          <div class="cursor-pointer flex font-semibold leading-none justify-between items-center mb-3">
            <span>Сортиране</span>
          </div>
          <OrderByDropdown class="w-full" />
        </div>
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

@media (max-width: 1023px) {
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

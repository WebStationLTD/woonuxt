<script setup>
const { getFilter, setFilter, isFiltersActive } = useFiltering();
const route = useRoute();

const props = defineProps({
  terms: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  openByDefault: { type: Boolean, default: true },
  showCount: { type: Boolean, default: false },
});

const isOpen = ref(props.openByDefault);

// Reactive computed за selectedTerms базиран на URL състоянието
const selectedTerms = computed({
  get() {
    // Комбинираме category филтри от URL и route params
    const urlCategoryFilters = getFilter('category') || [];
    const routeCategorySlug = process.client && route.params.categorySlug ? [String(route.params.categorySlug)] : [];

    // Обединяваме и премахваме дубликати
    return [...new Set([...urlCategoryFilters, ...routeCategorySlug])];
  },
  set(newValue) {
    // При промяна обновяваме URL филтрите
    setFilter('category', newValue);
  },
});

// Watcher за URL промени за да синхронизираме checkboxes
watch(
  () => route.query.filter,
  () => {
    // Форсираме reactivity update при промяна на URL филтри
    nextTick();
  },
  { immediate: true },
);

// Watcher за route.params промени (category navigation)
watch(
  () => route.params.categorySlug,
  () => {
    // Форсираме reactivity update при промяна на категорийния route
    nextTick();
  },
  { immediate: true },
);

// Watcher за reset на филтри
watch(isFiltersActive, (newValue) => {
  if (!newValue) {
    // При reset на филтри, setFilter ще се извика автоматично през computed setter
    selectedTerms.value = [];
  }
});

// Update the URL when the checkbox is changed
const checkboxChanged = () => {
  // selectedTerms.value промяната автоматично ще извика computed setter
  // който ще извика setFilter('category', newValue)
};
</script>

<template>
  <div v-if="terms && terms.length">
    <div class="cursor-pointer flex font-semibold mt-8 justify-between items-center" @click="isOpen = !isOpen">
      <span>{{ label || $t('messages.shop.category', 2) }}</span>
      <Icon name="ion:chevron-down-outline" class="transform" :class="isOpen ? 'rotate-180' : ''" />
    </div>
    <div v-show="isOpen" class="mt-3 mr-1 max-h-[120px] grid gap-1.5 overflow-auto custom-scrollbar">
      <div v-for="term in terms" :key="term.slug" class="flex gap-2 items-start">
        <input
          :id="`category-${term.slug}`"
          v-model="selectedTerms"
          type="checkbox"
          :value="term.slug"
          @change="checkboxChanged"
          class="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
        <label :for="`category-${term.slug}`" class="cursor-pointer m-0 text-sm flex-1 leading-tight select-none">
          <span v-html="term.name" />
          <small v-if="showCount" class="ml-1 text-gray-400 tabular-nums" aria-hidden="true">({{ term.count || 0 }})</small>
        </label>
      </div>
    </div>
  </div>
</template>

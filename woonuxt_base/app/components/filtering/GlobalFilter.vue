<script setup lang="ts">
const { getFilter, setFilter, isFiltersActive } = useFiltering();
const route = useRoute();

const { attribute } = defineProps({
  attribute: { type: Object, required: true },
});

// Reactive computed за selectedTerms базиран на URL състоянието
const selectedTerms = computed({
  get() {
    return getFilter(attribute.slug) || [];
  },
  set(newValue) {
    setFilter(attribute.slug, newValue);
  },
});

const filterTitle = ref(attribute.label || attribute.slug);
const isOpen = ref(attribute.openByDefault);

// Watcher за URL промени за да синхронизираме checkboxes
watch(
  () => route.query.filter,
  () => {
    // Форсираме reactivity update при промяна на URL филтри
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
  // който ще извика setFilter(attribute.slug, newValue)
};
</script>

<template>
  <div class="cursor-pointer flex font-semibold mt-8 leading-none justify-between items-center" @click="isOpen = !isOpen">
    <span>{{ filterTitle }}</span>
    <Icon name="ion:chevron-down-outline" class="transform" :class="isOpen ? 'rotate-180' : ''" />
  </div>
  <div v-show="isOpen" class="mt-3 mr-1 max-h-[120px] grid gap-1 overflow-auto custom-scrollbar">
    <div v-for="term in attribute.terms" :key="term.slug" class="flex gap-2 items-center">
      <input
        :id="`${attribute.slug}-${term.slug}`"
        v-model="selectedTerms"
        type="checkbox"
        :value="term.slug"
        @change="checkboxChanged"
        class="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
      <label :for="`${attribute.slug}-${term.slug}`" class="cursor-pointer m-0 text-sm flex items-center flex-wrap select-none">
        <span v-html="term.name" />
        <small v-if="attribute.showCount" class="ml-1 text-gray-400 tabular-nums" aria-hidden="true">({{ term.count || 0 }})</small>
      </label>
    </div>
  </div>
</template>

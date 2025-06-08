<script setup>
const { getFilter, setFilter, isFiltersActive } = useFiltering();
const route = useRoute();

// Reactive computed за selectedTerms базиран на URL състоянието
const selectedTerms = computed({
  get() {
    return getFilter('sale') || [];
  },
  set(newValue) {
    setFilter('sale', newValue);
  },
});

const isOpen = ref(true);

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

const checkboxClicked = (e) => {
  if (selectedTerms.value.length === 0) {
    selectedTerms.value = [e.target.value];
  } else {
    selectedTerms.value = [];
  }
  // selectedTerms.value промяната автоматично ще извика computed setter
};
</script>

<template>
  <div>
    <div class="cursor-pointer flex font-semibold mt-8 leading-none justify-between items-center" @click="isOpen = !isOpen">
      <span>Само продукти с отстъпки</span>
      <Icon name="ion:chevron-down-outline" class="transform" :class="isOpen ? 'rotate-180' : ''" />
    </div>
    <div v-if="isOpen" class="mt-3 mr-1 max-h-[240px] grid gap-1 overflow-auto custom-scrollbar">
      <div class="flex gap-2 items-center">
        <input
          id="sale-true"
          v-model="selectedTerms"
          type="checkbox"
          :value="true"
          aria-label="Sale Products Only"
          class="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          @click="checkboxClicked" />
        <label for="sale-true" class="cursor-pointer m-0 text-sm select-none" aria-label="Only show products on sale"> Само продукти с отстъпки </label>
      </div>
    </div>
  </div>
</template>

<script setup>
const { getSearchQuery, setSearchQuery, clearSearchQuery } = useSearching();
const { getFilter } = useFiltering();

// Използваме реактивен computed за search query
const searchQuery = ref(getSearchQuery());

const reset = () => {
  clearSearchQuery();
  searchQuery.value = '';
};

// Следим промените в search филтъра и синхронизираме с local state
watch(
  () => getFilter('search'),
  (newSearchFilter) => {
    const newValue = newSearchFilter.length > 0 ? newSearchFilter[0] : '';
    if (searchQuery.value !== newValue) {
      searchQuery.value = newValue;
    }
  },
  { immediate: true },
);

// Следим и когато searchQuery е изчистен директно
watch(searchQuery, (newValue) => {
  if (!newValue && getFilter('search').length > 0) {
    clearSearchQuery();
  }
});

// Подобрена submit функция
const handleSearch = async () => {
  if (!searchQuery.value || !searchQuery.value.trim()) {
    // Ако search е празен, изчистваме го
    await setSearchQuery('');
    return;
  }

  // Извикваме setSearchQuery с trimmed стойност
  await setSearchQuery(searchQuery.value.trim());
};
</script>

<template>
  <form class="relative items-center flex-1 -space-x-px rounded-md shadow-sm" @submit.prevent="handleSearch">
    <Icon name="ion:search-outline" size="20" class="absolute z-10 opacity-50 pointer-events-none left-2" />
    <input
      id="product-search-input"
      v-model="searchQuery"
      type="text"
      :placeholder="$t('messages.shop.searchProducts')"
      class="z-0 inline-flex items-center w-full p-2 pl-10 text-sm text-gray-500 border border-gray-300 rounded-md shadow-inner outline-none bg-gray-50 shadow-gray-200" />
    <span
      v-if="searchQuery"
      class="absolute z-10 flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer bg-primary bg-opacity-10 hover:bg-opacity-20 text-primary right-2"
      @click="reset">
      <span>{{ $t('messages.general.clear') }}</span>
      <Icon name="ion:close-outline" size="18" />
    </span>
  </form>
</template>

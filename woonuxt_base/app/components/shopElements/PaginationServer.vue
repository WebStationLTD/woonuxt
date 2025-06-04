<script setup lang="ts">
const { loadProductsPage, loadNextPage, loadPreviousPage, pageInfo, currentPage, isLoading, activeFilters } = useProducts();
const route = useRoute();

const handlePageChange = async (page: number) => {
  if (!isLoading.value && page !== currentPage.value) {
    // Получаваме категорията от route ако има такава
    let categorySlug: string[] | undefined;
    if (route.params.slug) {
      categorySlug = [route.params.slug as string];
    }

    await loadProductsPage(page, categorySlug, undefined, activeFilters);
  }
};

const handleNextPage = async () => {
  if (!isLoading.value && pageInfo.hasNextPage) {
    await loadNextPage();
  }
};

const handlePreviousPage = async () => {
  if (!isLoading.value && currentPage.value > 1) {
    await loadPreviousPage();
  }
};
</script>

<template>
  <div class="flex flex-wrap justify-center mt-8 mb-16 col-span-full tabular-nums">
    <!-- Pagination -->
    <nav v-if="pageInfo.hasNextPage || currentPage > 1" class="flex-wrap inline-flex self-end -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
      <!-- PREV -->
      <button
        @click="handlePreviousPage"
        class="prev"
        :disabled="currentPage <= 1 || isLoading"
        :class="{ 'cursor-not-allowed opacity-50': currentPage <= 1 || isLoading }"
        aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </button>

      <!-- NUMBERS -->
      <button
        v-for="pageNumber in Math.min(currentPage + 2, currentPage + 5)"
        v-show="pageNumber >= Math.max(1, currentPage - 2)"
        :key="pageNumber"
        @click="handlePageChange(pageNumber)"
        :aria-current="pageNumber === currentPage ? 'page' : undefined"
        :disabled="isLoading"
        :class="{ 'opacity-50': isLoading }"
        class="page-number">
        {{ pageNumber }}
      </button>

      <!-- NEXT -->
      <button
        @click="handleNextPage"
        class="next"
        :disabled="!pageInfo.hasNextPage || isLoading"
        :class="{ 'cursor-not-allowed opacity-50': !pageInfo.hasNextPage || isLoading }"
        aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="20" class="w-5 h-5" />
      </button>
    </nav>

    <!-- Loading indicator за пагинация -->
    <div v-if="isLoading" class="flex items-center gap-2 mt-4">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span class="text-sm text-gray-600">Зареждане...</span>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.prev,
.next,
.page-number {
  @apply bg-white border font-medium border-gray-300 text-sm p-2 text-gray-500 relative inline-flex items-center hover:bg-gray-50 focus:z-10 transition-colors;
}

.prev {
  @apply rounded-l-md;
}

.next {
  @apply rounded-r-md;
}

.page-number {
  @apply px-3;
}

.page-number[aria-current='page'] {
  @apply bg-primary border-primary border bg-opacity-10 text-primary z-10;
}

button:disabled {
  @apply cursor-not-allowed;
}

button:disabled:hover {
  @apply bg-white;
}
</style>

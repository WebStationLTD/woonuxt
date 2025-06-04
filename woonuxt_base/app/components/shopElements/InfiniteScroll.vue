<script setup lang="ts">
const { loadNextPage, pageInfo, isLoading } = useProducts();

const loadMore = async () => {
  if (!isLoading.value && pageInfo.hasNextPage) {
    await loadNextPage();
  }
};

// Intersection Observer за автоматично зареждане
const target = ref<HTMLElement>();
const { stop } = useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting && pageInfo.hasNextPage && !isLoading.value) {
      loadMore();
    }
  },
  {
    threshold: 0.1,
  },
);

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div class="w-full flex flex-col items-center gap-4 py-8">
    <!-- Бутон за зареждане на още -->
    <button
      v-if="pageInfo.hasNextPage && !isLoading"
      @click="loadMore"
      class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
      Заредете още продукти
    </button>

    <!-- Loading индикатор -->
    <div v-if="isLoading" class="flex items-center gap-2">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span class="text-gray-600">Зареждане на още продукти...</span>
    </div>

    <!-- Край на продуктите -->
    <div v-else-if="!pageInfo.hasNextPage" class="text-gray-500 text-sm">Заредихте всички продукти</div>

    <!-- Invisible target за intersection observer -->
    <div ref="target" class="h-1 w-1 opacity-0"></div>
  </div>
</template>

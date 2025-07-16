<template>
  <div class="animate-pulse space-y-8">
    <!-- Price Filter Skeleton -->
    <div class="mt-8">
      <div class="h-4 bg-gray-200 rounded w-16 mb-3"></div>
      <div class="grid gap-4 grid-cols-2">
        <div class="h-8 bg-gray-200 rounded"></div>
        <div class="h-8 bg-gray-200 rounded"></div>
      </div>
      <div class="h-4 bg-gray-200 rounded mt-3"></div>
    </div>

    <!-- Category Filter Skeleton (ако не е скрит) -->
    <div v-if="!hideCategories" class="mt-8">
      <div class="h-4 bg-gray-200 rounded w-20 mb-3"></div>
      <div class="space-y-2">
        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        <div class="h-6 bg-gray-200 rounded w-2/3"></div>
        <div class="h-6 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>

    <!-- Attribute Filters Skeleton -->
    <div v-for="i in 2" :key="i" class="mt-8">
      <div class="h-4 bg-gray-200 rounded w-20 mb-3"></div>
      <div class="space-y-2">
        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        <div class="h-6 bg-gray-200 rounded w-1/2"></div>
        <div class="h-6 bg-gray-200 rounded w-2/3"></div>
        <div class="h-6 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>

    <!-- On Sale Filter Skeleton -->
    <div class="mt-8">
      <div class="h-4 bg-gray-200 rounded w-32 mb-3"></div>
      <div class="h-6 bg-gray-200 rounded w-48"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hideCategories } = defineProps({
  hideCategories: { type: Boolean, default: false },
});
</script>

<script setup lang="ts">
// Зареждаме всички категории на статиите
const { data } = await useAsyncGql('GetPostCategories');

const categories = computed(() => {
  return data.value?.categories?.nodes || [];
});
</script>

<template>
  <aside class="space-y-6 lg:sticky lg:top-6 lg:self-start">
    <!-- Категории -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
      <div class="bg-gradient-to-r from-[#9c0100] to-[#7a0100] px-6 py-4">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Icon name="ion:folder-outline" size="20" />
          Категории
        </h3>
      </div>
      
      <div v-if="categories.length" class="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <nav class="space-y-1">
          <NuxtLink
            v-for="category in categories"
            :key="category.id"
            :to="`/category/${category.slug}`"
            class="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-[#9c0100] rounded-lg transition-all duration-200 group"
          >
            <span class="flex items-center gap-2">
              <Icon name="ion:chevron-forward" size="16" class="text-[#9c0100] group-hover:translate-x-1 transition-transform" />
              <span class="font-medium">{{ category.name }}</span>
            </span>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-red-100 group-hover:text-[#9c0100]">
              {{ category.count || 0 }}
            </span>
          </NuxtLink>
        </nav>
      </div>
      
      <div v-else class="p-6 text-center text-gray-500">
        <Icon name="ion:folder-open-outline" size="48" class="mx-auto text-gray-300 mb-2" />
        <p class="text-sm">Няма категории</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Custom scrollbar за категориите */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #9c0100;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #7a0100;
}

/* Firefox scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #9c0100 #f1f1f1;
}
</style>

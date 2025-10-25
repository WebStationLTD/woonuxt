<script setup lang="ts">
interface Props {
  currentPage: number;
  totalPages: number;
  maxVisible?: number;
  useLinks?: boolean; // Ако е true, използва NuxtLink, иначе emit
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5,
  useLinks: true,
});

// Responsive max visible - 3 на мобилно, 5 на desktop
const responsiveMaxVisible = ref(3);

// Проверка за размер на екрана
if (process.client) {
  const updateMaxVisible = () => {
    responsiveMaxVisible.value = window.innerWidth >= 640 ? props.maxVisible : 3;
  };
  
  updateMaxVisible();
  window.addEventListener('resize', updateMaxVisible);
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateMaxVisible);
  });
}

const emit = defineEmits<{
  'update:current-page': [page: number];
}>();

// Изчислява кои номера на страници да се покажат
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const maxVisible = responsiveMaxVisible.value;
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, props.currentPage - half);
  let end = Math.min(props.totalPages, start + maxVisible - 1);
  
  // Регулира start ако сме близо до края
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  // Добавя първа страница и "..."
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('...');
    }
  }
  
  // Добавя видимите страници
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Добавя "..." и последна страница
  if (end < props.totalPages) {
    if (end < props.totalPages - 1) {
      pages.push('...');
    }
    pages.push(props.totalPages);
  }
  
  return pages;
});

// Генерира URL за дадена страница
const getPageUrl = (page: number) => {
  if (page === 1) {
    return '/blog';
  }
  return `/blog/page/${page}`;
};

// Обработва кликване на страница (за client-side пагинация)
const handlePageClick = (page: number) => {
  emit('update:current-page', page);
  // Скролва до началото на страницата
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <nav class="flex items-center justify-center gap-1 sm:gap-2 mt-12 mb-8" aria-label="Pagination">
    <!-- Previous Button -->
    <template v-if="useLinks">
      <NuxtLink
        v-if="currentPage > 1"
        :to="getPageUrl(currentPage - 1)"
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
      >
        <Icon name="ion:chevron-back" size="16" class="sm:w-[18px] sm:h-[18px]" />
        <span class="hidden sm:inline">Предишна</span>
      </NuxtLink>
      <span
        v-else
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
      >
        <Icon name="ion:chevron-back" size="16" class="sm:w-[18px] sm:h-[18px]" />
        <span class="hidden sm:inline">Предишна</span>
      </span>
    </template>
    <template v-else>
      <button
        v-if="currentPage > 1"
        @click="handlePageClick(currentPage - 1)"
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
      >
        <Icon name="ion:chevron-back" size="16" class="sm:w-[18px] sm:h-[18px]" />
        <span class="hidden sm:inline">Предишна</span>
      </button>
      <span
        v-else
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
      >
        <Icon name="ion:chevron-back" size="16" class="sm:w-[18px] sm:h-[18px]" />
        <span class="hidden sm:inline">Предишна</span>
      </span>
    </template>

    <!-- Page Numbers -->
    <div class="flex items-center gap-1 sm:gap-2">
      <template v-for="(page, index) in visiblePages" :key="index">
        <!-- Ellipsis -->
        <span
          v-if="page === '...'"
          class="px-1 sm:px-2 py-2 text-xs sm:text-sm font-medium text-gray-500"
        >
          ...
        </span>
        
        <!-- Current Page -->
        <span
          v-else-if="page === currentPage"
          class="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-bold text-white bg-[#9c0100] rounded-lg shadow-md"
          aria-current="page"
        >
          {{ page }}
        </span>
        
        <!-- Other Pages - with Links -->
        <NuxtLink
          v-else-if="useLinks"
          :to="getPageUrl(page as number)"
          class="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
        >
          {{ page }}
        </NuxtLink>
        
        <!-- Other Pages - with Button -->
        <button
          v-else
          @click="handlePageClick(page as number)"
          class="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
        >
          {{ page }}
        </button>
      </template>
    </div>

    <!-- Next Button -->
    <template v-if="useLinks">
      <NuxtLink
        v-if="currentPage < totalPages"
        :to="getPageUrl(currentPage + 1)"
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
      >
        <span class="hidden sm:inline">Следваща</span>
        <Icon name="ion:chevron-forward" size="16" class="sm:w-[18px] sm:h-[18px]" />
      </NuxtLink>
      <span
        v-else
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
      >
        <span class="hidden sm:inline">Следваща</span>
        <Icon name="ion:chevron-forward" size="16" class="sm:w-[18px] sm:h-[18px]" />
      </span>
    </template>
    <template v-else>
      <button
        v-if="currentPage < totalPages"
        @click="handlePageClick(currentPage + 1)"
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#9c0100] hover:text-[#9c0100] transition-all duration-200"
      >
        <span class="hidden sm:inline">Следваща</span>
        <Icon name="ion:chevron-forward" size="16" class="sm:w-[18px] sm:h-[18px]" />
      </button>
      <span
        v-else
        class="inline-flex items-center gap-1 px-2 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
      >
        <span class="hidden sm:inline">Следваща</span>
        <Icon name="ion:chevron-forward" size="16" class="sm:w-[18px] sm:h-[18px]" />
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  description?: string | null;
  name?: string | null;
  maxHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 120,
});

const isExpanded = ref(false);
const shouldShowButton = ref(false);
const descriptionRef = ref<HTMLElement>();

// Функция за проверка дали е нужен "Виж повече" бутон
const checkIfNeedsExpansion = () => {
  if (!descriptionRef.value) return;

  const element = descriptionRef.value;
  shouldShowButton.value = element.scrollHeight > props.maxHeight;
};

// Проверяваме след mount-ване
onMounted(() => {
  nextTick(() => {
    checkIfNeedsExpansion();
  });
});

// Computed стил за ограничаване на височината
const descriptionStyle = computed(() => {
  if (!shouldShowButton.value || isExpanded.value) {
    return {};
  }

  return {
    maxHeight: `${props.maxHeight}px`,
    overflow: 'hidden',
    position: 'relative' as const,
  };
});

// Функция за toggle на разширяването
const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div v-if="description" class="top-taxonomy-description bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm border border-gray-100">
    <!-- Описание с ограничена височина -->
    <div class="relative">
      <div ref="descriptionRef" :style="descriptionStyle" class="prose prose-sm max-w-none text-gray-700 leading-relaxed" v-html="description"></div>

      <!-- Градиент overlay когато е съкратено -->
      <ClientOnly>
        <div
          v-if="shouldShowButton && !isExpanded"
          class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
      </ClientOnly>
    </div>

    <!-- Бутон "Виж повече" / "Виж по-малко" -->
    <ClientOnly>
      <div v-if="shouldShowButton" class="mt-3 flex justify-center">
        <button
          @click="toggleExpansion"
          class="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium text-xs sm:text-sm shadow-sm">
          <span>{{ isExpanded ? 'Виж по-малко' : 'Виж повече' }}</span>
          <Icon
            :name="isExpanded ? 'ion:chevron-up' : 'ion:chevron-down'"
            size="14"
            class="transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded && !isExpanded }" />
        </button>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.top-taxonomy-description {
  /* Допълнителни стилове при нужда */
}

/* Стилове за prose съдържанието - намалени размери */
.prose :deep(p) {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.prose :deep(p:first-child) {
  margin-top: 0;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  margin-top: 0.25rem;
  margin-bottom: 0.375rem;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.4;
}

.prose :deep(h1:first-child),
.prose :deep(h2:first-child),
.prose :deep(h3:first-child),
.prose :deep(h4:first-child),
.prose :deep(h5:first-child),
.prose :deep(h6:first-child) {
  margin-top: 0;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 0.5rem;
  padding-left: 1.25rem;
  font-size: 0.875rem;
}

.prose :deep(li) {
  margin-bottom: 0.125rem;
  line-height: 1.5;
}

.prose :deep(a) {
  color: #dc2626;
  text-decoration: none;
  font-size: 0.875rem;
}

.prose :deep(a:hover) {
  text-decoration: underline;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}
</style>


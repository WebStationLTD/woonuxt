<script setup lang="ts">
interface Props {
  description?: string | null;
  name?: string | null;
  maxHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 200,
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
  <div v-if="description" class="taxonomy-description bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
    <!-- Заглавие -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-gray-800 mb-2">За {{ name }}</h2>
    </div>

    <!-- Описание с ограничена височина -->
    <div class="relative">
      <div ref="descriptionRef" :style="descriptionStyle" class="prose prose-lg max-w-none text-gray-700 leading-relaxed" v-html="description"></div>

      <!-- Градиент overlay когато е съкратено -->
      <div
        v-if="shouldShowButton && !isExpanded"
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
    </div>

    <!-- Бутон "Виж повече" / "Виж по-малко" -->
    <div v-if="shouldShowButton" class="mt-4 flex justify-center">
      <button
        @click="toggleExpansion"
        class="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-medium shadow-sm">
        <span>{{ isExpanded ? 'Виж по-малко' : 'Виж повече' }}</span>
        <Icon
          :name="isExpanded ? 'ion:chevron-up' : 'ion:chevron-down'"
          size="16"
          class="transition-transform duration-300"
          :class="{ 'rotate-180': isExpanded && !isExpanded }" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.taxonomy-description {
  /* Допълнителни стилове при нужда */
}

/* Стилове за prose съдържанието */
.prose :deep(p) {
  margin-bottom: 1rem;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.prose :deep(li) {
  margin-bottom: 0.25rem;
}

.prose :deep(a) {
  color: #dc2626;
  text-decoration: none;
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

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

// ⚡ LIGHTHOUSE OPTIMIZATION: Native lazy loading за images/videos
// Автоматично добавяме loading="lazy" на всички media елементи
const lazyDescription = computed(() => {
  if (!props.description) return '';
  
  let html = props.description;
  
  // 🎯 Добавяме loading="lazy" на ВСИЧКИ <img> тагове
  // Regex обяснение: Намираме <img които НЯМАТ вече loading атрибут
  html = html.replace(
    /<img(?![^>]*loading=)/gi, 
    '<img loading="lazy" decoding="async"'
  );
  
  // 🎯 Добавяме loading="lazy" на ВСИЧКИ <iframe> тагове (YouTube videos, etc)
  html = html.replace(
    /<iframe(?![^>]*loading=)/gi,
    '<iframe loading="lazy"'
  );
  
  // 🎯 Добавяме loading="lazy" на ВСИЧКИ <video> тагове
  html = html.replace(
    /<video(?![^>]*preload=)/gi,
    '<video preload="none" loading="lazy"'
  );
  
  return html;
});

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
  <div v-if="description" class="second-taxonomy-description bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <!-- Описание с ограничена височина -->
    <div class="relative">
      <div ref="descriptionRef" :style="descriptionStyle" class="prose prose-sm max-w-none text-gray-700 leading-relaxed" v-html="lazyDescription"></div>

      <!-- Градиент overlay когато е съкратено -->
      <ClientOnly>
        <div
          v-if="shouldShowButton && !isExpanded"
          class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
      </ClientOnly>
    </div>

    <!-- Бутон "Виж повече" / "Виж по-малко" -->
    <ClientOnly>
      <div v-if="shouldShowButton" class="mt-4 flex justify-center">
        <button
          @click="toggleExpansion"
          class="inline-flex items-center gap-2 px-6 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-medium shadow-sm">
          <span>{{ isExpanded ? 'Виж по-малко' : 'Виж повече' }}</span>
          <Icon
            :name="isExpanded ? 'ion:chevron-up' : 'ion:chevron-down'"
            size="16"
            class="transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded && !isExpanded }" />
        </button>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.second-taxonomy-description {
  /* Допълнителни стилове при нужда */
}

/* 🎨 TYPOGRAPHY - Йерархия на заглавията */
.prose :deep(h1) {
  font-size: 1.75rem; /* 28px */
  font-weight: 700;
  line-height: 1.3;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.prose :deep(h2) {
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  line-height: 1.35;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
  color: #1f2937;
}

.prose :deep(h3) {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.prose :deep(h4) {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  line-height: 1.45;
  margin-top: 1.25rem;
  margin-bottom: 0.625rem;
  color: #374151;
}

.prose :deep(h5),
.prose :deep(h6) {
  font-size: 1rem; /* 16px */
  font-weight: 600;
  line-height: 1.5;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

/* Първо заглавие без top margin */
.prose :deep(h1:first-child),
.prose :deep(h2:first-child),
.prose :deep(h3:first-child),
.prose :deep(h4:first-child),
.prose :deep(h5:first-child),
.prose :deep(h6:first-child) {
  margin-top: 0;
}

/* 📝 PARAGRAPHS - Оптимизирани разстояния */
.prose :deep(p) {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #4b5563;
}

.prose :deep(p:first-child) {
  margin-top: 0;
}

.prose :deep(p:last-child) {
  margin-bottom: 0;
}

/* 📋 LISTS - Подобрени разстояния */
.prose :deep(ul),
.prose :deep(ol) {
  margin-top: 1rem;
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
  font-size: 0.875rem;
}

.prose :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
  color: #4b5563;
}

.prose :deep(li:last-child) {
  margin-bottom: 0;
}

/* 🔗 LINKS - Brand color */
.prose :deep(a) {
  color: #dc2626;
  text-decoration: none;
  font-size: inherit;
  transition: all 0.2s ease;
}

.prose :deep(a:hover) {
  color: #991b1b;
  text-decoration: underline;
}

/* 💪 TEXT STYLES */
.prose :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.prose :deep(em) {
  font-style: italic;
}

/* 🖼️ IMAGES - Заоблени с сянка като другите в сайта */
.prose :deep(img) {
  border-radius: 0.75rem; /* 12px - като ProductCard */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  height: auto;
  object-fit: cover;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.prose :deep(img:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.prose :deep(img:first-child) {
  margin-top: 0;
}

.prose :deep(img:last-child) {
  margin-bottom: 0;
}

/* 🎥 VIDEOS - Responsive и заоблени */
.prose :deep(video) {
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.prose :deep(video:first-child) {
  margin-top: 0;
}

/* 📺 IFRAMES (YouTube, etc) - Responsive wrapper */
.prose :deep(iframe) {
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
}

.prose :deep(iframe:first-child) {
  margin-top: 0;
}

/* 📦 FIGURE - WordPress image containers */
.prose :deep(figure) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.prose :deep(figure:first-child) {
  margin-top: 0;
}

.prose :deep(figure:last-child) {
  margin-bottom: 0;
}

.prose :deep(figcaption) {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  font-style: italic;
}

/* 🎨 WORDPRESS BLOCKS - Gallery, Image, etc */
.prose :deep(.wp-block-image),
.prose :deep(.wp-block-gallery),
.prose :deep(.wp-block-video) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.prose :deep(.wp-block-image img) {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* ❓ FAQ / DETAILS - Accordion стил */
.prose :deep(details) {
  background: linear-gradient(to bottom right, #f9fafb, #ffffff);
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.prose :deep(details:hover) {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.prose :deep(details[open]) {
  background: #ffffff;
  border-color: #dc2626;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.1);
}

.prose :deep(summary) {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1f2937;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0.75rem;
  transition: color 0.2s ease;
  line-height: 1.5;
  user-select: none;
}

.prose :deep(summary:hover) {
  color: #dc2626;
}

/* Премахваме default arrow */
.prose :deep(summary::-webkit-details-marker) {
  display: none;
}

.prose :deep(summary::marker) {
  display: none;
}

/* Custom arrow с ::after */
.prose :deep(summary::after) {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid #6b7280;
  border-bottom: 2px solid #6b7280;
  transform: rotate(45deg);
  transition: transform 0.3s ease, border-color 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.75rem;
}

.prose :deep(details[open] summary::after) {
  transform: rotate(-135deg);
  border-color: #dc2626;
}

.prose :deep(summary:hover::after) {
  border-color: #dc2626;
}

/* Съдържанието на отговора */
.prose :deep(details p) {
  margin-top: 1rem;
  margin-bottom: 0;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  color: #4b5563;
  line-height: 1.7;
  font-size: 0.875rem;
}

/* Ако има multiple параграфи */
.prose :deep(details p:not(:last-child)) {
  margin-bottom: 0.75rem;
}

/* Ако има списък във FAQ */
.prose :deep(details ul),
.prose :deep(details ol) {
  margin-top: 0.75rem;
  margin-bottom: 0;
  padding-left: 1.5rem;
}

.prose :deep(details li) {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

/* Групи от FAQ елементи - по-малко разстояние между тях */
.prose :deep(details + details) {
  margin-top: 0.5rem;
}

/* Първи и последен елемент */
.prose :deep(details:first-child) {
  margin-top: 0;
}

.prose :deep(details:last-child) {
  margin-bottom: 0;
}

/* 📱 RESPONSIVE - Mobile optimization */
@media (max-width: 640px) {
  .prose :deep(h1) {
    font-size: 1.5rem; /* 24px на mobile */
  }
  
  .prose :deep(h2) {
    font-size: 1.25rem; /* 20px на mobile */
  }
  
  .prose :deep(h3) {
    font-size: 1.125rem; /* 18px на mobile */
  }
  
  .prose :deep(img),
  .prose :deep(video),
  .prose :deep(iframe) {
    border-radius: 0.5rem; /* По-малък radius на mobile */
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  
  .prose :deep(details) {
    padding: 0.75rem 0.875rem;
    border-radius: 0.5rem;
  }
  
  .prose :deep(summary) {
    font-size: 0.875rem; /* 14px на mobile */
  }
}
</style>


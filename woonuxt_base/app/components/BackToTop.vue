<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);

// Показване на бутона след скролване 300px надолу
const checkScroll = () => {
  isVisible.value = window.scrollY > 300;
};

// Плавно скролване към върха
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

// Добавяне на listener за скрол
onMounted(() => {
  window.addEventListener('scroll', checkScroll);
});

// Премахване на listener при unmount
onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll);
});
</script>

<template>
  <Transition name="fade">
    <button
      v-if="isVisible"
      @click="scrollToTop"
      aria-label="Връщане към началото"
      class="fixed bottom-20 sm:bottom-6 right-6 bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg z-50 transition-all duration-300 hover:scale-110">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  </Transition>
</template>

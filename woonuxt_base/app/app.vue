<script setup lang="ts">
import '@/assets/css/gutenberg.css';
const route = useRoute();
const { isShowingCart, toggleCart } = useCart();
const { isShowingMobileMenu, toggleMobileMenu, addBodyClass, removeBodyClass } = useHelpers();
const { siteName } = useAppConfig();

const closeCartAndMenu = () => {
  toggleCart(false);
  toggleMobileMenu(false);
};

watch([isShowingCart, isShowingMobileMenu], () => {
  isShowingCart.value || isShowingMobileMenu.value ? addBodyClass('overflow-hidden') : removeBodyClass('overflow-hidden');
});

watch(
  () => route.path,
  () => closeCartAndMenu(),
);

useHead({
  titleTemplate: `%s - ${siteName}`,
});

// Принудително завършване на loading indicator-а при завършена навигация
const nuxtApp = useNuxtApp();

// Hook за page:finish
nuxtApp.hook('page:finish', () => {
  setTimeout(() => {
    if (process.client) {
      const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
      if (loadingIndicator) {
        (loadingIndicator as HTMLElement).style.width = '100%';
        setTimeout(() => {
          (loadingIndicator as HTMLElement).style.opacity = '0';
        }, 100);
      }
    }
  }, 200);
});

// Допълнителен hook за app:mounted
nuxtApp.hook('app:mounted', () => {
  setTimeout(() => {
    if (process.client) {
      const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
      if (loadingIndicator && getComputedStyle(loadingIndicator).opacity !== '0') {
        (loadingIndicator as HTMLElement).style.width = '100%';
        setTimeout(() => {
          (loadingIndicator as HTMLElement).style.opacity = '0';
        }, 100);
      }
    }
  }, 1000);
});

// Резервна защита с глобален timeout
if (process.client) {
  setTimeout(() => {
    const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
    if (loadingIndicator && getComputedStyle(loadingIndicator).opacity !== '0') {
      (loadingIndicator as HTMLElement).style.width = '100%';
      setTimeout(() => {
        (loadingIndicator as HTMLElement).style.opacity = '0';
      }, 100);
    }
  }, 15000); // 15 секунди максимум
}
</script>

<template>
  <!-- <NuxtLoadingIndicator /> -->
  <div class="flex flex-col min-h-screen">
    <AppHeader />

    <Transition name="slide-from-right">
      <LazyCart v-if="isShowingCart" />
    </Transition>

    <Transition name="slide-from-left">
      <MobileMenu v-if="isShowingMobileMenu" />
    </Transition>

    <NuxtPage />

    <Transition name="fade">
      <div v-if="isShowingCart || isShowingMobileMenu" class="bg-black opacity-25 inset-0 z-40 fixed" @click="closeCartAndMenu" />
    </Transition>

    <LazyAppFooter hydrate-on-visible />

    <!-- Бутон за връщане към началото -->
    <BackToTop />

    <!-- Глобални нотификации -->
    <NotificationContainer />
  </div>
</template>

<style lang="postcss">
html,
body {
  @apply bg-gray-100 text-gray-900;
  scroll-behavior: smooth;
}

img {
  image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
}

pre {
  @apply rounded bg-gray-800 my-8 text-xs text-white p-4 whitespace-pre-wrap overflow-auto;
}

select {
  @apply bg-white border rounded-md font-medium border-gray-300 flex-1 text-sm p-1.5 pr-12 pl-4 text-gray-500 relative inline-flex items-center hover:bg-gray-50 focus:z-20 py-2 px-4 appearance-none;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16'%3E%3Cpath stroke='%23333' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 6l4 4 4-4'/%3E%3C/svg%3E")
    center right 10px no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
}

/* Slide-from-right & Slide-from-left */
.slide-from-right-leave-active,
.slide-from-right-enter-active,
.slide-from-left-leave-active,
.slide-from-left-enter-active {
  transition: transform 300ms ease-in-out;
}

.slide-from-right-enter-from,
.slide-from-right-leave-to {
  transform: translateX(500px);
}

.slide-from-left-enter-from,
.slide-from-left-leave-to {
  transform: translateX(-500px);
}

/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scale Y */
.scale-y-enter-active,
.scale-y-leave-active {
  transition: all 500ms linear;
  will-change: max-height, opacity;
  max-height: 9999px;
  overflow: hidden;
  opacity: 1;
}

.scale-y-enter-from,
.scale-y-leave-to {
  max-height: 0;
  opacity: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.custom-scrollbar::-webkit-scrollbar-track,
.custom-scrollbar::-webkit-scrollbar {
  @apply rounded bg-gray-100 w-1.5;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply rounded bg-gray-400;
}

@keyframes fadeIn {
  0% {
    opacity: 0.001;
  }

  100% {
    opacity: 1;
  }
}

@keyframes fadeDisabledIn {
  0% {
    opacity: 0.001;
  }

  100% {
    opacity: 0.7;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0.001;
  }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 20ms;
}

.page-enter,
.page-leave-to {
  opacity: 0;
}

.page-enter-active {
  animation-duration: 200ms;
  animation-name: fadeIn;
  animation-timing-function: linear;
  backface-visibility: hidden;
}

.page-leave-active {
  animation-name: fadeOut;
  animation-duration: 200ms;
}

@keyframes skelaton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

img.skeleton {
  animation: skelaton 2000ms infinite cubic-bezier(0.4, 0, 0.2, 1);
  background-image: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

input[type='checkbox'],
input[type='radio'] {
  @apply bg-white border rounded-lg cursor-pointer font-sans outline-none border-gray-300 w-full p-3 transition-all duration-150 appearance-none hover:border-primary;

  width: 1em;
  height: 1em;
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
}

input[type='radio'] {
  border-radius: 50%;
}

input[type='checkbox']:after,
input[type='radio']:after {
  content: '';
  display: block;
  opacity: 0;
  transition: all 250ms cubic-bezier(0.65, -0.43, 0.4, 1.71);
}

input[type='checkbox']:after {
  width: 5px;
  height: 9px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(0deg) translate(-1px, 1px) scale(0.75);
  position: absolute;
  top: 3px;
  left: 6.5px;
}

input[type='radio']:after {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: scale(0);
  position: absolute;
  background: #fff;
  top: 4px;
  left: 4px;
}

input[type='checkbox']:checked:after,
input[type='checkbox'] + label,
input[type='radio'] + label {
  @apply cursor-pointer text-gray-600 hover:text-primary;
}

input[type='checkbox']:checked + label,
input[type='radio']:checked + label {
  @apply text-gray-800 hover:text-primary-dark;
}

input[type='checkbox']:checked,
input[type='radio']:checked {
  @apply bg-primary border-0;
}

input[type='checkbox']:checked:after {
  opacity: 1;
  transform: rotate(45deg) translate(-1px, 1px) scale(1);
}

input[type='radio']:checked:after {
  opacity: 1;
  transform: scale(1);
}

/* Глобални responsive стилове за video елементи */
video {
  max-width: 100% !important;
  height: auto !important;
  width: 100% !important;
}

/* Специални стилове за video елементи */
video {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 16 / 9 !important;
}

/* Стилове за WordPress video блокове */
.wp-block-video video,
video {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 16 / 9 !important;
}

/* Стилове за prose съдържание */
.prose video {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 16 / 9 !important;
  border-radius: 8px;
}

/* За стари HTML структури */
p video,
div video {
  max-width: 100% !important;
  height: auto !important;
}

/* Специфично за WordPress .wp-video с inline стилове */
div.wp-video,
.wp-video {
  width: 100% !important;
  max-width: 100% !important;
}

div.wp-video video,
.wp-video video {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
}

/* Още по-специфични селектори за упорити inline стилове */
[class*='wp-video'],
div[style*='width'] {
  width: 100% !important;
  max-width: 100% !important;
}

/* Максимална специфичност за WordPress video containers */
body div.wp-video[style],
body .wp-video[style],
body [class*='wp-video'][style] {
  width: 100% !important;
  max-width: 100% !important;
}

/* За video елементи в тези containers */
body div.wp-video[style] video,
body .wp-video[style] video,
body [class*='wp-video'][style] video {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
}

/* Специални стилове за video елементи */
video {
  object-fit: cover;
  background-color: #000;
  border-radius: 8px;
}

/* WordPress video блокове */
.wp-block-video,
.wp-video {
  width: 100% !important;
  max-width: 100% !important;
}

.wp-block-video video,
.wp-video video {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 16 / 9 !important;
}

/* HTML5 video controls оптимизация */
video::-webkit-media-controls-panel {
  background-color: rgba(0, 0, 0, 0.8);
}

/* Responsive video wrapper (като за iframe) */
.responsive-video-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  border-radius: 8px;
}

.responsive-video-wrapper video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
</style>

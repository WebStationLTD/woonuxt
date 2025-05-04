<!-- Използваме Swiper чрез директно DOM манипулация -->
<script setup lang="ts">
import { ProductsOrderByEnum } from '#woo';

// Дефиниране на типа на Swiper за TypeScript
declare global {
  interface Window {
    Swiper: any;
  }
}

// Взимаме последните 12 нови продукта, сортирани по дата
const { data: newProductsData } = await useAsyncGql('getProducts', {
  first: 12,
  orderby: ProductsOrderByEnum.DATE,
});

const newProducts = computed(() => newProductsData.value?.products?.nodes || []);

// Референция към контейнера на Swiper
const swiperContainerRef = ref(null);
let swiper: any = null;

// Инициализираме Swiper след монтиране на компонента
onMounted(() => {
  // Изчакваме малко, за да сме сигурни, че DOM е готов
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.Swiper && swiperContainerRef.value) {
      swiper = new window.Swiper(swiperContainerRef.value, {
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 20,
        loop: false,
        speed: 600,
        grabCursor: true,
        watchSlidesProgress: true,
        mousewheelControl: true,
        keyboardControl: true,
        navigation: {
          nextEl: '.custom-next-button',
          prevEl: '.custom-prev-button',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        breakpoints: {
          640: {
            slidesPerView: 2,
            slidesPerGroup: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3,
            slidesPerGroup: 1,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            slidesPerGroup: 1,
            spaceBetween: 20,
          },
        },
        on: {
          // Фиксираме стиловете при инициализация
          init: () => {
            setTimeout(() => {
              if (swiper) {
                swiper.update();
              }
            }, 100);
          },
        },
      });
    }
  }, 500);
});

// Унищожаваме Swiper когато компонентът е премахнат
onUnmounted(() => {
  if (swiper) {
    swiper.destroy();
    swiper = null;
  }
});
</script>

<template>
  <section v-if="newProducts.length" class="container my-16">
    <div class="flex items-end justify-between mb-8">
      <h2 class="text-2xl font-semibold md:text-3xl">{{ $t('messages.shop.newArrivals') }}</h2>
      <NuxtLink class="text-primary" to="/products">{{ $t('messages.general.viewAll') }}</NuxtLink>
    </div>

    <client-only>
      <div class="carousel-wrapper">
        <div class="relative carousel-outer-container">
          <!-- Лява стрелка -->
          <button
            class="custom-prev-button absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md w-10 h-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="carousel-container">
            <!-- Swiper контейнер -->
            <div ref="swiperContainerRef" class="swiper product-swiper">
              <div class="swiper-wrapper">
                <!-- Swiper слайдове -->
                <div v-for="(product, index) in newProducts" :key="product.id" class="swiper-slide carousel-slide">
                  <div
                    class="product-card rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full bg-white p-2">
                    <ProductCard :node="product" :index="index" />
                  </div>
                </div>
              </div>

              <!-- Точки за навигация -->
              <div class="swiper-pagination !bottom-0 !relative mt-6"></div>
            </div>
          </div>

          <!-- Дясна стрелка -->
          <button
            class="custom-next-button absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md w-10 h-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </client-only>
  </section>
</template>

<style scoped>
.carousel-wrapper {
  padding: 0 30px; /* Увеличаваме padding за да не се отрязват продуктите */
  max-width: 100%;
  overflow: hidden;
  margin: 0 auto;
}

.carousel-outer-container {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  padding: 0 25px; /* Увеличаваме padding за да имаме място за стрелките */
}

.carousel-container {
  width: 100%;
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* Допълнителни стилове за ProductCard в карусела */
:deep(.carousel-slide .product-card) {
  background-color: white;
  transition: all 0.3s ease;
  height: 100%;
}

:deep(.carousel-slide .product-card:hover) {
  transform: translateY(-5px);
}

:deep(.carousel-slide img) {
  object-fit: cover;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
}

/* Стилизация на стрелките */
.custom-prev-button,
.custom-next-button {
  opacity: 0.8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.custom-prev-button {
  left: -5px;
}

.custom-next-button {
  right: -5px;
}

.custom-prev-button:hover,
.custom-next-button:hover {
  opacity: 1;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  background-color: var(--color-primary, #3b82f6);
}

.custom-prev-button:hover svg,
.custom-next-button:hover svg {
  color: white;
}

/* Стилизация на точките за пагинация */
:deep(.swiper-pagination-bullet) {
  width: 10px;
  height: 10px;
  background-color: #ccc;
  opacity: 0.7;
}

:deep(.swiper-pagination-bullet-active) {
  background-color: var(--color-primary, #3b82f6);
  opacity: 1;
}

/* Фиксиране на контейнера за слайдове */
:deep(.swiper) {
  width: 100%;
  height: auto;
}

:deep(.swiper-wrapper) {
  display: flex;
  height: auto;
}

:deep(.swiper-slide) {
  height: auto;
  display: flex;
  width: calc(25% - 15px) !important; /* Фиксирана ширина за 4 слайда с малко отстояние */
}

/* Responsive настройки */
@media (max-width: 1024px) {
  :deep(.swiper-slide) {
    width: calc(33.333% - 14px) !important; /* 3 слайда на ред */
  }
}

@media (max-width: 768px) {
  :deep(.swiper-slide) {
    width: calc(50% - 10px) !important; /* 2 слайда на ред */
  }
}

@media (max-width: 640px) {
  .carousel-wrapper {
    padding: 0 15px;
  }

  .carousel-outer-container {
    padding: 0 15px;
  }

  .custom-prev-button {
    left: -8px;
  }

  .custom-next-button {
    right: -8px;
  }

  :deep(.swiper-slide) {
    width: 100% !important; /* 1 слайд на ред */
  }
}
</style>

<!-- Използваме Tiny-Slider за по-лека и бърза карусел имплементация -->
<script setup lang="ts">
import { ProductsOrderByEnum } from '#woo';
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue';

// Дефиниране на типа на tns за TypeScript
declare global {
  interface Window {
    tns: any;
  }
}

// Взимаме последните 12 нови продукта, сортирани по дата
const { data: newProductsData } = await useAsyncGql('getProducts', {
  first: 12,
  orderby: ProductsOrderByEnum.DATE,
});

const newProducts = computed(() => newProductsData.value?.products?.nodes || []);

// Референция към контейнера на Tiny-Slider
const sliderContainerRef = ref(null);
let slider: any = null;

// Инициализираме Tiny-Slider след монтиране на компонента
onMounted(() => {
  nextTick(() => {
    if (typeof window !== 'undefined' && window.tns && sliderContainerRef.value) {
      slider = window.tns({
        container: sliderContainerRef.value,
        items: 1,
        slideBy: 'page',
        gutter: 20,
        mouseDrag: true,
        swipeAngle: false,
        speed: 400,
        controlsText: ['', ''],
        controlsContainer: '.slider-controls',
        navPosition: 'bottom',
        loop: false,
        responsive: {
          640: {
            items: 1,
          },
          768: {
            items: 2,
          },
          1024: {
            items: 3,
          },
          1280: {
            items: 4,
          },
          1536: {
            items: 6,
          },
        },
      });
    }
  });
});

// Унищожаваме Tiny-Slider когато компонентът е премахнат
onUnmounted(() => {
  if (slider) {
    slider.destroy();
    slider = null;
  }
});
</script>

<template>
  <section v-if="newProducts.length" class="my-4">
    <div class="flex items-end justify-between mb-8">
      <h2 class="text-2xl font-semibold md:text-3xl px-4">{{ $t('messages.shop.newArrivals') }}</h2>
      <NuxtLink class="text-primary px-4" to="/magazin">{{ $t('messages.general.viewAll') }}</NuxtLink>
    </div>

    <client-only>
      <div class="carousel-wrapper">
        <div class="relative carousel-outer-container">
          <div class="slider-controls">
            <!-- Лява стрелка -->
            <button class="custom-prev-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Дясна стрелка -->
            <button class="custom-next-button">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="carousel-container">
            <!-- Tiny-Slider контейнер -->
            <div ref="sliderContainerRef" class="tiny-slider">
              <div v-for="(product, index) in newProducts" :key="product.id" class="tiny-slide carousel-slide">
                <div
                  class="product-card rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full bg-white p-2">
                  <ProductCard :node="product" :index="index" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </client-only>
  </section>
</template>

<style scoped>
.carousel-wrapper {
  padding: 0 30px;
  max-width: 100%;
  overflow: hidden;
  margin: 0 auto;
  width: 100%;
}

.carousel-outer-container {
  width: 100%;
  position: relative;
  padding: 0 25px; /* Увеличаваме padding за да имаме място за стрелките */
}

.carousel-container {
  width: 100%;
  overflow: hidden;
  padding: 0;
}

.tns-slider.tns-carousel.tns-subpixel.tns-calc.tns-horizontal {
  padding: 1rem 0;
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

/* Настройка на контролите за Tiny-Slider */
.slider-controls {
  position: absolute;
  width: 100%;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 10;
  pointer-events: none;
}

/* Стилизация на стрелките */
.custom-prev-button,
.custom-next-button {
  position: absolute;
  top: 0;
  opacity: 0.8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  background-color: white;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
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
  background-color: var(--color-primary, #9c0100);
}

.custom-prev-button:hover svg,
.custom-next-button:hover svg {
  color: white;
}

/* Стилизация на точките за навигация от Tiny-Slider */
:deep(.tns-nav) {
  text-align: center;
  margin-top: 1.5rem;
}

:deep(.tns-nav button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ccc;
  opacity: 0.7;
  margin: 0 4px;
  border: 0;
  padding: 0;
}

:deep(.tns-nav button.tns-nav-active) {
  background-color: var(--color-primary, #9c0100);
  opacity: 1;
}

/* Responsive настройки */
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
}
</style>

<script setup>
// Хардкоднатите ID на продуктите от WooCommerce
const productIds = [99587, 66564, 62567, 77716, 9402, 97718, 81579];

// Извличаме данните за продуктите по техните ID
const { data } = await useAsyncGql('getProductsByIds', { ids: productIds });
const products = data.value?.products?.nodes || [];

// Организираме продуктите в колони за по-добро визуално представяне
const productColumns = [
  // Първа колона (2 продукта)
  products.slice(0, 2),
  // Втора колона (3 продукта)
  products.slice(2, 5),
  // Трета колона (2 продукта)
  products.slice(5, 7),
];
</script>

<template>
  <div class="relative overflow-hidden bg-gray-800">
    <div class="pt-16 pb-20 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
      <div class="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <div class="sm:max-w-lg">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">Фитнес уреди и аксесоари</h1>
          <p class="mt-4 text-xl text-white">
            Лидерфитнес е водещ вносител и представител на голямо разнообразие от бойна екипировка, фитнес уреди и аксесоари.
          </p>
        </div>
        <div>
          <div class="mt-10">
            <!-- Декоративна мрежа от изображения с реални продукти -->
            <div aria-hidden="false" class="pointer-events-auto lg:absolute lg:inset-y-0 lg:mx-auto lg:w-full lg:max-w-7xl">
              <div class="absolute hidden lg:block transform sm:top-0 sm:left-1/2 sm:translate-x-8 lg:top-1/2 lg:left-1/2 lg:translate-x-8 lg:-translate-y-1/2">
                <div class="flex items-center space-x-6 lg:space-x-8">
                  <!-- Итерираме през колоните с продукти -->
                  <div v-for="(column, columnIndex) in productColumns" :key="`column-${columnIndex}`" class="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                    <!-- Итерираме през продуктите в тази колона -->
                    <div v-for="product in column" :key="product.databaseId" class="h-64 w-44 overflow-hidden rounded-lg relative group shadow-lg">
                      <NuxtLink :to="`/produkt/${product.slug}`" class="block h-full w-full">
                        <!-- Изображение на продукта -->
                        <img
                          v-if="product.image"
                          :src="product.image.producCardSourceUrl"
                          :alt="product.name"
                          class="size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" />
                        <!-- Използваме заместващо изображение, ако не е намерено такова -->
                        <img
                          v-else
                          src="/images/placeholder.jpg"
                          :alt="product.name"
                          class="size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" />

                        <!-- Overlay при hover, който се показва отдолу нагоре -->
                        <div class="absolute inset-0 flex items-end justify-center">
                          <div
                            class="w-full p-3 bg-gradient-to-t from-black/80 to-transparent transform transition-all duration-300 translate-y-full group-hover:translate-y-0">
                            <h3 class="text-sm font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {{ product.name }}
                            </h3>
                            <div
                              v-if="product.price"
                              class="text-xs text-white/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                              {{ product.price }}
                            </div>
                          </div>
                        </div>
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <NuxtLink
              to="/categories"
              class="inline-block relative z-10 cursor-pointer rounded-md border border-transparent bg-[#9c0100] px-8 py-3 text-center font-medium text-white hover:text-black hover:bg-[#ebedeb] transition-colors duration-300">
              Разгледайте колекциите
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Допълнителни стилове за плавни преходи */
.group:hover .group-hover\:translate-y-0 {
  transform: translateY(0);
}
</style>

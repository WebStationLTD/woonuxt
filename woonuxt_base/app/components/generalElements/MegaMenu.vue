<template>
  <Popover v-slot="{ open, close }" class="static lg:relative isolate z-50">
    <PopoverButton class="inline-flex items-center gap-x-1 text-base font-semibold text-gray-500 hover:text-primary focus:outline-none">
      Магазин
      <ChevronDownIcon :class="['h-6 w-6 transition-transform duration-300', open ? 'rotate-180 transform' : '']" aria-hidden="true" />
    </PopoverButton>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <PopoverPanel class="mega-menu-panel">
        <div class="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <!-- Заглавие на менюто -->
            <div class="mb-6 text-center">
              <h3 class="text-xl font-semibold text-gray-900">Категории продукти</h3>
            </div>

            <!-- Loading състояние -->
            <div v-if="pending" class="flex justify-center items-center py-6">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>

            <!-- Показваме категориите в компактен списък -->
            <!-- Десктоп версия -->
            <div v-else-if="productCategories?.length" class="hidden md:grid grid-cols-12 gap-1">
              <div v-for="category in productCategories" :key="category.id" class="group">
                <NuxtLink
                  :to="`/produkt-kategoriya/${category.slug}`"
                  class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 text-center"
                  @click="close">
                  <!-- Иконка или изображение - уголемени за десктоп -->
                  <div class="w-20 h-20 lg:w-24 lg:h-24 mb-3 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      v-if="category.image"
                      :src="category.image.sourceUrl"
                      :alt="category.image.altText || category.name"
                      class="w-full h-full object-cover"
                      loading="lazy" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Icon name="ion:folder-outline" size="32" class="text-gray-400 lg:text-[36px]" />
                    </div>
                  </div>

                  <!-- Име на категорията - уголемен шрифт за десктоп -->
                  <h4
                    class="text-sm md:text-base lg:text-lg font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[2rem] md:min-h-[2.5rem] lg:min-h-[3rem] flex items-center">
                    {{ category.name }}
                  </h4>

                  <!-- Брой продукти - уголемен шрифт за десктоп -->
                  <p class="text-xs md:text-sm lg:text-base text-gray-500 mt-1 font-medium">{{ category.count || 0 }}</p>
                </NuxtLink>
              </div>
            </div>

            <!-- Мобилна версия - компактна grid подредба -->
            <div v-if="productCategories?.length" class="md:hidden">
              <!-- Основни категории в grid -->
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div v-for="category in productCategories.slice(0, 9)" :key="category.id" class="group">
                  <NuxtLink
                    :to="`/produkt-kategoriya/${category.slug}`"
                    class="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-200 text-center"
                    @click="close">
                    <!-- Иконка -->
                    <div class="w-12 h-12 mb-2 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      <img
                        v-if="category.image"
                        :src="category.image.sourceUrl"
                        :alt="category.image.altText || category.name"
                        class="w-full h-full object-cover"
                        loading="lazy" />
                      <div v-else class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <Icon name="ion:folder-outline" size="20" class="text-primary/60" />
                      </div>
                    </div>

                    <!-- Име на категорията -->
                    <h4 class="text-xs font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-tight text-center">
                      {{ category.name }}
                    </h4>

                    <!-- Брой продукти -->
                    <p class="text-[10px] text-gray-500 mt-1">{{ category.count || 0 }}</p>
                  </NuxtLink>
                </div>
              </div>

              <!-- Допълнителни категории като компактен списък -->
              <div v-if="productCategories.length > 9" class="space-y-2">
                <h5 class="text-sm font-medium text-gray-600 px-2">Още категории:</h5>
                <div class="grid grid-cols-2 gap-2">
                  <NuxtLink
                    v-for="category in productCategories.slice(9, 15)"
                    :key="category.id"
                    :to="`/produkt-kategoriya/${category.slug}`"
                    class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 text-xs"
                    @click="close">
                    <div class="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                      <img
                        v-if="category.image"
                        :src="category.image.sourceUrl"
                        :alt="category.image.altText || category.name"
                        class="w-full h-full object-cover"
                        loading="lazy" />
                      <div v-else class="w-full h-full bg-primary/20 flex items-center justify-center">
                        <Icon name="ion:folder-outline" size="12" class="text-primary/60" />
                      </div>
                    </div>
                    <span class="truncate">{{ category.name }}</span>
                  </NuxtLink>
                </div>
              </div>

              <!-- Виж всички категории бутон -->
              <div v-if="productCategories.length > 15" class="mt-4 text-center">
                <NuxtLink
                  to="/categories"
                  class="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/20 transition-all duration-200"
                  @click="close">
                  Виж всички {{ productCategories.length }} категории
                  <Icon name="ion:arrow-forward-outline" size="16" />
                </NuxtLink>
              </div>
            </div>

            <!-- Fallback ако няма категории -->
            <div v-else class="text-center py-6">
              <Icon name="ion:folder-outline" size="32" class="mx-auto text-gray-300 mb-3" />
              <p class="text-gray-500 text-sm">Няма налични категории</p>
            </div>

            <!-- Футър с линкове -->
            <div class="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-4">
              <NuxtLink
                to="/products"
                class="inline-flex items-center gap-2 bg-[#9c0100] text-white px-4 py-2 rounded-md hover:bg-[#000000] transition-colors text-sm font-medium"
                @click="close">
                <Icon name="ion:grid-outline" size="16" />
                Всички продукти
              </NuxtLink>
              <NuxtLink
                to="/categories"
                class="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                @click="close">
                <Icon name="ion:list-outline" size="16" />
                Всички категории
              </NuxtLink>
            </div>

            <!-- Бутон за затваряне на мобилни устройства -->
            <div class="lg:hidden border-t border-gray-200 pt-3 mt-4 text-center">
              <PopoverButton class="inline-flex items-center gap-1 rounded-md py-2 px-3 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none">
                Затвори
                <ChevronDownIcon class="h-4 w-4 rotate-180 transform" aria-hidden="true" />
              </PopoverButton>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { ChevronDownIcon } from '@heroicons/vue/20/solid';

// Зареждаме категориите от админа
const { data, pending } = await useAsyncGql('getProductCategories', {
  first: 20, // Лимитираме до 20 основни категории
  after: null,
  slug: null,
});

// Извличаме категориите от отговора
const productCategories = computed(() => {
  return data.value?.productCategories?.nodes || [];
});
</script>

<style scoped>
/* Премахва outline при активиране на бутони */
button:focus,
a:focus {
  outline: none !important;
  box-shadow: none !important;
}

.mega-menu-panel {
  @apply z-40 bg-white shadow-lg overflow-hidden;

  /* Мобилни устройства */
  @apply block relative;

  /* Десктоп стилове */
  @media (min-width: 1024px) {
    position: fixed;
    top: 110px;
    left: 0;
    right: 0;
    width: 100%;
    background-color: white;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

/* Анимация за ротация на стрелката */
.rotate-180 {
  transform: rotate(180deg);
}

/* Utility класове */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

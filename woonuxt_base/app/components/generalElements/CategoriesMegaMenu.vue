<template>
  <Popover v-slot="{ open, close }" class="static lg:relative isolate z-50">
    <PopoverButton class="inline-flex items-center gap-x-1 text-base font-semibold text-gray-500 hover:text-primary focus:outline-none">
      {{ $t('messages.shop.category', 2) }}
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
          <div class="py-4">
            <!-- Заглавие на менюто -->
            <div class="mb-4 text-center">
              <h3 class="text-lg font-semibold text-gray-900">Всички категории</h3>
            </div>

            <!-- Loading състояние -->
            <div v-if="pending" class="flex justify-center items-center py-6">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>

            <!-- Показваме категориите в компактен списък -->
            <!-- Десктоп версия - компактна -->
            <div v-else-if="allCategories?.length" class="hidden md:grid grid-cols-16 lg:grid-cols-20 gap-2">
              <div v-for="category in allCategories" :key="category.id" class="group">
                <NuxtLink
                  :to="getCategoryUrl(category)"
                  class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 text-center"
                  @click="close">
                  <!-- Малки компактни снимки -->
                  <div class="w-12 h-12 lg:w-14 lg:h-14 mb-2 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      v-if="category.image"
                      :src="category.image.sourceUrl"
                      :alt="category.image.altText || category.name"
                      class="w-full h-full object-cover"
                      loading="lazy" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Icon name="ion:folder-outline" size="20" class="text-gray-400" />
                    </div>
                  </div>

                  <!-- Компактно име на категорията -->
                  <h4
                    class="text-xs lg:text-sm font-medium text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[2rem] flex items-center text-center">
                    {{ category.name }}
                  </h4>
                </NuxtLink>
              </div>
            </div>

            <!-- Мобилна версия - по-големи снимки и 2 колони -->
            <div v-if="allCategories?.length" class="md:hidden">
              <!-- По-големи категории в 2 колони за мобилно -->
              <div class="grid grid-cols-2 gap-4">
                <div v-for="category in allCategories" :key="category.id" class="group">
                  <NuxtLink
                    :to="getCategoryUrl(category)"
                    class="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-200 text-center"
                    @click="close">
                    <!-- По-големи иконки за мобилно -->
                    <div class="w-20 h-20 mb-3 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <img
                        v-if="category.image"
                        :src="category.image.sourceUrl"
                        :alt="category.image.altText || category.name"
                        class="w-full h-full object-cover"
                        loading="lazy" />
                      <div v-else class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <Icon name="ion:folder-outline" size="28" class="text-primary/60" />
                      </div>
                    </div>

                    <!-- По-голямо име на категорията за мобилно -->
                    <h4
                      class="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-tight text-center min-h-[2.5rem] flex items-center">
                      {{ category.name }}
                    </h4>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Fallback ако няма категории -->
            <div v-else class="text-center py-6">
              <Icon name="ion:folder-outline" size="32" class="mx-auto text-gray-300 mb-3" />
              <p class="text-gray-500 text-sm">Няма налични категории</p>
            </div>

            <!-- Футър с линк към категории -->
            <div class="mt-6 pt-4 border-t border-gray-200 text-center">
              <NuxtLink
                to="/categories"
                class="inline-flex items-center gap-3 bg-[#9c0100] text-white px-6 py-3 rounded-xl hover:bg-[#000000] transition-colors text-base font-semibold shadow-md"
                @click="close">
                <Icon name="ion:list-outline" size="20" />
                Всички категории
              </NuxtLink>
            </div>

            <!-- Уголемен бутон за затваряне на мобилни устройства -->
            <div class="lg:hidden border-t border-gray-200 pt-3 mt-4 text-center">
              <PopoverButton
                class="inline-flex items-center gap-2 rounded-xl py-3 px-6 text-base font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none transition-all">
                Затвори
                <ChevronDownIcon class="h-5 w-5 rotate-180 transform" aria-hidden="true" />
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

const { generateCategoryUrl, ensureValidUrl } = useCategoryUrls();

// Зареждаме всички категории за показване в менюто
const { data, pending } = await useAsyncGql('getProductCategories', {
  first: 200, // Зареждаме всички категории, не ограничаваме
  after: null,
  slug: null,
  hideEmpty: true, // За менюто показваме само категории с продукти
});

// Извличаме всички категории от отговора - без ограничение
const allCategories = computed(() => {
  return data.value?.productCategories?.nodes || [];
});

// Функция за генериране на правилен URL за категория
const getCategoryUrl = (category) => {
  return ensureValidUrl(category, allCategories.value);
};
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

/* Компактни grid системи за много категории */
.grid-cols-16 {
  grid-template-columns: repeat(16, minmax(0, 1fr));
}

.grid-cols-20 {
  grid-template-columns: repeat(20, minmax(0, 1fr));
}
</style>

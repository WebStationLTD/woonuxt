<template>
  <Popover v-slot="{ open, close }" class="static lg:relative isolate z-50">
    <PopoverButton class="inline-flex items-center gap-x-1 text-base font-semibold text-gray-500 hover:text-primary focus:outline-none">
      Категории
      <ChevronDownIcon :class="['h-6 w-6 transition-transform duration-300', open ? 'rotate-180 transform' : '']" aria-hidden="true" />
    </PopoverButton>

      <PopoverPanel static v-slot="{ open: panelOpen }" class="mega-menu-panel transition-all duration-200 bg-gradient-to-br from-white via-gray-50 to-red-50/30" :class="{ 'panel-hidden': !open }">
        <div class="mx-auto max-w-7xl px-3 md:px-6 lg:px-8 py-4 md:py-8">
          <!-- Loading състояние -->
          <div v-if="pending" class="flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>

          <!-- Основни категории -->
          <div v-else-if="mainCategories?.length">
            <!-- Desktop/Tablet - 3 колони с hover експанд -->
            <div class="hidden md:grid md:grid-cols-3 gap-4 mb-6">
              <div
                v-for="mainCat in mainCategories"
                :key="mainCat.slug"
                class="group relative">
                <!-- Основна карта -->
                <NuxtLink
                  :to="getCategoryUrl(mainCat)"
                  @click="close"
                  class="block overflow-hidden rounded-xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <!-- Снимка -->
                  <div class="relative h-32 overflow-hidden">
                    <img
                      v-if="mainCat.image"
                      :src="mainCat.image.sourceUrl"
                      :alt="mainCat.image.altText || mainCat.name"
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-primary to-red-700"></div>
                    
                    <!-- Overlay градиент -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    <!-- Име на категорията -->
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                      <h3 class="text-lg font-bold text-white mb-1">{{ mainCat.displayName }}</h3>
                      <p class="text-xs text-white/80 flex items-center gap-1">
                        <Icon name="ion:layers-outline" size="14" />
                        {{ getSubcategories(mainCat.slug).length }} подкатегории
                      </p>
                    </div>
                  </div>

                  <!-- Статичен footer -->
                  <div class="p-3 bg-gray-50 group-hover:bg-white transition-colors">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-gray-600 font-medium">Виж всичко</span>
                      <Icon name="ion:arrow-forward" size="16" class="text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </NuxtLink>

                <!-- Hover панел с всички подкатегории -->
                <div class="absolute top-full left-0 right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div class="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-h-[400px] overflow-y-auto">
                    <!-- Заглавие -->
                    <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <Icon name="ion:grid-outline" size="18" class="text-primary" />
                      <span class="text-sm font-bold text-gray-900">Разгледай категориите</span>
                    </div>
                    
                    <!-- Grid с подкатегории - 2 колони за много категории, 1 за малко -->
                    <div :class="[
                      'gap-2',
                      getSubcategories(mainCat.slug).length > 6 ? 'grid grid-cols-2' : 'space-y-2'
                    ]">
                      <NuxtLink
                        v-for="subCat in getSubcategories(mainCat.slug)"
                        :key="subCat.slug"
                        :to="getCategoryUrl(subCat)"
                        @click="close"
                        class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all group/sub">
                        <Icon name="ion:chevron-forward" size="14" class="text-primary flex-shrink-0 group-hover/sub:translate-x-0.5 transition-transform" />
                        <span class="font-medium leading-tight">{{ subCat.name }}</span>
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile - Много компактен стил -->
            <div class="md:hidden space-y-2 mb-3">
              <div
                v-for="(mainCat, index) in mainCategories"
                :key="mainCat.slug"
                class="border border-gray-200 rounded-lg overflow-hidden">
                <!-- Header -->
                <div class="flex items-center bg-gray-50">
                  <!-- Линк към категорията -->
                  <NuxtLink
                    :to="getCategoryUrl(mainCat)"
                    @click="close"
                    class="flex-1 min-w-0 px-3 py-2.5">
                    <h3 class="text-sm font-bold text-gray-900 truncate">{{ mainCat.displayName }}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">{{ getSubcategories(mainCat.slug).length }} категории</p>
                  </NuxtLink>

                  <!-- Бутон за разгъване -->
                  <button
                    @click="toggleMobileCategory(index)"
                    class="px-3 py-3 border-l border-gray-200 active:bg-gray-100 flex-shrink-0">
                    <Icon
                      name="ion:chevron-down"
                      size="18"
                      :class="['text-primary transition-transform duration-200', expandedMobileCategories[index] ? 'rotate-180' : '']" />
                  </button>
                </div>

                <!-- Подкатегории -->
                <div
                  :class="[
                    'overflow-hidden transition-all duration-300 bg-white',
                    expandedMobileCategories[index] ? 'max-h-[500px]' : 'max-h-0'
                  ]">
                  <div class="p-2 space-y-0.5">
                    <NuxtLink
                      v-for="subCat in getSubcategories(mainCat.slug)"
                      :key="subCat.slug"
                      :to="getCategoryUrl(subCat)"
                      @click="close"
                      class="flex items-start gap-1.5 px-2 py-1.5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 rounded active:bg-gray-100">
                      <Icon name="ion:chevron-forward" size="12" class="text-primary flex-shrink-0 mt-1" />
                      <span class="leading-tight">{{ subCat.name }}</span>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>

            <!-- Бързи линкове -->
            <div class="flex flex-wrap justify-center gap-2 pt-3 md:pt-4 border-t border-gray-200">
              <NuxtLink
                to="/magazin"
                class="inline-flex items-center gap-1.5 md:gap-2 bg-[#9c0100] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-[#7a0100] transition-colors text-xs md:text-sm font-semibold"
                @click="close">
                <Icon name="ion:grid-outline" size="14" class="md:w-4 md:h-4" />
                Всички продукти
              </NuxtLink>
              <NuxtLink
                to="/categories"
                class="inline-flex items-center gap-1.5 md:gap-2 bg-gray-100 text-gray-700 px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-semibold"
                @click="close">
                <Icon name="ion:list-outline" size="14" class="md:w-4 md:h-4" />
                Всички категории
              </NuxtLink>
            </div>
          </div>

          <!-- Fallback -->
          <div v-else class="text-center py-8">
            <Icon name="ion:folder-outline" size="48" class="mx-auto text-gray-300 mb-3" />
            <p class="text-gray-500 text-sm">Няма налични категории</p>
          </div>
        </div>
      </PopoverPanel>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { ChevronDownIcon } from '@heroicons/vue/20/solid';
import { ref } from 'vue';

const { generateCategoryUrl, ensureValidUrl } = useCategoryUrls();

// Зареждаме всички категории
const { data, pending } = await useAsyncGql('getProductCategories', {
  first: 100,
  after: null,
  slug: null,
  hideEmpty: true,
});

// Извличаме всички категории
const allCategories = computed(() => {
  return data.value?.productCategories?.nodes || [];
});

// Филтрираме само родителските категории (без parent)
const mainCategories = computed(() => {
  const parents = allCategories.value.filter((cat) => !cat.parent?.node);
  
  // Търсим конкретните 3 основни категории по slug
  const categoryOrder = ['бокс', 'дрехи', 'фитнес-оборудване-и-аксесоари'];
  
  const categories = categoryOrder
    .map((slug) => parents.find((cat) => cat.slug === slug))
    .filter(Boolean); // Премахваме undefined стойности
  
  // Мапваме имената за по-user-friendly изглед
  return categories.map(cat => ({
    ...cat,
    displayName: cat.slug === 'бокс' ? 'Бойни спортове' : cat.name
  }));
});

// Функция за получаване на подкатегориите за дадена родителска категория
const getSubcategories = (parentSlug) => {
  return allCategories.value.filter((cat) => cat.parent?.node?.slug === parentSlug);
};

// Функция за генериране на правилен URL за категория
const getCategoryUrl = (category) => {
  return ensureValidUrl(category, allCategories.value);
};

// Състояние за разгънати категории на мобилно
const expandedMobileCategories = ref({});

const toggleMobileCategory = (index) => {
  expandedMobileCategories.value[index] = !expandedMobileCategories.value[index];
};
</script>

<style scoped>
.mega-menu-panel {
  z-index: 40;
  background-color: white;
  box-shadow: 0 20px 25px -3px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  display: block;
  position: relative;

  /* Десктоп стилове */
  @media (min-width: 1024px) {
    position: fixed;
    top: 110px;
    left: 0;
    right: 0;
    width: 100%;
    background-color: white;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
}

/* Скриваме визуално, но запазваме в DOM за SEO */
.panel-hidden {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

/* Скролбар стилове за hover панела */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #9c0100;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #7a0100;
}
</style>


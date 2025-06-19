<script setup lang="ts">
const { FALLBACK_IMG } = useHelpers();
const { generateCategoryUrl, safeDecodeURI } = useCategoryUrls();

const props = defineProps({
  categoryId: { type: Number, default: 21 }, // По подразбиране ще показваме категория с ID 21 (Бокс)
});

// Получаване на данните за категорията чрез GraphQL заявка
const { data } = await useAsyncGql('getProductCategories', { hideEmpty: true });
const allCategories = data.value?.productCategories?.nodes || [];

// Намиране на категорията по ID
const category = computed(() => {
  return allCategories.find((cat) => cat.databaseId === props.categoryId);
});

// Извличане на подкатегориите от избраната категория
const subcategories = computed(() => {
  return category.value?.children?.nodes || [];
});

// Функция за генериране на правилен URL за категория
const getCategoryUrl = (category: any) => {
  return generateCategoryUrl(category, allCategories);
};
</script>

<template>
  <section v-if="category" class="my-16">
    <div class="container mx-auto w-full lg:w-4/5">
      <!-- Банер за категорията с линк към страницата на категорията -->
      <div class="flex flex-col md:flex-row rounded-xl overflow-hidden mb-8 relative category-banner">
        <div class="bg-gray-800 text-white p-6 flex items-center md:w-1/2 h-[120px] black-bg">
          <NuxtLink :to="getCategoryUrl(category)" class="text-2xl md:text-3xl lg:text-4xl font-bold hover:text-primary transition-colors">
            {{ category.name }}
          </NuxtLink>
        </div>
        <div class="md:w-1/2 h-[120px] overflow-hidden">
          <NuxtImg
            class="w-full h-full object-cover"
            :src="category.image?.sourceUrl || FALLBACK_IMG"
            :alt="category.name || ''"
            sizes="sm:100vw md:50vw"
            placeholder
            placeholder-class="blur-xl" />
        </div>
      </div>

      <!-- Подкатегории -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="subcategory in subcategories"
          :key="subcategory.databaseId"
          :to="getCategoryUrl(subcategory)"
          class="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all">
          <!-- <div class="w-full h-48 overflow-hidden mb-4 rounded-lg">
            <NuxtImg
              class="w-full h-full object-cover"
              :src="subcategory.image?.sourceUrl || FALLBACK_IMG"
              :alt="subcategory.name || ''"
              loading="lazy"
              sizes="sm:100vw md:50vw lg:33vw"
              placeholder
              placeholder-class="blur-sm" />
          </div> -->
          <span class="text-center text-lg font-semibold">{{ subcategory.name }}</span>
          <span class="text-sm text-gray-500">({{ subcategory.count }} продукта)</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 768px) {
  .container {
    width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Стил за черния триъгълник */
@media (min-width: 768px) {
  .black-bg {
    position: relative;
  }
  .black-bg::after {
    content: '';
    position: absolute;
    top: 0;
    right: -30px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 60px 0 60px 30px;
    border-color: transparent transparent transparent #1f2937; /* bg-gray-800 цвят */
    z-index: 10;
  }
}
</style>

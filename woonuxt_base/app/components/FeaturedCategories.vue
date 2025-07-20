<script setup lang="ts">
interface Category {
  slug?: string | null;
  name?: string | null;
  databaseId?: number | null;
  image?: {
    sourceUrl?: string | null;
    altText?: string | null;
    title?: string | null;
  } | null;
  parent?: {
    node?: {
      slug?: string | null;
      name?: string | null;
    } | null;
  } | null;
  children?: {
    nodes?: Category[] | null;
  } | null;
}

const { FALLBACK_IMG } = useHelpers();
const { generateCategoryUrl } = useCategoryUrls();

const props = defineProps({
  categories: { type: Array as PropType<Category[]>, required: true },
});

// Филтрираме само родителските категории (без parent)
const parentCategories = computed(() => {
  return props.categories.filter((cat) => !cat.parent?.node);
});

// Получаваме подкатегориите за дадена родителска категория
const getSubcategories = (parentCategory: Category): Category[] => {
  return props.categories.filter((cat) => cat.parent?.node?.slug === parentCategory.slug);
};

// Генерираме правилния URL за категорията
const getCategoryUrl = (category: Category): string => {
  return generateCategoryUrl(category, props.categories);
};
</script>

<template>
  <section class="py-8 px-0 sm:px-4">
    <div v-for="(parentCategory, index) in parentCategories" :key="parentCategory.slug || index" class="mb-12">
      <!-- Родителска категория - широк правоъгълник -->
      <div class="mx-auto w-[95%] lg:w-[80%]">
        <NuxtLink
          :to="getCategoryUrl(parentCategory)"
          class="relative block overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
          <!-- Hero снимка -->
          <div class="relative h-24 md:h-32 lg:h-40">
            <NuxtImg
              :src="parentCategory.image?.sourceUrl || FALLBACK_IMG"
              :alt="parentCategory.image?.altText || parentCategory.name || ''"
              :title="parentCategory.image?.title || parentCategory.name || ''"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
              sizes="(max-width: 768px) 95vw, 80vw" />
            <!-- Overlay градиент -->
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

            <!-- Заглавие на категорията -->
            <div class="absolute inset-0 flex items-center justify-start">
              <h2 class="text-white text-2xl md:text-4xl lg:text-5xl font-bold px-8 drop-shadow-lg">
                {{ parentCategory.name }}
              </h2>
            </div>
          </div>
        </NuxtLink>

        <!-- Подкатегории в grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <NuxtLink
            v-for="(subcategory, subIndex) in getSubcategories(parentCategory)"
            :key="subcategory.slug || subIndex"
            :to="getCategoryUrl(subcategory)"
            class="group block">
            <div
              class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary/20 p-4 md:p-6 min-h-[80px] flex items-center justify-center">
              <!-- Име на подкатегорията -->
              <h3 class="text-sm md:text-base font-semibold text-gray-800 group-hover:text-primary transition-colors duration-300 text-center leading-tight">
                {{ subcategory.name }}
              </h3>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Допълнителни стилове ако е нужно */
</style>

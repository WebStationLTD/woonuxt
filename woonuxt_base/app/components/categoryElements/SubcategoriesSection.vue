<script setup lang="ts">
interface Category {
  slug?: string | null;
  name?: string | null;
  databaseId?: number | null;
  count?: number | null;
  description?: string | null;
  image?: {
    sourceUrl?: string | null;
    altText?: string | null;
    title?: string | null;
  } | null;
  parent?: {
    node?: {
      slug?: string | null;
      name?: string | null;
      databaseId?: number | null;
    } | null;
  } | null;
  children?: {
    nodes?: Category[] | null;
  } | null;
}

interface Props {
  category: Category;
}

const props = defineProps<Props>();

const { FALLBACK_IMG } = useHelpers();
const { generateCategoryUrl } = useCategoryUrls();

// Получаваме подкатегориите от текущата родителска категория
const subcategories = computed(() => {
  return props.category?.children?.nodes || [];
});

// Проверяваме дали има подкатегории за показване
const hasSubcategories = computed(() => {
  return subcategories.value.length > 0;
});

// Генерираме правилния URL за подкатегория
const getSubcategoryUrl = (subcategory: Category): string => {
  if (!props.category?.slug || !subcategory?.slug) return '/';

  // За подкатегориите използваме формата: /produkt-kategoriya/parent-slug/child-slug
  return `/produkt-kategoriya/${props.category.slug}/${subcategory.slug}`;
};
</script>

<template>
  <section v-if="hasSubcategories" class="mb-8 lg:mb-12">
    <!-- Заглавие на секцията -->
    <div class="mb-6">
      <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Подкатегории в {{ category.name }}</h2>
      <p class="text-gray-600">Изберете конкретна подкатегория за по-специализирани продукти</p>
    </div>

    <!-- Grid с подкатегории -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
      <NuxtLink
        v-for="(subcategory, index) in subcategories"
        :key="subcategory.slug || subcategory.databaseId || index"
        :to="getSubcategoryUrl(subcategory)"
        class="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
        <!-- Снимка на подкатегорията -->
        <div class="aspect-[4/3] overflow-hidden bg-gray-50">
          <NuxtImg
            :src="subcategory.image?.sourceUrl || FALLBACK_IMG"
            :alt="subcategory.image?.altText || subcategory.name || ''"
            :title="subcategory.image?.title || subcategory.name || ''"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw" />
        </div>

        <!-- Информация за подкатегорията -->
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 text-sm lg:text-base group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {{ subcategory.name }}
          </h3>

          <!-- Брой продукти -->
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span v-if="subcategory.count !== null && subcategory.count !== undefined">
              {{ subcategory.count }} {{ subcategory.count === 1 ? 'продукт' : 'продукта' }}
            </span>
            <span class="text-primary group-hover:text-primary-dark transition-colors"> Вижте всички → </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Разделителна линия -->
    <div class="mt-8 lg:mt-12 border-b border-gray-200"></div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

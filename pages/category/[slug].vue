<script setup lang="ts">
const route = useRoute();
const categorySlug = route.params.slug as string;

// Зареждаме категорията и нейните постове
const { data: categoryData } = await useAsyncGql('GetCategory', {
  slug: categorySlug,
});

const category = computed(() => categoryData.value?.category);

// Ако категорията не съществува, покажи 404
if (!category.value) {
  throw createError({
    statusCode: 404,
    message: 'Категорията не е намерена',
  });
}

// Зареждаме постовете от тази категория
const { data: postsData } = await useAsyncGql('GetPostsByCategory', {
  categoryId: category.value.databaseId,
  first: 200,
});

const allPosts = computed(() => postsData.value?.posts?.nodes || []);

// Пагинация
const postsPerPage = 12;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(allPosts.value.length / postsPerPage));
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return allPosts.value.slice(start, end);
});

// SEO
const pageTitle = `${category.value.name} - Статии и новини | Leaderfitness`;
const pageDescription = category.value.description || `Всички статии от категория ${category.value.name}. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com`;

useHead({
  title: pageTitle,
  meta: [
    { name: "description", content: pageDescription },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    { rel: "canonical", href: `https://leaderfitness.net/category/${categorySlug}` },
  ],
});
</script>

<template>
  <div class="container py-8 md:py-12">
    <!-- Hero Section -->
    <div class="text-center mb-10 md:mb-12">
      <div class="flex items-center justify-center gap-2 mb-3">
        <NuxtLink to="/blog" class="text-sm text-gray-500 hover:text-[#9c0100] transition-colors">
          Блог
        </NuxtLink>
        <Icon name="ion:chevron-forward" size="14" class="text-gray-400" />
        <span class="text-sm text-gray-700 font-medium">{{ category?.name }}</span>
      </div>
      
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
        {{ category?.name }}
      </h1>
      
      <p v-if="category?.description" class="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
        {{ category.description }}
      </p>
      
      <div class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Icon name="ion:documents-outline" size="18" class="text-[#9c0100]" />
        <span class="font-medium">
          {{ allPosts.length }} {{ allPosts.length === 1 ? 'статия' : 'статии' }}
        </span>
      </div>
    </div>

    <!-- Main Content with Sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10">
      <!-- Main Content -->
      <div>
        <!-- Posts Grid -->
        <div
          v-if="paginatedPosts.length"
          class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
        >
          <BlogPostCard v-for="post in paginatedPosts" :key="post.id" :post="post" />
        </div>

        <!-- No posts message -->
        <div v-else class="text-center p-8 bg-gray-50 rounded-xl">
          <Icon name="ion:document-text-outline" size="64" class="mx-auto text-gray-300 mb-4" />
          <h2 class="text-xl font-semibold text-gray-700">Няма публикации в тази категория</h2>
          <p class="mt-2 text-gray-600">Моля, проверете други категории</p>
          <NuxtLink 
            to="/blog"
            class="inline-flex items-center gap-2 mt-6 bg-[#9c0100] text-white px-6 py-3 rounded-lg hover:bg-[#7a0100] transition-all duration-300 font-semibold"
          >
            <Icon name="ion:arrow-back" size="18" />
            Към блога
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <BlogPagination 
          v-if="paginatedPosts.length && totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          :use-links="false"
          @update:current-page="currentPage = $event"
        />
      </div>

      <!-- Sidebar -->
      <BlogSidebar />
    </div>
  </div>
</template>


<script setup lang="ts">
const { loadAllPosts, getPostsForPage, getTotalPages, getTotalPosts } = useBlogPagination();

// Зареждаме всички постове при инициализация
await loadAllPosts();

const currentPage = 1;
const posts = computed(() => getPostsForPage(currentPage));
const totalPages = computed(() => getTotalPages());
const totalPosts = computed(() => getTotalPosts());

let blogTitle = "Статии, новини и ревюта на марки и продукти - Лидерфитнес";
let blogDescription = "Статии, новини и ревюта на марки и продукти. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com";

// SEO метаданни
useHead({
  title: blogTitle,
  meta: [
    { name: "description", content: blogDescription },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    { rel: "canonical", href: "https://leaderfitness.net/blog" },
    ...(totalPages.value > 1 ? [{ rel: "next", href: "https://leaderfitness.net/blog/page/2" }] : []),
  ],
});
</script>

<template>
  <div class="container py-8 md:py-12">
    <!-- Hero Section -->
    <div class="text-center mb-10 md:mb-12">
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
        {{ blogTitle }}
      </h1>
      <p class="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
        {{ blogDescription }}
      </p>
    </div>

    <!-- Main Content with Sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10">
      <!-- Main Content -->
      <div>
        <!-- Posts Grid -->
        <div
          v-if="posts.length"
          class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
        >
          <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>

        <!-- No posts message -->
        <div v-else class="text-center p-8">
          <h2 class="text-xl font-semibold">Няма намерени публикации</h2>
          <p class="mt-2 text-gray-600">В момента няма публикации в блога</p>
        </div>

        <!-- Pagination -->
        <BlogPagination 
          v-if="posts.length && totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
        />
      </div>

      <!-- Sidebar -->
      <BlogSidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { loadAllPosts, getPostsForPage, getTotalPages, getTotalPosts } = useBlogPagination();

// Зареждаме всички постове
await loadAllPosts();

// Вземаме номера на страницата от URL
const currentPage = computed(() => {
  const pageNum = parseInt(route.params.number as string);
  return isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
});

const posts = computed(() => getPostsForPage(currentPage.value));
const totalPages = computed(() => getTotalPages());
const totalPosts = computed(() => getTotalPosts());

let blogTitle = "Статии, новини и ревюта на марки и продукти - Лидерфитнес";
let blogDescription = "Статии, новини и ревюта на марки и продукти. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com";

// Проверка и редирект за невалидни страници
if (currentPage.value < 1 || (totalPages.value > 0 && currentPage.value > totalPages.value)) {
  router.replace('/blog');
}

// SEO метаданни с номер на страницата
const pageTitle = currentPage.value > 1 
  ? `${blogTitle} - Страница ${currentPage.value}`
  : blogTitle;

useHead({
  title: pageTitle,
  meta: [
    { name: "description", content: blogDescription },
    { name: "robots", content: "index, follow" },
  ],
  link: [
    { 
      rel: "canonical", 
      href: currentPage.value === 1 
        ? "https://leaderfitness.net/blog" 
        : `https://leaderfitness.net/blog/page/${currentPage.value}` 
    },
    // Prev/Next за SEO
    ...(currentPage.value > 1 ? [{ 
      rel: "prev", 
      href: currentPage.value === 2 
        ? "https://leaderfitness.net/blog" 
        : `https://leaderfitness.net/blog/page/${currentPage.value - 1}` 
    }] : []),
    ...(currentPage.value < totalPages.value ? [{ 
      rel: "next", 
      href: `https://leaderfitness.net/blog/page/${currentPage.value + 1}` 
    }] : []),
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
          <Icon name="ion:document-text-outline" size="64" class="mx-auto text-gray-300 mb-4" />
          <h2 class="text-xl font-semibold">Няма публикации на тази страница</h2>
          <p class="mt-2 text-gray-600">Моля, върнете се към началната страница на блога</p>
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

<script setup lang="ts">
const { setPosts, posts, pageInfo } = useBlog();
let blogTitle = "Статии, новини и ревюта на марки и продукти - Лидерфитнес";
let blogDescription =
  "Статии, новини и ревюта на марки и продукти. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com";

// Задаване на SEO метаданни
useHead({
  title: blogTitle,
  meta: [
    { name: "description", content: blogDescription },
    { name: "robots", content: "index, follow" },
  ],
  link: [{ rel: "canonical", href: "/blog" }],
});

// Получаване на всички публикации
try {
  // @ts-ignore
  const { data } = await useAsyncGql("GetBlogPosts", {
    first: 50,
  });

  if (data.value?.posts?.nodes) {
    setPosts(data.value.posts.nodes);

    // Задаваме информация за пагинация
    if (data.value.posts.pageInfo) {
      pageInfo.hasNextPage = data.value.posts.pageInfo.hasNextPage;
      pageInfo.endCursor = data.value.posts.pageInfo.endCursor || null;
    }
  }
} catch (error) {
  // Грешка при зареждане на публикации
}
</script>

<template>
  <div class="container py-8">
    <h1 class="text-3xl sm:text-4xl font-bold text-center mb-8">
      {{ blogTitle }}
    </h1>

    <div
      v-if="posts.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <BlogPostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>

    <div v-else class="text-center p-8">
      <h2 class="text-xl font-semibold">Няма намерени публикации</h2>
      <p class="mt-2 text-gray-600">В момента няма публикации в блога</p>

      <div class="mt-8 p-4 bg-yellow-50 rounded-lg text-left">
        <p class="font-semibold">Възможни причини:</p>
        <ul class="list-disc pl-5 mt-2">
          <li>WPGraphQL плъгинът не е активиран</li>
          <li>Публикациите (posts) не са достъпни през GraphQL API</li>
          <li>Постовете са с неправилен статус (трябва да са published)</li>
          <li>Има проблем с GraphQL ендпойнта или достъпа до него</li>
        </ul>
      </div>
    </div>

    <!-- Пагинация -->
    <BlogPagination v-if="posts.length && pageInfo.hasNextPage" />
  </div>
</template>

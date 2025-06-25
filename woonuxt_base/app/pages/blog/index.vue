<script setup lang="ts">
const { setPosts, posts, pageInfo } = useBlog();
let blogTitle = 'Статии, новини и ревюта на марки и продукти - Лидерфитнес';
let blogDescription = 'Статии, новини и ревюта на марки и продукти. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com';
let seoDataSet = false;
const debugData = ref(null);

try {
  // Зареждаме SEO данни за блог страницата
  useHead({
    title: blogTitle,
    meta: [
      { name: 'description', content: blogDescription },
      { name: 'robots', content: 'index, follow' },
    ],
  });
  seoDataSet = true;
} catch (error) {
  useHead({
    title: 'Статии, новини и ревюта на марки и продукти - Лидерфитнес',
    meta: [
      {
        name: 'description',
        content: 'Статии, новини и ревюта на марки и продукти. Следете нашите новини, както и страницата ни във Facebook | Leaderfitness.com',
      },
      { name: 'robots', content: 'index, follow' },
    ],
  });
  seoDataSet = true;
}

// Получаване на всички публикации
try {
  // @ts-ignore
  const { data } = await useAsyncGql('getPosts', {
    first: 12,
  });

  // Запазваме данните за диагностика
  debugData.value = data.value;
  if (data.value?.posts?.nodes) {
    setPosts(data.value.posts.nodes);
  }
} catch (error) {
  // Грешка при зареждане на публикации
}
</script>

<template>
  <div class="container py-8">
    <h1 class="text-3xl sm:text-4xl font-bold text-center mb-8">{{ blogTitle }}</h1>

    <!-- Показваме информация при проблеми с публикациите -->
    <div v-if="!posts.length && debugData" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
      <h2 class="text-lg font-semibold text-yellow-700 mb-2">Диагностична информация</h2>
      <p class="mb-2">GraphQL отговор:</p>
      <pre class="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">{{ JSON.stringify(debugData, null, 2) }}</pre>
    </div>

    <div v-if="posts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="post in posts" :key="post.id" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div v-if="post.featuredImage?.node?.sourceUrl" class="h-48 w-full bg-gray-200">
          <img :src="post.featuredImage.node.sourceUrl" :alt="post.title" class="h-full w-full object-cover" />
        </div>
        <div v-else class="h-48 w-full bg-gray-200 flex items-center justify-center">
          <span class="text-gray-500">Няма изображение</span>
        </div>
        <div class="p-4">
          <h2 class="text-lg font-semibold mb-2">{{ post.title }}</h2>
          <p class="text-sm text-gray-500 mb-2">
            {{ post.date ? new Date(post.date).toLocaleDateString('bg-BG') : 'Неизвестна дата' }}
          </p>
          <div class="text-gray-700 mb-4" v-html="post.excerpt"></div>
          <NuxtLink :to="`/${post.slug}`" class="text-blue-600 hover:underline"> Прочети повече </NuxtLink>
        </div>
      </div>
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
        <p class="mt-4">Проверете <a href="/test-posts" class="text-blue-600 hover:underline">тестовата страница</a> за повече информация.</p>
      </div>
    </div>
  </div>
</template>

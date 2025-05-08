<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const post = ref<any>(null);
const loading = ref(true);
const error = ref<any>(null);

// Заявка за публикация
try {
  // Първо зареждаме всички публикации, за да намерим ID на публикацията
  // @ts-ignore
  const { data: allPostsData } = await useAsyncGql("GetBlogPosts", {
    first: 100,
  });

  // Намираме ID на публикацията със съответния slug
  const targetPost = allPostsData.value?.posts?.nodes?.find(
    (p: any) => p.slug === slug
  );

  if (targetPost) {
    // Заявка за конкретната публикация по ID
    // @ts-ignore
    const { data } = await useAsyncGql("GetBlogPost", {
      id: targetPost.id,
    });

    if (data.value?.post) {
      post.value = data.value.post;
      // Задаване на SEO метаданни
      useHead({
        title: data.value.post.title || "Блог публикация",
        meta: [
          {
            name: "description",
            content:
              data.value.post.excerpt || "Прочетете нашата блог публикация",
          },
        ],
      });
    } else {
      // Ако публикацията не е намерена
      useHead({
        title: "Публикацията не е намерена",
        meta: [
          {
            name: "description",
            content:
              "Търсената от вас публикация не съществува или е премахната",
          },
          { name: "robots", content: "noindex" },
        ],
      });
    }
  } else {
    useHead({
      title: "Публикацията не е намерена",
      meta: [
        {
          name: "description",
          content: "Търсената от вас публикация не съществува или е премахната",
        },
        { name: "robots", content: "noindex" },
      ],
    });
  }
} catch (err) {
  error.value = err;
  // Базови SEO метаданни при грешка
  useHead({
    title: "Грешка при зареждане на публикация",
    meta: [
      {
        name: "description",
        content: "Възникна грешка при зареждане на публикацията",
      },
      { name: "robots", content: "noindex" },
    ],
  });
} finally {
  loading.value = false;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
</script>

<template>
  <div class="container py-8">
    <div v-if="loading" class="py-16 text-center">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
        <div class="h-64 bg-gray-200 rounded-lg max-w-4xl mx-auto mb-8"></div>
        <div class="space-y-3 max-w-4xl mx-auto">
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="py-12 text-center">
      <h1 class="text-2xl font-bold mb-4">
        Грешка при зареждане на публикация
      </h1>
      <p class="mb-8 text-red-600">{{ error }}</p>
      <NuxtLink
        to="/blog"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Обратно към блога
      </NuxtLink>
    </div>

    <div v-else-if="post" class="max-w-4xl mx-auto">
      <!-- Бутон за връщане назад -->
      <NuxtLink to="/blog" class="inline-flex items-center text-blue-600 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        Обратно към блога
      </NuxtLink>

      <!-- Заглавие -->
      <h1 class="text-3xl sm:text-4xl font-bold mb-4">{{ post.title }}</h1>

      <!-- Мета информация -->
      <div v-if="post.date" class="flex items-center text-gray-600 mb-8">
        <div v-if="post.author?.node?.avatar?.url" class="flex-shrink-0 mr-2">
          <img
            class="h-10 w-10 rounded-full"
            :src="post.author.node.avatar.url"
            :alt="post.author.node.name"
          />
        </div>
        <div>
          <p v-if="post.author?.node?.name" class="font-medium">
            {{ post.author.node.name }}
          </p>
          <div class="flex items-center gap-2 text-sm">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <span v-if="post.categories?.nodes?.length" class="inline-flex">
              &bull;
              <span
                v-for="(category, index) in post.categories?.nodes"
                :key="category.slug"
                class="ml-1"
              >
                {{ category.name
                }}{{ index < post.categories.nodes.length - 1 ? ", " : "" }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Основно изображение -->
      <div v-if="post.featuredImage?.node?.sourceUrl" class="mb-8">
        <img
          :src="post.featuredImage.node.sourceUrl"
          :alt="post.featuredImage.node.altText || post.title"
          class="w-full h-auto rounded-lg"
        />
      </div>

      <!-- Съдържание -->
      <div class="prose prose-lg max-w-none" v-html="post.content"></div>
    </div>

    <div v-else class="py-12 text-center">
      <h1 class="text-2xl font-bold mb-4">Публикацията не е намерена</h1>
      <p class="mb-8">
        Търсената от вас публикация не съществува или е премахната.
      </p>
      <NuxtLink
        to="/blog"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Обратно към блога
      </NuxtLink>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.prose img {
  @apply rounded-lg;
}

.prose a {
  @apply text-blue-600 hover:text-blue-700;
}

.prose h2 {
  @apply text-2xl font-bold mt-8 mb-4;
}

.prose h3 {
  @apply text-xl font-bold mt-6 mb-3;
}

.prose p {
  @apply mb-4;
}
</style>

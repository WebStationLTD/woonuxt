<script setup lang="ts">
defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

const formatExcerpt = (excerpt: string) => {
  if (!excerpt) return '';

  // Премахване на HTML тагове
  const withoutTags = excerpt.replace(/<\/?[^>]+(>|$)/g, '');

  // Премахване на [&hellip;] и други специални символи
  const withoutSpecialChars = withoutTags.replace(/\[&hellip;\]|\[…\]/g, '...');

  // Ограничаване на дължината
  if (withoutSpecialChars.length > 150) {
    return withoutSpecialChars.slice(0, 150) + '...';
  }

  return withoutSpecialChars;
};
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-lg shadow transition-all hover:shadow-lg">
    <NuxtLink :to="`/${post.slug}`" class="block overflow-hidden">
      <div class="aspect-w-16 aspect-h-9 w-full relative">
        <img
          v-if="post.featuredImage?.node?.sourceUrl"
          :src="post.featuredImage.node.sourceUrl"
          :alt="post.featuredImage.node.altText || post.title"
          class="h-48 w-full object-cover transition-transform duration-200 ease-in-out hover:scale-105" />
        <div v-else class="h-48 w-full bg-gray-200 flex items-center justify-center">
          <span class="text-gray-400">Няма изображение</span>
        </div>
      </div>

      <div class="flex-1 bg-white p-6 flex flex-col justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <span v-if="post.categories?.nodes?.length" class="inline-flex">
              &bull;
              <span v-for="(category, index) in post.categories.nodes" :key="category.slug" class="ml-1">
                {{ category.name }}{{ index < post.categories.nodes.length - 1 ? ', ' : '' }}
              </span>
            </span>
          </div>

          <h3 class="text-xl font-semibold text-gray-900 hover:text-primary-600">
            {{ post.title }}
          </h3>

          <div v-if="post.excerpt" class="mt-3 text-gray-600">{{ formatExcerpt(post.excerpt) }}</div>
        </div>

        <div class="mt-4">
          <div class="flex items-center">
            <div v-if="post.author?.node?.avatar?.url" class="flex-shrink-0 mr-2">
              <img class="h-8 w-8 rounded-full" :src="post.author.node.avatar.url" :alt="post.author.node.name" />
            </div>
            <p v-if="post.author?.node?.name" class="text-sm font-medium text-gray-900">
              {{ post.author.node.name }}
            </p>
          </div>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<style lang="postcss" scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%;
}

.aspect-w-16 > * {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>

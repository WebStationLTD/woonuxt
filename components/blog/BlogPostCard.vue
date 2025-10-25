<script setup lang="ts">
defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatExcerpt = (excerpt: string) => {
  if (!excerpt) return "";

  // Премахване на HTML тагове
  const withoutTags = excerpt.replace(/<\/?[^>]+(>|$)/g, "");

  // Премахване на [...] и други специални символи
  const withoutSpecialChars = withoutTags.replace(/\[&hellip;\]|\[…\]/g, "...");

  // Ограничаване на дължината
  if (withoutSpecialChars.length > 150) {
    return withoutSpecialChars.slice(0, 150) + "...";
  }

  return withoutSpecialChars;
};
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
  >
    <NuxtLink :to="`/${post.slug}`" class="block">
      <div class="relative overflow-hidden">
        <div class="aspect-w-16 aspect-h-9 w-full relative">
          <img
            v-if="post.featuredImage?.node?.sourceUrl"
            :src="post.featuredImage.node.sourceUrl"
            :alt="post.featuredImage.node.altText || post.title"
            class="h-48 w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            loading="lazy"
          />
          <div
            v-else
            class="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
          >
            <Icon name="ion:image-outline" size="48" class="text-gray-300" />
          </div>
        </div>
        
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div class="flex-1 p-5 flex flex-col justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Icon name="ion:calendar-outline" size="14" class="text-[#9c0100]" />
            <time v-if="post.date" :datetime="post.date" class="font-medium">{{
              formatDate(post.date)
            }}</time>
            <span v-if="post.categories?.nodes?.length" class="inline-flex items-center gap-1">
              <span class="text-gray-400">•</span>
              <Icon name="ion:pricetag-outline" size="14" class="text-[#9c0100]" />
              <span
                v-for="(category, index) in post.categories.nodes.slice(0, 2)"
                :key="category.slug"
                class="font-medium"
              >
                {{ category.name }}{{ index < Math.min(post.categories.nodes.length, 2) - 1 ? ", " : "" }}
              </span>
            </span>
          </div>

          <h3
            class="text-lg font-bold text-gray-900 hover:text-[#9c0100] transition-colors duration-200 line-clamp-2 mb-3"
          >
            {{ post.title }}
          </h3>

          <div v-if="post.excerpt" class="text-sm text-gray-600 line-clamp-3">
            {{ formatExcerpt(post.excerpt) }}
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
          <div v-if="post.author?.node" class="flex items-center gap-2">
            <div v-if="post.author.node.avatar?.url" class="flex-shrink-0">
              <img
                class="h-8 w-8 rounded-full ring-2 ring-gray-100"
                :src="post.author.node.avatar.url"
                :alt="post.author.node.name"
                loading="lazy"
              />
            </div>
            <div v-else class="flex-shrink-0">
              <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Icon name="ion:person" size="16" class="text-gray-400" />
              </div>
            </div>
            <p
              v-if="post.author.node.name"
              class="text-xs font-medium text-gray-700"
            >
              {{ post.author.node.name }}
            </p>
          </div>
          
          <div class="inline-flex items-center gap-1 text-[#9c0100] text-sm font-semibold group-hover:gap-2 transition-all">
            <span>Прочети</span>
            <Icon name="ion:arrow-forward" size="16" class="group-hover:translate-x-1 transition-transform" />
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

<script setup lang="ts">
interface Category {
  slug?: string | null;
  name?: string | null;
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
const { generateCategoryUrl, safeDecodeURI } = useCategoryUrls();

const props = defineProps({
  node: { type: Object as PropType<Category>, required: true },
  imageLoading: { type: String as PropType<'lazy' | 'eager'>, default: 'lazy' },
  allCategories: { type: Array as PropType<Category[]>, default: () => [] },
});

const imgWidth = 220;
const imgHeight = Math.round(imgWidth * 1.125);

// Генерираме правилния URL за категорията
const categoryUrl = computed(() => {
  return generateCategoryUrl(props.node, props.allCategories);
});
</script>

<template>
  <NuxtLink v-if="node" :to="categoryUrl" class="relative flex justify-center overflow-hidden border border-white rounded-xl item snap-mandatory snap-x">
    <NuxtImg
      :width="imgWidth"
      :height="imgHeight"
      class="absolute inset-0 object-cover w-full h-full"
      :src="node.image?.sourceUrl || FALLBACK_IMG"
      :alt="node.image?.altText || node.name || ''"
      :title="node.image?.title || node.name || ''"
      :loading="imageLoading"
      :sizes="`sm:${imgWidth / 2}px md:${imgWidth}px`"
      placeholder
      placeholder-class="blur-xl" />
    <div class="absolute inset-x-0 bottom-0 opacity-50 bg-gradient-to-t from-black to-transparent h-1/2" />
    <span class="relative z-10 mt-auto mb-2 text-sm font-semibold text-white capitalize md:text-base md:mb-4" v-html="node.name || ''" />
  </NuxtLink>
</template>

<style lang="postcss" scoped>
.item {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  aspect-ratio: 4 / 5;
}
</style>

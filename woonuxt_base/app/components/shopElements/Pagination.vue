<script setup lang="ts">
const { productsPerPage } = useHelpers();
const { products } = useProducts();

// SSR-safe computed properties
const currentQuery = computed(() => {
  if (!process.client) return '';

  const route = useRoute();
  const query = route.query;
  const queryKeys = Object.keys(query);
  let currentQuery = '';
  if (queryKeys.length > 0) {
    queryKeys.forEach((key, index) => {
      currentQuery += index === 0 ? `${key}=${query[key]}` : `&${key}=${query[key]}`;
    });
  }
  return decodeURIComponent(currentQuery);
});

const page = computed(() => {
  if (!process.client) return 1;

  const route = useRoute();
  return route.params.pageNumber ? parseInt(route.params.pageNumber as string) : 1;
});

const numberOfPages = computed<number>(() => Math.ceil((products.value?.length || 0) / productsPerPage || 1));

const prevSrc = (pageNumber: number) => {
  if (currentQuery.value === '') {
    return decodeURIComponent(`/magazin/page/${pageNumber > 1 ? pageNumber - 1 : pageNumber}`);
  } else {
    return decodeURIComponent(pageNumber > 1 ? `/magazin/page/${pageNumber - 1}/?${currentQuery.value}` : `/magazin/page/${pageNumber}/?${currentQuery.value}`);
  }
};

const nextSrc = (pageNumber: number) => {
  if (currentQuery.value === '') {
    return decodeURIComponent(`/magazin/page/${pageNumber < numberOfPages.value ? pageNumber + 1 : pageNumber}`);
  } else {
    return decodeURIComponent(
      pageNumber < numberOfPages.value ? `/magazin/page/${pageNumber + 1}/?${currentQuery.value}` : `/magazin/page/${pageNumber}/?${currentQuery.value}`,
    );
  }
};

const numberSrc = (pageNumber: number) => {
  if (currentQuery.value === '') {
    return decodeURIComponent(`/magazin/page/${pageNumber}`);
  } else {
    return decodeURIComponent(`/magazin/page/${pageNumber}/?${currentQuery.value}`);
  }
};
</script>

<template>
  <div class="flex flex-wrap justify-center mt-8 mb-16 col-span-full tabular-nums">
    <!-- Pagination -->
    <nav v-if="numberOfPages && numberOfPages > 1" class="flex-wrap inline-flex self-end -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
      <!-- PREV -->
      <NuxtLink
        :to="prevSrc(page)"
        class="prev"
        :disabled="page == 1"
        :class="{ 'cursor-not-allowed': page == 1 }"
        :aria-disabled="page == 1"
        aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="20" class="w-5 h-5" />
      </NuxtLink>

      <!-- NUMBERS -->
      <NuxtLink
        v-for="pageNumber in numberOfPages"
        :key="pageNumber"
        :to="numberSrc(pageNumber)"
        :aria-current="pageNumber === page ? 'page' : undefined"
        class="page-number">
        {{ pageNumber }}
      </NuxtLink>

      <!-- NEXT -->
      <NuxtLink
        :to="nextSrc(page)"
        class="next"
        :disabled="page === numberOfPages"
        :class="{ 'cursor-not-allowed': page === numberOfPages }"
        :aria-disabled="page === numberOfPages"
        aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="20" class="w-5 h-5" />
      </NuxtLink>
    </nav>
  </div>
</template>

<style lang="postcss" scoped>
.prev,
.next,
.page-number {
  @apply bg-white border font-medium border-gray-300 text-sm p-2 text-gray-500 relative inline-flex items-center hover:bg-gray-50 focus:z-10;
}

.prev {
  @apply rounded-l-md;
}

.next {
  @apply rounded-r-md;
}

.page-number {
  @apply px-3;
}

.page-number[aria-current='page'] {
  @apply bg-primary border-primary border bg-opacity-10 text-primary z-10;
}
</style>

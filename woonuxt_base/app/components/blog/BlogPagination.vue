<script setup lang="ts">
const { loadMorePosts, loading, pageInfo } = useBlog();
</script>

<template>
  <div class="w-full mt-8 flex justify-center" v-if="pageInfo.hasNextPage">
    <button
      @click="loadMorePosts"
      :disabled="loading"
      class="rounded-lg px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
      <span v-if="loading">Зареждане...</span>
      <span v-else>Зареди още</span>
    </button>
  </div>
</template>

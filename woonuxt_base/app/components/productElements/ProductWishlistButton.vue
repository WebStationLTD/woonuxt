<script setup lang="ts">
const { addToWishlist, removeFromWishlist, isInList } = useWishlist();

const props = defineProps<{ product: Product }>();

const isWishlisted = computed(() => (props.product.databaseId ? isInList(props.product.databaseId) : false));

const toggleWishlist = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  if (isWishlisted.value && props.product.databaseId) {
    removeFromWishlist(props.product.databaseId);
  } else {
    addToWishlist(props.product);
  }
};
</script>

<template>
  <button
    type="button"
    class="absolute top-2 left-2 z-40 bg-white/80 hover:bg-white rounded-full shadow-md transition-all duration-200 wishlist-btn"
    @click="toggleWishlist"
    :title="isWishlisted ? $t('messages.shop.wishlistRemove') : $t('messages.shop.wishlistAdd')">
    <Icon v-if="isWishlisted" name="ion:heart" size="24" class="text-[#9c0100] md:w-6 md:h-6 w-5 h-5" />
    <Icon v-else name="ion:heart-outline" size="24" class="text-gray-600 md:w-6 md:h-6 w-5 h-5" />
  </button>
</template>

<style scoped>
.wishlist-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  touch-action: manipulation;
}

@media (min-width: 768px) {
  .wishlist-btn {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 640px) {
  .wishlist-btn {
    width: 40px;
    height: 40px;
  }
}
</style>

<script setup lang="ts">
const route = useRoute();
const { products } = useProducts();
// Показваме всички продукти от текущата страница вместо да ги slice-ваме
const productsToShow = computed(() => products.value || []);
</script>

<template>
  <Transition name="fade" mode="out-in">
    <section v-if="!!products?.length" class="relative w-full !mt-0">
      <TransitionGroup name="shrink" tag="div" mode="in-out" class="product-grid">
        <div
          v-for="(node, i) in productsToShow"
          :key="node.id || i"
          class="product-card rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full bg-white p-2 w-full">
          <ProductCard :node="node" :index="i" />
        </div>
      </TransitionGroup>
      <!-- ЗАКОМЕНТИРАНА ПАГИНАЦИЯ - Премахната заради дублиране с тази от страниците -->
      <!-- Може лесно да се върне при нужда -->
      <!-- <PaginationServer /> -->
    </section>
    <NoProductsFound v-else />
  </Transition>
</template>

<style lang="postcss" scoped>
.product-grid {
  @apply my-4 grid transition-all gap-4 lg:my-8;

  /* Mobile: 2 колони */
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: min-content;
}

/* Tablet: 3 колони */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    @apply gap-6;
  }
}

/* Large Tablet до Desktop: 3 колони */
@media (min-width: 1024px) and (max-width: 1279px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    @apply gap-6;
  }
}

/* Desktop XL: 4 колони */
@media (min-width: 1280px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
    @apply gap-6;
  }
}

.product-grid:empty {
  display: none;
}

.shrink-move {
  transition: all 400ms;
}

.shrink-leave-active {
  transition: transform 300ms;
  position: absolute;
  opacity: 0;
}

.shrink-enter-active {
  transition:
    opacity 400ms ease-out 200ms,
    transform 400ms ease-out;
  will-change: opacity, transform;
}

.shrink-enter,
.shrink-leave-to,
.shrink-enter-from {
  opacity: 0;
  transform: scale(0.75) translateY(25%);
}
</style>

<script setup lang="ts">
const { wishlistLink } = useAuth();
import MegaMenu from './MegaMenu.vue';
</script>

<template>
  <nav>
    <NuxtLink class="text-base" to="/">{{ $t('messages.general.home') }}</NuxtLink>
    <NuxtLink class="text-base" to="/products">{{ $t('messages.general.allProducts') }}</NuxtLink>
    <NuxtLink class="text-base" to="/categories">{{ $t('messages.shop.category', 2) }}</NuxtLink>
    <NuxtLink class="text-base" to="/blog">Блог</NuxtLink>
    <MegaMenu />
    <NuxtLink class="text-base" to="/contact">{{ $t('messages.general.contact') }}</NuxtLink>
    <NuxtLink class="lg:hidden text-base" :to="wishlistLink" :prefetch="false">Wishlist</NuxtLink>
    <NuxtLink class="lg:hidden text-base" to="/my-account" :prefetch="false">My Account</NuxtLink>
  </nav>
</template>

<style scoped>
a {
  @apply font-semibold focus:outline-none;
}
</style>

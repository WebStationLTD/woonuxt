<script setup lang="ts">
const { wishlistLink } = useAuth();
import MegaMenu from './MegaMenu.vue';
import CategoriesMegaMenu from './CategoriesMegaMenu.vue';
</script>

<template>
  <nav>
    <NuxtLink class="text-base" to="/">{{ $t('messages.general.home') }}</NuxtLink>
    <MegaMenu />
    <NuxtLink class="text-base" to="/marki-produkti/">Марки</NuxtLink>
    <NuxtLink class="text-base" to="/blog">Блог</NuxtLink>
    <NuxtLink class="text-base" to="/contact">{{ $t('messages.general.contact') }}</NuxtLink>
  </nav>
</template>

<style scoped>
a {
  @apply font-semibold focus:outline-none;
}
</style>

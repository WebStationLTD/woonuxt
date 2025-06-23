<script setup lang="ts">
// Redirect към английската версия за унифициране
const route = useRoute();
const orderId = route.params.orderId as string;
const query = route.query;

// Построява query string от всички параметри
const queryString = new URLSearchParams(query as Record<string, string>).toString();
const redirectUrl = `/order-pay/${orderId}${queryString ? '?' + queryString : ''}`;

// Immediate redirect
await navigateTo(redirectUrl, { external: false, replace: true });
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <div class="text-center">
        <div class="mx-auto mb-4 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Пренасочване...</h2>
        <p class="text-sm text-gray-600">Пренасочваме ви към страницата за плащане...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

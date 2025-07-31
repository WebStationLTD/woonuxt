<script setup lang="ts">
const route = useRoute();
const { handlePaymentResult } = useBorica();

// Извличаме параметрите от URL query
const orderId = route.query.order as string;
const success = route.query.success === "true";
const message = route.query.message as string;
const rc = route.query.rc as string;

// Задаваме meta информация
useSeoMeta({
  title: "Резултат от плащането",
  robots: "noindex,nofollow",
});

// Обработваме резултата при mount
onMounted(() => {
  console.log("Payment result page mounted:", {
    orderId,
    success,
    message,
    rc,
  });

  if (orderId) {
    // Използваме composable функцията за обработка на резултата
    let displayMessage = message;

    // Добавяме допълнителна информация за грешки
    if (!success && rc) {
      const errorCodes: Record<string, string> = {
        "-17": "Невалиден подпис или изтекла заявка",
        "-25": "Потребителят отказа плащането",
        "-19": "Грешка при автентикация",
        "-1": "Системна грешка",
        "-2": "Невалидни данни",
      };

      displayMessage = errorCodes[rc] || `Код на грешка: ${rc}`;
    }

    handlePaymentResult(orderId, success, displayMessage);
  } else {
    // Ако няма orderId, пренасочваме към главната страница
    const router = useRouter();
    router.push("/");
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-16 text-center">
    <div class="max-w-md mx-auto">
      <!-- Loading състояние -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <LoadingIcon class="w-16 h-16 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-800 mb-4">
          Обработване на резултата...
        </h1>
        <p class="text-gray-600">
          Моля, изчакайте докато обработваме резултата от плащането.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Допълнителни стилове при нужда */
</style>

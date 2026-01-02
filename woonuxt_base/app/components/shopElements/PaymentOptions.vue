<script setup lang="ts">
const props = defineProps<{
  modelValue: string | object;
  paymentGateways: PaymentGateways;
}>();

const { cart } = useCart();
const paymentMethod = toRef(props, 'modelValue');
const activePaymentMethod = computed<PaymentGateway>(() => paymentMethod.value as PaymentGateway);
const emits = defineEmits(['update:modelValue']);

const updatePaymentMethod = (value: any) => {
  emits('update:modelValue', value);
};

// Изчисляваме общата сума на поръчката (в EUR от бекенда)
const cartTotal = computed(() => {
  if (!cart.value?.rawTotal) return 0;
  return parseFloat(cart.value.rawTotal.replace(/[^\d.]/g, '') || '0');
});

// Минимална сума за наложен платеж: 70 лв = 35.79 EUR (по курс 1.95583)
const MIN_AMOUNT_FOR_COD_EUR = 35.79;
const MIN_AMOUNT_FOR_COD_BGN = 70;

// Филтрираме методите за плащане според сумата
const filteredPaymentGateways = computed(() => {
  if (!props.paymentGateways?.nodes) return [];
  
  const total = cartTotal.value; // в EUR
  
  // Ако поръчката е под 70 лв (35.79 EUR), показваме САМО картови плащания
  if (total < MIN_AMOUNT_FOR_COD_EUR) {
    return props.paymentGateways.nodes.filter(gateway => 
      gateway.id === 'stripe' || 
      gateway.id === 'borica_emv' || 
      gateway.id === 'paypal'
    );
  }
  
  // Над 70 лв (35.79 EUR) - показваме всички методи
  return props.paymentGateways.nodes;
});

onMounted(() => {
  // Emit first available payment method
  if (filteredPaymentGateways.value.length) {
    updatePaymentMethod(filteredPaymentGateways.value[0]);
  }
});

// Watch за промени в филтрираните методи (ако сумата се промени)
watch(filteredPaymentGateways, (newGateways) => {
  // Ако текущият метод не е наличен в новия списък, избираме първия наличен
  const currentMethodExists = newGateways.some(g => g.id === activePaymentMethod.value?.id);
  if (!currentMethodExists && newGateways.length > 0) {
    updatePaymentMethod(newGateways[0]);
  }
});
</script>

<template>
  <div>
    <!-- Съобщение при поръчка под 70 лв (35.79 EUR) -->
    <div v-if="cartTotal < MIN_AMOUNT_FOR_COD_EUR" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p class="text-sm text-blue-800">
        <Icon name="ion:information-circle" size="18" class="inline-block mr-1" />
        При поръчки под {{ MIN_AMOUNT_FOR_COD_EUR.toFixed(2) }} € / {{ MIN_AMOUNT_FOR_COD_BGN }} лв. е налично само плащане с карта.
      </p>
    </div>

    <div class="flex gap-4 leading-tight flex-wrap">
      <div
        v-for="gateway in filteredPaymentGateways"
        :key="gateway.id"
        class="option"
        :class="{ 'active-option': gateway.id === activePaymentMethod.id }"
        @click="updatePaymentMethod(gateway)"
        :title="gateway?.description || gateway?.title || 'Payment Method'">
        <icon v-if="gateway.id === 'stripe'" name="ion:card-outline" size="20" />
        <icon v-else-if="gateway.id === 'paypal'" name="ion:logo-paypal" size="20" />
        <icon v-else-if="gateway.id === 'borica_emv'" name="ion:card" size="20" />
        <icon v-else name="ion:cash-outline" size="20" />
        <span class="whitespace-nowrap" v-html="gateway.title" />
        <icon name="ion:checkmark-circle" size="20" class="ml-auto text-primary checkmark opacity-0" />
      </div>
      <div v-if="activePaymentMethod.description && activePaymentMethod.id !== 'tbi_bank'" class="prose block w-full">
        <p class="text-sm text-gray-500" v-html="activePaymentMethod.description" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.option {
  @apply bg-white border rounded-lg text-gray-600 cursor-pointer flex flex-1 text-sm py-3 px-4 gap-2 items-center hover:border-purple-300;

  &.active-option {
    @apply border-primary cursor-default border-opacity-50 shadow-sm pointer-events-none;

    & .checkmark {
      @apply opacity-100;
    }
  }
}
</style>

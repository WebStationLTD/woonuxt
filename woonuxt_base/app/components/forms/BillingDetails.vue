<script lang="ts" setup>
const { updateShippingLocation } = useCheckout();
const { isBillingAddressEnabled } = useCart();

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const billing = toRef(props, 'modelValue');

// Задаваме България по подразбиране ако няма зададена държава
onMounted(() => {
  if (!billing.value.country) {
    billing.value.country = 'BG';
  }
});

// Watch за промени в града и адреса - обновяваме методите за доставка
watch(
  () => [billing.value.city, billing.value.address1],
  async ([newCity, newAddress], [oldCity, oldAddress]) => {
    // Обновяваме само ако са попълнени и и двете полета И има промяна
    if (newCity && newAddress && (newCity !== oldCity || newAddress !== oldAddress)) {
      // Debounce - чакаме 500ms след последната промяна
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateShippingLocation();
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="grid w-full gap-4 lg:grid-cols-2">
    <div class="w-full">
      <label for="first-name">{{ $t('messages.billing.firstName') }} <span class="text-red-500">*</span></label>
      <input id="first-name" v-model="billing.firstName" placeholder="John" autocomplete="given-name" type="text" required />
    </div>

    <div class="w-full">
      <label for="last-name">{{ $t('messages.billing.lastName') }} <span class="text-red-500">*</span></label>
      <input id="last-name" v-model="billing.lastName" placeholder="Doe" autocomplete="family-name" type="text" required />
    </div>

    <div v-if="isBillingAddressEnabled" class="w-full">
      <label for="email">{{ $t('messages.billing.email') }} <span class="text-red-500">*</span></label>
      <input id="email" v-model="billing.email" placeholder="johndoe@email.com" autocomplete="email" type="email" required />
    </div>

    <div v-if="isBillingAddressEnabled" class="w-full">
      <label for="phone">{{ $t('messages.billing.phone') }} <span class="text-red-500">*</span></label>
      <input id="phone" v-model="billing.phone" placeholder="+359 888 123 456" autocomplete="tel" type="tel" required />
    </div>

    <div v-if="isBillingAddressEnabled" class="w-full">
      <label for="city">{{ $t('messages.billing.city') }} <span class="text-red-500">*</span></label>
      <input id="city" v-model="billing.city" placeholder="София" autocomplete="locality" type="text" required />
    </div>

    <div v-if="isBillingAddressEnabled" class="w-full">
      <label for="address1">Адрес <span class="text-red-500">*</span></label>
      <input id="address1" v-model="billing.address1" placeholder="ул. Витоша 47" autocomplete="street-address" type="text" required />
    </div>
    
    <!-- ВАЖНО: Скрито поле за държава - WooCommerce изисква country за да изчисли доставката -->
    <input v-if="isBillingAddressEnabled" type="hidden" v-model="billing.country" />
  </div>
</template>

<script lang="ts" setup>
const { updateShippingLocation } = useCheckout();

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const shipping = toRef(props, 'modelValue');
</script>

<template>
  <div class="grid w-full gap-4 lg:grid-cols-2">
    <div class="w-full">
      <label for="first-name">{{ $t('messages.billing.firstName') }} <span class="text-red-500">*</span></label>
      <input id="first-name" v-model="shipping.firstName" placeholder="John" autocomplete="given-name" type="text" required />
    </div>

    <div class="w-full">
      <label for="last-name">{{ $t('messages.billing.lastName') }} <span class="text-red-500">*</span></label>
      <input id="last-name" v-model="shipping.lastName" placeholder="Doe" autocomplete="family-name" type="text" required />
    </div>

    <div class="w-full">
      <label for="phone">{{ $t('messages.billing.phone') }} <span class="text-red-500">*</span></label>
      <input id="phone" v-model="shipping.phone" placeholder="+359 888 123 456" autocomplete="tel" type="tel" required />
    </div>

    <div class="w-full">
      <label for="city">{{ $t('messages.billing.city') }} <span class="text-red-500">*</span></label>
      <input id="city" v-model="shipping.city" placeholder="София" autocomplete="locality" type="text" required />
    </div>

    <div class="w-full">
      <label for="address1">Адрес <span class="text-red-500">*</span></label>
      <input id="address1" v-model="shipping.address1" placeholder="ул. Витоша 47" autocomplete="street-address" type="text" required />
    </div>
  </div>
</template>

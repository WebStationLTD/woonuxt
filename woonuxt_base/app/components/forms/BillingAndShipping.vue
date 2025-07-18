<template>
  <form class="bg-white rounded-lg shadow" @submit.prevent="saveChanges">
    <div class="grid p-8 gap-6 md:grid-cols-2">
      <h3 class="font-semibold text-xl col-span-full">{{ $t('messages.billing.billing') }}</h3>

      <div class="w-full">
        <label for="billing-first-name">{{ $t('messages.billing.firstName') }} <span class="text-red-500">*</span></label>
        <input id="billing-first-name" v-model="customer.billing.firstName" placeholder="John" autocomplete="given-name" type="text" required />
      </div>

      <div class="w-full">
        <label for="billing-last-name">{{ $t('messages.billing.lastName') }} <span class="text-red-500">*</span></label>
        <input id="billing-last-name" v-model="customer.billing.lastName" placeholder="Doe" autocomplete="family-name" type="text" required />
      </div>

      <div class="w-full">
        <label for="billing-email">{{ $t('messages.billing.email') }} <span class="text-red-500">*</span></label>
        <input id="billing-email" v-model="customer.billing.email" placeholder="johndoe@email.com" autocomplete="email" type="email" required />
      </div>

      <div class="w-full">
        <label for="billing-phone">{{ $t('messages.billing.phone') }} <span class="text-red-500">*</span></label>
        <input id="billing-phone" v-model="customer.billing.phone" placeholder="+359 888 123 456" autocomplete="tel" type="tel" required />
      </div>

      <div class="w-full">
        <label for="billing-city">{{ $t('messages.billing.city') }} <span class="text-red-500">*</span></label>
        <input id="billing-city" v-model="customer.billing.city" placeholder="София" autocomplete="address-level2" type="text" required />
      </div>

      <div class="w-full">
        <label for="billing-address">Адрес <span class="text-red-500">*</span></label>
        <input id="billing-address" v-model="customer.billing.address1" placeholder="ул. Витоша 47" autocomplete="address-line1" type="text" required />
      </div>
    </div>

    <div class="grid p-8 gap-6 md:grid-cols-2">
      <h3 class="font-semibold text-xl col-span-full">{{ $t('messages.general.shipping') }}</h3>

      <div class="w-full">
        <label for="shipping-first-name">{{ $t('messages.billing.firstName') }} <span class="text-red-500">*</span></label>
        <input id="shipping-first-name" v-model="customer.shipping.firstName" placeholder="John" autocomplete="given-name" type="text" required />
      </div>

      <div class="w-full">
        <label for="shipping-last-name">{{ $t('messages.billing.lastName') }} <span class="text-red-500">*</span></label>
        <input id="shipping-last-name" v-model="customer.shipping.lastName" placeholder="Doe" autocomplete="family-name" type="text" required />
      </div>

      <div class="w-full">
        <label for="shipping-phone">{{ $t('messages.billing.phone') }} <span class="text-red-500">*</span></label>
        <input id="shipping-phone" v-model="customer.shipping.phone" placeholder="+359 888 123 456" autocomplete="tel" type="tel" required />
      </div>

      <div class="w-full">
        <label for="shipping-city">{{ $t('messages.billing.city') }} <span class="text-red-500">*</span></label>
        <input id="shipping-city" v-model="customer.shipping.city" placeholder="София" autocomplete="address-level2" type="text" required />
      </div>

      <div class="w-full">
        <label for="shipping-address">Адрес <span class="text-red-500">*</span></label>
        <input id="shipping-address" v-model="customer.shipping.address1" placeholder="ул. Витоша 47" autocomplete="address-line1" type="text" required />
      </div>
    </div>

    <div class="bg-white backdrop-blur-sm bg-opacity-75 border-t col-span-full p-4 sticky bottom-0 rounded-b-lg">
      <button
        class="rounded-md flex font-semibold ml-auto text-white py-2 px-4 gap-4 items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        :class="button.color"
        :disabled="loading">
        <LoadingIcon v-if="loading" color="#fff" size="20" />
        <span>{{ button.text }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
const { viewer, customer } = useAuth();
const { t } = useI18n();

const loading = ref<boolean>(false);
const button = ref<{ text: string; color: string }>({ text: t('messages.account.updateDetails'), color: 'bg-primary hover:bg-primary-dark' });

async function saveChanges(): Promise<void> {
  loading.value = true;
  button.value.text = t('messages.account.updating');
  const shipping = customer.value.shipping;
  const billing = customer.value.billing;

  try {
    const { updateCustomer } = await GqlUpdateCustomer({ input: { id: viewer.value.id, shipping, billing } });
    if (updateCustomer) button.value = { text: t('messages.account.updateSuccess'), color: 'bg-green-500' };
  } catch (error) {
    button.value = { text: t('messages.account.failed'), color: 'bg-red-500' };
  }

  loading.value = false;

  setTimeout(() => {
    button.value = { text: t('messages.account.updateDetails'), color: 'bg-primary hover:bg-primary-dark' };
  }, 2000);
}
</script>

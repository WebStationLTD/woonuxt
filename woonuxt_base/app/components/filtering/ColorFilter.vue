<script setup lang="ts">
const { getFilter, setFilter, isFiltersActive } = useFiltering();
const route = useRoute();

const { attribute } = defineProps({
  attribute: { type: Object, required: true },
});

// Reactive computed за selectedTerms базиран на URL състоянието
const selectedTerms = computed({
  get() {
    return getFilter(attribute.slug) || [];
  },
  set(newValue) {
    setFilter(attribute.slug, newValue);
  },
});

const filterTitle = ref(attribute.label || attribute.slug);
const isOpen = ref(attribute.openByDefault);

// Watcher за URL промени за да синхронизираме checkboxes
watch(
  () => route.query.filter,
  () => {
    // Форсираме reactivity update при промяна на URL филтри
    nextTick();
  },
  { immediate: true },
);

// Watcher за reset на филтри
watch(isFiltersActive, (newValue) => {
  if (!newValue) {
    // При reset на филтри, setFilter ще се извика автоматично през computed setter
    selectedTerms.value = [];
  }
});

// Update the URL when the checkbox is changed
const checkboxChanged = () => {
  // selectedTerms.value промяната автоматично ще извика computed setter
  // който ще извика setFilter(attribute.slug, newValue)
};
</script>

<template>
  <div class="cursor-pointer flex font-semibold mt-8 leading-none justify-between items-center" @click="isOpen = !isOpen">
    <span>{{ filterTitle }}</span>
    <Icon name="ion:chevron-down-outline" class="transform" :class="isOpen ? 'rotate-180' : ''" />
  </div>
  <div v-show="isOpen" class="mt-3 mr-6 max-h-[240px] grid gap-1.5 swatches overflow-auto custom-scrollbar">
    <div v-for="color in attribute.terms" :key="color.slug" :style="{ '--color': color.slug }" :title="color.name">
      <input :id="`${attribute.slug}-${color.slug}`" v-model="selectedTerms" class="hidden" type="checkbox" :value="color.slug" @change="checkboxChanged" />
      <label :for="`${attribute.slug}-${color.slug}`" class="cursor-pointer m-0"></label>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.swatches {
  grid-template-columns: repeat(auto-fit, minmax(24px, 1fr));
}

.swatches label {
  @apply rounded-md cursor-pointer shadow-sm m-0 mb-1 w-full block relative;
  background-color: var(--color, #eee);
  filter: saturate(0.75);
  aspect-ratio: 1/1;
  transition: all 0.2s ease;
}

.swatches label:hover,
.swatches input:checked + label {
  filter: saturate(1);
}

/* tick */
.swatches input:checked + label::after {
  content: '';
  width: 25%;
  height: 40%;
  border-right: 2.5px solid #fff;
  border-bottom: 2.5px solid #fff;
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
}

/* Make tick black if the color is white */
.swatches input:checked + label[for='white']::after,
.swatches input:checked + label[for='yellow']::after {
  border-color: #666;
}
</style>

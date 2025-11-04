<script lang="ts" setup>
const { frontEndUrl } = useHelpers();

// Марки и loading състояние
const brands = ref<any[]>([]);
const isLoading = ref(true);

// Computed за азбучно групиране на марките
const brandsByLetter = computed(() => {
  const grouped: { [key: string]: any[] } = {};

  brands.value?.forEach((brand) => {
    if (brand?.name && typeof brand.name === 'string' && brand.name.length > 0) {
      const firstLetter = brand.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(brand);
    }
  });

  // Сортираме всяка група по име
  Object.keys(grouped).forEach((letter) => {
    if (grouped[letter]) {
      grouped[letter].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    }
  });

  return grouped;
});

// Sorted букви за показване
const sortedLetters = computed(() => {
  return Object.keys(brandsByLetter.value || {}).sort();
});

// ⚡ КРИТИЧНО: Зареждаме марките при SSR за МГНОВЕНО показване
let initialBrands: any[] = [];

if (process.server) {
  console.log('🔥 BRANDS PAGE: Loading brands on SSR...');

  try {
    // ⚡ ULTRA БЪРЗА заявка ДИРЕКТНО от terms таксономия (БЕЗ продукти!)
    const { data } = await useAsyncGql('getProductBrands', {
      first: 500, // Достатъчно за всички марки
      hideEmpty: true, // Само марки с продукти
    });

    if (data.value?.terms?.nodes) {
      initialBrands = data.value.terms.nodes
        .filter((brand: any) => brand && brand.slug && brand.name)
        .map((brand: any) => ({
          databaseId: brand.databaseId,
          slug: brand.slug,
          name: brand.name,
        }))
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      
      console.log('🔥 BRANDS PAGE: SSR loaded', initialBrands.length, 'brands');
    }
  } catch (error) {
    console.error('❌ BRANDS PAGE: SSR brand loading failed:', error);
  }
}

// Инициализираме със SSR данните
brands.value = initialBrands;
isLoading.value = initialBrands.length === 0; // Loading само ако няма SSR данни

// При client-side, ако няма SSR данни, зареждаме async
onMounted(async () => {
  if (process.client && brands.value.length === 0) {
    console.log('🔥 BRANDS PAGE: Loading brands on client (no SSR data)...');

    try {
      // ⚡ ULTRA БЪРЗА заявка ДИРЕКТНО от terms таксономия
      const { data } = await useAsyncGql('getProductBrands', {
        first: 500,
        hideEmpty: true,
      });

      if (data.value?.terms?.nodes) {
        brands.value = data.value.terms.nodes
          .filter((brand: any) => brand && brand.slug && brand.name)
          .map((brand: any) => ({
            databaseId: brand.databaseId,
            slug: brand.slug,
            name: brand.name,
          }))
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        
        console.log('🔥 BRANDS PAGE: Client loaded', brands.value.length, 'brands');
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      isLoading.value = false;
    }
  }
});

// SEO за страницата с всички марки
const brandsTitle = 'Всички марки - Leaderfitness';
const brandsDescription = 'Прегледайте всички марки в Leaderfitness магазина | Фитнес екипировка, дрехи, тренировъчно оборудване от водещи марки';

useHead({
  title: brandsTitle,
  meta: [
    { name: 'description', content: brandsDescription },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: brandsTitle },
    { property: 'og:description', content: brandsDescription },
  ],
  link: [{ rel: 'canonical', href: `${frontEndUrl || 'https://leaderfitness.net'}/marki-produkti` }],
});
</script>

<template>
  <main class="container">
    <div class="my-6">
      <!-- Breadcrumb навигация -->
      <div class="flex text-sm leading-none text-gray-400 gap-1 items-center mb-6">
        <span>
          <NuxtLink to="/" class="hover:text-primary">{{ $t('messages.general.home') }}</NuxtLink>
          <span> /</span>
        </span>
        <span class="text-gray-800">Всички марки</span>
      </div>

      <!-- Заглавие -->
      <h1 class="text-3xl font-bold mb-8">Всички марки</h1>

      <!-- Loading състояние -->
      <div v-if="isLoading" class="space-y-8">
        <div v-for="i in 3" :key="i" class="space-y-4">
          <div class="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
          <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <div v-for="j in 6" :key="j" class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
              <div class="h-5 bg-gray-200 rounded mx-auto w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Списък с марки по букви -->
      <div v-else-if="brands.length" class="space-y-8">
        <div v-for="letter in sortedLetters" :key="letter" class="space-y-4">
          <!-- Буква като заглавие -->
          <h2 class="text-2xl font-bold text-gray-800 border-b-2 border-primary pb-2">{{ letter }}</h2>

          <!-- Марки за тази буква -->
          <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <NuxtLink
              v-for="brand in brandsByLetter[letter]"
              :key="brand.databaseId"
              :to="`/marka-produkt/${brand.slug}`"
              class="block p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 group">
              <div class="text-center">
                <h3 class="font-medium text-gray-900 group-hover:text-primary transition-colors duration-300 text-sm">
                  {{ brand.name }}
                </h3>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Няма марки -->
      <div v-else-if="!isLoading" class="text-center py-12">
        <div class="text-gray-500 text-lg mb-4">
          <Icon name="ion:business-outline" size="48" class="mx-auto mb-4" />
          Няма налични марки
        </div>
        <NuxtLink to="/magazin" class="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Разгледай всички продукти
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

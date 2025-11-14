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
    // ⚡ ОПРОСТЕН ПОДХОД: Използваме getProductBrands (terms query - много по-лек!)
    const brandsResult = await useAsyncGql('getProductBrands', {
      first: 500, // Достатъчно за всички марки (марките са по-малко от продуктите!)
      hideEmpty: true, // Само марки с продукти
    });

    // ⚠️ КРИТИЧЕН FIX: useAsyncGql понякога остава в idle състояние!
    // Форсваме изпълнението с refresh() ако е необходимо (както в useProducts.ts)
    console.log('🔥 BRANDS PAGE: brandsResult status:', brandsResult.status?.value);
    console.log('🔥 BRANDS PAGE: brandsResult error:', brandsResult.error?.value);
    
    if (brandsResult.status?.value === 'idle' || !brandsResult.data?.value) {
      console.log('🔥 BRANDS PAGE: useAsyncGql is idle, forcing refresh...');
      await brandsResult.refresh();
      console.log('🔥 BRANDS PAGE: After refresh - status:', brandsResult.status?.value);
      console.log('🔥 BRANDS PAGE: After refresh - error:', brandsResult.error?.value);
    }

    const data = brandsResult.data;
    const error = brandsResult.error;
    
    console.log('🔥 BRANDS PAGE: Raw data received:', data.value);
    console.log('🔥 BRANDS PAGE: Error received:', error?.value);
    console.log('🔥 BRANDS PAGE: Brands count:', data.value?.terms?.nodes?.length || 0);

    if (data.value?.terms?.nodes) {
      // Директно вземаме марките от terms (вече са уникални!)
      // ⚠️ ВАЖНО: Филтрираме марки с count > 0 (WordPress count може да включва draft!)
      const allBrands = data.value.terms.nodes
        .filter((brand: any) => {
          // Базова валидация
          if (!brand || !brand.slug || !brand.name) return false;
          
          // КРИТИЧНО: Проверяваме count (но това може да включва draft!)
          // За по-сигурно филтриране, ще трябва да проверим реално visible продукти
          const hasCount = brand.count && brand.count > 0;
          
          if (!hasCount) {
            console.log(`⚠️ BRANDS PAGE: Skipping brand "${brand.name}" (count: ${brand.count})`);
          }
          
          return hasCount;
        })
        .map((brand: any) => ({
          databaseId: brand.databaseId,
          slug: brand.slug,
          name: brand.name,
          count: brand.count, // Запазваме count за debug
        }))
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      
      initialBrands = allBrands;
      console.log('🔥 BRANDS PAGE: SSR loaded', initialBrands.length, 'brands from terms taxonomy');
      console.log('🔥 BRANDS PAGE: Sample brands with counts:', 
        initialBrands.slice(0, 5).map((b: any) => `${b.name} (${b.count})`));
    } else {
      console.error('❌ BRANDS PAGE: No products data in response');
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
      // ⚡ ОПРОСТЕН ПОДХОД: Използваме getProductBrands (terms query - много по-лек!)
      const brandsResult = await useAsyncGql('getProductBrands', {
        first: 500, // Достатъчно за всички марки
        hideEmpty: true, // Само марки с продукти
      });

      // ⚠️ КРИТИЧЕН FIX: Форсваме изпълнението ако е необходимо
      console.log('🔥 BRANDS PAGE: Client brandsResult status:', brandsResult.status?.value);
      console.log('🔥 BRANDS PAGE: Client brandsResult error:', brandsResult.error?.value);
      
      if (brandsResult.status?.value === 'idle' || !brandsResult.data?.value) {
        console.log('🔥 BRANDS PAGE: Client useAsyncGql is idle, forcing refresh...');
        await brandsResult.refresh();
        console.log('🔥 BRANDS PAGE: Client after refresh - status:', brandsResult.status?.value);
        console.log('🔥 BRANDS PAGE: Client after refresh - error:', brandsResult.error?.value);
      }

      const data = brandsResult.data;
      const error = brandsResult.error;
      
      console.log('🔥 BRANDS PAGE: Client raw data:', data.value);
      console.log('🔥 BRANDS PAGE: Client error:', error?.value);

      if (data.value?.terms?.nodes) {
        // Директно вземаме марките от terms (вече са уникални!)
        brands.value = data.value.terms.nodes
          .filter((brand: any) => brand && brand.slug && brand.name)
          .map((brand: any) => ({
            databaseId: brand.databaseId,
            slug: brand.slug,
            name: brand.name,
          }))
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        
        console.log('🔥 BRANDS PAGE: Client loaded', brands.value.length, 'brands from terms taxonomy');
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

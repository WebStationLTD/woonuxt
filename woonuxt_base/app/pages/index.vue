<script lang="ts" setup>
import { ProductsOrderByEnum } from '#woo';

// Add Vercel speed insights
import { SpeedInsights } from '@vercel/speed-insights/vue';

const { siteName, description, shortDescription, siteImage } = useAppConfig();
const { frontEndUrl } = useHelpers();

// Получаване на SEO данни от Yoast SEO за началната страница
const { data: seoData } = await useAsyncGql('getHomeSeo');
const homeSeo = seoData.value?.page?.seo || null;

// Получаване на всички категории
const { data } = await useAsyncGql('getProductCategories', { first: 100, hideEmpty: true });
const productCategories = data.value?.productCategories?.nodes || [];

// Получаване на популярни продукти
const { data: productData } = await useAsyncGql('getProducts', { first: 5, orderby: ProductsOrderByEnum.POPULARITY });
const popularProducts = productData.value.products?.nodes || [];

// Използване на SEO данни от Yoast ако са налични, иначе използване на данни от конфигурацията
const seoTitle = homeSeo?.title || siteName || 'WooNuxt - Най-добрият онлайн магазин за спортно оборудване';
const seoDescription =
  homeSeo?.metaDesc ||
  description ||
  'Открийте висококачествено спортно оборудване, фитнес уреди и аксесоари в нашия онлайн магазин. Бързи доставки, конкурентни цени и професионално обслужване.';
const canonicalUrl = frontEndUrl || 'https://leaderfitness.net';

useSeoMeta({
  title: seoTitle,
  ogTitle: homeSeo?.opengraphTitle || seoTitle,
  description: seoDescription,
  ogDescription: homeSeo?.opengraphDescription || seoDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogImage: homeSeo?.opengraphImage?.sourceUrl || siteImage,
  twitterCard: 'summary_large_image',
  twitterTitle: homeSeo?.twitterTitle || seoTitle,
  twitterDescription: homeSeo?.twitterDescription || seoDescription,
  twitterImage: homeSeo?.twitterImage?.sourceUrl || siteImage,
  robots: homeSeo?.metaRobotsNoindex === 'noindex' ? 'noindex' : 'index, follow',
});

// ⚡ LCP ОПТИМИЗАЦИЯ: Preload на първата категория (БОКС)
const firstParentCategory = productCategories.find((cat) => !cat.parent?.node);
const lcpImageUrl = firstParentCategory?.image?.sourceUrl;

// Генерираме Vercel Image URL за LCP снимката
const img = useImage();
const preloadLcpImage = lcpImageUrl
  ? img.getSizes(lcpImageUrl, { 
      sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1200px',
      modifiers: { quality: 95, width: 1200 }
    }).src
  : null;

// Canonical URL + Preload на LCP снимката
useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
    ...(preloadLcpImage
      ? [
          {
            rel: 'preload',
            as: 'image' as const,
            href: preloadLcpImage,
            fetchpriority: 'high' as const,
            type: 'image/jpeg',
          },
        ]
      : []),
  ],
});

// Зареждане на tiny-slider САМО на началната страница (non-blocking CSS!)
useHead({
  link: [
    { 
      rel: 'stylesheet', 
      href: 'https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/tiny-slider.css',
      media: 'print',
      onload: "this.media='all'; this.onload=null;",
    },
  ],
  script: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/min/tiny-slider.js',
      defer: true,
    },
  ],
});

// Добавяне на структурирани данни (schema.org) ако са налични в Yoast
if (homeSeo?.schema?.raw) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: homeSeo.schema.raw,
      },
    ],
  });
}
</script>

<template>
  <main>
    <!-- <HeroBanner /> -->

    <!-- <PromoSection /> -->

    <!-- ОРИГИНАЛНА СЕКЦИЯ С ВСИЧКИ КАТЕГОРИИ - ЗАКОМЕНТИРАНА 
    <section class="mt-4 mb-16 px-6">
      <div class="flex items-end justify-between">
        <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
        <NuxtLink class="text-primary" to="/categories">{{ $t('messages.general.viewAll') }}</NuxtLink>
      </div>
      <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-5">
        <CategoryCard v-for="(category, i) in productCategories" :key="i" class="w-full" :node="category" :all-categories="productCategories" />
      </div>
    </section>
    -->

    <!-- НОВА СЕКЦИЯ С РОДИТЕЛСКИ КАТЕГОРИИ И ПОДКАТЕГОРИИ -->
    <FeaturedCategories :categories="productCategories" />

    <NewProductsCarousel />

    <!-- <BestProductCategory :categoryId="21" /> -->

    <CtaBullets />

    <!-- Секция с лога на марки -->
    <div class="bg-white py-12 md:py-16">
      <div class="container px-4">
        <!-- Заглавие -->
        <h2 class="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8 md:mb-12">Топ марки</h2>
        
        <!-- Лога -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center justify-items-center max-w-6xl mx-auto">
          <NuxtLink to="/marka-produkt/venum" class="flex items-center justify-center w-full h-32 md:h-40 rounded-xl overflow-hidden bg-white/50 grayscale hover:grayscale-0 hover:scale-105 hover:shadow-lg transition-all duration-300">
            <NuxtImg
              src="https://admin.leaderfitness.net/wp-content/uploads/2022/03/brand-VENUM-logo.png"
              alt="Venum - Професионални боксови продукти"
              class="brand-logo h-28 md:h-36 w-auto max-w-full object-contain"
              loading="lazy"
              width="280"
              height="200" />
          </NuxtLink>
          <NuxtLink to="/marka-produkt/amila" class="flex items-center justify-center w-full h-32 md:h-40 rounded-xl overflow-hidden bg-white/50 grayscale hover:grayscale-0 hover:scale-105 hover:shadow-lg transition-all duration-300">
            <NuxtImg
              src="https://admin.leaderfitness.net/wp-content/uploads/2022/03/brand-AMILA-LOGO.jpg"
              alt="Amila - Спортно оборудване и аксесоари"
              class="brand-logo h-28 md:h-36 w-auto max-w-full object-contain"
              loading="lazy"
              width="280"
              height="200" />
          </NuxtLink>
          <NuxtLink to="/marka-produkt/body-solid" class="flex items-center justify-center w-full h-32 md:h-40 rounded-xl overflow-hidden bg-white/50 grayscale hover:grayscale-0 hover:scale-105 hover:shadow-lg transition-all duration-300">
            <NuxtImg
              src="https://admin.leaderfitness.net/wp-content/uploads/2022/03/Brand-BODY-SOLID-LOGO.jpg"
              alt="Body Solid - Фитнес оборудване"
              class="brand-logo h-28 md:h-36 w-auto max-w-full object-contain"
              loading="lazy"
              width="280"
              height="200" />
          </NuxtLink>
          <NuxtLink to="/marka-produkt/orion-fitness" class="flex items-center justify-center w-full h-32 md:h-40 rounded-xl overflow-hidden bg-white/50 grayscale hover:grayscale-0 hover:scale-105 hover:shadow-lg transition-all duration-300">
            <NuxtImg
              src="https://admin.leaderfitness.net/wp-content/uploads/2022/03/brand-ORION-FITNESS-logo-1.jpg"
              alt="Orion Fitness - Професионални фитнес уреди"
              class="brand-logo h-28 md:h-36 w-auto max-w-full object-contain"
              loading="lazy"
              width="280"
              height="200" />
          </NuxtLink>
        </div>
        
        <!-- Бутони -->
        <div class="flex flex-wrap justify-center gap-3 mt-8 md:mt-10">
          <NuxtLink
            to="/marki-produkti"
            class="inline-flex items-center gap-2 bg-[#9c0100] text-white px-5 py-2.5 rounded-lg hover:bg-[#7a0100] transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Виж всички марки
            <Icon name="ion:arrow-forward" size="16" />
          </NuxtLink>
          <NuxtLink
            to="/нови-продукти"
            class="inline-flex items-center gap-2 bg-white text-[#9c0100] border-2 border-[#9c0100] px-5 py-2.5 rounded-lg hover:bg-[#9c0100] hover:text-white transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Нови попълнения
            <Icon name="ion:sparkles" size="16" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <CtaQuality />

    <!-- <CtaImage /> -->

    <!-- <PromoSection /> -->

    <!--<section class="container my-16" v-if="popularProducts">
      <div class="flex items-end justify-between">
        <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.popularProducts') }}</h2>
        <NuxtLink class="text-primary" to="/magazin">{{ $t('messages.general.viewAll') }}</NuxtLink>
      </div>
      <ProductRow :products="popularProducts" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
    </section>-->
  </main>
  <SpeedInsights />
</template>


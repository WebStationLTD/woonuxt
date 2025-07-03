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
const canonicalUrl = frontEndUrl || 'https://woonuxt-ten.vercel.app';

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

// Canonical URL
useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
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

    <div class="container flex flex-wrap items-center justify-center my-16 text-center gap-x-8 gap-y-4 brand lg:justify-between">
      <img src="/images/logoipsum-211.svg" alt="Brand 1" width="132" height="35" />
      <img src="/images/logoipsum-221.svg" alt="Brand 2" width="119" height="30" />
      <img src="/images/logoipsum-225.svg" alt="Brand 3" width="49" height="48" />
      <img src="/images/logoipsum-280.svg" alt="Brand 4" width="78" height="30" />
      <img src="/images/logoipsum-284.svg" alt="Brand 5" width="70" height="44" />
      <img src="/images/logoipsum-215.svg" alt="Brand 6" width="132" height="40" />
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

<style scoped>
.brand img {
  max-height: min(8vw, 120px);
  object-fit: contain;
  object-position: center;
}
</style>

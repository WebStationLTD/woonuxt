<script lang="ts" setup>
import { ProductsOrderByEnum } from '#woo';

// Add Vercel speed insights
import { SpeedInsights } from '@vercel/speed-insights/vue';

const { siteName, description, shortDescription, siteImage } = useAppConfig();

// Получаване на SEO данни от Yoast SEO за началната страница
const { data: seoData } = await useAsyncGql('getHomeSeo');
const homeSeo = seoData.value?.page?.seo || null;

// Получаване на всички категории
const { data } = await useAsyncGql('getProductCategories', { first: 100 });
const productCategories = data.value?.productCategories?.nodes || [];

// Получаване на популярни продукти
const { data: productData } = await useAsyncGql('getProducts', { first: 5, orderby: ProductsOrderByEnum.POPULARITY });
const popularProducts = productData.value.products?.nodes || [];

// Използване на SEO данни от Yoast ако са налични, иначе използване на данни от конфигурацията
useSeoMeta({
  title: homeSeo?.title || 'Home',
  ogTitle: homeSeo?.opengraphTitle || siteName,
  description: homeSeo?.metaDesc || description,
  ogDescription: homeSeo?.opengraphDescription || shortDescription,
  ogImage: homeSeo?.opengraphImage?.sourceUrl || siteImage,
  twitterCard: 'summary_large_image',
  twitterTitle: homeSeo?.twitterTitle || siteName,
  twitterDescription: homeSeo?.twitterDescription || description,
  twitterImage: homeSeo?.twitterImage?.sourceUrl || siteImage,
  robots: homeSeo?.metaRobotsNoindex ? 'index' : undefined,
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

    <PromoSection />

    <NewProductsCarousel />

    <BestProductCategory :categoryId="21" />

    <section class="mt-4 mb-16 px-6">
      <div class="flex items-end justify-between">
        <h2 class="text-lg font-semibold md:text-2xl">{{ $t('messages.shop.shopByCategory') }}</h2>
        <NuxtLink class="text-primary" to="/categories">{{ $t('messages.general.viewAll') }}</NuxtLink>
      </div>
      <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-5">
        <CategoryCard v-for="(category, i) in productCategories" :key="i" class="w-full" :node="category" :all-categories="productCategories" />
      </div>
    </section>

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

    <section class="container grid gap-4 my-24 md:grid-cols-2 lg:grid-cols-4">
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img
          src="/icons/box.svg"
          width="60"
          height="60"
          alt="Безплатна доставка"
          loading="lazy"
          style="filter: brightness(0) saturate(100%) invert(13%) sepia(96%) saturate(7471%) hue-rotate(356deg) brightness(95%) contrast(118%)" />
        <div>
          <h3 class="text-xl font-semibold">Безплатна доставка</h3>
          <p class="text-sm">Безплатна доставка при поръчка над 50 лв.</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img
          src="/icons/moneyback.svg"
          width="60"
          height="60"
          alt="Връщане на пари"
          loading="lazy"
          style="filter: brightness(0) saturate(100%) invert(13%) sepia(96%) saturate(7471%) hue-rotate(356deg) brightness(95%) contrast(118%)" />
        <div>
          <h3 class="text-xl font-semibold">Спокойствие</h3>
          <p class="text-sm">30 дни гаранция за връщане на парите</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img
          src="/icons/secure.svg"
          width="60"
          height="60"
          alt="Сигурно плащане"
          loading="lazy"
          style="filter: brightness(0) saturate(100%) invert(13%) sepia(96%) saturate(7471%) hue-rotate(356deg) brightness(95%) contrast(118%)" />
        <div>
          <h3 class="text-xl font-semibold">100% Сигурност на плащането</h3>
          <p class="text-sm">Вашите плащания са сигурни при нас.</p>
        </div>
      </div>
      <div class="flex items-center gap-8 p-8 bg-white rounded-lg">
        <img
          src="/icons/support.svg"
          width="60"
          height="60"
          alt="Поддръжка 24/7"
          loading="lazy"
          style="filter: brightness(0) saturate(100%) invert(13%) sepia(96%) saturate(7471%) hue-rotate(356deg) brightness(95%) contrast(118%)" />
        <div>
          <h3 class="text-xl font-semibold">Поддръжка 24/7</h3>
          <p class="text-sm">24/7 онлайн поддръжка</p>
        </div>
      </div>
    </section>

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

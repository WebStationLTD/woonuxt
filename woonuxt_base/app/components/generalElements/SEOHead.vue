<script setup lang="ts">
const { frontEndUrl, wooNuxtSEO, stripHtml } = useHelpers();
const { path } = useRoute();
const { info } = defineProps({ info: { type: Object as PropType<Product>, required: true } });

// Prioritize Yoast SEO data if available
const title = info.seo?.title || info.name;
const metaDescription =
  info.seo?.metaDesc || (info.shortDescription || info.description ? stripHtml(info.shortDescription || '') : stripHtml(info.description || ''));
const canonical = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}${path}`;
const siteName = process.env.SITE_TITLE ?? 'WooNuxt';

// Prioritize Yoast SEO OpenGraph image
const img = useImage();
let imageURL = '';
if (info.seo?.opengraphImage?.sourceUrl) {
  imageURL = info.seo.opengraphImage.sourceUrl;
} else {
  imageURL = info.image?.sourceUrl ?? '/images/placeholder.jpg';
}

const defaultImageSrc = img.getSizes(imageURL, { width: 1200, height: 630 }).src;
const twitterImageSrc = info.seo?.twitterImage?.sourceUrl ? info.seo.twitterImage.sourceUrl : img.getSizes(imageURL, { width: 1600, height: 900 }).src;

const getFullImageURL = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}${url}`;
};

const defaultImage = getFullImageURL(defaultImageSrc);
const twitterImage = getFullImageURL(twitterImageSrc);
const ogTitle = info.seo?.opengraphTitle || title;
const ogDescription = info.seo?.opengraphDescription || metaDescription;
const twitterTitle = info.seo?.twitterTitle || title;
const twitterDescription = info.seo?.twitterDescription || metaDescription;

const facebook = wooNuxtSEO?.find((item) => item?.provider === 'facebook') ?? null;
const twitter = wooNuxtSEO?.find((item) => item?.provider === 'twitter') ?? null;

// Създаваме правилния robots meta tag
const robotsContent = () => {
  let robots = [];

  // Yoast връща string стойности, не boolean
  if (info.seo?.metaRobotsNoindex === 'noindex') {
    robots.push('noindex');
  } else {
    robots.push('index'); // default или ако е 'index'
  }

  if (info.seo?.metaRobotsNofollow === 'nofollow') {
    robots.push('nofollow');
  } else {
    robots.push('follow'); // default или ако е 'follow'
  }

  return robots.join(', ');
};

// Добавяме schema.org структурирани данни чрез useHead
if (info.seo?.schema?.raw) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: info.seo.schema.raw,
      },
    ],
  });
}
</script>

<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta v-if="metaDescription" name="description" hid="description" :content="metaDescription" />
    <Meta name="image" hid="image" :content="defaultImage" />
    <Meta property="og:site_name" hid="og:site_name" :content="siteName" />
    <Meta property="og:url" hid="og:url" :content="canonical" />
    <Meta property="og:title" hid="og:title" :content="ogTitle || ''" />
    <Meta v-if="ogDescription" property="og:description" hid="og:description" :content="ogDescription" />
    <Meta property="og:image" hid="og:image" :content="defaultImage" />
    <Meta v-if="facebook?.url" property="article:publisher" hid="article:publisher" :content="facebook.url" />
    <Meta name="twitter:card" hid="twitter:card" content="summary_large_image" />
    <Meta v-if="twitter?.handle" name="twitter:site" hid="twitter:site" :content="twitter.handle" />
    <Meta name="twitter:title" hid="twitter:title" :content="twitterTitle || ''" />
    <Meta v-if="twitterDescription" name="twitter:description" hid="twitter:description" :content="twitterDescription" />
    <Meta name="twitter:image" hid="twitter:image" :content="twitterImage" />
    <Meta name="twitter:url" hid="twitter:url" :content="canonical" />
    <Link rel="canonical" hid="canonical" :href="canonical" />
    <!-- Add meta robots tag -->
    <Meta name="robots" hid="robots" :content="robotsContent()" />
    <!-- Schema.org data is now added using useHead in the script section -->
  </Head>
</template>

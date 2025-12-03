<script setup lang="ts">
const { frontEndUrl, wooNuxtSEO } = useHelpers();
const { path } = useRoute();
const { category } = defineProps({
  category: {
    type: Object as PropType<{
      name?: string | null;
      description?: string | null;
      slug?: string | null;
      seo?: {
        title?: string | null;
        metaDesc?: string | null;
        canonical?: string | null;
        opengraphTitle?: string | null;
        opengraphDescription?: string | null;
        opengraphImage?: { sourceUrl?: string | null; altText?: string | null } | null;
        twitterTitle?: string | null;
        twitterDescription?: string | null;
        twitterImage?: { sourceUrl?: string | null; altText?: string | null } | null;
        metaKeywords?: string | null;
        metaRobotsNoindex?: string | null;
        metaRobotsNofollow?: string | null;
        schema?: { raw?: string | null } | null;
      } | null;
    }>,
    required: true,
  },
});

// Generate SEO data
const title = category.seo?.title || category.name || 'Категория';
const metaDescription = category.seo?.metaDesc || category.description || `Продукти в категория ${category.name}`;
const canonical = `${frontEndUrl || 'https://leaderfitness.net'}${path}`;
const siteName = process.env.SITE_TITLE ?? 'Leaderfitness';

// OpenGraph and Twitter data
const ogTitle = category.seo?.opengraphTitle || title;
const ogDescription = category.seo?.opengraphDescription || metaDescription;
const twitterTitle = category.seo?.twitterTitle || title;
const twitterDescription = category.seo?.twitterDescription || metaDescription;

// Images - simplified without useImage for SSR compatibility
let imageURL = category.seo?.opengraphImage?.sourceUrl || '/images/placeholder.jpg';
const defaultImageSrc = imageURL;
const twitterImageSrc = category.seo?.twitterImage?.sourceUrl || defaultImageSrc;

const getFullImageURL = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${frontEndUrl || 'https://leaderfitness.net'}${url}`;
};

const defaultImage = getFullImageURL(defaultImageSrc);
const twitterImage = getFullImageURL(twitterImageSrc);

const facebook = wooNuxtSEO?.find((item) => item?.provider === 'facebook') ?? null;
const twitter = wooNuxtSEO?.find((item) => item?.provider === 'twitter') ?? null;

// Meta robots
const metaRobots = computed(() => {
  const noindex = category.seo?.metaRobotsNoindex === 'noindex';
  const nofollow = category.seo?.metaRobotsNofollow === 'nofollow';

  if (noindex && nofollow) return 'noindex, nofollow';
  if (noindex) return 'noindex';
  if (nofollow) return 'nofollow';
  return 'index, follow';
});

// Schema data via useHead
// ВАЖНО: Поправяме цените от Yoast - заменяме запетая с точка
if (category.seo?.schema?.raw) {
  let schemaRaw = category.seo.schema.raw;
  
  // Fix: Yoast понякога генерира цени с запетая (напр. "19,99")
  // Schema.org изисква точка като десетичен разделител
  try {
    const schemaObj = JSON.parse(schemaRaw);
    
    // Helper за fix на price полета (price, lowPrice, highPrice)
    const priceFields = ['price', 'lowPrice', 'highPrice'];
    const fixPrices = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      for (const key in obj) {
        if (priceFields.includes(key) && typeof obj[key] === 'string') {
          // Заменяме запетая с точка в цената
          obj[key] = obj[key].replace(',', '.');
        } else if (typeof obj[key] === 'object') {
          fixPrices(obj[key]);
        }
      }
      return obj;
    };
    
    fixPrices(schemaObj);
    schemaRaw = JSON.stringify(schemaObj);
  } catch (e) {
    // Ако parse-ването се провали, използваме regex като fallback
    schemaRaw = schemaRaw
      .replace(/"price"\s*:\s*"(\d+),(\d+)"/g, '"price":"$1.$2"')
      .replace(/"lowPrice"\s*:\s*"(\d+),(\d+)"/g, '"lowPrice":"$1.$2"')
      .replace(/"highPrice"\s*:\s*"(\d+),(\d+)"/g, '"highPrice":"$1.$2"');
  }
  
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: schemaRaw,
      },
    ],
  });
}
</script>

<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta v-if="metaDescription" name="description" hid="description" :content="metaDescription" />
    <Meta v-if="category.seo?.metaKeywords" name="keywords" hid="keywords" :content="category.seo.metaKeywords" />
    <Meta name="robots" hid="robots" :content="metaRobots" />
    <Meta name="image" hid="image" :content="defaultImage" />
    <Meta property="og:site_name" hid="og:site_name" :content="siteName" />
    <Meta property="og:url" hid="og:url" :content="canonical" />
    <Meta property="og:title" hid="og:title" :content="ogTitle" />
    <Meta property="og:description" hid="og:description" :content="ogDescription" />
    <Meta property="og:type" hid="og:type" content="website" />
    <Meta property="og:image" hid="og:image" :content="defaultImage" />
    <Meta v-if="facebook?.url" property="article:publisher" hid="article:publisher" :content="facebook.url" />
    <Meta name="twitter:card" hid="twitter:card" content="summary_large_image" />
    <Meta v-if="twitter?.handle" name="twitter:site" hid="twitter:site" :content="twitter.handle" />
    <Meta name="twitter:title" hid="twitter:title" :content="twitterTitle" />
    <Meta name="twitter:description" hid="twitter:description" :content="twitterDescription" />
    <Meta name="twitter:image" hid="twitter:image" :content="twitterImage" />
    <Meta name="twitter:url" hid="twitter:url" :content="canonical" />
    <Link rel="canonical" hid="canonical" :href="canonical" />
  </Head>
</template>

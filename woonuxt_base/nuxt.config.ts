import { createResolver } from '@nuxt/kit';
const { resolve } = createResolver(import.meta.url);
import redirects from './redirects.config';

export default defineNuxtConfig({
  compatibilityDate: '2025-03-30',
  future: {
    compatibilityVersion: 4,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'bg' },
      link: [
        { rel: 'icon', href: '/LeadFitnesLogoRed.svg', type: 'image/png' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/tiny-slider.css' },
      ],
      script: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/min/tiny-slider.js',
          defer: true,
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'default' },
  },

  experimental: {
    sharedPrerenderData: true,
    buildCache: true,
    defaults: {
      nuxtLink: {
        prefetch: true,
      },
    },
  },

  plugins: [resolve('./app/plugins/init.ts')],

  components: [{ path: resolve('./app/components'), pathPrefix: false }],

  modules: ['woonuxt-settings', 'nuxt-graphql-client', '@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxt/image', '@nuxtjs/i18n'],

  'graphql-client': {
    clients: {
      default: {
        host: process.env.GQL_HOST || 'http://localhost:4000/graphql',
        corsOptions: { mode: 'cors', credentials: 'include' },
        headers: { Origin: process.env.APP_HOST || 'http://localhost:3000' },
      },
    },
  },

  // Добавяне на redirects
  redirects,

  alias: {
    '#constants': resolve('./app/constants'),
    '#woo': '../.nuxt/gql/default',
  },

  hooks: {
    'pages:extend'(pages: any[]) {
      const addPage = (name: string, path: string, file: string) => {
        pages.push({ name, path, file: resolve(`./app/pages/${file}`) });
      };

      addPage('magazin-page-pager', '/magazin/page/:pageNumber', 'magazin.vue');

      // Йерархични маршрути за категории (parent/child)
      addPage('produkt-kategoriya-parent-child', '/produkt-kategoriya/:parent/:child', 'produkt-kategoriya/[parent]/[child].vue');
      addPage('produkt-kategoriya-parent-child-pager', '/produkt-kategoriya/:parent/:child/page/:pageNumber', 'produkt-kategoriya/[parent]/[child].vue');

      // Основни маршрути за категории (fallback за плоски URL-и)
      addPage('produkt-kategoriya-slug', '/produkt-kategoriya/:categorySlug', 'produkt-kategoriya/[slug].vue');
      addPage('produkt-kategoriya-page-pager', '/produkt-kategoriya/:categorySlug/page/:pageNumber', 'produkt-kategoriya/[slug].vue');

      // Маршрути за етикети
      addPage('produkt-etiket-slug', '/produkt-etiket/:tagSlug', 'produkt-etiket/[slug].vue');
      addPage('produkt-etiket-page-pager', '/produkt-etiket/:tagSlug/page/:pageNumber', 'produkt-etiket/[slug].vue');

      addPage('order-received', '/checkout/order-received/:orderId', 'order-summary.vue');
      addPage('order-summary', '/order-summary/:orderId', 'order-summary.vue');

      // Нови маршрути за produkt вместо product
      addPage('produkt-page', '/produkt/:slug', 'produkt/[slug].vue');
    },
  },

  nitro: {
    routeRules: {
      '/checkout/order-received/**': { ssr: false },
      '/order-summary/**': { ssr: false },
      '/product/**': { redirect: { to: '/produkt/**', statusCode: 301 } },
      '/products/**': { redirect: { to: '/magazin/**', statusCode: 301 } },
    },
  },

  // Multilingual support
  i18n: {
    locales: [
      { code: 'bg_BG', file: 'bg-BG.json', name: 'Български 🇧🇬' },
      { code: 'en_US', file: 'en-US.json', name: 'English 🇺🇸' },
      { code: 'de_DE', file: 'de-DE.json', name: 'Deutsch 🇩🇪' },
      { code: 'es_ES', file: 'es-ES.json', name: 'Español 🇪🇸' },
      { code: 'fr_FR', file: 'fr-FR.json', name: 'Français 🇫🇷' },
      { code: 'it_IT', file: 'it-IT.json', name: 'Italiano 🇮🇹' },
      { code: 'pt_BR', file: 'pt-BR.json', name: 'Português 🇧🇷' },
    ],
    langDir: 'locales',
    defaultLocale: 'bg_BG',
    strategy: 'no_prefix',
    restructureDir: false,
  },
});

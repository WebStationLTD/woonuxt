export default defineNuxtConfig({
  extends: ["./woonuxt_base"],

  components: [{ path: "./components", pathPrefix: false }],

  modules: ["nuxt-graphql-client", "@nuxtjs/sitemap"],

  experimental: {
    payloadExtraction: true,
  },

  runtimeConfig: {
    public: {
      GQL_HOST: "https://woonuxt-shop.admin-panels.com/graphql",
      PRODUCT_CATEGORY_PERMALINK: "/produkt-kategoriya/",
      PRODUCTS_PER_PAGE: 12,
    },
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://woonuxt-shop.admin-panels.com" },
        { rel: "dns-prefetch", href: "https://woonuxt-shop.admin-panels.com" },
      ],
    },
  },

  sitemap: {
    siteUrl: "https://woonuxt-shop.admin-panels.com",
    excludes: [
      "/checkout/order-received/**",
      "/order-summary/**",
      "/my-account/**",
      "/oauth/**",
    ],
    cacheTime: 1000 * 60 * 15,
    routes: ["/", "/products", "/categories", "/contact", "/wishlist"],
  },

  "graphql-client": {
    clients: {
      default: {
        host: "https://woonuxt-shop.admin-panels.com/graphql",
        tokenStorage: {
          cookieOptions: {
            name: "authToken",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "None",
            secure: true,
          },
        },
      },
    },
  },

  nitro: {
    prerender: {
      routes: ["/", "/products", "/categories", "/contact"],
      concurrency: 10,
      interval: 1000,
      failOnError: false,
    },
    minify: true,
    routeRules: {
      // Генерирани по време на билд
      "/": { static: true },
      "/products": { static: true },
      "/categories": { static: true },
      "/contact": { static: true },

      // Частично кеширани с ISR (Incremental Static Regeneration)
      "/produkt/**": {
        isr: {
          expiration: 600, // 10 минути
        },
      },
      "/produkt-kategoriya/**": {
        isr: {
          expiration: 600,
        },
      },

      // Страници с SSR, без кеш
      "/checkout/**": { ssr: true, cache: false },
      "/cart": { ssr: true, cache: false },
      "/my-account/**": { ssr: true, cache: false },
    },
  },

  compatibilityDate: "2025-05-03",
});

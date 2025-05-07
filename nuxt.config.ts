// https://nuxt.com/docs/api/configuration/nuxt-config
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
    siteUrl: process.env.SITE_URL || "https://woonuxt-shop.admin-panels.com",
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
      concurrency: 10,
      interval: 1000,
      failOnError: false,
    },
    minify: true,
    routeRules: {
      // Запазваме правилата от базовата конфигурация
      "/checkout/order-received/**": { ssr: false },
      "/order-summary/**": { ssr: false },

      // Прилагане на Vercel Edge Cache правила
      "/": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 10, // 10 минути кеш
            fallback: true,
          },
        },
      },
      "/products": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 30, // 30 минути кеш
            fallback: true,
          },
        },
      },
      "/product/**": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 30, // 30 минути кеш
            fallback: true,
          },
        },
      },
      "/product-category/**": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 30, // 30 минути кеш
            fallback: true,
          },
        },
      },
      "/produkt-kategoriya/**": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 30, // 30 минути кеш
            fallback: true,
          },
        },
      },
      "/categories": {
        vercel: {
          edge: false,
          isr: {
            expiration: 60 * 60, // 1 час кеш
            fallback: true,
          },
        },
      },
      // Динамични пътища които не трябва да се кешират

      "/checkout/**": { ssr: true, cache: false },
      "/my-account/**": { ssr: true, cache: false },
      "/cart": { ssr: true, cache: false },
      // API endpoints
      "/api/**": {
        vercel: {
          edge: true, // Включваме Edge за API routes
          isr: false, // Изключваме ISR за API routes
        },
      },
    },
  },

  compatibilityDate: "2025-05-03",
});

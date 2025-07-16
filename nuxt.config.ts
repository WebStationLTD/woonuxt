export default defineNuxtConfig({
  extends: ["./woonuxt_base"],

  components: [{ path: "./components", pathPrefix: false }],

  modules: ["nuxt-graphql-client", "@nuxtjs/sitemap", "@nuxt/image"],

  // Оптимизации за изображения
  image: {
    quality: 80,
    format: ["webp", "jpg"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
    densities: [1, 2],
    presets: {
      product: {
        modifiers: {
          format: "webp",
          quality: 85,
          width: 280,
          height: 315,
        },
      },
    },
  },

  experimental: {
    payloadExtraction: true,
    inlineSSRStyles: false, // Намалява размера на инлайн CSS
  },

  runtimeConfig: {
    public: {
      GQL_HOST: "https://leaderfitness.admin-panels.com/graphql",
      FRONT_END_URL: "https://woonuxt-ten.vercel.app",
      PRODUCT_CATEGORY_PERMALINK: "/produkt-kategoriya/",
      PRODUCT_TAG_PERMALINK: "/produkt-etiket/",
      PRODUCT_BRAND_PERMALINK: "/marka-produkt/",
      PRODUCTS_PER_PAGE: 12,
      // ВРЕМЕННА конфигурация за тестване на атрибутите
      // TODO: Премахнете това след като конфигурирате woonuxt-settings плъгина в WordPress
      GLOBAL_PRODUCT_ATTRIBUTES: [
        {
          slug: "pa_brands", // Този работи!
          label: "Марка",
          showCount: false,
          openByDefault: false,
        },
        {
          slug: "pa_razmer", // Размер атрибут
          label: "Размер",
          showCount: false,
          openByDefault: false,
        },
      ],
    },
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://leaderfitness.admin-panels.com" },
        { rel: "dns-prefetch", href: "https://leaderfitness.admin-panels.com" },
      ],
    },
  },

  sitemap: {
    siteUrl: "https://woonuxt-ten.vercel.app",
    excludes: [
      "/checkout/order-received/**",
      "/order-summary/**",
      "/my-account/**",
      "/oauth/**",
    ],
    cacheTime: 1000 * 60 * 15,
    routes: [
      "/",
      "/magazin",
      "/categories",
      "/etiketi",
      "/marki",
      "/contact",
      "/wishlist",
    ],
  },

  "graphql-client": {
    clients: {
      default: {
        host: "https://leaderfitness.admin-panels.com/graphql",
        retainQuery: true,
        tokenStorage: {
          cookieOptions: {
            name: "authToken",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "None",
            secure: true,
          },
        },
        cacheOptions: {
          maxAge: 1000 * 60 * 5, // 5 минути кеш за GraphQL заявки
        },
      },
    },
  },

  nitro: {
    prerender: {
      routes: [
        "/",
        "/magazin",
        "/categories",
        "/etiketi",
        "/marki",
        "/contact",
        "/blog",
      ],
      concurrency: 10,
      interval: 1000,
      failOnError: false,
    },
    minify: true,
    compressPublicAssets: true,
    routeRules: {
      // Генерирани по време на билд
      "/": { static: true },
      "/magazin": {
        // isr: {
        //   expiration: 300, // 5 минути за продукти
        // },
        headers: {
          "Cache-Control": "s-maxage=300",
        },
      },
      "/categories": { static: true },
      "/etiketi": { static: true },
      "/contact": { static: true },
      "/blog": { static: true },

      // Частично кеширани с ISR (Incremental Static Regeneration)
      "/produkt/**": {
        isr: {
          expiration: 600, // 10 минути
        },
        headers: {
          "Cache-Control": "s-maxage=600",
        },
      },
      "/produkt-kategoriya/**": {
        isr: {
          expiration: 300, // 5 минути за категории
        },
        headers: {
          "Cache-Control": "s-maxage=300",
        },
      },
      "/produkt-etiket/**": {
        isr: {
          expiration: 300, // 5 минути за етикети
        },
        headers: {
          "Cache-Control": "s-maxage=300",
        },
      },
      "/marka-produkt/**": {
        isr: {
          expiration: 300, // 5 минути за марки
        },
        headers: {
          "Cache-Control": "s-maxage=300",
        },
      },

      // Блог постове с ISR
      "/blog/**": {
        isr: {
          expiration: 1800, // 30 минути за блог постове
        },
        headers: {
          "Cache-Control": "s-maxage=1800",
        },
      },

      // Странци с SSR, без кеш
      "/checkout/**": { ssr: true, cache: false },
      "/cart": { ssr: true, cache: false },
      "/my-account/**": { ssr: true, cache: false },

      // Статични файлове с дълъг кеш
      "/images/**": {
        headers: {
          "Cache-Control": "max-age=31536000",
        },
      },
    },
  },

  // Оптимизации за build
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "product-components": [
              "./woonuxt_base/app/components/productElements/ProductCard.vue",
              "./woonuxt_base/app/components/shopElements/ProductGrid.vue",
            ],
          },
        },
      },
    },
  },

  compatibilityDate: "2025-05-03",
});

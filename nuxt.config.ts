// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["./woonuxt_base"],
  components: [{ path: "./components", pathPrefix: false }],
  modules: ["nuxt-graphql-client", "@nuxtjs/sitemap"],

  runtimeConfig: {
    public: {
      GQL_HOST: "https://woonuxt.rosset.website/graphql",
      PRODUCT_CATEGORY_PERMALINK: "/produkt-kategoriya/",
      PRODUCTS_PER_PAGE: 12,
    },
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://woonuxt.rosset.website" },
        { rel: "dns-prefetch", href: "https://woonuxt.rosset.website" },
      ],
    },
  },

  sitemap: {
    siteUrl: process.env.SITE_URL || "https://woonuxt.rosset.website",
    excludes: [
      "/checkout/order-received/**",
      "/order-summary/**",
      "/my-account/**",
      "/oauth/**",
    ],
    cacheTime: 1000 * 60 * 15,
    routes: ["/", "/products", "/categories", "/contact", "/wishlist"],
  },

  // "graphql-client": {
  //   clients: {
  //     default: {
  //       host:
  //         process.env.NODE_ENV === "production"
  //           ? "/api/graphql"
  //           : "https://woonuxt.rosset.website/graphql",
  //       tokenStorage: {
  //         cookieOptions: {
  //           name: "authToken",
  //           maxAge: 60 * 60 * 24 * 7,
  //           sameSite: "None",
  //           secure: true,
  //         },
  //       },
  //     },
  //   },
  // },

  "graphql-client": {
    clients: {
      default: {
        host: "https://woonuxt.rosset.website/graphql",
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
  },

  compatibilityDate: "2025-05-03",
});

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["./woonuxt_base"],

  components: [{ path: "./components", pathPrefix: false }],

  modules: ["nuxt-graphql-client", "@nuxtjs/sitemap"],

  runtimeConfig: {
    public: {
      GQL_HOST: "https://woonuxt-shop.admin-panels.com/graphql",
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
        host:
          process.env.NODE_ENV === "production"
            ? "/api/graphql"
            : "https://woonuxt-shop.admin-panels.com/graphql",
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
    routeRules: {
      "/api/graphql": {
        proxy: "https://woonuxt-shop.admin-panels.com/graphql",
        cors: true,
      },
    },
  },
});

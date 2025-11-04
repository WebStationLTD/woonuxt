// Зареждане на .env файл ПРЕДИ defineNuxtConfig
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Път до .env файла
const envPath = resolve(__dirname, ".env");

if (existsSync(envPath)) {
  try {
    // Прочети файла
    const envContent = readFileSync(envPath, "utf8");

    // CUSTOM PARSER (защото dotenv има проблем с multiline)
    const lines = envContent.split(/\r?\n/);
    let currentKey = "";
    let currentValue = "";
    let inQuotedValue = false;

    lines.forEach((line) => {
      // Ако сме в quoted value, събираме редове
      if (inQuotedValue) {
        currentValue += "\n" + line;
        if (line.trim().endsWith('"')) {
          // Край на quoted value
          inQuotedValue = false;
          // Премахни кавичките и setни променливата
          process.env[currentKey] = currentValue.substring(
            1,
            currentValue.length - 1
          );
          currentKey = "";
          currentValue = "";
        }
        return;
      }

      // Игнорирай коментари и празни редове
      if (line.trim().startsWith("#") || line.trim() === "") return;

      // Намери KEY=VALUE
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (match && match[1] && match[2] !== undefined) {
        const key = match[1];
        const value = match[2];

        // Ако стойността започва с ", проверяваме дали завършва с "
        if (value.startsWith('"')) {
          if (value.endsWith('"') && value.length > 1) {
            // Single line quoted value
            process.env[key] = value.substring(1, value.length - 1);
          } else {
            // Multiline quoted value
            inQuotedValue = true;
            currentKey = key;
            currentValue = value;
          }
        } else {
          // Обикновена стойност
          process.env[key] = value;
        }
      }
    });

    console.log("✅ Environment variables loaded successfully");
  } catch (error: any) {
    console.error("❌ Error loading .env:", error.message);
  }
}

export default defineNuxtConfig({
  extends: ["./woonuxt_base"],

  components: [{ path: "./components", pathPrefix: false }],

  modules: [
    "nuxt-graphql-client",
    "@nuxtjs/sitemap",
    "@nuxt/image",
    "@nuxtjs/critters", // Critical CSS extraction - инлайнва само критичния CSS
  ],

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
    inlineSSRStyles: false, // FALSE - @nuxtjs/critters се грижи за critical CSS extraction
    defaults: {
      nuxtLink: {
        // ⚡ ОПТИМИЗАЦИЯ НИВО 1.4: SMART PREFETCH
        // Само при interaction (hover/focus) - НЕ viewport
        // Това предотвратява агресивен prefetch който може да забавя навигацията
        prefetch: false, // ИЗКЛЮЧЕН viewport prefetch (беше true)
        prefetchOn: {
          interaction: true, // ✅ ЗАПАЗЕН hover/focus prefetch
          visibility: false, // ❌ ИЗКЛЮЧЕН visibility prefetch
        },
      },
    },
  },

  // ⚡ EMERGENCY FIX 2.3: АГРЕСИВНА CRITICAL CSS КОНФИГУРАЦИЯ
  // Елиминира render-blocking CSS (спестява ~150ms)
  critters: {
    config: {
      preload: "swap", // Preload non-critical CSS асинхронно
      pruneSource: false, // Запазва оригиналния CSS файл за browser cache
      reduceInlineStyles: false, // ⚡ ПРОМЕНЕНО: false за да инлайнва повече critical CSS
      preloadFonts: true, // Preload критични шрифтове
      // ⚡ ДОБАВЕНО: Агресивни настройки
      inlineFonts: true, // Инлайнва critical fonts като data URIs
      minimumExternalSize: 0, // Инлайнва всички малки CSS файлове
      compress: true, // Компресира инлайнвания CSS
      logLevel: "info", // За debugging
    },
  },

  runtimeConfig: {
    // Private keys (только за server-side)
    BORICA_TERMINAL_ID: process.env.BORICA_TERMINAL_ID,
    BORICA_PRIVATE_KEY: process.env.BORICA_PRIVATE_KEY,
    BORICA_MERCHANT_NAME: process.env.BORICA_MERCHANT_NAME,
    BORICA_MERCHANT_URL: process.env.BORICA_MERCHANT_URL,
    BORICA_BACKREF_URL: process.env.BORICA_BACKREF_URL,
    BORICA_GATEWAY_URL: process.env.BORICA_GATEWAY_URL,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
    WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY,
    WC_CONSUMER_SECRET: process.env.WC_CONSUMER_SECRET,

    // Tracking API Keys (server-side за Conversion APIs)
    META_CONVERSION_API_TOKEN: process.env.META_CONVERSION_API_TOKEN,
    GOOGLE_ANALYTICS_API_SECRET: process.env.GOOGLE_ANALYTICS_API_SECRET,

    public: {
      GQL_HOST: "https://admin.leaderfitness.net/graphql",
      // GQL_HOST: "http://leaderfitness.local/graphql",
      FRONT_END_URL: "https://leaderfitness.net",
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

      // Tracking Configuration (public за client-side)
      TRACKING_ENABLED: process.env.TRACKING_ENABLED === "true",
      TRACKING_DEBUG: process.env.TRACKING_DEBUG === "true",
      TRACKING_GDPR_MODE: process.env.TRACKING_GDPR_MODE === "true",
      META_PIXEL_ID: process.env.META_PIXEL_ID || "",
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || "",
      GOOGLE_ADS_ID: process.env.GOOGLE_ADS_ID || "",
      GOOGLE_ADS_ENHANCED_CONVERSIONS:
        process.env.GOOGLE_ADS_ENHANCED_CONVERSIONS === "true",
      GTM_ID: process.env.GTM_ID || "",
      GTM_DATA_LAYER_ONLY: process.env.GTM_DATA_LAYER_ONLY === "true",
    },
  },

  app: {
    head: {
      link: [
        {
          rel: "preconnect",
          href: "https://admin.leaderfitness.net",
          crossorigin: "",
        },
        { rel: "dns-prefetch", href: "https://admin.leaderfitness.net" },
        // ⚡ EMERGENCY FIX 2.1: Font Optimization
        // Preconnect за Google Fonts - спестява ~150ms (Lighthouse препоръка)
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
          crossorigin: "",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
        { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      ],
    },
  },

  // ⚡ EMERGENCY FIX 2.1: Global CSS за font optimization
  css: ["~/assets/css/fonts.css"],

  // Sitemap генерирането е изнесено в scripts/generate-sitemap.js
  // защото Headless WP блокира server-side GraphQL заявки без Origin header
  sitemap: {
    enabled: false,
  },

  "graphql-client": {
    clients: {
      default: {
        host: "https://admin.leaderfitness.net/graphql",
        // host: "http://leaderfitness.local/graphql",
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
          maxAge: 1000 * 60 * 15, // 15 минути кеш за GraphQL заявки (беше 5)
        },
      },
    },
  },

  nitro: {
    prerender: {
      routes: [
        "/",
        // "/magazin", // ПРЕМАХНАТО - твърде тежка страница за build (1800+ продукта)
        "/categories",
        "/etiketi",
        "/marki-produkti",
        "/contact",
        "/blog",
      ],
      concurrency: 15, // Увеличено от 10 на 15 (по-бързи builds)
      interval: 500, // Намалено от 1000 на 500ms (по-бързо)
      failOnError: false,
      crawlLinks: false, // Не crawl-вай автоматично други страници
    },
    minify: true,
    compressPublicAssets: {
      brotli: true, // Добавена Brotli компресия
      gzip: true,
    },
    routeRules: {
      // ========================================
      // СТАТИЧНИ СТРАНИЦИ (генерират се при build)
      // ========================================
      "/": {
        prerender: true,
        headers: {
          "Cache-Control":
            "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
      "/categories": {
        prerender: true,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800",
        },
      },
      "/etiketi": {
        prerender: true,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800",
        },
      },
      "/marki-produkti": {
        prerender: true,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800",
        },
      },
      "/contact": {
        prerender: true,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      },

      // ========================================
      // /magazin - SSR + АГРЕСИВЕН EDGE CACHE
      // (НЕ СЕ ГЕНЕРИРА ПРИ BUILD - твърде тежка)
      // ========================================
      "/magazin": {
        ssr: true, // SSR при първо посещение
        headers: {
          // Edge кешира 2 часа, браузър 5 мин, stale 4 часа
          "Cache-Control":
            "public, s-maxage=7200, max-age=300, stale-while-revalidate=14400",
        },
      },

      // ========================================
      // ISR СТРАНИЦИ - 30 минути (беше 5-10 мин)
      // ========================================
      "/produkt/**": {
        isr: {
          expiration: 1800, // 30 минути (беше 10)
        },
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, max-age=600, stale-while-revalidate=3600",
        },
      },
      "/produkt-kategoriya/**": {
        isr: {
          expiration: 1800, // 30 минути (беше 5)
        },
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, max-age=300, stale-while-revalidate=3600",
        },
      },
      "/produkt-etiket/**": {
        isr: {
          expiration: 1800, // 30 минути (беше 5)
        },
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, max-age=300, stale-while-revalidate=3600",
        },
      },
      "/marka-produkt/**": {
        isr: {
          expiration: 1800, // 30 минути (беше 5)
        },
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, max-age=300, stale-while-revalidate=3600",
        },
      },

      // ========================================
      // БЛОГ - ISR 1 час (беше 30 мин)
      // ========================================
      "/blog/**": {
        isr: {
          expiration: 3600, // 1 час
        },
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, max-age=900, stale-while-revalidate=7200",
        },
      },

      // ========================================
      // ДИНАМИЧНИ СТРАНИЦИ - БЕЗ КЕШ
      // ========================================
      "/checkout/**": {
        ssr: true,
        cache: false,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
      "/cart": {
        ssr: true,
        cache: false,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
      "/my-account/**": {
        ssr: true,
        cache: false,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },

      // ========================================
      // СТАТИЧНИ РЕСУРСИ - IMMUTABLE
      // ========================================
      "/_nuxt/**": {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      },
      "/images/**": {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
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
    esbuild: {
      // ⚡ ФАЗА 1: Премахване на console.log в production за по-добър performance
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },

  compatibilityDate: "2025-05-03",
});

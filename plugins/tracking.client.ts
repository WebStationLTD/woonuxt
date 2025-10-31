/**
 * Tracking Plugin
 * Инициализира Meta Pixel, Google Analytics 4, Google Ads и GTM
 * Client-side only plugin
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  // Проверка дали tracking е активиран
  if (!config.public.TRACKING_ENABLED) {
    console.log("🚫 Tracking е деактивиран");
    return;
  }

  if (config.public.TRACKING_DEBUG) {
    console.log("🎯 Tracking Plugin initialized with config:", {
      metaPixel: !!config.public.META_PIXEL_ID,
      googleAnalytics: !!config.public.GOOGLE_ANALYTICS_ID,
      googleAds: !!config.public.GOOGLE_ADS_ID,
      gtm: !!config.public.GTM_ID,
    });
  }

  // ============================================
  // GOOGLE TAG MANAGER (GTM)
  // ============================================
  if (config.public.GTM_ID) {
    // Инициализираме data layer ПРЕДИ GTM скрипта
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });

    // Добавяме GTM скрипта
    const gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${config.public.GTM_ID}`;
    document.head.appendChild(gtmScript);

    // Добавяме GTM noscript iframe за fallback
    const gtmIframe = document.createElement("noscript");
    gtmIframe.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${config.public.GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(gtmIframe, document.body.firstChild);

    if (config.public.TRACKING_DEBUG) {
      console.log("✅ GTM initialized:", config.public.GTM_ID);
    }
  }

  // ============================================
  // META (FACEBOOK) PIXEL
  // ============================================
  if (config.public.META_PIXEL_ID) {
    // Facebook Pixel Base Code
    !(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );

    window.fbq("init", config.public.META_PIXEL_ID);
    window.fbq("track", "PageView");

    if (config.public.TRACKING_DEBUG) {
      console.log("✅ Meta Pixel initialized:", config.public.META_PIXEL_ID);
    }
  }

  // ============================================
  // GOOGLE ANALYTICS 4 (GA4)
  // ============================================
  if (config.public.GOOGLE_ANALYTICS_ID) {
    // Добавяме GA4 скрипта
    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${config.public.GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(gaScript);

    // Инициализираме gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", config.public.GOOGLE_ANALYTICS_ID, {
      send_page_view: true,
    });

    if (config.public.TRACKING_DEBUG) {
      console.log(
        "✅ Google Analytics initialized:",
        config.public.GOOGLE_ANALYTICS_ID
      );
    }
  }

  // ============================================
  // GOOGLE ADS
  // ============================================
  if (config.public.GOOGLE_ADS_ID) {
    // Google Ads използва gtag, който вече е инициализиран от GA4
    if (window.gtag) {
      window.gtag("config", config.public.GOOGLE_ADS_ID);

      // Enhanced Conversions
      if (config.public.GOOGLE_ADS_ENHANCED_CONVERSIONS) {
        window.gtag("set", "allow_enhanced_conversions", true);
      }

      if (config.public.TRACKING_DEBUG) {
        console.log("✅ Google Ads initialized:", config.public.GOOGLE_ADS_ID);
      }
    } else {
      console.warn("⚠️ Google Ads изисква Google Analytics да е активиран");
    }
  }

  // ============================================
  // ROUTE CHANGE TRACKING - ⚡ ОПТИМИЗАЦИЯ НИВО 1.2
  // ============================================
  // Проследяване на page views при промяна на маршрута
  // ⚡ LAZY TRACKING с requestIdleCallback - не блокира UI
  nuxtApp.hook("page:finish", () => {
    const route = useRoute();
    const url = window.location.href;
    const path = route.path;

    // ⚡ КРИТИЧНА ОПТИМИЗАЦИЯ: Отлагаме tracking до idle време
    // Това позволява UI да се рендира първи, tracking не блокира
    const sendTrackingEvents = () => {
      if (config.public.TRACKING_DEBUG) {
        console.log("📄 Page View:", path);
      }

      // Meta Pixel PageView
      if (window.fbq) {
        window.fbq("track", "PageView");
      }

      // Google Analytics PageView
      if (window.gtag && config.public.GOOGLE_ANALYTICS_ID) {
        window.gtag("config", config.public.GOOGLE_ANALYTICS_ID, {
          page_path: path,
          page_location: url,
        });
      }

      // GTM PageView
      if (window.dataLayer && config.public.GTM_ID) {
        window.dataLayer.push({
          event: "page_view",
          page_path: path,
          page_location: url,
        });
      }
    };

    // Използваме requestIdleCallback за да не блокираме UI
    if ("requestIdleCallback" in window) {
      requestIdleCallback(sendTrackingEvents, { timeout: 1000 });
    } else {
      // Fallback за браузъри без requestIdleCallback
      setTimeout(sendTrackingEvents, 50);
    }
  });
});

// TypeScript типове за window обектите
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

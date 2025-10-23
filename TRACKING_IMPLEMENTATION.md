# 🎯 Tracking & Analytics Система - Пълна Документация

## 📋 Съдържание

1. [Обзор](#обзор)
2. [Инсталирани Платформи](#инсталирани-платформи)
3. [Файлова Структура](#файлова-структура)
4. [Конфигурация](#конфигурация)
5. [Tracking События](#tracking-събития)
6. [Как да използвам](#как-да-използвам)
7. [Testing & Debugging](#testing--debugging)
8. [FAQ](#faq)

---

## 🔍 Обзор

Тази имплементация представлява **професионална tracking система** за Headless WordPress + Nuxt.js архитектура, която заменя **PixelYourSite PRO** плъгина с native Nuxt решение.

### ✨ Предимства на това решение:

- ✅ **Пълна контрола** над tracking събития
- ✅ **По-бърза производителност** (без WordPress overhead)
- ✅ **Client-side и Server-side tracking** възможности
- ✅ **Автоматично проследяване** на всички WooCommerce събития
- ✅ **GDPR compliant** опция
- ✅ **Лесна конфигурация** през environment variables
- ✅ **Debug режим** за тестване

---

## 📡 Инсталирани Платформи

Системата поддържа следните tracking платформи:

### 1. Meta (Facebook) Pixel

- **ID:** 224997332649286
- **Conversion API:** Активиран (server-side tracking)
- **События:** PageView, ViewContent, AddToCart, InitiateCheckout, Purchase

### 2. Google Analytics 4

- **Tracking ID:** G-07DTZ2TF4V
- **Measurement Protocol API:** Активиран (server-side)
- **События:** page_view, view_item, add_to_cart, begin_checkout, purchase

### 3. Google Ads

- **Conversion ID:** AW-992774522
- **Enhanced Conversions:** ✅ Активирано
- **События:** conversion (purchase)

### 4. Google Tag Manager

- **Container ID:** GTM-5MJD9KF6
- **Data Layer Only:** ✅ Активирано
- **Събития:** Всички е-commerce събития + custom WooCommerce purchase event

---

## 📁 Файлова Структура

```
woonuxt/
├── plugins/
│   └── tracking.client.ts          # Инициализация на tracking scripts
├── composables/
│   └── useTracking.ts               # Tracking функции (API)
├── tracking.env.template            # Template за .env конфигурация
├── nuxt.config.ts                   # Конфигурация с tracking env vars
└── Променени файлове:
    ├── woonuxt_base/app/composables/useCart.ts         # AddToCart, RemoveFromCart
    ├── woonuxt_base/app/pages/checkout.vue             # InitiateCheckout
    ├── woonuxt_base/app/pages/order-summary.vue        # Purchase
    └── woonuxt_base/app/pages/produkt/[slug].vue       # ViewContent
```

---

## ⚙️ Конфигурация

### Стъпка 1: Копирай tracking.env.template

```bash
# В главната папка на проекта
cp tracking.env.template .env
```

### Стъпка 2: Попълни данните в .env файла

```env
# META PIXEL
META_PIXEL_ID=224997332649286
META_CONVERSION_API_TOKEN=EAAFiiADPyDsBOwApvn4hUGSebj77l17huvZAwGVPTZBjnidrbTZCBqQv3MJ0UlhgNo49oNZAAclxCSNGNyEZBSDtrobxY9x3vgRs84313UzgFQXvhHJGLKXZAmo95u5TpTdE8OjYnOPaOTGCZBdWQTDizePxQLaewNcDrNlXHhtiGEsHEZCO74B7YNdzL4ubjwZDZD

# GOOGLE ANALYTICS 4
GOOGLE_ANALYTICS_ID=G-07DTZ2TF4V
GOOGLE_ANALYTICS_API_SECRET=7rHfoFZ4S7K-qxp4NojvCQ

# GOOGLE ADS
GOOGLE_ADS_ID=AW-992774522
GOOGLE_ADS_ENHANCED_CONVERSIONS=true

# GOOGLE TAG MANAGER
GTM_ID=GTM-5MJD9KF6
GTM_DATA_LAYER_ONLY=true

# GENERAL
TRACKING_ENABLED=true
TRACKING_DEBUG=false
TRACKING_GDPR_MODE=false
```

### Стъпка 3: Restart на dev сървъра

```bash
npm run dev
```

### Стъпка 4: Deploy на production

```bash
# За Vercel
vercel env add TRACKING_ENABLED
# ... добави всички останали environment variables
```

---

## 🎯 Tracking События

Системата автоматично проследява следните събития:

### 1. 📄 PageView

**Къде:** Автоматично при всяка промяна на маршрут  
**Платформи:** Meta Pixel, GA4, GTM  
**Данни:** URL, path

### 2. 👁️ ViewContent

**Къде:** Продуктови страници (`/produkt/[slug]`)  
**Платформи:** Meta Pixel, GA4, GTM  
**Данни:**

- Product ID
- Product Name
- Price
- Category
- Brand
- SKU

### 3. 🛒 AddToCart

**Къде:** При добавяне на продукт в количката  
**Платформи:** Meta Pixel, GA4, GTM  
**Данни:**

- Product ID
- Product Name
- Price
- Quantity
- Category
- Brand

### 4. 🗑️ RemoveFromCart

**Къде:** При премахване на продукт от количката  
**Платформи:** Meta Pixel (custom), GA4, GTM  
**Данни:** Същите като AddToCart

### 5. 🛍️ InitiateCheckout

**Къде:** При влизане в `/checkout` страницата  
**Платформи:** Meta Pixel, GA4, GTM  
**Данни:**

- Cart Total Value
- All Products in Cart
- Number of Items

### 6. 💰 Purchase

**Къде:** След успешна поръчка (order-received страница)  
**Платформи:** Meta Pixel, GA4, Google Ads Conversion, GTM  
**Данни:**

- Order ID
- Total Amount
- Tax
- Shipping
- Products
- Coupon Code

### 7. 🔍 Search (готов за използване)

**Функция:** `trackSearch(searchTerm, results)`  
**Платформи:** Meta Pixel, GA4, GTM

### 8. 📧 Lead (готов за използване)

**Функция:** `trackLead(leadType)`  
**Платформи:** Meta Pixel, GA4, GTM

---

## 💻 Как да използвам

### Основно използване

```typescript
// В Vue компонент
<script setup>
const { trackEvent, trackSearch, trackLead } = useTracking();

// Generic event
function onButtonClick() {
  trackEvent('CustomEvent', {
    action: 'click',
    label: 'Subscribe Button'
  });
}

// Search event
function onSearch(term) {
  trackSearch(term, 15); // 15 резултата
}

// Lead generation (напр. contact form)
function onContactFormSubmit() {
  trackLead('contact_form');
}
</script>
```

### Custom Tracking за продукти

```typescript
import { trackViewContent, trackAddToCart } from "@/composables/useTracking";

// Manual tracking за ViewContent
trackViewContent({
  id: 123,
  name: "Протеин Whey 1kg",
  price: 59.9,
  category: "Протеини",
  brand: "MyBrand",
  sku: "WHEY-1KG",
});

// Manual tracking за AddToCart
trackAddToCart({
  id: 123,
  name: "Протеин Whey 1kg",
  price: 59.9,
  quantity: 2,
  category: "Протеини",
  brand: "MyBrand",
});
```

---

## 🧪 Testing & Debugging

### Debug Mode

Активирай debug режим в `.env`:

```env
TRACKING_DEBUG=true
```

Това ще показва всички tracking събития в browser console:

```
🎯 Tracking Event: AddToCart { id: 123, name: 'Protein', ... }
✅ Meta Pixel initialized: 224997332649286
✅ Google Analytics initialized: G-07DTZ2TF4V
📄 Page View: /produkt/protein-whey
```

### Тестване на Meta Pixel

1. Инсталирай **Meta Pixel Helper** Chrome extension
2. Отвори сайта
3. Кликни на extension иконата
4. Ще видиш всички изпратени Meta Pixel събития

### Тестване на Google Analytics

1. Отвори **Chrome DevTools** (F12)
2. Network tab
3. Филтрирай по `google-analytics.com` или `gtag`
4. Ще видиш всички GA4 requests

### Тестване на GTM

1. Инсталирай **Tag Assistant Legacy** Chrome extension
2. Отвори сайта с активирана extension
3. Ще видиш всички GTM tags и data layer push-ове

### Test Purchases

За да тествате Purchase tracking БЕЗ да правите реални покупки:

```javascript
// В browser console
const { trackPurchase } = useTracking();

trackPurchase({
  orderId: "TEST-12345",
  total: 199.99,
  tax: 39.99,
  shipping: 10.0,
  currency: "BGN",
  products: [
    {
      id: 123,
      name: "Test Product",
      price: 150.0,
      quantity: 1,
      category: "Test Category",
    },
  ],
});
```

---

## 🛡️ GDPR Compliance

### Активиране на GDPR режим

```env
TRACKING_GDPR_MODE=true
```

В GDPR режим, tracking ще изчака потребителско съгласие.

### Имплементация на Cookie Consent (препоръчително)

```vue
<script setup>
const { trackEvent } = useTracking();

function onUserConsent() {
  // След потребителско съгласие, активирай tracking
  localStorage.setItem("tracking_consent", "true");

  // Инициализирай tracking ръчно
  window.location.reload(); // или custom логика
}
</script>
```

---

## 🔧 Разширяване

### Добавяне на нова платформа (напр. TikTok Pixel)

#### 1. Добави в `tracking.env.template`:

```env
TIKTOK_PIXEL_ID=YOUR_TIKTOK_PIXEL_ID
```

#### 2. Добави в `nuxt.config.ts`:

```typescript
public: {
  TIKTOK_PIXEL_ID: process.env.TIKTOK_PIXEL_ID || '',
}
```

#### 3. Добави в `plugins/tracking.client.ts`:

```typescript
if (config.public.TIKTOK_PIXEL_ID) {
  // TikTok Pixel initialization code
  !function(w,d,t){...}(window,document,'script');
  ttq.load(config.public.TIKTOK_PIXEL_ID);
  ttq.page();
}
```

#### 4. Добави в `composables/useTracking.ts`:

```typescript
// TikTok Pixel tracking
if (window.ttq) {
  window.ttq.track('AddToCart', {...});
}
```

### Добавяне на ново custom събитие

```typescript
// В useTracking.ts
function trackCustomEvent(eventName: string, data: any) {
  if (!isEnabled || !process.client) return;

  // Meta Pixel
  if (window.fbq) {
    window.fbq("trackCustom", eventName, data);
  }

  // GA4
  if (window.gtag) {
    window.gtag("event", eventName, data);
  }

  // GTM
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...data,
    });
  }
}
```

---

## ❓ FAQ

### 1. Защо не виждам tracking събития в Meta Events Manager?

**Отговор:**

- Провери дали `TRACKING_ENABLED=true` в `.env`
- Провери дали Meta Pixel ID е правилен
- Включи Debug режим и провери в Console
- Изчакай 20-30 минути за данните да се появят в Events Manager

### 2. Как да тествам без да правя реални покупки?

**Отговор:** Използвай Test Mode в Meta Events Manager и GTM Preview режим. Виж секцията [Testing & Debugging](#testing--debugging).

### 3. Tracking работи ли с ad blockers?

**Отговор:** Не, повечето ad blockers блокират tracking scripts. За максимална точност, препоръчваме Server-Side tracking (Conversion API).

### 4. Как да деактивирам tracking временно?

**Отговор:** Промени `.env`:

```env
TRACKING_ENABLED=false
```

### 5. Може ли да използвам само GTM?

**Отговор:** Да! Можеш да деактивираш останалите:

```env
META_PIXEL_ID=
GOOGLE_ANALYTICS_ID=
GOOGLE_ADS_ID=
GTM_ID=GTM-5MJD9KF6  # само GTM
```

### 6. Tracking работи ли на SSR страници?

**Отговор:** Tracking е само **client-side** (`tracking.client.ts`). Всички tracking функции проверяват `process.client` преди изпълнение.

### 7. Как да добавя server-side tracking (Conversion API)?

**Отговор:** Това изисква backend имплементация. Създай Nuxt server endpoint (`/server/api/tracking.post.ts`) и изпращай tracking данни до Facebook Conversion API и Google Measurement Protocol API.

### 8. Дублират ли се събития между GTM и GA4?

**Отговор:** Ако използваш GTM с GA4 tag И директно GA4, да. Препоръка:

- Използвай само GTM (деактивирай директно GA4)
- ИЛИ използвай директно GA4 (деактивирай GTM GA4 tag)

---

## 📞 Support

Ако имаш въпроси или проблеми:

1. Провери Debug режима
2. Провери конфигурацията в `.env`
3. Провери browser console за грешки
4. Тествай с Meta Pixel Helper / Tag Assistant

---

## ✅ Checklist за Production

Преди да deploy-неш на production:

- [ ] Всички tracking IDs са правилни в `.env`
- [ ] `TRACKING_ENABLED=true`
- [ ] `TRACKING_DEBUG=false` (важно!)
- [ ] Тестван е пълен purchase flow
- [ ] Meta Pixel Helper показва всички събития
- [ ] GTM Preview режим показва всички tags
- [ ] Environment variables са добавени в Vercel/Netlify
- [ ] GDPR cookie consent е имплементиран (ако е нужен)

---

## 🎉 Готово!

Сега имаш професионална tracking система, която **надминава PixelYourSite PRO** по функционалност и производителност! 🚀

**Последна промяна:** 23 Октомври 2025

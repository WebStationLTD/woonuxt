# 📊 АНАЛИЗ НА ТЕКУЩОТО СЪСТОЯНИЕ (след rollback)

## 🔍 ТЕКУЩ COMMIT: 21509e0
**"perf: optimize category page loading with hover prefetch and lazy filters - RISCKY"**

---

## ✅ КАКВО ИМА (работещи оптимизации):

### 1️⃣ **Image Optimization в nuxt.config.ts:**
```typescript
image: {
  quality: 80,
  format: ["webp", "jpg"],
  screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 },
  domains: ["admin.leaderfitness.net"],
  presets: {
    product: {
      modifiers: {
        format: "webp",
        quality: 85,
        width: 280,
        height: 315,
      }
    }
  }
}
```
**Статус:** ✅ РАБОТИ

---

### 2️⃣ **Preconnect в nuxt.config.ts:**
```typescript
app: {
  head: {
    link: [
      {
        rel: "preconnect",
        href: "https://admin.leaderfitness.net",
        crossorigin: "",
      }
    ]
  }
}
```
**Статус:** ✅ РАБОТИ

---

### 3️⃣ **VariableProduct.gql промяна:**
- Има МАЛКА промяна в commit 21509e0
- НО все още `variations(first: 100)` - НЕ е оптимизирано!
**Статус:** ⚠️ ЧАСТИЧНО (промяна има, но variations е 100)

---

## ❌ КАКВО ЛИПСВА (не е оптимизирано):

### 1️⃣ **GraphQL Query Optimization:**

**VariableProduct.gql:**
- ❌ `variations(first: 100)` → трябва да е 20
- ❌ `galleryImages(first: 20)` → може да е 10

**SimpleProduct.gql:**
- ❌ `galleryImages(first: 20)` → може да е 10

**CartFragment.gql:**
- ✅ Използва пълни fragments (правилно)

**getProducts.gql, getProduct.gql:**
- ❌ НЕ използват оптимизирани Grid fragments

---

### 2️⃣ **ProductCard.vue:**
```vue
<!-- Текущо: -->
<NuxtImg
  placeholder
  placeholder-class="blur-xl"
/>
```
**Липсва:**
- ❌ `fetchpriority="high"` за първи 4 снимки
- ❌ `loading="eager"` за първи 4 снимки
- ❌ Оптимизиран `sizes` атрибут

---

### 3️⃣ **useProducts.ts - PAGINATION BUG:**
```typescript
// СТАРА ЛОГИКА (ЛОША):
const totalProductsNeeded = page * productsPerPage.value + 1;
const variables: any = {
  first: totalProductsNeeded, // ЗАРЕЖДА ВСИЧКИ продукти до страницата!
};
```

**Проблем:**
- Страница 1: зарежда 25 продукта ✅
- Страница 10: зарежда 241 продукта ❌❌❌
- Страница 50: зарежда 1201 продукта ❌❌❌

**Трябва:**
```typescript
const variables: any = {
  first: productsPerPage.value, // САМО 24 продукта
};
```

---

### 4️⃣ **CategoryCard.vue:**
- ❌ Няма `fetchpriority="high"` за eager-loaded снимки

---

### 5️⃣ **FeaturedCategories.vue:**
- ❌ Няма `fetchpriority="high"` за hero image

---

### 6️⃣ **nuxt.config.ts - Липсващи оптимизации:**

**CSS Optimization:**
- ❌ `cssCodeSplit: true`
- ❌ PostCSS cssnano за minification

**Code Splitting:**
- ❌ `manualChunks` за vendor/product/filter splitting

**Link Prefetch:**
- ❌ `prefetch: true` за NuxtLink
- ❌ `prefetchOn: { interaction: true }` за hover

**Compression:**
- ❌ Brotli/Gzip в `nitro.compressPublicAssets`

---

## 🎯 ОБОБЩЕНИЕ:

### ✅ РАБОТИ (от преди):
1. Image config (quality 80, webp format)
2. Preconnect към GraphQL API
3. Product image preset

### ❌ НЕ РАБОТИ / ЛИПСВА:
1. **КРИТИЧНО:** Pagination bug в useProducts.ts
2. GraphQL variations/gallery оптимизации
3. fetchpriority за критични изображения
4. CSS code splitting
5. JavaScript code splitting
6. Link prefetching
7. Compression

---

## 📊 КАКВО СЕ СЛУЧИ:

Commit **21509e0** има САМО:
- Hover prefetch config (малко)
- MegaMenu промени (frontend)
- Filters lazy loading
- Малка промяна в VariableProduct.gql

**НО НЯМА:**
- Pagination fix
- fetchpriority оптимизации
- CSS/JS splitting
- Gallery/Variations намаляване

---

## 💡 ИЗВОД:

**Сайтът е почти БЕЗ оптимизации!**

Commit 21509e0 е ПРЕДИ всички наши днешни промени, така че:
- ✅ РАБОТИ стабилно
- ❌ НЕ е оптимизиран
- ⚠️ ИМА pagination bug (зарежда много продукти на страница 10+)

---

## 🚀 КАКВО ТРЯБВА ДА НАПРАВИМ:

### Приоритет 1 (КРИТИЧНО):
1. ✅ Pagination fix в useProducts.ts

### Приоритет 2 (ВИСОКО):
2. ✅ GraphQL variations/gallery намаляване
3. ✅ fetchpriority за критични изображения

### Приоритет 3 (СРЕДНО):
4. ✅ CSS code splitting
5. ✅ JS code splitting
6. ✅ Link prefetch

### Приоритет 4 (НИСКО):
7. ✅ Compression (Brotli/Gzip)


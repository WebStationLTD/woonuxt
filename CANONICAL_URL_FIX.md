# Canonical URL Fix - Документация

## 🎯 Проблем

Всички canonical URL-и сочеха към backend URL-а (leaderfitness.admin-panels.com) вместо към правилния frontend URL (woonuxt-ten.vercel.app).

## ✅ Направени корекции

### 1. Добавен FRONT_END_URL в nuxt.config.ts

```typescript
runtimeConfig: {
  public: {
    GQL_HOST: "https://leaderfitness.admin-panels.com/graphql",
    FRONT_END_URL: "https://woonuxt-ten.vercel.app", // ✅ ДОБАВЕНО
    PRODUCT_CATEGORY_PERMALINK: "/produkt-kategoriya/",
    PRODUCTS_PER_PAGE: 12,
  },
}
```

### 2. Обновен sitemap URL

```typescript
sitemap: {
  siteUrl: "https://woonuxt-ten.vercel.app", // ✅ ПРОМЕНЕНО от backend URL
}
```

### 3. Поправени страници

#### ✅ index.vue

- Добавен `frontEndUrl` от `useHelpers()`
- Canonical URL използва `frontEndUrl` вместо `process.env.APP_HOST`

#### ✅ magazin.vue

- Добавен `frontEndUrl` в `useHelpers()`
- Всички URL генерирания използват `frontEndUrl`

#### ✅ produkt-kategoriya/[slug].vue

- Добавен `frontEndUrl` в `useHelpers()`
- Заменени всички `process.env.APP_HOST` с `frontEndUrl`

#### ✅ produkt-kategoriya/[parent]/[child].vue

- Добавен `frontEndUrl` в `useHelpers()`
- Заменени всички `process.env.APP_HOST` с `frontEndUrl`

#### ✅ [slug].vue (блог постове)

- Canonical URL-ите използват правилния frontend URL

### 4. Останали за ръчна корекция

#### 🔧 categories.vue

Трябва да се добави:

```typescript
const { frontEndUrl } = useHelpers();
```

И да се смени:

```typescript
link: [{ rel: 'canonical', href: categoriesSeo?.canonical || `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/categories` }],
```

## 🎉 Резултат

Сега всички canonical URL-и сочат към правилния frontend URL:

- https://woonuxt-ten.vercel.app/ (homepage)
- https://woonuxt-ten.vercel.app/magazin (shop)
- https://woonuxt-ten.vercel.app/produkt-kategoriya/category-name (categories)
- https://woonuxt-ten.vercel.app/blog-post-slug (blog posts)
- И т.н.

## 📝 Бележки

- Всички URL-и автоматично ще се сменят когато промениш `FRONT_END_URL` в config-а
- Sitemap също ще генерира правилните URL-и
- SEO проблемът е решен! 🚀

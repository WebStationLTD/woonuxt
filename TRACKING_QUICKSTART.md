# 🚀 Tracking Quickstart Guide

## Бърза Инсталация (5 минути)

### 1️⃣ Копирай environment template

```bash
cp tracking.env.template .env
```

### 2️⃣ Конфигурацията вече е попълнена с вашите tracking кодове! ✅

Отвори `.env` файла и провери:

```env
# Тези стойности са вече попълнени:
GOOGLE_ANALYTICS_ID=G-07DTZ2TF4V
GOOGLE_ADS_ID=AW-992774522
GTM_ID=GTM-5MJD9KF6

# Активирай tracking:
TRACKING_ENABLED=true

# За development, можеш да активираш debug:
TRACKING_DEBUG=true
```

### 3️⃣ Restart на dev сървъра

```bash
npm run dev
```

### 4️⃣ Тествай! 🎯

1. Отвори сайта в браузъра
2. Отвори **Chrome DevTools** (F12) → Console
3. Трябва да видиш:

   ```
   ✅ GTM initialized: GTM-5MJD9KF6
   ✅ Google Analytics initialized: G-07DTZ2TF4V
   ✅ Google Ads initialized: AW-992774522
   ```

4. Навигирай към продукт → Ще видиш:

   ```
   🎯 Tracking Event: ViewContent {...}
   ```

5. Добави продукт в количката → Ще видиш:
   ```
   🎯 Tracking Event: AddToCart {...}
   ```

### 5️⃣ Deploy на Production

#### За Vercel:

```bash
# Добави environment variables
vercel env add TRACKING_ENABLED
# Въведи: true

vercel env add GOOGLE_ANALYTICS_ID
# Въведи: G-07DTZ2TF4V

vercel env add GOOGLE_ANALYTICS_API_SECRET
# Въведи: 7rHfoFZ4S7K-qxp4NojvCQ

vercel env add GOOGLE_ADS_ID
# Въведи: AW-992774522

vercel env add GOOGLE_ADS_ENHANCED_CONVERSIONS
# Въведи: true

vercel env add GTM_ID
# Въведи: GTM-5MJD9KF6

vercel env add GTM_DATA_LAYER_ONLY
# Въведи: true

vercel env add TRACKING_DEBUG
# Въведи: false (ВАЖНО: false за production!)

# Deploy
vercel --prod
```

---

## ✅ Какво е Автоматично Проследено?

### Без да правиш нищо, системата проследява:

- ✅ **PageView** - всяка страница
- ✅ **ViewContent** - продуктови страници
- ✅ **AddToCart** - добавяне в количка
- ✅ **RemoveFromCart** - премахване от количка
- ✅ **InitiateCheckout** - влизане в checkout
- ✅ **Purchase** - завършена покупка

### Всички данни се изпращат към:

- ✅ Google Analytics 4
- ✅ Google Ads
- ✅ Google Tag Manager

---

## 🧪 Валидиране

### Провери Google Analytics:

1. Отвори [Google Analytics Real-Time](https://analytics.google.com/)
2. Отвори сайта в друг таб
3. В GA Real-Time трябва да видиш активен потребител

### Провери GTM:

1. Отвори [GTM Preview Mode](https://tagmanager.google.com/)
2. Въведи URL на сайта
3. Ще видиш всички firing tags

---

## 🐛 Troubleshooting

### Проблем: Не виждам tracking събития

**Решение:**

```env
# В .env промени на:
TRACKING_DEBUG=true
```

Restart на dev сървъра и провери Console.

### Проблем: Tracking не работи на production

**Решение:** Провери дали си добавил ВСИЧКИ environment variables във Vercel/Netlify.

---

## 📚 Пълна Документация

За advanced конфигурация и custom tracking събития, виж:

👉 **[TRACKING_IMPLEMENTATION.md](./TRACKING_IMPLEMENTATION.md)**

---

## 🎯 Готово!

Tracking-ът работи! Всички покупки, добавяния в количка и продуктови прегледи се проследяват автоматично на всички платформи. 🚀

**Забележка:** За максимална точност, препоръчваме да тестваш пълен purchase flow преди production deploy.

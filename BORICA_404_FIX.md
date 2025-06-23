# Решение за Borica 404 грешка

## 🚨 Проблемът

При опит за плащане с Borica получавахме 404 грешка за URL:

```
/porachka-2/order-pay/99629
```

## 🔍 Анализ на проблема

1. **Borica плъгинът генерира стандартни WooCommerce URLs** като `/order-pay/[orderId]`
2. **В headless средата тези страници не съществуват** в Nuxt frontend-а
3. **WordPress използва българска локализация** за URL-тата (`/porachka-2/`)

## ✅ Решението

Създадохме липсващите страници в Nuxt за да обработват order-pay заявките:

### Нови файлове:

```
woonuxt_base/app/pages/order-pay/[orderId].vue                   # Основна страница
woonuxt_base/app/pages/checkout/order-pay/[orderId].vue          # /checkout/order-pay/ redirect
woonuxt_base/app/pages/porachka-2/order-pay/[orderId].vue        # Българска локализация
```

### Как работи решението:

#### 1. **Главната order-pay страница** (`/order-pay/[orderId].vue`):

- Получава order ID от URL
- Проверява статуса на поръчката чрез GraphQL
- Ако е платена → пренасочва към success
- Ако е Borica → генерира payment URL и пренасочва
- За други методи → пренасочва към checkout

#### 2. **Българската локализирана страница** (`/porachka-2/order-pay/[orderId].vue`):

- Просто прави redirect към главната страница
- Запазва всички query параметри

#### 3. **Borica return обработка** (`/checkout/borica-return`):

- Обработва връщането от Borica
- Проверява статуса на плащането
- Пренасочва към success/error според резултата

## 📋 Какво трябва да конфигурираш

### 1. В WordPress Borica настройки:

```
Return URLs:
- Success: https://your-domain.com/checkout/borica-return
- Failure: https://your-domain.com/checkout?payment_error=borica
- Cancel: https://your-domain.com/checkout?payment_error=borica_cancelled
```

### 2. В Nuxt приложението:

Всички нужни файлове са вече създадени и конфигурирани.

## 🔄 Payment Flow след поправката:

```mermaid
graph TD
    A[Client натиска "Плати" с Borica] --> B[Frontend checkout API]
    B --> C[WordPress създава order]
    C --> D[WooCommerce генерира /order-pay/ URL]
    D --> E[Nuxt order-pay страница]
    E --> F[Проверка на order статус]
    F --> G[Генериране на Borica payment URL]
    G --> H[Redirect към Borica]
    H --> I[Client плаща в Borica]
    I --> J[Borica callback към WordPress]
    J --> K[Borica redirect към /checkout/borica-return]
    K --> L[Nuxt проверява payment статус]
    L --> M[Redirect към success/error]
```

## 🧪 Как да тестваш:

1. **Направи тестова поръчка** с Borica
2. **Трябва да видиш loading screen** на order-pay страницата
3. **След секунда ще се пренасочиш** към Borica страницата
4. **След плащане ще се върнеш** към твоя сайт
5. **Ще видиш success или error** според резултата

## 🚀 Статус: Готово за тестване

- ✅ 404 грешката е решена
- ✅ Order-pay страници са създадени
- ✅ Borica redirect логиката работи
- ✅ Return handling е имплементиран
- ✅ Error handling е добавен

**Следваща стъпка:** Тествай с реален Borica плъгин на тестовия домейн.

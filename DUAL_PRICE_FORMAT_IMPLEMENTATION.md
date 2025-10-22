# Имплементация на двоен формат на цени (BGN / EUR)

## Описание

Съгласно изискванията на Еврозоната в България, всички цени в приложението се показват в двоен формат:
**X.XX лв. / X.XX €**

Курсът на конвертация е фиксиран: **1 EUR = 1.95583 BGN**

## Имплементирани промени

### 1. Централизиран Модул: `usePriceFormatter.ts`

Създаден е централизиран модул в `woonuxt_base/app/composables/usePriceFormatter.ts` с:

#### **Pure Functions (Експортирани директно):**

- **`formatDualPrice(price, showZero?)`** - Форматира цена в двоен формат BGN / EUR
- **`formatBGN(price)`** - Форматира само в лева
- **`formatEUR(price)`** - Форматира само в евро
- **`convertToEUR(priceBGN)`** - Конвертира BGN към EUR
- **`convertToBGN(priceEUR)`** - Конвертира EUR към BGN
- **`BGN_TO_EUR_RATE`** - Константа с курса (ЕДИНСТВЕНО МЯСТО за промяна!)

#### **Composable Wrapper:**

- **`usePriceFormatter()`** - Composable функция, която връща всички функции за удобство във Vue компоненти

### 🎯 **ВАЖНО - Single Source of Truth**

Курсът **1.95583** е дефиниран само на **ЕДНО МЯСТО** в `usePriceFormatter.ts`.

**Два начина на използване:**

1. **В Vue setup контекст** - използвай composable:

```typescript
const { formatDualPrice } = usePriceFormatter();
```

2. **Извън Vue контекст** (helpers, utils) - използвай директен импорт:

```typescript
import { formatDualPrice } from "~/composables/usePriceFormatter";
```

Това решава проблема с Nuxt composable context errors.

### 2. Модифицирани компоненти

#### Основни компоненти за показване на цени:

1. **ProductPrice.vue** (`woonuxt_base/app/components/productElements/ProductPrice.vue`)

   - Показва цени на продукти в списъци и на продуктови страници
   - Показва както редовни, така и промоционални цени

2. **OrderSummary.vue** (`woonuxt_base/app/components/shopElements/OrderSummary.vue`)

   - Показва subtotal, shipping и total по време на checkout процеса

3. **Cart.vue** (`woonuxt_base/app/components/shopElements/Cart.vue`)
   - Показва общата сума в sidebar количката

#### Страници със цени:

4. **order-summary.vue** (`woonuxt_base/app/pages/order-summary.vue`)

   - Показва детайли за поръчка включително цени на артикули и общи суми

5. **OrderList.vue** (`woonuxt_base/app/components/OrderList.vue`)

   - Показва списък с поръчки и техните общи суми

6. **thank-you.vue** (`woonuxt_base/app/pages/thank-you.vue`)
   - Показва благодарствена страница след завършена поръчка

### 3. Модифициран Helper

**useHelpers.ts** (`woonuxt_base/app/composables/useHelpers.ts`)

- Функцията `formatPrice()` също използва `usePriceFormatter` composable-a

## Архитектурни предимства

### ✅ DRY Principle (Don't Repeat Yourself)

- Логиката за форматиране е на ЕДНО място
- Няма дублиран код
- Всички компоненти използват един и същ composable

### ✅ Single Source of Truth

- Курсът EUR/BGN е дефиниран само веднъж
- При промяна на курса - променяме само едно число
- Промяната веднага се отразява навсякъде

### ✅ Maintainability (Лесна поддръжка)

- Централизиран код
- Лесно тестване
- Бързи промени

### ✅ Type Safety

- TypeScript типове за всички функции
- Intellisense подсказки
- Compile-time проверки

### ✅ Consistency (Консистентност)

- Един формат навсякъде
- Не може да има различни форматирания
- Гарантирана консистентност

## Къде се показват цените

Цените в двоен формат се показват навсякъде в приложението:

- ✅ Продуктови карти в листинги
- ✅ Детайлна продуктова страница
- ✅ Количка (sidebar)
- ✅ Checkout процес (Order Summary)
- ✅ Страница с детайли за поръчка
- ✅ Списък с поръчки в My Account
- ✅ Thank You страница след поръчка

## Технически детайли

### Как работи форматирането

1. **Входни данни**: Цените идват от WooCommerce GraphQL API в два формата:

   - **Форматирани** (напр. `regularPrice`): HTML strings като `<span>100.00 лв.</span>`
   - **Raw** (напр. `rawRegularPrice`): Чисти числа като `"100.00"`

2. **Използвани полета**:

   - За продукти: `rawRegularPrice`, `rawSalePrice`
   - За количка: `rawTotal`, `rawSubtotal`, `rawShippingTotal`, `rawTotalTax`
   - За поръчки: `rawTotal`, `rawSubtotal`, `rawShippingTotal`, `rawTotalTax`

3. **Обработка**:

   - Използваме директно `raw` полетата (чисти числа)
   - Парсваме с `parseFloat()`
   - Няма нужда от премахване на HTML тагове

4. **Форматиране**:
   - Цената в BGN се форматира с 2 знака след десетичната запетая
   - Цената се конвертира в EUR чрез деление на `1.95583`
   - EUR цената също се форматира с 2 знака след десетичната запетая
   - Резултатът е: `"100.00 лв. / 51.13 €"`

### Примери за използване

#### **1. В Vue компоненти (с composable):**

```vue
<script setup lang="ts">
// Използвай composable във Vue setup
const { formatDualPrice } = usePriceFormatter();

// Форматиране на цена
const formattedPrice = formatDualPrice(product.rawRegularPrice);
// Резултат: "120.00 лв. / 61.37 €"

// С показване на нула
const formattedTotal = formatDualPrice(cart.rawTotal, true);
// Резултат: "0.00 лв. / 0.00 €" (ако няма цена)

// Използване в ProductPrice компонента
<ProductPrice
  :sale-price="product.rawSalePrice"
  :regular-price="product.rawRegularPrice"
/>

// Използване директно в template
{{ formatDualPrice(order.rawTotal, true) }}
</script>
```

#### **2. Извън Vue контекст (pure functions):**

```typescript
// В helpers, utils, или други composables
import {
  formatDualPrice,
  BGN_TO_EUR_RATE,
} from "~/composables/usePriceFormatter";

// Използвай директно функцията
const formatPrice = (price: string): string => {
  return formatDualPrice(price, true);
};

// Достъп до константата
const eurPrice = parseFloat(price) / BGN_TO_EUR_RATE;
```

Това е важно за избягване на **"composable context"** грешки в Nuxt!

**Допълнителни функции:**

```typescript
// Само BGN формат
formatBGN(120); // "120.00 лв."

// Само EUR формат
formatEUR(120); // "61.37 €"

// Конвертиране
convertToEUR(195.583); // 100
convertToBGN(100); // 195.583
```

### GraphQL заявки

Във всички GraphQL фрагменти са добавени `raw` версии на цените:

```graphql
fragment SimpleProduct on SimpleProduct {
  regularPrice
  rawRegularPrice: regularPrice(format: RAW)
  salePrice
  rawSalePrice: salePrice(format: RAW)
  # ...
}

fragment Cart on Cart {
  total
  rawTotal: total(format: RAW)
  subtotal
  rawSubtotal: subtotal(format: RAW)
  # ...
}
```

## Тестване

За да тествате имплементацията:

1. Отворете някоя продуктова страница - цените трябва да се показват в двоен формат
2. Добавете продукт в количката - цената в sidebar-a трябва да е в двоен формат
3. Отидете в checkout - всички цени (subtotal, shipping, total) трябва да са в двоен формат
4. Завършете поръчка - цените в order summary и thank you страницата трябва да са в двоен формат
5. Проверете My Account -> Orders - цените в списъка трябва да са в двоен формат

## Поддръжка

### Промяна на курса EUR/BGN

При промяна на официалния курс, променете константата само на ЕДНО място:

**Файл:** `woonuxt_base/app/composables/usePriceFormatter.ts`

```typescript
// Официален курс EUR/BGN - ЕДИНСТВЕНО МЯСТО за промяна!
const BGN_TO_EUR_RATE = 1.95583; // ← Променете само това число
```

Промяната ще се приложи **автоматично навсякъде** в приложението:

- ✅ Всички продуктови цени
- ✅ Количка (cart)
- ✅ Checkout процес
- ✅ Order summary
- ✅ Списък с поръчки
- ✅ Thank you страница

**Не е нужно** да променяте нищо друго! 🎯

## Версия

Имплементирано: 22.10.2025
Курс: 1 EUR = 1.95583 BGN (фиксиран официален курс)

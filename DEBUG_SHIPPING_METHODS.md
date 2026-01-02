# Debug: Методите за доставка не се показват

## 📅 Дата: 02.01.2026

## 🔍 Добавени Debug логове

Добавих debug логове на няколко места за да видим къде е проблемът:

### 1. **BillingDetails.vue**
```typescript
onMounted(() => {
  console.log('BillingDetails mounted:', {
    isBillingAddressEnabled: isBillingAddressEnabled.value,
    billing: billing.value
  });
});

watch(() => [billing.value.city, billing.value.address1], async ([newCity, newAddress]) => {
  console.log('Address changed:', { newCity, newAddress });
  // ...
});
```

### 2. **useCheckout.ts - updateShippingLocation()**
```typescript
console.log('Updating shipping location:', {
  viewerId: viewer.value.id,
  billing: customer.value.billing,
  shipping: shippingAddress
});

console.log('Customer updated:', updateCustomer);
console.log('Cart refreshed after updating customer');
```

### 3. **checkout.vue - onMounted**
```typescript
console.log('Cart after refresh:', {
  availableShippingMethods: cart.value?.availableShippingMethods,
  chosenShippingMethods: cart.value?.chosenShippingMethods,
  customer: customer.value,
  billing: customer.value?.billing
});
```

### 4. **Добавено скрито поле за държава**
```vue
<input type="hidden" v-model="billing.country" value="BG" />
```

WooCommerce изисква `country` поле за да изчисли методите за доставка!

## 🧪 Как да тествате:

1. **Отворете браузъра в Developer Tools (F12)**
2. **Отидете на Console таб**
3. **Добавете продукт в количката**
4. **Отидете на `/checkout`**
5. **Вижте в конзолата:**

```
Cart after refresh: {
  availableShippingMethods: [...],  // Трябва да има методи тук!
  chosenShippingMethods: [...],
  customer: {...},
  billing: {...}
}
```

6. **Попълнете полетата:**
   - Име
   - Фамилия
   - Имейл
   - Телефон
   - **Град** (напр. "София")
   - **Адрес** (напр. "ул. Витоша 1")

7. **Вижте в конзолата:**

```
BillingDetails mounted: {
  isBillingAddressEnabled: true,  // Трябва да е true!
  billing: {...}
}

Address changed: {
  newCity: "София",
  newAddress: "ул. Витоша 1"
}

Updating shipping location: {
  viewerId: "...",
  billing: {...},
  shipping: {...}
}

Customer updated: {...}
Cart refreshed after updating customer
```

8. **След 500ms методите за доставка трябва да се появят!**

## ❌ Възможни проблеми:

### Проблем 1: `isBillingAddressEnabled: false`
**Причина:** Всички продукти в количката са виртуални
**Решение:** Проверете дали продуктите са маркирани като физически в WooCommerce

### Проблем 2: `availableShippingMethods: []` (празен масив)
**Причина:** WooCommerce не връща методи за доставка
**Възможни причини:**
- Няма конфигурирани зони за доставка в WooCommerce
- Няма активирани методи за доставка
- Адресът не попада в нито една зона за доставка
- Липсва `country` поле (вече добавено като скрито поле)

### Проблем 3: `Viewer ID is missing`
**Причина:** Потребителят не е логнат или сесията е изтекла
**Решение:** Проверете дали `viewer` се попълва правилно при влизане в checkout

### Проблем 4: Watch не се задейства
**Причина:** Полетата за адрес не се показват (`isBillingAddressEnabled: false`)
**Решение:** Виж Проблем 1

## 🔧 Бързи проверки в WooCommerce Admin:

1. **WooCommerce → Settings → Shipping**
   - Проверете дали има създадени Shipping Zones
   - Проверете дали България (BG) е добавена в някоя зона
   - Проверете дали има активирани методи за доставка (Flat Rate, Free Shipping, etc.)

2. **WooCommerce → Settings → General**
   - Проверете дали валутата е EUR
   - Проверете дали Default Customer Location е зададено

3. **Продукти**
   - Проверете дали продуктите са маркирани като "Virtual" или "Downloadable"
   - Ако са виртуални → полетата за адрес няма да се покажат

## 📊 Очаквани резултати:

### Успешен сценарий:
```
1. Cart loads → availableShippingMethods: [] (празен, нормално)
2. User fills city → "Address changed" в конзолата
3. User fills address → "Address changed" в конзолата
4. After 500ms → "Updating shipping location"
5. → "Customer updated"
6. → "Cart refreshed"
7. → availableShippingMethods се попълва
8. → ShippingOptions се показва на екрана
```

### Проблемен сценарий:
```
1. Cart loads → availableShippingMethods: []
2. User fills address → НИЩО в конзолата
   → Проблем: isBillingAddressEnabled е false
   → Решение: Проверете продуктите
```

## 🚀 След като намерите проблема:

Изпратете ми screenshot от конзолата с логовете и ще мога да видя точно къде е проблемът!

---

**Версия:** 1.0
**Дата:** 02.01.2026


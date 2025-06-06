# 🧪 Инструкции за тестване на оптимизираното WooNuxt приложение

## 🚀 Стартиране на оптимизираното приложение

### 1. **Инсталиране на зависимости**

```bash
npm install
```

### 2. **Стартиране в развойна среда**

```bash
npm run dev
```

### 3. **Билд за продукция**

```bash
npm run build
```

## 🔍 Какво да тествате

### **А. Производителност на продуктови страници**

1. **Отворете `/products`**

   - ✅ Зареждат се **само 12 продукта** (вместо 1800+)
   - ✅ Има **loading индикатор** при зареждане
   - ✅ **Пагинацията** работи с бутони Previous/Next
   - ✅ **4 колони** на desktop, 3 на tablet, 2 на mobile

2. **Тествайте пагинацията**

   - ✅ Натиснете "Next" - зареждат се следващите 12 продукта
   - ✅ Натиснете "Previous" - връщате се назад
   - ✅ Номерата на страниците работят правилно

3. **Тествайте sidebar-а**
   - ✅ Филтрите са в **sidebar вляво**
   - ✅ Продуктите са в **4 колони отдясно**
   - ✅ На mobile sidebar-а се крие правилно

### **Б. Категории страница**

1. **Отворете някоя категория** (например `/produkt-kategoriya/kategoriya-name`)
   - ✅ Зареждат се само продукти от тази категория
   - ✅ Максимум 12 продукта на страница
   - ✅ Пагинацията работи за категорията
   - ✅ SEO заглавията са правилни

### **В. Performance тестове**

1. **Отворете Chrome DevTools**

   - Отидете на Network tab
   - Презаредете `/products` страницата
   - ✅ **Първоначалната GraphQL заявка е малка** (~12 продукта)
   - ✅ **Общият размер е значително намален**

2. **Lighthouse тест**
   - Натиснете F12 → Lighthouse tab
   - Пуснете Performance audit
   - ✅ **Performance score > 90**
   - ✅ **LCP < 2.5s**
   - ✅ **FCP < 1.5s**

### **Г. Функционалност**

1. **Добавяне в количката**

   - ✅ Работи от всяка страница на пагинацията
   - ✅ Прости продукти се добавят директно
   - ✅ Променливи продукти изискват избор на вариация

2. **Филтриране и търсене**
   - ✅ Филтрите работят правилно
   - ✅ Търсенето работи
   - ✅ Сортирането работи

## 📊 Как да измерите подобренията

### **Преди оптимизацията:**

- GraphQL заявка: **~500KB-2MB** (1800+ продукта)
- Време за зареждане: **5-15 секунди**
- Памет в браузъра: **50-200MB**
- Lighthouse Performance: **30-50**

### **След оптимизацията:**

- GraphQL заявка: **~20-50KB** (12 продукта)
- Време за зареждане: **1-3 секунди**
- Памет в браузъра: **5-15MB**
- Lighthouse Performance: **80-95**

## 🐛 Възможни проблеми и решения

### **1. Пагинацията не работи**

**Причина:** Старата логика все още се използва някъде
**Решение:** Проверете дали всички страници използват `loadProductsPage()` вместо `setProducts()`

### **2. Филтрите не работят правилно**

**Причина:** Конфликт между серверна и клиентска пагинация
**Решение:** Обновете филтрите да извикват `loadProductsPage()` с правилните параметри

### **3. Изображенията се зареждат бавно**

**Причина:** Липсва @nuxt/image модула
**Решение:**

```bash
npm install @nuxt/image
```

### **4. SEO проблеми**

**Причина:** Липсват meta данни за пагинираните страници
**Решение:** Добавете динамични meta tags в компонентите

## 🔧 Настройки които можете да променяте

### **Продукти на страница**

В `nuxt.config.ts`:

```typescript
PRODUCTS_PER_PAGE: 12, // Променете на 16, 20, 24 според нуждите
```

### **Кеш времена**

В `nuxt.config.ts`:

```typescript
// GraphQL кеш
maxAge: 1000 * 60 * 5, // 5 минути (променете на по-дълго за по-бързо зареждане)

// ISR кеш
expiration: 300, // 5 минути (променете според честотата на обновяване)
```

### **Grid размери**

В `ProductGrid.vue`:

```css
/* Променете колоните според предпочитанията */
grid-template-columns: repeat(4, 1fr); /* Desktop */
grid-template-columns: repeat(3, 1fr); /* Tablet */
grid-template-columns: repeat(2, 1fr); /* Mobile */
```

## 📈 Мониториране в продукция

### **Метрики за следене:**

1. **Page Load Time** - трябва да е < 3s
2. **GraphQL Response Time** - трябва да е < 500ms
3. **Memory Usage** - трябва да е стабилна
4. **Bounce Rate** - трябва да намалее
5. **Conversion Rate** - трябва да се подобри

### **Инструменти:**

- Google Analytics 4
- Google PageSpeed Insights
- GTmetrix
- WebPageTest
- Chrome DevTools

---

## ✅ Checklist за deployment

- [ ] Тествана серверна пагинация
- [ ] Тествани категории страници
- [ ] Тестван sidebar layout
- [ ] Проверена производителност с Lighthouse
- [ ] Тествано на мобилни устройства
- [ ] Проверена функционалност на количката
- [ ] Тествани филтри и търсене
- [ ] Проверени SEO meta данни
- [ ] Тествано с реални данни

**🎉 След като всички тестове минават успешно, приложението е готово за deploy!**

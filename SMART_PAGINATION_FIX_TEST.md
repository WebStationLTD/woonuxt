# 🧪 Умна поправка на пагинацията и сортирането - Тестове

## 🎯 Какво поправих

### ❌ Предишен проблем:

- При сортиране винаги се връщаше към страница 1, дори при обикновена навигация
- URL: `/page/3?orderby=price` → веднага redirect към `?orderby=price`

### ✅ Нова умна логика:

- **При ПРОМЯНА на сортирането** от страница > 1 → redirect към страница 1
- **При НАВИГАЦИЯ между страници** на вече приложено сортиране → остава на избраната страница

## 🔧 Тестови сценарии

### ✅ Тест 1: Промяна на сортирането от по-висока страница

```bash
1. Отиди на: /produkt-kategoriya/бокс/page/4
2. Промени сортирането на "Цена"
   ✅ ОЧАКВАНО: redirect към /produkt-kategoriya/бокс?orderby=price (страница 1)
3. Провери дали продуктите са сортирани по цена
```

### ✅ Тест 2: Навигация при приложено сортиране

```bash
1. Отиди на: /produkt-kategoriya/бокс?orderby=price (страница 1 със сортиране)
2. Натисни страница 3 от пагинацията
   ✅ ОЧАКВАНО: отива на /produkt-kategoriya/бокс/page/3?orderby=price
   ✅ ОЧАКВАНО: НЕ прави redirect към страница 1
3. Провери дали продуктите са различни от страница 1, но пак сортирани по цена
4. Натисни страница 5
   ✅ ОЧАКВАНО: отива на /produkt-kategoriya/бокс/page/5?orderby=price
```

### ✅ Тест 3: Промяна на сортирането при вече приложено сортиране

```bash
1. Отиди на: /produkt-kategoriya/бокс/page/3?orderby=price
2. Промени сортирането на "По дата"
   ✅ ОЧАКВАНО: redirect към /produkt-kategoriya/бокс?orderby=date (страница 1)
3. Провери дали продуктите са различни (сортирани по дата)
```

### ✅ Тест 4: Промяна на order (ASC/DESC) при приложено сортиране

```bash
1. Отиди на: /produkt-kategoriya/бокс/page/2?orderby=price
2. Промени от ASC на DESC (или обратно)
   ✅ ОЧАКВАНО: redirect към /produkt-kategoriya/бокс?orderby=price&order=desc
3. Провери дали продуктите са с обърнат ред
```

### ✅ Тест 5: Обикновена навигация без сортиране

```bash
1. Отиди на: /produkt-kategoriya/бокс
2. Натисни страница 4
   ✅ ОЧАКВАНО: отива на /produkt-kategoriya/бокс/page/4
   ✅ ОЧАКВАНО: НЕ прави redirect
3. Навигирай напред/назад - трябва да работи нормално
```

## 🔍 Debug Console съобщения

За да видиш подробни debug съобщения, активирай debug режима:

```javascript
// В Browser Console активирай debug режима:
window.debugPagination = true;
```

След това при навигацията ще видиш такива съобщения:

### При промяна на сортирането:

```
🔍 Query change detected: {
  sortingOrFilteringChanged: true,
  previousOrderBy: null,
  newOrderBy: "price",
  ...
}
🔄 Sorting/filtering changed on page > 1, redirecting to page 1
```

### При обикновена навигация:

```
🔍 Query change detected: {
  sortingOrFilteringChanged: false,
  ...
}
```

## 📊 Performance тест

```javascript
// В Browser Console активирай analytics:
const analytics = useGraphQLAnalytics();
analytics.toggleAnalytics(true);

// Навигирай и провери времената:
console.time("Page Navigation");
// Натисни страница X
console.timeEnd("Page Navigation");
// Трябва да е под 1-2 секунди
```

## 🎯 Успешни резултати

### ✅ Правилно поведение:

- Промяна на сортирането → винаги към страница 1
- Навигация между страници при приложено сортиране → остава на избраната страница
- URL се обновява правилно
- Продуктите се променят при навигация
- Performance под 2 секунди

### ❌ Грешки (ако не работи):

- Навигацията пак не работи
- URL "мига" и се връща
- Продуктите не се променят
- Console грешки

## 🚨 Edge Cases за тестване

### Тест A: Директен достъп до URL със сортиране и страница

```bash
1. Отиди директно на: /produkt-kategoriya/бокс/page/3?orderby=price
   ✅ ОЧАКВАНО: остава на страница 3 със сортиране
   ✅ ОЧАКВАНО: НЕ прави redirect към страница 1
```

### Тест B: Refresh на страница със сортиране

```bash
1. Отиди на: /produkt-kategoriya/бокс/page/2?orderby=price
2. Натисни F5 (refresh)
   ✅ ОЧАКВАНО: остава на страница 2 със сортиране
```

### Тест C: Browser назад/напред бутони

```bash
1. Навигирай: page/1 → page/2 → промени сортирането → page/3
2. Използвай browser "назад" бутони
   ✅ ОЧАКВАНО: history навигацията работи правилно
```

## 🔧 Troubleshooting

### Ако пак има redirect проблеми:

```javascript
// Активирай debug режима:
window.debugPagination = true;

// Провери console за debug съобщения:
// Търси "🔍 Query change detected" и "🔄 Sorting/filtering changed"
// Провери дали previousQuery стойностите са правилни
```

### Ако навигацията не работи:

```javascript
// Провери currentPage стойността:
const { currentPage } = useProducts();
console.log("Current page:", currentPage.value);

// Провери route параметрите:
console.log("Route params:", route.params);
console.log("Route query:", route.query);
```

## ✨ Успешен тест

🎉 **Поправката работи перфектно ако:**

- Сортирането се прилага и прави redirect към страница 1
- Навигацията между страници при приложено сортиране работи
- URL отразява точното състояние
- Няма нежелани redirect-и
- Performance е отличен

Всички сценарии трябва да преминат успешно! 🚀

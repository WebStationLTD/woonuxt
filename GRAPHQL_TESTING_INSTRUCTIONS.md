# 🧪 Инструкции за тестване на GraphQL оптимизации

## 🚀 Бързо тестване

### 1. Активирай Analytics в Browser Console

```javascript
// Отвори Developer Tools (F12) и в Console изпълни:
const analytics = useGraphQLAnalytics();
analytics.toggleAnalytics(true);
console.log("✅ GraphQL Analytics activated!");
```

### 2. Тестване на проблемна категория

```bash
# Отиди до категория с много страници (напр. Бокс):
http://localhost:3000/produkt-kategoriya/бокс

# Засичи времето и натисни последна страница (60)
# Наблюдавай Console за анализи
```

### 3. Анализ на резултатите

```javascript
// В Console след навигацията:
analytics.getPerformanceStats();
analytics.showOptimizationSuggestions();
```

## 📊 Детайлен Performance Test

### Преди оптимизациите

1. **Disable** новите функции временно
2. Измери времето за зареждане на страница 60
3. Провери Network tab за GraphQL заявки

### След оптимизациите

1. **Enable** новите функции
2. Измери същото време
3. Сравни резултатите

### Очаквани подобрения:

| Метрика            | Преди        | След        |
| ------------------ | ------------ | ----------- |
| Време за зареждане | 8-12 сек     | 0.5-1.5 сек |
| GraphQL заявки     | 721 продукта | 12 продукта |
| Размер на данни    | 2-5 MB       | 50-200 KB   |

## 🔍 Debugging заявки

### Monitor GraphQL в Network tab

```bash
1. Отвори DevTools > Network
2. Filter: "graphql" или "gql"
3. Навигирай до проблемна страница
4. Анализирай Request/Response размерите
```

### Console Commands за debugging

```javascript
// Покажи всички метрики:
analytics.getPerformanceStats();

// Изчисти метриките за нов тест:
analytics.clearMetrics();

// Detailed query analysis:
analytics.showOptimizationSuggestions();
```

## 🧪 A/B Testing Script

```javascript
// Тест на старата vs новата функция:
console.time("Old Function");
await loadProductsPage(60, ["бокс"]);
console.timeEnd("Old Function");

console.time("New Function");
await jumpToPageOptimized(60, ["бокс"]);
console.timeEnd("New Function");
```

## 📈 Performance Benchmarks

### Test Categories:

1. **Малка категория** (10-20 продукта)
2. **Средна категория** (50-100 продукта)
3. **Голяма категория** (500+ продукта)
4. **Огромна категория** (1000+ продукта)

### За всяка категория измери:

- Време за първа страница
- Време за страница 5
- Време за последна страница
- Размер на GraphQL response

## 🔧 Quick Fixes за типични проблеми

### Ако новите заявки не работят:

```bash
# Провери дали новите GraphQL заявки са налични:
ls -la woonuxt_base/app/queries/getProducts.gql

# Restart на dev server:
npm run dev
```

### Ако Analytics не работи:

```javascript
// Провери дали composable-ът е зареден:
const analytics = useGraphQLAnalytics();
console.log(analytics); // Трябва да покаже функциите
```

### Ако пагинацията не работи:

```javascript
// Провери дали новите функции са експортирани:
const { jumpToPageOptimized } = useProducts();
console.log(typeof jumpToPageOptimized); // Трябва да е 'function'
```

## 🎯 Success Criteria

✅ **Успешна оптимизация ако:**

- Страница 60 се зарежда под 2 секунди
- GraphQL заявките са под 200KB
- Console показва оптимизационни съвети
- Няма JavaScript грешки

❌ **Проблем ако:**

- Все още отнема 5+ секунди
- Продуктите не се показват
- Има TypeScript/JavaScript грешки
- Network tab показва тежки заявки

## 🚨 Troubleshooting

### Честі проблеми:

1. **"getProductsOptimized is not assignable to GqlOps"**

   - Това е TypeScript грешка - заявката работи но липсва типизация
   - Временно може да се игнорира

2. **Празни страници**

   - Провери cursor логиката в `jumpToPageOptimized`
   - Fallback към стария метод

3. **Бавни заявки въпреки оптимизацията**
   - Провери дали се използват правилните функции
   - Анализирай Network tab за дублирани заявки

## 📝 Reporting Results

Попълни тази таблица след тестването:

| Категория | Страници | Преди (сек) | След (сек) | Подобрение |
| --------- | -------- | ----------- | ---------- | ---------- |
| Бокс      | 60       | \_\_        | \_\_       | \_\_%      |
| Фитнес    | \_\_     | \_\_        | \_\_       | \_\_%      |
| Други     | \_\_     | \_\_        | \_\_       | \_\_%      |

```javascript
// Копирай резултатите от Console:
analytics.getPerformanceStats();
```

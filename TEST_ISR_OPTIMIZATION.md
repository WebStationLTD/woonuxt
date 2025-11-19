# 🧪 ISR Оптимизация - Тестов План

## 1️⃣ ТЕСТ НА ISR СТРАНИЦИ (Критични)

### **Продукт:**

```bash
# Първо посещение (генерира ISR кеш)
curl -I https://leaderfitness.net/produkt/test-product

# Очаквано:
# - Age: 0 (нов кеш)
# - Cache-Control: public, s-maxage=14400, max-age=1800, stale-while-revalidate=28800
# - X-Vercel-Cache: MISS (първо посещение)

# Второ посещение (от ISR кеш)
curl -I https://leaderfitness.net/produkt/test-product

# Очаквано:
# - Age: >0 (използва кеш)
# - X-Vercel-Cache: HIT (от кеш)
# - Response time: ~50-100ms ⚡
```

### **Категория:**

```bash
curl -I https://leaderfitness.net/produkt-kategoriya/test-category

# Очаквано:
# - Cache-Control: public, s-maxage=14400, max-age=900, stale-while-revalidate=28800
# - X-Vercel-Cache: HIT (при повторно посещение)
```

---

## 2️⃣ ТЕСТ НА SSR + EDGE CACHE (Некритични)

### **Етикет:**

```bash
# Първо посещение (SSR)
curl -I https://leaderfitness.net/produkt-etiket/test-tag

# Очаквано:
# - X-Vercel-Cache: MISS (SSR)
# - Cache-Control: public, s-maxage=86400, max-age=1800, stale-while-revalidate=172800
# - Response time: ~300-500ms (SSR overhead, еднократно)

# Второ посещение (от Edge кеш)
curl -I https://leaderfitness.net/produkt-etiket/test-tag

# Очаквано:
# - X-Vercel-Cache: HIT
# - Age: >0 (Edge кеш за 24h)
# - Response time: ~50-100ms ⚡ (като ISR!)
```

### **Марка:**

```bash
curl -I https://leaderfitness.net/marka-produkt/test-brand

# Очаквано:
# - Cache-Control: public, s-maxage=86400 (24h Edge cache)
# - X-Vercel-Cache: HIT (при повторно посещение)
```

### **Блог:**

```bash
curl -I https://leaderfitness.net/blog/test-post

# Очаквано:
# - Cache-Control: public, s-maxage=86400 (24h Edge cache)
# - X-Vercel-Cache: HIT (при повторно посещение)
```

---

## 3️⃣ ТЕСТ НА ON-DEMAND REVALIDATION

### **Invalidate продукт:**

```bash
curl -X POST https://leaderfitness.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SECRET_TOKEN",
    "paths": ["/produkt/test-product"]
  }'

# Очакван отговор:
{
  "success": true,
  "revalidated": 1,
  "paths": ["/produkt/test-product"],
  "timestamp": "2025-11-19T..."
}

# Провери дали кешът е invalidate-ан:
curl -I https://leaderfitness.net/produkt/test-product

# Очаквано:
# - X-Vercel-Cache: MISS (нов кеш)
# - Age: 0
```

### **Bulk invalidate:**

```bash
curl -X POST https://leaderfitness.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SECRET_TOKEN",
    "paths": [
      "/produkt/product-1",
      "/produkt/product-2",
      "/produkt-kategoriya/category-1"
    ]
  }'

# Очакван отговор:
{
  "success": true,
  "revalidated": 3,
  "paths": [...]
}
```

---

## 4️⃣ PERFORMANCE ТЕСТ

### **Browser DevTools:**

1. Отвори категория (напр. `/produkt-kategoriya/something`)
2. Network tab → Disable cache → Refresh
3. Провери:
   - **Първо зареждане:** ~800ms-1.2s (ISR от кеш)
   - **Второ зареждане:** ~200-400ms (browser cache)

4. Отвори етикет (напр. `/produkt-etiket/something`)
5. Network tab → Disable cache → Refresh
6. Провери:
   - **Първо зареждане (cold):** ~500-800ms (SSR)
   - **Второ зареждане:** ~50-100ms (Edge cache - като ISR!)

### **Lighthouse:**

```bash
# Test ISR страница
lighthouse https://leaderfitness.net/produkt-kategoriya/test --view

# Очаквано:
# - Performance: >90
# - FCP: <1.5s
# - LCP: <2.5s

# Test SSR страница
lighthouse https://leaderfitness.net/produkt-etiket/test --view

# Очаквано (почти същото като ISR!):
# - Performance: >90
# - FCP: <1.5s
# - LCP: <2.5s
```

---

## 5️⃣ МОНИТОРИРАНЕ НА РАЗХОДИ

### **Vercel Dashboard:**

1. Отвори **Vercel Dashboard** → Your Project
2. Analytics → Functions
3. Провери:
   - **Function Invocations:** ~48,000/ден (от ISR)
   - **ISR Cache Writes:** ~1.4-1.5M/месец ✅
   - **SSR Functions:** ~1,500-2,000/ден (за етикети/марки/блог)

### **Очаквани числа след 1 седмица:**

| Метрика | Очаквано | Реално (fill in) |
|---------|----------|------------------|
| **ISR Writes/ден** | ~48,000 | __________ |
| **SSR Invocations/ден** | ~1,500 | __________ |
| **ISR Writes/седмица** | ~336K | __________ |
| **Прогноза месечно** | ~1.44M | __________ |

---

## 6️⃣ EDGE CASES

### **Test 1: Stale While Revalidate**

```bash
# Изчакай 4 часа след deploy
# Посети ISR страница:
curl -I https://leaderfitness.net/produkt/old-product

# Очаквано:
# - X-Vercel-Cache: STALE (използва stale кеш)
# - Response time: ~50ms (instant!)
# - Background: trigger-ва revalidation (не забавя потребителя)
```

### **Test 2: 404 страница**

```bash
curl -I https://leaderfitness.net/produkt/nonexistent-product

# Очаквано:
# - Status: 404
# - Cache-Control: no-cache (не кешира 404)
```

### **Test 3: SSR при висока натовареност**

```bash
# Симулирай 10 едновременни посещения на етикет:
for i in {1..10}; do
  curl -I https://leaderfitness.net/produkt-etiket/test-tag &
done
wait

# Очаквано:
# - Първата заявка: SSR (~500ms)
# - Останалите 9: Edge cache (~50ms)
```

---

## 7️⃣ REGRESSION TEST

### **Провери че старите ISR страници все още работят:**

```bash
# Продукт (ISR)
curl https://leaderfitness.net/produkt/test | grep -o "<title>.*</title>"
# Очаквано: правилен title

# Категория (ISR)
curl https://leaderfitness.net/produkt-kategoriya/test | grep -o "<title>.*</title>"
# Очаквано: правилен title

# Етикет (SSR)
curl https://leaderfitness.net/produkt-etiket/test | grep -o "<title>.*</title>"
# Очаквано: правилен title

# Марка (SSR)
curl https://leaderfitness.net/marka-produkt/test | grep -o "<title>.*</title>"
# Очаквано: правилен title
```

---

## ✅ SUCCESS CRITERIA

### **Минимални изисквания:**

- ✅ ISR страници (продукти, категории): X-Vercel-Cache HIT при повторно посещение
- ✅ SSR страници (етикети, марки, блог): X-Vercel-Cache HIT след първо посещение
- ✅ Response time (cached): <200ms
- ✅ On-demand revalidation API: success: true
- ✅ ISR writes/месец: <2M (очаквано ~1.44M)
- ✅ Lighthouse Performance: >90

### **Оптимални резултати:**

- ⚡ ISR writes/месец: ~1.4-1.5M
- ⚡ Response time (cached): <100ms
- ⚡ SSR response time (cold): <500ms
- ⚡ Месечни разходи: $17-30
- ⚡ Lighthouse Performance: >95

---

## 🚨 ПРОБЛЕМИ И РЕШЕНИЯ

### **Проблем 1: SSR страници са бавни**

**Симптом:** `/produkt-etiket/**` зарежда >1s  
**Причина:** Тежки GraphQL заявки  
**Решение:** Оптимизирай GraphQL queries (премахни ненужни полета)

### **Проблем 2: ISR writes са >2M/месец**

**Симптом:** Vercel показва повече ISR writes от очакваното  
**Причина:** Възможно е да има crawler-и/bots  
**Решение:** Добави robots.txt блокове за известни crawler-и

### **Проблем 3: Edge cache не работи**

**Симптом:** X-Vercel-Cache винаги е MISS  
**Причина:** Cache-Control headers липсват или са грешни  
**Решение:** Провери че headers са правилно конфигурирани в `nuxt.config.ts`

---

## 📊 REPORTING

След 1 седмица тестване, попълни:

| Метрика | Цел | Реално | Status |
|---------|-----|--------|--------|
| ISR Writes/месец | <2M | _______ | ✅/❌ |
| Месечни разходи | $17-30 | _______ | ✅/❌ |
| Response time (ISR cached) | <200ms | _______ | ✅/❌ |
| Response time (SSR cached) | <200ms | _______ | ✅/❌ |
| Lighthouse (ISR) | >90 | _______ | ✅/❌ |
| Lighthouse (SSR) | >90 | _______ | ✅/❌ |

**Спестени средства:** $_______/месец ✅

---

🎉 **Успех!** Ако всички тестове минават, оптимизацията работи перфектно!



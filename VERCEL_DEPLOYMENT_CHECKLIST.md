# ✅ Vercel Deployment Checklist - ISR Оптимизация

## 🔍 ПРЕГЛЕД НА ПРОМЕНИТЕ

### 1️⃣ **Файлове променени:**

- ✅ `nuxt.config.ts` - ISR/SSR конфигурация
- ✅ `vercel.json` - Vercel конфигурация
- ✅ `woonuxt_base/server/api/revalidate.post.ts` - Нов API endpoint (ON-DEMAND REVALIDATION)
- ✅ `VERCEL_ISR_OPTIMIZATION.md` - Документация
- ✅ `TEST_ISR_OPTIMIZATION.md` - Тестов план

---

## ✅ СЪВМЕСТИМОСТ С VERCEL

### **1. `vercel.json` - Оптимална конфигурация**

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": ".output/public",
  "regions": ["fra1"],
  
  // ✅ ВАЖНО: Конфигурация на функциите за ISR/SSR
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,      // Достатъчно за GraphQL заявки
      "maxDuration": 10    // 10s timeout
    },
    ".output/server/**/*.mjs": {
      "memory": 1024,      // Nuxt 3 server функции
      "maxDuration": 10
    }
  },
  
  // ✅ Cron jobs премахнати (не са нужни с 4h ISR)
  "crons": [],
  
  // ✅ Static assets caching
  "headers": [
    {
      "source": "/_nuxt/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Статус:** ✅ **СЪВМЕСТИМО**

---

### **2. `nuxt.config.ts` - ISR/SSR Route Rules**

```typescript
nitro: {
  routeRules: {
    // ✅ ISR само за критични страници
    "/produkt/**": {
      isr: { expiration: 14400 },  // 4 часа
      headers: { "Cache-Control": "..." }
    },
    "/produkt-kategoriya/**": {
      isr: { expiration: 14400 },  // 4 часа
      headers: { "Cache-Control": "..." }
    },
    
    // ✅ SSR + Edge Cache за некритични
    "/produkt-etiket/**": {
      ssr: true,  // Vercel автоматично кешира на Edge
      headers: { "Cache-Control": "..." }
    },
    "/marka-produkt/**": { ssr: true },
    "/blog/**": { ssr: true },
  }
}
```

**Статус:** ✅ **СЪВМЕСТИМО**

- Vercel автоматично разпознава `isr: { expiration }` и кешира ISR builds
- `ssr: true` кешира се от Vercel Edge Network с `s-maxage` header

---

### **3. `package.json` - Build Scripts**

```json
"scripts": {
  "vercel-build": "npm run generate:sitemap && cross-env NITRO_PRESET=vercel nuxt build"
}
```

**Статус:** ✅ **СЪВМЕСТИМО**

- `NITRO_PRESET=vercel` конфигурира Nitro за Vercel
- Vercel автоматично извиква `vercel-build` script

---

### **4. On-Demand Revalidation API**

**Файл:** `woonuxt_base/server/api/revalidate.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  // Валидация на secret
  // Fetch към самия сайт за trigger на revalidation
});
```

**Статус:** ✅ **СЪВМЕСТИМО**

- Vercel автоматично deploy-ва API routes от `server/api/`
- Endpoint: `https://leaderfitness.net/api/revalidate`

---

## 🚨 КРИТИЧНИ ПРОВЕРКИ ПРЕДИ DEPLOY

### ✅ **Checklist:**

- [x] ✅ `vercel.json` има `functions` конфигурация
- [x] ✅ `nuxt.config.ts` има `routeRules` с ISR/SSR
- [x] ✅ `package.json` има `vercel-build` script
- [x] ✅ On-demand API endpoint е създаден
- [ ] ⚠️ `REVALIDATE_SECRET` трябва да се добави във Vercel Environment Variables
- [ ] ⚠️ WordPress webhook (опционално) трябва да се конфигурира

---

## 🚀 DEPLOYMENT ПРОЦЕС

### **Стъпка 1: Git Commit & Push**

```bash
git add .
git commit -m "💰 Vercel ISR optimization: 89% cost reduction (ISR only for critical pages)"
git push origin main
```

### **Стъпка 2: Vercel Auto-Deploy**

Vercel автоматично ще:
1. Detect push към main branch
2. Изпълни `npm run vercel-build`
3. Deploy `.output/public` като static assets
4. Deploy `.output/server` като serverless функции
5. Конфигурира ISR според `routeRules`

**Очаквано време:** ~5-10 минути

### **Стъпка 3: Добави Environment Variables**

1. Отвори **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. Добави:
   ```
   Name: REVALIDATE_SECRET
   Value: <генерирай със: openssl rand -hex 32>
   ```
3. **Важно:** Scope = Production, Preview, Development (всички)
4. Save
5. **Redeploy проекта** (Settings → Deployments → Latest → Redeploy)

### **Стъпка 4: Верифицирай Deploy**

```bash
# Провери ISR страници
curl -I https://leaderfitness.net/produkt/test-product
# Очаквано: X-Vercel-Cache: HIT (при повторно посещение)

# Провери SSR страници
curl -I https://leaderfitness.net/produkt-etiket/test-tag
# Очаквано: X-Vercel-Cache: HIT (при повторно посещение)

# Провери On-Demand API
curl -X POST https://leaderfitness.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","paths":["/produkt/test"]}'
# Очаквано: {"success":true,"revalidated":1}
```

---

## ⚠️ ПОТЕНЦИАЛНИ ПРОБЛЕМИ И РЕШЕНИЯ

### **ПРОБЛЕМ 1: Build Failed - "NITRO_PRESET not found"**

**Причина:** `cross-env` не е инсталиран или не работи на Windows  
**Решение:**

```bash
npm install cross-env --save-dev
# или
yarn add cross-env --dev
```

Vercel автоматично ще инсталира dependencies при build.

---

### **ПРОБЛЕМ 2: ISR не работи - всеки път е MISS**

**Причина:** `isr: { expiration }` не е правилно конфигуриран  
**Решение:** Провери `nuxt.config.ts`:

```typescript
nitro: {
  routeRules: {
    "/produkt/**": {
      isr: { expiration: 14400 },  // ВАЖНО: expiration в секунди!
      // НЕ: isr: true  (това не работи!)
    }
  }
}
```

---

### **ПРОБЛЕМ 3: SSR Pages са бавни (>2s)**

**Причина:** GraphQL заявките са тежки  
**Решение:**

1. Оптимизирай GraphQL queries (премахни ненужни полета)
2. Увеличи `s-maxage` във headers (напр. 48h вместо 24h)
3. Провери WordPress сървър performance

---

### **ПРОБЛЕМ 4: On-Demand API връща 401 "Invalid secret"**

**Причина:** `REVALIDATE_SECRET` не е добавен във Vercel или е грешен  
**Решение:**

1. Vercel Dashboard → Settings → Environment Variables
2. Провери че `REVALIDATE_SECRET` съществува
3. Redeploy проекта за да се зареди новата променлива

---

### **ПРОБЛЕМ 5: Deployment размер е >250MB (Vercel limit)**

**Причина:** Твърде много files в `.output/`  
**Решение:**

Добави `.vercelignore`:

```
# .vercelignore
node_modules
.nuxt
.output/public/_nuxt/*.map
.git
*.log
```

---

## 📊 POST-DEPLOYMENT МОНИТОРИРАНЕ

### **1. Vercel Analytics (First 24h)**

Отвори: **Vercel Dashboard** → Your Project → Analytics

Провери:
- **Function Invocations:** Очаквано ~5,000-10,000/ден (първи ден, докато се build-ва кеша)
- **ISR Cache Writes:** Очаквано ~48,000/ден (трябва да намалее след 2-3 дни)
- **Edge Requests:** Очаквано ~50,000-100,000/ден (високо е добре - означава HIT от кеш!)

### **2. След 1 седмица:**

| Метрика | Цел | Реално | Status |
|---------|-----|--------|--------|
| **ISR Writes/ден** | <60,000 | _______ | ✅/❌ |
| **ISR Writes/седмица** | <420,000 | _______ | ✅/❌ |
| **Прогноза месечно** | <1.8M | _______ | ✅/❌ |
| **Edge Cache Hit Rate** | >85% | _______ | ✅/❌ |
| **Avg Response Time** | <500ms | _______ | ✅/❌ |

### **3. След 1 месец:**

- **Очаквани ISR Writes:** ~1.4-1.6M
- **Очаквани разходи:** $17-30
- **Спестени средства:** ~$130-240 (спрямо старата конфигурация)

---

## 🎯 SUCCESS CRITERIA

Deployment-ът е успешен ако:

✅ Build завършва без грешки  
✅ ISR страници се кешират (X-Vercel-Cache: HIT)  
✅ SSR страници се кешират (X-Vercel-Cache: HIT)  
✅ On-Demand API работи (success: true)  
✅ Response time < 500ms (cached)  
✅ ISR writes < 2M/месец  
✅ Месечни разходи < $35  

---

## 📖 ДОПЪЛНИТЕЛНИ РЕСУРСИ

- [Vercel ISR Documentation](https://vercel.com/docs/concepts/incremental-static-regeneration)
- [Nuxt 3 Nitro Preset](https://nitro.unjs.io/deploy/providers/vercel)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## 🆘 TROUBLESHOOTING

Ако нещо не работи:

1. **Провери Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

2. **Провери Build Logs:**
   Vercel Dashboard → Deployments → Latest → Build Logs

3. **Провери Function Logs:**
   Vercel Dashboard → Deployments → Latest → Function Logs

4. **Тествай локално:**
   ```bash
   npm run build
   npm run preview
   ```

5. **Rollback ако е нужно:**
   Vercel Dashboard → Deployments → Previous Version → Promote to Production

---

## ✅ ФИНАЛЕН CHECKLIST

Преди да deploy-неш, провери:

- [ ] ✅ Всички промени са committed и pushed
- [ ] ✅ `vercel.json` има `functions` конфигурация
- [ ] ✅ `REVALIDATE_SECRET` е готов (генериран)
- [ ] ✅ Прочел си този checklist до края
- [ ] ✅ Знаеш как да rollback ако нещо не работи

**Готов? Deploy!** 🚀

```bash
git push origin main
```

Vercel автоматично ще deploy-не новата версия!

---

## 📞 SUPPORT

Ако имаш въпроси:
- Vercel Support: https://vercel.com/support
- Nuxt 3 Discord: https://discord.nuxt.com
- Документация: `VERCEL_ISR_OPTIMIZATION.md`, `TEST_ISR_OPTIMIZATION.md`

---

**🎉 Успех с deploy-мента! Очакваме 89% намаление на разходите!** 💰



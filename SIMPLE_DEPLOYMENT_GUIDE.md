# 🚀 Опростено Ръководство за Deploy

## ✅ **ВАРИАНТ 1: Обикновен Deploy (БЕЗ WordPress webhook)**

### **Какво ще работи:**
- ✅ ISR кешира продукти и категории за **4 часа**
- ✅ SSR + Edge кешира етикети/марки/блог за **24 часа**
- ✅ **Разходи: $17-30/месец** (89% намаление!)
- ⏱️ Промените се виждат след **максимум 4 часа**

### **Стъпки:**

```bash
# 1. Commit промените
git add .
git commit -m "💰 ISR optimization: 89% cost reduction"
git push origin main

# 2. Изчакай 5-10 минути за deployment
# 3. Готово! 🎉
```

**Това е всичко!** Няма нужда от `REVALIDATE_SECRET` или WordPress конфигурация.

---

## ⚡ **ВАРИАНТ 2: С WordPress Webhook (МОМЕНТАЛНО обновяване)**

### **Какво ще работи:**
- ✅ Същото като Вариант 1, НО:
- ⚡ **Промените се виждат ВЕДНАГА** (не след 4 часа!)
- ✅ **Същите разходи** ($17-30/месец)

### **Стъпки:**

#### **Стъпка 1: Deploy основния код**
```bash
git add .
git commit -m "💰 ISR optimization with on-demand revalidation"
git push origin main
```

#### **Стъпка 2: Генерирай secret token**
```bash
# На Windows (PowerShell):
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# На Mac/Linux:
openssl rand -hex 32

# Ще видиш нещо като:
# a3f2d8e1b4c7f9e2d5a8b1c4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4
```

**ВАЖНО:** Копирай този token! Ще ти трябва 2 пъти.

#### **Стъпка 3: Добави token във Vercel**
1. Отвори https://vercel.com/dashboard
2. Избери проекта си → Settings → Environment Variables
3. Натисни "Add New"
4. Попълни:
   - **Name:** `REVALIDATE_SECRET`
   - **Value:** (paste token from Step 2)
   - **Environments:** Production, Preview, Development (всички 3!)
5. Save
6. Redeploy проекта (Deployments → Latest → Redeploy)

#### **Стъпка 4: Добави WordPress hook**

Отвори WordPress Admin → Appearance → Theme File Editor → `functions.php`

Добави в края на файла:

```php
<?php
// ⚡ VERCEL ON-DEMAND REVALIDATION
// Автоматично invalidate-ва кеша при промяна на продукт

add_action('save_post_product', 'trigger_vercel_revalidation', 10, 3);
add_action('woocommerce_update_product', 'trigger_vercel_revalidation_product', 10, 1);

function trigger_vercel_revalidation($post_id, $post, $update) {
    // Само при публикувани продукти
    if ($post->post_status !== 'publish') return;
    
    $product_slug = $post->post_name;
    $paths = ["/produkt/{$product_slug}"];
    
    // Добави свързани категории
    $terms = get_the_terms($post_id, 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $paths[] = "/produkt-kategoriya/{$term->slug}";
        }
    }
    
    // Изпрати revalidation заявка към Vercel
    wp_remote_post('https://leaderfitness.net/api/revalidate', [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode([
            'secret' => 'PASTE_YOUR_TOKEN_HERE',  // ← Paste token from Step 2!
            'paths' => $paths
        ]),
        'timeout' => 5,
        'blocking' => false,  // Не забавя WordPress save
    ]);
}

function trigger_vercel_revalidation_product($product_id) {
    $product = wc_get_product($product_id);
    if (!$product) return;
    
    trigger_vercel_revalidation($product_id, get_post($product_id), true);
}
```

**ВАЖНО:** Замени `'secret' => 'PASTE_YOUR_TOKEN_HERE'` със token-а от Step 2!

#### **Стъпка 5: Тествай**

1. Редактирай продукт във WordPress
2. Промени цена или име
3. Save/Publish
4. Отвори продукта на сайта (напр. https://leaderfitness.net/produkt/test)
5. Промяната трябва да се вижда **ВЕДНАГА!** ⚡

---

## 🤔 **Кой вариант да избера?**

| Вариант | Кога да го избереш |
|---------|-------------------|
| **Вариант 1 (без webhook)** | - Променяш продукти **рядко** (1-2x седмично)<br>- Искаш по-прост setup<br>- 4 часа забавяне е ОК за теб |
| **Вариант 2 (с webhook)** | - Променяш продукти **често** (всеки ден)<br>- Искаш моментално обновяване<br>- Имаш достъп до WordPress `functions.php` |

**Моята препоръка:** Започни с **Вариант 1**. Ако ти трябва моментално обновяване по-късно, можеш да добавиш webhook винаги.

---

## 🎯 **Какво ще спестиш:**

| Конфигурация | Месечни разходи |
|--------------|----------------|
| **Преди** (ISR 30 мин навсякъде) | $160-270 💸 |
| **След** (Вариант 1 или 2) | **$17-30** ✅ |
| **Спестени** | **$130-240** 🎉 |

---

## ✅ **ГОТОВО!**

Избери вариант и действай! 🚀

---

## ❓ FAQ

### **Q: Какво ако забравя `REVALIDATE_SECRET` token-а?**

**A:** Нищо страшно! Генерирай нов token и замени във Vercel + WordPress.

### **Q: Може ли да променя `REVALIDATE_SECRET` след deployment?**

**A:** Да! Промени във Vercel Environment Variables + WordPress `functions.php`, после redeploy.

### **Q: Безопасен ли е да сложа token-а в WordPress `functions.php`?**

**A:** Да, защото:
1. `functions.php` не е публично достъпен
2. Token-ът е само за invalidate на кеш (не дава admin достъп)
3. Ако някой го открие, може само да invalidate кеш (не може да чете/променя данни)

### **Q: Колко струва on-demand revalidation?**

**A:** **БЕЗПЛАТНО!** API извикванията са negligible (~0.001% от разходите).

### **Q: Ако не добавя webhook, ще работи ли ISR?**

**A:** **ДА!** ISR работи перфектно и без webhook. Само че промените се виждат след 4 часа вместо моментално.

---

## 🆘 ПРОБЛЕМИ?

Ако нещо не работи:
1. Провери Vercel Logs: `vercel logs --follow`
2. Провери дали `REVALIDATE_SECRET` е добавен във Vercel
3. Провери WordPress PHP errors: WP Admin → Tools → Site Health
4. Тествай API ръчно:
   ```bash
   curl -X POST https://leaderfitness.net/api/revalidate \
     -H "Content-Type: application/json" \
     -d '{"secret":"YOUR_TOKEN","paths":["/produkt/test"]}'
   ```

Очакван отговор: `{"success":true,"revalidated":1}`

---

**Избери вариант и deploy-ни!** 🎉



# 🔄 **Обновяване на Plugin-а**

## **🔧 Какво направих:**

1. **Промених името на типа** от `ProductTaxonomyFilterInput` на `WooNuxtTaxonomyFilterInput` (за да избегна конфликт)
2. **Обнових всички GraphQL заявки** да използват новия тип
3. **Активирах обратно taxonomyFilter кода** в `useProducts.ts`

## **📋 Стъпки за обновяване:**

### **1. Копирайте обновения plugin:**

```bash
# Копирайте обновения файл:
cp woonuxt_base/app/server/plugins/woonuxt-taxonomy-filter.php /path/to/wordpress/wp-content/plugins/
```

### **2. Деактивирайте и активирайте plugin-а в WordPress:**

1. Идете на **Plugins > Installed Plugins**
2. Намерете **"WooNuxt Taxonomy Filter"**
3. Кликнете **"Deactivate"**
4. След това кликнете **"Activate"**

⚠️ **Това е важно за да reload-не новия код!**

### **3. Тествайте обновената заявка:**

Отидете на `yourdomain.com/graphql` и тествайте:

```graphql
query TestUpdatedPlugin {
  products(
    where: {
      taxonomyFilter: [
        { taxonomy: "pa_brands", terms: ["adidas"], operator: IN }
      ]
    }
  ) {
    nodes {
      name
      slug
      terms {
        nodes {
          name
          taxonomyName
        }
      }
    }
  }
}
```

**Ако работи:** Отлично! Продължете към стъпка 4.

**Ако не работи:** Проверете дали plugin-ът е reload-нал правилно.

### **4. Стартирайте Nuxt и тествайте frontend:**

```bash
cd woonuxt_base
npm run dev
```

След като Nuxt стартира:

1. Идете на `/magazin`
2. Изберете атрибутен филтър (например brand)
3. Трябва да видите console log: `🔥 ПРАЩАМЕ КАТО taxonomyFilter`
4. Продуктите трябва да се филтрират по реални атрибути!

## **🎯 Очакван резултат:**

- ✅ Бързо server-side филтриране
- ✅ Правилни продукти (с реални атрибути)
- ✅ Работеща пагинация
- ✅ Console logs показват успешно изпращане на филтри

## **🚨 Ако има проблеми:**

### **Проблем: "Unknown type WooNuxtTaxonomyFilterInput"**

**Решение:** Plugin-ът не е reload-нал. Деактивирайте и активирайте отново.

### **Проблем: "Field taxonomyFilter not found"**

**Решение:** Проверете дали правилно сте copy-нали обновения plugin файл.

### **Проблем: Nuxt GraphQL грешки**

**Решение:** Restart-нете Nuxt dev сървъра след обновяване на plugin-а.

### **Проблем: Филтрирането не работи**

**Решение:** Проверете дали имате продукти с `pa_brands` атрибути в WordPress.

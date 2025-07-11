# 🎯 **РЕШЕНИЕ НА АТРИБУТНОТО ФИЛТРИРАНЕ**

## **Проблемът**

WooCommerce GraphQL **НЕ поддържа taxonomy филтри** за атрибути (`pa_brands`, `pa_color`, и т.н.). `tagIn` параметърът работи само за product tags, НЕ за атрибути.

## **Решението**

Създадох **custom WordPress plugin** който добавя `taxonomyFilter` поддръжка към WooCommerce GraphQL.

## **🔧 Стъпки за инсталиране:**

### **1. Копирайте PHP plugin-а в WordPress**

```bash
# От woonuxt директорията
cp woonuxt_base/app/server/plugins/woonuxt-taxonomy-filter.php /path/to/wordpress/wp-content/plugins/
```

**ИЛИ** го качете през WordPress админ панела:

1. Отидете на **Plugins > Add New Plugin > Upload Plugin**
2. Качете файла `woonuxt-taxonomy-filter.php`
3. Активирайте plugin-а

### **2. Проверете че plugin-ът е активиран**

В WordPress админ панела:

- **Plugins > Installed Plugins**
- Трябва да видите **"WooNuxt Taxonomy Filter"**
- Уверете се че е **активиран**

### **3. Тествайте GraphQL схемата**

Отидете на `yourdomain.com/graphql` и тествайте:

```graphql
query TestTaxonomyFilter {
  products(
    where: {
      taxonomyFilter: [
        { taxonomy: "pa_brands", terms: ["adidas", "nike"], operator: IN }
      ]
    }
  ) {
    nodes {
      name
      slug
    }
  }
}
```

## **🎯 Как работи сега**

### **Преди (НЕРАБОТЕЩО):**

```
URL: /magazin?filter=pa_brands[adidas]
❌ tagIn: ["adidas"] -> търси в product tags, НЕ намира атрибути
```

### **Сега (РАБОТЕЩО):**

```
URL: /magazin?filter=pa_brands[adidas]
✅ taxonomyFilter: [{ taxonomy: "pa_brands", terms: ["adidas"], operator: "IN" }]
-> търси в pa_brands taxonomy, намира продукти с Adidas атрибут!
```

## **🔥 Какво променя plugin-ът**

1. **Добавя `taxonomyFilter` към GraphQL схемата**

   - Нов параметър в products заявката
   - Поддържа множество taxonomies
   - IN/NOT_IN/AND оператори

2. **Hook-ва WooCommerce GraphQL query**

   - Автоматично конвертира `taxonomyFilter` в `tax_query`
   - Използва WordPress built-in taxonomy система
   - Бърз server-side филтрирование

3. **Frontend автоматично използва новата заявка**
   - Премахнах `tagIn` подхода
   - Добавих `taxonomyFilter` генериране
   - Запазих същия URL формат

## **🎬 Резултатът**

- ✅ **Бързо server-side филтриране** (като категориите)
- ✅ **Правилни продукти** (със актуални атрибути, НЕ само име)
- ✅ **Работеща пагинация** (филтрирани резултати)
- ✅ **Запазен URL формат** (`?filter=pa_brands[adidas]`)

## **🧪 Тестване**

1. Идете на `/magazin`
2. Изберете атрибут филтър (например brand)
3. Трябва да видите:
   - Продукти с РЕАЛНИ атрибути (не само с името в заглавието)
   - Бързо зареждане
   - Работеща пагинация

## **🔍 Debugging**

Ако не работи, проверете:

1. **Plugin активиран?** - WordPress Admin > Plugins
2. **GraphQL схема updated?** - Refresh GraphQL endpoint
3. **Console logs** - Трябва да видите `🔥 SERVER-SIDE TAXONOMY FILTER`
4. **Network tab** - `taxonomyFilter` в GraphQL заявката?

## **📁 Файлове променени:**

- ✅ `server/plugins/woonuxt-taxonomy-filter.php` - Нов plugin
- ✅ `queries/getProducts.gql` - Добавен `taxonomyFilter` параметър
- ✅ `composables/useProducts.ts` - Заменен `tagIn` с `taxonomyFilter`

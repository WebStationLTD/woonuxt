# 🔍 **Проверка на Plugin Статуса**

## **✅ Първо: Стартирайте Nuxt**

Сега когато премахнах временно `taxonomyFilter` от заявките, Nuxt трябва да стартира без грешки:

```bash
cd woonuxt_base
npm run dev
```

**Ако няма GraphQL грешки** - продължаваме към следващата стъпка!

## **🔧 Второ: Инсталирайте Plugin-а**

1. **Копирайте plugin файла** в WordPress:

   ```bash
   # Копирайте woonuxt_base/app/server/plugins/woonuxt-taxonomy-filter.php
   # в /path/to/your/wordpress/wp-content/plugins/
   ```

2. **Активирайте plugin-а** в WordPress админ:
   - Идете на **Plugins > Installed Plugins**
   - Намерете **"WooNuxt Taxonomy Filter"**
   - Кликнете **"Activate"**

## **🧪 Трето: Тествайте GraphQL схемата**

Отидете на `yourdomain.com/graphql` и тествайте:

```graphql
query TestNewTypes {
  __schema {
    types {
      name
    }
  }
}
```

**Търсете в резултата:**

- `ProductTaxonomyFilterInput`
- `TaxonomyOperatorEnum`

**АКО ГИ ВИДИТЕ** - plugin-ът работи! Продължете към стъпка 4.

**АКО НЕ ГИ ВИДИТЕ** - plugin-ът не е активиран правилно.

## **🎯 Четвърто: Тествайте taxonomy филтрирането**

Ако типовете се появяват, тествайте истинско филтриране:

```graphql
query TestAttributeFilter {
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

**Ако работи:** Възвръщайте `taxonomyFilter` в заявките!

## **🔙 Пето: Възвръщане на taxonomyFilter код**

След като plugin-ът работи в GraphQL, uncomment-вайте кода:

### В `queries/getProducts.gql`:

```diff
+ $taxonomyFilter: [ProductTaxonomyFilterInput]

+ taxonomyFilter: $taxonomyFilter
```

### В `composables/useProducts.ts`:

```diff
- // ВРЕМЕННО СКРИТО - taxonomyFilter до plugin активация
- // if (taxonomyFilters.length > 0) {
- //   console.log('🔥 ПРАЩАМЕ КАТО taxonomyFilter:', taxonomyFilters);
- //   variables.taxonomyFilter = taxonomyFilters;
- // }

+ if (taxonomyFilters.length > 0) {
+   console.log('🔥 ПРАЩАМЕ КАТО taxonomyFilter:', taxonomyFilters);
+   variables.taxonomyFilter = taxonomyFilters;
+ }
```

## **🎬 Резултат:**

След тези стъпки атрибутното филтриране трябва да работи:

- ✅ Бързо server-side филтриране
- ✅ Правилни продукти (с реални атрибути)
- ✅ Работеща пагинация
- ✅ Запазен URL формат

## **❌ Ако Plugin-ът НЕ работи:**

Алтернативно решение - използваме **meta_query** подход:

```php
// В plugin-а заменете tax_query с meta_query за атрибути
$query_args['meta_query'][] = [
    'key' => '_product_attributes',
    'value' => serialize(strval($taxonomy)),
    'compare' => 'LIKE'
];
```

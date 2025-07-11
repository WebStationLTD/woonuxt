# Проверка на WPGraphQL Filter Query Plugin Schema

## 🔍 Стъпки за проверка на GraphQL типовете

### 1. Отидете на WordPress GraphQL IDE

```
https://yourdomain.com/graphql
```

### 2. Проверете дали plugin-ът е активиран правилно

**Тест Query:**

```graphql
query CheckPluginTypes {
  __schema {
    types {
      name
    }
  }
}
```

Търсете в резултата:

- `TaxonomyFilter`
- `ProductFilter`
- `FilterInput`
- Други типове свързани с "filter"

### 3. Проверете дали products заявката поддържа filter

**Тест Query:**

```graphql
query CheckProductsFilterSupport {
  __type(name: "RootQueryToProductUnionConnectionWhereArgs") {
    fields {
      name
      type {
        name
      }
    }
  }
}
```

Търсете дали има:

- `filter` поле
- `taxonomyFilter` поле

### 4. Проверете aggregations поддръжка

**Тест Query:**

```graphql
query CheckAggregationsSupport {
  __type(name: "RootQueryToProductUnionConnection") {
    fields {
      name
      type {
        name
      }
    }
  }
}
```

Търсете дали има:

- `aggregations` поле

### 5. Тест на реална заявка (ако plugin-ът работи)

**Примерна Query според документацията:**

```graphql
query ProductsWithFilter {
  products(filter: { tag: { name: { in: ["adidas"] } } }) {
    nodes {
      name
      slug
    }
    aggregations {
      tags {
        key
        count
      }
    }
  }
}
```

### 6. Проверете тагове срещу атрибути

**Query за тагове:**

```graphql
query TestTagFilter {
  products(filter: { tag: { name: { eq: "adidas" } } }) {
    nodes {
      name
    }
  }
}
```

**Query за категории:**

```graphql
query TestCategoryFilter {
  products(filter: { category: { name: { eq: "sport" } } }) {
    nodes {
      name
    }
  }
}
```

## 📝 Резултати от проверката

### ✅ Ако plugin-ът работи правилно:

- `filter` полето ще съществува в products where аргументите
- `aggregations` полето ще съществува в products резултата
- Заявките с филтри ще работят

### ❌ Ако plugin-ът НЕ работи:

- Типовете няма да съществуват в схемата
- `filter` полето няма да се появи
- Заявките ще дават грешки

## 🛠️ Възможни проблеми и решения

### Проблем 1: Plugin не се показва в схемата

**Решение:** Проверете дали:

- Plugin-ът е активиран в WordPress admin
- WP GraphQL е активиран
- Няма конфликти между plugin-ите

### Проблем 2: Schema се регенерира грешно

**Решение:**

- Деактивирайте и активирайте plugin-а
- Изчистете кеша на WP GraphQL
- Рестартирайте WordPress

### Проблем 3: Различна API от очакваната

**Решение:**

- Проверете документацията на plugin-а
- Проверете примерите в GitHub repo
- Адаптирайте кода според реалната схема

## 📋 След проверката:

1. Документирайте какви точно типове има plugin-ът
2. Адаптирайте GraphQL заявките спрямо реалната схема
3. Обновете TypeScript кода да използва правилните типове
4. Тествайте реални заявки с атрибутни филтри

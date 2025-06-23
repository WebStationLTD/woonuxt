# Ръководство за тестване на Borica интеграция

## 🧪 Стъпки за тестване на тестовия домейн

### 1. Backend настройка

```bash
# 1. Инсталирай Borica плъгина в WordPress
# 2. Отиди на WooCommerce > Настройки > Плащания > Борика EMV
# 3. Конфигурирай следните настройки:
```

**Задължителни настройки за тест:**

- ✅ **Активирай Борика:** Да
- ✅ **Тест режим:** Да
- ✅ **Име на търговец:** "TEST MERCHANT"
- ✅ **Линк на търговец:** "https://your-test-domain.com"
- ✅ **Имейл на търговец:** "test@example.com"
- ✅ **Език:** "bg"
- ✅ **Номер на терминал:** `тестов номер от банката`
- ✅ **Номер на търговец:** `тестов номер от банката`
- ✅ **Метод за подпис:** "MAC_GENERAL"

### 2. Тестване на GraphQL API

```graphql
# Тествай в GraphQL Playground или чрез Nuxt DevTools
query TestPaymentGateways {
  paymentGateways {
    nodes {
      id
      title
      description
    }
  }
}
```

**Очакван резултат:**

```json
{
  "data": {
    "paymentGateways": {
      "nodes": [
        {
          "id": "borica_emv",
          "title": "Борика EMV",
          "description": "Плащане с дебитна/кредитна карта чрез Борика"
        }
        // ... други payment gateways
      ]
    }
  }
}
```

### 3. Frontend тестване

#### 3.1 Проверка на Payment Options

1. Отиди на `/checkout`
2. Добави продукт в количката
3. Провери дали Borica се показва в payment methods
4. Провери дали има правилната икона

#### 3.2 Тестване на checkout процеса

```bash
# Стъпки за тестване:
1. Добави продукт в количката
2. Отиди на /checkout
3. Попълни billing данни
4. Избери "Борика EMV" като payment method
5. Натисни "Плати"
6. Трябва да бъдеш пренасочен към Borica тест страница
7. Използвай тестови карти данни
8. Провери дали се връщаш обратно към сайта
```

### 4. Тестови карти за Borica

**Успешни плащания:**

- Карта: `4111111111111111`
- CVV: `123`
- Експириране: `12/25`

**Неуспешни плащания:**

- Карта: `4000000000000002`
- CVV: `123`
- Експириране: `12/25`

### 5. Debug и логове

#### 5.1 WordPress Debug

```php
// В wp-config.php добави:
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

#### 5.2 Borica Debug

- Включи debug режим в Borica настройките
- Проверявай logs в `/wp-content/uploads/wc-logs/`

#### 5.3 Frontend Debug

```javascript
// В browser console проверявай:
- GraphQL заявки към /graphql
- Network requests към Borica
- Console errors
- localStorage данни за поръчки
```

### 6. Тестови сценарии

#### ✅ Сценарий 1: Успешно плащане

1. Успешен checkout с Borica
2. Redirect към Borica
3. Успешно плащане с тестова карта
4. Връщане към success страница
5. Поръчката има статус "processing"

#### ❌ Сценарий 2: Неуспешно плащане

1. Checkout с Borica
2. Redirect към Borica
3. Неуспешно плащане (грешна карта)
4. Връщане към checkout с error
5. Поръчката остава "pending"

#### 🔄 Сценарий 3: Прекъснато плащане

1. Checkout с Borica
2. Redirect към Borica
3. Клиент затваря Borica страницата
4. Връщане към checkout
5. Поръчката остава "pending"

### 7. Performance тестване

```bash
# Тествай скоростта на:
- GraphQL заявки за payment gateways
- Checkout процеса
- Redirect към Borica
- Return обработката
```

### 8. Мониторинг

#### Какво да следиш:

- [ ] GraphQL errors в Network tab
- [ ] Console errors в browser
- [ ] WordPress error logs
- [ ] Borica transaction logs
- [ ] Database записи за поръчки
- [ ] Email notifications

### 9. Troubleshooting

#### Проблем: Borica не се показва в payment methods

```bash
# Решения:
1. Провери дали плъгинът е активиран
2. Провери GraphQL заявката
3. Clear cache на WordPress
4. Провери WooCommerce настройки
```

#### Проблем: Redirect към Borica не работи

```bash
# Решения:
1. Провери SSL сертификат
2. Провери Borica настройки в плъгина
3. Проверки logs за грешки
4. Тествай с различен browser
```

#### Проблем: Return от Borica не работи

```bash
# Решения:
1. Провери return URL настройки
2. Провери routing в Nuxt
3. Провери /checkout/borica-return страницата
4. Провери GraphQL permissions
```

### 10. Готовност за Production

- [ ] Всички тестове преминават успешно
- [ ] SSL сертификат е активен
- [ ] Production сертификати от банката
- [ ] Return URLs са конфигурирани правилно
- [ ] Error handling работи
- [ ] Мониторинг е настроен
- [ ] Backup план е готов

### 11. Полезни команди

```bash
# WordPress CLI
wp plugin list
wp option get woocommerce_borica_emv_settings

# GraphQL debugging
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ paymentGateways { nodes { id title } } }"}' \
  https://your-domain.com/graphql

# Nuxt debugging
npm run dev
npm run build
npm run preview
```

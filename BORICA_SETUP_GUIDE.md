# Borica Headless Integration Guide

## 1. WordPress Backend Setup

### Инсталиране на Borica плъгина

1. Качи плъгина `woocommerce-gateway-borica` в `/wp-content/plugins/`
2. Активирай плъгина от WP Admin
3. Отиди на `WooCommerce > Настройки > Плащания > Борика EMV`

### Основни настройки за тестов режим

```php
// В wp-config.php за тестов домейн
define('BORICA_TEST_MODE', true);
```

### Задължителни настройки:

- ✅ Активирай "Активирайте Борика в Тест Режим"
- ✅ Име на търговец: "Тестов Магазин"
- ✅ Линк на търговец: "https://your-test-domain.com"
- ✅ Имейл на търговец: "test@email.com"
- ✅ Език: "bg" (български)
- ✅ Номер на терминал: (от банката)
- ✅ Номер на търговец: (от банката)
- ✅ Метод за подпис: "MAC_GENERAL"

## 2. GraphQL Integration

Borica ще се появи автоматично в GraphQL API като payment gateway:

```graphql
query getCart {
  paymentGateways {
    nodes {
      id # "borica_emv"
      title # "Борика EMV"
      description # Описанието от настройките
    }
  }
}
```

## 3. Frontend Integration

### 3.1 Добавяне на Borica в PaymentOptions компонента

- Borica ще се показва автоматично в списъка с payment methods
- Добави икона за Borica в PaymentOptions.vue

### 3.2 Checkout Process Flow

1. Клиент избира Borica като payment method
2. Попълва billing данни
3. Натиска "Плати"
4. Backend генерира Borica redirect URL
5. Frontend прави redirect към Borica
6. Клиент въвежда карта в Borica
7. Borica прави callback към WordPress
8. WordPress обработва резултата
9. Клиент се връща към success/failure страница

### 3.3 Redirect Handling & Return URLs

**ВАЖНО:** За да работи правилно в headless среда, трябва да конфигурираш return URLs в Borica плъгина:

#### В WordPress Admin панела:

1. Отиди на `WooCommerce > Настройки > Плащания > Борика EMV`
2. В секция "Return URLs" добави:
   - **Success URL:** `https://your-domain.com/checkout/borica-return`
   - **Failure URL:** `https://your-domain.com/checkout?payment_error=borica`
   - **Cancel URL:** `https://your-domain.com/checkout?payment_error=borica_cancelled`

#### Routing в Nuxt:

- `/order-pay/[orderId]` - Обработва WooCommerce order-pay заявки
- `/porachka-2/order-pay/[orderId]` - Българската локализирана версия (redirect)
- `/checkout/borica-return` - Обработва връщането от Borica

## 4. Testing Strategy

### За тестов домейн:

1. Използвай тестовите данни от банката
2. Генерирай тестови сертификати
3. Тествай с тестови карти

### Debugging:

- Включи debug mode в плъгина
- Проверявай logs в `/wp-content/uploads/wc-logs/`
- Тествай GraphQL заявките

## 5. Production Deployment

1. Заяви production сертификати от банката
2. Конфигурирай production настройки
3. Тествай с реални суми (малки)
4. Мониторирай за грешки

## 6. Security Considerations

- SSL сертификат е задължителен
- Валидирай callback signatures
- Логвай всички транзакции
- Имай backup план за downtime

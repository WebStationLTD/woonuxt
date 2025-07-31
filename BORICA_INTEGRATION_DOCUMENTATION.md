# Borica Payment Integration Documentation

## Обзор

Тази интеграция позволява приемането на онлайн плащания чрез системата на Борика в Nuxt.js + WooCommerce приложението.

## Функциониране

### Основен flow:

1. Потребителят избира "Плащане с карта" в checkout
2. Създава се поръчка в WooCommerce
3. Инициализира се плащане чрез Borica API
4. Потребителят се пренасочва към Borica gateway
5. Borica обработва плащането и изпраща callback
6. Потребителят се връща към нашия сайт с резултата

## Файлове и структура

### API Endpoints:

- `server/api/borica/initiate.post.ts` - Инициализиране на плащане
- `server/api/borica/callback.post.ts` - Получаване на callback от Borica
- `server/api/borica/result.get.ts` - BACKREF URL за пренасочване на потребители

### Frontend:

- `composables/useBorica.ts` - Composable за Borica интеграция
- `pages/payment-result.vue` - Страница за показване на резултати
- `types/borica.d.ts` - TypeScript типове

### Обновени файлове:

- `woonuxt_base/app/pages/checkout.vue` - Добавена Borica логика
- `woonuxt_base/app/composables/useCheckout.ts` - Обновена checkout логика

## Конфигурация

### Environment Variables:

```bash
# Borica Terminal ID
BORICA_TERMINAL_ID=V5400641

# Private Key (PEM format)
BORICA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"

# Merchant данни
BORICA_MERCHANT_NAME=MyStore
BORICA_MERCHANT_URL=https://myshop.com/

# Callback URL
BORICA_BACKREF_URL=https://myshop.com/api/borica/result

# Gateway URL (test/production)
BORICA_GATEWAY_URL=https://3dsgate-dev.borica.bg/cgi-bin/cgi_link
```

### Тестова среда:

- Terminal ID: `V5400641`
- Gateway URL: `https://3dsgate-dev.borica.bg/cgi-bin/cgi_link`

### Продукционна среда:

- Terminal ID: Получавате от банката
- Gateway URL: `https://3dsgate.borica.bg/cgi-bin/cgi_link`

## Процес на плащане

### 1. Инициализиране (frontend):

```typescript
const { initiatePayment } = useBorica();

const result = await initiatePayment({
  orderId: "12345",
  amount: 50.0,
  currency: "BGN",
  description: "MyStore - Поръчка #12345",
  customerEmail: "customer@example.com",
});

if (result.success) {
  redirectToGateway(result.formData);
}
```

### 2. Процесиране (backend):

- Генериране на подпис с MAC_GENERAL схема
- Създаване на HTML форма за POST към Borica
- Автоматично изпращане към gateway

### 3. Callback обработка:

- Проверка на подписа от Borica
- Валидация на response data
- Обновяване на статуса на поръчката

## Тестване

### Тестови карти (Borica Test Environment):

- **Успешно плащане**: 4111111111111111 (Visa)
- **Неуспешно плащане**: 4000000000000002 (Visa)
- **Експирираща дата**: Всяка бъдеща дата
- **CVV**: Всеки 3-цифрен код

### Тестови сценарии:

1. Успешно плащане с валидна карта
2. Отказано плащане с невалидна карта
3. Потребителят натиска "Назад" в Borica
4. Изтекъл таймаут на заявката

## Сигурност

### Подписване:

- Използва се SHA1 с RSA подпис
- MAC_GENERAL схема за подписване
- Всички критични полета се включват в подписа

### Валидация:

- Проверка на подписа в callback
- Валидация на response codes
- Проверка на timestamp за защита от replay атаки

## Response Codes

| Код | Описание                            |
| --- | ----------------------------------- |
| 0   | Успешно плащане                     |
| -1  | Системна грешка                     |
| -2  | Невалидни данни                     |
| -17 | Невалиден подпис или изтекла заявка |
| -19 | Грешка при автентикация             |
| -25 | Потребителят отказа плащането       |

## Troubleshooting

### Често срещани проблеми:

1. **Невалиден подпис**:

   - Проверете дали private key е правилно форматиран
   - Уверете се, че полетата за подписване са в правилния ред

2. **Изтекла заявка**:

   - TIMESTAMP трябва да е по-нов от 15 минути
   - Използвайте UTC време

3. **Няма callback**:

   - Проверете дали BACKREF URL е достъпен от интернет
   - Уверете се, че endpoint-ът връща HTTP 200

4. **Пренасочване не работи**:
   - Проверете дали BACKREF URL е правилно конфигуриран
   - Уверете се, че nginx/server подкрепя POST заявки към API endpoints

## Production Checklist

- [ ] Променете `BORICA_TERMINAL_ID` с реалния terminal ID
- [ ] Обновете `BORICA_GATEWAY_URL` за production
- [ ] Генерирайте нов private/public key pair
- [ ] Регистрирайте public key в Borica системата
- [ ] Тествайте с реални карти в малки суми
- [ ] Конфигурирайте SSL сертификат
- [ ] Настройте monitoring и logging

## Поддръжка

За техническа поддръжка относно Borica интеграцията:

- Email: e-comPlugins@borica.bg
- Документация: https://3dsgate-dev.borica.bg/

За проблеми с кода:

- Проверете browser console за JavaScript грешки
- Проверете server logs за API грешки
- Използвайте Borica тестовата среда за debugging

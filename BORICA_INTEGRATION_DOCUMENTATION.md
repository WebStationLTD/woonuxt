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
BORICA_TERMINAL_ID=V1234567

# Private Key (може да е с или без PEM headers - кодът ще ги добави автоматично)
BORICA_PRIVATE_KEY=MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIu/oOltfXyEMCAggAMAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECEqfChKvv3UpBIIEyAvgpo63krw5436vDqe5mmUbC0S3XNfqIa4l0skbQr3ljUD4q671pXA/m7H+2VntZG+znOZ7QSLoXggFS7RjXjTWcrdUkC4IihGr8DaUbEGnPZZxy8jlylW8dSN7au7Uw52hIbSxoZZG02ZYHt8DVwTCCzMQWMo1TNUr7ZCByjyXCvomBj1DahbGwVfIUJIMM0T2IK1hJDuc+OljWKw8bK/MnV58dg8GhC86cJwmQtNdOYg31kQbdgvQL52/wT4G6SqMLTKPzp5iFqiWaso3Kbrl4qhuxmtp2cUHdb70iRxDKdJzgUr5AKFm9zc1/q9YYuluy8n55DGDZJQqB2Nn1nGm0xDd5K5cDC93th6Doves9j1fL9GAjW8UQZp218e7xg086Et8xOgdFRC/05Pf3L6iRZ4BY1ewH/aMQXh/vOuBEo0gv+ZY/PwD//mUN2GgoJ4uFqJFLcxKsRFb1yA0li5Ml/YfANYvAgDgnXFX7uWCO8Hkkg0v1ECA4R71RpLxQd0ViEMDafy9ruRFzOs+DrHg7+QUX7GYITvkY50utSy4oFKx/G7QEHtuxDMCtRXgQoJ07AeLjpHItWyDA/IkLVjlqQG8arjwjcvzTm1c0j42JWAoIXXNN2lzc9BKrGr+xjWQtEGcoBcBbigJSOfvybzfReC8gtBsBuaNxyQ5GSQxLFj5jY0vymU4sTYAUZV5x5YQByB6WSc2ydoQUte4Jm8gzAKJl4Rtll6Vl8ys5eWrcVTxkg+eL4dvzuqBDYKBPv//G/Fp+vF7ZpNbeJw/qquYta0lNdDAcPdkDihnr9Rv6u7P/MMcN2hAKivqJIbfXIMn/J1KPv/g2rumX/W6wKj8kpSH/t6v/Ug8dHH2cSYSJRSESpNpRhwv+9bg0rjhEqsBMvGgLOXpOMpXjlHZs3jh7ZxF7fmDpO7qlJI5kgJk4IbuO9Etf+cv7auLbVT5wSl+Gxielr/Tqa9sKwgs2KOYVpzpcKgoA3eoS9OAfxngnq24tsgBKmPc8M9eNvqpojVvv8Gt/nnrNgAL0l4gs+dnWCJCuqIDP9uDzttL3YkHw8trC8aPwjzXuYDj8/yo+Lpn6+er8QvgbA+8J5MMUjmtvRmWtwgfc83tBadQXD7S+saB+zVJgDu/B/vjD+Z0u/5Az1JSlxOIY7GkrWtgRi9t4IiT8lAlAUPhc+2p4JRAIXbFxvo2C9fIfM0vUGUcjBliIGJEo7Uf5h6pmeLlgURStj+5JeIoF3rG7iSqgq9vJVoYnw7hLq0Ik5G5NzpaMcppUzeLW4ivtMPj/iAC7jL0BIFRnBkxH9zOtXCokm5C/I74BIMxZEbB6uxLj0iejc6W3nPEJcJ9wMwWBpmb6/ANWVpJUd5FNwCfNsYKu+8iZgBeevemO+DvK+m3BqEKftpZO7RhyE4S7ZhDOhZRvRh9gVDa5oow/9Pn9djUGCZhW7+zW84gcjl8Rq/moviWq+i0pDj4l+LGtkQXsTtPX21TXPELixHm1/66Gypu6y4NP5bjIcu1qd4E5VohSxdaaYLl8LKit5aC2fmBeRqWIbZCiqFwq50n7guq+kMaaJ1V0urT4QnsVKB5SXGiJnhnrMc0X3Oy3/3fBiNxXYININb3aq3XSSx0dA==

# Merchant данни
BORICA_MERCHANT_NAME=Лидерфитнес ЕООД
BORICA_MERCHANT_URL=https://woonuxt-ten.vercel.app/

# Callback URL (и за system callbacks и за user return)
BORICA_BACKREF_URL=https://woonuxt-ten.vercel.app/api/borica/callback

# Gateway URL (test/production)
BORICA_GATEWAY_URL=https://3dsgate-dev.borica.bg/cgi-bin/cgi_link
```

**Важно:** Вашият private key може да остане така, както е в момента. Кодът автоматично ще добави нужните PEM headers.

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

1. **"Грешка при създаване на поръчката"**:

   - Проверете дали WooCommerce GraphQL API работи правилно
   - Уверете се, че customer billing данните са попълнени
   - Проверете browser console за GraphQL грешки

2. **"Празна количка" след неуспешно плащане**:

   - Това е нормално - количката се запазва при неуспешни Borica плащания
   - Проверете дали има валидни продукти в количката преди плащане

3. **Невалиден подпис**:

   - Private key формата се обработва автоматично
   - Проверете дали environment variables са правилно зададени

4. **Изтекла заявка**:

   - TIMESTAMP трябва да е по-нов от 15 минути
   - Използвайте UTC време

5. **Няма callback**:

   - Проверете дали BACKREF URL е достъпен от интернет
   - Уверете се, че endpoint-ът връща HTTP 200

6. **Пренасочване не работи**:
   - Проверете дали BACKREF URL е правилно конфигуриран
   - Уверете се, че nginx/server подкрепя POST заявки към API endpoints

### Debug стъпки:

1. **Отворете browser console** преди да натиснете "Плащам"
2. **Проверете Network tab** за заявки към `/api/borica/initiate`
3. **Проверете server logs** за Borica API грешки
4. **Валидирайте environment variables** - всички трябва да са зададени

### Тестване:

```bash
# Проверете дали API endpoint работи
curl -X POST https://your-domain.com/api/borica/initiate \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test123","amount":10.00,"description":"Test order","currency":"BGN"}'
```

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

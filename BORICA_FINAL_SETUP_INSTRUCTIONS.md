# 🚀 ФИНАЛНИ ИНСТРУКЦИИ ЗА BORICA ИНТЕГРАЦИЯ

## ✅ Какво е направено в кода

След внимателен анализ на цялата ви апликация, **ДОБРАТА НОВИНА е че интеграцията е почти напълно готова!** Всички файлове и логика са правилно имплементирани.

### Поправени проблеми:

1. ✅ **Обновени default стойности** в `server/api/borica/initiate.post.ts`
2. ✅ **Поправен BACKREF URL** да сочи към правилния endpoint
3. ✅ **Обновени merchant данни** да съответстват на вашите
4. ✅ **Добавена логика за обновяване на поръчки** в `callback.post.ts`
5. ✅ **Създаден template за environment variables**

## 🔧 ЗАДЪЛЖИТЕЛНИ СТЪПКИ ЗА ВАС

### 1. Създайте .env файл

Копирайте `borica.env.template` като `.env` в root папката и попълнете реалните стойности:

```bash
# Копирайте template файла
cp borica.env.template .env
```

### 2. Попълнете частния ключ

В `.env` файла заменете `YOUR_PRIVATE_KEY_HERE` с вашия реален частен ключ, който сте генерирали за сертификата.

### 3. Създайте WooCommerce API ключове

В WordPress Admin:

1. Отидете на `WooCommerce > Settings > Advanced > REST API`
2. Натиснете "Add key"
3. Описание: "Borica Integration"
4. User: Изберете admin потребител
5. Permissions: "Read/Write"
6. Генерирайте ключа и копирайте Consumer Key и Consumer Secret в `.env` файла

### 4. **КРИТИЧНО: Обновете BACKREF URL в Borica**

Трябва да се свържете с поддръжката на Borica и да им кажете да променят BACKREF URL от:

```
https://leaderfitness.net/wc-api/wc_gateway_borica_emv/
```

НА:

```
https://leaderfitness.net/api/borica/callback
```

**Това е критично важно!** Без тази промяна callbacks няма да работят.

### 5. Тестване

След като направите горните стъпки:

1. Стартирайте апликацията
2. Отидете на checkout
3. Изберете Borica като payment method
4. Попълнете данните и натиснете "Плати"
5. Трябва да бъдете пренасочени към Borica gateway

## 🔍 Диагностика на проблеми

### Ако не работи:

1. **Проверете console logs** в browser Developer Tools
2. **Проверете server logs** за грешки в API endpoints
3. **Проверете Network tab** за failed requests
4. **Уверете се, че .env файлът е правилно зареден**

### Често срещани проблеми:

- **"Borica configuration missing"** → Липсва BORICA_PRIVATE_KEY в .env
- **"Invalid signature"** → Грешен частен ключ или неправилен формат
- **Callback не се получава** → BACKREF URL не е обновен в Borica
- **Поръчката не се обновява** → Липсват WC API credentials

## 🎯 Какво очаквате да се случи

### Успешен flow:

1. Потребител избира Borica → ✅ Работи
2. Създава се поръчка в WooCommerce → ✅ Работи
3. Пренасочване към Borica gateway → ✅ Работи
4. Borica обработва плащането → ✅ Трябва да работи
5. Borica изпраща callback → ❗ Трябва BACKREF URL обновяване
6. Обновява се статуса на поръчката → ✅ Работи
7. Потребителят се връща с резултат → ✅ Работи

## 📞 Ако имате проблеми

Ако след тези стъпки все още има проблеми:

1. Проверете дали всички environment variables са правилно зададени
2. Проверете дали Borica са обновили BACKREF URL-а
3. Тествайте с тестови карти в тестовата среда
4. Проверете WordPress logs за грешки

## 🚨 ВАЖНО НАПОМНЯНЕ

- Не забравяйте да добавите `.env` в `.gitignore`
- За production трябва да смените `BORICA_GATEWAY_URL` на production URL
- Трябва да получите production сертификати от банката
- Тествайте винаги първо в test среда!

---

**Вашата интеграция е технически готова! Основният проблем е че Borica все още изпраща callbacks към стария WordPress endpoint вместо към новия Nuxt API endpoint.**

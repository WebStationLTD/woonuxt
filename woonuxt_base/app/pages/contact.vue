<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero секция -->
    <!-- <div class="bg-gradient-to-br from-primary to-primary-dark"> -->
    <div class="bg-gray-800">
      <div class="container py-16 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{ $t('messages.general.contact') }}</h1>
        <p class="text-xl opacity-90">Свържете се с нас! Готови сме да отговорим на всичките ви въпроси и да ви помогнем.</p>
      </div>
    </div>

    <div class="container py-16">
      <!-- Контактна информация секция -->
      <div class="grid lg:grid-cols-4 gap-8 mb-16">
        <!-- Имейл -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:mail-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Имейл</h3>
          <p class="text-gray-600 mb-4">Изпратете ни имейл по всяко време</p>
          <a href="mailto:office@leaderfitness.net" class="text-primary hover:text-primary-dark font-medium"> office@leaderfitness.net </a>
        </div>

        <!-- Телефон -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:call-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Телефон</h3>
          <p class="text-gray-600 mb-4">Обадете ни се в работно време</p>
          <a href="tel:+359877277595" class="text-primary hover:text-primary-dark font-medium"> 0877 277 595 </a>
        </div>

        <!-- Viber -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:chatbubble-ellipses-outline" size="32" class="text-purple-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Viber</h3>
          <p class="text-gray-600 mb-4">Пишете ни директно</p>
          <a href="viber://chat?number=%2B359877277595" class="text-purple-600 hover:text-purple-700 font-medium"> 0877 277 595 </a>
        </div>

        <!-- Адрес -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:location-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Адрес</h3>
          <p class="text-gray-600 mb-4">Посетете ни в офиса</p>
          <p class="text-primary font-medium">
            гр. София 1303<br />
            бул. Христо Ботев № 67
          </p>
        </div>
      </div>

      <!-- Допълнителна информация секции -->
      <div class="grid lg:grid-cols-2 gap-8 mb-16">
        <!-- Работно време -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h3 class="text-2xl font-semibold mb-6 flex items-center gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="ion:time-outline" size="24" class="text-primary" />
            </div>
            Работно време
          </h3>
          <div class="space-y-3 text-gray-600">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="font-medium">Понеделник - Петък:</span>
              <span class="font-semibold text-primary">10:00 – 19:00 ч.</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="font-medium">Събота:</span>
              <span class="font-semibold text-primary">11:00 – 17:00 ч.</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="font-medium">Неделя:</span>
              <span class="font-semibold text-red-500">ПОЧИВЕН ДЕН</span>
            </div>
          </div>
        </div>

        <!-- Обслужване -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h3 class="text-2xl font-semibold mb-6 flex items-center gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="ion:headset-outline" size="24" class="text-primary" />
            </div>
            {{ $t('messages.general.customerService') }}
          </h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <Icon name="ion:checkmark-circle-outline" size="20" class="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-medium text-gray-900">Професионално обслужване</h4>
                <p class="text-sm text-gray-600">Нашият екип е готов да ви помогне</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="ion:checkmark-circle-outline" size="20" class="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-medium text-gray-900">Бърз отговор</h4>
                <p class="text-sm text-gray-600">Отговаряме в рамките на 24 часа</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="ion:checkmark-circle-outline" size="20" class="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 class="font-medium text-gray-900">Експертни съвети</h4>
                <p class="text-sm text-gray-600">Получете професионални препоръки</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Често задавани въпроси и социални мрежи -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Често задавани въпроси -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h3 class="text-2xl font-semibold mb-6 flex items-center gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="ion:help-circle-outline" size="24" class="text-primary" />
            </div>
            Често задавани въпроси
          </h3>
          <div class="space-y-6">
            <div class="border-l-4 border-primary pl-4">
              <h4 class="font-semibold text-gray-900 mb-2">Каково е времето за доставка?</h4>
              <p class="text-gray-600">Обикновено доставяме в рамките на 2-3 работни дни в цялата страна.</p>
            </div>
            <div class="border-l-4 border-primary pl-4">
              <h4 class="font-semibold text-gray-900 mb-2">Как мога да върна продукт?</h4>
              <p class="text-gray-600">Имате 14 дни от получаването да върнете продукта при неудовлетвореност.</p>
            </div>
            <div class="border-l-4 border-primary pl-4">
              <h4 class="font-semibold text-gray-900 mb-2">Предлагате ли гаранция?</h4>
              <p class="text-gray-600">Да, всички продукти имат минимум 2 години официална гаранция.</p>
            </div>
          </div>
        </div>

        <!-- Допълнителна информация -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h3 class="text-2xl font-semibold mb-6 flex items-center gap-3">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="ion:information-circle-outline" size="24" class="text-primary" />
            </div>
            Защо да изберете нас?
          </h3>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <Icon name="ion:star" size="20" class="text-yellow-500" />
              <span class="text-gray-700">Над 1000+ доволни клиенти</span>
            </div>
            <div class="flex items-center gap-3">
              <Icon name="ion:shield-checkmark" size="20" class="text-green-500" />
              <span class="text-gray-700">Сигурни плащания</span>
            </div>
            <div class="flex items-center gap-3">
              <Icon name="ion:rocket" size="20" class="text-blue-500" />
              <span class="text-gray-700">Бърза доставка</span>
            </div>
            <div class="flex items-center gap-3">
              <Icon name="ion:heart" size="20" class="text-red-500" />
              <span class="text-gray-700">Персонализирано обслужване</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Фирмена информация -->
      <div class="mb-16 mt-16">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="flex items-center justify-center gap-8 flex-wrap">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="ion:business-outline" size="24" class="text-primary" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900">Фирмена информация</h3>
            </div>
            <div class="flex items-center gap-6">
              <div class="bg-gray-50 rounded-lg px-4 py-2">
                <p class="font-semibold text-lg text-primary">"Лидерфитнес" ЕООД</p>
              </div>
              <div class="bg-gray-50 rounded-lg px-4 py-2">
                <span class="text-sm text-gray-600 mr-2">ЕИК:</span>
                <span class="font-medium text-gray-900">203659417</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Социални мрежи секция -->
      <div class="mb-16">
        <div class="text-center mb-12 mt-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Последвайте ни в социалните мрежи</h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Останете свързани с нас за последните новини, промоции и продукти. Вижте нашите последни постове и участвайте в нашата общност!
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Facebook -->
          <div class="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all duration-300">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="ion:logo-facebook" size="40" class="text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Facebook</h3>
            <p class="text-gray-600 mb-6">Харесайте нашата страница</p>
            <a
              href="https://www.facebook.com/www.leaderfitness.net/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium w-full">
              <Icon name="ion:logo-facebook" size="20" />
              <span>Харесайте ни</span>
            </a>
          </div>

          <!-- Instagram -->
          <div class="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all duration-300">
            <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="ion:logo-instagram" size="40" class="text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">Instagram</h3>
            <p class="text-gray-600 mb-6">Вижте нашите снимки и истории</p>
            <a
              href="https://www.instagram.com/liderfitness/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium w-full">
              <Icon name="ion:logo-instagram" size="20" />
              <span>Последвайте ни</span>
            </a>
          </div>

          <!-- TikTok -->
          <div class="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all duration-300">
            <div class="w-20 h-20 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="ion:musical-notes" size="40" class="text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">TikTok</h3>
            <p class="text-gray-600 mb-6">Гледайте нашите забавни видеа</p>
            <a
              href="https://www.tiktok.com/@leaderfitness"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium w-full">
              <Icon name="ion:musical-notes" size="20" />
              <span>Последвайте ни</span>
            </a>
          </div>

          <!-- YouTube -->
          <div class="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all duration-300">
            <div class="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="ion:logo-youtube" size="40" class="text-white" />
            </div>
            <h3 class="text-xl font-semibold mb-3">YouTube</h3>
            <p class="text-gray-600 mb-6">Абонирайте се за видео съдържание</p>
            <a
              href="https://www.youtube.com/@Leaderfitnes"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium w-full">
              <Icon name="ion:logo-youtube" size="20" />
              <span>Абонирайте се</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

// SEO meta
useSeoMeta({
  title: 'Контакти - Лидерфитнес ЕООД',
  description:
    'Свържете се с нас за всички ваши въпроси. Телефон: 0877 277 595, Имейл: office@leaderfitness.net, Адрес: гр. София 1303, бул. Христо Ботев № 67',
});
</script>

<style scoped>
/* Допълнителни стилове за по-добра анимация */
.transition-all {
  transition: all 0.3s ease;
}

/* Анимация за hover ефектите */
.hover\:shadow-xl:hover {
  transform: translateY(-2px);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>

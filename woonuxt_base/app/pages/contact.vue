<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero секция -->
    <!-- <div class="bg-gradient-to-br from-primary to-primary-dark"> -->
    <div class="bg-gray-800">
      <div class="container py-16 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{ $t('messages.general.contact') }}</h1>
        <p class="text-xl opacity-90 max-w-2xl mx-auto">Свържете се с нас! Готови сме да отговорим на всичките ви въпроси и да ви помогнем.</p>
      </div>
    </div>

    <div class="container py-16">
      <!-- Контактна информация секция -->
      <div class="grid lg:grid-cols-3 gap-8 mb-16">
        <!-- Имейл -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:mail-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Имейл</h3>
          <p class="text-gray-600 mb-4">Изпратете ни имейл по всяко време</p>
          <a href="mailto:info@example.bg" class="text-primary hover:text-primary-dark font-medium"> info@example.bg </a>
        </div>

        <!-- Телефон -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:call-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Телефон</h3>
          <p class="text-gray-600 mb-4">Обадете ни се в работно време</p>
          <a href="tel:+359888123456" class="text-primary hover:text-primary-dark font-medium"> +359 888 123 456 </a>
        </div>

        <!-- Адрес -->
        <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ion:location-outline" size="32" class="text-primary" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Адрес</h3>
          <p class="text-gray-600 mb-4">Посетете ни в офиса</p>
          <p class="text-primary font-medium">
            гр. София<br />
            ул. Примерна 123
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
              <span class="font-semibold text-primary">9:00 - 18:00</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="font-medium">Събота:</span>
              <span class="font-semibold text-primary">10:00 - 16:00</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="font-medium">Неделя:</span>
              <span class="font-semibold text-red-500">Затворено</span>
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

        <!-- Социални мрежи и допълнителна информация -->
        <div class="space-y-8">
          <!-- Социални мрежи -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-2xl font-semibold mb-6 flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Icon name="ion:logo-instagram" size="24" class="text-white" />
              </div>
              Следете ни
            </h3>
            <p class="text-gray-600 mb-6">Останете свързани с нас в социалните мрежи за последните новини, промоции и продукти.</p>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium">
              <Icon name="ion:logo-instagram" size="20" />
              <span>Последвайте ни в Instagram</span>
            </a>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

// SEO meta
useSeoMeta({
  title: 'Контакти - Свържете се с нас',
  description: 'Свържете се с нас за всички ваши въпроси. Телефон: +359 888 123 456, Имейл: info@example.bg, Адрес: гр. София, ул. Примерна 123',
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

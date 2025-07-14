<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero секция -->
    <div class="bg-gray-800">
      <div class="container py-16 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">За нас</h1>
        <p class="text-xl opacity-90">Водещ вносител и представител на спортно оборудване и фитнес уреди в България.</p>
      </div>
    </div>

    <div class="container py-16">
      <!-- Основна информация -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="prose prose-gray max-w-none">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">Лидерфитнес</h2>
            <p class="text-xl text-gray-600">Водещ вносител и представител на голямо разнообразие от бойна екипировка, фитнес уреди и аксесоари.</p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 mb-8">
            <!-- Опит -->
            <div class="bg-blue-50 rounded-lg p-6">
              <div class="flex items-center mb-4">
                <Icon name="ion:trophy" size="32" class="text-blue-600 mr-3" />
                <h3 class="text-2xl font-bold text-blue-800">12 години опит</h3>
              </div>
              <p class="text-blue-700">Вече 12 години се стремим да предложим най-доброто, което се предлага в световен мащаб.</p>
            </div>

            <!-- Експертиза -->
            <div class="bg-green-50 rounded-lg p-6">
              <div class="flex items-center mb-4">
                <Icon name="ion:people" size="32" class="text-green-600 mr-3" />
                <h3 class="text-2xl font-bold text-green-800">Експертен екип</h3>
              </div>
              <p class="text-green-700">Нашите служители са с дългогодишен опит в сферата на спорта и са винаги готови да ви съдействат.</p>
            </div>
          </div>

          <div class="mb-8">
            <p class="text-lg text-gray-700 mb-4">
              Те познават добре продуктовата гама и могат да предложат най-подходящия уред или аксесоар според нуждите на клиента.
            </p>
            <p class="text-lg text-gray-700 mb-4">
              Желанието на компанията е клиентът да остане удовлетворен, както от покупката, така и от самото пазаруване.
            </p>
          </div>
        </div>
      </div>

      <!-- Продуктова гама -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800 text-center">Нашата продуктова гама</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Фитнес уреди -->
          <div>
            <h3 class="text-xl font-bold mb-4 text-gray-700 flex items-center">
              <Icon name="ion:fitness" size="24" class="mr-2 text-red-600" />
              Фитнес уреди и аксесоари
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li>• Бягащи пътеки</li>
              <li>• Велоергометри</li>
              <li>• Комбинирани уреди</li>
              <li>• Кростренажори</li>
              <li>• Гребни тренажори</li>
              <li>• Дъмбели и лостове</li>
              <li>• Тежести и ръкохватки</li>
              <li>• Лежанки и пейки</li>
              <li>• Пудовки</li>
              <li>• Въжета за скачане</li>
              <li>• Ластици</li>
            </ul>
          </div>

          <!-- Бойни спортове -->
          <div>
            <h3 class="text-xl font-bold mb-4 text-gray-700 flex items-center">
              <Icon name="ion:shield" size="24" class="mr-2 text-blue-600" />
              Продукти за бойни спортове
            </h3>
            <ul class="space-y-2 text-gray-700">
              <li>• Боксови ръкавици</li>
              <li>• Протектори за зъби</li>
              <li>• Бинтове за бокс</li>
              <li>• Каски</li>
              <li>• Протектори за крака</li>
              <li>• Лапи</li>
              <li>• Обувки за бокс</li>
              <li>• Боксови чували и круши</li>
              <li>• ММА и граплинг ръкавици</li>
              <li>• Спортни сакове</li>
              <li>• Тренировъчни дрехи</li>
              <li>• Рашгарди и клинове</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Марки и брандове -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800 text-center">Представители на световни марки</h2>

        <div class="mb-6">
          <p class="text-lg text-gray-700 text-center mb-8">Лидерфитнес е вносител и представител на световно известни марки и брандове:</p>
        </div>

        <!-- Марки в grid layout -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-center">
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">VENUM</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Body Solid</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Amila Fitness</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Hayabusa Fightwear</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Leone 1947</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Super Pro 1978</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Twins</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Ringhorns</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">MVS in Motion</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Adidas</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Sole Fitness</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Endurance</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Evocardio Fitness</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Renegade</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Safejawz</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Spirit Fitness</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">UFC</h4>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <h4 class="font-bold text-gray-800">Xterra Fitness</h4>
          </div>
        </div>
      </div>

      <!-- Нашите предимства -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800 text-center">Защо да изберете нас?</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Голямо разнообразие</h3>
                <p class="text-gray-700">При нас ще намерите най-голямото разнообразие от спортно оборудване и фитнес уреди на българския пазар.</p>
              </div>
            </div>

            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Конкурентна цена</h3>
                <p class="text-gray-700">Предлагаме най-конкурентните цени на пазара без компромис с качеството на продуктите.</p>
              </div>
            </div>

            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Високо качество</h3>
                <p class="text-gray-700">Работим само с проверени производители и световно известни марки с доказано качество.</p>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Отлично обслужване</h3>
                <p class="text-gray-700">Нашият експертен екип е винаги готов да ви консултира и помогне при избора на подходящ продукт.</p>
              </div>
            </div>

            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Бърза доставка</h3>
                <p class="text-gray-700">Осигуряваме бърза и надеждна доставка до цялата страна, с безплатна доставка над 150 лв.</p>
              </div>
            </div>

            <div class="flex items-start">
              <Icon name="ion:checkmark-circle" size="24" class="text-green-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Гаранция</h3>
                <p class="text-gray-700">Всички продукти са с официална гаранция и възможност за сервизно обслужване.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Физически магазин -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800 text-center">Посетете нашия магазин</h2>

        <div class="bg-gray-50 rounded-lg p-6">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Информация за магазина -->
            <div>
              <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <Icon name="ion:storefront" size="24" class="mr-2 text-blue-600" />
                Физически магазин
              </h3>
              <div class="space-y-3 text-gray-700">
                <div class="flex items-start">
                  <Icon name="ion:location" size="20" class="text-red-600 mr-2 mt-1" />
                  <span><strong>Адрес:</strong> гр. София, бул. Христо Ботев №67</span>
                </div>
                <div class="flex items-start">
                  <Icon name="ion:call" size="20" class="text-green-600 mr-2 mt-1" />
                  <span><strong>Телефон:</strong> 0877 277 595</span>
                </div>
                <div class="flex items-start">
                  <Icon name="ion:mail" size="20" class="text-blue-600 mr-2 mt-1" />
                  <span><strong>Email:</strong> office@leaderfitness.net</span>
                </div>
              </div>
            </div>

            <!-- Работно време -->
            <div>
              <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <Icon name="ion:time" size="24" class="mr-2 text-green-600" />
                Работно време
              </h3>
              <div class="space-y-2 text-gray-700">
                <div class="flex justify-between">
                  <span>Понеделник – Петък:</span>
                  <strong>10:00 – 19:00 ч.</strong>
                </div>
                <div class="flex justify-between">
                  <span>Събота:</span>
                  <strong>11:00 – 17:00 ч.</strong>
                </div>
                <div class="flex justify-between">
                  <span>Неделя:</span>
                  <strong class="text-red-600">ПОЧИВЕН ДЕН</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-lg text-gray-700 mb-4">
              В магазинът ни на бул. Христо Ботев №67, гр. София ще откриете разнообразие от продукти, които можете да разгледате и тествате преди покупка.
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+359877277595"
                class="flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                <Icon name="ion:call" size="20" class="mr-2" />
                Позвънете ни
              </a>
              <a
                href="mailto:office@leaderfitness.net"
                class="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                <Icon name="ion:mail" size="20" class="mr-2" />
                Пишете ни
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { frontEndUrl } = useHelpers();

// SEO meta data
const pageTitle = 'За нас - Лидерфитнес ЕООД | 12 години опит във фитнес и бойни спортове';
const pageDescription =
  'Лидерфитнес е водещ вносител на спортно оборудване в България. 12 години опит, световни марки като VENUM, Body Solid, Adidas. Експертен екип и качествено обслужване.';
const canonicalUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/за-нас/`;

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  robots: 'index, follow',
});

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  meta: [{ name: 'keywords', content: 'за нас, лидерфитнес, leaderfitness, спортно оборудване, фитнес уреди, бойни спортове, venum, body solid, adidas' }],
});
</script>

<style scoped>
.prose {
  color: #374151;
  line-height: 1.75;
}

.transition-colors {
  transition: background-color 0.3s ease;
}

.hover\:bg-primary-dark:hover {
  background-color: #dc2626;
}

.hover\:bg-blue-700:hover {
  background-color: #1d4ed8;
}

.hover\:bg-gray-100:hover {
  background-color: #f3f4f6;
}
</style>

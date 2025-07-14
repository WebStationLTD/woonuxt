<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero секция -->
    <div class="bg-gray-800">
      <div class="container py-16 text-center text-white">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">Доставка</h1>
        <p class="text-xl opacity-90">Информация за доставка, цени и условия за получаване на поръчки.</p>
      </div>
    </div>

    <div class="container py-16">
      <!-- Основна информация за доставка -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Безплатна доставка -->
          <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <div class="flex items-center mb-4">
              <Icon name="ion:checkmark-circle" size="32" class="text-green-600 mr-3" />
              <h2 class="text-2xl font-bold text-green-800">БЕЗПЛАТНА ДОСТАВКА</h2>
            </div>
            <p class="text-green-700 mb-4">
              <strong>Доставката на поръчки над 150 лв. до адрес на получателят или до офис на куриерска фирма SPEEDY e БЕЗПЛАТНА!</strong>
            </p>
            <div class="text-sm text-green-600">
              <p>✓ До адрес на получателя</p>
              <p>✓ До офис на SPEEDY</p>
              <p>✓ Без значение населеното място</p>
            </div>
          </div>

          <!-- Платена доставка -->
          <div class="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div class="flex items-center mb-4">
              <Icon name="ion:card" size="32" class="text-blue-600 mr-3" />
              <h2 class="text-2xl font-bold text-blue-800">ПЛАТЕНА ДОСТАВКА</h2>
            </div>
            <div class="space-y-3 text-blue-700">
              <div class="flex justify-between">
                <span>До офис на SPEEDY:</span>
                <strong>8,00 лв.</strong>
              </div>
              <div class="flex justify-between">
                <span>До адрес на получателя:</span>
                <strong>9,00 лв.</strong>
              </div>
              <p class="text-sm text-blue-600 mt-4">* За поръчки под 150 лв.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Специални продукти -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="bg-red-50 rounded-lg p-6 border-2 border-red-200">
          <div class="flex items-start">
            <Icon name="ion:warning" size="32" class="text-red-600 mr-4 mt-1" />
            <div>
              <h2 class="text-2xl font-bold text-red-800 mb-4">ВАЖНО! Доставка за сметка на клиента</h2>
              <p class="text-red-700 mb-4">
                <strong>Доставката е за СМЕТКА на Клиента за следните продукти, независимо от стойността:</strong>
              </p>
              <div class="grid md:grid-cols-2 gap-4">
                <ul class="space-y-2 text-red-700">
                  <li>• Тежести</li>
                  <li>• Ръкохватки</li>
                  <li>• Гири</li>
                  <li>• Дъмбели</li>
                </ul>
                <ul class="space-y-2 text-red-700">
                  <li>• Пудовки</li>
                  <li>• Медицински топки</li>
                  <li>• Тренировъчна торба</li>
                  <li>• Лостове</li>
                  <li>• Боксови чували</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Продукти с безплатна доставка -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200">
          <div class="flex items-center mb-4">
            <Icon name="ion:gift" size="32" class="text-green-600 mr-3" />
            <h2 class="text-2xl font-bold text-green-800">Продукти с винаги безплатна доставка</h2>
          </div>
          <p class="text-green-700 mb-4">
            <strong>БЕЗПЛАТНА Е ДОСТАВКАТА</strong> на всички продукти обозначени със знака за безплатна доставка
            <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded ml-2"> 📦 Безплатна Доставка </span>,
            поръчани online на www.leaderfitness.net
          </p>
        </div>
      </div>

      <!-- Условия за доставка -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800">Условия за доставка</h2>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Сроковете -->
          <div>
            <h3 class="text-xl font-bold mb-4 text-gray-700 flex items-center">
              <Icon name="ion:time" size="24" class="mr-2 text-blue-600" />
              Срокове за доставка
            </h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <Icon name="ion:checkmark-circle" size="20" class="text-green-600 mr-2 mt-1" />
                <span>Доставката се осъществява до адрес или офис на фирма SPEEDY</span>
              </li>
              <li class="flex items-start">
                <Icon name="ion:checkmark-circle" size="20" class="text-green-600 mr-2 mt-1" />
                <span>За два дни до по-малки населени места</span>
              </li>
              <li class="flex items-start">
                <Icon name="ion:information-circle" size="20" class="text-blue-600 mr-2 mt-1" />
                <span>През почивни и празнични дни куриерите не работят</span>
              </li>
            </ul>
          </div>

          <!-- Плащания -->
          <div>
            <h3 class="text-xl font-bold mb-4 text-gray-700 flex items-center">
              <Icon name="ion:card" size="24" class="mr-2 text-green-600" />
              Начини на плащане
            </h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <Icon name="ion:cash" size="20" class="text-green-600 mr-2 mt-1" />
                <span>Пратки с опция наложен платеж се заплащат на куриерът в <strong>БРОЙ</strong></span>
              </li>
              <li class="flex items-start">
                <Icon name="ion:card" size="20" class="text-blue-600 mr-2 mt-1" />
                <span>Онлайн плащане с карта</span>
              </li>
              <li class="flex items-start">
                <Icon name="ion:card" size="20" class="text-blue-600 mr-2 mt-1" />
                <span>Банков превод</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Важни бележки -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold mb-6 text-gray-800">Важни бележки</h2>

        <div class="space-y-6">
          <!-- Невзети пратки -->
          <div class="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400">
            <div class="flex items-start">
              <Icon name="ion:warning" size="24" class="text-yellow-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-yellow-800 mb-2">Невзети пратки</h3>
                <p class="text-yellow-700">
                  Пратки изпратени или пренасочени до офис на куриерска фирма Speedy, които не са взети от клиента,
                  <strong>се връщат обратно на Четвъртия календарен ден!</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Връщане на продукти -->
          <div class="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
            <div class="flex items-start">
              <Icon name="ion:return-down-back" size="24" class="text-blue-600 mr-3 mt-1" />
              <div>
                <h3 class="text-lg font-bold text-blue-800 mb-2">Връщане или замяна на продукт</h3>
                <p class="text-blue-700">
                  За връщане или замяна на продукт, моля приложете
                  <strong>БЛАНКА ЗА ВРЪЩАНЕ</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Контакти за проблеми -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-6 text-gray-800">Нужна ли Ви е помощ?</h2>
          <div class="bg-gray-50 rounded-lg p-6">
            <p class="text-lg text-gray-700 mb-4">При проблеми с получаването или забележки и рекламации, моля, свържете се с нас:</p>
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a href="tel:+359877277595" class="flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                <Icon name="ion:call" size="20" class="mr-2" />
                0877 277 595
              </a>
              <a
                href="mailto:office@leaderfitness.net"
                class="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                <Icon name="ion:mail" size="20" class="mr-2" />
                office@leaderfitness.net
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
const pageTitle = 'Доставка - Условия, цени и срокове | Лидерфитнес ЕООД';
const pageDescription =
  'Информация за доставка на спортно оборудване от Лидерфитнес. Безплатна доставка над 150 лв. Цени, срокове и условия за получаване на поръчки.';
const canonicalUrl = `${frontEndUrl || 'https://woonuxt-ten.vercel.app'}/доставка/`;

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
  meta: [{ name: 'keywords', content: 'доставка, безплатна доставка, speedy, цени доставка, лидерфитнес, leaderfitness, куриер' }],
});
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.3s ease;
}

.hover\:bg-primary-dark:hover {
  background-color: #dc2626;
}

.hover\:bg-blue-700:hover {
  background-color: #1d4ed8;
}
</style>

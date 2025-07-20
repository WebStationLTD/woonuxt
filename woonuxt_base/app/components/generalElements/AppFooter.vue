<script setup lang="ts">
const { wooNuxtVersionInfo } = useHelpers();
const { wishlistLink } = useAuth();

// Добавяме структурирани данни чрез useHead()
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Лидерфитнес',
        description: 'Водещ вносител и представител на голямо разнообразие от бойна екипировка, фитнес уреди и аксесоари',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'бул. Христо Ботев 67',
          addressLocality: 'София',
          postalCode: '1303',
          addressCountry: 'BG',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+359877277595',
          email: 'office@leaderfitness.net',
          contactType: 'customer service',
        },
        sameAs: ['https://www.facebook.com/www.leaderfitness.net/', 'https://www.instagram.com/liderfitness/'],
      }),
    },
  ],
});
</script>

<template>
  <footer class="bg-gray-900 text-white order-last" itemscope itemtype="https://schema.org/Organization">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Лява колона: Лого и описание -->
        <div class="lg:col-span-4">
          <div class="mb-6">
            <Logo />
          </div>
          <div class="text-gray-300 text-sm leading-relaxed">
            <p itemprop="description">Лидерфитнес е водещ вносител и представител на голямо разнообразие от бойна екипировка, фитнес уреди и аксесоари.</p>
          </div>
        </div>

        <!-- Дясна част: 4 колони с информация -->
        <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Колона 1: Полезно -->
          <div>
            <h3 class="text-white font-semibold text-lg mb-4">Полезно</h3>
            <nav class="space-y-2" aria-label="Полезни линкове">
              <ul class="text-sm space-y-2">
                <li><NuxtLink to="/" class="text-gray-300 hover:text-white transition-colors">Начало</NuxtLink></li>
                <li><NuxtLink to="/общи-условия/" class="text-gray-300 hover:text-white transition-colors">Общи условия</NuxtLink></li>
                <li>
                  <NuxtLink to="/политика-за-поверителност-и-защита-на/" class="text-gray-300 hover:text-white transition-colors"
                    >Политика за поверителност</NuxtLink
                  >
                </li>
                <li><NuxtLink to="/доставка/" class="text-gray-300 hover:text-white transition-colors">Доставка</NuxtLink></li>
                <li>
                  <a href="/pdfs/return-policy.pdf" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white transition-colors"
                    >Условия за връщане</a
                  >
                </li>
                <li><NuxtLink to="/за-нас/" class="text-gray-300 hover:text-white transition-colors">За нас</NuxtLink></li>
                <li><a href="/example/facilities" class="text-gray-300 hover:text-white transition-colors">Оборудвани обекти</a></li>
                <li><NuxtLink to="/contact" class="text-gray-300 hover:text-white transition-colors">Контакти</NuxtLink></li>
                <li><a href="/example/articles" class="text-gray-300 hover:text-white transition-colors">Статии</a></li>
              </ul>
            </nav>
          </div>

          <!-- Колона 2: Топ категории -->
          <div>
            <h3 class="text-white font-semibold text-lg mb-4">Топ категории</h3>
            <nav class="space-y-2" aria-label="Основни категории продукти">
              <ul class="text-sm space-y-2">
                <li><a href="/produkt-kategoriya/бокс" class="text-gray-300 hover:text-white transition-colors">Бокс</a></li>
                <li><a href="/produkt-kategoriya/бокс/боксов-чувал" class="text-gray-300 hover:text-white transition-colors">Боксови чували</a></li>
                <li><a href="/produkt-kategoriya/бокс/боксови-ръкавици" class="text-gray-300 hover:text-white transition-colors">Боксови ръкавици</a></li>
                <li><a href="/produkt-kategoriya/дрехи" class="text-gray-300 hover:text-white transition-colors">Дрехи</a></li>
                <li><a href="/produkt-kategoriya/дрехи/детски-дрехи" class="text-gray-300 hover:text-white transition-colors">Детски дрехи</a></li>
                <li><a href="/produkt-kategoriya/дрехи/суичъри" class="text-gray-300 hover:text-white transition-colors">Суичъри</a></li>
                <li>
                  <a href="/produkt-kategoriya/фитнес-оборудване-и-аксесоари" class="text-gray-300 hover:text-white transition-colors"
                    >Фитнес оборудване и аксесоари</a
                  >
                </li>
                <li>
                  <a href="/produkt-kategoriya/фитнес-оборудване-и-аксесоари/бягаща-пътека" class="text-gray-300 hover:text-white transition-colors"
                    >Бягащи пътеки</a
                  >
                </li>
                <li>
                  <a href="/produkt-kategoriya/фитнес-оборудване-и-аксесоари/велоергометри" class="text-gray-300 hover:text-white transition-colors"
                    >Велоергометри</a
                  >
                </li>
              </ul>
            </nav>
          </div>

          <!-- Колона 3: Контакти -->
          <div>
            <h3 class="text-white font-semibold text-lg mb-4">Контакти</h3>
            <div class="space-y-4 text-sm">
              <!-- Адрес -->
              <div class="flex items-start space-x-3" itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
                <Icon name="ion:location-outline" size="20" class="text-gray-300 mt-0.5 flex-shrink-0" />
                <div>
                  <span itemprop="streetAddress">бул. Христо Ботев 67</span><br />
                  <span itemprop="postalCode">1303</span> <span itemprop="addressLocality">София</span>
                </div>
              </div>

              <!-- Телефон -->
              <div class="flex items-center space-x-3">
                <Icon name="ion:call-outline" size="20" class="text-gray-300 flex-shrink-0" />
                <a href="tel:+359877277595" class="text-gray-300 hover:text-white transition-colors" itemprop="telephone"> 0877 277 595 </a>
              </div>

              <!-- Имейл -->
              <div class="flex items-center space-x-3">
                <Icon name="ion:mail-outline" size="20" class="text-gray-300 flex-shrink-0" />
                <a href="mailto:office@leaderfitness.net" class="text-gray-300 hover:text-white transition-colors" itemprop="email">
                  office@leaderfitness.net
                </a>
              </div>

              <!-- Социални мрежи -->
              <div class="flex items-center space-x-4 pt-2">
                <a
                  href="https://www.facebook.com/www.leaderfitness.net/"
                  class="text-gray-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook профил">
                  <Icon name="ion:logo-facebook" size="24" />
                </a>
                <a
                  href="https://www.instagram.com/liderfitness/"
                  class="text-gray-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram профил">
                  <Icon name="ion:logo-instagram" size="24" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Долна част с копирайт -->
      <div class="border-t border-gray-700 pt-6 mt-12">
        <div class="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div class="mb-4 md:mb-0">
            <p>© 2025 Лидерфитнес. Всички права запазени.</p>
          </div>
          <div class="text-xs">
            <span>Powered by </span>
            <a href="https://webstation.bg/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors font-medium"> WebStation™ </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="postcss">
a {
  @apply hover:underline;
}

/* Премахваме подчертаването за социалните иконки */
a[aria-label] {
  @apply hover:no-underline;
}
</style>

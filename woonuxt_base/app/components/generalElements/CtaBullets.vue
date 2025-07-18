<script setup>
const boxingBenefits = [
  'Висококачествени ръкавици и протектори',
  'Професионални боксови чували и стойки',
  'Оригинални екипировки от водещи марки',
  'Сертифицирани продукти за всички нива',
  'Бърза доставка и гаранция за качество',
];

const fitnessBenefits = [
  'Модерни уреди за домашни фитнес зали',
  'Професионални тежести и хантели',
  'Кардио машини с най-нови технологии',
  'Функционални аксесоари за тренировки',
  'Консултации за избор на оборудване',
];

const clothingBenefits = [
  'Дишащи материали за максимален комфорт',
  'Стилни дизайни за тренировки и ежедневие',
  'Размери за всяка фигура и възраст',
  'Устойчиви тъкани за дълготрайна употреба',
  'Специални промоции и сезонни намаления',
];

// Зареждаме данните за категориите
const { data: categoriesData } = await useAsyncGql('getCategoryImages', {
  slugs: ['бокс', 'фитнес-оборудване-и-аксесоари', 'дрехи'],
});

// Функция за получаване на снимка по slug на категория
const getCategoryImage = (slug) => {
  const category = categoriesData.value?.productCategories?.nodes?.find((cat) => cat.slug === slug);
  return category?.image?.sourceUrl || '/images/placeholder.jpg';
};

// Функция за получаване на alt текст по slug на категория
const getCategoryAltText = (slug) => {
  const category = categoriesData.value?.productCategories?.nodes?.find((cat) => cat.slug === slug);
  return category?.image?.altText || category?.name || 'Категория снимка';
};
</script>

<template>
  <!-- СЕКЦИЯ 1: БОКС (ТЪМНА) -->
  <div class="bg-gray-800 py-12 sm:py-12 overflow-hidden">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-12 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-12 xl:gap-x-20 xl:px-20">
          <div class="relative h-96 w-full flex-none rounded-2xl shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm">
            <NuxtImg
              :alt="getCategoryAltText('бокс')"
              :src="getCategoryImage('бокс')"
              class="absolute inset-0 w-full h-full object-cover rounded-2xl"
              sizes="sm:100vw lg:400px"
              width="400"
              height="400" />
          </div>
          <div class="w-full flex-auto">
            <h2 class="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">Бокс</h2>
            <p class="mt-6 text-lg/8 text-pretty text-gray-300">
              Открийте професионалния свят на бокса с нашата експертна колекция от висококачествени ръкавици, боксови чували, протектори и аксесоари. Всички
              продукти са подбрани от водещи световни марки за максимална безопасност и ефективност във вашите тренировки.
            </p>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-white sm:grid-cols-2">
              <li v-for="benefit in boxingBenefits" :key="benefit" class="flex gap-x-3">
                <span class="h-7 w-5 flex-none text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="h-7 w-5">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clip-rule="evenodd" />
                  </svg>
                </span>
                {{ benefit }}
              </li>
            </ul>
            <div class="mt-10 flex">
              <NuxtLink to="/produkt-kategoriya/бокс/" class="text-sm/6 font-normal text-[#ffffff] hover:text-gray-300">
                Разгледайте всички боксови продукти <span aria-hidden="true">&rarr;</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        class="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        style="transform: translateX(-950px)">
        <div
          style="
            clip-path: polygon(
              73.6% 51.7%,
              91.7% 11.8%,
              100% 46.4%,
              97.4% 82.2%,
              92.5% 84.9%,
              75.7% 64%,
              55.3% 47.5%,
              46.5% 49.4%,
              45% 62.9%,
              50.3% 87.2%,
              21.3% 64.1%,
              0.1% 100%,
              5.4% 51.1%,
              21.4% 63.9%,
              58.9% 0.2%,
              73.6% 51.7%
            );
          "
          class="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#9c0100] to-[#9c0100] opacity-60" />
      </div>
    </div>
  </div>

  <!-- СЕКЦИЯ 2: ФИТНЕС ОБОРУДВАНЕ И АКСЕСОАРИ (СВЕТЛА) -->
  <div class="bg-gray-50 py-12 sm:py-12 overflow-hidden">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white px-6 py-12 ring-1 ring-gray-200 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-12 xl:gap-x-20 xl:px-20 shadow-xl">
          <div class="relative h-96 w-full flex-none rounded-2xl shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm">
            <NuxtImg
              :alt="getCategoryAltText('фитнес-оборудване-и-аксесоари')"
              :src="getCategoryImage('фитнес-оборудване-и-аксесоари')"
              class="absolute inset-0 w-full h-full object-cover rounded-2xl"
              sizes="sm:100vw lg:400px"
              width="400"
              height="400" />
          </div>
          <div class="w-full flex-auto">
            <h2 class="text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">Фитнес Оборудване и Аксесоари</h2>
            <p class="mt-6 text-lg/8 text-pretty text-gray-600">
              Изградете перфектната фитнес зала с нашето модерно оборудване. От професионални кардио машини до функционални тежести и иновативни аксесоари -
              всичко необходимо за постигане на вашите фитнес цели на едно място.
            </p>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-gray-700 sm:grid-cols-2">
              <li v-for="benefit in fitnessBenefits" :key="benefit" class="flex gap-x-3">
                <span class="h-7 w-5 flex-none text-[#9c0100]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="h-7 w-5">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clip-rule="evenodd" />
                  </svg>
                </span>
                {{ benefit }}
              </li>
            </ul>
            <div class="mt-10 flex">
              <NuxtLink to="/produkt-kategoriya/фитнес-оборудване-и-аксесоари/" class="text-sm/6 font-normal text-[#9c0100] hover:text-gray-900">
                Разгледайте всички фитнес продукти <span aria-hidden="true">&rarr;</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        class="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        style="transform: translateX(950px)">
        <div
          style="
            clip-path: polygon(
              73.6% 51.7%,
              91.7% 11.8%,
              100% 46.4%,
              97.4% 82.2%,
              92.5% 84.9%,
              75.7% 64%,
              55.3% 47.5%,
              46.5% 49.4%,
              45% 62.9%,
              50.3% 87.2%,
              21.3% 64.1%,
              0.1% 100%,
              5.4% 51.1%,
              21.4% 63.9%,
              58.9% 0.2%,
              73.6% 51.7%
            );
          "
          class="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#9c0100] to-[#9c0100] opacity-25" />
      </div>
    </div>
  </div>

  <!-- СЕКЦИЯ 3: ДРЕХИ (ТЪМНА) -->
  <div class="bg-gray-800 py-12 sm:py-12 overflow-hidden">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-12 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-12 xl:gap-x-20 xl:px-20">
          <div class="relative h-96 w-full flex-none rounded-2xl shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm">
            <NuxtImg
              :alt="getCategoryAltText('дрехи')"
              :src="getCategoryImage('дрехи')"
              class="absolute inset-0 w-full h-full object-cover rounded-2xl"
              sizes="sm:100vw lg:400px"
              width="400"
              height="400" />
          </div>
          <div class="w-full flex-auto">
            <h2 class="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">Дрехи</h2>
            <p class="mt-6 text-lg/8 text-pretty text-gray-300">
              Облечете се стилно и функционално с нашата премиум колекция спортни дрехи. Съчетаваме последните модни тенденции с високо качество и комфорт, за
              да изглеждате и се чувствате перфектно по време на тренировки и в ежедневието.
            </p>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-white sm:grid-cols-2">
              <li v-for="benefit in clothingBenefits" :key="benefit" class="flex gap-x-3">
                <span class="h-7 w-5 flex-none text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="h-7 w-5">
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clip-rule="evenodd" />
                  </svg>
                </span>
                {{ benefit }}
              </li>
            </ul>
            <div class="mt-10 flex">
              <NuxtLink to="/produkt-kategoriya/дрехи/" class="text-sm/6 font-normal text-[#ffffff] hover:text-gray-300">
                Разгледайте всички спортни дрехи <span aria-hidden="true">&rarr;</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        class="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        style="transform: translateX(-950px)">
        <div
          style="
            clip-path: polygon(
              73.6% 51.7%,
              91.7% 11.8%,
              100% 46.4%,
              97.4% 82.2%,
              92.5% 84.9%,
              75.7% 64%,
              55.3% 47.5%,
              46.5% 49.4%,
              45% 62.9%,
              50.3% 87.2%,
              21.3% 64.1%,
              0.1% 100%,
              5.4% 51.1%,
              21.4% 63.9%,
              58.9% 0.2%,
              73.6% 51.7%
            );
          "
          class="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#9c0100] to-[#9c0100] opacity-60" />
      </div>
    </div>
  </div>
</template>

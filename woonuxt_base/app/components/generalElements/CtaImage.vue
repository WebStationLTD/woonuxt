<script setup>
// Компонент, адаптиран от ctaImage.js
</script>

<template>
  <div class="relative bg-gray-800">
    <div class="relative h-80 overflow-hidden bg-indigo-600 md:absolute md:left-0 md:h-full md:w-1/3 lg:w-1/2">
      <NuxtImg
        alt="Leaderfitness.bg - Професионални фитнес уреди и аксесоари"
        src="https://leaderfitness.admin-panels.com/wp-content/uploads/2025/06/shop-leaderfitness.jpg"
        class="absolute inset-0 h-full w-full object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        width="800"
        height="600" />
      <svg viewBox="0 0 926 676" aria-hidden="true" class="absolute -bottom-24 left-24 w-[57.875rem] transform-gpu blur-[118px]">
        <path
          d="m254.325 516.708-90.89 158.331L0 436.427l254.325 80.281 163.691-285.15c1.048 131.759 36.144 345.144 168.149 144.613C751.171 125.508 707.17-93.823 826.603 41.15c95.546 107.978 104.766 294.048 97.432 373.585L685.481 297.694l16.974 360.474-448.13-141.46Z"
          fill="url(#60c3c621-93e0-4a09-a0e6-4c228a0116d8)"
          fill-opacity=".4" />
        <defs>
          <linearGradient id="60c3c621-93e0-4a09-a0e6-4c228a0116d8" x1="926.392" x2="-109.635" y1=".176" y2="321.024" gradientUnits="userSpaceOnUse">
            <stop stop-color="#776FFF" />
            <stop offset="1" stop-color="#FF4694" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="relative mx-auto max-w-7xl py-12 sm:py-12 lg:px-8 lg:py-12">
      <div class="pr-6 pl-6 md:ml-auto md:w-2/3 md:pl-16 lg:w-1/2 lg:pr-0 lg:pl-24 xl:pl-32">
        <h2 class="text-xl font-semibold text-[#ffffff]">Leaderfitness.bg</h2>
        <p class="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Професионални фитнес уреди и аксесоари</p>
        <p class="mt-6 text-base/7 text-gray-300">
          В магазинът ни на бул. Христо Ботев №67, гр. София ще откриете и различни продукти за бойни спортове – Боксови ръкавици, Протектори за зъби, Бинтове
          за бокс, Каски, Протектори за крака, Лапи, Обувки за Бокс, Боксови чували и круши, ММА и граплинг ръкавици, спортни сакове, Тренировъчни шорти,
          тениски, потници, рашгарди, клинове, панталони и суичъри.
        </p>
        <p class="mt-6 text-base/7 text-gray-300">
          Лидерфитнес е вносител и представител на световно известни марки и брандове: VENUM, Body Solid, Amila Fitness, Hayabusa Fightwear, Leone 1947, Super
          Pro 1978, Twins, Ringhorns, MVS in Motion, Adidas, Sole Fitness, Endurance, Evocardio Fitness, Renegade, Safejawz, Spirit Fitness, UFC, Xterra
          Fitness.
        </p>
        <div class="mt-8">
          <NuxtLink
            to="/magazin"
            class="inline-flex rounded-md bg-[#9c0100] px-3.5 py-2.5 text-sm font-semibold text-white hover:text-black shadow-xs hover:bg-[#ebedeb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Пазарувайте онлайн
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

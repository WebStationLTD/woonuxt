<script setup>
// Компонент, адаптиран от ctaQuality.js
</script>

<template>
  <div class="relative isolate overflow-hidden bg-gray-800">
    <div class="px-6 py-12 sm:px-6 sm:py-12 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">Качествени продукти от Leaderfitness.bg</h2>
        <p class="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-300">
          Вече над 16 години се стремим да предложим най-доброто, което се предлага в световен мащаб.
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <NuxtLink
            to="/magazin"
            class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Всички продукти
          </NuxtLink>
          <NuxtLink to="/contact" class="text-sm/6 font-semibold text-white"> Контакти <span aria-hidden="true">→</span> </NuxtLink>
        </div>
      </div>
    </div>
    <svg
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      class="absolute -top-1/4 left-1/2 -z-10 size-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]">
      <circle r="512" cx="512" cy="512" fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fill-opacity="0.9" />
      <defs>
        <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
          <stop stop-color="#9c0100" />
          <stop offset="1" stop-color="#9c0100" />
        </radialGradient>
      </defs>
    </svg>
  </div>
</template>

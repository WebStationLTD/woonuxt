<script setup>
const benefits = [
  'Competitive salaries',
  'Flexible work hours',
  '30 days of paid vacation',
  'Annual team retreats',
  'Benefits for you and your family',
  'A great work environment',
];
</script>

<template>
  <div class="bg-gray-800 py-12 sm:py-12 overflow-hidden">
    <div class="relative isolate">
      <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div
          class="mx-auto flex max-w-2xl flex-col gap-16 bg-white/5 px-6 py-12 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-12 xl:gap-x-20 xl:px-20">
          <div class="relative h-96 w-full flex-none rounded-2xl shadow-xl lg:aspect-square lg:h-auto lg:max-w-sm">
            <NuxtImg
              alt="Asian SPA продукти"
              src="https://nardis.bg/wp-content/uploads/webimage-60C17F8B-F56E-4A71-96CDAA4CBEBA9F9F.png"
              class="absolute inset-0 w-full h-full object-cover rounded-2xl"
              sizes="sm:100vw lg:400px"
              width="400"
              height="400" />
          </div>
          <div class="w-full flex-auto">
            <h2 class="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">Lorem ipsum</h2>
            <p class="mt-6 text-lg/8 text-pretty text-gray-300">
              Lorem ipsum dolor sit amet consect adipisicing elit. Possimus magnam voluptatum cupiditate veritatis in accusamus quisquam.
            </p>
            <ul role="list" class="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base/7 text-white sm:grid-cols-2">
              <li v-for="benefit in benefits" :key="benefit" class="flex gap-x-3">
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
              <NuxtLink to="#" class="text-sm/6 font-normal text-[#ffffff] hover:text-black">
                Вижте всички продукти от Lorem ipsum <span aria-hidden="true">&rarr;</span>
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
          class="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#129160] to-[#129160] opacity-60" />
      </div>
    </div>
  </div>
</template>

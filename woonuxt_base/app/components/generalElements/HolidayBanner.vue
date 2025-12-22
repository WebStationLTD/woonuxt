<template>
  <div class="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white py-1.5 md:py-2 shadow-lg overflow-hidden">
    <div class="flex items-center gap-3">
      <div class="marquee-container">
        <div class="marquee-content">
          <span class="marquee-item flex items-center gap-3 whitespace-nowrap">
            <span class="text-2xl">👉</span>
            <span class="text-sm md:text-base font-medium">
              <span class="font-bold">Поръчките, направени след 22.12.2025 г., ще бъдат изпратени на 05.01.2026 г.</span>
              <span class="ml-2 opacity-90">Благодарим за разбирането!</span>
            </span>
          </span>
          <span class="marquee-item flex items-center gap-3 whitespace-nowrap">
            <span class="text-2xl">👉</span>
            <span class="text-sm md:text-base font-medium">
              <span class="font-bold">Поръчките, направени след 22.12.2025 г., ще бъдат изпратени на 05.01.2026 г.</span>
              <span class="ml-2 opacity-90">Благодарим за разбирането!</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee-container {
  width: 100%;
  overflow: hidden;
}

.marquee-content {
  display: flex;
  animation: scroll 20s linear infinite;
}

.marquee-item {
  padding-right: 100px;
  display: inline-flex;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* Паузира скролването при hover */
.marquee-content:hover {
  animation-play-state: paused;
}
</style>


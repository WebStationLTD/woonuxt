<script setup lang="ts">
import { AtSymbolIcon, PhoneIcon, MapPinIcon } from '@heroicons/vue/24/outline';
</script>

<template>
  <div class="w-full bg-gray-800 text-gray-700 border-b border-gray-200 hidden lg:block">
    <div class="mx-auto px-4">
      <div class="flex h-8 items-center justify-between">
        <!-- Лява част: Имейл и телефон -->
        <div class="flex items-center">
          <!-- Имейл -->
          <div class="flex items-center text-sm font-medium">
            <AtSymbolIcon class="mr-1.5 h-4 w-4 text-white" />
            <a href="mailto:office@leaderfitness.net" class="text-white hover:text-white transition-colors">office@leaderfitness.net</a>
          </div>

          <!-- По-тъмен вертикален разделител -->
          <div class="h-3.5 mx-4 w-px bg-white"></div>

          <!-- Телефон -->
          <div class="flex items-center text-sm font-medium">
            <PhoneIcon class="mr-1.5 h-4 w-4 text-white" />
            <a href="tel:+359877277595" class="text-white hover:text-white transition-colors"> +359 877 277 595 </a>
          </div>
        </div>

        <!-- Дясна част: Адрес и социални мрежи -->
        <div class="flex items-center">
          <!-- Адрес -->
          <div class="flex items-center text-sm font-medium">
            <MapPinIcon class="mr-1.5 h-4 w-4 text-white" />
            <span class="text-white">бул.Христо Ботев № 67 гр.София</span>
          </div>

          <!-- По-тъмен вертикален разделител -->
          <div class="h-3.5 mx-4 w-px bg-white"></div>

          <!-- Instagram линк -->
          <a
            href="https://www.instagram.com/liderfitness/"
            class="flex items-center text-sm font-medium text-white hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer">
            <svg fill="currentColor" viewBox="0 0 24 24" class="h-4 w-4">
              <path
                fill-rule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                clip-rule="evenodd" />
            </svg>
          </a>

          <!-- Вертикален разделител -->
          <div class="h-3.5 mx-4 w-px bg-white"></div>

          <!-- Facebook линк -->
          <a
            href="https://www.facebook.com/www.leaderfitness.net/"
            class="flex items-center text-sm font-medium text-white hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer">
            <svg fill="currentColor" viewBox="0 0 24 24" class="h-4 w-4">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

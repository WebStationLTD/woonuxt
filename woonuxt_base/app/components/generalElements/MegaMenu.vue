<template>
  <Popover v-slot="{ open }" class="static lg:relative isolate z-50">
    <PopoverButton class="inline-flex items-center gap-x-1 text-base font-semibold text-gray-500 hover:text-primary focus:outline-none">
      Магазин
      <ChevronDownIcon :class="['h-6 w-6 transition-transform duration-300', open ? 'rotate-180 transform' : '']" aria-hidden="true" />
    </PopoverButton>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <PopoverPanel class="mega-menu-panel">
        <div class="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-y-10 py-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
              <div>
                <h3 class="text-base font-medium text-gray-500">Ангажиране</h3>
                <div class="mt-5">
                  <div class="space-y-3">
                    <a
                      v-for="item in engagement"
                      :key="item.name"
                      :href="item.href"
                      class="flex items-center gap-x-3 py-1 text-base font-semibold text-gray-900 hover:text-primary transition">
                      <component :is="item.icon" class="h-6 w-6 flex-none text-gray-400" aria-hidden="true" />
                      {{ item.name }}
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 class="text-base font-medium text-gray-500">Ресурси</h3>
                <div class="mt-5">
                  <div class="space-y-3">
                    <a
                      v-for="item in resources"
                      :key="item.name"
                      :href="item.href"
                      class="flex items-center gap-x-3 py-1 text-base font-semibold text-gray-900 hover:text-primary transition">
                      <component :is="item.icon" class="h-6 w-6 flex-none text-gray-400" aria-hidden="true" />
                      {{ item.name }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <h3 class="sr-only">Последни публикации</h3>
              <article v-for="post in recentPosts" :key="post.id" class="relative flex flex-col overflow-hidden rounded-lg">
                <div class="relative flex-shrink-0">
                  <img class="h-40 w-full object-cover" :src="post.imageUrl" alt="" />
                  <div class="absolute inset-0 rounded-lg ring-1 ring-gray-900/10 ring-inset" />
                </div>
                <div class="flex flex-1 flex-col justify-between p-4">
                  <div class="flex items-center gap-x-2 text-sm">
                    <time :datetime="post.datetime" class="text-gray-500">{{ post.date }}</time>
                    <span class="relative z-10 rounded-full bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600">{{ post.category.title }}</span>
                  </div>
                  <h4 class="mt-2 text-base font-semibold text-gray-900">
                    <a :href="post.href">
                      <span class="absolute inset-0" />
                      {{ post.title }}
                    </a>
                  </h4>
                </div>
              </article>
            </div>
          </div>
          <div class="lg:hidden border-t border-gray-200 py-3 px-4 text-center">
            <PopoverButton class="inline-block rounded-md py-2 px-4 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none">
              Затвори
              <ChevronDownIcon class="inline-block h-5 w-5 rotate-180 transform" aria-hidden="true" />
            </PopoverButton>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { ChevronDownIcon } from '@heroicons/vue/20/solid';
import {
  BookOpenIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/vue/24/outline';

const engagement = [
  { name: 'За нас', href: '#', icon: InformationCircleIcon },
  { name: 'Клиенти', href: '#', icon: UsersIcon },
  { name: 'Медия', href: '#', icon: NewspaperIcon },
  { name: 'Кариери', href: '#', icon: BriefcaseIcon },
  { name: 'Поверителност', href: '#', icon: ShieldCheckIcon },
];
const resources = [
  { name: 'Общност', href: '#', icon: UserGroupIcon },
  { name: 'Партньори', href: '#', icon: GlobeAltIcon },
  { name: 'Наръчници', href: '#', icon: BookOpenIcon },
  { name: 'Уебинари', href: '#', icon: VideoCameraIcon },
];
const recentPosts = [
  {
    id: 1,
    title: 'Увеличете процента на конверсия',
    href: '#',
    date: '16 Март, 2023',
    datetime: '2023-03-16',
    category: { title: 'Маркетинг', href: '#' },
    imageUrl:
      'https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3603&q=80',
    description: 'Достигнете до повече потенциални клиенти и увеличете продажбите си с нашите съвети.',
  },
  {
    id: 2,
    title: 'Как да използвате SEO за увеличаване на продажбите',
    href: '#',
    date: '10 Март, 2023',
    datetime: '2023-03-10',
    category: { title: 'Продажби', href: '#' },
    imageUrl:
      'https://images.unsplash.com/photo-1547586696-ea22b4d4235d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3270&q=80',
    description: 'Оптимизирайте сайта си за по-добро класиране в търсачките и повече потенциални клиенти.',
  },
];
</script>

<style scoped>
/* Премахва outline при активиране на бутони */
button:focus,
a:focus {
  outline: none !important;
  box-shadow: none !important;
}

.mega-menu-panel {
  @apply z-40 bg-white shadow-lg overflow-hidden;

  /* Мобилни устройства */
  @apply block relative;

  /* Десктоп стилове */
  @media (min-width: 1024px) {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    width: 100%;
    background-color: white;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

/* Анимация за ротация на стрелката */
.rotate-180 {
  transform: rotate(180deg);
}
</style>

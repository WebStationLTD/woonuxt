<script setup lang="ts">
const { isShowingSearch } = useSearching();
</script>

<template>
  <header class="sticky top-0 z-50 bg-white shadow-sm shadow-light-500">
    <InfoTopBar />
    <div class="flex w-full items-center justify-between py-4 px-4">
      <div class="flex items-center">
        <MenuTrigger class="lg:hidden" />
        <Logo class="w-[140px] md:w-[160px]" />
      </div>
      <MainMenu class="items-center hidden gap-6 text-sm text-gray-500 lg:flex lg:px-14" />
      <div class="flex justify-end items-center md:w-[160px] flex-1 ml-auto gap-4 md:gap-6">
        <ProductSearch class="hidden sm:inline-flex max-w-[320px] w-[60%]" />
        <SearchTrigger />
        <div class="flex gap-4 items-center">
          <SignInLink />
          <WishlistTrigger />
          <CartTrigger />
        </div>
      </div>
    </div>
    <Transition name="scale-y" mode="out-in">
      <div class="container mb-3 -mt-1 sm:hidden" v-if="isShowingSearch">
        <ProductSearch class="flex w-full" />
      </div>
    </Transition>
  </header>
</template>

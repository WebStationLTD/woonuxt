/**
 * ⚡ EMERGENCY FIX 2.5: Image Lazy Loading Plugin
 * Добавя loading="lazy" към offscreen images от WordPress content
 * Спестява ~117 KB
 * 
 * Работи за WordPress съдържание което идва от v-html
 */
export default defineNuxtPlugin((nuxtApp) => {
  // ⚡ Функция за добавяне на lazy loading към images
  const addLazyLoadingToImages = () => {
    // Намираме всички images
    const images = document.querySelectorAll('img');
    
    images.forEach((img) => {
      // ⚠️ ВАЖНО: НЕ добавяме lazy loading за:
      // 1. LCP images (първите видими images)
      // 2. Images с fetchpriority="high"
      // 3. Images със src съдържащо "_nuxt" (Nuxt generated images)
      
      const src = img.getAttribute('src') || '';
      const fetchPriority = img.getAttribute('fetchpriority');
      const currentLoading = img.getAttribute('loading');
      
      // Skip ако вече има loading атрибут
      if (currentLoading) return;
      
      // Skip LCP images (с fetchpriority="high")
      if (fetchPriority === 'high') return;
      
      // Skip Nuxt/Vercel generated images (те вече са оптимизирани)
      if (src.includes('/_nuxt/') || src.includes('/_vercel/image')) return;
      
      // Skip images в header/hero (обикновено са above the fold)
      const isInHeader = img.closest('header, .hero, [class*="hero"]');
      if (isInHeader) return;
      
      // ⚡ Проверяваме дали image е offscreen (под видимата област)
      const rect = img.getBoundingClientRect();
      const isOffscreen = rect.top > window.innerHeight * 1.5; // 1.5x viewport height
      
      // Добавяме lazy loading за offscreen images
      if (isOffscreen || !img.complete) {
        img.setAttribute('loading', 'lazy');
        
        // Добавяме декодиране за по-добър performance
        img.setAttribute('decoding', 'async');
      }
    });
  };
  
  // ⚡ Изпълняваме след DOM ready
  if (process.client) {
    // При initial page load
    nuxtApp.hook('page:finish', () => {
      // Отлагаме с requestIdleCallback
      if ('requestIdleCallback' in window) {
        requestIdleCallback(addLazyLoadingToImages, { timeout: 500 });
      } else {
        setTimeout(addLazyLoadingToImages, 50);
      }
    });
    
    // При route промени
    nuxtApp.hook('page:transition:finish', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(addLazyLoadingToImages, { timeout: 500 });
      } else {
        setTimeout(addLazyLoadingToImages, 50);
      }
    });
  }
});


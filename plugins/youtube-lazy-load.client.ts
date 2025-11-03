/**
 * ⚡ EMERGENCY FIX 2.4: YouTube Lazy Load Plugin
 * Заменя YouTube iframes с lite facade
 * Спестява ~1.6 MB и ~200ms
 * 
 * Работи за WordPress съдържание което идва от v-html
 */
export default defineNuxtPlugin((nuxtApp) => {
  // ⚡ Функция за конвертиране на YouTube iframes към lazy facade
  const convertYouTubeIframes = () => {
    // Намираме всички YouTube iframes
    const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    
    iframes.forEach((iframe) => {
      // Вземаме video ID от src
      const src = iframe.getAttribute('src') || '';
      let videoId = '';
      
      // Опитваме се да извлечем video ID
      if (src.includes('youtube.com/embed/')) {
        videoId = src.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      } else if (src.includes('youtu.be/')) {
        videoId = src.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      
      if (!videoId) return;
      
      // Създаваме lite YouTube facade
      const wrapper = document.createElement('div');
      wrapper.className = 'youtube-lite-wrapper';
      wrapper.style.cssText = `
        position: relative;
        width: 100%;
        padding-bottom: 56.25%;
        background-color: #000;
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
      `;
      
      // Thumbnail image (използваме YouTube's thumbnail service)
      const thumbnail = document.createElement('img');
      thumbnail.src = `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`;
      thumbnail.alt = 'YouTube Video Thumbnail';
      thumbnail.loading = 'lazy'; // ⚡ Lazy load thumbnail
      thumbnail.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      
      // Play button overlay
      const playButton = document.createElement('div');
      playButton.innerHTML = `
        <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
          <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
          <path d="M 45,24 27,14 27,34" fill="#fff"></path>
        </svg>
      `;
      playButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 68px;
        height: 48px;
        transition: transform 0.2s;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      `;
      
      // Hover effect
      wrapper.addEventListener('mouseenter', () => {
        playButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
      });
      wrapper.addEventListener('mouseleave', () => {
        playButton.style.transform = 'translate(-50%, -50%) scale(1)';
      });
      
      // Click to load real iframe
      wrapper.addEventListener('click', () => {
        const realIframe = document.createElement('iframe');
        realIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        realIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        realIframe.allowFullscreen = true;
        realIframe.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        `;
        
        // Заменяме facade с реален iframe
        wrapper.innerHTML = '';
        wrapper.appendChild(realIframe);
        wrapper.style.cursor = 'default';
      }, { once: true });
      
      wrapper.appendChild(thumbnail);
      wrapper.appendChild(playButton);
      
      // Заменяме оригиналния iframe с lite facade
      iframe.parentNode?.replaceChild(wrapper, iframe);
    });
  };
  
  // ⚡ Изпълняваме след DOM ready
  if (process.client) {
    // При initial page load
    nuxtApp.hook('page:finish', () => {
      // Отлагаме с requestIdleCallback за да не блокираме rendering
      if ('requestIdleCallback' in window) {
        requestIdleCallback(convertYouTubeIframes, { timeout: 1000 });
      } else {
        setTimeout(convertYouTubeIframes, 100);
      }
    });
    
    // При route промени (за single page navigation)
    nuxtApp.hook('page:transition:finish', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(convertYouTubeIframes, { timeout: 1000 });
      } else {
        setTimeout(convertYouTubeIframes, 100);
      }
    });
  }
});


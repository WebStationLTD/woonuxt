// plugins/meta-pixel.client.ts
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const pixelId = runtimeConfig.public.FACEBOOK_PIXEL_ID as string | undefined;

  // If you don’t have it, do nothing
  if (!pixelId) return;

  // Only run in browser (the .client.ts suffix already enforces this,
  // but guarding makes it clear and helps linters).
  if (typeof window === 'undefined') return;

  // Inject the official Meta Pixel snippet as raw JS string
  // so TypeScript doesn't try to type-check it.
  useHead({
    script: [
      {
        // Note: don't minify this string with template tools; keep it as-is.
        innerHTML: `
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
          `,
        type: 'text/javascript',
      },
    ],
    noscript: [
      {
        innerHTML: `
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
          `,
      },
    ],
  });
});

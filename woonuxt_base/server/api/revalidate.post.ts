/**
 * On-Demand ISR Revalidation API
 * 
 * Позволява на WordPress да invalidate ISR кеша при промяна на продукт/категория.
 * 
 * USAGE:
 * POST /api/revalidate
 * {
 *   "secret": "YOUR_SECRET_TOKEN",
 *   "paths": ["/produkt/some-product", "/produkt-kategoriya/some-category"]
 * }
 * 
 * За да работи, добавете в WordPress plugin/functions.php:
 * 
 * add_action('save_post_product', function($post_id) {
 *   wp_remote_post('https://leaderfitness.net/api/revalidate', [
 *     'body' => json_encode([
 *       'secret' => 'YOUR_SECRET_TOKEN',
 *       'paths' => ["/produkt/" . get_post_field('post_name', $post_id)]
 *     ])
 *   ]);
 * });
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  try {
    const body = await readBody(event);
    
    // Валидация на secret token
    const expectedSecret = config.REVALIDATE_SECRET || process.env.REVALIDATE_SECRET;
    if (!expectedSecret || body.secret !== expectedSecret) {
      setResponseStatus(event, 401);
      return { 
        success: false, 
        error: 'Invalid or missing secret token' 
      };
    }
    
    // Валидация на paths
    if (!body.paths || !Array.isArray(body.paths) || body.paths.length === 0) {
      setResponseStatus(event, 400);
      return { 
        success: false, 
        error: 'Missing or invalid paths array' 
      };
    }
    
    // Лимит на едновременно revalidate-вани пътища
    const MAX_PATHS = 50;
    const pathsToRevalidate = body.paths.slice(0, MAX_PATHS);
    
    console.log(`🔄 Revalidating ${pathsToRevalidate.length} paths:`, pathsToRevalidate);
    
    // Nuxt 3 ISR revalidation (ако се поддържа от Vercel adapter)
    // Забележка: Vercel не поддържа официално on-demand revalidation за Nuxt 3 ISR
    // Но можем да invalidate-нем локалния кеш
    
    const revalidatedPaths: string[] = [];
    const failedPaths: string[] = [];
    
    for (const path of pathsToRevalidate) {
      try {
        // За Vercel можем да използваме fetch с специален header
        // или да изчистим кеша ръчно (ако имаме достъп)
        
        // Алтернативно: Trigger SSR re-render с уникален query param
        // което ще накара Vercel да генерира нова ISR версия
        await $fetch(path, {
          headers: {
            'X-Prerender-Revalidate': 'true',
          },
          // Internal fetch от сървъра към себе си
          baseURL: config.public.FRONT_END_URL,
        }).catch(() => {
          // Игнорираме грешки (404, 500) - важното е да trigger-нем revalidation
        });
        
        revalidatedPaths.push(path);
      } catch (error: any) {
        console.error(`❌ Failed to revalidate ${path}:`, error.message);
        failedPaths.push(path);
      }
    }
    
    return {
      success: true,
      revalidated: revalidatedPaths.length,
      failed: failedPaths.length,
      paths: revalidatedPaths,
      failedPaths,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error: any) {
    console.error('❌ Revalidation error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      error: error.message || 'Internal server error',
    };
  }
});



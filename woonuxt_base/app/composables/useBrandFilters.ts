// ОПТИМИЗИРАН COMPOSABLE ЗА КОНТЕКСТУАЛНИ ФИЛТРИ ПО МАРКИ
// Използва минимална GraphQL заявка + кеширане + пагинация

import { ref, computed, readonly } from 'vue';

// Кеш за атрибути по марки
const brandAttributesCache = new Map<
  string,
  {
    terms: any[];
    timestamp: number;
    ttl: number; // Time to live в милисекунди
  }
>();

// Кеш TTL - 10 минути
const CACHE_TTL = 10 * 60 * 1000;

// ⚡ ВЕРСИЯ НА КЕША: Увеличаваме при промени в логиката за автоматично инвалидиране
const CACHE_VERSION = 'v3'; // v3 = attributeFilter query fix

export const useBrandFilters = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Проверява дали кеша е валиден
  const isCacheValid = (cacheKey: string): boolean => {
    const cached = brandAttributesCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < cached.ttl;
  };

  // Зарежда контекстуални филтри за марка
  const loadBrandFilters = async (brandSlug: string): Promise<any[]> => {
    const cacheKey = `${CACHE_VERSION}-brand-${brandSlug}`; // ⚡ Добавяме версия към ключа!

    // Проверяваме кеша първо
    if (isCacheValid(cacheKey)) {
      return brandAttributesCache.get(cacheKey)!.terms;
    }

    loading.value = true;
    error.value = null;

    try {

      let allProducts: any[] = [];
      let hasNextPage = true;
      let after: string | null = null;
      let batchCount = 0;
      const maxBatches = 20; // Увеличено: 20 batch-а (2000 продукта) - покрива всички марки

      // Зареждаме пагинирано за да не претоварим заявката
      while (hasNextPage && batchCount < maxBatches) {
        const variables: any = {
          // ⚡ КРИТИЧНО FIX: Използваме attributeFilter с pa_brands вместо brandSearch!
          attributeFilter: [
            {
              taxonomy: 'pa_brands',
              terms: [brandSlug],
              operator: 'IN'
            }
          ],
          first: 100,
        };

        if (after) {
          variables.after = after;
        }

        const { data } = await useAsyncGql('getBrandAttributes', variables);
        const batch = data.value?.products?.nodes || [];

        if (batch.length === 0) break;

        allProducts.push(...batch);

        const pageInfo = data.value?.products?.pageInfo;
        hasNextPage = pageInfo?.hasNextPage || false;
        after = pageInfo?.endCursor || null;
        batchCount++;

        // ⚡ ВАЖНО: НЕ прекъсваме рано! Зареждаме ВСИЧКИ продукти от марката!
      }

      // Създаваме термините от продуктните данни
      const termMap = new Map<string, any>();

      for (const product of allProducts) {
        // От product.terms (марки, етикети)
        if (product.terms?.nodes) {
          for (const term of product.terms.nodes) {
            if (term.slug && term.name && term.taxonomyName) {
              const key = `${term.taxonomyName}-${term.slug}`;
              if (!termMap.has(key)) {
                termMap.set(key, {
                  slug: term.slug,
                  name: term.name,
                  taxonomyName: term.taxonomyName,
                  databaseId: term.databaseId || 0,
                  count: 0,
                });
              }
              termMap.get(key)!.count++;
            }
          }
        }

        // От product.attributes (размери, цветове)
        if (product.attributes?.nodes) {
          for (const attr of product.attributes.nodes) {
            const taxonomyName = `PA${attr.name?.toUpperCase()?.replace(/\s+/g, '') || 'UNKNOWN'}`;

            // От options (за прости атрибути)
            if (attr.options && Array.isArray(attr.options)) {
              for (const option of attr.options) {
                if (typeof option === 'string' && option.trim()) {
                  const slug = option.toLowerCase().replace(/\s+/g, '-');
                  const key = `${taxonomyName}-${slug}`;
                  if (!termMap.has(key)) {
                    termMap.set(key, {
                      slug: slug,
                      name: option,
                      taxonomyName: taxonomyName,
                      databaseId: 0,
                      count: 0,
                    });
                  }
                  termMap.get(key)!.count++;
                }
              }
            }

            // От terms (за глобални атрибути)
            if (attr.terms?.nodes) {
              for (const term of attr.terms.nodes) {
                if (term.slug && term.name && term.taxonomyName) {
                  const key = `${term.taxonomyName}-${term.slug}`;
                  if (!termMap.has(key)) {
                    termMap.set(key, {
                      slug: term.slug,
                      name: term.name,
                      taxonomyName: term.taxonomyName,
                      databaseId: term.databaseId || 0,
                      count: 0,
                    });
                  }
                  termMap.get(key)!.count++;
                }
              }
            }
          }
        }
      }

      const terms = Array.from(termMap.values());

      // Кешираме резултата
      brandAttributesCache.set(cacheKey, {
        terms,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      });

      return terms;
    } catch (err) {
      console.error('❌ BRAND: Грешка при зареждане на контекстуални филтри:', err);
      error.value = 'Грешка при зареждане на филтри';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Изчиства кеша (за тестване)
  const clearCache = () => {
    brandAttributesCache.clear();
  };

  // Статистики за кеша
  const getCacheStats = computed(() => ({
    size: brandAttributesCache.size,
    keys: Array.from(brandAttributesCache.keys()),
  }));

  return {
    loading: readonly(loading),
    error: readonly(error),
    loadBrandFilters,
    clearCache,
    getCacheStats,
  };
};


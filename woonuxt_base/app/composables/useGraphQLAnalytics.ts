/**
 * GraphQL Analytics Composable за мониторинг на производителността
 * Следи времето за изпълнение, размера на данните и проблемите
 */

interface QueryMetrics {
  queryName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  dataSize?: number;
  variables?: any;
  error?: string;
  cacheHit?: boolean;
}

let queryMetrics: QueryMetrics[] = [];
const isAnalyticsEnabled = ref(false);

export function useGraphQLAnalytics() {
  /**
   * Започва проследяване на GraphQL заявка
   */
  function startQueryTracking(queryName: string, variables?: any): string {
    if (!isAnalyticsEnabled.value) return '';

    const trackingId = `${queryName}-${Date.now()}-${Math.random()}`;

    queryMetrics.push({
      queryName,
      startTime: performance.now(),
      variables: variables ? JSON.parse(JSON.stringify(variables)) : undefined,
    });

    console.log(`🚀 GraphQL Query Started: ${queryName}`, variables);
    return trackingId;
  }

  /**
   * Завършва проследяване на GraphQL заявка
   */
  function endQueryTracking(queryName: string, data?: any, error?: string) {
    if (!isAnalyticsEnabled.value) return;

    const metric = queryMetrics.find(
      (m) => m.queryName === queryName && !m.endTime && m.startTime > performance.now() - 30000, // последните 30 секунди
    );

    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.error = error;

      if (data) {
        // Изчисляваме приблизителния размер на данните
        metric.dataSize = JSON.stringify(data).length;
      }

      // Анализираме производителността
      analyzeQueryPerformance(metric);
    }
  }

  /**
   * Анализира производителността на заявка
   */
  function analyzeQueryPerformance(metric: QueryMetrics) {
    const { queryName, duration, dataSize, variables } = metric;

    console.group(`📊 GraphQL Analytics: ${queryName}`);
    console.log(`⏱️ Duration: ${duration?.toFixed(2)}ms`);
    console.log(`📦 Data Size: ${dataSize ? (dataSize / 1024).toFixed(2) + 'KB' : 'N/A'}`);
    console.log(`🔧 Variables:`, variables);

    // Предупреждения за производителност
    if (duration && duration > 2000) {
      console.warn(`🚨 SLOW QUERY: ${queryName} took ${duration.toFixed(2)}ms`);
    }

    if (dataSize && dataSize > 500000) {
      console.warn(`🚨 LARGE RESPONSE: ${queryName} returned ${(dataSize / 1024).toFixed(2)}KB`);
    }

    // Специфични анализи за различни заявки
    if (queryName === 'getProducts') {
      analyzeProductsQuery(metric);
    } else if (queryName === 'getProductsCount') {
      analyzeCountQuery(metric);
    }

    console.groupEnd();
  }

  /**
   * Анализира специфично заявки за продукти
   */
  function analyzeProductsQuery(metric: QueryMetrics) {
    const { variables, duration, dataSize } = metric;

    if (variables?.first) {
      const productsRequested = variables.first;
      const avgTimePerProduct = duration ? duration / productsRequested : 0;

      console.log(`📈 Products Requested: ${productsRequested}`);
      console.log(`⚡ Avg Time per Product: ${avgTimePerProduct.toFixed(2)}ms`);

      if (avgTimePerProduct > 50) {
        console.warn(`🚨 HIGH LATENCY: ${avgTimePerProduct.toFixed(2)}ms per product`);

        // Препоръки за оптимизация
        if (productsRequested > 50) {
          console.log(`💡 SUGGESTION: Reduce 'first' parameter (currently ${productsRequested})`);
        }

        if (variables.slug && variables.slug.length > 0) {
          console.log(`💡 SUGGESTION: Consider category-specific optimization for: ${variables.slug.join(', ')}`);
        }
      }
    }
  }

  /**
   * Анализира заявки за бройка
   */
  function analyzeCountQuery(metric: QueryMetrics) {
    const { variables, duration } = metric;

    if (variables?.first > 1000) {
      console.warn(`🚨 INEFFICIENT COUNT: Loading ${variables.first} items just to count`);
      console.log(`💡 SUGGESTION: Use category.count field or implement dedicated count query`);
    }
  }

  /**
   * Връща статистики за производителност
   */
  function getPerformanceStats() {
    const stats = {
      totalQueries: queryMetrics.length,
      avgDuration: 0,
      slowQueries: 0,
      largeResponses: 0,
      errors: 0,
    };

    const completedMetrics = queryMetrics.filter((m) => m.duration);

    if (completedMetrics.length > 0) {
      stats.avgDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / completedMetrics.length;
      stats.slowQueries = completedMetrics.filter((m) => (m.duration || 0) > 2000).length;
      stats.largeResponses = completedMetrics.filter((m) => (m.dataSize || 0) > 500000).length;
      stats.errors = queryMetrics.filter((m) => m.error).length;
    }

    return stats;
  }

  /**
   * Изчиства метриките
   */
  function clearMetrics() {
    queryMetrics = [];
  }

  /**
   * Показва препоръки за оптимизация
   */
  function showOptimizationSuggestions() {
    console.group('🎯 GraphQL Optimization Suggestions');

    const stats = getPerformanceStats();

    if (stats.slowQueries > 0) {
      console.log(`⚠️ Found ${stats.slowQueries} slow queries (>2s)`);
      console.log('💡 Consider implementing cursor-based pagination');
      console.log('💡 Reduce GraphQL fragment complexity');
      console.log('💡 Add database indexes for category queries');
    }

    if (stats.largeResponses > 0) {
      console.log(`⚠️ Found ${stats.largeResponses} large responses (>500KB)`);
      console.log('💡 Remove unnecessary fields from Grid fragments');
      console.log('💡 Limit variations per product in listing queries');
    }

    // Анализ на най-използваните заявки
    const queryTypes = queryMetrics.reduce(
      (acc, metric) => {
        acc[metric.queryName] = (acc[metric.queryName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostUsedQuery = Object.entries(queryTypes).sort(([, a], [, b]) => b - a)[0];
    if (mostUsedQuery) {
      console.log(`📊 Most used query: ${mostUsedQuery[0]} (${mostUsedQuery[1]} times)`);
      console.log('💡 Consider implementing caching for this query');
    }

    console.groupEnd();
  }

  /**
   * Активира/деактивира анализа
   */
  function toggleAnalytics(enabled: boolean) {
    isAnalyticsEnabled.value = enabled;
    console.log(`🔧 GraphQL Analytics ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Автоматично мониторене на useAsyncGql
   */
  function setupAutoTracking() {
    // Този код ще се инжектира в useAsyncGql за автоматично проследяване
    if (process.client && isAnalyticsEnabled.value) {
      console.log('🔧 GraphQL Auto-tracking enabled');
    }
  }

  return {
    isAnalyticsEnabled: readonly(isAnalyticsEnabled),
    startQueryTracking,
    endQueryTracking,
    getPerformanceStats,
    clearMetrics,
    showOptimizationSuggestions,
    toggleAnalytics,
    setupAutoTracking,
  };
}

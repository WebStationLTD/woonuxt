/**
 * @name useFiltering
 * @description A composable that handles the filtering of products. For reference this
 * is what the filter query looks like: ?filter=pa_color[green,blue],pa_size[md]
 */
export function useFiltering() {
  const router = useRouter();
  const runtimeConfig = useRuntimeConfig();
  const { loadProductsWithFilters } = useProducts();

  const filterQuery = useState<string>('filter', () => '');

  // Инициализираме и синхронизираме filterQuery
  if (process.client) {
    const route = useRoute();

    // Първоначална инициализация
    filterQuery.value = (route.query.filter as string) || '';

    // Watcher за синхронизация на filterQuery с route промени
    watch(
      () => route.query.filter,
      (newFilter) => {
        filterQuery.value = (newFilter as string) || '';
      },
      { immediate: true },
    );
  }

  /**
   * Get the filter value from the url
   * @param {string} filterName
   * @returns {string[]} - An array of filter values
   * @example getFilter('pa_color') // ["green", "blue"]
   */
  function getFilter(filterName: string): string[] {
    if (!filterQuery.value) return [];

    const match = filterQuery.value.match(new RegExp(`${filterName}\\[([^\\]]*)\\]`));
    if (!match || !match[1]) return [];

    const values = match[1].split(',').filter((val) => val && val.trim());
    return values;
  }

  /**
   * Конвертира URL филтрите в GraphQL формат
   */
  function buildGraphQLFilters() {
    const filters: any = {};

    // Ценови филтър
    const priceRange = getFilter('price');
    if (priceRange.length === 2 && priceRange[0] && priceRange[1]) {
      const minPrice = parseFloat(priceRange[0]);
      const maxPrice = parseFloat(priceRange[1]);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filters.minPrice = minPrice;
        filters.maxPrice = maxPrice;
      }
    }

    // OnSale филтър - само ако има валидна стойност
    const onSale = getFilter('sale');
    if (onSale.length > 0 && onSale.includes('true')) {
      filters.onSale = true;
    }

    // Search филтър (ако е наличен в URL)
    const searchTerm = getFilter('search');
    if (searchTerm.length > 0 && searchTerm[0]) {
      filters.search = searchTerm[0];
    }

    // Category филтър - ще се предава като categorySlug array към GraphQL
    const categoryFilter = getFilter('category');
    if (categoryFilter.length > 0) {
      filters.categorySlug = categoryFilter.filter((cat) => cat && cat.trim());
    }

    // ВРЕМЕННО СКРИТ - Rating филтър
    // Rating филтър - ще се обработва клиентски след получаване на резултатите
    // защото WooCommerce GraphQL не поддържа директен rating филтър
    // const ratingFilter = getFilter('rating');
    // if (ratingFilter.length > 0 && ratingFilter[0]) {
    //   filters.rating = parseFloat(ratingFilter[0]);
    // }

    return filters;
  }

  /**
   * Получава категорията от URL
   */
  function getCategoryFromFilters(): string[] {
    const categories = getFilter('category');
    return categories;
  }

  /**
   * Set the filter value in the url and reload products with server-side filtering
   * @param {string}
   * @param {string[]}
   * @example Just like the example above, but in reverse. setFilter('pa_color', ['green', 'blue'])
   */
  async function setFilter(filterName: string, filterValue: string[]) {
    // Работи само на клиента
    if (!process.client) return;

    const route = useRoute();
    let newFilterQuery = filterQuery.value || '';

    // Filter out empty or whitespace-only values - конвертираме към string преди validation
    const cleanFilterValue = filterValue
      .map((val) => String(val)) // Конвертираме към string (numbers станат strings)
      .filter((val) => val && val.trim()) // След това safely извикваме trim
      .filter((val) => val !== 'null' && val !== 'undefined'); // Премахваме null/undefined strings

    // If there are filters and filterName is not one of them, add the filter query
    if (!filterQuery.value?.includes(filterName)) {
      newFilterQuery =
        filterQuery.value && cleanFilterValue.length > 0
          ? `${filterQuery.value},${filterName}[${cleanFilterValue}]`
          : cleanFilterValue.length > 0
            ? `${filterName}[${cleanFilterValue}]`
            : filterQuery.value;
    } else {
      // If cleanFilterValue is empty, remove the filter query
      newFilterQuery = !cleanFilterValue.length
        ? filterQuery.value.replace(`${filterName}[${getFilter(filterName)}]`, '')
        : filterQuery.value.replace(`${filterName}[${getFilter(filterName)}]`, `${filterName}[${cleanFilterValue}]`);
    }

    // remove the first or last comma
    newFilterQuery = newFilterQuery.replace(/^,/, '').replace(/,$/, '');

    // if there is 2 or more commas in a row, replace them with one
    newFilterQuery = newFilterQuery.replace(/,{2,}/g, ',');

    // Update the filter query
    filterQuery.value = newFilterQuery;

    // Премахваме pagination само ако сме на страница > 1, за да избегнем проблеми с несъществуващи страници при нови филтри
    const path = route.path.includes('/page/') && !route.path.endsWith('/page/1') ? route.path.split('/page/')[0] : route.path;

    // if the filter query is empty, remove it from the url
    if (!newFilterQuery) {
      router.push({
        path,
        query: { ...route.query, filter: undefined },
      });
    } else {
      router.push({
        path,
        query: { ...route.query, filter: newFilterQuery },
      });
    }

    // Навигацията ще trigger-не watcher-а в products.vue който ще зареди продуктите
    // Премахваме loadProductsWithFilters за да избегнем race conditions
  }

  /**
   * Reset the filter value in the url
   */
  async function resetFilter(): Promise<void> {
    // Работи само на клиента
    if (!process.client) return;

    const route = useRoute();
    const { scrollToTop } = useHelpers();
    filterQuery.value = '';
    router.push({ query: { ...route.query, filter: undefined } });

    // Изчакваме URL-а да се обнови и после зареждаме продуктите
    await nextTick();

    // Получаваме текущата категория от route ако е налична
    let categorySlug: string[] | undefined;
    if (route.params.slug) {
      categorySlug = [route.params.slug as string];
    }

    // Получаваме orderby ако е налично
    let graphqlOrderBy = 'DATE';
    if (route.query.orderby === 'price') graphqlOrderBy = 'PRICE';
    else if (route.query.orderby === 'rating') graphqlOrderBy = 'RATING';
    else if (route.query.orderby === 'alphabetically') graphqlOrderBy = 'NAME_IN';
    else if (route.query.orderby === 'date') graphqlOrderBy = 'DATE';
    else if (route.query.orderby === 'discount') graphqlOrderBy = 'DATE';

    await loadProductsWithFilters(categorySlug, graphqlOrderBy);
    scrollToTop();
  }

  /**
   * Check if there are any filters active
   * @returns {boolean}
   */
  const isFiltersActive = computed<boolean>(() => !!filterQuery.value);

  /**
   * Filter the products based on the active filters (legacy client-side filtering)
   * @param {Product[]} products - An array of all the products
   * @returns {Product[]} - An array of filtered products
   */
  function filterProducts(products: Product[]): Product[] {
    return products.filter((product) => {
      // Category filter
      const category = getFilter('category') || []; // ["category-slug"]
      const categoryCondition = category.length ? product.productCategories?.nodes?.find((node) => category.includes(node.slug as string)) : true;

      // price filter
      const priceRange = getFilter('price') || []; // ["0", "100"]
      // Variable products returns an array of prices, so we need to find the highest price.
      const productPrice = product.rawPrice ? parseFloat([...product.rawPrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b))))) : 0;
      const priceCondition = priceRange.length
        ? productPrice >= parseFloat(priceRange[0] as string) && productPrice <= parseFloat(priceRange[1] as string)
        : true;

      // Star rating filter
      // ВРЕМЕННО СКРИТО - rating филтър в legacy filterProducts
      // const starRating = getFilter('rating') || [];
      // const ratingCondition = starRating.length ? (product?.averageRating || 0) >= parseFloat(starRating[0] as string) : true;
      const ratingCondition = true; // Винаги true когато rating филтърът е скрит

      // Product attribute filters
      const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES)
        ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES.map((attribute: any) => attribute.slug)
        : [];
      const attributeCondition = globalProductAttributes
        .map((attribute: string) => {
          const attributeValues = getFilter(attribute) || [];
          if (!attributeValues.length) return true;
          return product.terms?.nodes?.find((node: any) => node.taxonomyName === attribute && attributeValues.includes(node.slug));
        })
        .every((condition: any) => condition);

      // onSale filter
      const onSale = getFilter('sale');
      const saleItemsOnlyCondition = onSale.length ? product.onSale : true;

      return ratingCondition && priceCondition && attributeCondition && categoryCondition && saleItemsOnlyCondition;
    });
  }

  return { getFilter, setFilter, resetFilter, isFiltersActive, filterProducts, buildGraphQLFilters, getCategoryFromFilters };
}

// Example: ?filter=search[shirt]
export function useSearching() {
  const route = useRoute();
  const router = useRouter();
  const { setFilter, getFilter } = useFiltering();

  const isShowingSearch = useState<boolean>('isShowingSearch', () => false);
  const searchQuery = useState<string>('searchQuery', () => '');
  const isSearchActive = computed<boolean>(() => !!searchQuery.value);

  // Инициализираме searchQuery от filter параметъра
  if (process.client) {
    const searchFromFilter = getFilter('search');
    searchQuery.value = searchFromFilter.length > 0 ? searchFromFilter[0] || '' : '';

    // Синхронизираме searchQuery при промяна на филтрите
    watch(
      () => getFilter('search'),
      (newSearchFilter) => {
        searchQuery.value = newSearchFilter.length > 0 ? newSearchFilter[0] || '' : '';
      },
      { immediate: true },
    );
  }

  function getSearchQuery(): string {
    const searchFromFilter = getFilter('search');
    return searchFromFilter.length > 0 ? searchFromFilter[0] || '' : '';
  }

  async function setSearchQuery(search: string): Promise<void> {
    if (!process.client) return;

    searchQuery.value = search;

    // ПОПРАВКА: Прави едно навигационно извикване вместо две за да избегнем race condition
    const currentQuery = { ...route.query };

    if (search && search.trim()) {
      // Построяваме filter string мануално
      const trimmedSearch = search.trim();
      let filterQuery = (route.query.filter as string) || '';

      // Премахваме старо search от filter ако има
      filterQuery = filterQuery
        .replace(/search\[[^\]]*\],?/g, '')
        .replace(/^,|,$/g, '')
        .replace(/,,+/g, ',');

      // Добавяме новото search
      const newSearchFilter = `search[${trimmedSearch}]`;
      filterQuery = filterQuery ? `${filterQuery},${newSearchFilter}` : newSearchFilter;

      currentQuery.filter = filterQuery;
    } else {
      // Премахваме search от filter
      let filterQuery = (route.query.filter as string) || '';
      filterQuery = filterQuery
        .replace(/search\[[^\]]*\],?/g, '')
        .replace(/^,|,$/g, '')
        .replace(/,,+/g, ',');

      if (filterQuery) {
        currentQuery.filter = filterQuery;
      } else {
        delete currentQuery.filter;
      }
    }

    // Правим единичен redirect към magazin с правилните филтри
    const targetPath = '/magazin';

    // КРИТИЧНО: Премахваме page параметри ако са от pagination за да избегнем конфликт
    delete currentQuery.page;

    await router.push({
      path: targetPath,
      query: currentQuery,
    });
  }

  function clearSearchQuery(): void {
    if (process.client) {
      setFilter('search', []);
    }
  }

  const toggleSearch = (): void => {
    isShowingSearch.value = !isShowingSearch.value;
  };

  // Legacy функция - вече не се използва, но я оставяме за съвместимост
  function searchProducts(products: Product[]): Product[] {
    const search = getSearchQuery();
    return search
      ? products.filter((product: Product) => {
          const name = product.name?.toLowerCase();
          const description = product.description ? product.description.toLowerCase() : null;
          const shortDescription = product.shortDescription ? product.shortDescription.toLowerCase() : null;
          const query = search.toLowerCase();
          return name?.includes(query) ?? description?.includes(query) ?? shortDescription?.includes(query);
        })
      : products;
  }

  return { getSearchQuery, setSearchQuery, clearSearchQuery, searchProducts, isSearchActive, isShowingSearch, toggleSearch };
}

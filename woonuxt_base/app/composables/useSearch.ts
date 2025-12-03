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

    // КРИТИЧНО: Задаваме filter ПРЕДИ навигацията
    if (search && search.trim()) {
      setFilter('search', [search.trim()]);
    } else {
      setFilter('search', []);
    }

    // Построяваме URL мануално
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      // Проверяваме дали сме вече в /magazin
      const isInMagazin = route.path === '/magazin' || route.path.startsWith('/magazin/page/');

      if (isInMagazin) {
        // Ако сме в /magazin, използваме съществуващите query параметри и добавяме search
        const searchParams = new URLSearchParams(window.location.search);
        let filterQuery = searchParams.get('filter') || '';

        // Премахваме старо search от filter ако има
        filterQuery = filterQuery
          .replace(/search\[[^\]]*\],?/g, '')
          .replace(/^,|,$/g, '')
          .replace(/,,+/g, ',');

        // Добавяме новото search БЕЗ допълнително encoding
        const newSearchFilter = `search[${trimmedSearch}]`;
        filterQuery = filterQuery ? `${filterQuery},${newSearchFilter}` : newSearchFilter;

        // Построяваме URL ДИРЕКТНО без URLSearchParams.toString()
        const otherParams = Array.from(searchParams.entries())
          .filter(([key]) => key !== 'filter' && key !== 'page')
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');

        const encodedFilter = encodeURIComponent(filterQuery);
        const queryString = otherParams ? `filter=${encodedFilter}&${otherParams}` : `filter=${encodedFilter}`;

        const newUrl = `/magazin?${queryString}`;
        
        // Проверяваме дали URL-а е различен преди навигация
        if (route.fullPath !== newUrl) {
          await navigateTo(newUrl);
        }
      } else {
        // Ако НЕ сме в /magazin, правим чист redirect с само search филтър
        const encodedSearch = encodeURIComponent(trimmedSearch);
        const newUrl = `/magazin?filter=search[${encodedSearch}]`;
        await navigateTo(newUrl);
      }
    } else {
      // Ако search е празен, изчистваме го
      const isInMagazin = route.path === '/magazin' || route.path.startsWith('/magazin/page/');

      if (isInMagazin) {
        // Ако сме в /magazin, премахваме само search филтъра
        const searchParams = new URLSearchParams(window.location.search);
        let filterQuery = searchParams.get('filter') || '';

        filterQuery = filterQuery
          .replace(/search\[[^\]]*\],?/g, '')
          .replace(/^,|,$/g, '')
          .replace(/,,+/g, ',');

        if (filterQuery) {
          const otherParams = Array.from(searchParams.entries())
            .filter(([key]) => key !== 'filter' && key !== 'page')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

          const encodedFilter = encodeURIComponent(filterQuery);
          const queryString = otherParams ? `filter=${encodedFilter}&${otherParams}` : `filter=${encodedFilter}`;

          const newUrl = `/magazin?${queryString}`;
          
          if (route.fullPath !== newUrl) {
            await navigateTo(newUrl);
          }
        } else {
          // Само други параметри без filter
          const otherParams = Array.from(searchParams.entries())
            .filter(([key]) => key !== 'filter' && key !== 'page')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

          const newUrl = otherParams ? `/magazin?${otherParams}` : '/magazin';
          
          if (route.fullPath !== newUrl) {
            await navigateTo(newUrl);
          }
        }
      } else {
        // Ако НЕ сме в /magazin, отиваме в /magazin без филтри
        await navigateTo('/magazin');
      }
    }
  }

  function clearSearchQuery(): void {
    if (process.client) {
      searchQuery.value = '';
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

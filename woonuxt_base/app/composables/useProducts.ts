let allProducts = [] as Product[];
let currentPageProducts = [] as Product[];
let pageInfo = {
  hasNextPage: false,
  endCursor: '',
};

// Добавяме състояние за активните филтри
let activeFilters: {
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  search?: string;
  // rating?: number;  // ВРЕМЕННО СКРИТО
  categorySlug?: string[];
} = {
  minPrice: undefined,
  maxPrice: undefined,
  onSale: undefined,
  search: undefined,
  // rating: undefined,  // ВРЕМЕННО СКРИТО
  categorySlug: undefined,
};

export function useProducts() {
  // Declare the state variables and the setter functions
  const products = useState<Product[]>('products', () => []);
  const isLoading = useState<boolean>('products-loading', () => false);
  const currentPage = useState<number>('products-current-page', () => 1);
  const productsPerPage = useState<number>('products-per-page', () => 12);

  /**
   * Sets the products state variable and the allProducts variable.
   * @param {Product[]} newProducts - The new products to set.
   */
  function setProducts(newProducts: Product[]): void {
    if (!Array.isArray(newProducts)) throw new Error('Products must be an array.');
    products.value = [...newProducts];
    allProducts = JSON.parse(JSON.stringify(newProducts));
  }

  /**
   * Зарежда продукти със серверна пагинация и филтри
   * @param {number} page - Номер на страницата
   * @param {string[]} categorySlug - Категория за филтриране
   * @param {ProductsOrderByEnum} orderBy - Начин на сортиране
   * @param {object} filters - Обект с филтри
   */
  async function loadProductsPage(
    page: number = 1,
    categorySlug?: string[],
    orderBy?: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      onSale?: boolean;
      search?: string;
      // rating?: number;  // ВРЕМЕННО СКРИТО
      categorySlug?: string[];
    },
  ): Promise<void> {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      isLoading.value = true;

      // Timeout за предотвратяване на "закачане" на loading
      timeoutId = setTimeout(() => {
        if (isLoading.value) {
          console.warn('⚠️ Loading products timeout - принудително завършване');
          isLoading.value = false;
        }
      }, 10000); // 10 секунди timeout

      // За cursor-based pagination трябва да заредим до желаната страница + 1 за проверка
      const totalProductsNeeded = page * productsPerPage.value + 1;
      const variables: any = {
        first: totalProductsNeeded,
        orderby: orderBy || 'DATE',
      };

      // Добавяме order параметъра (ASC/DESC) ако е зададен - само на клиента
      if (process.client) {
        const route = useRoute();
        if (route.query.order) {
          variables.order = route.query.order.toString().toUpperCase();
        }
      }

      // Комбинираме categorySlug от route параметри и от филтри
      let finalCategorySlug = categorySlug || [];
      if (filters?.categorySlug && filters.categorySlug.length > 0) {
        // Ако има category филтри, комбинираме ги с route категорията
        if (finalCategorySlug.length > 0) {
          // Ако вече сме в категорийна страница, добавяме филтрираните категории
          finalCategorySlug = [...finalCategorySlug, ...filters.categorySlug];
        } else {
          // Ако не сме в категорийна страница, използваме само филтрираните
          finalCategorySlug = filters.categorySlug;
        }
      }

      if (finalCategorySlug.length > 0) {
        variables.slug = finalCategorySlug;
      }

      // Добавяме филтърните параметри
      if (filters) {
        if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
        if (filters.onSale !== undefined) variables.onSale = filters.onSale;
        if (filters.search) variables.search = filters.search;
        // if (filters.rating !== undefined) variables.rating = filters.rating;  // ВРЕМЕННО СКРИТО

        // Запазваме активните филтри
        activeFilters = { ...filters };
      }

      const { data } = await useAsyncGql('getProducts', variables);
      const result = data.value?.products;

      if (result && result.pageInfo) {
        // Обновяваме pageInfo с данните от GraphQL
        pageInfo.hasNextPage = result.pageInfo.hasNextPage || false;
        pageInfo.endCursor = result.pageInfo.endCursor || '';

        // Взимаме продуктите за конкретната страница от всички заредени
        const allLoadedProducts = result.nodes || [];
        const startIndex = (page - 1) * productsPerPage.value;
        const endIndex = startIndex + productsPerPage.value;
        let productsToShow = allLoadedProducts.slice(startIndex, endIndex);

        // Проверяваме дали има още страници след текущата
        pageInfo.hasNextPage = allLoadedProducts.length > page * productsPerPage.value;

        // ВРЕМЕННО СКРИТО - Клиентски филтри за rating
        // Прилагаме клиентски филтри които не се поддържат от GraphQL
        // if (filters?.rating !== undefined) {
        //   productsToShow = productsToShow.filter((product: any) => {
        //     const productRating = product?.averageRating || 0;
        //     return productRating >= (filters.rating || 0);
        //   });
        // }

        // Прилагаме само клиентски филтри които не са вече приложени сървърно - само на клиента
        if (process.client) {
          const { filterProducts, getFilter } = useFiltering();
          const runtimeConfig = useRuntimeConfig();

          // Филтриране по attributes (pa_color, pa_size и т.н.)
          const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES)
            ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES.map((attribute: any) => attribute.slug)
            : [];

          globalProductAttributes.forEach((attribute: string) => {
            const attributeValues = getFilter(attribute);
            if (attributeValues.length > 0) {
              productsToShow = productsToShow.filter((product: any) => {
                return product.terms?.nodes?.find((node: any) => node.taxonomyName === attribute && attributeValues.includes(node.slug));
              });
            }
          });
        }

        // Прилагаме клиентско сортиране по discount ако е нужно (СЛЕД всички филтри) - само на клиента
        if (process.client && orderBy === 'discount') {
          const route = useRoute();
          const sortOrder = route.query.order?.toString().toUpperCase() || 'DESC';

          productsToShow = productsToShow.sort((a: any, b: any) => {
            const aRegularPrice = a.rawRegularPrice
              ? parseFloat(a.rawRegularPrice.split(',').reduce((x: string, y: string) => String(Math.max(Number(x), Number(y)))))
              : 0;
            const aSalePrice = a.rawSalePrice
              ? parseFloat(a.rawSalePrice.split(',').reduce((x: string, y: string) => String(Math.max(Number(x), Number(y)))))
              : aRegularPrice;
            const bRegularPrice = b.rawRegularPrice
              ? parseFloat(b.rawRegularPrice.split(',').reduce((x: string, y: string) => String(Math.max(Number(x), Number(y)))))
              : 0;
            const bSalePrice = b.rawSalePrice
              ? parseFloat(b.rawSalePrice.split(',').reduce((x: string, y: string) => String(Math.max(Number(x), Number(y)))))
              : bRegularPrice;

            const aDiscount = a.onSale && aRegularPrice > 0 ? Math.round(((aRegularPrice - aSalePrice) / aRegularPrice) * 100) : 0;
            const bDiscount = b.onSale && bRegularPrice > 0 ? Math.round(((bRegularPrice - bSalePrice) / bRegularPrice) * 100) : 0;

            // Прилагаме сортирането според order параметъра
            return sortOrder === 'ASC' ? aDiscount - bDiscount : bDiscount - aDiscount;
          });
        }

        currentPageProducts = productsToShow;
        setProducts(currentPageProducts);

        currentPage.value = page;
      }
    } catch (error) {
      console.error('Грешка при зареждане на продукти:', error);
      setProducts([]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      isLoading.value = false;

      // Принудително завършване на Nuxt loading indicator ако се е "закачил"
      if (process.client) {
        setTimeout(() => {
          const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
          if (loadingIndicator && getComputedStyle(loadingIndicator).opacity !== '0') {
            console.log('🔧 Принудително завършване на loading indicator');
            (loadingIndicator as HTMLElement).style.width = '100%';
            setTimeout(() => {
              (loadingIndicator as HTMLElement).style.opacity = '0';
            }, 100);
          }
        }, 500);
      }
    }
  }

  /**
   * Зарежда продукти с нови филтри (винаги започва от страница 1)
   */
  async function loadProductsWithFilters(
    categorySlug?: string[],
    orderBy?: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      onSale?: boolean;
      search?: string;
      // rating?: number;  // ВРЕМЕННО СКРИТО
      categorySlug?: string[];
    },
  ): Promise<void> {
    // Рестартираме към страница 1 при нови филтри
    pageInfo.endCursor = '';
    await loadProductsPage(1, categorySlug, orderBy, filters);
  }

  /**
   * Зарежда следващата страница продукти с активните филтри
   */
  async function loadNextPage(): Promise<void> {
    if (pageInfo.hasNextPage) {
      await loadProductsPage(currentPage.value + 1, undefined, undefined, activeFilters);
    }
  }

  /**
   * Зарежда предишната страница продукти с активните филтри
   */
  async function loadPreviousPage(): Promise<void> {
    if (currentPage.value > 1) {
      await loadProductsPage(currentPage.value - 1, undefined, undefined, activeFilters);
    }
  }

  const updateProductList = async (): Promise<void> => {
    // Тази функция е остаряла - използваме loadProductsWithFilters вместо нея
    return;
  };

  return {
    products,
    allProducts,
    currentPageProducts,
    pageInfo,
    isLoading,
    currentPage,
    productsPerPage,
    activeFilters,
    setProducts,
    updateProductList,
    loadProductsPage,
    loadProductsWithFilters,
    loadNextPage,
    loadPreviousPage,
  };
}

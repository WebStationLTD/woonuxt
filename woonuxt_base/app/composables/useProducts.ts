import { reactive } from 'vue';

let allProducts = [] as Product[];
let currentPageProducts = [] as Product[];
const pageInfo = reactive({
  hasNextPage: false,
  endCursor: '',
});

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
  const productsPerPage = useState<number>('products-per-page', () => 24);

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
        if (route.query.order && route.query.order !== null) {
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
        // Взимаме продуктите за конкретната страница от всички заредени
        const allLoadedProducts = result.nodes || [];
        const startIndex = (page - 1) * productsPerPage.value;
        const endIndex = startIndex + productsPerPage.value;
        let productsToShow = allLoadedProducts.slice(startIndex, endIndex);

        // ВАЖНО: Използваме данните от GraphQL сървъра, не локална логика
        // GraphQL сървърът знае най-добре дали има още продукти
        pageInfo.hasNextPage = result.pageInfo.hasNextPage || false;
        pageInfo.endCursor = result.pageInfo.endCursor || '';

        // ВРЕМЕННО СКРИТО - Клиентски филтри за rating
        // Прилагаме клиентски филтри които не се поддържат от GraphQL
        // if (filters?.rating !== undefined) {
        //   productsToShow = productsToShow.filter((product: any) => {
        //     const productRating = product?.averageRating || 0;
        //     return productRating >= (filters.rating || 0);
        //   });
        // }

        // ПРЕМАХНАТО КЛИЕНТСКО ФИЛТРИРАНЕ - сега използваме само server-side!

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
      setProducts([]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      isLoading.value = false;

      // Принудително завършване на Nuxt loading indicator ако се е "закачил"
      if (process.client) {
        setTimeout(() => {
          const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
          if (loadingIndicator && getComputedStyle(loadingIndicator).opacity !== '0') {
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

  /**
   * Reset-ва състоянието на продуктите и пагинацията
   */
  function resetProductsState(): void {
    products.value = [];
    currentPage.value = 1;
    pageInfo.hasNextPage = false;
    pageInfo.endCursor = '';
    allProducts = [];
    currentPageProducts = [];
    activeFilters = {
      minPrice: undefined,
      maxPrice: undefined,
      onSale: undefined,
      search: undefined,
      categorySlug: undefined,
    };
  }

  const updateProductList = async (): Promise<void> => {
    // Тази функция е остаряла - използваме loadProductsWithFilters вместо нея
    return;
  };

  /**
   * НОВА ОПТИМИЗИРАНА функция за пагинация с cursor-based подход
   * Зарежда САМО текущата страница вместо всички предишни
   */
  async function loadProductsPageOptimized(
    page: number = 1,
    categorySlug?: string[],
    orderBy?: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      onSale?: boolean;
      search?: string;
      categorySlug?: string[];
    },
    cursor?: string, // За cursor-based navigation
    productTag?: string[], // За етикети
  ): Promise<void> {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      isLoading.value = true;

      // Timeout за предотвратяване на "закачане" на loading
      timeoutId = setTimeout(() => {
        if (isLoading.value) {
          isLoading.value = false;
        }
      }, 10000);

      // КРИТИЧНО: Зареждаме САМО продуктите за текущата страница (12)
      const variables: any = {
        first: productsPerPage.value, // САМО 12 продукта!
        orderby: orderBy || 'DATE',
      };

      // Използваме cursor ако е предоставен за navigation
      if (cursor) {
        variables.after = cursor;
      }

      // Добавяме order параметъра ако е зададен
      if (process.client) {
        const route = useRoute();
        if (route.query.order && route.query.order !== null) {
          variables.order = route.query.order.toString().toUpperCase();
        }
      }

      // Комбинираме categorySlug от route параметри и от филтри
      let finalCategorySlug = categorySlug || [];
      if (filters?.categorySlug && filters.categorySlug.length > 0) {
        if (finalCategorySlug.length > 0) {
          finalCategorySlug = [...finalCategorySlug, ...filters.categorySlug];
        } else {
          finalCategorySlug = filters.categorySlug;
        }
      }

      if (finalCategorySlug.length > 0) {
        variables.slug = finalCategorySlug;
      }

      // Добавяме етикет параметъра ако е предоставен
      if (productTag && productTag.length > 0) {
        variables.productTag = productTag;
      }

      // Добавяме филтърните параметри
      if (filters) {
        if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
        if (filters.onSale !== undefined) variables.onSale = filters.onSale;
        if (filters.search) variables.search = filters.search;

        activeFilters = { ...filters };
      }

      // ПРАВИЛНО SERVER-SIDE АТРИБУТНО ФИЛТРИРАНЕ с taxonomyFilter
      if (process.client) {
        const { getFilter } = useFiltering();
        const runtimeConfig = useRuntimeConfig();

        const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES)
          ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES.map((attribute: any) => attribute.slug)
          : [];

        // Създаваме taxonomy филтри за всеки атрибут
        const taxonomyFilters: any[] = [];

        globalProductAttributes.forEach((attribute: string) => {
          const attributeValues = getFilter(attribute);
          if (attributeValues.length > 0) {
            console.log(`🔥 SERVER-SIDE TAXONOMY FILTER ${attribute}:`, attributeValues);

            // Добавяме taxonomy филтър за този атрибут
            taxonomyFilters.push({
              taxonomy: attribute,
              terms: attributeValues,
              operator: 'IN',
            });
          }
        });

        // Ако има атрибутни филтри, пращаме ги като attributeFilter
        if (taxonomyFilters.length > 0) {
          console.log('🔥 ПРАЩАМЕ КАТО attributeFilter:', taxonomyFilters);
          variables.attributeFilter = taxonomyFilters;
        }
      }

      // Използваме оптимизираната заявка
      const { data } = await useAsyncGql('getProductsOptimized', variables);
      const result = data.value?.products;

      if (result && result.pageInfo) {
        let productsToShow = result.nodes || [];

        // Обновяваме pageInfo с данните от сървъра
        pageInfo.hasNextPage = result.pageInfo.hasNextPage || false;
        pageInfo.endCursor = result.pageInfo.endCursor || '';

        // Клиентски филтри (ако са нужни)
        if (productsToShow.length > 0) {
          // DEBUG: Колко продукта имат атрибути
          const productsWithAttributes = productsToShow.filter((p) => (p as any).attributes?.nodes?.length > 0);
          console.log(`🔍 АТРИБУТИ: ${productsWithAttributes.length}/${productsToShow.length} продукта имат атрибути`);

          if (productsWithAttributes.length > 0) {
            console.log(
              '📝 Продукти с атрибути:',
              productsWithAttributes.map((p) => p.name),
            );

            // ДЕТАЙЛНО: Покажи какви атрибути имат продуктите
            productsWithAttributes.slice(0, 3).forEach((p: any) => {
              console.log(
                `📋 ${p.name} атрибути:`,
                p.attributes?.nodes?.map((attr: any) => ({
                  name: attr.name,
                  label: attr.label,
                  options: attr.options,
                  termsCount: attr.terms?.nodes?.length || 0,
                  terms: attr.terms?.nodes?.map((t: any) => t.name) || [],
                })),
              );
            });
          }

          const productsWithoutAttributes = productsToShow.filter((p) => !(p as any).attributes?.nodes?.length);
          if (productsWithoutAttributes.length > 0) {
            console.log(
              '❌ Продукти БЕЗ атрибути:',
              productsWithoutAttributes.slice(0, 5).map((p) => p.name),
            );

            // ДЕТАЙЛНО: Проверявай дали имат terms
            productsWithoutAttributes.slice(0, 3).forEach((p: any) => {
              const termsCount = p.terms?.nodes?.length || 0;
              if (termsCount > 0) {
                console.log(
                  `📋 ${p.name} terms (${termsCount}):`,
                  p.terms.nodes.map((t: any) => `${t.name} (${t.taxonomyName})`),
                );
              }
            });
          }
        }

        // WPGraphQL Filter Query plugin прави server-side филтриране - БЕЗ клиентски код!

        // Клиентско сортиране по discount ако е нужно (САМО сортиране)
        if (process.client && orderBy === 'discount') {
          const route = useRoute();
          const sortOrder = route.query.order?.toString().toUpperCase() || 'DESC';

          const sortedProducts = productsToShow.sort((a: any, b: any) => {
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

            return sortOrder === 'ASC' ? aDiscount - bDiscount : bDiscount - aDiscount;
          });

          setProducts(sortedProducts);
        } else {
          setProducts(productsToShow);
        }

        currentPage.value = page;
      }
    } catch (error) {
      console.error('loadProductsPageOptimized error:', error);
      setProducts([]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      isLoading.value = false;

      // Принудително завършване на Nuxt loading indicator
      if (process.client) {
        setTimeout(() => {
          const loadingIndicator = document.querySelector('.nuxt-loading-indicator');
          if (loadingIndicator && getComputedStyle(loadingIndicator).opacity !== '0') {
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
   * СУПЕР БЪРЗА функция за навигация към конкретна страница
   * Първо получава cursor-и, после зарежда само желаната страница
   */
  async function jumpToPageOptimized(
    targetPage: number,
    categorySlug?: string[],
    orderBy?: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      onSale?: boolean;
      search?: string;
      categorySlug?: string[];
    },
    productTag?: string[], // За етикети
  ): Promise<void> {
    if (targetPage <= 1) {
      // За първа страница не е нужен cursor
      return await loadProductsPageOptimized(1, categorySlug, orderBy, filters, undefined, productTag);
    }

    try {
      isLoading.value = true;

      // Стъпка 1: Получаваме cursor-и БЕЗ продуктни данни (много бързо!)
      // ПОПРАВКА: За страница 152 трябват cursor за позиция 1812, не 1824 cursor-а!
      const cursorPosition = (targetPage - 1) * productsPerPage.value;
      const cursorsNeeded = Math.min(cursorPosition, 2000); // Ограничаваме до 2000

      const variables: any = {
        first: cursorsNeeded,
        orderby: orderBy || 'DATE',
      };

      // Добавяме параметрите
      if (process.client) {
        const route = useRoute();
        if (route.query.order && route.query.order !== null) {
          variables.order = route.query.order.toString().toUpperCase();
        }
      }

      let finalCategorySlug = categorySlug || [];
      if (filters?.categorySlug && filters.categorySlug.length > 0) {
        if (finalCategorySlug.length > 0) {
          finalCategorySlug = [...finalCategorySlug, ...filters.categorySlug];
        } else {
          finalCategorySlug = filters.categorySlug;
        }
      }

      if (finalCategorySlug.length > 0) {
        variables.slug = finalCategorySlug;
      }

      // Добавяме етикет параметъра ако е предоставен
      if (productTag && productTag.length > 0) {
        variables.productTag = productTag;
      }

      if (filters) {
        if (filters.minPrice !== undefined) variables.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) variables.maxPrice = filters.maxPrice;
        if (filters.onSale !== undefined) variables.onSale = filters.onSale;
        if (filters.search) variables.search = filters.search;
      }

      // Добавяме атрибутни филтри и към cursor заявката за консистентност
      if (process.client) {
        const { getFilter } = useFiltering();
        const runtimeConfig = useRuntimeConfig();

        const globalProductAttributes = Array.isArray(runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES)
          ? runtimeConfig.public.GLOBAL_PRODUCT_ATTRIBUTES.map((attribute: any) => attribute.slug)
          : [];

        const taxonomyFilters: any[] = [];

        globalProductAttributes.forEach((attribute: string) => {
          const attributeValues = getFilter(attribute);
          if (attributeValues.length > 0) {
            taxonomyFilters.push({
              taxonomy: attribute,
              terms: attributeValues,
              operator: 'IN',
            });
          }
        });

        // Ако има атрибутни филтри, пращаме ги като attributeFilter
        if (taxonomyFilters.length > 0) {
          variables.attributeFilter = taxonomyFilters;
        }
      }

      // Получаваме cursor-ите (много бърза заявка!)
      const { data: cursorsData } = await useAsyncGql('getProductCursors', variables);

      if (cursorsData.value?.products?.edges) {
        const edges = cursorsData.value.products.edges;

        console.log(`🔍 CURSOR DEBUG: Искаме страница ${targetPage}, получихме ${edges.length} cursor-а`);

        // ПОПРАВКА: Правилно изчисление на cursor позицията
        // За страница N, трябва cursor СЛЕД продукт (N-1) * 12
        const lastProductOfPreviousPage = (targetPage - 1) * productsPerPage.value;

        let targetCursor = null;
        if (lastProductOfPreviousPage > 0 && lastProductOfPreviousPage <= edges.length) {
          // Взимаме cursor-а на последния продукт от предишната страница
          targetCursor = edges[lastProductOfPreviousPage - 1]?.cursor;
          console.log(`🎯 CURSOR: За страница ${targetPage} използваме cursor от позиция ${lastProductOfPreviousPage - 1}`);
        } else {
          console.log(`⚠️ CURSOR: Няма достатъчно cursor-и за страница ${targetPage} (искаме ${lastProductOfPreviousPage}, имаме ${edges.length})`);

          // КРИТИЧНО: Ако няма достатъчно cursor-и, страницата не съществува!
          if (lastProductOfPreviousPage >= edges.length) {
            console.log(`❌ CURSOR: Страница ${targetPage} не съществува - връщаме празен резултат`);
            setProducts([]);
            pageInfo.hasNextPage = false;
            pageInfo.endCursor = '';
            currentPage.value = targetPage;
            return;
          }
        }

        // Стъпка 2: Зареждаме САМО продуктите за тази страница
        await loadProductsPageOptimized(targetPage, categorySlug, orderBy, filters, targetCursor || undefined, productTag);
      } else {
        console.log('❌ CURSOR: Не успяхме да получим cursor данни, използваме fallback');
        // Fallback към обикновено зареждане
        await loadProductsPageOptimized(targetPage, categorySlug, orderBy, filters, undefined, productTag);
      }
    } catch (error) {
      console.error('jumpToPageOptimized error:', error);
      // Fallback към обикновено зареждане
      await loadProductsPageOptimized(targetPage, categorySlug, orderBy, filters, undefined, productTag);
    }
  }

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
    resetProductsState,
    updateProductList,
    loadProductsPage,
    loadProductsWithFilters,
    loadNextPage,
    loadPreviousPage,
    loadProductsPageOptimized,
    jumpToPageOptimized,
  };
}

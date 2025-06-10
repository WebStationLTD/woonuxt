// Example: ?orderby=price&order=asc

export function useSorting() {
  const router = useRouter();
  const { loadProductsWithFilters } = useProducts();
  const { buildGraphQLFilters } = useFiltering();

  const orderQuery = useState<string>('order', () => '');

  // Инициализираме orderQuery само на клиента
  if (process.client) {
    const route = useRoute();
    orderQuery.value = route.query.orderby as string;
  }

  function getOrderQuery(): { orderBy: string; order: string } {
    if (!process.client) return { orderBy: '', order: '' };

    const route = useRoute();
    return { orderBy: route.query.orderby as string, order: route.query.order as string };
  }

  async function setOrderQuery(orderby: string, order?: string): Promise<void> {
    if (!process.client) return;

    const route = useRoute();
    router.push({ query: { ...route.query, orderby: orderby ?? undefined, order: order ?? undefined } });

    // Навигацията ще trigger-не watcher-а в страниците който ще зареди продуктите
    // Премахваме loadProductsWithFilters за да избегнем race conditions
  }

  const isSortingActive = computed<boolean>(() => !!orderQuery.value);

  // Define a function to order the products (legacy client-side sorting)
  function sortProducts(products: Product[]): Product[] {
    if (!isSortingActive) return products;

    const orderQuery = getOrderQuery();

    if (!orderQuery.orderBy && !orderQuery.order) return products;

    const orderby: string = orderQuery.orderBy || 'date';
    const order: string = orderQuery.order || 'DESC';

    return products.sort((a: Product, b: Product) => {
      // Format values for sorting
      const aDate: any = a.date ? new Date(a.date).getTime() : 0;
      const bDate: any = b.date ? new Date(b.date).getTime() : 0;
      const aPrice = a.rawPrice ? parseFloat([...a.rawPrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b))))) : 0;
      const bPrice = b.rawPrice ? parseFloat([...b.rawPrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b))))) : 0;
      const aSalePrice: number = a.rawSalePrice ? parseFloat([...a.rawSalePrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b))))) : 0;
      const aRegularPrice: number = a.rawRegularPrice
        ? parseFloat([...a.rawRegularPrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b)))))
        : 0;
      const bSalePrice: number = b.rawSalePrice ? parseFloat([...b.rawSalePrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b))))) : 0;
      const bRegularPrice: number = b.rawRegularPrice
        ? parseFloat([...b.rawRegularPrice.split(',')].reduce((a, b) => String(Math.max(Number(a), Number(b)))))
        : 0;
      const aDiscount: number = a.onSale ? Math.round(((aSalePrice - aRegularPrice) / aRegularPrice) * 100) : 0;
      const bDiscount: number = b.onSale ? Math.round(((bSalePrice - bRegularPrice) / bRegularPrice) * 100) : 0;
      const aName: string = a.name || '';
      const bName: string = b.name || '';
      const aRating: number = a.averageRating || 0;
      const bRating: number = b.averageRating || 0;

      switch (orderby) {
        case 'price':
          return order !== 'DESC' ? aPrice - bPrice : bPrice - aPrice;
        case 'rating':
          return order !== 'DESC' ? bRating - aRating : aRating - bRating;
        case 'discount':
          return order !== 'DESC' ? bDiscount - aDiscount : aDiscount - bDiscount;
        case 'alphabetically':
          return order !== 'DESC' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        default:
          return order !== 'DESC' ? aDate - bDate : bDate - aDate;
      }
    });
  }

  return { getOrderQuery, setOrderQuery, isSortingActive, orderQuery, sortProducts };
}

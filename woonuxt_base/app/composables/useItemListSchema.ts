/**
 * ItemList Schema.org structured data
 * Google Carousel резултати за product listings
 */
export const useItemListSchema = (
  productsRef: Ref<Product[]> | Product[],
  listName?: string
) => {
  const { addSchema } = useSchemaBase();
  const { frontEndUrl } = useHelpers();
  
  const products = computed(() => unref(productsRef));
  
  const generateSchema = () => {
    const items = products.value;
    if (!items || items.length === 0) {
      return null;
    }

    const baseUrl = frontEndUrl || 'https://leaderfitness.net';
    
    const itemListElement = items.slice(0, 20).map((product, index) => {
      if (!product || !product.slug) return null;
      
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${baseUrl}/produkt/${product.slug}`,
        name: product.name,
      };
    }).filter(Boolean);

    if (itemListElement.length === 0) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement,
      ...(listName && { name: listName }),
      numberOfItems: itemListElement.length,
    };
  };

  // SSR: Генерираме schema веднага
  if (process.server) {
    const schema = generateSchema();
    if (schema) {
      addSchema(schema);
    }
  }

  // Client: Watch за промени
  if (process.client) {
    watch(
      products,
      () => {
        const schema = generateSchema();
        if (schema) {
          addSchema(schema);
        }
      },
      { immediate: true }
    );
  }
};


/**
 * Product Schema.org structured data
 * Rich Snippets в Google с цена, наличност, рейтинг
 */
export const useProductSchema = (productRef: Ref<Product> | Product) => {
  const { addSchema } = useSchemaBase();
  const { frontEndUrl } = useHelpers();
  
  const product = computed(() => unref(productRef));
  
  const generateSchema = () => {
    const p = product.value;
    if (!p || !p.slug) {
      console.warn('[useProductSchema] Product missing or no slug:', p);
      return null;
    }

    const baseUrl = frontEndUrl || 'https://leaderfitness.net';
    
    // Helper за форматиране на цена за Schema.org (изисква точка като десетичен разделител)
    const formatPrice = (price: string | undefined): string => {
      if (!price) return '0';
      // 1. Заменяме запетая с точка (за български формат)
      // 2. Премахваме всичко освен цифри и точка
      const normalized = price.replace(',', '.').replace(/[^\d.]/g, '');
      // 3. Валидираме че е число
      const num = parseFloat(normalized);
      return isNaN(num) ? '0' : num.toFixed(2);
    };
    
    const priceString = p.rawSalePrice || p.rawRegularPrice || p.rawPrice;
    const priceValue = formatPrice(priceString);
    const hasSalePrice = Boolean(p.rawSalePrice && p.rawRegularPrice && p.rawSalePrice !== p.rawRegularPrice);
    const regularPriceValue = formatPrice(p.rawRegularPrice);
    
    let availability = 'https://schema.org/OutOfStock';
    if (p.stockStatus === 'IN_STOCK') {
      availability = 'https://schema.org/InStock';
    } else if (p.stockStatus === 'ON_BACKORDER') {
      availability = 'https://schema.org/BackOrder';
    }
    
    const images: string[] = [];
    if (p.image?.sourceUrl) {
      images.push(p.image.sourceUrl);
    }
    if (p.galleryImages?.nodes) {
      p.galleryImages.nodes.forEach((img: any) => {
        if (img?.sourceUrl && img.sourceUrl !== p.image?.sourceUrl) {
          images.push(img.sourceUrl);
        }
      });
    }
    
    const brandName = p.attributes?.nodes?.find((attr: any) => attr.name === 'pa_brands')?.options?.[0];
    
    const categoryName = p.productCategories?.nodes?.[0]?.name;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name || '',
      description: p.shortDescription || p.description || '',
      sku: p.sku || '',
      url: `${baseUrl}/produkt/${p.slug}`,
      image: images.length > 0 ? images : undefined,
      
      ...(brandName && {
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
      }),
      
      ...(categoryName && {
        category: categoryName,
      }),
      
      offers: {
        '@type': 'Offer',
        price: priceValue,
        priceCurrency: 'BGN',
        availability: availability,
        url: `${baseUrl}/produkt/${p.slug}`,
        
        ...(hasSalePrice && regularPriceValue && {
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: priceValue,
            priceCurrency: 'BGN',
            valueAddedTaxIncluded: true,
          },
        }),
      },
      
      ...(p.averageRating && parseFloat(p.averageRating) > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.averageRating,
          bestRating: '5',
          worstRating: '1',
        },
      }),
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
      product,
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


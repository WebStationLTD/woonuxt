interface Brand {
  slug?: string | null;
  name?: string | null;
  databaseId?: number | null;
  count?: number | null;
  description?: string | null;
}

const safeDecodeURI = (encodedString: string): string => {
  try {
    return decodeURIComponent(encodedString);
  } catch (error) {
    console.warn('Failed to decode URI:', encodedString, error);
    return encodedString;
  }
};

export const useBrandUrls = () => {
  const runtimeConfig = useRuntimeConfig();
  const productBrandPermalink = runtimeConfig?.public?.PRODUCT_BRAND_PERMALINK || '/marka-produkt/';

  /**
   * Генерира правилен URL за марка
   */
  const generateBrandUrl = (brand: Brand): string => {
    if (!brand.slug) return '';

    const safeSlug = safeDecodeURI(brand.slug);
    return `${productBrandPermalink}${safeSlug}`;
  };

  /**
   * Безопасно декодиране на URI
   */
  const safeDecodeURIComponent = (str: string): string => {
    return safeDecodeURI(str);
  };

  return {
    generateBrandUrl,
    safeDecodeURI: safeDecodeURIComponent,
    productBrandPermalink,
  };
};

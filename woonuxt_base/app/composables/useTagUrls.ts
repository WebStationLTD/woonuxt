interface Tag {
  slug?: string | null;
  name?: string | null;
  databaseId?: number | null;
  count?: number | null;
  description?: string | null;
  uri?: string | null;
}

const safeDecodeURI = (encodedString: string): string => {
  try {
    return decodeURIComponent(encodedString);
  } catch (error) {
    console.warn('Failed to decode URI:', encodedString, error);
    return encodedString;
  }
};

export const useTagUrls = () => {
  const runtimeConfig = useRuntimeConfig();
  const productTagPermalink = runtimeConfig?.public?.PRODUCT_TAG_PERMALINK || '/produkt-etiket/';

  /**
   * Генерира правилен URL за етикет
   */
  const generateTagUrl = (tag: Tag): string => {
    if (!tag.slug) return '';

    const safeSlug = safeDecodeURI(tag.slug);
    return `${productTagPermalink}${safeSlug}`;
  };

  /**
   * Безопасно декодиране на URI
   */
  const safeDecodeURIComponent = (str: string): string => {
    return safeDecodeURI(str);
  };

  return {
    generateTagUrl,
    safeDecodeURI: safeDecodeURIComponent,
    productTagPermalink,
  };
};

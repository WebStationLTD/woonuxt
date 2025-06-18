interface Category {
  slug?: string | null;
  name?: string | null;
  parent?: {
    node?: {
      slug?: string | null;
      name?: string | null;
    } | null;
  } | null;
  children?: {
    nodes?: Category[] | null;
  } | null;
}

export const useCategoryUrls = () => {
  const runtimeConfig = useRuntimeConfig();
  const productCategoryPermalink = runtimeConfig?.public?.PRODUCT_CATEGORY_PERMALINK || '/produkt-kategoriya/';

  /**
   * Генерира правилен URL за категория, като отчита йерархичната структура
   */
  const generateCategoryUrl = (category: Category, allCategories: Category[] = []): string => {
    return ensureValidUrl(category, allCategories);
  };

  /**
   * Намира родителската категория за дадена категория в списъка от всички категории
   */
  const findParentCategory = (targetCategory: Category, allCategories: Category[]): Category | null => {
    if (!targetCategory.slug) return null;

    for (const category of allCategories) {
      if (category.children?.nodes) {
        const found = category.children.nodes.find((child) => child.slug === targetCategory.slug);
        if (found) {
          return category;
        }
      }
    }
    return null;
  };

  /**
   * Проверява дали даден URL е валиден, ако не - връща fallback
   */
  const ensureValidUrl = (category: Category, allCategories: Category[] = []): string => {
    if (!category?.slug) return '/categories';

    const safeSlug = safeDecodeURI(category.slug);

    // Първо опитваме йерархичен URL
    const parentSlug = category.parent?.node?.slug;
    if (parentSlug) {
      const safeParentSlug = safeDecodeURI(parentSlug);
      // Проверяваме дали parent категорията съществува в allCategories
      const parentExists = allCategories.some((cat) => cat.slug === parentSlug);
      if (parentExists) {
        return `${productCategoryPermalink}${safeParentSlug}/${safeSlug}`;
      }
    }

    // Ако parent в category.parent не съществува, търсим в allCategories
    const parentCategory = findParentCategory(category, allCategories);
    if (parentCategory && parentCategory.slug) {
      const safeParentSlug = safeDecodeURI(parentCategory.slug);
      return `${productCategoryPermalink}${safeParentSlug}/${safeSlug}`;
    }

    // Fallback към плосък URL
    return `${productCategoryPermalink}${safeSlug}`;
  };

  /**
   * Проверява дали дадена категория има подкатегории
   */
  const hasChildren = (category: Category): boolean => {
    return Boolean(category.children?.nodes && category.children.nodes.length > 0);
  };

  /**
   * Проверява дали дадена категория е подкатегория (има родител)
   */
  const isSubcategory = (category: Category, allCategories: Category[] = []): boolean => {
    return Boolean(category.parent?.node?.slug || findParentCategory(category, allCategories));
  };

  /**
   * Получава пълният път от родител до дете като стринг
   */
  const getCategoryPath = (category: Category, allCategories: Category[] = []): string => {
    const parentCategory = category.parent?.node || findParentCategory(category, allCategories);

    if (parentCategory) {
      return `${parentCategory.name} > ${category.name}`;
    }

    return category.name || '';
  };

  /**
   * Безопасно декодиране на URI компонент
   */
  const safeDecodeURI = (uri: string | null | undefined): string => {
    if (!uri) return '';
    try {
      return decodeURIComponent(uri);
    } catch {
      return uri;
    }
  };

  return {
    generateCategoryUrl,
    ensureValidUrl,
    findParentCategory,
    hasChildren,
    isSubcategory,
    getCategoryPath,
    safeDecodeURI,
    productCategoryPermalink,
  };
};

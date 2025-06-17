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
    if (!category?.slug) return '/categories';

    // Проверяваме дали категорията има родител
    const parentSlug = category.parent?.node?.slug;

    if (parentSlug) {
      // Ако има родител, връщаме йерархичен URL
      return `${productCategoryPermalink}${parentSlug}/${category.slug}`;
    }

    // Ако няма родител в category.parent, проверяваме дали тази категория е дете на някоя друга
    const parentCategory = findParentCategory(category, allCategories);

    if (parentCategory) {
      return `${productCategoryPermalink}${parentCategory.slug}/${category.slug}`;
    }

    // Ако няма родител, връщаме плоския URL
    return `${productCategoryPermalink}${category.slug}`;
  };

  /**
   * Намира родителската категория за дадена категория в списъка от всички категории
   */
  const findParentCategory = (targetCategory: Category, allCategories: Category[]): Category | null => {
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
    findParentCategory,
    hasChildren,
    isSubcategory,
    getCategoryPath,
    safeDecodeURI,
    productCategoryPermalink,
  };
};

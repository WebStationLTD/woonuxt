export const useProductVariations = () => {
  /**
   * Sorts product variations.
   * The sorting order is as follows:
   * 1. Pre-defined clothing sizes (xxs, xs, s, m, l, xl, etc.)
   * 2. Numeric values (e.g., 8, 10, 12, or 10-oz, 8-years)
   * 3. Alphabetical order for any other values.
   *
   * @param {any[]} variations - The array of product variations to sort.
   * @returns {any[]} A new array with the sorted variations.
   */
  const sortVariations = (variations: any[]) => {
    // Define the desired order for clothing sizes.
    const sizeOrder: { [key: string]: number } = {
      xxs: 1,
      xs: 2,
      s: 3,
      m: 4,
      l: 5,
      xl: 6,
      xxl: 7,
      '2xl': 7, // Alias for xxl
      xxxl: 8,
      '3xl': 8, // Alias for xxxl
      '4xl': 9,
      '5xl': 10,
      '6xl': 11,
    };

    const getVariationValue = (variation: any): string => {
      if (variation?.attributes?.nodes?.length && variation.attributes.nodes[0]?.value) {
        return String(variation.attributes.nodes[0].value).toLowerCase().trim();
      }
      return String(variation?.name || '')
        .toLowerCase()
        .trim();
    };

    const extractNumber = (value: string): number => {
      const match = value.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };

    return [...variations].sort((a, b) => {
      const valueA = getVariationValue(a);
      const valueB = getVariationValue(b);

      const orderA = sizeOrder[valueA];
      const orderB = sizeOrder[valueB];

      // If both are standard clothing sizes, sort by the predefined order.
      if (orderA && orderB) {
        return orderA - orderB;
      }
      if (orderA && !orderB) return -1; // sizes first
      if (!orderA && orderB) return 1;

      const numA = extractNumber(valueA);
      const numB = extractNumber(valueB);

      // If both values contain numbers, sort by numbers.
      if (numA > 0 && numB > 0 && numA !== numB) {
        return numA - numB;
      }

      if (numA > 0 && !(numB > 0)) return -1;
      if (!(numA > 0) && numB > 0) return 1;

      // Otherwise, fall back to alphabetical sorting.
      return valueA.localeCompare(valueB);
    });
  };

  return {
    sortVariations,
  };
};

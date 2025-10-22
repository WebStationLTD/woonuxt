/**
 * Composable за форматиране на цени в двоен формат BGN / EUR
 * Съгласно изискванията на Еврозоната в България
 *
 * Официален курс: 1 EUR = 1.95583 BGN (фиксиран)
 */

// Официален курс EUR/BGN - ЕДИНСТВЕНО МЯСТО за промяна!
export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Форматира цена в двоен формат: X.XX лв. / X.XX €
 * Pure function - може да се използва навсякъде
 * @param price - Raw цена като string или number
 * @param showZero - Дали да показва "0.00 лв. / 0.00 €" при липса на цена
 * @returns Форматирана цена в двоен формат
 */
export const formatDualPrice = (price: string | number | null | undefined, showZero: boolean = false): string => {
  if (!price) return showZero ? '0.00 лв. / 0.00 €' : '';

  const priceNum = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(priceNum) || priceNum === 0) {
    return showZero ? '0.00 лв. / 0.00 €' : '';
  }

  const priceBGN = priceNum.toFixed(2);
  const priceEUR = (priceNum / BGN_TO_EUR_RATE).toFixed(2);

  return `${priceBGN} лв. / ${priceEUR} €`;
};

/**
 * Конвертира цена от BGN в EUR
 * @param priceBGN - Цена в лева
 * @returns Цена в евро
 */
export const convertToEUR = (priceBGN: number): number => {
  return priceBGN / BGN_TO_EUR_RATE;
};

/**
 * Конвертира цена от EUR в BGN
 * @param priceEUR - Цена в евро
 * @returns Цена в лева
 */
export const convertToBGN = (priceEUR: number): number => {
  return priceEUR * BGN_TO_EUR_RATE;
};

/**
 * Форматира само BGN цена
 */
export const formatBGN = (price: string | number | null | undefined): string => {
  if (!price) return '';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(priceNum)) return '';
  return `${priceNum.toFixed(2)} лв.`;
};

/**
 * Форматира само EUR цена
 */
export const formatEUR = (price: string | number | null | undefined): string => {
  if (!price) return '';
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(priceNum)) return '';
  return `${(priceNum / BGN_TO_EUR_RATE).toFixed(2)} €`;
};

/**
 * Composable wrapper за използване във Vue компоненти
 * Експортира всички функции за удобство
 */
export function usePriceFormatter() {
  return {
    BGN_TO_EUR_RATE,
    formatDualPrice,
    formatBGN,
    formatEUR,
    convertToEUR,
    convertToBGN,
  };
}

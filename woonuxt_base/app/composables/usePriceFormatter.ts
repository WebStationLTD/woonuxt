/**
 * Composable за форматиране на цени в двоен формат EUR / BGN
 * Съгласно изискванията на Еврозоната в България
 *
 * ⚠️ ВАЖНО: От 01.01.2025 цените от бекенда са в ЕВРО!
 * Официален курс: 1 EUR = 1.95583 BGN (фиксиран)
 * 
 * Формат на показване (6 месеца от 01.01.2025):
 * X.XX € / X.XX лв. (първо евро, после лева)
 */

// Официален курс EUR/BGN - ЕДИНСТВЕНО МЯСТО за промяна!
export const EUR_TO_BGN_RATE = 1.95583;

/**
 * Форматира цена в двоен формат: X.XX € / X.XX лв.
 * Pure function - може да се използва навсякъде
 * 
 * ⚠️ ВАЖНО: Цената от бекенда е в ЕВРО!
 * 
 * @param priceEUR - Raw цена в ЕВРО като string или number (от бекенда)
 * @param showZero - Дали да показва "0.00 € / 0.00 лв." при липса на цена
 * @returns Форматирана цена в двоен формат (EUR / BGN)
 */
export const formatDualPrice = (priceEUR: string | number | null | undefined, showZero: boolean = false): string => {
  if (!priceEUR) return showZero ? '0.00 € / 0.00 лв.' : '';

  const priceNum = typeof priceEUR === 'string' ? parseFloat(priceEUR) : priceEUR;

  if (isNaN(priceNum) || priceNum === 0) {
    return showZero ? '0.00 € / 0.00 лв.' : '';
  }

  const priceEURFormatted = priceNum.toFixed(2);
  const priceBGN = (priceNum * EUR_TO_BGN_RATE).toFixed(2);

  return `${priceEURFormatted} € / ${priceBGN} лв.`;
};

/**
 * Конвертира цена от EUR в BGN
 * @param priceEUR - Цена в евро
 * @returns Цена в лева
 */
export const convertToBGN = (priceEUR: number): number => {
  return priceEUR * EUR_TO_BGN_RATE;
};

/**
 * Конвертира цена от BGN в EUR
 * @param priceBGN - Цена в лева
 * @returns Цена в евро
 */
export const convertToEUR = (priceBGN: number): number => {
  return priceBGN / EUR_TO_BGN_RATE;
};

/**
 * Форматира само EUR цена
 * ⚠️ ВАЖНО: Цената от бекенда е в ЕВРО!
 * @param priceEUR - Цена в евро (от бекенда)
 */
export const formatEUR = (priceEUR: string | number | null | undefined): string => {
  if (!priceEUR) return '';
  const priceNum = typeof priceEUR === 'string' ? parseFloat(priceEUR) : priceEUR;
  if (isNaN(priceNum)) return '';
  return `${priceNum.toFixed(2)} €`;
};

/**
 * Форматира само BGN цена
 * ⚠️ ВАЖНО: Цената от бекенда е в ЕВРО, конвертираме в BGN!
 * @param priceEUR - Цена в евро (от бекенда)
 */
export const formatBGN = (priceEUR: string | number | null | undefined): string => {
  if (!priceEUR) return '';
  const priceNum = typeof priceEUR === 'string' ? parseFloat(priceEUR) : priceEUR;
  if (isNaN(priceNum)) return '';
  const priceBGN = priceNum * EUR_TO_BGN_RATE;
  return `${priceBGN.toFixed(2)} лв.`;
};

/**
 * Composable wrapper за използване във Vue компоненти
 * Експортира всички функции за удобство
 */
export function usePriceFormatter() {
  return {
    EUR_TO_BGN_RATE,
    formatDualPrice,
    formatEUR,
    formatBGN,
    convertToBGN,
    convertToEUR,
  };
}

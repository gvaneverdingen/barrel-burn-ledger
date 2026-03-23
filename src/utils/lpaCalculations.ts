/**
 * LPA (Litre of Pure Alcohol) Pricing Utilities
 * 
 * LPA is the industry-standard unit for whisky cask valuation.
 * It normalises pricing across different cask sizes and ABV strengths.
 * 
 * LPA = bulk litres × (ABV / 100)
 * Price per LPA = total price / LPA
 */

/**
 * Calculate the LPA (Litres of Pure Alcohol) for a cask.
 */
export const calculateLPA = (
  volumeLiters: number | null | undefined,
  alcoholPercentage: number | null | undefined
): number => {
  if (!volumeLiters || !alcoholPercentage) return 0;
  return volumeLiters * (alcoholPercentage / 100);
};

/**
 * Calculate the price per LPA for a cask.
 */
export const calculatePricePerLPA = (
  totalPrice: number | null | undefined,
  volumeLiters: number | null | undefined,
  alcoholPercentage: number | null | undefined
): number => {
  const lpa = calculateLPA(volumeLiters, alcoholPercentage);
  if (!totalPrice || lpa === 0) return 0;
  return totalPrice / lpa;
};

/**
 * Format an LPA value for display (e.g. "125.4 LPA").
 */
export const formatLPA = (lpa: number): string => {
  if (lpa === 0) return '0 LPA';
  return `${lpa.toFixed(1)} LPA`;
};

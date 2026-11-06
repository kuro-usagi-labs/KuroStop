/**
 * Financial Calculation Engine for KuroStop.
 * Operates strictly with INTEGER IDR (Rupiah). No floating-point rounding errors.
 */

export function calculateSingleCigaretteCost(packPrice: number, packSize: number): number {
  if (packSize <= 0) return 0;
  return Math.round(packPrice / packSize);
}

export function calculateDailyBaselineCost(baselinePerDay: number, packPrice: number, packSize: number): number {
  if (packSize <= 0 || baselinePerDay <= 0) return 0;
  const singleCost = packPrice / packSize;
  return Math.round(baselinePerDay * singleCost);
}

export function calculatePeriodBaselineExpected(dailyBaselineCost: number, dayCount: number): number {
  return Math.round(dailyBaselineCost * Math.max(0, dayCount));
}

export function calculateEligibleBaselineDays(
  days: string[],
  baselineEffectiveDate?: string,
): number {
  if (!baselineEffectiveDate) return days.length;
  return days.filter((d) => d >= baselineEffectiveDate).length;
}

export function calculateEligiblePeriodBaseline(
  dailyBaselineCost: number,
  days: string[],
  baselineEffectiveDate?: string,
): number {
  const eligibleCount = calculateEligibleBaselineDays(days, baselineEffectiveDate);
  return calculatePeriodBaselineExpected(dailyBaselineCost, eligibleCount);
}

export function calculateAvoidedSpending(baselineExpectedSpend: number, actualSpend: number): number {
  // Can be negative if the user bought more than baseline (honest financial accounting)
  return Math.round(baselineExpectedSpend - actualSpend);
}

export function calculateSavingsProjections(dailyBaselineCost: number): {
  days30: number;
  days90: number;
  days180: number;
  days365: number;
} {
  return {
    days30: dailyBaselineCost * 30,
    days90: dailyBaselineCost * 90,
    days180: dailyBaselineCost * 180,
    days365: dailyBaselineCost * 365,
  };
}

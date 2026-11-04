import { PurchaseRecord } from '../../types';

export interface FinanceSummary {
  actualSpending: number; // Integer IDR
  baselineExpectedSpending: number; // Integer IDR
  avoidedSpending: number; // Can be negative if overspent!
  isOverspent: boolean;
  totalPacksBought: number;
  totalSticksBought: number;
  potentialMonthlySavings: number; // 30 * baseline
  potentialYearlySavings: number; // 365 * baseline
  purchaseCount: number;
}

export interface MonthlyFinanceReport {
  yearMonth: string; // 'YYYY-MM'
  actualSpending: number;
  baselineExpectedSpending: number;
  avoidedSpending: number;
  isOverspent: boolean;
  purchaseCount: number;
}

/**
 * Calculate financial totals and avoided spending
 */
export const calculateFinanceSummary = (
  purchases: PurchaseRecord[],
  dailyBaselineRate: number, // Integer IDR e.g. 30000
  trackedDaysCount: number = 1
): FinanceSummary => {
  const safeTrackedDays = Math.max(1, trackedDaysCount);
  const safeDailyBaseline = Math.max(0, Math.round(dailyBaselineRate));

  let actualSpending = 0;
  let totalPacksBought = 0;
  let totalSticksBought = 0;

  for (const purchase of purchases) {
    actualSpending += Math.round(purchase.totalPrice || 0);
    if (purchase.itemType === 'pack') {
      totalPacksBought += purchase.quantity || 1;
    } else {
      totalSticksBought += purchase.quantity || 1;
    }
  }

  const baselineExpectedSpending = safeDailyBaseline * safeTrackedDays;
  const avoidedSpending = baselineExpectedSpending - actualSpending;
  const isOverspent = avoidedSpending < 0;

  return {
    actualSpending,
    baselineExpectedSpending,
    avoidedSpending,
    isOverspent,
    totalPacksBought,
    totalSticksBought,
    potentialMonthlySavings: safeDailyBaseline * 30,
    potentialYearlySavings: safeDailyBaseline * 365,
    purchaseCount: purchases.length,
  };
};

/**
 * Group purchases by month ('YYYY-MM')
 */
export const calculateMonthlyReports = (
  purchases: PurchaseRecord[],
  dailyBaselineRate: number
): MonthlyFinanceReport[] => {
  const monthMap: Record<string, { actual: number; daysInMonth: number; count: number }> = {};

  for (const purchase of purchases) {
    const ym = purchase.localDate.substring(0, 7); // 'YYYY-MM'
    if (!monthMap[ym]) {
      const [yStr, mStr] = ym.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      // Days in that specific calendar month
      const days = new Date(y, m, 0).getDate();
      monthMap[ym] = { actual: 0, daysInMonth: days, count: 0 };
    }
    monthMap[ym].actual += Math.round(purchase.totalPrice || 0);
    monthMap[ym].count += 1;
  }

  return Object.keys(monthMap)
    .sort()
    .reverse()
    .map((ym) => {
      const { actual, daysInMonth, count } = monthMap[ym];
      const baseline = dailyBaselineRate * daysInMonth;
      const avoided = baseline - actual;
      return {
        yearMonth: ym,
        actualSpending: actual,
        baselineExpectedSpending: baseline,
        avoidedSpending: avoided,
        isOverspent: avoided < 0,
        purchaseCount: count,
      };
    });
};

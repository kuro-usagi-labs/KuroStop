import { calculateFinanceSummary, calculateMonthlyReports } from '../calculator';
import { PurchaseRecord } from '../../../types';

describe('Cigarette Financial Tracker — Unit Tests', () => {
  const dummyPurchase = (
    totalPrice: number,
    itemType: 'pack' | 'stick' = 'pack',
    quantity: number = 1,
    localDate: string = '2026-11-05'
  ): PurchaseRecord => ({
    id: 'pur-' + Math.random(),
    timestamp: Date.now(),
    localDate,
    itemType,
    quantity,
    totalPrice,
    brandName: 'Marlboro',
    createdAt: new Date().toISOString(),
  });

  test('Accurately sums actual spending in integer IDR', () => {
    const purchases = [
      dummyPurchase(28000, 'pack', 1),
      dummyPurchase(17000, 'pack', 1),
      dummyPurchase(5000, 'stick', 2),
    ];

    const summary = calculateFinanceSummary(purchases, 30000, 3);
    // 28.000 + 17.000 + 5.000 = 50.000
    expect(summary.actualSpending).toBe(50000);
    expect(summary.totalPacksBought).toBe(2);
    expect(summary.totalSticksBought).toBe(2);
  });

  test('Calculates positive avoided spending when actual < baseline', () => {
    // 10 days tracked at Rp 30.000/day = Rp 300.000 expected baseline
    // Actual spent: Rp 56.000 (2 packs @ 28k)
    // Avoided: Rp 244.000
    const purchases = [
      dummyPurchase(28000, 'pack', 1),
      dummyPurchase(28000, 'pack', 1),
    ];

    const summary = calculateFinanceSummary(purchases, 30000, 10);
    expect(summary.baselineExpectedSpending).toBe(300000);
    expect(summary.actualSpending).toBe(56000);
    expect(summary.avoidedSpending).toBe(244000);
    expect(summary.isOverspent).toBe(false);
  });

  test('Calculates negative avoided spending (overspending) correctly', () => {
    // 2 days tracked at Rp 25.000/day = Rp 50.000 baseline
    // Actual spent: Rp 84.000 (3 packs @ 28k)
    // Avoided: -Rp 34.000 (overspent by 34k)
    const purchases = [
      dummyPurchase(28000, 'pack', 1),
      dummyPurchase(28000, 'pack', 1),
      dummyPurchase(28000, 'pack', 1),
    ];

    const summary = calculateFinanceSummary(purchases, 25000, 2);
    expect(summary.baselineExpectedSpending).toBe(50000);
    expect(summary.actualSpending).toBe(84000);
    expect(summary.avoidedSpending).toBe(-34000);
    expect(summary.isOverspent).toBe(true);
  });

  test('Computes monthly report grouping without floating point errors', () => {
    const purchases = [
      dummyPurchase(28000, 'pack', 1, '2026-10-10'),
      dummyPurchase(28000, 'pack', 1, '2026-10-20'),
      dummyPurchase(30000, 'pack', 1, '2026-11-01'),
    ];

    const reports = calculateMonthlyReports(purchases, 20000);
    expect(reports.length).toBe(2);

    const nov = reports.find((r) => r.yearMonth === '2026-11');
    expect(nov).toBeDefined();
    expect(nov?.actualSpending).toBe(30000);
    expect(nov?.purchaseCount).toBe(1);

    const oct = reports.find((r) => r.yearMonth === '2026-10');
    expect(oct).toBeDefined();
    expect(oct?.actualSpending).toBe(56000);
    expect(oct?.purchaseCount).toBe(2);
  });
});

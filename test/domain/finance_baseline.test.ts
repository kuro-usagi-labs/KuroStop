import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDailyBaselineCost,
  calculateEligibleBaselineDays,
  calculateEligiblePeriodBaseline,
  calculateAvoidedSpending,
} from '../../src/domain/finance';

test('Finance Baseline Effective Date & Period Eligibility (Phase 4)', async (t) => {
  // Baseline: 10 cigarettes/day, Rp 34.000 for pack of 16 => Rp 2.125 / stick => Rp 21.250 / day
  const dailyCost = calculateDailyBaselineCost(10, 34000, 16);
  assert.equal(dailyCost, 21250);

  const days30 = [
    '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13',
    '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
    '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28',
    '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02',
    '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
  ];

  await t.test('1. Baseline applies to all days if effective date is prior to window', () => {
    const eligibleDays = calculateEligibleBaselineDays(days30, '2026-10-01');
    assert.equal(eligibleDays, 30);

    const expectedBaseline = calculateEligiblePeriodBaseline(dailyCost, days30, '2026-10-01');
    assert.equal(expectedBaseline, 21250 * 30);
  });

  await t.test('2. Incomplete baseline: days prior to effective date do not fabricate savings', () => {
    // User configured baseline on 2026-11-04 (only 4 eligible days: 11-04, 11-05, 11-06, 11-07)
    const effectiveDate = '2026-11-04';
    const eligibleDays = calculateEligibleBaselineDays(days30, effectiveDate);
    assert.equal(eligibleDays, 4, 'Only 4 days are on or after 2026-11-04');

    const expectedBaseline = calculateEligiblePeriodBaseline(dailyCost, days30, effectiveDate);
    assert.equal(expectedBaseline, 21250 * 4, 'Baseline expected spend must be for 4 eligible days only');

    // If actual spending during this 30-day window was Rp 100.000
    const avoided = calculateAvoidedSpending(expectedBaseline, 100000);
    // 85.000 - 100.000 = -15.000 (deficit!)
    assert.equal(avoided, -15000);
  });

  await t.test('3. Future effective date yields zero eligible days in historical window', () => {
    const futureDate = '2026-12-01';
    const eligibleDays = calculateEligibleBaselineDays(days30, futureDate);
    assert.equal(eligibleDays, 0);

    const expectedBaseline = calculateEligiblePeriodBaseline(dailyCost, days30, futureDate);
    assert.equal(expectedBaseline, 0);
  });
});

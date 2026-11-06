import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateDailyZone } from '../../src/domain/consequence';
import {
  calculateDailyBaselineCost, calculatePeriodBaselineExpected,
  calculateAvoidedSpending, calculateSavingsProjections,
} from '../../src/domain/finance';
import { getSleepNightKey, evaluateSleepSession } from '../../src/domain/sleep';
import { calculateStreak } from '../../src/domain/streaks';
import {
  validateSmokeQty, validatePrice, validatePmoType, validateTimestamp, ValidationError,
} from '../../src/domain/validation';

test('Consequence Engine Pure Function', async (t) => {
  const baseCtx = {
    smokeCount: 0,
    pmoSessions: 0,
    targets: { smokeTarget: 5, pmoTarget: 0 },
    activeHabits: { smoke: true, pmo: true, sleep: true },
    sensitivity: 'standar' as const,
    isVerified: true,
  };

  await t.test('fresh day with zero violations is clear', () => {
    const res = calculateDailyZone(baseCtx);
    assert.equal(res.zone, 'clear');
    assert.equal(res.points, 0);
  });

  await t.test('smoke within target is clear', () => {
    const res = calculateDailyZone({ ...baseCtx, smokeCount: 5 });
    assert.equal(res.zone, 'clear');
    assert.equal(res.points, 0);
  });

  await t.test('smoke 1 over target is warning in standard sensitivity', () => {
    const res = calculateDailyZone({ ...baseCtx, smokeCount: 6 });
    assert.equal(res.zone, 'warning');
    assert.equal(res.points, 1);
  });

  await t.test('smoke 3 over target is danger', () => {
    const res = calculateDailyZone({ ...baseCtx, smokeCount: 8 });
    assert.equal(res.zone, 'danger');
    assert.equal(res.points, 3);
  });

  await t.test('smoke 5 over target is critical', () => {
    const res = calculateDailyZone({ ...baseCtx, smokeCount: 10 });
    assert.equal(res.zone, 'critical');
    assert.equal(res.points, 5);
  });

  await t.test('pmo 1 session with target 0 gives 2 points (warning in standard)', () => {
    const res = calculateDailyZone({ ...baseCtx, pmoSessions: 1 });
    assert.equal(res.zone, 'warning');
    assert.equal(res.points, 2);
  });

  await t.test('multi-habit violation receives synergy penalty point', () => {
    // 1 over smoke (1 pt) + 1 PMO session (2 pts) + multi-habit penalty (1 pt) = 4 pts (danger)
    const res = calculateDailyZone({ ...baseCtx, smokeCount: 6, pmoSessions: 1 });
    assert.equal(res.zone, 'danger');
    assert.equal(res.points, 4);
    assert.ok(res.factors.some((f) => f.includes('multi-kebiasaan')));
  });

  await t.test('sensitivity adjustments work deterministically', () => {
    // 2 points in keras is danger (threshold: warning >= 1, danger >= 2, critical >= 4)
    const strictRes = calculateDailyZone({ ...baseCtx, pmoSessions: 1, sensitivity: 'keras' });
    assert.equal(strictRes.zone, 'danger');

    // 2 points in lunak is warning (threshold: warning >= 2, danger >= 4, critical >= 7)
    const lenientRes = calculateDailyZone({ ...baseCtx, pmoSessions: 1, sensitivity: 'lunak' });
    assert.equal(lenientRes.zone, 'warning');
  });
});

test('Financial Engine Calculations', async (t) => {
  await t.test('calculates daily baseline cost with integer IDR', () => {
    // 16 sticks per pack, Rp 34.000, 12 sticks per day baseline:
    // single stick = 34000 / 16 = 2125
    // 12 * 2125 = 25500 IDR
    const daily = calculateDailyBaselineCost(12, 34000, 16);
    assert.equal(daily, 25500);
  });

  await t.test('calculates avoided spending accurately, including negative values', () => {
    const baselineExpected = 25500 * 7; // 178500 IDR
    // Case 1: user spent 68000 -> saved 110500
    assert.equal(calculateAvoidedSpending(baselineExpected, 68000), 110500);

    // Case 2: user spent 200000 -> negative savings (-21500)
    assert.equal(calculateAvoidedSpending(baselineExpected, 200000), -21500);
  });

  await t.test('future projections generate exact integers', () => {
    const proj = calculateSavingsProjections(25500);
    assert.equal(proj.days30, 25500 * 30);
    assert.equal(proj.days90, 25500 * 90);
    assert.equal(proj.days365, 25500 * 365);
  });
});

test('Sleep Engine Cross-Midnight Attribution', async (t) => {
  await t.test('associates 01:30 AM sleep with the previous evening', () => {
    // 2026-11-07 01:30:00 Asia/Jakarta (UTC 2026-11-06 18:30:00Z)
    const sleepStart = Date.parse('2026-11-06T18:30:00Z');
    const nightKey = getSleepNightKey(sleepStart, 4);
    assert.equal(nightKey, '2026-11-06', 'Sleep at 01:30 AM on Nov 7 must belong to night of Nov 6');
  });

  await t.test('evaluates sleep lateness and duration', () => {
    // Bedtime 23:00 (1380 min), wake 06:30. Sleep start at 00:30 (90 min late), wake at 07:30
    // 2026-11-06 23:00 Asia/Jakarta is UTC 16:00
    const targetBedtime = Date.parse('2026-11-06T16:00:00Z');
    const sleepStart = Date.parse('2026-11-06T17:30:00Z'); // 90 min later
    const sleepEnd = Date.parse('2026-11-07T00:30:00Z'); // 7 hours later

    const info = evaluateSleepSession(sleepStart, sleepEnd, 23 * 60, 15, 4);
    assert.equal(info.nightDayKey, '2026-11-06');
    assert.equal(info.lateMin, 90);
    assert.equal(info.isOnTime, false);
    assert.equal(info.durationMs, 7 * 3600_000);
  });
});

test('Streak Engine with Strict Verification', async (t) => {
  const history = [
    { dayKey: '2026-11-06', isVerified: true, smokeCompliant: true, pmoCompliant: true, sleepCompliant: true, allCompliant: true },
    { dayKey: '2026-11-05', isVerified: true, smokeCompliant: true, pmoCompliant: true, sleepCompliant: true, allCompliant: true },
    // 2026-11-04 is MISSING/UNVERIFIED
    { dayKey: '2026-11-03', isVerified: true, smokeCompliant: true, pmoCompliant: true, sleepCompliant: true, allCompliant: true },
    { dayKey: '2026-11-02', isVerified: true, smokeCompliant: true, pmoCompliant: true, sleepCompliant: true, allCompliant: true },
    { dayKey: '2026-11-01', isVerified: true, smokeCompliant: true, pmoCompliant: true, sleepCompliant: true, allCompliant: true },
  ];

  await t.test('unverified day breaks the streak', () => {
    const res = calculateStreak(history, '2026-11-06', 'smoke');
    // Days 6 and 5 are compliant (2 days). Day 4 is missing, so current streak stops at 2!
    assert.equal(res.current, 2);
    // Longest streak was 3 days (1, 2, 3)
    assert.equal(res.longest, 3);
  });
});

test('Validation Guards', async (t) => {
  await t.test('validates smoke quantities', () => {
    assert.equal(validateSmokeQty(1), 1);
    assert.throws(() => validateSmokeQty(0), ValidationError);
    assert.throws(() => validateSmokeQty(-2), ValidationError);
    assert.throws(() => validateSmokeQty(1.5), ValidationError);
  });

  await t.test('validates monetary prices', () => {
    assert.equal(validatePrice(34000), 34000);
    assert.equal(validatePrice(0), 0);
    assert.throws(() => validatePrice(-500), ValidationError);
    assert.throws(() => validatePrice(2500.5), ValidationError);
  });

  await t.test('validates PMO types', () => {
    assert.equal(validatePmoType('p'), 'p');
    assert.equal(validatePmoType('m'), 'm');
    assert.equal(validatePmoType('pmo'), 'pmo');
    assert.throws(() => validatePmoType('other'), ValidationError);
  });

  await t.test('validates timestamps against far future', () => {
    const now = Date.now();
    assert.equal(validateTimestamp(now), now);
    assert.throws(() => validateTimestamp(now + 3600_000 * 24), ValidationError);
    assert.throws(() => validateTimestamp(-100), ValidationError);
  });
});

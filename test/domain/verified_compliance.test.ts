import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIndex, dayStat, streaks } from '../../src/data/selectors';
import { DEFAULT_SETTINGS, type Entry } from '../../src/data/types';
import { dayKey, addDays } from '../../src/lib/format';

test('Habit Verification Integrity: Purchases & Urges vs Abstinence', async (t) => {
  const settings = {
    ...DEFAULT_SETTINGS,
    habits: { smoke: true, pmo: true, sleep: true },
    smokeTarget: 5,
    pmoTarget: 0,
    dayBoundary: 4,
  };

  const now = Date.now() - 1000;
  const today = dayKey(now, settings.dayBoundary);
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);

  await t.test('1. Cigarette purchase does NOT verify smoking abstinence', () => {
    // Yesterday: user purchased cigarettes, but recorded zero smoking events and no checkin
    const yesterdayPurchaseTime = now - 86_400_000;
    const entries: Entry[] = [
      {
        id: 'p1',
        kind: 'purchase',
        unit: 'bungkus',
        qty: 1,
        price: 35_000,
        at: yesterdayPurchaseTime,
      },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const yesterdayStat = dayStat(index, settings, yesterday);

    // Purchase is counted in financial spend
    assert.equal(yesterdayStat.spend, 35_000);
    assert.equal(yesterdayStat.purchases, 1);
    // Smoke count is 0
    assert.equal(yesterdayStat.smoke, 0);

    // But verifiedHabits.smoke MUST BE false because buying cigarettes does not verify 0 smoking!
    assert.equal(
      yesterdayStat.verifiedHabits.smoke,
      false,
      'Cigarette purchase must not verify smoking abstinence',
    );

    // Streak calculation for smoke: yesterday was unverified, so streak must be 0
    const smokeStreak = streaks(index, settings, today, 'smoke');
    assert.equal(
      smokeStreak.current,
      0,
      'Unverified day with only purchases must not increment abstinence streak',
    );
  });

  await t.test('2. Urge resistance does NOT verify PMO or smoking abstinence', () => {
    // Yesterday: user resisted PMO urge, but no actual PMO log or checkin
    const yesterdayTime = now - 86_400_000;
    const entries: Entry[] = [
      {
        id: 'u1',
        kind: 'urge',
        habit: 'pmo',
        outcome: 'resisted',
        method: 'breath',
        at: yesterdayTime,
      },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const yesterdayStat = dayStat(index, settings, yesterday);

    assert.equal(
      yesterdayStat.verifiedHabits.pmo,
      false,
      'Resisting an urge alone without a check-in does not confirm full-day PMO abstinence',
    );

    const pmoStreak = streaks(index, settings, today, 'pmo');
    assert.equal(pmoStreak.current, 0);
  });

  await t.test('3. Explicit check-in verifies the day for abstinence', () => {
    const yesterdayTime = now - 86_400_000;
    const entries: Entry[] = [
      {
        id: `checkin_${yesterday}`,
        kind: 'checkin',
        at: yesterdayTime,
      },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const yesterdayStat = dayStat(index, settings, yesterday);

    assert.equal(yesterdayStat.verifiedHabits.smoke, true);
    assert.equal(yesterdayStat.verifiedHabits.pmo, true);
    assert.equal(yesterdayStat.verifiedHabits.sleep, true);

    const smokeStreak = streaks(index, settings, today, 'smoke');
    assert.equal(smokeStreak.current, 1, 'Confirmed check-in counts towards streak');
  });

  await t.test('4. Recorded events within target verify compliance', () => {
    // Two days ago: checked in (clean)
    // Yesterday: logged 3 cigarettes (target is 5) -> verified compliance!
    const yesterdayTime = now - 86_400_000;
    const twoDaysAgoTime = now - 2 * 86_400_000;

    const entries: Entry[] = [
      { id: `checkin_${twoDaysAgo}`, kind: 'checkin', at: twoDaysAgoTime },
      { id: 's1', kind: 'smoke', qty: 3, at: yesterdayTime },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const yesterdayStat = dayStat(index, settings, yesterday);

    assert.equal(yesterdayStat.smoke, 3);
    assert.equal(yesterdayStat.verifiedHabits.smoke, true);

    const smokeStreak = streaks(index, settings, today, 'smoke');
    // Both 2 days ago and yesterday are verified compliant
    assert.equal(smokeStreak.current, 2);
  });

  await t.test('5. Violation of target breaks compliance streak', () => {
    const yesterdayTime = now - 86_400_000;
    const twoDaysAgoTime = now - 2 * 86_400_000;

    // Yesterday: logged 6 cigarettes (target is 5) -> target violated!
    const entries: Entry[] = [
      { id: `checkin_${twoDaysAgo}`, kind: 'checkin', at: twoDaysAgoTime },
      { id: 's1', kind: 'smoke', qty: 6, at: yesterdayTime },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const yesterdayStat = dayStat(index, settings, yesterday);

    assert.equal(yesterdayStat.overSmoke, 1);
    assert.equal(yesterdayStat.verifiedHabits.smoke, true); // verified that they smoked 6

    const smokeStreak = streaks(index, settings, today, 'smoke');
    assert.equal(smokeStreak.current, 0, 'Violation of target breaks streak');
  });
});

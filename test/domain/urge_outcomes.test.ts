import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIndex, dayStat } from '../../src/data/selectors';
import { DEFAULT_SETTINGS, type Entry } from '../../src/data/types';
import { dayKey } from '../../src/lib/format';

test('Urge Outcome Preservation & Statistics (Phase 4)', async (t) => {
  const settings = {
    ...DEFAULT_SETTINGS,
    dayBoundary: 4,
  };

  const now = Date.now() - 5000;
  const today = dayKey(now, settings.dayBoundary);

  await t.test('1. Preserves all three urge outcomes: resisted, gave_in, unresolved', () => {
    const entries: Entry[] = [
      { id: 'u_resisted', kind: 'urge', habit: 'smoke', outcome: 'resisted', at: now - 3000 },
      { id: 'u_gave_in', kind: 'urge', habit: 'pmo', outcome: 'gave_in', at: now - 2000 },
      { id: 'u_unresolved', kind: 'urge', habit: 'smoke', outcome: 'unresolved', at: now - 1000 },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const stat = dayStat(index, settings, today);

    // Exact count verification
    assert.equal(stat.urges.resisted, 1, 'resisted count must strictly be 1');
    assert.equal(stat.urges.gaveIn, 1, 'gaveIn count must strictly be 1');
    assert.equal(stat.urges.unresolved, 1, 'unresolved count must strictly be 1');
  });

  await t.test('2. Unresolved urge does not count as resisted or gave_in', () => {
    const entries: Entry[] = [
      { id: 'u1', kind: 'urge', habit: 'smoke', outcome: 'unresolved', at: now },
      { id: 'u2', kind: 'urge', habit: 'smoke', outcome: 'unresolved', at: now - 500 },
    ];

    const index = buildIndex(entries, settings.dayBoundary);
    const stat = dayStat(index, settings, today);

    assert.equal(stat.urges.resisted, 0, 'Unresolved urges must never be counted as resisted');
    assert.equal(stat.urges.gaveIn, 0, 'Unresolved urges must never be counted as gave_in');
    assert.equal(stat.urges.unresolved, 2);
  });
});

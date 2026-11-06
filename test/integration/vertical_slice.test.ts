import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDatabase } from '../../src/db/node-sqlite.adapter';
import { runMigrations } from '../../src/db/migrations';
import { SmokingRepository, SettingsRepository } from '../../src/repositories';
import { dayStat, buildIndex, streaks } from '../../src/data/selectors';
import { accountability } from '../../src/data/messages';
import { dayKey } from '../../src/lib/format';
import type { Entry } from '../../src/data/types';

test('Smoking Vertical Slice: End-to-End Persistence & Reactive Consequence', async (t) => {
  const db = createTestDatabase();
  await runMigrations(db);

  const smokingRepo = new SmokingRepository(db);
  const settingsRepo = new SettingsRepository(db);

  const settings = await settingsRepo.getSettings();
  const now = Date.now() - 1000;
  const today = dayKey(now, settings.dayBoundary);

  await t.test('1. Step 1-3: Record +1 cigarette and persist to SQLite', async () => {
    const rec = await smokingRepo.add({
      qty: 1,
      timestamp: now,
      trigger: 'stres',
      note: 'Uji vertical slice',
      dayBoundary: settings.dayBoundary,
    });
    assert.ok(rec.id);
    assert.equal(rec.qty, 1);
    assert.equal(rec.dayKey, today);

    // Verify persisted directly in SQLite
    const inDb = await db.getFirstAsync<{ id: string; qty: number; trigger: string }>(
      'SELECT id, qty, trigger FROM smoking_events WHERE id = ?',
      [rec.id],
    );
    assert.ok(inDb);
    assert.equal(inDb.id, rec.id);
    assert.equal(inDb.qty, 1);
    assert.equal(inDb.trigger, 'stres');
  });

  await t.test('2. Step 4-6: Refresh statistics and recalculate consequence state', async () => {
    // Read persisted events from DB
    const persisted = await smokingRepo.getAll();
    const entries: Entry[] = persisted.map((s) => ({
      id: s.id,
      kind: 'smoke',
      qty: s.qty,
      at: s.timestamp,
      trigger: s.trigger,
      note: s.note,
    }));

    const index = buildIndex(entries, settings.dayBoundary);
    const stat = dayStat(index, settings, today);

    // Cigarette count is updated
    assert.equal(stat.smoke, 1);
    // Target is 5, so 1 cigarette is within target -> zone is 'clear'
    assert.equal(stat.zone, 'clear');
    assert.equal(stat.points, 0);

    // Accountability message reflects clear state
    const msg = accountability(stat.zone, stat, settings, 0);
    assert.ok(msg.headline);
    assert.ok(msg.body);
  });

  await t.test('3. Target violation shifts consequence zone and accountability message', async () => {
    // Add 5 more cigarettes (total 6, exceeding target of 5)
    for (let i = 0; i < 5; i++) {
      await smokingRepo.add({
        qty: 1,
        timestamp: now - (i + 1) * 60_000,
        trigger: 'kerja',
        dayBoundary: settings.dayBoundary,
      });
    }

    const persisted = await smokingRepo.getAll();
    const entries: Entry[] = persisted.map((s) => ({
      id: s.id,
      kind: 'smoke',
      qty: s.qty,
      at: s.timestamp,
      trigger: s.trigger,
    }));

    const index = buildIndex(entries, settings.dayBoundary);
    const stat = dayStat(index, settings, today);

    assert.equal(stat.smoke, 6);
    assert.equal(stat.overSmoke, 1);
    // Consequence shifted from 'clear' to 'warning'!
    assert.equal(stat.zone, 'warning');
    assert.equal(stat.points, 1);

    // Accountability message shifts to warning tone
    const msg = accountability(stat.zone, stat, settings, 0);
    assert.ok(msg.headline.toLowerCase().includes('target') || msg.headline.toLowerCase().includes('batas'));
    assert.ok(msg.body.includes('6 batang') || msg.body.includes('rokok'));
  });

  await t.test('4. Undo action reverts the violation and restores consequence zone', async () => {
    const all = await smokingRepo.getAll();
    const lastOne = all[0]; // most recent cigarette

    // Delete (Undo)
    await smokingRepo.delete(lastOne.id);

    const persistedAfterUndo = await smokingRepo.getAll();
    const entriesAfterUndo: Entry[] = persistedAfterUndo.map((s) => ({
      id: s.id,
      kind: 'smoke',
      qty: s.qty,
      at: s.timestamp,
      trigger: s.trigger,
    }));

    const index = buildIndex(entriesAfterUndo, settings.dayBoundary);
    const stat = dayStat(index, settings, today);

    assert.equal(stat.smoke, 5); // Back to target limit
    assert.equal(stat.overSmoke, 0);
    assert.equal(stat.zone, 'clear'); // Zone restored to clear!
    assert.equal(stat.points, 0);
  });

  await t.test('5. Simulation of app restart restores persistent state', async () => {
    // Query directly from raw SQLite to prove data survived
    const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM smoking_events');
    assert.equal(countRow?.count, 5);
  });

  await db.closeAsync();
});

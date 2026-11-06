import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDatabase } from '../../src/db/node-sqlite.adapter';
import { runMigrations } from '../../src/db/migrations';
import {
  SmokingRepository,
  PmoRepository,
  SleepRepository,
  FinanceRepository,
  SettingsRepository,
  UrgeRepository,
  CheckinRepository,
} from '../../src/repositories';
import { DEFAULT_SETTINGS } from '../../src/data/types';

test('Data Safety & Persistence Integrity (Phase 3)', async (t) => {
  const db = createTestDatabase();
  await runMigrations(db);

  const smokingRepo = new SmokingRepository(db);
  const pmoRepo = new PmoRepository(db);
  const sleepRepo = new SleepRepository(db);
  const financeRepo = new FinanceRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const urgeRepo = new UrgeRepository(db);
  const checkinRepo = new CheckinRepository(db);

  await t.test('1. Production records survive and are never truncated (no 500-limit bug)', async () => {
    // Insert 550 records into smoking_events
    const baseTime = Date.now() - 600 * 60_000;
    for (let i = 0; i < 550; i++) {
      await smokingRepo.add({
        id: `smoke_${i}`,
        qty: 1,
        timestamp: baseTime + i * 1000,
      });
    }

    // Call getAll() with no limit parameter
    const allSmokes = await smokingRepo.getAll();
    assert.equal(
      allSmokes.length,
      550,
      'getAll() must retrieve all 550 records without being capped by the old 500 limit',
    );
  });

  await t.test('2. Atomic undo deletes the exact record from SQLite', async () => {
    const rec = await smokingRepo.add({
      id: 'smoke_to_undo',
      qty: 2,
      timestamp: Date.now() - 5000,
      trigger: 'kopi',
    });

    const found = await smokingRepo.getById('smoke_to_undo');
    assert.ok(found);
    assert.equal(found.qty, 2);

    // Perform undo deletion
    const deleted = await smokingRepo.delete('smoke_to_undo');
    assert.equal(deleted, true);

    const afterDelete = await smokingRepo.getById('smoke_to_undo');
    assert.equal(afterDelete, null, 'Deleted record must be completely removed from SQLite');
  });

  await t.test('3. PMO sessions maintain strict integrity and validation', async () => {
    const pmo = await pmoRepo.add({
      id: 'pmo_safety_1',
      type: 'pmo',
      timestamp: Date.now() - 10_000,
      trigger: 'larut_malam',
    });
    assert.ok(pmo);

    const fromDb = await pmoRepo.getById('pmo_safety_1');
    assert.ok(fromDb);
    assert.equal(fromDb.type, 'pmo');

    // Attempting invalid type throws
    await assert.rejects(async () => {
      // @ts-expect-error invalid type test
      await pmoRepo.add({ type: 'invalid_type' });
    });
  });

  await t.test('4. Sleep repository prevents auto-closing active session', async () => {
    const startTime = Date.now() - 7200_000; // 2 hours ago
    const session = await sleepRepo.startSession({
      id: 'sleep_active_1',
      startTime,
      targetBedtimeMin: 23 * 60,
    });
    assert.ok(session);
    assert.equal(session.endTime, undefined);

    const hasActive = await sleepRepo.hasActiveSession();
    assert.equal(hasActive, true);

    const active = await sleepRepo.getActiveSession();
    assert.ok(active);
    assert.equal(active.id, 'sleep_active_1');

    // Ending the session
    const endTime = Date.now() - 1000;
    const ended = await sleepRepo.endSession('sleep_active_1', endTime);
    assert.ok(ended);
    assert.equal(ended.endTime, endTime);

    const hasActiveAfter = await sleepRepo.hasActiveSession();
    assert.equal(hasActiveAfter, false);
  });

  await t.test('5. Explicit wipe clears activity tables while preserving user settings', async () => {
    // Ensure settings are modified from defaults
    await settingsRepo.updateSettings({ smokeTarget: 8, intensity: 'strict' });
    const sBefore = await settingsRepo.getSettings();
    assert.equal(sBefore.smokeTarget, 8);
    assert.equal(sBefore.intensity, 'strict');

    // Execute wipe of activity records
    await db.execAsync(`
      DELETE FROM smoking_events;
      DELETE FROM pmo_events;
      DELETE FROM sleep_sessions;
      DELETE FROM cigarette_purchases;
      DELETE FROM urge_events;
      DELETE FROM daily_checkins;
    `);

    // Activity tables must be empty
    const remainingSmokes = await smokingRepo.getAll();
    assert.equal(remainingSmokes.length, 0);

    // Settings must remain 100% intact!
    const sAfter = await settingsRepo.getSettings();
    assert.equal(sAfter.smokeTarget, 8);
    assert.equal(sAfter.intensity, 'strict');
  });

  await t.test('6. Check-in persists and is idempotent', async () => {
    const today = '2026-11-07';
    const c1 = await checkinRepo.confirmClean(today, 'Bersih tanpa rokok');
    assert.equal(c1.dayKey, today);
    assert.equal(c1.status, 'clean_confirmed');

    const c2 = await checkinRepo.confirmClean(today, 'Catatan diperbarui');
    assert.equal(c2.dayKey, today);
    assert.equal(c2.note, 'Catatan diperbarui');

    const checkins = await checkinRepo.getAll();
    assert.equal(checkins.filter((c) => c.dayKey === today).length, 1);
  });
});

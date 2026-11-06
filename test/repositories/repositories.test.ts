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

test('Repositories Integration Suite (Real SQLite)', async (t) => {
  const db = createTestDatabase();
  await runMigrations(db);

  const smokingRepo = new SmokingRepository(db);
  const pmoRepo = new PmoRepository(db);
  const sleepRepo = new SleepRepository(db);
  const financeRepo = new FinanceRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const urgeRepo = new UrgeRepository(db);
  const checkinRepo = new CheckinRepository(db);

  await t.test('Smoking Repository CRUD & Undo flow', async () => {
    // 1. Add cigarette
    const now = Date.now() - 60_000;
    const added = await smokingRepo.add({
      qty: 1,
      timestamp: now,
      trigger: 'kopi',
      note: 'pagi hari',
    });
    assert.ok(added.id);
    assert.equal(added.qty, 1);
    assert.equal(added.trigger, 'kopi');

    // 2. Query
    const retrieved = await smokingRepo.getById(added.id);
    assert.ok(retrieved);
    assert.equal(retrieved.id, added.id);
    assert.equal(retrieved.qty, 1);

    // 3. Update
    const updated = await smokingRepo.update(added.id, { qty: 3, note: 'direvisi jadi 3' });
    assert.ok(updated);
    assert.equal(updated.qty, 3);
    assert.equal(updated.note, 'direvisi jadi 3');

    // 4. Undo / Delete
    const deleted = await smokingRepo.delete(added.id);
    assert.equal(deleted, true);
    const postDelete = await smokingRepo.getById(added.id);
    assert.equal(postDelete, null);
  });

  await t.test('PMO Repository Session Integrity', async () => {
    const now = Date.now() - 60_000;
    const rec = await pmoRepo.add({
      type: 'pmo',
      timestamp: now,
      trigger: 'larut_malam',
    });
    assert.equal(rec.type, 'pmo');

    const byRange = await pmoRepo.getByDateRange(rec.dayKey, rec.dayKey);
    assert.equal(byRange.length, 1);
    assert.equal(byRange[0].type, 'pmo');

    await pmoRepo.delete(rec.id);
  });

  await t.test('Sleep Repository Active Session & Cross-Midnight Management', async () => {
    // Sleep start at 01:00 AM on Nov 7 (belongs to night of Nov 6)
    const sleepStart = Date.now() - 3600_000 * 8;
    const sleepEnd = Date.now() - 3600_000 * 1.5;

    const session = await sleepRepo.startSession({
      startTime: sleepStart,
      targetBedtimeMin: 23 * 60,
      note: 'Malam jumat',
    });
    assert.ok(session.nightDayKey);
    assert.equal(session.endTime, undefined);

    // Active session lookup
    const active = await sleepRepo.getActiveSession();
    assert.ok(active);
    assert.equal(active.id, session.id);

    // End session
    const finalized = await sleepRepo.endSession(session.id, sleepEnd);
    assert.ok(finalized);
    assert.equal(finalized.endTime, sleepEnd);

    // No longer active
    const activeAfter = await sleepRepo.getActiveSession();
    assert.equal(activeAfter, null);

    await sleepRepo.delete(session.id);
  });

  await t.test('Finance Repository Integer IDR Calculation', async () => {
    const now = Date.now() - 60_000;
    const p1 = await financeRepo.addPurchase({
      unit: 'bungkus',
      qty: 1,
      price: 34000,
      brand: 'Surya 16',
      timestamp: now,
    });
    const p2 = await financeRepo.addPurchase({
      unit: 'batang',
      qty: 3,
      price: 7500,
      timestamp: now,
    });

    const total = await financeRepo.getTotalSpend(p1.dayKey, p1.dayKey);
    assert.equal(total, 41500, 'Sum of purchases must equal exact integer IDR total');

    await financeRepo.delete(p1.id);
    await financeRepo.delete(p2.id);
  });

  await t.test('Settings Repository Singleton Persistence', async () => {
    const s = await settingsRepo.getSettings();
    assert.equal(s.smokeTarget, 5);
    assert.equal(s.onboarded, false);

    const updated = await settingsRepo.updateSettings({
      smokeTarget: 3,
      onboarded: true,
      intensity: 'strict',
    });
    assert.equal(updated.smokeTarget, 3);
    assert.equal(updated.onboarded, true);
    assert.equal(updated.intensity, 'strict');

    // Re-read from DB
    const fresh = await settingsRepo.getSettings();
    assert.equal(fresh.smokeTarget, 3);
    assert.equal(fresh.onboarded, true);
    assert.equal(fresh.intensity, 'strict');
  });

  await t.test('Urge & Checkin Repositories', async () => {
    const now = Date.now() - 60_000;
    const urge = await urgeRepo.add({
      habit: 'smoke',
      outcome: 'resisted',
      method: 'breath',
      timestamp: now,
    });
    assert.equal(urge.outcome, 'resisted');
    assert.equal(urge.method, 'breath');

    // Checkin clean confirmation
    const checkin = await checkinRepo.confirmClean('2026-11-07', 'Hari ini aman tanpa rokok');
    assert.equal(checkin.status, 'clean_confirmed');

    const read = await checkinRepo.getCheckin('2026-11-07');
    assert.ok(read);
    assert.equal(read.status, 'clean_confirmed');
  });

  await db.closeAsync();
});

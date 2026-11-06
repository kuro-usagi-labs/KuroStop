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
import {
  createBackup,
  validateBackup,
  restoreBackup,
  calculateChecksum,
  type KuroStopBackupV1,
} from '../../src/lib/backup';

test('Offline Backup & Restore Integrity (Phase 4)', async (t) => {
  const db = createTestDatabase();
  await runMigrations(db);

  const smokingRepo = new SmokingRepository(db);
  const pmoRepo = new PmoRepository(db);
  const sleepRepo = new SleepRepository(db);
  const financeRepo = new FinanceRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const urgeRepo = new UrgeRepository(db);
  const checkinRepo = new CheckinRepository(db);

  // Seed sample records
  await smokingRepo.add({ id: 's_b1', qty: 3, timestamp: Date.now() - 3600_000, trigger: 'kopi' });
  await pmoRepo.add({ id: 'p_b1', type: 'pmo', timestamp: Date.now() - 7200_000, trigger: 'bosan' });
  await sleepRepo.startSession({ id: 'sl_b1', startTime: Date.now() - 86400_000, targetBedtimeMin: 23 * 60 });
  await sleepRepo.endSession('sl_b1', Date.now() - 60000_000);
  await financeRepo.addPurchase({ id: 'f_b1', unit: 'bungkus', qty: 2, price: 70_000, brand: 'Surya' });
  await urgeRepo.add({ id: 'u_b1', habit: 'smoke', outcome: 'resisted', method: 'breath' });
  await checkinRepo.confirmClean('2026-11-06', 'Kemarin bersih');
  await settingsRepo.updateSettings({ smokeTarget: 7, intensity: 'strict' });

  let exportedBackup!: KuroStopBackupV1;

  await t.test('1. Creates complete valid backup with checksum', async () => {
    exportedBackup = await createBackup(db);

    assert.equal(exportedBackup.version, 1);
    assert.equal(exportedBackup.appName, 'KuroStop');
    assert.ok(exportedBackup.exportedAt);
    assert.ok(exportedBackup.checksum);
    assert.equal(exportedBackup.data.smoking.length, 1);
    assert.equal(exportedBackup.data.pmo.length, 1);
    assert.equal(exportedBackup.data.sleep.length, 1);
    assert.equal(exportedBackup.data.purchases.length, 1);
    assert.equal(exportedBackup.data.urges.length, 1);
    assert.equal(exportedBackup.data.checkins.length, 1);
    assert.equal(exportedBackup.data.settings.smokeTarget, 7);

    const validation = validateBackup(exportedBackup);
    assert.equal(validation.valid, true);
    assert.equal(validation.error, undefined);
  });

  await t.test('2. Validates and rejects corrupt or tampered backups', () => {
    // Tampered data
    const tampered = JSON.parse(JSON.stringify(exportedBackup));
    tampered.data.smoking[0].qty = 999; // Modified without updating checksum
    const validation = validateBackup(tampered);
    assert.equal(validation.valid, false);
    assert.match(validation.error || '', /Checksum/);

    // Wrong app name
    const foreign = JSON.parse(JSON.stringify(exportedBackup));
    foreign.appName = 'OtherHabitApp';
    assert.equal(validateBackup(foreign).valid, false);

    // Unsupported version
    const futureVer = JSON.parse(JSON.stringify(exportedBackup));
    futureVer.version = 99;
    assert.equal(validateBackup(futureVer).valid, false);
  });

  await t.test('3. Transactional restore restores all tables and settings accurately', async () => {
    // Create a fresh clean database
    const freshDb = createTestDatabase();
    await runMigrations(freshDb);

    // Restore into freshDb
    await restoreBackup(freshDb, exportedBackup);

    const freshSmoking = new SmokingRepository(freshDb);
    const freshPmo = new PmoRepository(freshDb);
    const freshSettings = new SettingsRepository(freshDb);
    const freshCheckin = new CheckinRepository(freshDb);

    const smokes = await freshSmoking.getAll();
    assert.equal(smokes.length, 1);
    assert.equal(smokes[0].id, 's_b1');
    assert.equal(smokes[0].qty, 3);

    const pmos = await freshPmo.getAll();
    assert.equal(pmos.length, 1);
    assert.equal(pmos[0].id, 'p_b1');
    assert.equal(pmos[0].type, 'pmo');

    const s = await freshSettings.getSettings();
    assert.equal(s.smokeTarget, 7);
    assert.equal(s.intensity, 'strict');

    const checkins = await freshCheckin.getAll();
    assert.equal(checkins.length, 1);
    assert.equal(checkins[0].dayKey, '2026-11-06');
  });

  await t.test('4. Failed restore rolls back completely and preserves original database', async () => {
    // Modify exported backup so an invalid record violates SQLite CHECK constraint (e.g. qty <= 0)
    const invalidBackup = JSON.parse(JSON.stringify(exportedBackup)) as KuroStopBackupV1;
    invalidBackup.data.smoking.push({
      id: 'bad_smoke',
      qty: -5, // Violates CHECK(qty > 0)
      timestamp: Date.now(),
      timezoneOffsetMs: 25200000,
      dayKey: '2026-11-07',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    // Recalculate checksum so it passes initial structure validation but fails in SQLite transaction
    invalidBackup.checksum = calculateChecksum(JSON.stringify(invalidBackup.data));

    // Attempt to restore into db
    await assert.rejects(async () => {
      await restoreBackup(db, invalidBackup);
    });

    // Original records in db MUST remain completely preserved!
    const smokesAfterRollback = await smokingRepo.getAll();
    assert.equal(smokesAfterRollback.length, 1, 'Original smoking record must survive failed restore transaction');
    assert.equal(smokesAfterRollback[0].id, 's_b1');

    const sAfterRollback = await settingsRepo.getSettings();
    assert.equal(sAfterRollback.smokeTarget, 7, 'Original settings must remain intact');
  });
});

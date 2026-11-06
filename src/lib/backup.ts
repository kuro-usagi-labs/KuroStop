/**
 * Offline Backup & Restore Engine for KuroStop.
 * Provides:
 * 1. Full transactional export to versioned JSON format.
 * 2. Strict schema and checksum validation.
 * 3. Transactional atomic restoration with rollback on failure.
 *
 * Ensures 100% offline data portability across iOS sideload reinstalls and updates.
 */

import type { IDatabase } from '../db/database.interface';
import {
  SmokingRepository,
  PmoRepository,
  SleepRepository,
  FinanceRepository,
  SettingsRepository,
  UrgeRepository,
  CheckinRepository,
  type SmokingRecord,
  type PmoRecord,
  type SleepRecord,
  type PurchaseRecord,
  type UrgeRecord,
  type CheckinRecord,
} from '../repositories';
import type { Settings } from '../data/types';

export type KuroStopBackupV1 = {
  version: 1;
  appName: 'KuroStop';
  exportedAt: string;
  checksum: string;
  data: {
    settings: Settings;
    smoking: SmokingRecord[];
    pmo: PmoRecord[];
    sleep: SleepRecord[];
    purchases: PurchaseRecord[];
    urges: UrgeRecord[];
    checkins: CheckinRecord[];
  };
};

/**
 * Fast, deterministic FNV-1a 32-bit checksum for payload integrity verification.
 */
export function calculateChecksum(dataStr: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dataStr.length; i++) {
    hash ^= dataStr.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Creates a complete offline backup of all SQLite data.
 */
export async function createBackup(db: IDatabase): Promise<KuroStopBackupV1> {
  const smokingRepo = new SmokingRepository(db);
  const pmoRepo = new PmoRepository(db);
  const sleepRepo = new SleepRepository(db);
  const financeRepo = new FinanceRepository(db);
  const settingsRepo = new SettingsRepository(db);
  const urgeRepo = new UrgeRepository(db);
  const checkinRepo = new CheckinRepository(db);

  const [settings, smoking, pmo, sleep, purchases, urges, checkins] = await Promise.all([
    settingsRepo.getSettings(),
    smokingRepo.getAll(),
    pmoRepo.getAll(),
    sleepRepo.getAll(),
    financeRepo.getAll(),
    urgeRepo.getAll(),
    checkinRepo.getAll(),
  ]);

  const payloadData = {
    settings,
    smoking,
    pmo,
    sleep,
    purchases,
    urges,
    checkins,
  };

  const payloadStr = JSON.stringify(payloadData);
  const checksum = calculateChecksum(payloadStr);

  return {
    version: 1,
    appName: 'KuroStop',
    exportedAt: new Date().toISOString(),
    checksum,
    data: payloadData,
  };
}

export type ValidationResult = {
  valid: boolean;
  error?: string;
  itemCount?: {
    smoking: number;
    pmo: number;
    sleep: number;
    purchases: number;
    urges: number;
    checkins: number;
  };
  backup?: KuroStopBackupV1;
};

/**
 * Validates a parsed backup object for schema conformity and integrity.
 */
export function validateBackup(backup: unknown): ValidationResult {
  if (!backup || typeof backup !== 'object') {
    return { valid: false, error: 'Format berkas cadangan tidak valid (bukan JSON objek).' };
  }

  const b = backup as Record<string, unknown>;

  if (b.appName !== 'KuroStop') {
    return { valid: false, error: 'Berkas cadangan ini bukan berasal dari KuroStop.' };
  }

  if (b.version !== 1) {
    return { valid: false, error: `Versi skema cadangan tidak didukung (v${b.version}).` };
  }

  if (!b.data || typeof b.data !== 'object') {
    return { valid: false, error: 'Data cadangan kosong atau rusak.' };
  }

  const data = b.data as Record<string, unknown>;

  if (!Array.isArray(data.smoking) || !Array.isArray(data.pmo) || !Array.isArray(data.sleep) ||
      !Array.isArray(data.purchases) || !Array.isArray(data.urges) || !Array.isArray(data.checkins)) {
    return { valid: false, error: 'Struktur tabel cadangan tidak lengkap atau tidak valid.' };
  }

  // Validate checksum
  const expectedChecksum = calculateChecksum(JSON.stringify(data));
  if (b.checksum !== expectedChecksum) {
    return { valid: false, error: 'Integritas data gagal: Checksum berkas tidak cocok (data mungkin rusak/termodifikasi).' };
  }

  return {
    valid: true,
    itemCount: {
      smoking: data.smoking.length,
      pmo: data.pmo.length,
      sleep: data.sleep.length,
      purchases: data.purchases.length,
      urges: data.urges.length,
      checkins: data.checkins.length,
    },
    backup: backup as KuroStopBackupV1,
  };
}

/**
 * Atomically restores the database from a validated backup.
 * Executed inside a single transaction with automatic rollback on error.
 */
export async function restoreBackup(db: IDatabase, backup: KuroStopBackupV1): Promise<void> {
  const validation = validateBackup(backup);
  if (!validation.valid || !validation.backup) {
    throw new Error(validation.error || 'Validasi cadangan gagal');
  }

  const { data } = validation.backup;

  await db.withTransactionAsync(async () => {
    // 1. Clear existing activity tables
    await db.execAsync(`
      DELETE FROM smoking_events;
      DELETE FROM pmo_events;
      DELETE FROM sleep_sessions;
      DELETE FROM cigarette_purchases;
      DELETE FROM urge_events;
      DELETE FROM daily_checkins;
    `);

    // 2. Restore smoking events
    for (const s of data.smoking) {
      await db.runAsync(
        `INSERT INTO smoking_events (
          id, qty, timestamp, timezone_offset_ms, day_key, trigger, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.qty, s.timestamp, s.timezoneOffsetMs, s.dayKey, s.trigger ?? null, s.note ?? null, s.createdAt, s.updatedAt],
      );
    }

    // 3. Restore PMO events
    for (const p of data.pmo) {
      await db.runAsync(
        `INSERT INTO pmo_events (
          id, type, timestamp, timezone_offset_ms, day_key, trigger, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.type, p.timestamp, p.timezoneOffsetMs, p.dayKey, p.trigger ?? null, p.note ?? null, p.createdAt, p.updatedAt],
      );
    }

    // 4. Restore sleep sessions
    for (const sl of data.sleep) {
      await db.runAsync(
        `INSERT INTO sleep_sessions (
          id, start_time, end_time, target_bedtime_min, night_day_key, timezone_offset_ms, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sl.id, sl.startTime, sl.endTime ?? null, sl.targetBedtimeMin, sl.nightDayKey, sl.timezoneOffsetMs, sl.note ?? null, sl.createdAt, sl.updatedAt],
      );
    }

    // 5. Restore cigarette purchases
    for (const pu of data.purchases) {
      await db.runAsync(
        `INSERT INTO cigarette_purchases (
          id, unit, qty, price, brand, timestamp, day_key, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pu.id, pu.unit, pu.qty, pu.price, pu.brand ?? null, pu.timestamp, pu.dayKey, pu.note ?? null, pu.createdAt, pu.updatedAt],
      );
    }

    // 6. Restore urge events
    for (const u of data.urges) {
      await db.runAsync(
        `INSERT INTO urge_events (
          id, habit, timestamp, day_key, outcome, method, trigger, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.habit, u.timestamp, u.dayKey, u.outcome, u.method ?? null, u.trigger ?? null, u.note ?? null, u.createdAt],
      );
    }

    // 7. Restore checkins
    for (const c of data.checkins) {
      await db.runAsync(
        `INSERT INTO daily_checkins (
          day_key, status, timestamp, note
        ) VALUES (?, ?, ?, ?)`,
        [c.dayKey, c.status, c.timestamp, c.note ?? null],
      );
    }

    // 8. Restore personal settings
    const settingsRepo = new SettingsRepository(db);
    await settingsRepo.updateSettings({ ...data.settings, onboarded: true });
  });
}

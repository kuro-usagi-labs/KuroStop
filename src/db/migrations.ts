/**
 * Migration Manager for KuroStop.
 * Executes migrations sequentially in transactions and seeds initial configuration.
 */

import type { IDatabase } from './database.interface';
import { MIGRATION_V1_SQL } from './schema';
import { DEFAULT_SETTINGS } from '../data/types';

export type Migration = {
  version: number;
  name: string;
  up: (db: IDatabase) => Promise<void>;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema_v1',
    up: async (db: IDatabase) => {
      await db.execAsync(MIGRATION_V1_SQL);
      // Seed default settings row if not present
      const existing = await db.getFirstAsync<{ key: string }>(
        "SELECT key FROM personal_settings WHERE key = 'current'",
      );
      if (!existing) {
        const s = DEFAULT_SETTINGS;
        const now = Date.now();
        await db.runAsync(
          `INSERT INTO personal_settings (
            key, habits_json, smoke_target, pmo_target, bedtime, wake, late_grace,
            baseline_per_day, pack_price, pack_size, single_price, sensitivity,
            intensity, messages_on, notif_json, app_lock, pmo_cover, reduce_motion,
            day_boundary, onboarded, baseline_effective_date, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'current',
            JSON.stringify(s.habits),
            s.smokeTarget,
            s.pmoTarget,
            s.bedtime,
            s.wake,
            s.lateGrace,
            s.baselinePerDay,
            s.packPrice,
            s.packSize,
            s.singlePrice,
            s.sensitivity,
            s.intensity,
            s.messagesOn ? 1 : 0,
            JSON.stringify(s.notif),
            s.appLock ? 1 : 0,
            s.pmoCover ? 1 : 0,
            s.reduceMotion,
            s.dayBoundary,
            0, // onboarded defaults to 0 (uncompleted) for real user
            new Date().toISOString().slice(0, 10),
            now,
          ],
        );
      }
    },
  },
];

export async function runMigrations(db: IDatabase): Promise<void> {
  // Ensure migration table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC',
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const m of MIGRATIONS) {
    if (!appliedVersions.has(m.version)) {
      await db.withTransactionAsync(async () => {
        await m.up(db);
        await db.runAsync(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
          [m.version, m.name, Date.now()],
        );
      });
    }
  }
}

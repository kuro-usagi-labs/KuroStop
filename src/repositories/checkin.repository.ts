/**
 * Daily Check-in Repository.
 * Manages explicit verification records for days without habit events.
 */

import type { IDatabase } from '../db/database.interface';

export type CheckinRecord = {
  dayKey: string;
  status: 'clean_confirmed' | 'unverified';
  timestamp: number;
  note?: string;
};

type DbCheckinRow = {
  day_key: string;
  status: string;
  timestamp: number;
  note: string | null;
};

export class CheckinRepository {
  constructor(private readonly db: IDatabase) {}

  async confirmClean(dayKey: string, note?: string): Promise<CheckinRecord> {
    const now = Date.now();
    await this.db.runAsync(
      `INSERT INTO daily_checkins (day_key, status, timestamp, note)
       VALUES (?, 'clean_confirmed', ?, ?)
       ON CONFLICT(day_key) DO UPDATE SET
         status = 'clean_confirmed',
         timestamp = excluded.timestamp,
         note = excluded.note`,
      [dayKey, now, note ?? null],
    );

    return {
      dayKey,
      status: 'clean_confirmed',
      timestamp: now,
      note,
    };
  }

  async getCheckin(dayKey: string): Promise<CheckinRecord | null> {
    const row = await this.db.getFirstAsync<DbCheckinRow>(
      'SELECT * FROM daily_checkins WHERE day_key = ?',
      [dayKey],
    );
    if (!row) return null;
    return {
      dayKey: row.day_key,
      status: row.status as 'clean_confirmed' | 'unverified',
      timestamp: row.timestamp,
      note: row.note || undefined,
    };
  }

  async getCheckinsByRange(startDayKey: string, endDayKey: string): Promise<Map<string, CheckinRecord>> {
    const rows = await this.db.getAllAsync<DbCheckinRow>(
      'SELECT * FROM daily_checkins WHERE day_key >= ? AND day_key <= ?',
      [startDayKey, endDayKey],
    );
    const map = new Map<string, CheckinRecord>();
    for (const r of rows) {
      map.set(r.day_key, {
        dayKey: r.day_key,
        status: r.status as 'clean_confirmed' | 'unverified',
        timestamp: r.timestamp,
        note: r.note || undefined,
      });
    }
    return map;
  }

  async getAll(limit?: number): Promise<CheckinRecord[]> {
    const sql = limit
      ? 'SELECT * FROM daily_checkins ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM daily_checkins ORDER BY timestamp DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbCheckinRow>(sql, params);
    return rows.map((r) => ({
      dayKey: r.day_key,
      status: r.status as 'clean_confirmed' | 'unverified',
      timestamp: r.timestamp,
      note: r.note || undefined,
    }));
  }
}

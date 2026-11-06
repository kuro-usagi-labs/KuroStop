/**
 * Sleep Repository with cross-midnight attribution and active session management.
 */

import type { IDatabase } from '../db/database.interface';
import { uid } from '../lib/format';
import { getSleepNightKey } from '../domain/sleep';
import { validateSleepTimes } from '../domain/validation';

export type SleepRecord = {
  id: string;
  startTime: number;
  endTime?: number;
  targetBedtimeMin: number;
  nightDayKey: string;
  timezoneOffsetMs: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

type DbSleepRow = {
  id: string;
  start_time: number;
  end_time: number | null;
  target_bedtime_min: number;
  night_day_key: string;
  timezone_offset_ms: number;
  note: string | null;
  created_at: number;
  updated_at: number;
};

function mapRow(r: DbSleepRow): SleepRecord {
  return {
    id: r.id,
    startTime: r.start_time,
    endTime: r.end_time || undefined,
    targetBedtimeMin: r.target_bedtime_min,
    nightDayKey: r.night_day_key,
    timezoneOffsetMs: r.timezone_offset_ms,
    note: r.note || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class SleepRepository {
  constructor(private readonly db: IDatabase) {}

  async startSession(params: {
    id?: string;
    startTime?: number;
    targetBedtimeMin: number;
    note?: string;
    dayBoundary?: number;
    forceEndPrevious?: boolean;
  }): Promise<SleepRecord> {
    const start = params.startTime ?? Date.now();
    validateSleepTimes(start);

    // Explicit conflict check: do not silently end an active session without explicit flag
    const active = await this.getActiveSession();
    if (active) {
      if (!params.forceEndPrevious) {
        throw new Error('Sesi tidur aktif masih berjalan. Selesaikan atau batalkan sesi sebelumnya terlebih dahulu.');
      }
      await this.endSession(active.id, start);
    }

    const id = params.id ?? uid();
    const b = params.dayBoundary ?? 4;
    const nightKey = getSleepNightKey(start, b);
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO sleep_sessions (
        id, start_time, end_time, target_bedtime_min, night_day_key, timezone_offset_ms, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, start, null, params.targetBedtimeMin, nightKey, 25200000, params.note ?? null, now, now],
    );

    return {
      id,
      startTime: start,
      targetBedtimeMin: params.targetBedtimeMin,
      nightDayKey: nightKey,
      timezoneOffsetMs: 25200000,
      note: params.note,
      createdAt: now,
      updatedAt: now,
    };
  }

  async endSession(id: string, endTime?: number): Promise<SleepRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const end = endTime ?? Date.now();
    validateSleepTimes(existing.startTime, end);
    const now = Date.now();

    await this.db.runAsync(
      'UPDATE sleep_sessions SET end_time = ?, updated_at = ? WHERE id = ?',
      [end, now, id],
    );

    return {
      ...existing,
      endTime: end,
      updatedAt: now,
    };
  }

  async getActiveSession(): Promise<SleepRecord | null> {
    const row = await this.db.getFirstAsync<DbSleepRow>(
      'SELECT * FROM sleep_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1',
    );
    return row ? mapRow(row) : null;
  }

  async hasActiveSession(): Promise<boolean> {
    const active = await this.getActiveSession();
    return active !== null;
  }

  async discardSession(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async getById(id: string): Promise<SleepRecord | null> {
    const row = await this.db.getFirstAsync<DbSleepRow>(
      'SELECT * FROM sleep_sessions WHERE id = ?',
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    patch: { startTime?: number; endTime?: number; targetBedtimeMin?: number; note?: string; dayBoundary?: number },
  ): Promise<SleepRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const start = patch.startTime ?? existing.startTime;
    const end = patch.endTime !== undefined ? patch.endTime : existing.endTime;
    validateSleepTimes(start, end);

    const b = patch.dayBoundary ?? 4;
    const nightKey = getSleepNightKey(start, b);
    const target = patch.targetBedtimeMin ?? existing.targetBedtimeMin;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const now = Date.now();

    await this.db.runAsync(
      `UPDATE sleep_sessions SET
        start_time = ?, end_time = ?, target_bedtime_min = ?, night_day_key = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [start, end ?? null, target, nightKey, note ?? null, now, id],
    );

    return {
      ...existing,
      startTime: start,
      endTime: end,
      targetBedtimeMin: target,
      nightDayKey: nightKey,
      note,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.runAsync('DELETE FROM sleep_sessions WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getByNightKey(nightDayKey: string): Promise<SleepRecord | null> {
    const row = await this.db.getFirstAsync<DbSleepRow>(
      'SELECT * FROM sleep_sessions WHERE night_day_key = ? ORDER BY start_time DESC LIMIT 1',
      [nightDayKey],
    );
    return row ? mapRow(row) : null;
  }

  async getByDateRange(startNightKey: string, endNightKey: string): Promise<SleepRecord[]> {
    const rows = await this.db.getAllAsync<DbSleepRow>(
      'SELECT * FROM sleep_sessions WHERE night_day_key >= ? AND night_day_key <= ? ORDER BY start_time DESC',
      [startNightKey, endNightKey],
    );
    return rows.map(mapRow);
  }

  async getAll(limit?: number): Promise<SleepRecord[]> {
    const sql = limit ? 'SELECT * FROM sleep_sessions ORDER BY start_time DESC LIMIT ?' : 'SELECT * FROM sleep_sessions ORDER BY start_time DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbSleepRow>(sql, params);
    return rows.map(mapRow);
  }
}

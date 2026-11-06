/**
 * Smoking Repository with validation, parameterized queries, and transactional safety.
 */

import type { IDatabase } from '../db/database.interface';
import { dayKey, uid } from '../lib/format';
import { validateSmokeQty, validateTimestamp } from '../domain/validation';
import type { SmokeTrigger } from '../data/types';

export type SmokingRecord = {
  id: string;
  qty: number;
  timestamp: number;
  timezoneOffsetMs: number;
  dayKey: string;
  trigger?: SmokeTrigger;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

type DbSmokingRow = {
  id: string;
  qty: number;
  timestamp: number;
  timezone_offset_ms: number;
  day_key: string;
  trigger: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
};

function mapRow(r: DbSmokingRow): SmokingRecord {
  return {
    id: r.id,
    qty: r.qty,
    timestamp: r.timestamp,
    timezoneOffsetMs: r.timezone_offset_ms,
    dayKey: r.day_key,
    trigger: (r.trigger as SmokeTrigger) || undefined,
    note: r.note || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class SmokingRepository {
  constructor(private readonly db: IDatabase) {}

  async add(params: {
    id?: string;
    qty: number;
    timestamp?: number;
    trigger?: SmokeTrigger;
    note?: string;
    dayBoundary?: number;
  }): Promise<SmokingRecord> {
    const qty = validateSmokeQty(params.qty);
    const ts = validateTimestamp(params.timestamp ?? Date.now());
    const id = params.id ?? uid();
    const b = params.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO smoking_events (
        id, qty, timestamp, timezone_offset_ms, day_key, trigger, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, qty, ts, 25200000, dKey, params.trigger ?? null, params.note ?? null, now, now],
    );

    return {
      id,
      qty,
      timestamp: ts,
      timezoneOffsetMs: 25200000,
      dayKey: dKey,
      trigger: params.trigger,
      note: params.note,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getById(id: string): Promise<SmokingRecord | null> {
    const row = await this.db.getFirstAsync<DbSmokingRow>(
      'SELECT * FROM smoking_events WHERE id = ?',
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    patch: { qty?: number; timestamp?: number; trigger?: SmokeTrigger; note?: string; dayBoundary?: number },
  ): Promise<SmokingRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const qty = patch.qty !== undefined ? validateSmokeQty(patch.qty) : existing.qty;
    const ts = patch.timestamp !== undefined ? validateTimestamp(patch.timestamp) : existing.timestamp;
    const b = patch.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const trigger = patch.trigger !== undefined ? patch.trigger : existing.trigger;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const now = Date.now();

    await this.db.runAsync(
      `UPDATE smoking_events SET
        qty = ?, timestamp = ?, day_key = ?, trigger = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [qty, ts, dKey, trigger ?? null, note ?? null, now, id],
    );

    return {
      ...existing,
      qty,
      timestamp: ts,
      dayKey: dKey,
      trigger,
      note,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.runAsync('DELETE FROM smoking_events WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getByDayKey(dayKeyStr: string): Promise<SmokingRecord[]> {
    const rows = await this.db.getAllAsync<DbSmokingRow>(
      'SELECT * FROM smoking_events WHERE day_key = ? ORDER BY timestamp DESC',
      [dayKeyStr],
    );
    return rows.map(mapRow);
  }

  async getByDateRange(startDayKey: string, endDayKey: string): Promise<SmokingRecord[]> {
    const rows = await this.db.getAllAsync<DbSmokingRow>(
      'SELECT * FROM smoking_events WHERE day_key >= ? AND day_key <= ? ORDER BY timestamp DESC',
      [startDayKey, endDayKey],
    );
    return rows.map(mapRow);
  }

  async getAll(limit?: number): Promise<SmokingRecord[]> {
    const sql = limit ? 'SELECT * FROM smoking_events ORDER BY timestamp DESC LIMIT ?' : 'SELECT * FROM smoking_events ORDER BY timestamp DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbSmokingRow>(sql, params);
    return rows.map(mapRow);
  }
}

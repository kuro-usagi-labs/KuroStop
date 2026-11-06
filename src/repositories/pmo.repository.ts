/**
 * PMO Repository for private habit tracking.
 */

import type { IDatabase } from '../db/database.interface';
import { dayKey, uid } from '../lib/format';
import { validatePmoType, validateTimestamp } from '../domain/validation';
import type { PmoTrigger, PmoType } from '../data/types';

export type PmoRecord = {
  id: string;
  type: PmoType;
  timestamp: number;
  timezoneOffsetMs: number;
  dayKey: string;
  trigger?: PmoTrigger;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

type DbPmoRow = {
  id: string;
  type: string;
  timestamp: number;
  timezone_offset_ms: number;
  day_key: string;
  trigger: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
};

function mapRow(r: DbPmoRow): PmoRecord {
  return {
    id: r.id,
    type: r.type as PmoType,
    timestamp: r.timestamp,
    timezoneOffsetMs: r.timezone_offset_ms,
    dayKey: r.day_key,
    trigger: (r.trigger as PmoTrigger) || undefined,
    note: r.note || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class PmoRepository {
  constructor(private readonly db: IDatabase) {}

  async add(params: {
    id?: string;
    type: PmoType;
    timestamp?: number;
    trigger?: PmoTrigger;
    note?: string;
    dayBoundary?: number;
  }): Promise<PmoRecord> {
    const type = validatePmoType(params.type);
    const ts = validateTimestamp(params.timestamp ?? Date.now());
    const id = params.id ?? uid();
    const b = params.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO pmo_events (
        id, type, timestamp, timezone_offset_ms, day_key, trigger, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, type, ts, 25200000, dKey, params.trigger ?? null, params.note ?? null, now, now],
    );

    return {
      id,
      type,
      timestamp: ts,
      timezoneOffsetMs: 25200000,
      dayKey: dKey,
      trigger: params.trigger,
      note: params.note,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getById(id: string): Promise<PmoRecord | null> {
    const row = await this.db.getFirstAsync<DbPmoRow>(
      'SELECT * FROM pmo_events WHERE id = ?',
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    patch: { type?: PmoType; timestamp?: number; trigger?: PmoTrigger; note?: string; dayBoundary?: number },
  ): Promise<PmoRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const type = patch.type !== undefined ? validatePmoType(patch.type) : existing.type;
    const ts = patch.timestamp !== undefined ? validateTimestamp(patch.timestamp) : existing.timestamp;
    const b = patch.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const trigger = patch.trigger !== undefined ? patch.trigger : existing.trigger;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const now = Date.now();

    await this.db.runAsync(
      `UPDATE pmo_events SET
        type = ?, timestamp = ?, day_key = ?, trigger = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [type, ts, dKey, trigger ?? null, note ?? null, now, id],
    );

    return {
      ...existing,
      type,
      timestamp: ts,
      dayKey: dKey,
      trigger,
      note,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.runAsync('DELETE FROM pmo_events WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getByDayKey(dayKeyStr: string): Promise<PmoRecord[]> {
    const rows = await this.db.getAllAsync<DbPmoRow>(
      'SELECT * FROM pmo_events WHERE day_key = ? ORDER BY timestamp DESC',
      [dayKeyStr],
    );
    return rows.map(mapRow);
  }

  async getByDateRange(startDayKey: string, endDayKey: string): Promise<PmoRecord[]> {
    const rows = await this.db.getAllAsync<DbPmoRow>(
      'SELECT * FROM pmo_events WHERE day_key >= ? AND day_key <= ? ORDER BY timestamp DESC',
      [startDayKey, endDayKey],
    );
    return rows.map(mapRow);
  }

  async getAll(limit?: number): Promise<PmoRecord[]> {
    const sql = limit ? 'SELECT * FROM pmo_events ORDER BY timestamp DESC LIMIT ?' : 'SELECT * FROM pmo_events ORDER BY timestamp DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbPmoRow>(sql, params);
    return rows.map(mapRow);
  }
}

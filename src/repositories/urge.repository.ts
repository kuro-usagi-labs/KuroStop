/**
 * Urge Intervention Repository ("Gue Lagi Pengen...").
 */

import type { IDatabase } from '../db/database.interface';
import { dayKey, uid } from '../lib/format';
import { validateTimestamp } from '../domain/validation';
import type { Habit } from '../data/types';

export type UrgeRecord = {
  id: string;
  habit: Habit;
  timestamp: number;
  dayKey: string;
  outcome: 'resisted' | 'gave_in' | 'unresolved';
  method?: 'breath' | 'delay' | 'none';
  trigger?: string;
  note?: string;
  createdAt: number;
};

type DbUrgeRow = {
  id: string;
  habit: string;
  timestamp: number;
  day_key: string;
  outcome: string;
  method: string | null;
  trigger: string | null;
  note: string | null;
  created_at: number;
};

function mapRow(r: DbUrgeRow): UrgeRecord {
  return {
    id: r.id,
    habit: r.habit as Habit,
    timestamp: r.timestamp,
    dayKey: r.day_key,
    outcome: r.outcome as 'resisted' | 'gave_in' | 'unresolved',
    method: (r.method as 'breath' | 'delay' | 'none') || undefined,
    trigger: r.trigger || undefined,
    note: r.note || undefined,
    createdAt: r.created_at,
  };
}

export class UrgeRepository {
  constructor(private readonly db: IDatabase) {}

  async add(params: {
    id?: string;
    habit: Habit;
    outcome: 'resisted' | 'gave_in' | 'unresolved';
    method?: 'breath' | 'delay' | 'none';
    trigger?: string;
    note?: string;
    timestamp?: number;
    dayBoundary?: number;
  }): Promise<UrgeRecord> {
    const ts = validateTimestamp(params.timestamp ?? Date.now());
    const id = params.id ?? uid();
    const b = params.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO urge_events (
        id, habit, timestamp, day_key, outcome, method, trigger, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, params.habit, ts, dKey, params.outcome, params.method ?? null, params.trigger ?? null, params.note ?? null, now],
    );

    return {
      id,
      habit: params.habit,
      timestamp: ts,
      dayKey: dKey,
      outcome: params.outcome,
      method: params.method,
      trigger: params.trigger,
      note: params.note,
      createdAt: now,
    };
  }

  async getByDateRange(startDayKey: string, endDayKey: string): Promise<UrgeRecord[]> {
    const rows = await this.db.getAllAsync<DbUrgeRow>(
      'SELECT * FROM urge_events WHERE day_key >= ? AND day_key <= ? ORDER BY timestamp DESC',
      [startDayKey, endDayKey],
    );
    return rows.map(mapRow);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.runAsync('DELETE FROM urge_events WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getAll(limit?: number): Promise<UrgeRecord[]> {
    const sql = limit ? 'SELECT * FROM urge_events ORDER BY timestamp DESC LIMIT ?' : 'SELECT * FROM urge_events ORDER BY timestamp DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbUrgeRow>(sql, params);
    return rows.map(mapRow);
  }
}

/**
 * Cigarette Purchase & Financial Repository.
 * Strict Integer IDR persistence and querying.
 */

import type { IDatabase } from '../db/database.interface';
import { dayKey, uid } from '../lib/format';
import { validatePrice, validateTimestamp, ValidationError } from '../domain/validation';

export type PurchaseRecord = {
  id: string;
  unit: 'bungkus' | 'batang';
  qty: number;
  price: number; // Integer IDR
  brand?: string;
  timestamp: number;
  dayKey: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

type DbPurchaseRow = {
  id: string;
  unit: string;
  qty: number;
  price: number;
  brand: string | null;
  timestamp: number;
  day_key: string;
  note: string | null;
  created_at: number;
  updated_at: number;
};

function mapRow(r: DbPurchaseRow): PurchaseRecord {
  return {
    id: r.id,
    unit: r.unit as 'bungkus' | 'batang',
    qty: r.qty,
    price: r.price,
    brand: r.brand || undefined,
    timestamp: r.timestamp,
    dayKey: r.day_key,
    note: r.note || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class FinanceRepository {
  constructor(private readonly db: IDatabase) {}

  async addPurchase(params: {
    id?: string;
    unit: 'bungkus' | 'batang';
    qty: number;
    price: number;
    brand?: string;
    timestamp?: number;
    note?: string;
    dayBoundary?: number;
  }): Promise<PurchaseRecord> {
    if (params.unit !== 'bungkus' && params.unit !== 'batang') {
      throw new ValidationError(`Unit pembelian tidak valid: ${params.unit}`);
    }
    if (!Number.isInteger(params.qty) || params.qty <= 0) {
      throw new ValidationError(`Kuantitas pembelian harus bilangan bulat positif: ${params.qty}`);
    }
    const price = validatePrice(params.price);
    const ts = validateTimestamp(params.timestamp ?? Date.now());
    const id = params.id ?? uid();
    const b = params.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO cigarette_purchases (
        id, unit, qty, price, brand, timestamp, day_key, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, params.unit, params.qty, price, params.brand ?? null, ts, dKey, params.note ?? null, now, now],
    );

    return {
      id,
      unit: params.unit,
      qty: params.qty,
      price,
      brand: params.brand,
      timestamp: ts,
      dayKey: dKey,
      note: params.note,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getById(id: string): Promise<PurchaseRecord | null> {
    const row = await this.db.getFirstAsync<DbPurchaseRow>(
      'SELECT * FROM cigarette_purchases WHERE id = ?',
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async update(
    id: string,
    patch: { unit?: 'bungkus' | 'batang'; qty?: number; price?: number; brand?: string; timestamp?: number; note?: string; dayBoundary?: number },
  ): Promise<PurchaseRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const unit = patch.unit ?? existing.unit;
    const qty = patch.qty !== undefined ? patch.qty : existing.qty;
    const price = patch.price !== undefined ? validatePrice(patch.price) : existing.price;
    const ts = patch.timestamp !== undefined ? validateTimestamp(patch.timestamp) : existing.timestamp;
    const b = patch.dayBoundary ?? 4;
    const dKey = dayKey(ts, b);
    const brand = patch.brand !== undefined ? patch.brand : existing.brand;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const now = Date.now();

    await this.db.runAsync(
      `UPDATE cigarette_purchases SET
        unit = ?, qty = ?, price = ?, brand = ?, timestamp = ?, day_key = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [unit, qty, price, brand ?? null, ts, dKey, note ?? null, now, id],
    );

    return {
      ...existing,
      unit,
      qty,
      price,
      brand,
      timestamp: ts,
      dayKey: dKey,
      note,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.runAsync('DELETE FROM cigarette_purchases WHERE id = ?', [id]);
    return res.changes > 0;
  }

  async getByDateRange(startDayKey: string, endDayKey: string): Promise<PurchaseRecord[]> {
    const rows = await this.db.getAllAsync<DbPurchaseRow>(
      'SELECT * FROM cigarette_purchases WHERE day_key >= ? AND day_key <= ? ORDER BY timestamp DESC',
      [startDayKey, endDayKey],
    );
    return rows.map(mapRow);
  }

  async getTotalSpend(startDayKey: string, endDayKey: string): Promise<number> {
    const res = await this.db.getFirstAsync<{ total: number | null }>(
      'SELECT SUM(price) as total FROM cigarette_purchases WHERE day_key >= ? AND day_key <= ?',
      [startDayKey, endDayKey],
    );
    return res?.total ?? 0;
  }

  async getAll(limit?: number): Promise<PurchaseRecord[]> {
    const sql = limit ? 'SELECT * FROM cigarette_purchases ORDER BY timestamp DESC LIMIT ?' : 'SELECT * FROM cigarette_purchases ORDER BY timestamp DESC';
    const params = limit ? [limit] : [];
    const rows = await this.db.getAllAsync<DbPurchaseRow>(sql, params);
    return rows.map(mapRow);
  }
}

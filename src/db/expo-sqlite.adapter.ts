/**
 * Expo SQLite adapter implementing IDatabase.
 */

import * as SQLite from 'expo-sqlite';
import type { IDatabase, RunResult } from './database.interface';

export class ExpoSqliteAdapter implements IDatabase {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async execAsync(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<RunResult> {
    const res = await this.db.runAsync(sql, ...(params as SQLite.SQLiteVariadicBindParams));
    return {
      lastInsertRowId: res.lastInsertRowId,
      changes: res.changes,
    };
  }

  async getAllAsync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return await this.db.getAllAsync<T>(sql, ...(params as SQLite.SQLiteVariadicBindParams));
  }

  async getFirstAsync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    return await this.db.getFirstAsync<T>(sql, ...(params as SQLite.SQLiteVariadicBindParams));
  }

  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    let result!: T;
    await this.db.withTransactionAsync(async () => {
      result = await fn();
    });
    return result;
  }

  async closeAsync(): Promise<void> {
    await this.db.closeAsync();
  }
}

let instancePromise: Promise<IDatabase> | null = null;

export function resetDatabaseConnection(): void {
  instancePromise = null;
}

export async function openKuroStopDatabase(dbName = 'kurostop.db'): Promise<IDatabase> {
  const nativeDb = await SQLite.openDatabaseAsync(dbName);
  // Configure SQLite pragmas for durability and speed
  await nativeDb.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
  return new ExpoSqliteAdapter(nativeDb);
}

export function getAppDatabase(): Promise<IDatabase> {
  if (!instancePromise) {
    instancePromise = openKuroStopDatabase().catch((err) => {
      // Clear cached promise on failure to allow clean retry
      instancePromise = null;
      throw err;
    });
  }
  return instancePromise;
}

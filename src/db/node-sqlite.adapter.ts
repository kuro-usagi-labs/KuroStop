/**
 * Real SQLite 3 adapter for Node.js test environment using better-sqlite3.
 * Implements IDatabase identically to ExpoSqliteAdapter.
 */

import Database from 'better-sqlite3';
import type { IDatabase, RunResult } from './database.interface';

export class NodeSqliteAdapter implements IDatabase {
  private readonly db: Database.Database;

  constructor(filename = ':memory:') {
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<RunResult> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      lastInsertRowId: Number(info.lastInsertRowid),
      changes: info.changes,
    };
  }

  async getAllAsync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async getFirstAsync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) ?? null;
  }

  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    // In better-sqlite3, transactions are synchronous statements, but async tasks can run with SAVEPOINT
    this.db.exec('SAVEPOINT tx_sub');
    try {
      const res = await fn();
      this.db.exec('RELEASE SAVEPOINT tx_sub');
      return res;
    } catch (err) {
      this.db.exec('ROLLBACK TO SAVEPOINT tx_sub');
      throw err;
    }
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}

export function createTestDatabase(): IDatabase {
  return new NodeSqliteAdapter(':memory:');
}

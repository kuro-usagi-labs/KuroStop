/**
 * Unified asynchronous SQLite database interface for KuroStop.
 * Allows repository and migration logic to run on both:
 * - Native iOS / Android via expo-sqlite
 * - Automated test runner (Node) via real SQLite in-memory adapter
 */

export type RunResult = {
  lastInsertRowId: number;
  changes: number;
};

export interface IDatabase {
  /** Executes raw multi-statement SQL script (e.g. migration). */
  execAsync(sql: string): Promise<void>;

  /** Executes an INSERT / UPDATE / DELETE parameterized statement. */
  runAsync(sql: string, params?: unknown[]): Promise<RunResult>;

  /** Retrieves all matching rows for a parameterized query. */
  getAllAsync<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Retrieves the first matching row or null. */
  getFirstAsync<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;

  /** Executes a callback within a managed transaction (ROLLBACK on error, COMMIT on success). */
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;

  /** Closes the database connection. */
  closeAsync(): Promise<void>;
}

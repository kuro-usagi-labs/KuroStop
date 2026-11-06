import test from 'node:test';
import assert from 'node:assert/strict';

import { createTestDatabase } from '../../src/db/node-sqlite.adapter';
import { runMigrations } from '../../src/db/migrations';

test('Database Migrations & Constraints', async (t) => {
  const db = createTestDatabase();

  await t.test('initial migration succeeds and seeds settings', async () => {
    await runMigrations(db);

    const rows = await db.getAllAsync<{ version: number; name: string }>(
      'SELECT version, name FROM schema_migrations ORDER BY version ASC',
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].version, 1);
    assert.equal(rows[0].name, 'initial_schema_v1');

    const settings = await db.getFirstAsync<{ key: string; smoke_target: number; onboarded: number }>(
      "SELECT key, smoke_target, onboarded FROM personal_settings WHERE key = 'current'",
    );
    assert.ok(settings);
    assert.equal(settings.key, 'current');
    assert.equal(settings.smoke_target, 5);
    assert.equal(settings.onboarded, 0);
  });

  await t.test('subsequent migration run is idempotent', async () => {
    await runMigrations(db); // Second call should not fail
    const rows = await db.getAllAsync('SELECT version FROM schema_migrations');
    assert.equal(rows.length, 1);
  });

  await t.test('smoking_events CRUD and check constraints', async () => {
    const now = 1794000000000;
    // Valid insert
    await db.runAsync(
      `INSERT INTO smoking_events (id, qty, timestamp, day_key, trigger, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['smoke-1', 2, now, '2026-11-07', 'kopi', 'pagi', now, now],
    );

    const row = await db.getFirstAsync<{ id: string; qty: number; trigger: string }>(
      'SELECT * FROM smoking_events WHERE id = ?',
      ['smoke-1'],
    );
    assert.ok(row);
    assert.equal(row.id, 'smoke-1');
    assert.equal(row.qty, 2);
    assert.equal(row.trigger, 'kopi');

    // Constraint failure: qty <= 0 must throw
    await assert.rejects(async () => {
      await db.runAsync(
        `INSERT INTO smoking_events (id, qty, timestamp, day_key, trigger, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['smoke-invalid', 0, now, '2026-11-07', null, null, now, now],
      );
    });
  });

  await t.test('pmo_events type check constraint', async () => {
    const now = 1794000000000;
    // Valid P+M combined session
    await db.runAsync(
      `INSERT INTO pmo_events (id, type, timestamp, day_key, trigger, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pmo-1', 'pmo', now, '2026-11-07', 'bosan', null, now, now],
    );

    const row = await db.getFirstAsync<{ id: string; type: string }>('SELECT * FROM pmo_events WHERE id = ?', ['pmo-1']);
    assert.ok(row);
    assert.equal(row.type, 'pmo');

    // Invalid type throws
    await assert.rejects(async () => {
      await db.runAsync(
        `INSERT INTO pmo_events (id, type, timestamp, day_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['pmo-bad', 'invalid_type', now, '2026-11-07', now, now],
      );
    });
  });

  await t.test('transaction rollback on error', async () => {
    const countBefore = (await db.getAllAsync('SELECT id FROM smoking_events')).length;

    await assert.rejects(async () => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO smoking_events (id, qty, timestamp, day_key, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['smoke-tx-1', 1, 1000, '2026-11-07', 1000, 1000],
        );
        // Force error to trigger rollback
        throw new Error('Forced transaction failure');
      });
    });

    const countAfter = (await db.getAllAsync('SELECT id FROM smoking_events')).length;
    assert.equal(countAfter, countBefore, 'Rolled back transaction must leave row count unchanged');
  });

  await db.closeAsync();
});

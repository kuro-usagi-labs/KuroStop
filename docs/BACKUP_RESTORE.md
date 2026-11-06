# KuroStop Offline Backup & Restore Specification

## 1. Overview

KuroStop is distributed as an unsigned IPA for personal iOS sideloading (via Sideloadly, AltStore, SideStore). Because sideloaded apps risk data loss during profile expiration or app ID changes, **reliable offline backup and restore** is a core requirement.

---

## 2. Backup Format: `KuroStopBackupV1`

Backups are exported as versioned, portable JSON objects containing all 6 tables and user configuration:

```typescript
export type KuroStopBackupV1 = {
  version: 1;
  appName: 'KuroStop';
  exportedAt: string; // ISO 8601 UTC timestamp
  checksum: string;   // FNV-1a 32-bit hex checksum
  data: {
    settings: Settings;
    smoking: SmokingRecord[];
    pmo: PmoRecord[];
    sleep: SleepRecord[];
    purchases: PurchaseRecord[];
    urges: UrgeRecord[];
    checkins: CheckinRecord[];
  };
};
```

---

## 3. Data Integrity & Validation

1. **Checksum Verification**:
   The `checksum` is computed over the stringified `data` payload using a deterministic FNV-1a algorithm. If any record is altered, corrupted, or truncated, the checksum check fails and restoration is blocked.
2. **Schema & Application Check**:
   - `appName === 'KuroStop'`
   - `version === 1`
   - Array presence validation across all tables.

---

## 4. Transactional Atomic Restoration

Restoring a backup executes inside a single SQLite transaction (`db.withTransactionAsync`):
1. **Clear Existing Tables**:
   ```sql
   DELETE FROM smoking_events;
   DELETE FROM pmo_events;
   DELETE FROM sleep_sessions;
   DELETE FROM cigarette_purchases;
   DELETE FROM urge_events;
   DELETE FROM daily_checkins;
   ```
2. **Batch Insert**:
   All entities are re-inserted using parameterized SQL statements that enforce `CHECK` constraints.
3. **Settings Restoration**:
   `personal_settings` row is updated with the backup configuration.
4. **Automatic Rollback**:
   If any insert violates SQLite constraints or schema integrity, SQLite aborts and rolls back the transaction. The database reverts to its exact pre-restore state without data loss.

---

## 5. Sideloading Safety Recommendations

1. **Export Before Upgrading**:
   Always export a fresh backup in *Pengaturan > Cadangan Data* before updating the IPA file or reinstalling via a sideloading utility.
2. **Bundle Identifier Consistency**:
   Ensure the sideload tool maintains `com.kurostop.personal`. Changing the bundle identifier creates a separate sandboxed app container that cannot access the previous database.
3. **Plaintext JSON Storage Warning**:
   Exported backups contain personal discipline records in readable JSON format. Store exported backup files in a secure location (such as an encrypted drive or private iCloud folder).

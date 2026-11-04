import { Platform } from 'react-native';
import {
  HabitEvent,
  PurchaseRecord,
  SleepSession,
  UrgeLog,
  UserSettings,
} from '../types';
import { CREATE_TABLES_SQL } from './schema';

let sqliteDb: any = null;

// In-memory fallback cache for Node/Test/Web environments
const memoryStore = {
  settings: {
    id: 'singleton',
    smokingTargetDaily: 0,
    pmoTargetDaily: 0,
    targetBedtime: '23:00',
    targetWakeTime: '06:00',
    dailyCigaretteSpendBaseline: 30000,
    accountabilityIntensity: 'brutal' as const,
    reduceMotion: false,
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  } as UserSettings,
  events: [] as HabitEvent[],
  purchases: [] as PurchaseRecord[],
  sleepSessions: [] as SleepSession[],
  urgeLogs: [] as UrgeLog[],
};

export const initDatabase = async (): Promise<void> => {
  if (Platform.OS === 'web' || typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }

  try {
    const SQLite = await import('expo-sqlite');
    sqliteDb = await SQLite.openDatabaseAsync('kurostop.db');
    await sqliteDb.execAsync(CREATE_TABLES_SQL);

    // Ensure settings singleton exists
    const existing = await sqliteDb.getFirstAsync(
      'SELECT id FROM user_settings WHERE id = ?',
      ['singleton']
    );

    if (!existing) {
      await sqliteDb.runAsync(
        `INSERT INTO user_settings (
          id, smoking_target_daily, pmo_target_daily, target_bedtime,
          target_wake_time, daily_cigarette_spend_baseline,
          accountability_intensity, reduce_motion, onboarding_completed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'singleton',
          0,
          0,
          '23:00',
          '06:00',
          30000,
          'brutal',
          0,
          0,
          new Date().toISOString(),
        ]
      );
    }
  } catch (err) {
    console.warn('[KuroStop DB] SQLite initialization note (fallback to memory):', err);
  }
};

// ==================== SETTINGS ====================

export const getSettings = async (): Promise<UserSettings> => {
  if (sqliteDb) {
    try {
      const row = await sqliteDb.getFirstAsync(
        'SELECT * FROM user_settings WHERE id = ?',
        ['singleton']
      );
      if (row) {
        return {
          id: row.id,
          smokingTargetDaily: row.smoking_target_daily,
          pmoTargetDaily: row.pmo_target_daily,
          targetBedtime: row.target_bedtime,
          targetWakeTime: row.target_wake_time,
          dailyCigaretteSpendBaseline: row.daily_cigarette_spend_baseline,
          accountabilityIntensity: row.accountability_intensity,
          reduceMotion: Boolean(row.reduce_motion),
          onboardingCompleted: Boolean(row.onboarding_completed),
          createdAt: row.created_at,
        };
      }
    } catch (err) {
      console.warn('Error fetching settings from SQLite:', err);
    }
  }
  return { ...memoryStore.settings };
};

export const updateSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const current = await getSettings();
  const updated: UserSettings = { ...current, ...settings };

  if (sqliteDb) {
    try {
      await sqliteDb.runAsync(
        `UPDATE user_settings SET
          smoking_target_daily = ?,
          pmo_target_daily = ?,
          target_bedtime = ?,
          target_wake_time = ?,
          daily_cigarette_spend_baseline = ?,
          accountability_intensity = ?,
          reduce_motion = ?,
          onboarding_completed = ?
        WHERE id = ?`,
        [
          updated.smokingTargetDaily,
          updated.pmoTargetDaily,
          updated.targetBedtime,
          updated.targetWakeTime,
          updated.dailyCigaretteSpendBaseline,
          updated.accountabilityIntensity,
          updated.reduceMotion ? 1 : 0,
          updated.onboardingCompleted ? 1 : 0,
          'singleton',
        ]
      );
    } catch (err) {
      console.warn('Error updating settings in SQLite:', err);
    }
  }

  memoryStore.settings = updated;
  return updated;
};

// ==================== HABIT EVENTS ====================

export const insertHabitEvent = async (event: HabitEvent): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync(
        `INSERT INTO habit_events (
          id, habit_type, event_timestamp, local_date, count, pmo_type, trigger_tag, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.habitType,
          event.timestamp,
          event.localDate,
          event.count,
          event.pmoType || null,
          event.triggerTag || null,
          event.note || null,
          event.createdAt,
        ]
      );
    } catch (err) {
      console.warn('Error inserting habit event:', err);
    }
  }
  memoryStore.events.unshift(event);
};

export const deleteHabitEvent = async (id: string): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync('DELETE FROM habit_events WHERE id = ?', [id]);
    } catch (err) {
      console.warn('Error deleting habit event:', err);
    }
  }
  memoryStore.events = memoryStore.events.filter((e) => e.id !== id);
};

export const getEventsForDate = async (localDate: string): Promise<HabitEvent[]> => {
  if (sqliteDb) {
    try {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM habit_events WHERE local_date = ? ORDER BY event_timestamp DESC',
        [localDate]
      );
      return rows.map((r: any) => ({
        id: r.id,
        habitType: r.habit_type,
        timestamp: r.event_timestamp,
        localDate: r.local_date,
        count: r.count,
        pmoType: r.pmo_type,
        triggerTag: r.trigger_tag,
        note: r.note,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Error querying events for date:', err);
    }
  }
  return memoryStore.events.filter((e) => e.localDate === localDate);
};

export const getAllHabitEvents = async (): Promise<HabitEvent[]> => {
  if (sqliteDb) {
    try {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM habit_events ORDER BY event_timestamp DESC'
      );
      return rows.map((r: any) => ({
        id: r.id,
        habitType: r.habit_type,
        timestamp: r.event_timestamp,
        localDate: r.local_date,
        count: r.count,
        pmoType: r.pmo_type,
        triggerTag: r.trigger_tag,
        note: r.note,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Error querying all events:', err);
    }
  }
  return [...memoryStore.events];
};

// ==================== PURCHASES ====================

export const insertPurchase = async (purchase: PurchaseRecord): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync(
        `INSERT INTO purchases (
          id, purchase_timestamp, local_date, item_type, quantity, total_price, brand_name, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase.id,
          purchase.timestamp,
          purchase.localDate,
          purchase.itemType,
          purchase.quantity,
          purchase.totalPrice,
          purchase.brandName || null,
          purchase.note || null,
          purchase.createdAt,
        ]
      );
    } catch (err) {
      console.warn('Error inserting purchase:', err);
    }
  }
  memoryStore.purchases.unshift(purchase);
};

export const deletePurchase = async (id: string): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync('DELETE FROM purchases WHERE id = ?', [id]);
    } catch (err) {
      console.warn('Error deleting purchase:', err);
    }
  }
  memoryStore.purchases = memoryStore.purchases.filter((p) => p.id !== id);
};

export const getAllPurchases = async (): Promise<PurchaseRecord[]> => {
  if (sqliteDb) {
    try {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM purchases ORDER BY purchase_timestamp DESC'
      );
      return rows.map((r: any) => ({
        id: r.id,
        timestamp: r.purchase_timestamp,
        localDate: r.local_date,
        itemType: r.item_type,
        quantity: r.quantity,
        totalPrice: r.total_price,
        brandName: r.brand_name,
        note: r.note,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Error querying purchases:', err);
    }
  }
  return [...memoryStore.purchases];
};

// ==================== SLEEP SESSIONS ====================

export const upsertSleepSession = async (session: SleepSession): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync(
        `INSERT INTO sleep_sessions (
          id, sleep_night_date, bedtime_timestamp, wake_timestamp, target_bedtime, lateness_minutes, duration_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          wake_timestamp = excluded.wake_timestamp,
          duration_minutes = excluded.duration_minutes`,
        [
          session.id,
          session.sleepNightDate,
          session.bedtimeTimestamp,
          session.wakeTimestamp || null,
          session.targetBedtime,
          session.latenessMinutes,
          session.durationMinutes || null,
          session.createdAt,
        ]
      );
    } catch (err) {
      console.warn('Error upserting sleep session:', err);
    }
  }
  const idx = memoryStore.sleepSessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    memoryStore.sleepSessions[idx] = session;
  } else {
    memoryStore.sleepSessions.unshift(session);
  }
};

export const getSleepSessionForNight = async (
  sleepNightDate: string
): Promise<SleepSession | null> => {
  if (sqliteDb) {
    try {
      const row = await sqliteDb.getFirstAsync(
        'SELECT * FROM sleep_sessions WHERE sleep_night_date = ? ORDER BY bedtime_timestamp DESC',
        [sleepNightDate]
      );
      if (row) {
        return {
          id: row.id,
          sleepNightDate: row.sleep_night_date,
          bedtimeTimestamp: row.bedtime_timestamp,
          wakeTimestamp: row.wake_timestamp,
          targetBedtime: row.target_bedtime,
          latenessMinutes: row.lateness_minutes,
          durationMinutes: row.duration_minutes,
          createdAt: row.created_at,
        };
      }
    } catch (err) {
      console.warn('Error querying sleep session:', err);
    }
  }
  return memoryStore.sleepSessions.find((s) => s.sleepNightDate === sleepNightDate) || null;
};

export const getAllSleepSessions = async (): Promise<SleepSession[]> => {
  if (sqliteDb) {
    try {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM sleep_sessions ORDER BY bedtime_timestamp DESC'
      );
      return rows.map((r: any) => ({
        id: r.id,
        sleepNightDate: r.sleep_night_date,
        bedtimeTimestamp: r.bedtime_timestamp,
        wakeTimestamp: r.wake_timestamp,
        targetBedtime: r.target_bedtime,
        latenessMinutes: r.lateness_minutes,
        durationMinutes: r.duration_minutes,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Error querying all sleep sessions:', err);
    }
  }
  return [...memoryStore.sleepSessions];
};

// ==================== URGE LOGS ====================

export const insertUrgeLog = async (urge: UrgeLog): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.runAsync(
        `INSERT INTO urge_logs (
          id, urge_timestamp, local_date, habit_type, resisted, duration_seconds, trigger_tag, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          urge.id,
          urge.timestamp,
          urge.localDate,
          urge.habitType,
          urge.resisted ? 1 : 0,
          urge.durationSeconds,
          urge.triggerTag || null,
          urge.note || null,
          urge.createdAt,
        ]
      );
    } catch (err) {
      console.warn('Error inserting urge log:', err);
    }
  }
  memoryStore.urgeLogs.unshift(urge);
};

export const getAllUrgeLogs = async (): Promise<UrgeLog[]> => {
  if (sqliteDb) {
    try {
      const rows = await sqliteDb.getAllAsync(
        'SELECT * FROM urge_logs ORDER BY urge_timestamp DESC'
      );
      return rows.map((r: any) => ({
        id: r.id,
        timestamp: r.urge_timestamp,
        localDate: r.local_date,
        habitType: r.habit_type,
        resisted: Boolean(r.resisted),
        durationSeconds: r.duration_seconds,
        triggerTag: r.trigger_tag,
        note: r.note,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Error querying urge logs:', err);
    }
  }
  return [...memoryStore.urgeLogs];
};

// ==================== RESET / EXPORT ====================

export const purgeAllUserData = async (): Promise<void> => {
  if (sqliteDb) {
    try {
      await sqliteDb.execAsync(`
        DELETE FROM habit_events;
        DELETE FROM purchases;
        DELETE FROM sleep_sessions;
        DELETE FROM urge_logs;
      `);
    } catch (err) {
      console.warn('Error purging SQLite tables:', err);
    }
  }
  memoryStore.events = [];
  memoryStore.purchases = [];
  memoryStore.sleepSessions = [];
  memoryStore.urgeLogs = [];
};

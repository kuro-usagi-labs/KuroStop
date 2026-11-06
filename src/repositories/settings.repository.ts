/**
 * Settings Repository for persistent user preferences and targets.
 */

import type { IDatabase } from '../db/database.interface';
import { DEFAULT_SETTINGS, type Settings } from '../data/types';
import { validatePrice, validateSmokeQty, validateSensitivity, validateIntensity } from '../domain/validation';

export type PersistedSettings = Settings & {
  onboarded: boolean;
  baselineEffectiveDate: string;
};

type DbSettingsRow = {
  key: string;
  habits_json: string;
  smoke_target: number;
  pmo_target: number;
  bedtime: number;
  wake: number;
  late_grace: number;
  baseline_per_day: number;
  pack_price: number;
  pack_size: number;
  single_price: number;
  sensitivity: string;
  intensity: string;
  messages_on: number;
  notif_json: string;
  app_lock: number;
  pmo_cover: number;
  reduce_motion: string;
  day_boundary: number;
  onboarded: number;
  baseline_effective_date: string;
  updated_at: number;
};

export class SettingsRepository {
  constructor(private readonly db: IDatabase) {}

  async getSettings(): Promise<PersistedSettings> {
    const row = await this.db.getFirstAsync<DbSettingsRow>(
      "SELECT * FROM personal_settings WHERE key = 'current'",
    );
    if (!row) {
      return {
        ...DEFAULT_SETTINGS,
        onboarded: false,
        baselineEffectiveDate: new Date().toISOString().slice(0, 10),
      };
    }

    return {
      habits: JSON.parse(row.habits_json),
      smokeTarget: row.smoke_target,
      pmoTarget: row.pmo_target,
      bedtime: row.bedtime,
      wake: row.wake,
      lateGrace: row.late_grace,
      baselinePerDay: row.baseline_per_day,
      packPrice: row.pack_price,
      packSize: row.pack_size,
      singlePrice: row.single_price,
      sensitivity: row.sensitivity as PersistedSettings['sensitivity'],
      intensity: row.intensity as PersistedSettings['intensity'],
      messagesOn: row.messages_on === 1,
      notif: JSON.parse(row.notif_json),
      appLock: row.app_lock === 1,
      pmoCover: row.pmo_cover === 1,
      reduceMotion: row.reduce_motion as PersistedSettings['reduceMotion'],
      dayBoundary: row.day_boundary,
      onboarded: row.onboarded === 1,
      baselineEffectiveDate: row.baseline_effective_date,
    };
  }

  async updateSettings(patch: Partial<PersistedSettings>): Promise<PersistedSettings> {
    const current = await this.getSettings();
    const updated: PersistedSettings = {
      ...current,
      ...patch,
      habits: patch.habits ? { ...current.habits, ...patch.habits } : current.habits,
      notif: patch.notif ? { ...current.notif, ...patch.notif } : current.notif,
    };

    if (patch.smokeTarget !== undefined) validateSmokeQty(patch.smokeTarget + 1); // target 0 allowed
    if (patch.packPrice !== undefined) validatePrice(patch.packPrice);
    if (patch.sensitivity !== undefined) validateSensitivity(patch.sensitivity);
    if (patch.intensity !== undefined) validateIntensity(patch.intensity);

    const now = Date.now();
    await this.db.runAsync(
      `UPDATE personal_settings SET
        habits_json = ?,
        smoke_target = ?,
        pmo_target = ?,
        bedtime = ?,
        wake = ?,
        late_grace = ?,
        baseline_per_day = ?,
        pack_price = ?,
        pack_size = ?,
        single_price = ?,
        sensitivity = ?,
        intensity = ?,
        messages_on = ?,
        notif_json = ?,
        app_lock = ?,
        pmo_cover = ?,
        reduce_motion = ?,
        day_boundary = ?,
        onboarded = ?,
        baseline_effective_date = ?,
        updated_at = ?
       WHERE key = 'current'`,
      [
        JSON.stringify(updated.habits),
        updated.smokeTarget,
        updated.pmoTarget,
        updated.bedtime,
        updated.wake,
        updated.lateGrace,
        updated.baselinePerDay,
        updated.packPrice,
        updated.packSize,
        updated.singlePrice,
        updated.sensitivity,
        updated.intensity,
        updated.messagesOn ? 1 : 0,
        JSON.stringify(updated.notif),
        updated.appLock ? 1 : 0,
        updated.pmoCover ? 1 : 0,
        updated.reduceMotion,
        updated.dayBoundary,
        updated.onboarded ? 1 : 0,
        updated.baselineEffectiveDate,
        now,
      ],
    );

    return updated;
  }
}

/**
 * Streak Calculation Engine for KuroStop.
 * Strictly adheres to verification rules: unverified days break streaks.
 */

import { addDays } from '../lib/format';
import type { Habit } from './types';

export type DailyComplianceRecord = {
  dayKey: string;
  isVerified: boolean;
  smokeCompliant: boolean;
  pmoCompliant: boolean;
  sleepCompliant: boolean;
  allCompliant: boolean;
};

export type StreakResult = {
  current: number;
  longest: number;
};

export function calculateStreak(
  history: DailyComplianceRecord[],
  todayKey: string,
  habit: Habit | 'all',
  lookback = 120,
): StreakResult {
  const map = new Map<string, DailyComplianceRecord>();
  for (const r of history) {
    map.set(r.dayKey, r);
  }

  const isCompliant = (rec?: DailyComplianceRecord): boolean => {
    if (!rec || !rec.isVerified) return false;
    if (habit === 'smoke') return rec.smokeCompliant;
    if (habit === 'pmo') return rec.pmoCompliant;
    if (habit === 'sleep') return rec.sleepCompliant;
    return rec.allCompliant;
  };

  let current = 0;
  let longest = 0;
  let run = 0;
  let countingCurrent = true;

  for (let i = 0; i < lookback; i++) {
    const k = addDays(todayKey, -i);
    const rec = map.get(k);

    // Today in progress: if compliant so far, count it. If not yet compliant or unverified, don't break current streak yet.
    if (i === 0) {
      if (rec && isCompliant(rec)) {
        run++;
        current = run;
      }
      continue;
    }

    if (rec && isCompliant(rec)) {
      run++;
      if (countingCurrent) current = run;
    } else {
      countingCurrent = false;
      run = 0;
    }

    longest = Math.max(longest, run);
  }

  return { current, longest: Math.max(longest, current) };
}

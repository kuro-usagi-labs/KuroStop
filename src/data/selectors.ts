/**
 * Derived statistics for the UI.
 * Connects the UI layer to the deterministic domain calculation engines.
 */
import { dayKey, keyStart, minutesOfDay, rangeKeys } from '@/lib/format';
import type { Zone } from '@/theme/tokens';
import { calculateDailyZone } from '@/domain/consequence';
import { calculateDailyBaselineCost } from '@/domain/finance';
import { calculateStreak } from '@/domain/streaks';
import type {
  Entry, Habit, PmoEntry, PurchaseEntry, Settings, SleepEntry, SmokeEntry, UrgeEntry,
} from './types';

export type DayIndex = Map<string, Entry[]>;

export function buildIndex(entries: Entry[], boundary: number): DayIndex {
  const map: DayIndex = new Map();
  for (const e of entries) {
    const k = dayKey(e.at, boundary);
    const arr = map.get(k);
    if (arr) arr.push(e);
    else map.set(k, [e]);
  }
  return map;
}

export type DayStat = {
  key: string;
  verified: boolean;
  verifiedHabits: { smoke: boolean; pmo: boolean; sleep: boolean };
  entries: Entry[];
  smoke: number;
  spend: number;
  purchases: number;
  pmo: { p: number; m: number; pmo: number; sessions: number };
  sleep?: { start: number; end?: number; lateMin: number; durationMin?: number };
  urges: { resisted: number; gaveIn: number; unresolved: number };
  overSmoke: number;
  overPmo: number;
  sleepLate: boolean;
  points: number;
  zone: Zone;
  factors: string[];
};

/** Bedtime target (epoch) for the night that belongs to `key`. */
export function bedtimeTarget(key: string, s: Settings) {
  const offset = (s.bedtime - s.dayBoundary * 60 + 1440) % 1440;
  return keyStart(key, s.dayBoundary) + offset * 60_000;
}

export function wakeTarget(key: string, s: Settings) {
  const offset = (s.wake - s.dayBoundary * 60 + 1440) % 1440;
  return keyStart(key, s.dayBoundary) + offset * 60_000 + (offset < 12 * 60 ? 86_400_000 : 0);
}

export function sleepLateMin(entry: SleepEntry, s: Settings) {
  return Math.round((entry.at - bedtimeTarget(dayKey(entry.at, s.dayBoundary), s)) / 60_000);
}

export function dayStat(index: DayIndex, s: Settings, key: string): DayStat {
  const entries = index.get(key) ?? [];
  let smoke = 0, spend = 0, purchases = 0, resisted = 0, gaveIn = 0, unresolved = 0;
  const pmo = { p: 0, m: 0, pmo: 0, sessions: 0 };
  let sleepEntry: SleepEntry | undefined;

  for (const e of entries) {
    if (e.kind === 'smoke') smoke += e.qty;
    else if (e.kind === 'purchase') { spend += e.price; purchases++; }
    else if (e.kind === 'pmo') { pmo[e.type]++; pmo.sessions++; } // P+M is ONE session, never double-counted
    else if (e.kind === 'sleep') { if (!sleepEntry || e.at < sleepEntry.at) sleepEntry = e; }
    else if (e.kind === 'urge') {
      if (e.outcome === 'resisted') resisted++;
      else if (e.outcome === 'gave_in') gaveIn++;
      else unresolved++;
    }
  }

  const sleep = sleepEntry
    ? {
        start: sleepEntry.at,
        end: sleepEntry.end,
        lateMin: sleepLateMin(sleepEntry, s),
        durationMin: sleepEntry.end ? Math.round((sleepEntry.end - sleepEntry.at) / 60_000) : undefined,
      }
    : undefined;

  const overSmoke = s.habits.smoke ? Math.max(0, smoke - s.smokeTarget) : 0;
  const overPmo = s.habits.pmo ? Math.max(0, pmo.sessions - s.pmoTarget) : 0;
  const sleepLate = !!(s.habits.sleep && sleep && sleep.lateMin > s.lateGrace);

  const hasCleanCheckin = entries.some((e) => e.kind === 'checkin');
  const hasSmoke = entries.some((e) => e.kind === 'smoke');
  const hasPmo = entries.some((e) => e.kind === 'pmo');
  const hasSleep = entries.some((e) => e.kind === 'sleep');

  const verifiedHabits = {
    smoke: hasSmoke || hasCleanCheckin,
    pmo: hasPmo || hasCleanCheckin,
    sleep: hasSleep || hasCleanCheckin,
  };

  // A day is verified overall if it has an explicit checkin, or habit records for enabled habits.
  // Neither purchases nor urges alone count as verification for abstinence!
  const verified = hasCleanCheckin || hasSmoke || hasPmo || hasSleep;

  // Real deterministic consequence calculation engine
  const consequence = calculateDailyZone({
    smokeCount: smoke,
    pmoSessions: pmo.sessions,
    sleepRecord: sleepEntry
      ? {
          startTime: sleepEntry.at,
          endTime: sleepEntry.end,
          targetBedtimeMin: s.bedtime,
          lateGraceMin: s.lateGrace,
        }
      : undefined,
    targets: {
      smokeTarget: s.smokeTarget,
      pmoTarget: s.pmoTarget,
    },
    activeHabits: s.habits,
    sensitivity: s.sensitivity,
    isVerified: verified,
  });

  return {
    key,
    verified,
    verifiedHabits,
    entries,
    smoke,
    spend,
    purchases,
    pmo,
    sleep,
    urges: { resisted, gaveIn, unresolved },
    overSmoke,
    overPmo,
    sleepLate,
    points: consequence.points,
    zone: consequence.zone,
    factors: consequence.factors,
  };
}

export function statsForRange(index: DayIndex, s: Settings, endKey: string, days: number) {
  return rangeKeys(endKey, days).map((k) => dayStat(index, s, k));
}

export function sum(stats: DayStat[], f: (d: DayStat) => number) {
  return stats.reduce((acc, d) => acc + f(d), 0);
}

export function avgVerified(stats: DayStat[], f: (d: DayStat) => number) {
  const v = stats.filter((d) => d.verified);
  return v.length ? sum(v, f) / v.length : 0;
}

export function lastOf<K extends Entry['kind']>(entries: Entry[], kind: K) {
  let best: Extract<Entry, { kind: K }> | undefined;
  for (const e of entries) if (e.kind === kind && (!best || e.at > best.at)) best = e as Extract<Entry, { kind: K }>;
  return best;
}

export function activeSleep(entries: Entry[]) {
  return entries.find((e): e is SleepEntry => e.kind === 'sleep' && !e.end);
}

/** Does a verified day satisfy the target for a habit? Unverified days break streaks. */
export function meetsTarget(d: DayStat, habit: Habit | 'all', s: Settings) {
  const smokeOk = d.verifiedHabits.smoke && d.smoke <= s.smokeTarget;
  const pmoOk = d.verifiedHabits.pmo && d.pmo.sessions <= s.pmoTarget;
  const sleepOk = d.verifiedHabits.sleep && (!d.sleep || d.sleep.lateMin <= s.lateGrace);

  if (habit === 'smoke') return smokeOk;
  if (habit === 'pmo') return pmoOk;
  if (habit === 'sleep') return sleepOk;
  return (!s.habits.smoke || smokeOk) && (!s.habits.pmo || pmoOk) && (!s.habits.sleep || sleepOk);
}

export function streaks(index: DayIndex, s: Settings, today: string, habit: Habit | 'all', lookback = 120) {
  const complianceRecords = rangeKeys(today, lookback).map((k) => {
    const d = dayStat(index, s, k);
    const smokeOk = d.verifiedHabits.smoke && d.smoke <= s.smokeTarget;
    const pmoOk = d.verifiedHabits.pmo && d.pmo.sessions <= s.pmoTarget;
    const sleepOk = d.verifiedHabits.sleep && (!d.sleep || d.sleep.lateMin <= s.lateGrace);
    const allCompliant = (!s.habits.smoke || smokeOk) && (!s.habits.pmo || pmoOk) && (!s.habits.sleep || sleepOk);
    const isVerifiedForHabit = habit === 'smoke' ? d.verifiedHabits.smoke
      : habit === 'pmo' ? d.verifiedHabits.pmo
      : habit === 'sleep' ? d.verifiedHabits.sleep
      : d.verified;

    return {
      dayKey: k,
      isVerified: isVerifiedForHabit,
      smokeCompliant: smokeOk,
      pmoCompliant: pmoOk,
      sleepCompliant: sleepOk,
      allCompliant,
    };
  });

  return calculateStreak(complianceRecords, today, habit, lookback);
}

export function triggerBreakdown<T extends string>(entries: (SmokeEntry | PmoEntry)[]) {
  const map = new Map<T, number>();
  for (const e of entries) {
    if (!e.trigger) continue;
    const w = e.kind === 'smoke' ? e.qty : 1;
    map.set(e.trigger as T, (map.get(e.trigger as T) ?? 0) + w);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function entriesInRange<K extends Entry['kind']>(index: DayIndex, keys: string[], kind: K) {
  const out: Extract<Entry, { kind: K }>[] = [];
  for (const k of keys) for (const e of index.get(k) ?? []) if (e.kind === kind) out.push(e as Extract<Entry, { kind: K }>);
  return out;
}

export function baselineDaily(s: Settings) {
  return calculateDailyBaselineCost(s.baselinePerDay, s.packPrice, s.packSize);
}

export type PurchaseRow = PurchaseEntry;
export type UrgeRow = UrgeEntry;

export function minutesUntilBedtime(now: number, s: Settings) {
  const today = dayKey(now, s.dayBoundary);
  return Math.round((bedtimeTarget(today, s) - now) / 60_000);
}

export { minutesOfDay };

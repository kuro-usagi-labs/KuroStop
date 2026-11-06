/**
 * Domain shapes used by the UI. These mirror what the future persistence
 * layer (SQLite) will store, so screens will not need to change when real
 * storage is wired in.
 */
import type { Zone } from '@/theme/tokens';

export type { Zone };
export type Habit = 'smoke' | 'pmo' | 'sleep';
export type Intensity = 'normal' | 'strict' | 'brutal';
export type Sensitivity = 'lunak' | 'standar' | 'keras';
export type MotionPref = 'system' | 'on' | 'off';

export type SmokeTrigger = 'stres' | 'kopi' | 'habis_makan' | 'bosan' | 'sosial' | 'kerja' | 'lainnya';
export type PmoTrigger = 'bosan' | 'kesepian' | 'stres' | 'larut_malam' | 'medsos' | 'lainnya';
export type PmoType = 'p' | 'm' | 'pmo';

type Base = { id: string; at: number; note?: string };

export type SmokeEntry = Base & { kind: 'smoke'; qty: number; trigger?: SmokeTrigger };
export type PurchaseEntry = Base & {
  kind: 'purchase';
  unit: 'batang' | 'bungkus';
  qty: number;
  /** total price paid, IDR */
  price: number;
  brand?: string;
};
export type PmoEntry = Base & { kind: 'pmo'; type: PmoType; trigger?: PmoTrigger };
/** `at` is the moment the user pressed "Mulai Tidur". `end` is set on wake. */
export type SleepEntry = Base & { kind: 'sleep'; end?: number };
export type UrgeEntry = Base & {
  kind: 'urge';
  habit: Habit;
  outcome: 'resisted' | 'gave_in' | 'unresolved';
  method?: 'breath' | 'delay' | 'none';
  trigger?: string;
};
/** Explicit "today is clean" confirmation — the only way a zero day becomes verified. */
export type CheckinEntry = Base & { kind: 'checkin' };

export type Entry = SmokeEntry | PurchaseEntry | PmoEntry | SleepEntry | UrgeEntry | CheckinEntry;
export type EntryKind = Entry['kind'];

export type Settings = {
  habits: Record<Habit, boolean>;
  smokeTarget: number;
  pmoTarget: number;
  bedtime: number; // minutes after midnight
  wake: number;
  lateGrace: number; // minutes tolerated after bedtime
  baselinePerDay: number;
  packPrice: number;
  packSize: number;
  singlePrice: number;
  sensitivity: Sensitivity;
  intensity: Intensity;
  messagesOn: boolean;
  notif: { daily: boolean; bedtime: boolean; urge: boolean; weekly: boolean; hideContent: boolean };
  appLock: boolean;
  pmoCover: boolean;
  reduceMotion: MotionPref;
  dayBoundary: number;
  baselineEffectiveDate?: string;
};

export const SMOKE_TRIGGERS: { value: SmokeTrigger; label: string }[] = [
  { value: 'stres', label: 'Stres' },
  { value: 'kopi', label: 'Ngopi' },
  { value: 'habis_makan', label: 'Habis makan' },
  { value: 'bosan', label: 'Bosan' },
  { value: 'sosial', label: 'Nongkrong' },
  { value: 'kerja', label: 'Kerja' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const PMO_TRIGGERS: { value: PmoTrigger; label: string }[] = [
  { value: 'bosan', label: 'Bosan' },
  { value: 'kesepian', label: 'Kesepian' },
  { value: 'stres', label: 'Stres' },
  { value: 'larut_malam', label: 'Larut malam' },
  { value: 'medsos', label: 'Medsos' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const PMO_LABEL: Record<PmoType, { short: string; long: string }> = {
  p: { short: 'P', long: 'Pornografi' },
  m: { short: 'M', long: 'Masturbasi' },
  pmo: { short: 'P+M', long: 'Sesi gabungan' },
};

export const HABIT_META: Record<Habit, { label: string; icon: 'flame-outline' | 'eye-off-outline' | 'moon-outline'; urge: string }> = {
  smoke: { label: 'Rokok', icon: 'flame-outline', urge: 'Ngerokok' },
  pmo: { label: 'PMO', icon: 'eye-off-outline', urge: 'PMO' },
  sleep: { label: 'Tidur', icon: 'moon-outline', urge: 'Begadang' },
};

export const DEFAULT_SETTINGS: Settings = {
  habits: { smoke: true, pmo: true, sleep: true },
  smokeTarget: 5,
  pmoTarget: 0,
  bedtime: 23 * 60,
  wake: 6 * 60 + 30,
  lateGrace: 15,
  baselinePerDay: 12,
  packPrice: 34_000,
  packSize: 16,
  singlePrice: 2_500,
  sensitivity: 'standar',
  intensity: 'brutal',
  messagesOn: true,
  notif: { daily: true, bedtime: true, urge: false, weekly: true, hideContent: true },
  appLock: false,
  pmoCover: true,
  reduceMotion: 'system',
  dayBoundary: 4,
};

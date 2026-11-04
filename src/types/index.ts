export type HabitType = 'smoking' | 'pmo' | 'sleep';

export type PMOEventType = 'pornography' | 'masturbation' | 'combined';

export type ConsequenceZone = 'CLEAR' | 'WARNING' | 'DANGER' | 'CRITICAL';

export type AccountabilityLevel = 'normal' | 'strict' | 'brutal';

export type PurchaseItemType = 'pack' | 'stick';

export interface HabitEvent {
  id: string;
  habitType: HabitType;
  timestamp: number; // Unix epoch ms
  localDate: string; // 'YYYY-MM-DD'
  count: number;
  pmoType?: PMOEventType;
  triggerTag?: string;
  note?: string;
  createdAt: string;
}

export interface PurchaseRecord {
  id: string;
  timestamp: number;
  localDate: string;
  itemType: PurchaseItemType;
  quantity: number;
  totalPrice: number; // Integer IDR
  brandName?: string;
  note?: string;
  createdAt: string;
}

export interface SleepSession {
  id: string;
  sleepNightDate: string; // 'YYYY-MM-DD'
  bedtimeTimestamp: number;
  wakeTimestamp?: number | null;
  targetBedtime: string; // 'HH:mm'
  latenessMinutes: number;
  durationMinutes?: number | null;
  createdAt: string;
}

export interface UrgeLog {
  id: string;
  timestamp: number;
  localDate: string;
  habitType: HabitType;
  resisted: boolean; // true = resisted, false = logged event
  durationSeconds: number;
  triggerTag?: string;
  note?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  smokingTargetDaily: number; // e.g. 0
  pmoTargetDaily: number; // e.g. 0
  targetBedtime: string; // '23:00'
  targetWakeTime: string; // '06:00'
  dailyCigaretteSpendBaseline: number; // Integer IDR (e.g. 30000)
  accountabilityIntensity: AccountabilityLevel;
  reduceMotion: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface HabitSeverity {
  score: number;
  status: 'CLEAR' | 'WARNING' | 'DANGER' | 'CRITICAL';
  summary: string;
  count: number;
}

export interface ConsequenceResult {
  zone: ConsequenceZone;
  totalScore: number;
  smokingSeverity: HabitSeverity;
  pmoSeverity: HabitSeverity;
  sleepSeverity: HabitSeverity;
  triggeringFactors: string[];
  honestyMessage: string;
  accentColor: string;
  atmosphereAlpha: number;
  fissureIntensity: number;
}

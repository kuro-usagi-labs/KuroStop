import { create } from 'zustand';
import {
  ConsequenceResult,
  ConsequenceZone,
  HabitEvent,
  HabitType,
  PMOEventType,
  PurchaseItemType,
  PurchaseRecord,
  SleepSession,
  UrgeLog,
  UserSettings,
} from '../types';
import * as db from '../database/database';
import { calculateDailyZone } from '../features/consequences/engine';
import { calculateFinanceSummary, FinanceSummary } from '../features/finance/calculator';
import {
  getLocalDateString,
  getSleepNightDate,
  calculateBedtimeLatenessMinutes,
} from '../utils/date';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

interface KuroStoreState {
  settings: UserSettings;
  events: HabitEvent[];
  purchases: PurchaseRecord[];
  sleepSessions: SleepSession[];
  urgeLogs: UrgeLog[];
  activeDate: string; // 'YYYY-MM-DD'
  consequence: ConsequenceResult;
  financeSummary: FinanceSummary;
  isSleeping: boolean;
  activeSleepSessionId: string | null;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDate: (date: string) => void;
  logSmoking: (count?: number, note?: string, triggerTag?: string) => Promise<void>;
  logPMO: (pmoType?: PMOEventType, note?: string, triggerTag?: string) => Promise<void>;
  logBedtimeStart: () => Promise<void>;
  logWakeUp: () => Promise<void>;
  logPurchase: (
    itemType: PurchaseItemType,
    quantity: number,
    totalPrice: number,
    brandName?: string,
    note?: string
  ) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  logUrge: (
    habitType: HabitType,
    resisted: boolean,
    durationSeconds: number,
    triggerTag?: string,
    note?: string
  ) => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  purgeAllData: () => Promise<void>;
  recomputeState: () => void;
}

const defaultSettings: UserSettings = {
  id: 'singleton',
  smokingTargetDaily: 0,
  pmoTargetDaily: 0,
  targetBedtime: '23:00',
  targetWakeTime: '06:00',
  dailyCigaretteSpendBaseline: 30000,
  accountabilityIntensity: 'brutal',
  reduceMotion: false,
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
};

const initialConsequence: ConsequenceResult = {
  zone: 'CLEAR',
  totalScore: 0,
  smokingSeverity: { score: 0, status: 'CLEAR', summary: 'Bersih', count: 0 },
  pmoSeverity: { score: 0, status: 'CLEAR', summary: 'Bersih', count: 0 },
  sleepSeverity: { score: 0, status: 'CLEAR', summary: 'Tepat waktu', count: 0 },
  triggeringFactors: [],
  honestyMessage: 'Masih ada di tanganmu. Jaga ritme hari ini.',
  accentColor: '#54C98A',
  atmosphereAlpha: 0,
  fissureIntensity: 0,
};

const initialFinance: FinanceSummary = {
  actualSpending: 0,
  baselineExpectedSpending: 30000,
  avoidedSpending: 30000,
  isOverspent: false,
  totalPacksBought: 0,
  totalSticksBought: 0,
  potentialMonthlySavings: 900000,
  potentialYearlySavings: 10950000,
  purchaseCount: 0,
};

export const useKuroStore = create<KuroStoreState>((set, get) => ({
  settings: defaultSettings,
  events: [],
  purchases: [],
  sleepSessions: [],
  urgeLogs: [],
  activeDate: getLocalDateString(),
  consequence: initialConsequence,
  financeSummary: initialFinance,
  isSleeping: false,
  activeSleepSessionId: null,
  isLoading: true,

  initialize: async () => {
    try {
      await db.initDatabase();
      const settings = await db.getSettings();
      const events = await db.getAllHabitEvents();
      const purchases = await db.getAllPurchases();
      const sleepSessions = await db.getAllSleepSessions();
      const urgeLogs = await db.getAllUrgeLogs();

      // Check if an ongoing sleep session exists (wakeTimestamp is null)
      const ongoingSleep = sleepSessions.find((s) => !s.wakeTimestamp);

      set({
        settings,
        events,
        purchases,
        sleepSessions,
        urgeLogs,
        isSleeping: Boolean(ongoingSleep),
        activeSleepSessionId: ongoingSleep ? ongoingSleep.id : null,
        isLoading: false,
      });

      get().recomputeState();
    } catch (err) {
      console.warn('Error during store initialization:', err);
      set({ isLoading: false });
    }
  },

  setActiveDate: (date: string) => {
    set({ activeDate: date });
    get().recomputeState();
  },

  recomputeState: () => {
    const { activeDate, events, sleepSessions, settings, purchases } = get();

    // Filter events for the evaluated date
    const todayEvents = events.filter((e) => e.localDate === activeDate);
    const todaySleep = sleepSessions.find((s) => s.sleepNightDate === activeDate) || null;

    // Filter purchases for today's spending
    const todayPurchases = purchases.filter((p) => p.localDate === activeDate);
    const todaySpending = todayPurchases.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    const consequence = calculateDailyZone({
      events: todayEvents,
      sleepRecord: todaySleep,
      targetBedtime: settings.targetBedtime,
      currentTimestamp: Date.now(),
      intensity: settings.accountabilityIntensity,
      spendingToday: todaySpending,
    });

    // Compute finance summary
    // Distinct tracked days based on distinct dates in purchases or events
    const distinctDates = new Set([
      activeDate,
      ...events.map((e) => e.localDate),
      ...purchases.map((p) => p.localDate),
    ]);
    const financeSummary = calculateFinanceSummary(
      purchases,
      settings.dailyCigaretteSpendBaseline,
      distinctDates.size
    );

    set({ consequence, financeSummary });
  },

  logSmoking: async (count: number = 1, note?: string, triggerTag?: string) => {
    const today = getLocalDateString();
    const event: HabitEvent = {
      id: generateId(),
      habitType: 'smoking',
      timestamp: Date.now(),
      localDate: today,
      count: Math.max(1, count),
      note,
      triggerTag,
      createdAt: new Date().toISOString(),
    };

    await db.insertHabitEvent(event);
    set((state) => ({ events: [event, ...state.events] }));
    get().recomputeState();
  },

  logPMO: async (pmoType: PMOEventType = 'combined', note?: string, triggerTag?: string) => {
    const today = getLocalDateString();
    const event: HabitEvent = {
      id: generateId(),
      habitType: 'pmo',
      timestamp: Date.now(),
      localDate: today,
      count: 1, // Single session
      pmoType,
      note,
      triggerTag,
      createdAt: new Date().toISOString(),
    };

    await db.insertHabitEvent(event);
    set((state) => ({ events: [event, ...state.events] }));
    get().recomputeState();
  },

  logBedtimeStart: async () => {
    const now = Date.now();
    const sleepNight = getSleepNightDate(now);
    const { settings } = get();
    const lateness = calculateBedtimeLatenessMinutes(settings.targetBedtime, now);

    const session: SleepSession = {
      id: generateId(),
      sleepNightDate: sleepNight,
      bedtimeTimestamp: now,
      targetBedtime: settings.targetBedtime,
      latenessMinutes: lateness,
      createdAt: new Date().toISOString(),
    };

    await db.upsertSleepSession(session);
    set((state) => ({
      sleepSessions: [session, ...state.sleepSessions.filter((s) => s.id !== session.id)],
      isSleeping: true,
      activeSleepSessionId: session.id,
    }));
    get().recomputeState();
  },

  logWakeUp: async () => {
    const { activeSleepSessionId, sleepSessions } = get();
    const now = Date.now();

    if (activeSleepSessionId) {
      const existing = sleepSessions.find((s) => s.id === activeSleepSessionId);
      if (existing) {
        const durationMin = Math.round((now - existing.bedtimeTimestamp) / (60 * 1000));
        const updated: SleepSession = {
          ...existing,
          wakeTimestamp: now,
          durationMinutes: Math.max(0, durationMin),
        };

        await db.upsertSleepSession(updated);
        set((state) => ({
          sleepSessions: state.sleepSessions.map((s) => (s.id === updated.id ? updated : s)),
          isSleeping: false,
          activeSleepSessionId: null,
        }));
        get().recomputeState();
        return;
      }
    }

    set({ isSleeping: false, activeSleepSessionId: null });
  },

  logPurchase: async (
    itemType: PurchaseItemType,
    quantity: number,
    totalPrice: number,
    brandName?: string,
    note?: string
  ) => {
    const today = getLocalDateString();
    const purchase: PurchaseRecord = {
      id: generateId(),
      timestamp: Date.now(),
      localDate: today,
      itemType,
      quantity: Math.max(1, quantity),
      totalPrice: Math.max(0, Math.round(totalPrice)),
      brandName,
      note,
      createdAt: new Date().toISOString(),
    };

    await db.insertPurchase(purchase);
    set((state) => ({ purchases: [purchase, ...state.purchases] }));
    get().recomputeState();
  },

  deleteEvent: async (id: string) => {
    await db.deleteHabitEvent(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    get().recomputeState();
  },

  deletePurchase: async (id: string) => {
    await db.deletePurchase(id);
    set((state) => ({ purchases: state.purchases.filter((p) => p.id !== id) }));
    get().recomputeState();
  },

  logUrge: async (
    habitType: HabitType,
    resisted: boolean,
    durationSeconds: number,
    triggerTag?: string,
    note?: string
  ) => {
    const today = getLocalDateString();
    const urge: UrgeLog = {
      id: generateId(),
      timestamp: Date.now(),
      localDate: today,
      habitType,
      resisted,
      durationSeconds,
      triggerTag,
      note,
      createdAt: new Date().toISOString(),
    };

    await db.insertUrgeLog(urge);
    set((state) => ({ urgeLogs: [urge, ...state.urgeLogs] }));
  },

  updateSettings: async (partial: Partial<UserSettings>) => {
    const updated = await db.updateSettings(partial);
    set({ settings: updated });
    get().recomputeState();
  },

  purgeAllData: async () => {
    await db.purgeAllUserData();
    set({
      events: [],
      purchases: [],
      sleepSessions: [],
      urgeLogs: [],
      isSleeping: false,
      activeSleepSessionId: null,
    });
    get().recomputeState();
  },
}));

/**
 * Persistent SQLite Store for KuroStop.
 * Replaces temporary in-memory state with real offline-first SQLite persistence
 * with optimistic updates, rollback safety, demo isolation, and initialization lifecycle.
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { getAppDatabase, resetDatabaseConnection, runMigrations } from '../db';
import type { IDatabase } from '../db/database.interface';
import {
  SmokingRepository,
  PmoRepository,
  SleepRepository,
  FinanceRepository,
  SettingsRepository,
  UrgeRepository,
  CheckinRepository,
} from '../repositories';
import { generateDemo } from './demo';
import { DEFAULT_SETTINGS, type Entry, type Settings } from './types';
import { uid } from '../lib/format';
import type { Zone } from '../theme/tokens';

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type NewEntry = DistributiveOmit<Entry, 'id'>;
export type EntryPatch = Record<string, unknown>;

export type StoreStatus = 'initializing' | 'ready' | 'error';

export type State = {
  status: StoreStatus;
  isReady: boolean;
  error: string | null;
  onboarded: boolean;
  settings: Settings;
  entries: Entry[];
  zoneOverride: Zone | 'auto';
  isDemoMode: boolean;
};

type Action =
  | { type: 'ready'; settings: Settings; onboarded: boolean; entries: Entry[]; isDemoMode?: boolean }
  | { type: 'error'; error: string }
  | { type: 'onboard'; settings: Settings; entries: Entry[]; isDemoMode: boolean }
  | { type: 'add'; entry: Entry }
  | { type: 'update'; id: string; patch: EntryPatch }
  | { type: 'remove'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'zone'; zone: Zone | 'auto' }
  | { type: 'resetDemo'; entries: Entry[] }
  | { type: 'wipe' }
  | { type: 'restartOnboarding' }
  | { type: 'setDemoMode'; isDemoMode: boolean };

const sortDesc = (arr: Entry[]) => [...arr].sort((a, b) => b.at - a.at);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ready':
      return {
        ...state,
        status: 'ready',
        isReady: true,
        error: null,
        settings: action.settings,
        onboarded: action.onboarded,
        entries: sortDesc(action.entries),
        isDemoMode: action.isDemoMode ?? false,
      };
    case 'error':
      return {
        ...state,
        status: 'error',
        isReady: false,
        error: action.error,
      };
    case 'onboard':
      return {
        ...state,
        onboarded: true,
        settings: action.settings,
        entries: sortDesc(action.entries),
        zoneOverride: 'auto',
        isDemoMode: action.isDemoMode,
      };
    case 'add':
      return {
        ...state,
        entries: sortDesc([action.entry, ...state.entries.filter((e) => e.id !== action.entry.id)]),
      };
    case 'update':
      return {
        ...state,
        entries: sortDesc(state.entries.map((e) => (e.id === action.id ? ({ ...e, ...action.patch } as Entry) : e))),
      };
    case 'remove':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'zone':
      return { ...state, zoneOverride: action.zone };
    case 'resetDemo':
      return { ...state, entries: sortDesc(action.entries), zoneOverride: 'auto' };
    case 'wipe':
      return { ...state, entries: [], zoneOverride: 'auto' };
    case 'restartOnboarding':
      return { ...state, onboarded: false };
    case 'setDemoMode':
      return { ...state, isDemoMode: action.isDemoMode };
  }
}

const initialState: State = {
  status: 'initializing',
  isReady: false,
  error: null,
  onboarded: false,
  settings: DEFAULT_SETTINGS,
  entries: [],
  zoneOverride: 'auto',
  isDemoMode: false,
};

type Repositories = {
  smoking: SmokingRepository;
  pmo: PmoRepository;
  sleep: SleepRepository;
  finance: FinanceRepository;
  settings: SettingsRepository;
  urge: UrgeRepository;
  checkin: CheckinRepository;
};

type AppContextValue = {
  state: State;
  actions: {
    completeOnboarding: (settings: Settings, withDemo: boolean) => Promise<void>;
    add: (entry: NewEntry) => Promise<string>;
    restore: (entry: Entry) => Promise<void>;
    update: (id: string, patch: EntryPatch) => Promise<void>;
    remove: (id: string) => Promise<void>;
    setSettings: (patch: Partial<Settings>) => Promise<void>;
    setZoneOverride: (zone: Zone | 'auto') => void;
    resetDemo: () => Promise<void>;
    wipe: () => Promise<void>;
    restartOnboarding: () => Promise<void>;
    retryInit: () => Promise<void>;
    confirmCheckin: (dayKey: string, note?: string) => Promise<void>;
    reloadFromDb: () => Promise<void>;
    getDatabase: () => IDatabase | null;
  };
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  database,
}: {
  children: React.ReactNode;
  database?: IDatabase;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [initTick, setInitTick] = useState(0);
  const reposRef = useRef<Repositories | null>(null);
  const dbRef = useRef<IDatabase | null>(null);
  const isInitializingRef = useRef(false);

  // Initialize SQLite Database and load persistent data
  useEffect(() => {
    let active = true;

    async function init() {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        console.log('[KuroStop] APP_START: Opening SQLite database...');
        const db = database ?? (await getAppDatabase());
        console.log('[KuroStop] SQLITE_OPENED');
        if (!active) return;
        dbRef.current = db;

        await runMigrations(db);
        console.log('[KuroStop] MIGRATIONS_COMPLETE');

        const repos: Repositories = {
          smoking: new SmokingRepository(db),
          pmo: new PmoRepository(db),
          sleep: new SleepRepository(db),
          finance: new FinanceRepository(db),
          settings: new SettingsRepository(db),
          urge: new UrgeRepository(db),
          checkin: new CheckinRepository(db),
        };
        reposRef.current = repos;

        // Load settings
        const persistedSettings = await repos.settings.getSettings();
        console.log('[KuroStop] SETTINGS_LOADED');

        // Load all entries without query truncation limits
        const [smokes, pmos, sleeps, purchases, urges, checkins] = await Promise.all([
          repos.smoking.getAll(),
          repos.pmo.getAll(),
          repos.sleep.getAll(),
          repos.finance.getAll(),
          repos.urge.getAll(),
          repos.checkin.getAll(),
        ]);

        const allEntries: Entry[] = [
          ...smokes.map((s): Entry => ({
            id: s.id,
            kind: 'smoke',
            qty: s.qty,
            at: s.timestamp,
            trigger: s.trigger,
            note: s.note,
          })),
          ...pmos.map((p): Entry => ({
            id: p.id,
            kind: 'pmo',
            type: p.type,
            at: p.timestamp,
            trigger: p.trigger,
            note: p.note,
          })),
          ...sleeps.map((sl): Entry => ({
            id: sl.id,
            kind: 'sleep',
            at: sl.startTime,
            end: sl.endTime,
            note: sl.note,
          })),
          ...purchases.map((pc): Entry => ({
            id: pc.id,
            kind: 'purchase',
            unit: pc.unit,
            qty: pc.qty,
            price: pc.price,
            brand: pc.brand,
            at: pc.timestamp,
            note: pc.note,
          })),
          ...urges.map((u): Entry => ({
            id: u.id,
            kind: 'urge',
            habit: u.habit,
            outcome: u.outcome,
            method: u.method,
            trigger: u.trigger,
            note: u.note,
            at: u.timestamp,
          })),
          ...checkins.map((c): Entry => ({
            id: `checkin_${c.dayKey}`,
            kind: 'checkin',
            at: c.timestamp,
            note: c.note,
          })),
        ];

        if (active) {
          dispatch({
            type: 'ready',
            settings: persistedSettings,
            onboarded: persistedSettings.onboarded,
            entries: allEntries,
          });
        }
      } catch (err) {
        console.error('[KuroStop] Database initialization error:', err);
        reposRef.current = null;
        if (active) {
          dispatch({
            type: 'error',
            error: (err as Error)?.message || 'Failed to initialize local SQLite database',
          });
        }
      } finally {
        isInitializingRef.current = false;
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [database, initTick]);

  const actions = useMemo(
    () => ({
      completeOnboarding: async (newSettings: Settings, withDemo: boolean) => {
        const repos = reposRef.current;
        if (!repos) {
          throw new Error('Database lokal belum siap untuk menyimpan setup onboarding.');
        }
        await repos.settings.updateSettings({ ...newSettings, onboarded: true });

        let demoEntries: Entry[] = [];
        if (withDemo) {
          demoEntries = generateDemo(newSettings);
        }

        dispatch({
          type: 'onboard',
          settings: newSettings,
          entries: demoEntries,
          isDemoMode: withDemo,
        });
      },

      add: async (newEntry: NewEntry): Promise<string> => {
        if (!state.isDemoMode && (state.status !== 'ready' || !reposRef.current)) {
          throw new Error('Database lokal belum siap. Tunggu hingga proses inisialisasi selesai.');
        }

        const id = uid();
        const fullEntry = { ...newEntry, id } as Entry;

        // Optimistic state update
        dispatch({ type: 'add', entry: fullEntry });

        const repos = reposRef.current;
        if (repos && !state.isDemoMode) {
          try {
            if (fullEntry.kind === 'smoke') {
              await repos.smoking.add({
                id,
                qty: fullEntry.qty,
                timestamp: fullEntry.at,
                trigger: fullEntry.trigger,
                note: fullEntry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (fullEntry.kind === 'pmo') {
              await repos.pmo.add({
                id,
                type: fullEntry.type,
                timestamp: fullEntry.at,
                trigger: fullEntry.trigger,
                note: fullEntry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (fullEntry.kind === 'sleep') {
              await repos.sleep.startSession({
                id,
                startTime: fullEntry.at,
                targetBedtimeMin: state.settings.bedtime,
                note: fullEntry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (fullEntry.kind === 'purchase') {
              await repos.finance.addPurchase({
                id,
                unit: fullEntry.unit,
                qty: fullEntry.qty,
                price: fullEntry.price,
                brand: fullEntry.brand,
                timestamp: fullEntry.at,
                note: fullEntry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (fullEntry.kind === 'urge') {
              await repos.urge.add({
                id,
                habit: fullEntry.habit,
                outcome: fullEntry.outcome,
                method: fullEntry.method,
                trigger: fullEntry.trigger,
                note: fullEntry.note,
                timestamp: fullEntry.at,
                dayBoundary: state.settings.dayBoundary,
              });
            }
          } catch (err) {
            // Rollback on rejection
            dispatch({ type: 'remove', id });
            throw err;
          }
        }

        return id;
      },

      restore: async (entry: Entry): Promise<void> => {
        dispatch({ type: 'add', entry });
        const repos = reposRef.current;
        if (repos && !state.isDemoMode) {
          try {
            if (entry.kind === 'smoke') {
              await repos.smoking.add({
                id: entry.id,
                qty: entry.qty,
                timestamp: entry.at,
                trigger: entry.trigger,
                note: entry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (entry.kind === 'pmo') {
              await repos.pmo.add({
                id: entry.id,
                type: entry.type,
                timestamp: entry.at,
                trigger: entry.trigger,
                note: entry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (entry.kind === 'sleep') {
              await repos.sleep.startSession({
                id: entry.id,
                startTime: entry.at,
                targetBedtimeMin: state.settings.bedtime,
                note: entry.note,
                dayBoundary: state.settings.dayBoundary,
              });
              if (entry.end) {
                await repos.sleep.endSession(entry.id, entry.end);
              }
            } else if (entry.kind === 'purchase') {
              await repos.finance.addPurchase({
                id: entry.id,
                unit: entry.unit,
                qty: entry.qty,
                price: entry.price,
                brand: entry.brand,
                timestamp: entry.at,
                note: entry.note,
                dayBoundary: state.settings.dayBoundary,
              });
            } else if (entry.kind === 'urge') {
              await repos.urge.add({
                id: entry.id,
                habit: entry.habit,
                outcome: entry.outcome,
                method: entry.method,
                trigger: entry.trigger,
                note: entry.note,
                timestamp: entry.at,
                dayBoundary: state.settings.dayBoundary,
              });
            }
          } catch (err) {
            dispatch({ type: 'remove', id: entry.id });
            throw err;
          }
        }
      },

      update: async (id: string, patch: EntryPatch) => {
        const existing = state.entries.find((e) => e.id === id);
        if (!existing) return;

        dispatch({ type: 'update', id, patch });
        const repos = reposRef.current;
        if (repos && !state.isDemoMode) {
          try {
            if (existing.kind === 'smoke') {
              await repos.smoking.update(id, patch as { qty?: number; trigger?: any; note?: string; timestamp?: number });
            } else if (existing.kind === 'sleep' && patch.end !== undefined) {
              await repos.sleep.endSession(id, patch.end as number);
            } else if (existing.kind === 'pmo') {
              await repos.pmo.update(id, patch as { type?: any; trigger?: any; note?: string; timestamp?: number });
            } else if (existing.kind === 'purchase') {
              await repos.finance.update(id, patch as { unit?: any; qty?: number; price?: number; brand?: string; note?: string; timestamp?: number });
            }
          } catch (err) {
            dispatch({ type: 'update', id, patch: existing as Record<string, unknown> });
            throw err;
          }
        }
      },

      remove: async (id: string) => {
        const existing = state.entries.find((e) => e.id === id);
        if (!existing) return;

        dispatch({ type: 'remove', id });
        const repos = reposRef.current;
        if (repos && !state.isDemoMode) {
          try {
            if (existing.kind === 'smoke') await repos.smoking.delete(id);
            else if (existing.kind === 'pmo') await repos.pmo.delete(id);
            else if (existing.kind === 'sleep') await repos.sleep.delete(id);
            else if (existing.kind === 'purchase') await repos.finance.delete(id);
            else if (existing.kind === 'urge') await repos.urge.delete(id);
          } catch (err) {
            dispatch({ type: 'add', entry: existing });
            throw err;
          }
        }
      },

      setSettings: async (patch: Partial<Settings>) => {
        const previous = state.settings;
        dispatch({ type: 'settings', patch });
        const repos = reposRef.current;
        if (repos) {
          try {
            await repos.settings.updateSettings(patch);
          } catch (err) {
            dispatch({ type: 'settings', patch: previous });
            throw err;
          }
        }
      },

      setZoneOverride: (zone: Zone | 'auto') => {
        dispatch({ type: 'zone', zone });
      },

      resetDemo: async () => {
        // SAFETY GUARD: Demo reset must NEVER touch or wipe production user data!
        if (!state.isDemoMode) {
          console.warn('[KuroStop] Reset demo rejected: User is in live production mode. Real data is preserved.');
          return;
        }

        const freshDemo = generateDemo(state.settings);
        dispatch({ type: 'resetDemo', entries: freshDemo });
      },

      wipe: async () => {
        const db = dbRef.current;
        if (db) {
          await db.execAsync(`
            DELETE FROM smoking_events;
            DELETE FROM pmo_events;
            DELETE FROM sleep_sessions;
            DELETE FROM cigarette_purchases;
            DELETE FROM urge_events;
            DELETE FROM daily_checkins;
          `);
        }
        dispatch({ type: 'wipe' });
      },

      restartOnboarding: async () => {
        const repos = reposRef.current;
        if (repos) {
          await repos.settings.updateSettings({ onboarded: false });
        }
        dispatch({ type: 'restartOnboarding' });
      },

      retryInit: async () => {
        resetDatabaseConnection();
        isInitializingRef.current = false;
        setInitTick((t) => t + 1);
      },

      confirmCheckin: async (dayKey: string, note?: string) => {
        const repos = reposRef.current;
        const entryId = `checkin_${dayKey}`;
        const entry: Entry = {
          id: entryId,
          kind: 'checkin',
          at: Date.now(),
          note,
        };
        dispatch({ type: 'add', entry });
        if (repos) {
          try {
            await repos.checkin.confirmClean(dayKey, note);
          } catch (err) {
            dispatch({ type: 'remove', id: entryId });
            throw err;
          }
        }
      },

      getDatabase: () => dbRef.current,

      reloadFromDb: async () => {
        const repos = reposRef.current;
        if (!repos) return;
        const persistedSettings = await repos.settings.getSettings();
        console.log('[KuroStop] SETTINGS_LOADED');
        const [smokes, pmos, sleeps, purchases, urges, checkins] = await Promise.all([
          repos.smoking.getAll(),
          repos.pmo.getAll(),
          repos.sleep.getAll(),
          repos.finance.getAll(),
          repos.urge.getAll(),
          repos.checkin.getAll(),
        ]);

        const allEntries: Entry[] = [
          ...smokes.map((s): Entry => ({ id: s.id, kind: 'smoke', qty: s.qty, at: s.timestamp, trigger: s.trigger, note: s.note })),
          ...pmos.map((p): Entry => ({ id: p.id, kind: 'pmo', type: p.type, at: p.timestamp, trigger: p.trigger, note: p.note })),
          ...sleeps.map((sl): Entry => ({ id: sl.id, kind: 'sleep', at: sl.startTime, end: sl.endTime, note: sl.note })),
          ...purchases.map((pc): Entry => ({ id: pc.id, kind: 'purchase', unit: pc.unit, qty: pc.qty, price: pc.price, brand: pc.brand, at: pc.timestamp, note: pc.note })),
          ...urges.map((u): Entry => ({ id: u.id, kind: 'urge', habit: u.habit, outcome: u.outcome, method: u.method, trigger: u.trigger, note: u.note, at: u.timestamp })),
          ...checkins.map((c): Entry => ({ id: `checkin_${c.dayKey}`, kind: 'checkin', at: c.timestamp, note: c.note })),
        ];

        dispatch({
          type: 'ready',
          settings: persistedSettings,
          onboarded: persistedSettings.onboarded,
          entries: allEntries,
        });
      },
    }),
    [state.settings, state.entries, state.isDemoMode],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

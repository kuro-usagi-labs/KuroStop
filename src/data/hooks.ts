import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { dayKey } from '@/lib/format';
import { buildIndex, dayStat } from './selectors';
import { useApp } from './store';

/** Ticking clock. Re-renders the caller every `intervalMs`. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** App-level Reduce Motion: user preference wins, otherwise follows the OS. */
export function useReduceMotion() {
  const system = useReducedMotion();
  const pref = useApp().state.settings.reduceMotion;
  return pref === 'on' ? true : pref === 'off' ? false : system;
}

/** Shared derived data: day index, today's key, today's stat and effective zone. */
export function useToday(intervalMs = 30_000) {
  const { state } = useApp();
  const now = useNow(intervalMs);
  const s = state.settings;
  const today = dayKey(now, s.dayBoundary);
  const index = useMemo(() => buildIndex(state.entries, s.dayBoundary), [state.entries, s.dayBoundary]);
  const stat = useMemo(() => dayStat(index, s, today), [index, s, today]);
  const simulated = state.zoneOverride !== 'auto';
  const zone = simulated ? (state.zoneOverride as Exclude<typeof state.zoneOverride, 'auto'>) : stat.zone;
  return { now, today, index, stat, zone, simulated, settings: s };
}

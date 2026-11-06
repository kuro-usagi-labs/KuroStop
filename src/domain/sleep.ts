/**
 * Sleep Engine for KuroStop.
 * Accurately handles sleep sessions that cross midnight, lateness calculations, and duration.
 */

import { dayKey, keyStart } from '../lib/format';

export type SleepNightInfo = {
  nightDayKey: string;
  targetBedtimeMs: number;
  actualStartMs: number;
  actualEndMs?: number;
  durationMs?: number;
  lateMin: number;
  isOnTime: boolean;
};

/**
 * Derives the calendar night key that a sleep session belongs to.
 * Default day boundary hour is 4 (04:00 AM Asia/Jakarta).
 * If a sleep session starts at 01:30 AM on Nov 7, it belongs to the night of Nov 6.
 */
export function getSleepNightKey(startTimeMs: number, boundaryHour = 4): string {
  return dayKey(startTimeMs, boundaryHour);
}

/**
 * Calculates epoch timestamp of target bedtime for a given night day key.
 */
export function getTargetBedtimeMs(nightDayKey: string, bedtimeMinAfterMidnight: number, boundaryHour = 4): number {
  const boundaryStart = keyStart(nightDayKey, boundaryHour);
  const offsetFromBoundary = ((bedtimeMinAfterMidnight - boundaryHour * 60 + 1440) % 1440) * 60_000;
  return boundaryStart + offsetFromBoundary;
}

/**
 * Evaluates a sleep session's lateness and duration.
 */
export function evaluateSleepSession(
  startTimeMs: number,
  endTimeMs: number | undefined,
  bedtimeMinAfterMidnight: number,
  lateGraceMin: number,
  boundaryHour = 4,
): SleepNightInfo {
  const nightDayKey = getSleepNightKey(startTimeMs, boundaryHour);
  const targetBedtimeMs = getTargetBedtimeMs(nightDayKey, bedtimeMinAfterMidnight, boundaryHour);

  // Lateness in minutes (can be negative if slept earlier than target)
  const lateMin = Math.round((startTimeMs - targetBedtimeMs) / 60_000);
  const isOnTime = lateMin <= lateGraceMin;

  const durationMs = endTimeMs && endTimeMs > startTimeMs ? endTimeMs - startTimeMs : undefined;

  return {
    nightDayKey,
    targetBedtimeMs,
    actualStartMs: startTimeMs,
    actualEndMs: endTimeMs,
    durationMs,
    lateMin,
    isOnTime,
  };
}

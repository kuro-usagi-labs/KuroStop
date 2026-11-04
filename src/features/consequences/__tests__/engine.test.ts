import {
  calculateDailyZone,
  calculateSmokingSeverity,
  calculatePMOSeverity,
  calculateSleepSeverity,
} from '../engine';
import { HabitEvent, SleepSession } from '../../../types';

describe('Consequence Engine — Unit Tests', () => {
  const dummySmokingEvent = (count: number = 1): HabitEvent => ({
    id: 'test-smoke-1',
    habitType: 'smoking',
    timestamp: Date.now(),
    localDate: '2026-11-05',
    count,
    createdAt: new Date().toISOString(),
  });

  const dummyPMOEvent = (count: number = 1): HabitEvent => ({
    id: 'test-pmo-1',
    habitType: 'pmo',
    timestamp: Date.now(),
    localDate: '2026-11-05',
    count,
    pmoType: 'combined',
    createdAt: new Date().toISOString(),
  });

  const dummySleepRecord = (latenessMinutes: number): SleepSession => ({
    id: 'test-sleep-1',
    sleepNightDate: '2026-11-05',
    bedtimeTimestamp: Date.now(),
    targetBedtime: '23:00',
    latenessMinutes,
    createdAt: new Date().toISOString(),
  });

  test('Fresh slate returns CLEAR zone with 0 score', () => {
    const result = calculateDailyZone({
      events: [],
      sleepRecord: null,
      targetBedtime: '23:00',
      currentTimestamp: new Date('2026-11-05T20:00:00').getTime(), // 8 PM (before bedtime)
    });

    expect(result.zone).toBe('CLEAR');
    expect(result.totalScore).toBe(0);
    expect(result.smokingSeverity.status).toBe('CLEAR');
    expect(result.pmoSeverity.status).toBe('CLEAR');
    expect(result.sleepSeverity.status).toBe('CLEAR');
    expect(result.accentColor).toBe('#54C98A');
    expect(result.fissureIntensity).toBe(0);
  });

  test('1 cigarette escalates to WARNING', () => {
    const result = calculateDailyZone({
      events: [dummySmokingEvent(1)],
      sleepRecord: null,
      targetBedtime: '23:00',
      currentTimestamp: new Date('2026-11-05T20:00:00').getTime(),
    });

    expect(result.zone).toBe('WARNING');
    expect(result.smokingSeverity.status).toBe('WARNING');
    expect(result.smokingSeverity.count).toBe(1);
    expect(result.totalScore).toBe(25);
    expect(result.accentColor).toBe('#E9AA40');
  });

  test('3 cigarettes escalate to DANGER', () => {
    const result = calculateDailyZone({
      events: [dummySmokingEvent(1), dummySmokingEvent(2)],
      sleepRecord: null,
      targetBedtime: '23:00',
      currentTimestamp: new Date('2026-11-05T20:00:00').getTime(),
    });

    expect(result.zone).toBe('DANGER');
    expect(result.smokingSeverity.status).toBe('DANGER');
    expect(result.smokingSeverity.count).toBe(3);
    expect(result.accentColor).toBe('#E76B40');
  });

  test('1 PMO episode triggers WARNING (35 pts)', () => {
    const result = calculateDailyZone({
      events: [dummyPMOEvent(1)],
      sleepRecord: null,
      targetBedtime: '23:00',
      currentTimestamp: new Date('2026-11-05T20:00:00').getTime(),
    });

    expect(result.pmoSeverity.status).toBe('WARNING');
    expect(result.zone).toBe('WARNING');
  });

  test('2 PMO episodes escalate directly to CRITICAL (80 pts)', () => {
    const result = calculateDailyZone({
      events: [dummyPMOEvent(1), dummyPMOEvent(1)],
      sleepRecord: null,
      targetBedtime: '23:00',
      currentTimestamp: new Date('2026-11-05T20:00:00').getTime(),
    });

    expect(result.pmoSeverity.status).toBe('CRITICAL');
    expect(result.zone).toBe('CRITICAL');
    expect(result.accentColor).toBe('#D83D52');
  });

  test('Bedtime lateness beyond 90 minutes triggers CRITICAL sleep severity', () => {
    const result = calculateDailyZone({
      events: [],
      sleepRecord: dummySleepRecord(95),
      targetBedtime: '23:00',
    });

    expect(result.sleepSeverity.status).toBe('CRITICAL');
    expect(result.zone).toBe('CRITICAL');
  });

  test('Multiple violations combine and escalate to CRITICAL', () => {
    const result = calculateDailyZone({
      events: [dummySmokingEvent(2), dummyPMOEvent(1)],
      sleepRecord: dummySleepRecord(30),
      targetBedtime: '23:00',
    });

    // smoking = 50, pmo = 35, sleep = 20 -> total = 105
    expect(result.totalScore).toBe(105);
    expect(result.zone).toBe('CRITICAL');
    expect(result.triggeringFactors.length).toBe(3);
  });
});

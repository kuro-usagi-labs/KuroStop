import {
  getLocalDateString,
  getSleepNightDate,
  calculateBedtimeLatenessMinutes,
  formatIndonesianDate,
} from '../../utils/date';
import { formatIDR, formatSignedIDR } from '../../utils/currency';

describe('Date & Currency Utils — Unit Tests', () => {
  test('getLocalDateString returns YYYY-MM-DD', () => {
    const d = new Date(2026, 10, 5, 14, 30); // Month is 0-indexed: 10 = Nov
    expect(getLocalDateString(d)).toBe('2026-11-05');
  });

  test('Bedtime at 01:30 AM belongs to previous night date', () => {
    // 2026-11-05 01:30 AM belongs to sleep night 2026-11-04
    const d = new Date(2026, 10, 5, 1, 30).getTime();
    expect(getSleepNightDate(d)).toBe('2026-11-04');
  });

  test('Bedtime at 23:30 belongs to current date', () => {
    // 2026-11-05 23:30 belongs to sleep night 2026-11-05
    const d = new Date(2026, 10, 5, 23, 30).getTime();
    expect(getSleepNightDate(d)).toBe('2026-11-05');
  });

  test('Calculates lateness correctly across midnight', () => {
    // Target bedtime: 23:00 on 2026-11-04
    // Actual bedtime: 00:45 on 2026-11-05 (which belongs to sleep night 2026-11-04)
    // Diff: 105 minutes late
    const actualTime = new Date(2026, 10, 5, 0, 45).getTime();
    const lateness = calculateBedtimeLatenessMinutes('23:00', actualTime);
    expect(lateness).toBe(105);
  });

  test('Early bedtime returns 0 lateness minutes', () => {
    // Target bedtime: 23:00 on 2026-11-05
    // Actual bedtime: 22:30 on 2026-11-05
    const actualTime = new Date(2026, 10, 5, 22, 30).getTime();
    const lateness = calculateBedtimeLatenessMinutes('23:00', actualTime);
    expect(lateness).toBe(0);
  });

  test('formatIndonesianDate formats correctly', () => {
    const formatted = formatIndonesianDate('2026-11-05');
    expect(formatted).toContain('5 November 2026');
    expect(formatted).toContain('Kamis');
  });

  test('Currency formatting with dots and rupiah symbol', () => {
    expect(formatIDR(28000)).toBe('Rp 28.000');
    expect(formatIDR(-15000)).toBe('-Rp 15.000');
    expect(formatSignedIDR(45000)).toBe('+Rp 45.000');
    expect(formatSignedIDR(-20000)).toBe('-Rp 20.000');
    expect(formatSignedIDR(0)).toBe('Rp 0');
  });
});

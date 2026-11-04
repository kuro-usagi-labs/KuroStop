import { generateHonestyMessage } from '../honestyEngine';
import { HabitSeverity } from '../../../types';

describe('Brutal Honesty Engine — Unit Tests', () => {
  const clearSeverity: HabitSeverity = { score: 0, status: 'CLEAR', summary: 'Bersih', count: 0 };

  test('Produces calm guidance on clear day', () => {
    const msg = generateHonestyMessage({
      zone: 'CLEAR',
      intensity: 'brutal',
      smoking: clearSeverity,
      pmo: clearSeverity,
      sleep: clearSeverity,
      spendingToday: 0,
      triggeringFactors: [],
    });
    expect(msg).toContain('Hari baru masih bersih');
  });

  test('Produces harsh, direct feedback for smoking violation in brutal mode', () => {
    const msg = generateHonestyMessage({
      zone: 'WARNING',
      intensity: 'brutal',
      smoking: { score: 25, status: 'WARNING', summary: '1 batang', count: 1 },
      pmo: clearSeverity,
      sleep: clearSeverity,
      spendingToday: 0,
      triggeringFactors: ['Rokok: 1 batang'],
    });
    expect(msg).toContain('Baru satu batang');
  });

  test('Produces unforgiving feedback for multiple violations in critical mode', () => {
    const msg = generateHonestyMessage({
      zone: 'CRITICAL',
      intensity: 'brutal',
      smoking: { score: 50, status: 'DANGER', summary: '3 batang', count: 3 },
      pmo: { score: 80, status: 'CRITICAL', summary: '2 sesi', count: 2 },
      sleep: clearSeverity,
      spendingToday: 56000,
      triggeringFactors: ['Rokok: 3 batang', 'PMO: 2 sesi'],
    });
    expect(msg).toContain('melanggar beberapa target sekaligus');
  });

  test('Respects strict vs normal intensity levels', () => {
    const strictMsg = generateHonestyMessage({
      zone: 'WARNING',
      intensity: 'strict',
      smoking: { score: 25, status: 'WARNING', summary: '1 batang', count: 1 },
      pmo: clearSeverity,
      sleep: clearSeverity,
      spendingToday: 0,
      triggeringFactors: [],
    });
    expect(strictMsg).toContain('Baru satu kali');

    const normalMsg = generateHonestyMessage({
      zone: 'WARNING',
      intensity: 'normal',
      smoking: { score: 25, status: 'WARNING', summary: '1 batang', count: 1 },
      pmo: clearSeverity,
      sleep: clearSeverity,
      spendingToday: 0,
      triggeringFactors: [],
    });
    expect(normalMsg).toContain('Ada catatan hari ini');
  });
});

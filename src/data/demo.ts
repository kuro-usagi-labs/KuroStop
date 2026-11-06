/**
 * DEMO DATA — realistic simulated history for the UI prototype.
 * Nothing here is persisted. Replace with repository reads in Phase 2.
 */
import { addDays, dayKey, keyStart, mulberry32 } from '@/lib/format';
import type { Entry, PmoTrigger, PmoType, Settings, SmokeTrigger } from './types';

const SMOKE_TRIGGERS: SmokeTrigger[] = ['stres', 'kopi', 'kopi', 'habis_makan', 'habis_makan', 'bosan', 'sosial', 'kerja'];
const PMO_TRIGGERS: PmoTrigger[] = ['bosan', 'kesepian', 'larut_malam', 'larut_malam', 'medsos', 'stres'];
const PMO_TYPES: PmoType[] = ['pmo', 'pmo', 'p', 'm'];
const BRANDS = ['Surya 16', 'Sampoerna Mild', 'Gudang Garam Filter', 'Marlboro'];
const NOTES = ['Abis meeting panjang', 'Ditawarin temen', 'Nunggu ojol', 'Gak bisa tidur', undefined, undefined, undefined];

export function generateDemo(settings: Settings, now = Date.now(), days = 75): Entry[] {
  const rnd = mulberry32(20261106);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const out: Entry[] = [];
  const b = settings.dayBoundary;
  const today = dayKey(now, b);
  let n = 0;
  const id = () => `demo-${++n}`;

  for (let i = days; i >= 0; i--) {
    const key = addDays(today, -i);
    const start = keyStart(key, b); // 04:00 Jakarta
    const isToday = i === 0;
    // ~12% of past days have no records at all → "tanpa data"
    if (!isToday && rnd() < 0.12) continue;

    // Smoking trends down from ~12/day to ~5/day with noise
    const progress = 1 - i / days;
    const mean = 12 - progress * 7;
    const count = Math.max(0, Math.round(mean + (rnd() - 0.5) * 6));
    for (let c = 0; c < count; c++) {
      const at = start + (3 + rnd() * 18.5) * 3600_000; // 07:00–01:30
      if (at > now) continue;
      out.push({
        id: id(),
        kind: 'smoke',
        at,
        qty: rnd() < 0.08 ? 2 : 1,
        trigger: rnd() < 0.8 ? pick(SMOKE_TRIGGERS) : undefined,
        note: rnd() < 0.12 ? pick(NOTES) : undefined,
      });
    }

    // Purchases: a pack roughly every 2–3 days, sometimes loose sticks
    if (rnd() < 0.42) {
      const at = start + (5 + rnd() * 12) * 3600_000;
      if (at <= now)
        out.push({
          id: id(),
          kind: 'purchase',
          at,
          unit: 'bungkus',
          qty: 1,
          price: [32_000, 33_500, 34_000, 35_000][Math.floor(rnd() * 4)],
          brand: pick(BRANDS),
        });
    }
    if (rnd() < 0.18) {
      const at = start + (8 + rnd() * 10) * 3600_000;
      const qty = 1 + Math.floor(rnd() * 3);
      if (at <= now) out.push({ id: id(), kind: 'purchase', at, unit: 'batang', qty, price: qty * 2_500 });
    }

    // PMO: becomes rarer over time
    const pmoChance = 0.32 - progress * 0.2;
    if (rnd() < pmoChance) {
      const at = start + (17 + rnd() * 6) * 3600_000; // 21:00–03:00
      if (at <= now)
        out.push({
          id: id(),
          kind: 'pmo',
          at,
          type: pick(PMO_TYPES),
          trigger: rnd() < 0.85 ? pick(PMO_TRIGGERS) : undefined,
          note: rnd() < 0.15 ? 'Scroll medsos kelamaan' : undefined,
        });
    }

    // Sleep: start relative to bedtime, crosses midnight frequently
    if (!isToday && rnd() < 0.9) {
      const bedOffsetMin = ((settings.bedtime - b * 60 + 1440) % 1440);
      const lateMin = Math.round((rnd() - 0.25) * 110 - progress * 20);
      const s = start + (bedOffsetMin + lateMin) * 60_000;
      const durMin = 330 + Math.round(rnd() * 140);
      out.push({ id: id(), kind: 'sleep', at: s, end: s + durMin * 60_000 });
    }

    // Urges logged through "Gue Lagi Pengen…"
    if (rnd() < 0.45) {
      const at = start + (6 + rnd() * 16) * 3600_000;
      if (at <= now)
        out.push({
          id: id(),
          kind: 'urge',
          at,
          habit: rnd() < 0.65 ? 'smoke' : rnd() < 0.5 ? 'pmo' : 'sleep',
          outcome: rnd() < 0.68 ? 'resisted' : 'gave_in',
          method: rnd() < 0.5 ? 'breath' : 'delay',
        });
    }
  }
  return out.sort((a, b2) => b2.at - a.at);
}

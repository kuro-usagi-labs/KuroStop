/**
 * Formatting + calendar helpers. All calendar math is pinned to Asia/Jakarta
 * (UTC+7, no DST) so the app behaves the same regardless of device timezone.
 * A "day key" (YYYY-MM-DD) starts at the configurable day boundary hour
 * (default 04:00) so a late night belongs to the evening it started.
 */
export const TZ_OFFSET_MS = 7 * 3600_000;
const DAY_MS = 86_400_000;

export const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const groupThousands = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Indonesian Rupiah: "Rp 34.000", compact: "Rp 34 rb", "Rp 1,2 jt". */
export function rupiah(n: number, opts: { compact?: boolean; sign?: boolean } = {}) {
  const neg = n < 0;
  const abs = Math.round(Math.abs(n));
  const prefix = neg ? '−' : opts.sign && abs > 0 ? '+' : '';
  if (opts.compact && abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${prefix}Rp ${v.toFixed(v >= 10 ? 0 : 1).replace('.', ',')} jt`;
  }
  if (opts.compact && abs >= 10_000) return `${prefix}Rp ${Math.round(abs / 1000)} rb`;
  return `${prefix}Rp ${groupThousands(abs)}`;
}

export function decimal(n: number, digits = 1) {
  return n.toFixed(digits).replace('.', ',');
}

export function percent(n: number) {
  const v = Math.round(n * 100);
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%`;
}

const jkt = (ts: number) => new Date(ts + TZ_OFFSET_MS);

/** "21.40" (Indonesian uses a period as the time separator). */
export function clock(ts: number) {
  const d = jkt(ts);
  return `${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())}`;
}

export function minutesOfDay(ts: number) {
  const d = jkt(ts);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function minutesToClock(m: number) {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(v / 60))}.${pad(v % 60)}`;
}

/** "2j 14m", "45m", "3 hari" */
export function duration(ms: number, opts: { long?: boolean } = {}) {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return opts.long && rh ? `${d} hari ${rh}j` : `${d} hari`;
  }
  if (h === 0) return `${m}m`;
  return m ? `${h}j ${m}m` : `${h}j`;
}

export function durationMin(min: number) {
  return duration(min * 60_000);
}

/** Countdown "4:59" */
export function mmss(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export function dayKey(ts: number, boundaryH = 4) {
  return new Date(ts + TZ_OFFSET_MS - boundaryH * 3600_000).toISOString().slice(0, 10);
}

/** Epoch ms at which a day key begins (boundary hour, Jakarta time). */
export function keyStart(key: string, boundaryH = 4) {
  return Date.parse(`${key}T00:00:00Z`) - TZ_OFFSET_MS + boundaryH * 3600_000;
}

export function addDays(key: string, n: number) {
  return new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string) {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);
}

export function keyParts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
}

export function rangeKeys(endKey: string, days: number) {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(addDays(endKey, -i));
  return out;
}

/** "Jum, 6 Nov" / "Jumat, 6 November" */
export function keyLabel(key: string, style: 'short' | 'long' | 'tiny' = 'short') {
  const p = keyParts(key);
  if (style === 'tiny') return `${p.day} ${MONTHS_SHORT[p.month]}`;
  if (style === 'long') return `${DAYS_LONG[p.dow]}, ${p.day} ${MONTHS_LONG[p.month]}`;
  return `${DAYS_SHORT[p.dow]}, ${p.day} ${MONTHS_SHORT[p.month]}`;
}

export function relativeDay(key: string, today: string) {
  const d = diffDays(today, key);
  if (d === 0) return 'Hari ini';
  if (d === 1) return 'Kemarin';
  return keyLabel(key);
}

/** Wall-clock label for an arbitrary timestamp: "Jum 6 Nov · 21.40" */
export function stampLabel(ts: number) {
  const d = jkt(ts);
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} · ${clock(ts)}`;
}

export function monthKey(key: string) {
  return key.slice(0, 7);
}

export function monthLabel(mKey: string) {
  const [y, m] = mKey.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

export function shiftMonth(mKey: string, n: number) {
  const [y, m] = mKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Deterministic PRNG for demo data + ink-blot shapes. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

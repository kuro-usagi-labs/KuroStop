/**
 * Accountability copy. Rule for every line: criticise the recorded decision
 * or behaviour — never the person's worth or identity.
 */
import { durationMin, rupiah } from '@/lib/format';
import type { Zone } from '@/theme/tokens';
import type { DayStat } from './selectors';
import type { Intensity, Settings } from './types';

const HEADLINES: Record<Intensity, Record<Zone, string[]>> = {
  normal: {
    clear: ['Lembar hari ini masih bersih.', 'Awal yang baik. Pertahankan.'],
    warning: ['Ada target yang terlewat.', 'Satu target meleset hari ini.'],
    danger: ['Hari ini mulai berat.', 'Beberapa target terlewat.'],
    critical: ['Hari ini keluar jalur jauh.', 'Banyak target terlewat hari ini.'],
  },
  strict: {
    clear: ['Bersih. Hari belum selesai.', 'Aman. Jangan lengah.'],
    warning: ['Target dilanggar. Berhenti di sini.', 'Satu batas jebol. Cukup.'],
    danger: ['Ini bukan khilaf lagi. Ini pola.', 'Lo terus milih hal yang sama.'],
    critical: ['Kendali hari ini lepas.', 'Semua batas lo langgar hari ini.'],
  },
  brutal: {
    clear: ['Masih bersih. Jangan ngerasa menang dulu.', 'Bersih — untuk sekarang.'],
    warning: ['Satu target jebol. Mau lanjut ngerusak?', 'Batas lo sendiri, lo langgar sendiri.'],
    danger: ['Lo milih hal yang sama berulang kali.', 'Ini bukan godaan. Ini keputusan.'],
    critical: ['Hari ini lo kalah telak sama kebiasaan.', 'Keputusan hari ini berantakan total.'],
  },
};

const BODY = {
  empty: {
    normal: 'Belum ada catatan hari ini. Catat jujur apa pun yang terjadi.',
    strict: 'Belum ada catatan. Tanpa catatan, nggak ada bukti.',
    brutal: 'Kosong bukan berarti bersih. Catat, atau ini cuma klaim.',
  },
  safe: {
    normal: 'Semua target masih aman. Lanjutkan.',
    strict: 'Aman sejauh ini. Jaga sampai hari berganti.',
    brutal: 'Aman — untuk sekarang. Malam masih panjang, dan lo tahu itu.',
  },
  smoke: {
    normal: '{n} batang dari target {t}. Coba beri jeda sebelum batang berikutnya.',
    strict: '{n} batang, target {t}. Selisihnya itu keputusan, bukan kecelakaan.',
    brutal: '{n} batang, target {t}. Rokok itu nggak nyala sendiri — lo yang nyalain.',
  },
  pmo: {
    normal: '{n} sesi tercatat. Kenali pemicunya, lalu jauhi.',
    strict: '{n} sesi. Lo tahu pemicunya, tapi tetap dibuka.',
    brutal: '{n} sesi. Beberapa menit, lalu sisanya lo bayar pakai fokus dan energi.',
  },
  sleep: {
    normal: 'Tidur {late} lewat dari target. Besok coba lebih awal.',
    strict: 'Telat tidur {late}. Besok pagi lo yang nanggung.',
    brutal: 'Telat {late} dari jam tidur. Layar itu nggak bakal ngasih jawaban jam segini.',
  },
  spend: {
    normal: '{rp} keluar untuk rokok hari ini.',
    strict: '{rp} hari ini. Uang itu bisa buat hal lain.',
    brutal: '{rp} dibakar hari ini. Secara harfiah dibakar.',
  },
} as const;

export const SAMPLE_BY_INTENSITY: Record<Intensity, string> = {
  normal: 'Ada target yang terlewat. Coba beri jeda sebelum batang berikutnya.',
  strict: 'Target dilanggar. Selisihnya itu keputusan, bukan kecelakaan.',
  brutal: 'Batas lo sendiri, lo langgar sendiri. Rokok itu nggak nyala sendiri.',
};

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

export function accountability(zone: Zone, stat: DayStat, s: Settings, seed = 0) {
  const intensity = s.intensity;
  const heads = HEADLINES[intensity][zone];
  const headline = heads[seed % heads.length];
  let body: string;
  if (!stat.verified && zone === 'clear') body = BODY.empty[intensity];
  else if (stat.overPmo > 0) body = fill(BODY.pmo[intensity], { n: stat.pmo.sessions });
  else if (stat.overSmoke > 0) body = fill(BODY.smoke[intensity], { n: stat.smoke, t: s.smokeTarget });
  else if (stat.sleepLate && stat.sleep) body = fill(BODY.sleep[intensity], { late: durationMin(stat.sleep.lateMin) });
  else if (zone !== 'clear' && stat.spend > 0) body = fill(BODY.spend[intensity], { rp: rupiah(stat.spend) });
  else if (zone !== 'clear') body = fill(BODY.smoke[intensity], { n: stat.smoke, t: s.smokeTarget });
  else body = BODY.safe[intensity];
  return { headline, body };
}

/** Neutral status line used when accountability messages are switched off. */
export function neutralStatus(zone: Zone) {
  return {
    clear: 'Semua target dalam batas.',
    warning: 'Satu atau lebih target terlewat.',
    danger: 'Beberapa target terlewat.',
    critical: 'Banyak target terlewat.',
  }[zone];
}

export const URGE_LINES: Record<Intensity, string[]> = {
  normal: ['Dorongan itu seperti gelombang. Biasanya reda dalam beberapa menit.', 'Tarik napas. Lo nggak harus menuruti ini.'],
  strict: ['Dorongan bukan perintah. Lo yang pegang kendali.', 'Tunda dulu. Keputusan bisa nunggu lima menit.'],
  brutal: ['Pengen itu bukan alasan. Tahan lima menit, buktiin.', 'Lo udah pernah tahan. Lakuin lagi sekarang.'],
};

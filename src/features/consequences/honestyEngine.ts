import { AccountabilityLevel, ConsequenceZone, HabitSeverity } from '../../types';

interface HonestyContext {
  zone: ConsequenceZone;
  intensity: AccountabilityLevel;
  smoking: HabitSeverity;
  pmo: HabitSeverity;
  sleep: HabitSeverity;
  spendingToday: number;
  triggeringFactors: string[];
}

export const generateHonestyMessage = (ctx: HonestyContext): string => {
  const { zone, intensity, smoking, pmo, sleep, spendingToday } = ctx;

  // Unrecorded / Clean slate
  if (smoking.count === 0 && pmo.count === 0 && sleep.score === 0) {
    if (intensity === 'brutal') {
      return 'Hari baru masih bersih. Jangan rusak standar yang sudah kamu tetapkan sendiri.';
    }
    if (intensity === 'strict') {
      return 'Lingkunganmu masih utuh. Pertahankan sampai hari ini selesai.';
    }
    return 'Masih ada di tanganmu. Jaga ritme hari ini.';
  }

  // Combined multiple violations
  const violationsCount = (smoking.count > 0 ? 1 : 0) + (pmo.count > 0 ? 1 : 0) + (sleep.score > 0 ? 1 : 0);

  if (zone === 'CRITICAL') {
    if (intensity === 'brutal') {
      if (violationsCount > 1) {
        return 'Bukan cuma satu, kamu melanggar beberapa target sekaligus. Ini bukan khilaf, ini kompromi sadar.';
      }
      if (pmo.count >= 2) {
        return 'Dua kali pengulangan hari ini. Kamu sedang mematikan disiplin yang susah payah kamu bangun.';
      }
      if (smoking.count >= 4) {
        return `${smoking.count} batang hari ini. Kamu sendiri yang menulis ingin berhenti. Lihat layar ini.`;
      }
      if (sleep.score >= 70) {
        return 'Tidurmu hancur berjam-jam lewat target. Besok kamu akan bayar kelelahan ini.';
      }
      return 'Kamu sendiri yang menentukan target ini. Sekarang lihat hasilnya.';
    }
    if (intensity === 'strict') {
      return 'Zona kritis. Disiplinmu jebol hari ini. Saatnya berhenti sebelum makin buruk.';
    }
    return 'Target harian terlewati cukup jauh. Waktunya re-evaluasi komitmenmu.';
  }

  if (zone === 'DANGER') {
    if (intensity === 'brutal') {
      if (smoking.count > 1) {
        return `Sudah ${smoking.count} batang. Alasan apa lagi yang kamu siapkan untuk batang berikutnya?`;
      }
      if (pmo.count >= 1) {
        return 'Satu kali sudah cukup merusak fokusmu hari ini. Jangan beri kebiasaan lama putaran kedua.';
      }
      if (spendingToday > 0) {
        return 'Uang keluar lagi untuk kebiasaan yang ingin kamu hilangkan. Hitung nilainya.';
      }
      return 'Kamu bilang mau berhenti. Hari ini angkanya justru bertambah.';
    }
    if (intensity === 'strict') {
      return 'Peringatan bahaya. Kamu berada di ambang kehilangan kendali atas hari ini.';
    }
    return 'Sudah ada pelanggaran tercatat. Berhenti sekarang.';
  }

  // WARNING ZONE
  if (intensity === 'brutal') {
    if (smoking.count === 1) {
      return 'Baru satu batang. Tapi kompromi selalu dimulai dari "cuma satu".';
    }
    if (pmo.count === 1) {
      return 'Kamu tahu dorongan itu palsu, tapi kamu tetap mengikutinya.';
    }
    if (sleep.score > 0) {
      return 'Waktu tidurmu sudah lewat. Menunda tidur tidak akan menyelesaikan masalah besok.';
    }
    return 'Satu coretan di harimu. Jangan buat coretan kedua.';
  }

  if (intensity === 'strict') {
    return 'Baru satu kali. Jangan beri kebiasaan lama kesempatan kedua.';
  }

  return 'Ada catatan hari ini. Tetap sadar dan kendalikan langkah berikutnya.';
};

/**
 * Date and Time utilities using local calendar semantics
 * Timezone: Asia/Jakarta or user's local device timezone
 */

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayLocalDateString = (date: Date = new Date()): string => {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return getLocalDateString(prev);
};

/**
 * Determine the "sleep night" date.
 * If user logs bedtime between 00:00 and 06:00, it belongs to the previous calendar day's night.
 */
export const getSleepNightDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const hours = d.getHours();
  if (hours < 6) {
    // Bedtime before 6 AM belongs to previous night's bedtime target
    const prev = new Date(timestamp);
    prev.setDate(prev.getDate() - 1);
    return getLocalDateString(prev);
  }
  return getLocalDateString(d);
};

/**
 * Calculate lateness minutes given a target bedtime string 'HH:mm' and a bedtime timestamp.
 * Returns 0 if on time or early, positive minutes if late.
 */
export const calculateBedtimeLatenessMinutes = (
  targetBedtime: string, // e.g. "23:00"
  bedtimeTimestamp: number
): number => {
  const d = new Date(bedtimeTimestamp);
  const [targetHStr, targetMStr] = targetBedtime.split(':');
  const targetH = parseInt(targetHStr, 10);
  const targetM = parseInt(targetMStr, 10);

  // Construct target Date object on the sleep night date
  const sleepNight = getSleepNightDate(bedtimeTimestamp);
  const [yStr, mStr, dayStr] = sleepNight.split('-');
  const targetDate = new Date(
    parseInt(yStr, 10),
    parseInt(mStr, 10) - 1,
    parseInt(dayStr, 10),
    targetH,
    targetM,
    0,
    0
  );

  const diffMs = bedtimeTimestamp - targetDate.getTime();
  if (diffMs <= 0) {
    return 0; // On time or early
  }
  return Math.floor(diffMs / (60 * 1000));
};

/**
 * Indonesian day names and months
 */
const ID_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatIndonesianDate = (dateOrStr: Date | string): string => {
  let d: Date;
  if (typeof dateOrStr === 'string') {
    const parts = dateOrStr.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateOrStr);
    }
  } else {
    d = dateOrStr;
  }
  const dayName = ID_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = ID_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
};

export const formatShortTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const formatDurationHoursMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} menit`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
};

/**
 * Returns an array of past N date strings ['YYYY-MM-DD', ...] up to today
 */
export const getPastNDays = (count: number, anchorDate: Date = new Date()): string[] => {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    days.push(getLocalDateString(d));
  }
  return days;
};

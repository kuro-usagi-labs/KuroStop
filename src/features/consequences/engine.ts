import {
  AccountabilityLevel,
  ConsequenceResult,
  ConsequenceZone,
  HabitEvent,
  HabitSeverity,
  SleepSession,
} from '../../types';
import { calculateBedtimeLatenessMinutes } from '../../utils/date';
import { generateHonestyMessage } from './honestyEngine';

export interface ConsequenceEngineInput {
  events: HabitEvent[];
  sleepRecord: SleepSession | null;
  targetBedtime: string; // e.g. "23:00"
  currentTimestamp?: number;
  intensity?: AccountabilityLevel;
  spendingToday?: number; // integer IDR
}

export const calculateSmokingSeverity = (events: HabitEvent[]): HabitSeverity => {
  const smokingEvents = events.filter((e) => e.habitType === 'smoking');
  const count = smokingEvents.reduce((acc, curr) => acc + (curr.count || 1), 0);

  let score = 0;
  let status: ConsequenceZone = 'CLEAR';
  let summary = 'Bersih (0 batang)';

  if (count === 1) {
    score = 25;
    status = 'WARNING';
    summary = '1 batang tercatat';
  } else if (count >= 2 && count <= 3) {
    score = 50;
    status = 'DANGER';
    summary = `${count} batang tercatat`;
  } else if (count >= 4) {
    score = 75;
    status = 'CRITICAL';
    summary = `${count} batang tercatat (kritis)`;
  }

  return { score, status, summary, count };
};

export const calculatePMOSeverity = (events: HabitEvent[]): HabitSeverity => {
  const pmoEvents = events.filter((e) => e.habitType === 'pmo');
  // Each logged event counts as 1 episode (whether porn, masturbation, or combined)
  const count = pmoEvents.reduce((acc, curr) => acc + (curr.count || 1), 0);

  let score = 0;
  let status: ConsequenceZone = 'CLEAR';
  let summary = 'Bersih (0 sesi)';

  if (count === 1) {
    score = 35;
    status = 'WARNING';
    summary = '1 sesi PMO tercatat';
  } else if (count >= 2) {
    score = 80;
    status = 'CRITICAL';
    summary = `${count} sesi PMO tercatat (kritis)`;
  }

  return { score, status, summary, count };
};

export const calculateSleepSeverity = (
  sleepRecord: SleepSession | null,
  targetBedtime: string,
  currentTimestamp: number = Date.now()
): HabitSeverity => {
  let latenessMinutes = 0;

  if (sleepRecord) {
    latenessMinutes = sleepRecord.latenessMinutes;
  } else {
    // Check provisional lateness if bedtime has passed tonight
    latenessMinutes = calculateBedtimeLatenessMinutes(targetBedtime, currentTimestamp);
  }

  let score = 0;
  let status: ConsequenceZone = 'CLEAR';
  let summary = 'Tepat waktu';

  if (latenessMinutes <= 15) {
    score = 0;
    status = 'CLEAR';
    summary = latenessMinutes > 0 ? `Lewat ${latenessMinutes} mnt (toleransi)` : 'Sesuai target tidur';
  } else if (latenessMinutes <= 45) {
    score = 20;
    status = 'WARNING';
    summary = `Lewat ${latenessMinutes} menit`;
  } else if (latenessMinutes <= 90) {
    score = 45;
    status = 'DANGER';
    summary = `Begadang ${latenessMinutes} menit`;
  } else {
    score = 75;
    status = 'CRITICAL';
    summary = `Begadang parah (${latenessMinutes} mnt)`;
  }

  return { score, status, summary, count: latenessMinutes };
};

export const calculateDailyZone = (input: ConsequenceEngineInput): ConsequenceResult => {
  const {
    events,
    sleepRecord,
    targetBedtime,
    currentTimestamp = Date.now(),
    intensity = 'brutal',
    spendingToday = 0,
  } = input;

  const smoking = calculateSmokingSeverity(events);
  const pmo = calculatePMOSeverity(events);
  const sleep = calculateSleepSeverity(sleepRecord, targetBedtime, currentTimestamp);

  const totalScore = smoking.score + pmo.score + sleep.score;
  const triggeringFactors: string[] = [];

  if (smoking.count > 0) triggeringFactors.push(`Rokok: ${smoking.count} batang`);
  if (pmo.count > 0) triggeringFactors.push(`PMO: ${pmo.count} sesi`);
  if (sleep.count > 15) triggeringFactors.push(`Begadang: ${sleep.count} menit`);

  // Zone determination
  let zone: ConsequenceZone = 'CLEAR';

  if (totalScore === 0) {
    zone = 'CLEAR';
  } else if (
    totalScore >= 75 ||
    smoking.status === 'CRITICAL' ||
    pmo.status === 'CRITICAL' ||
    sleep.status === 'CRITICAL'
  ) {
    zone = 'CRITICAL';
  } else if (
    totalScore >= 40 ||
    smoking.status === 'DANGER' ||
    sleep.status === 'DANGER'
  ) {
    zone = 'DANGER';
  } else {
    zone = 'WARNING';
  }

  let accentColor = '#54C98A';
  let atmosphereAlpha = 0;
  let fissureIntensity = 0;

  switch (zone) {
    case 'CLEAR':
      accentColor = '#54C98A';
      atmosphereAlpha = 0;
      fissureIntensity = 0;
      break;
    case 'WARNING':
      accentColor = '#E9AA40';
      atmosphereAlpha = 0.15;
      fissureIntensity = 0.25;
      break;
    case 'DANGER':
      accentColor = '#E76B40';
      atmosphereAlpha = 0.35;
      fissureIntensity = 0.60;
      break;
    case 'CRITICAL':
      accentColor = '#D83D52';
      atmosphereAlpha = 0.65;
      fissureIntensity = 1.0;
      break;
  }

  const honestyMessage = generateHonestyMessage({
    zone,
    intensity,
    smoking,
    pmo,
    sleep,
    spendingToday,
    triggeringFactors,
  });

  return {
    zone,
    totalScore,
    smokingSeverity: smoking,
    pmoSeverity: pmo,
    sleepSeverity: sleep,
    triggeringFactors,
    honestyMessage,
    accentColor,
    atmosphereAlpha,
    fissureIntensity,
  };
};

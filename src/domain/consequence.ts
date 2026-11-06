/**
 * Pure Deterministic Consequence Engine for KuroStop.
 * Classifies daily behavior into: 'clear' | 'warning' | 'danger' | 'critical'.
 */

import type { ConsequenceEvaluationContext, ConsequenceResult, Sensitivity, Zone } from './types';

export const THRESHOLDS: Record<Sensitivity, { warning: number; danger: number; critical: number }> = {
  lunak: { warning: 2, danger: 4, critical: 7 },
  standar: { warning: 1, danger: 3, critical: 5 },
  keras: { warning: 1, danger: 2, critical: 4 },
};

export function calculateDailyZone(ctx: ConsequenceEvaluationContext): ConsequenceResult {
  let smokePoints = 0;
  let pmoPoints = 0;
  let sleepPoints = 0;
  const factors: string[] = [];

  // 1. Smoking evaluation
  if (ctx.activeHabits.smoke) {
    const excess = Math.max(0, ctx.smokeCount - ctx.targets.smokeTarget);
    if (excess > 0) {
      smokePoints = excess;
      factors.push(`Rokok melebihi target (+${excess} batang)`);
    }
  }

  // 2. PMO evaluation (1 session = 2 severity points)
  if (ctx.activeHabits.pmo) {
    const excess = Math.max(0, ctx.pmoSessions - ctx.targets.pmoTarget);
    if (excess > 0) {
      pmoPoints = excess * 2;
      factors.push(`PMO melebihi target (+${excess} sesi)`);
    }
  }

  // 3. Sleep lateness evaluation
  if (ctx.activeHabits.sleep && ctx.sleepRecord) {
    const s = ctx.sleepRecord;
    // Calculate lateness in minutes relative to target
    // The target bedtime is minutes after midnight on the night of sleep
    const startMinOfDay = new Date(s.startTime + 7 * 3600_000).getUTCHours() * 60 +
      new Date(s.startTime + 7 * 3600_000).getUTCMinutes();
    
    // Normalized diff in minutes
    let lateMin = startMinOfDay - s.targetBedtimeMin;
    if (lateMin < -720) lateMin += 1440; // Sleep started after midnight
    if (lateMin > 720) lateMin -= 1440;

    const beyondGrace = lateMin - s.lateGraceMin;
    if (beyondGrace > 0) {
      if (beyondGrace > 120) {
        sleepPoints = 3;
        factors.push(`Tidur sangat telat (>2 jam melewati batas)`);
      } else if (beyondGrace > 60) {
        sleepPoints = 2;
        factors.push(`Tidur telat (1-2 jam melewati batas)`);
      } else {
        sleepPoints = 1;
        factors.push(`Tidur sedikit terlambat (${beyondGrace} menit melewati batas)`);
      }
    }
  }

  // Multi-habit violation compounding factor:
  // If 2 or more habits violated on the same day, add 1 synergy penalty point
  const habitsViolated = (smokePoints > 0 ? 1 : 0) + (pmoPoints > 0 ? 1 : 0) + (sleepPoints > 0 ? 1 : 0);
  let multiPenalty = 0;
  if (habitsViolated >= 2) {
    multiPenalty = 1;
    factors.push(`Pelanggaran multi-kebiasaan pada hari yang sama`);
  }

  const totalPoints = smokePoints + pmoPoints + sleepPoints + multiPenalty;
  const th = THRESHOLDS[ctx.sensitivity] || THRESHOLDS.standar;

  let zone: Zone = 'clear';
  if (totalPoints >= th.critical) {
    zone = 'critical';
  } else if (totalPoints >= th.danger) {
    zone = 'danger';
  } else if (totalPoints >= th.warning) {
    zone = 'warning';
  }

  return {
    zone,
    points: totalPoints,
    smokePoints,
    pmoPoints,
    sleepPoints: sleepPoints + multiPenalty,
    factors,
    isVerified: ctx.isVerified,
  };
}

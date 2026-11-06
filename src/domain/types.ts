import type { Zone } from '../theme/tokens';
import type { Habit, Intensity, PmoType, Sensitivity, Settings } from '../data/types';

export type { Zone, Habit, Intensity, PmoType, Sensitivity, Settings };

export type ConsequenceEvaluationContext = {
  smokeCount: number;
  pmoSessions: number;
  sleepRecord?: {
    startTime: number;
    endTime?: number;
    targetBedtimeMin: number;
    lateGraceMin: number;
  };
  targets: {
    smokeTarget: number;
    pmoTarget: number;
  };
  activeHabits: {
    smoke: boolean;
    pmo: boolean;
    sleep: boolean;
  };
  sensitivity: Sensitivity;
  isVerified: boolean;
};

export type ConsequenceResult = {
  zone: Zone;
  points: number;
  smokePoints: number;
  pmoPoints: number;
  sleepPoints: number;
  factors: string[];
  isVerified: boolean;
};

export type FinancialPeriodSummary = {
  actualSpend: number; // Integer IDR
  baselineExpectedSpend: number; // Integer IDR
  avoidedSpend: number; // Integer IDR (can be negative)
  purchaseCount: number;
};

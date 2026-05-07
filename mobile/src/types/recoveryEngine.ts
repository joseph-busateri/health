import type { InputMetadata } from './inputMetadata';

export type RecoveryStatus = 'fully_recovered' | 'moderate_recovery' | 'poor_recovery';
export type RecoveryReadiness = 'ready' | 'caution' | 'recovery_focus';

export interface RecoverySourceInputs {
  hrv?: number;
  sleepDurationHours?: number;
  sleepQuality?: number;
  restingHr?: number;
  stressLevel?: number;
  workoutLoad?: number;
  verbalRecoveryFeeling?: number;
  adherenceScore?: number;
}

export interface RecoveryRecommendation {
  summary: string;
  actions: string[];
}

export interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

export interface RecoveryScoreBreakdown {
  sleepRecovery: ScoreComponent;
  cardiovascularRecovery: ScoreComponent;
  trainingLoad: ScoreComponent;
  subjectiveRecovery: ScoreComponent;
  total: number;
  maxTotal: number;
  percentage: number;
}

export interface RecoveryRecord {
  id: string;
  userId: string;
  date: string;
  recoveryScore: number;
  recoveryStatus: RecoveryStatus;
  readinessClassification: RecoveryReadiness;
  sourceInputs: RecoverySourceInputs;
  recommendation: RecoveryRecommendation;
  createdAt: string;
  detailedInputs?: InputMetadata[];
  scoreBreakdown?: RecoveryScoreBreakdown;
}

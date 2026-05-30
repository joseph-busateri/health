import type { InputMetadata } from './inputMetadata';

export type PerformanceStatus = 'optimal' | 'good' | 'moderate' | 'limited';

export interface PerformanceSourceInputs {
  painLevel?: number;
  tightnessLevel?: number;
  sorenessLevel?: number;
  affectedArea?: string;
  jointHealthStatus?: 'stable' | 'caution' | 'aggravated';
  workoutAdherence?: number;
  workoutLoad?: number;
  sessionCompletionRate?: number;
  workoutStatus?: 'optimal' | 'moderate' | 'constrained' | 'deload';
  vo2Max?: number;
  restingHeartRate?: number;
  leanMassLb?: number;
  skeletalMuscleMassLb?: number;
  bodyFatPercentage?: number;
  recoveryScore?: number;
  sleepQuality?: number;
  stressScore?: number;
}

export interface PerformanceRecommendation {
  summary: string;
  actions: string[];
}

export interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

export interface PerformanceScoreBreakdown {
  jointHealth: ScoreComponent;
  trainingExecution: ScoreComponent;
  physicalCapacity: ScoreComponent;
  recoveryReadiness: ScoreComponent;
  total: number;
  maxTotal: number;
  percentage: number;
}

export interface PerformanceEvidence {
  signals: PerformanceEvidenceSignal[];
  summary: string;
}

export interface PerformanceEvidenceSignal {
  name: string;
  value: number | string;
  interpretation: string;
}

export interface PerformanceRecord {
  id: string;
  userId: string;
  date: string;
  performanceScore: number;
  performanceStatus: PerformanceStatus;
  sourceInputs: PerformanceSourceInputs;
  recommendation: PerformanceRecommendation;
  evidence: PerformanceEvidence;
  createdAt: string;
  detailedInputs?: InputMetadata[];
  scoreBreakdown?: PerformanceScoreBreakdown;
}

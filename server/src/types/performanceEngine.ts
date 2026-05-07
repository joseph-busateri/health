import type { InputMetadata } from './inputMetadata';

export type PerformanceStatus = 'optimal' | 'good' | 'moderate' | 'limited';

export interface PerformanceSourceInputs {
  // Joint Health (from jointHealthEngine)
  painLevel?: number; // 0-10 scale
  tightnessLevel?: number; // 0-10 scale
  sorenessLevel?: number; // 0-10 scale
  affectedArea?: string;
  jointHealthStatus?: 'stable' | 'caution' | 'aggravated';
  
  // Training Execution (from adherenceEngine + workoutEngine)
  workoutAdherence?: number; // 0-100
  workoutLoad?: number; // 1-10 scale
  sessionCompletionRate?: number; // 0-100
  workoutStatus?: 'optimal' | 'moderate' | 'constrained' | 'deload';
  
  // Physical Capacity (from body composition + devices)
  vo2Max?: number; // ml/kg/min
  restingHeartRate?: number; // bpm
  leanMassLb?: number; // lbs
  skeletalMuscleMassLb?: number; // lbs
  bodyFatPercentage?: number; // %
  
  // Recovery Readiness (from recoveryEngine)
  recoveryScore?: number; // 0-100
  sleepQuality?: number; // 1-5 scale
  stressScore?: number; // 0-100
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
  jointHealth: ScoreComponent; // 30 pts max
  trainingExecution: ScoreComponent; // 35 pts max
  physicalCapacity: ScoreComponent; // 20 pts max
  recoveryReadiness: ScoreComponent; // 15 pts max
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

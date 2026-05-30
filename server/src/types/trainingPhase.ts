// Training Phase Types

export type TrainingPhase = 'hypertrophy' | 'strength' | 'peaking' | 'maintenance' | 'unknown';

export interface TrainingPhaseDetermination {
  phase: TrainingPhase;
  rationale: string;
  goalAlignment?: number;
  confidence: number;
  source: 'goals' | 'baseline' | 'default';
}

export interface TrainingPhaseConfig {
  userId: string;
  phase: TrainingPhase;
  adherenceThreshold: number;
  maxLoadDeltaPercent: number;
  maxSetAdditions: number;
  enableAIOverload: boolean;
  aiConfidenceThreshold: number;
  updatedAt: string;
}

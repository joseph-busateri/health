// Workout Engine AI Enrichment Types
// Follows proven architecture from Recovery/Stress/Joint/Adherence engines

export type WorkoutStatus = 'optimal' | 'moderate' | 'constrained' | 'deload';

export interface WorkoutSourceInputs {
  recoveryScore?: number;
  stressScore?: number;
  jointRisk?: string;
  adherenceScore?: number;
  predictiveRisk?: string;
  goalAlignment?: number;
  currentWeek?: number;
  trainingStyle?: string;
}

export interface WorkoutEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export interface WorkoutEvidence {
  workoutStatus: WorkoutStatus;
  sourceInputs: WorkoutSourceInputs;
  signals: WorkoutEvidenceSignal[];
  summary: string;
}

export type WorkoutRecommendationPriority = 'critical' | 'important' | 'optimization';
export type WorkoutRecommendationSource = 'deterministic' | 'ai_enriched' | 'fallback';

export interface WorkoutRecommendation {
  type: 'workout';
  priority: WorkoutRecommendationPriority;
  summary: string;
  rationale?: string;
  actions: string[];
  source?: WorkoutRecommendationSource;
}

export interface WorkoutEngineRecord {
  id: string;
  userId: string;
  date: string;
  workoutStatus: WorkoutStatus;
  sourceInputs: WorkoutSourceInputs;
  evidence?: WorkoutEvidence;
  recommendation: WorkoutRecommendation;
  createdAt: string;
}

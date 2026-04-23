// Workout Today Integrated Types
// These types match the backend integrated service response structure

export type WorkoutStatus = 'optimal' | 'moderate' | 'constrained' | 'deload';
export type WorkoutSource = 'baseline' | 'adjusted' | 'ai_optimized';
export type CyclePhase = 'concentric' | 'eccentric' | 'isometric';

export interface WorkoutExerciseIntegrated {
  name: string;
  sets: number;
  reps: string;
  intensity?: string;
  rest?: string;
  substitution?: string;
  notes?: string;
  originalSets?: number;
  originalReps?: string;
  adjustmentReason?: string;
}

export interface WorkoutAdjustmentApplied {
  type: 'volume' | 'intensity' | 'substitution' | 'rest' | 'deload' | 'progressive_overload';
  change: string;
  reason: string;
  source?: string;
}

export interface WorkoutCrossEnginePattern {
  name: string;
  severity: 'low' | 'moderate' | 'high';
  summary: string;
}

export interface WorkoutCrossEngineInfluence {
  applied: boolean;
  overallStatus?: 'optimal' | 'moderate' | 'constrained' | 'high_risk';
  influencingEngines?: string[];
  patterns?: WorkoutCrossEnginePattern[];
  summary?: string;
}

export interface WorkoutTodayIntegrated {
  id: string;
  userId: string;
  date: string;
  workoutType: string;
  cycleWeek?: number;
  cyclePhase?: CyclePhase;
  workoutStatus: WorkoutStatus;
  adjustments: WorkoutAdjustmentApplied[];
  adjustmentsApplied?: WorkoutAdjustmentApplied[];
  exercises: WorkoutExerciseIntegrated[];
  summary: string;
  source: WorkoutSource;
  crossEngineInfluence?: WorkoutCrossEngineInfluence;
  sourceSignals: {
    recoveryScore?: number;
    stressScore?: number;
    jointRisk?: string;
    adherenceScore?: number;
    goalAlignment?: number;
    predictiveRisk?: string;
  };
  createdAt: string;
}

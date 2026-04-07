// Workout Today Integrated Types
// Unifies baseline workout, AI adjustments, and all engine signals

export type CyclePhase = 'concentric' | 'eccentric' | 'isometric';
export type WorkoutSource = 'baseline' | 'adjusted' | 'ai_optimized';

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
  workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload';
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

export interface WorkoutTodayContext {
  userId: string;
  date: string;
  baselineWorkout?: any;
  workoutEngineRecommendation?: any;
  recoveryScore?: number;
  stressScore?: number;
  jointRisk?: string;
  adherenceScore?: number;
  goalAlignment?: number;
  predictiveRisk?: string;
  userGoals?: string[];
}

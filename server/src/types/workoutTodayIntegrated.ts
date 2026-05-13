// Workout Today Integrated Types
// Unifies baseline workout, AI adjustments, and all engine signals

import type { ExerciseClassificationType, MovementPattern } from './exerciseClassification';
import type { TrainingPhase } from './trainingPhase';
import type { OverloadDecision } from '../services/overloadPlannerService';

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
  // Enhanced fields for V2
  exerciseKey?: string;
  classification?: ExerciseClassificationType;
  movementPattern?: MovementPattern;
  isPrimaryCompound?: boolean;
  originalLoad?: string;
  newLoad?: string;
  loadDeltaPercent?: number;
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
  // Enhanced fields for V2
  trainingPhase?: TrainingPhase;
  trainingPhaseRationale?: string;
  aiOverloadDecision?: OverloadDecision;
  overloadConfig?: {
    adherenceThreshold: number;
    maxLoadDeltaPercent: number;
    maxSetAdditions: number;
    enableAIOverload: boolean;
    aiConfidenceThreshold: number;
  };
  exerciseClassifications?: Array<{
    exerciseKey: string;
    classification: ExerciseClassificationType;
    movementPattern?: MovementPattern;
  }>;
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

// Workout Today V3 Types - Enhanced with AI Overload, Exercise Classification, Training Phase
// These types extend V2 with new progressive overload features

export type WorkoutStatus = 'optimal' | 'moderate' | 'constrained' | 'deload';
export type WorkoutSource = 'baseline' | 'adjusted' | 'ai_optimized';
export type CyclePhase = 'concentric' | 'eccentric' | 'isometric';
export type ExerciseClassificationType = 'compound' | 'isolation' | 'unknown';
export type MovementPattern = 'squat' | 'hinge' | 'push' | 'pull' | 'lunge' | 'rotation' | 'carry' | 'unknown';
export type TrainingPhase = 'hypertrophy' | 'strength' | 'peaking' | 'maintenance' | 'unknown';

export interface WorkoutExerciseIntegratedV3 {
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
  // V3 enhancements
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

export interface OverloadAdjustment {
  exerciseKey: string;
  loadDeltaPercent?: number;
  addSet?: boolean;
  removeSet?: boolean;
  cue?: string;
  justification?: string;
}

export interface OverloadDecision {
  confidence: number;
  summary: string;
  notes: string[];
  adjustments: OverloadAdjustment[];
}

export interface ExerciseClassificationInfo {
  exerciseKey: string;
  classification: ExerciseClassificationType;
  movementPattern?: MovementPattern;
}

export interface OverloadConfig {
  adherenceThreshold: number;
  maxLoadDeltaPercent: number;
  maxSetAdditions: number;
  enableAIOverload: boolean;
  aiConfidenceThreshold: number;
}

export interface WorkoutTodayIntegratedV3 {
  id: string;
  userId: string;
  date: string;
  workoutType: string;
  cycleWeek?: number;
  cyclePhase?: CyclePhase;
  workoutStatus: WorkoutStatus;
  adjustments: WorkoutAdjustmentApplied[];
  adjustmentsApplied?: WorkoutAdjustmentApplied[];
  exercises: WorkoutExerciseIntegratedV3[];
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
  // V3 enhancements
  trainingPhase?: TrainingPhase;
  trainingPhaseRationale?: string;
  aiOverloadDecision?: OverloadDecision;
  overloadConfig?: OverloadConfig;
  exerciseClassifications?: ExerciseClassificationInfo[];
  createdAt: string;
}

export interface OverloadCompletionRecord {
  id: string;
  userId: string;
  date: string;
  exerciseKey: string;
  exerciseName: string;
  originalSets?: number;
  originalReps?: string;
  originalLoad?: string;
  newSets?: number;
  newReps?: string;
  newLoad?: string;
  loadDeltaPercent?: number;
  adjustmentType: string;
  adjustmentSource: string;
  aiConfidence?: number;
  aiJustification?: string;
  aiCue?: string;
  completed: boolean;
  completedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OverloadCompletionStats {
  totalRecommendations: number;
  completedRecommendations: number;
  completionRate: number;
  averageLoadDelta: number;
  averageSetAddition: number;
  aiRecommendations: number;
  simpleRecommendations: number;
  aiAcceptanceRate: number;
}

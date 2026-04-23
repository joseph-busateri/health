// Overload Tracking Types

export interface OverloadCompletionRecord {
  id: string;
  userId: string;
  date: string;
  exerciseKey: string;
  exerciseName: string;
  
  // Original values (before overload)
  originalSets?: number;
  originalReps?: string;
  originalLoad?: string;
  
  // New values (after overload)
  newSets?: number;
  newReps?: string;
  newLoad?: string;
  
  // Adjustment details
  loadDeltaPercent?: number;
  adjustmentType: 'volume' | 'load' | 'intensity' | 'progressive_overload' | 'deload';
  adjustmentSource: 'ai_overload_planner' | 'simple_overload' | 'manual';
  
  // AI decision metadata (if applicable)
  aiConfidence?: number;
  aiJustification?: string;
  aiCue?: string;
  
  // Completion tracking
  completed: boolean;
  completedAt?: string;
  completionNotes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface OverloadCompletionInput {
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
  adjustmentType: 'volume' | 'load' | 'intensity' | 'progressive_overload' | 'deload';
  adjustmentSource: 'ai_overload_planner' | 'simple_overload' | 'manual';
  aiConfidence?: number;
  aiJustification?: string;
  aiCue?: string;
}

export interface OverloadHistoryRecord {
  id: string;
  userId: string;
  date: string;
  workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload';
  trainingPhase?: string;
  recoveryScore?: number;
  stressScore?: number;
  jointScore?: number;
  adherenceScore?: number;
  decisionSource: 'ai_overload_planner' | 'simple_overload' | 'none';
  aiConfidence?: number;
  adjustmentsCount: number;
  summary?: string;
  createdAt: string;
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

export interface ExerciseClassificationRecord {
  id: string;
  exerciseName: string;
  exerciseKey: string;
  classification: 'compound' | 'isolation' | 'unknown';
  movementPattern?: 'squat' | 'hinge' | 'push' | 'pull' | 'lunge' | 'rotation' | 'carry' | 'unknown';
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  isPrimaryCompound: boolean;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  equipmentRequired?: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressiveOverloadConfigRecord {
  id: string;
  userId: string;
  adherenceThreshold: number;
  maxLoadDeltaPercent: number;
  maxSetAdditions: number;
  enableAIOverload: boolean;
  aiConfidenceThreshold: number;
  trainingPhase?: 'hypertrophy' | 'strength' | 'peaking' | 'maintenance' | 'unknown';
  trainingPhaseOverride: boolean;
  enableExerciseClassification: boolean;
  enableTrainingPhaseLogic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressiveOverloadConfigInput {
  userId: string;
  adherenceThreshold?: number;
  maxLoadDeltaPercent?: number;
  maxSetAdditions?: number;
  enableAIOverload?: boolean;
  aiConfidenceThreshold?: number;
  trainingPhase?: 'hypertrophy' | 'strength' | 'peaking' | 'maintenance' | 'unknown';
  trainingPhaseOverride?: boolean;
  enableExerciseClassification?: boolean;
  enableTrainingPhaseLogic?: boolean;
}

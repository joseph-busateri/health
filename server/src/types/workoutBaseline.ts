// Workout Baseline Types
// Supports 12-week training cycles with agent-managed workout plans

export type TrainingStyle = 'concentric' | 'eccentric' | 'isometric';
export type TrainingCycleStatus = 'active' | 'completed' | 'paused';
export type WorkoutVersionCreator = 'user' | 'agent';
export type WorkoutChangeType = 
  | 'exercise_added' 
  | 'exercise_removed' 
  | 'exercise_modified' 
  | 'sets_changed' 
  | 'reps_changed' 
  | 'weight_changed' 
  | 'order_changed';

// ============================================================================
// TRAINING CYCLE
// ============================================================================

export interface TrainingCycle {
  id: string;
  userId: string;
  cycleName: string;
  cycleNumber: number;
  totalWeeks: number;
  currentWeek: number;
  
  // Week ranges for different training styles
  concentricWeeksStart: number;
  concentricWeeksEnd: number;
  eccentricWeek: number;
  isometricWeek: number;
  
  // Cycle dates
  cycleStartDate: string;
  cycleEndDate?: string;
  
  // Status
  status: TrainingCycleStatus;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingCycleInput {
  userId: string;
  cycleName: string;
  cycleNumber?: number;
  totalWeeks?: number;
  concentricWeeksStart?: number;
  concentricWeeksEnd?: number;
  eccentricWeek?: number;
  isometricWeek?: number;
  cycleStartDate: string;
}

// ============================================================================
// WORKOUT PLAN VERSION
// ============================================================================

export interface WorkoutPlanVersion {
  id: string;
  userId: string;
  trainingCycleId?: string;
  
  // Version tracking
  versionNumber: number;
  versionName?: string;
  isCurrent: boolean;
  
  // Version metadata
  createdBy: WorkoutVersionCreator;
  createdReason?: string;
  basedOnRecommendationId?: string;
  
  // Timestamps
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
}

export interface CreateWorkoutPlanVersionInput {
  userId: string;
  trainingCycleId?: string;
  versionName?: string;
  createdBy: WorkoutVersionCreator;
  createdReason?: string;
  effectiveFrom: string;
}

// ============================================================================
// WORKOUT SPLIT DAY
// ============================================================================

export interface WorkoutSplitDay {
  id: string;
  planVersionId: string;
  
  // Split information
  splitDay: string; // e.g., "Day 1", "Monday", "Push Day"
  splitFocus: string; // e.g., "Push", "Pull", "Legs"
  dayOrder: number;
  
  // Training style for this day (varies by week in cycle)
  week1_10Style: TrainingStyle;
  week11Style: TrainingStyle;
  week12Style: TrainingStyle;
  
  // Optional notes
  notes?: string;
  
  createdAt: string;
}

export interface CreateWorkoutSplitDayInput {
  planVersionId: string;
  splitDay: string;
  splitFocus: string;
  dayOrder: number;
  week1_10Style?: TrainingStyle;
  week11Style?: TrainingStyle;
  week12Style?: TrainingStyle;
  notes?: string;
}

// ============================================================================
// WORKOUT EXERCISE
// ============================================================================

export interface WorkoutExercise {
  id: string;
  splitDayId: string;
  
  // Exercise details
  exerciseName: string;
  exerciseDescription?: string;
  exerciseOrder: number;
  
  // Exercise parameters
  sets: number;
  reps: string; // Can be range like "8-12" or specific like "10"
  weight?: string; // Can be specific weight or "bodyweight", "progressive"
  
  // Rest periods
  restSeconds?: number;
  
  // Execution notes
  tempo?: string; // e.g., "3-1-1-0"
  executionNotes?: string;
  
  // Alternative exercises
  alternativeExercises?: string[];
  
  createdAt: string;
}

export interface CreateWorkoutExerciseInput {
  splitDayId: string;
  exerciseName: string;
  exerciseDescription?: string;
  exerciseOrder: number;
  sets: number;
  reps: string;
  weight?: string;
  restSeconds?: number;
  tempo?: string;
  executionNotes?: string;
  alternativeExercises?: string[];
}

// ============================================================================
// WORKOUT EXECUTION LOG
// ============================================================================

export interface WorkoutExecutionLog {
  id: string;
  userId: string;
  exerciseId: string;
  trainingCycleId?: string;
  
  // Execution details
  executedDate: string;
  weekNumber: number;
  trainingStyle: TrainingStyle;
  
  // Actual performance
  setsCompleted: number;
  repsCompleted: string; // Can be array like "10,10,8,8"
  weightUsed: string;
  
  // Performance metrics
  rpe?: number; // Rate of Perceived Exertion (1-10)
  formQuality?: number; // 1=poor, 5=excellent
  
  // Notes
  notes?: string;
  skipped: boolean;
  skipReason?: string;
  
  createdAt: string;
}

export interface CreateWorkoutExecutionLogInput {
  userId: string;
  exerciseId: string;
  trainingCycleId?: string;
  executedDate: string;
  weekNumber: number;
  trainingStyle: TrainingStyle;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  rpe?: number;
  formQuality?: number;
  notes?: string;
  skipped?: boolean;
  skipReason?: string;
}

// ============================================================================
// WORKOUT PLAN CHANGES
// ============================================================================

export interface WorkoutPlanChange {
  id: string;
  fromVersionId?: string;
  toVersionId: string;
  
  // Change details
  changeType: WorkoutChangeType;
  changeDescription: string;
  
  // What changed
  exerciseName?: string;
  splitDay?: string;
  oldValue?: string;
  newValue?: string;
  
  // Why it changed
  reason?: string;
  
  createdAt: string;
}

export interface CreateWorkoutPlanChangeInput {
  fromVersionId?: string;
  toVersionId: string;
  changeType: WorkoutChangeType;
  changeDescription: string;
  exerciseName?: string;
  splitDay?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

// ============================================================================
// WORKOUT BASELINE DOCUMENT
// ============================================================================

export type WorkoutDocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface WorkoutBaselineDocument {
  id: string;
  userId: string;
  planVersionId?: string;
  
  // Document info
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  
  // Processing status
  processingStatus: WorkoutDocumentProcessingStatus;
  processingError?: string;
  
  // Extracted data
  extractedText?: string;
  parsedWorkoutData?: ParsedWorkoutData;
  
  uploadedAt: string;
  processedAt?: string;
}

// ============================================================================
// PARSED WORKOUT DATA (from Excel/document)
// ============================================================================

export interface ParsedWorkoutData {
  splitDays: ParsedSplitDay[];
  metadata?: {
    cycleName?: string;
    totalWeeks?: number;
    uploadSource?: string;
  };
}

export interface ParsedSplitDay {
  splitDay: string;
  splitFocus: string;
  dayOrder: number;
  exercises: ParsedExercise[];
}

export interface ParsedExercise {
  exerciseName: string;
  exerciseDescription?: string;
  sets: number;
  reps: string;
  weight?: string;
  order: number;
}

// ============================================================================
// COMPLETE WORKOUT PLAN (for API responses)
// ============================================================================

export interface CompleteWorkoutPlan {
  version: WorkoutPlanVersion;
  trainingCycle?: TrainingCycle;
  splitDays: WorkoutSplitDayWithExercises[];
  changes?: WorkoutPlanChange[];
}

export interface WorkoutSplitDayWithExercises extends WorkoutSplitDay {
  exercises: WorkoutExercise[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UploadWorkoutBaselineRequest {
  userId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
  cycleName?: string;
}

export interface GetCurrentWorkoutPlanResponse {
  success: boolean;
  data?: CompleteWorkoutPlan;
  error?: string;
}

export interface GetWorkoutHistoryResponse {
  success: boolean;
  data?: {
    versions: WorkoutPlanVersion[];
    currentVersion?: CompleteWorkoutPlan;
  };
  error?: string;
}

export interface LogWorkoutExecutionRequest {
  userId: string;
  exerciseId: string;
  executedDate: string;
  setsCompleted: number;
  repsCompleted: string;
  weightUsed: string;
  rpe?: number;
  formQuality?: number;
  notes?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface UpdateWorkoutPlanRequest {
  userId: string;
  createdBy: WorkoutVersionCreator;
  createdReason: string;
  changes: WorkoutPlanUpdateChange[];
}

export interface WorkoutPlanUpdateChange {
  splitDay: string;
  exerciseName: string;
  changeType: WorkoutChangeType;
  newValue?: any;
  reason?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface WorkoutAdherenceMetrics {
  userId: string;
  weekNumber: number;
  totalPlannedWorkouts: number;
  completedWorkouts: number;
  adherencePercentage: number;
  averageRpe?: number;
  averageFormQuality?: number;
}

export interface WorkoutProgressMetrics {
  exerciseName: string;
  weekNumber: number;
  averageWeight: number;
  averageReps: number;
  volumeProgression: number; // Percentage change
  strengthProgression: number; // Percentage change
}

// Workout Baseline Document Engine Types

export interface WorkoutDocument {
  id: string;
  userId: string;
  fileReference?: string;
  storagePath?: string;
  uploadDate: string;
  documentType: 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';
  programStartDate?: string;
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractionConfidence?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutBaseline {
  id: string;
  userId: string;
  documentId: string;
  
  // Program Structure
  programName?: string;
  splitName?: string;
  workoutDaysPerWeek?: number;
  restDaysPerWeek?: number;
  trainingStyle?: string;
  programNotes?: string;
  
  // Weekly Schedule
  mondayPlan?: string;
  tuesdayPlan?: string;
  wednesdayPlan?: string;
  thursdayPlan?: string;
  fridayPlan?: string;
  saturdayPlan?: string;
  sundayPlan?: string;
  
  // Workout Context
  muscleGroupFocus?: string[];
  frequencyByMuscleGroup?: Record<string, number>;
  plannedVolumeNotes?: string;
  plannedIntensityNotes?: string;
  cardioOrConditioningNotes?: string;
  mobilityOrRecoveryNotes?: string;
  
  // Exercise Layer
  exercises?: WorkoutExercise[];
  
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  name: string;
  dayAssociation: string;
  setRepLoadNotes?: string;
  grouping?: string;
}

export interface WorkoutExtractedSection {
  id: string;
  userId: string;
  documentId: string;
  rawText: string;
  normalizedName: string;
  extractionConfidence: number;
  createdAt: string;
}

export interface WorkoutChangeLog {
  id: string;
  userId: string;
  workoutBaselineId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changeSource: 'document_upload' | 'agent_refinement' | 'user_correction' | 'system_update';
  rationale?: string;
  changedAt: string;
}

// API Request/Response Types
export interface CreateWorkoutDocumentRequest {
  userId: string;
  documentType: 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';
  fileReference?: string;
  storagePath?: string;
  programStartDate?: string;
  notes?: string;
  manualWorkoutData?: ManualWorkoutData;
}

export interface ManualWorkoutData {
  // Program Structure
  programName?: string;
  splitName?: string;
  workoutDaysPerWeek?: number;
  restDaysPerWeek?: number;
  trainingStyle?: string;
  programNotes?: string;
  
  // Weekly Schedule
  mondayPlan?: string;
  tuesdayPlan?: string;
  wednesdayPlan?: string;
  thursdayPlan?: string;
  fridayPlan?: string;
  saturdayPlan?: string;
  sundayPlan?: string;
  
  // Workout Context
  muscleGroupFocus?: string[];
  frequencyByMuscleGroup?: Record<string, number>;
  plannedVolumeNotes?: string;
  plannedIntensityNotes?: string;
  cardioOrConditioningNotes?: string;
  mobilityOrRecoveryNotes?: string;
  
  // Exercise Layer
  exercises?: {
    name: string;
    dayAssociation: string;
    setRepLoadNotes?: string;
    grouping?: string;
  }[];
}

export interface WorkoutDocumentResult {
  document: WorkoutDocument;
  baseline: WorkoutBaseline;
  extractedSections: WorkoutExtractedSection[];
}

// Database Table Names
export const WORKOUT_TABLES = {
  WORKOUT_DOCUMENTS: 'workout_documents',
  WORKOUT_BASELINES: 'workout_baselines',
  WORKOUT_EXTRACTED_SECTIONS: 'workout_extracted_sections',
  WORKOUT_CHANGE_LOG: 'workout_change_log',
} as const;

// Change Source Types
export type WorkoutChangeSource = 'document_upload' | 'agent_refinement' | 'user_correction' | 'system_update';

// Parse Status Types
export type WorkoutParseStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Document Type Types
export type WorkoutDocumentType = 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';

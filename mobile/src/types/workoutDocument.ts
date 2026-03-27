// Workout Baseline Document Types for React Native

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
  document: {
    id: string;
    userId: string;
    uploadDate: string;
    documentType: string;
    programStartDate?: string;
    parseStatus: string;
    extractionConfidence?: number;
    notes?: string;
    createdAt: string;
  };
  baseline: WorkoutBaseline;
  extractedSections: any[];
}

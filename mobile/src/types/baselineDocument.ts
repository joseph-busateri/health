export type DocumentType = 'pdf' | 'docx' | 'txt' | 'manual_entry';

export type ParseStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BaselineDocument {
  id: string;
  userId: string;
  fileReference?: string;
  storagePath?: string;
  uploadDate: string;
  documentType: DocumentType;
  parseStatus: ParseStatus;
  extractionConfidence?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Demographics {
  birthDate?: string;
  height?: number;
  weightStartingReference?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
}

export interface TrainingContext {
  workoutFrequency?: string;
  trainingStyle?: string[];
  athleticBackground?: string;
  injuryHistory?: string;
}

export interface LifestyleContext {
  sleepHabits?: string;
  travelFrequency?: string;
  stressContext?: string;
}

export interface OverallHealthGoals {
  bodyFatGoal?: string;
  weightGoal?: string;
  a1cGoal?: string;
  restingHeartRateGoal?: number;
  bloodPressureSystolicGoal?: number;
  bloodPressureDiastolicGoal?: number;
  sleepHoursGoal?: number;
}

export interface SexualPerformanceGoals {
  erectileFunctionGoal?: string;
  libidoGoal?: string;
}

export interface WorkoutGoals {
  chestGoal?: string;
  bicepLeftGoal?: string;
  bicepRightGoal?: string;
  forearmLeftGoal?: string;
  forearmRightGoal?: string;
  neckGoal?: string;
  shouldersGoal?: string;
  benchPressGoal?: string;
  squatGoal?: string;
  pushupsGoal?: string;
  gripStrengthLeftGoal?: string;
  gripStrengthRightGoal?: string;
}

export interface SecondaryGoals {
  dailyWaterGoal?: number;
  dailyProteinGoal?: number;
  dailyCaloriesGoal?: number;
  longevityGoalNotes?: string;
}

export interface PriorityOrder {
  priority1?: string;
  priority2?: string;
  priority3?: string;
  priority4?: string;
  priority5?: string;
}

export interface BaselineProfile {
  id: string;
  userId: string;
  documentId: string;
  demographics?: Demographics;
  trainingContext?: TrainingContext;
  lifestyleContext?: LifestyleContext;
  overallHealthGoals?: OverallHealthGoals;
  sexualPerformanceGoals?: SexualPerformanceGoals;
  workoutGoals?: WorkoutGoals;
  secondaryGoals?: SecondaryGoals;
  priorityOrder?: PriorityOrder;
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaselineUploadRequest {
  documentType: DocumentType;
  fileReference?: string;
  storagePath?: string;
  notes?: string;
  manualProfileData?: ManualBaselineProfileData;
}

export interface ManualBaselineProfileData {
  demographics?: Demographics;
  trainingContext?: TrainingContext;
  lifestyleContext?: LifestyleContext;
  overallHealthGoals?: OverallHealthGoals;
  sexualPerformanceGoals?: SexualPerformanceGoals;
  workoutGoals?: WorkoutGoals;
  secondaryGoals?: SecondaryGoals;
  priorityOrder?: PriorityOrder;
}

export interface BaselineUploadResult {
  document: BaselineDocument;
  profile: BaselineProfile;
  extractedSections: any[];
}

export type HealthDataSection = 
  | 'baseline'
  | 'workout_schedule'
  | 'supplement_intake'
  | 'bloodwork'
  | 'body_composition'
  | 'strength_tracking'
  | 'tape_measurements'
  | 'nutrition'
  | 'device_connections';

export interface HealthDataSectionStatus {
  section: HealthDataSection;
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'not_started' | 'connected' | 'not_connected';
  lastUpdated?: string;
  summary?: string;
  icon: string;
  available: boolean;
}

export interface BaselineProfileData {
  demographics?: {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
  };
  healthGoals?: string[];
  sexualHealthGoals?: string[];
  workoutGoals?: string[];
  secondaryGoals?: string[];
  trainingContext?: string;
  lifestyleContext?: string;
  completionPercentage: number;
}

export interface WorkoutScheduleData {
  uploaded: boolean;
  uploadDate?: string;
  documentName?: string;
  weeklySessionCount?: number;
  primaryFocus?: string;
}

export interface SupplementIntakeData {
  uploaded: boolean;
  uploadDate?: string;
  documentName?: string;
  supplementCount?: number;
  stackSummary?: string;
}

export interface BloodworkData {
  lastUploadDate?: string;
  documentCount: number;
  latestRecommendationCount: number;
  processingStatus?: 'pending' | 'completed' | 'failed';
}

export interface BodyCompositionData {
  lastScanDate?: string;
  scanCount: number;
  latestBodyFatPercentage?: number;
  latestLeanMass?: number;
}

export interface StrengthTrackingData {
  lastEntryDate?: string;
  entryCount: number;
  exercises: {
    benchPress?: { value: number; date: string };
    pushups?: { value: number; date: string };
    gripStrength?: { value: number; date: string };
  };
}

export interface TapeMeasurementsData {
  lastEntryDate?: string;
  entryCount: number;
  measurements: {
    chest?: { value: number; date: string };
    shoulders?: { value: number; date: string };
    arms?: { value: number; date: string };
    forearms?: { value: number; date: string };
  };
}

export interface NutritionData {
  mealsToday: number;
  lastMealDate?: string;
  totalMeals: number;
}

export interface DeviceConnection {
  deviceType: 'apple_watch' | 'whoop' | 'sleep_number' | 'blood_pressure' | 'cpap';
  deviceName: string;
  connected: boolean;
  lastSync?: string;
  available: boolean;
}

export interface HealthDataHubState {
  baseline: BaselineProfileData;
  workoutSchedule: WorkoutScheduleData;
  supplementIntake: SupplementIntakeData;
  bloodwork: BloodworkData;
  bodyComposition: BodyCompositionData;
  strengthTracking: StrengthTrackingData;
  tapeMeasurements: TapeMeasurementsData;
  nutrition: NutritionData;
  deviceConnections: DeviceConnection[];
}

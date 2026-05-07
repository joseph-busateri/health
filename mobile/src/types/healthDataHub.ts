export type HealthDataSection = 
  | 'baseline'
  | 'cardiovascular_risk'
  | 'strength_tracking';

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

export interface StrengthTrackingData {
  lastEntryDate?: string;
  entryCount: number;
  exercises: {
    benchPress?: { value: number; date: string };
    pushups?: { value: number; date: string };
    gripStrength?: { value: number; date: string };
  };
}

export interface HealthDataHubState {
  baseline: BaselineProfileData;
  strengthTracking: StrengthTrackingData;
}

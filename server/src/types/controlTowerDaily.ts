// Control Tower Daily Intelligence API Types
// Presentation-ready intelligence layer for Home screen

export type DataAvailabilityState = 'complete' | 'partial' | 'minimal';

export interface ControlTowerTrustMetadata {
  lastUpdated?: string;
  dataAvailabilityState: DataAvailabilityState;
  missingDataSources?: string[];
  deviceSyncRecency?: string;
}

export type ControlTowerPriority = 'critical' | 'important' | 'optimization';

export interface ControlTowerPriorityCard {
  priority: ControlTowerPriority;
  title: string;
  source: string;
  actions?: string[];
}

export type ControlTowerAlertLevel = 'low' | 'moderate' | 'high';

export interface ControlTowerPredictiveCard {
  level: ControlTowerAlertLevel;
  title: string;
  rationale?: string;
}

export interface ControlTowerWorkoutCard {
  title: string;
  summary: string;
  workoutType?: string;
  cycleWeek?: number;
  cyclePhase?: string;
  topAdjustments?: string[];
}

export interface ControlTowerNutritionCard {
  title: string;
  summary: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  hydrationOz?: number;
  topAdjustments?: string[];
}

export interface ControlTowerMetabolicCard {
  title: string;
  summary: string;
  status: string;
  actions?: string[];
}

export interface ControlTowerCardiovascularCard {
  title: string;
  summary: string;
  status: string;
  actions?: string[];
}

export interface ControlTowerSexualHealthCard {
  title: string;
  summary: string;
  status: string;
  actions?: string[];
}

export interface ControlTowerCrossEnginePattern {
  name: string;
  summary: string;
  severity: string;
}

export interface ControlTowerCrossEngineCard {
  title: string;
  summary: string;
  overallStatus: string;
  topPatterns?: ControlTowerCrossEnginePattern[];
  keyActions?: string[];
}

export interface ControlTowerQuickActions {
  askCoach?: boolean;
  viewWorkout?: boolean;
  viewNutrition?: boolean;
  viewPriorities?: boolean;
}

export type ControlTowerOverallStatus = 'optimal' | 'moderate' | 'constrained' | 'high_risk';

export interface ControlTowerDailyResponse {
  id: string;
  userId: string;
  date: string;
  overallStatus: ControlTowerOverallStatus;
  headline: string;
  reasoning: string;
  trust: ControlTowerTrustMetadata;
  crossEngine?: ControlTowerCrossEngineCard;
  priorities: ControlTowerPriorityCard[];
  predictiveAlerts: ControlTowerPredictiveCard[];
  workout: ControlTowerWorkoutCard;
  nutrition: ControlTowerNutritionCard;
  metabolic?: ControlTowerMetabolicCard;
  cardiovascular?: ControlTowerCardiovascularCard;
  sexualHealth?: ControlTowerSexualHealthCard;
  quickActions: ControlTowerQuickActions;
  source: 'control_tower_daily';
  createdAt: string;
}

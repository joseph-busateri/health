// Daily AI Plan Aggregator Types
// Unifies all execution and intelligence layers into one coherent daily plan

export type DailyOverallStatus = 'optimal' | 'moderate' | 'constrained' | 'high_risk';

export interface DailyAISummary {
  overallStatus: DailyOverallStatus;
  headline: string;
  reasoning: string;
}

export interface DailyAIRecoverySnapshot {
  recoveryScore?: number;
  recoveryStatus?: string;
  stressScore?: number;
  stressStatus?: string;
  jointRisk?: string;
  adherenceScore?: number;
}

export type PriorityLevel = 'critical' | 'important' | 'optimization';

export interface DailyAIPriorityItem {
  priority: PriorityLevel;
  summary: string;
  source: string;
  actions?: string[];
}

export type PredictiveAlertLevel = 'low' | 'moderate' | 'high';

export interface DailyAIPredictiveAlert {
  level: PredictiveAlertLevel;
  summary: string;
  rationale?: string;
}

export interface DailyAIWorkoutSection {
  summary: string;
  workoutType?: string;
  cycleWeek?: number;
  cyclePhase?: string;
  workoutStatus?: string;
  adjustments?: string[];
  exercises?: any[];
}

export interface DailyAINutritionSection {
  summary: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  hydrationOz?: number;
  mealTiming?: any;
  adjustments?: any[];
}

export interface DailyAICrossEnginePattern {
  name: string;
  summary: string;
  severity: string;
}

export interface DailyAICrossEngineSection {
  overallStatus?: string;
  summary?: string;
  topPatterns?: DailyAICrossEnginePattern[];
  actions?: string[];
}

export interface DailyAIPlan {
  id: string;
  userId: string;
  date: string;
  summary: DailyAISummary;
  recoverySnapshot: DailyAIRecoverySnapshot;
  topPriorities: DailyAIPriorityItem[];
  predictiveAlerts: DailyAIPredictiveAlert[];
  workout: DailyAIWorkoutSection;
  nutrition: DailyAINutritionSection;
  crossEngineIntelligence?: DailyAICrossEngineSection;
  autonomousSummary?: string;
  goalDrivenSummary?: string;
  source: 'aggregated';
  createdAt: string;
}

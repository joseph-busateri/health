// Nutrition Today Integrated Types
// Transforms nutrition recommendations into executable daily nutrition plans

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydrationOz: number;
}

export interface NutritionMealTiming {
  preWorkout?: string;
  postWorkout?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
}

export interface NutritionAdjustmentApplied {
  type: 'calories' | 'protein' | 'carbs' | 'fats' | 'hydration' | 'meal_timing' | 'goal_driven';
  change: string;
  reason: string;
  source?: string;
}

export interface NutritionCrossEnginePattern {
  name: string;
  severity: 'low' | 'moderate' | 'high';
  summary: string;
}

export interface NutritionCrossEngineInfluence {
  applied: boolean;
  overallStatus?: 'optimal' | 'moderate' | 'constrained' | 'high_risk';
  influencingEngines?: string[];
  patterns?: NutritionCrossEnginePattern[];
  summary?: string;
}

export type NutritionSource = 'baseline' | 'adjusted' | 'ai_optimized';

export interface NutritionTodayIntegrated {
  id: string;
  userId: string;
  date: string;
  targets: NutritionTargets;
  baselineTargets?: NutritionTargets;
  mealTiming: NutritionMealTiming;
  adjustments: NutritionAdjustmentApplied[];
  adjustmentsApplied?: NutritionAdjustmentApplied[];
  summary: string;
  source: NutritionSource;
  crossEngineInfluence?: NutritionCrossEngineInfluence;
  sourceSignals: {
    recoveryScore?: number;
    stressScore?: number;
    adherenceScore?: number;
    workoutStatus?: string;
    workoutIntensity?: string;
    goalType?: string;
    predictiveRisk?: string;
  };
  createdAt: string;
}

export interface NutritionTodayContext {
  userId: string;
  date: string;
  baselineNutrition?: any;
  nutritionEngineRecommendation?: any;
  workoutToday?: any;
  recoveryScore?: number;
  stressScore?: number;
  adherenceScore?: number;
  goalType?: string;
  predictiveRisk?: string;
  bodyWeight?: number;
}

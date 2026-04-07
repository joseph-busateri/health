export type NutritionStatus = 'optimal' | 'adequate' | 'suboptimal' | 'deficient';
export type HydrationLevel = 'well_hydrated' | 'adequate' | 'mild_dehydration' | 'dehydrated';

export interface CalorieTargets {
  maintenance: number;
  currentGoal: number;
  deficit?: number;
  surplus?: number;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface NutritionInputs {
  weight?: number;
  bodyFat?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'maintain' | 'cut' | 'bulk' | 'recomp';
  proteinIntake?: number;
  hydrationOunces?: number;
}

export interface NutritionRecord {
  id: string;
  userId: string;
  date: string;
  nutritionScore: number;
  nutritionStatus: NutritionStatus;
  calorieTargets: CalorieTargets;
  macroTargets: MacroTargets;
  proteinAdequacy: number;
  hydrationScore: number;
  hydrationLevel: HydrationLevel;
  metabolicSupportScore: number;
  inputs: NutritionInputs;
  createdAt: string;
}

/**
 * Nutrition Engine Service
 * 
 * Responsibilities:
 * - Calculate calorie targets based on user profile
 * - Calculate macro targets (protein, carbs, fats, fiber)
 * - Assess protein adequacy
 * - Calculate hydration score
 * - Calculate nutrition score
 * - Calculate metabolic support score
 * 
 * Does NOT generate recommendations (that's RecommendationEngine's job)
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type {
  NutritionRecord,
  NutritionStatus,
  HydrationLevel,
  CalorieTargets,
  MacroTargets,
  NutritionInputs,
} from '../types/nutritionEngine';

// ============================================================================
// STANDARD ENGINE INTERFACE
// ============================================================================

interface HealthEngine<T> {
  calculate(userId: string): Promise<T | null>;
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate calorie targets based on user profile
 */
function calculateCalorieTargets(inputs: NutritionInputs): CalorieTargets {
  const weight = inputs.weight ?? 180; // Default 180 lbs
  const bodyFat = inputs.bodyFat ?? 20; // Default 20%
  const activityLevel = inputs.activityLevel ?? 'moderate';
  const goal = inputs.goal ?? 'maintain';

  // Calculate lean body mass
  const leanMass = weight * (1 - bodyFat / 100);

  // Base metabolic rate (Katch-McArdle formula)
  const bmr = 370 + (21.6 * leanMass);

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const maintenance = Math.round(bmr * activityMultipliers[activityLevel]);

  // Goal adjustments
  let currentGoal = maintenance;
  let deficit: number | undefined;
  let surplus: number | undefined;

  if (goal === 'cut') {
    deficit = Math.round(maintenance * 0.2); // 20% deficit
    currentGoal = maintenance - deficit;
  } else if (goal === 'bulk') {
    surplus = Math.round(maintenance * 0.1); // 10% surplus
    currentGoal = maintenance + surplus;
  } else if (goal === 'recomp') {
    // Slight deficit for recomp
    deficit = Math.round(maintenance * 0.1);
    currentGoal = maintenance - deficit;
  }

  return {
    maintenance,
    currentGoal,
    deficit,
    surplus,
  };
}

/**
 * Calculate macro targets based on calorie targets and goal
 */
function calculateMacroTargets(calorieTargets: CalorieTargets, inputs: NutritionInputs): MacroTargets {
  const weight = inputs.weight ?? 180;
  const goal = inputs.goal ?? 'maintain';

  // Protein: 1g per lb bodyweight (minimum), higher for cutting
  let proteinGrams = weight;
  if (goal === 'cut') {
    proteinGrams = weight * 1.2; // Higher protein during cut
  } else if (goal === 'bulk') {
    proteinGrams = weight * 1.0;
  }

  // Fat: 0.3-0.4g per lb bodyweight
  const fatGrams = weight * 0.35;

  // Carbs: Remaining calories
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const carbCalories = calorieTargets.currentGoal - proteinCalories - fatCalories;
  const carbGrams = Math.max(0, carbCalories / 4);

  // Fiber: 14g per 1000 calories
  const fiberGrams = Math.round((calorieTargets.currentGoal / 1000) * 14);

  return {
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbGrams),
    fats: Math.round(fatGrams),
    fiber: fiberGrams,
  };
}

/**
 * Calculate protein adequacy (0-100)
 */
function calculateProteinAdequacy(inputs: NutritionInputs, macroTargets: MacroTargets): number {
  if (!inputs.proteinIntake) {
    return 50; // Unknown, assume moderate
  }

  const adequacyRatio = inputs.proteinIntake / macroTargets.protein;
  
  if (adequacyRatio >= 0.9) return 100; // Meeting target
  if (adequacyRatio >= 0.75) return 80; // Close to target
  if (adequacyRatio >= 0.6) return 60; // Below target
  if (adequacyRatio >= 0.5) return 40; // Well below target
  return 20; // Severely deficient
}

/**
 * Calculate hydration score (0-100)
 */
function calculateHydrationScore(inputs: NutritionInputs): number {
  if (!inputs.hydrationOunces) {
    return 50; // Unknown, assume moderate
  }

  const weight = inputs.weight ?? 180;
  const targetOunces = weight * 0.5; // 0.5 oz per lb bodyweight

  const hydrationRatio = inputs.hydrationOunces / targetOunces;

  if (hydrationRatio >= 1.0) return 100; // Well hydrated
  if (hydrationRatio >= 0.8) return 85; // Adequate
  if (hydrationRatio >= 0.6) return 65; // Mild dehydration
  return 40; // Dehydrated
}

/**
 * Determine hydration level
 */
function determineHydrationLevel(hydrationScore: number): HydrationLevel {
  if (hydrationScore >= 90) return 'well_hydrated';
  if (hydrationScore >= 75) return 'adequate';
  if (hydrationScore >= 55) return 'mild_dehydration';
  return 'dehydrated';
}

/**
 * Calculate metabolic support score (0-100)
 * Based on protein adequacy and hydration
 */
function calculateMetabolicSupportScore(proteinAdequacy: number, hydrationScore: number): number {
  return Math.round((proteinAdequacy * 0.6) + (hydrationScore * 0.4));
}

/**
 * Calculate overall nutrition score (0-100)
 */
function calculateNutritionScore(proteinAdequacy: number, hydrationScore: number, metabolicSupportScore: number): number {
  return Math.round((proteinAdequacy * 0.4) + (hydrationScore * 0.3) + (metabolicSupportScore * 0.3));
}

/**
 * Determine nutrition status
 */
function determineNutritionStatus(nutritionScore: number): NutritionStatus {
  if (nutritionScore >= 85) return 'optimal';
  if (nutritionScore >= 70) return 'adequate';
  if (nutritionScore >= 50) return 'suboptimal';
  return 'deficient';
}

// ============================================================================
// MAIN ENGINE FUNCTION
// ============================================================================

/**
 * Calculate nutrition metrics for a user
 * Implements HealthEngine<NutritionRecord> interface
 */
export async function calculateNutrition(userId: string): Promise<NutritionRecord | null> {
  try {
    logger.info('Calculating nutrition metrics', { userId });

    // Get user baseline profile for weight, body fat, goals
    const { data: baseline, error: baselineError } = await supabase
      .from('baseline_profiles')
      .select('demographics, training_context, goals')
      .eq('user_id', userId)
      .single();

    if (baselineError) {
      logger.warn('No baseline profile found for nutrition calculation', { userId });
    }

    // Get latest daily log for protein intake, hydration
    const { data: dailyLog, error: logError } = await supabase
      .from('daily_health_logs')
      .select('notes, water_intake_oz')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (logError) {
      logger.warn('No daily log found for nutrition calculation', { userId });
    }

    // Build inputs from available data
    const inputs: NutritionInputs = {
      weight: baseline?.demographics?.weight,
      bodyFat: baseline?.demographics?.body_fat_percentage,
      activityLevel: baseline?.training_context?.activity_level ?? 'moderate',
      goal: baseline?.goals?.primary_goal ?? 'maintain',
      proteinIntake: undefined, // TODO: Extract from daily log notes or separate tracking
      hydrationOunces: dailyLog?.water_intake_oz,
    };

    // Calculate all metrics
    const calorieTargets = calculateCalorieTargets(inputs);
    const macroTargets = calculateMacroTargets(calorieTargets, inputs);
    const proteinAdequacy = calculateProteinAdequacy(inputs, macroTargets);
    const hydrationScore = calculateHydrationScore(inputs);
    const hydrationLevel = determineHydrationLevel(hydrationScore);
    const metabolicSupportScore = calculateMetabolicSupportScore(proteinAdequacy, hydrationScore);
    const nutritionScore = calculateNutritionScore(proteinAdequacy, hydrationScore, metabolicSupportScore);
    const nutritionStatus = determineNutritionStatus(nutritionScore);

    const record: NutritionRecord = {
      id: uuidv4(),
      userId,
      date: new Date().toISOString().split('T')[0],
      nutritionScore,
      nutritionStatus,
      calorieTargets,
      macroTargets,
      proteinAdequacy,
      hydrationScore,
      hydrationLevel,
      metabolicSupportScore,
      inputs,
      createdAt: new Date().toISOString(),
    };

    // Store record in database
    const { error: insertError } = await supabase
      .from('nutrition_records')
      .insert({
        id: record.id,
        user_id: record.userId,
        date: record.date,
        nutrition_score: record.nutritionScore,
        nutrition_status: record.nutritionStatus,
        calorie_targets: record.calorieTargets,
        macro_targets: record.macroTargets,
        protein_adequacy: record.proteinAdequacy,
        hydration_score: record.hydrationScore,
        hydration_level: record.hydrationLevel,
        metabolic_support_score: record.metabolicSupportScore,
        inputs: record.inputs,
        created_at: record.createdAt,
      });

    if (insertError) {
      logger.error('Failed to store nutrition record', { error: insertError, userId });
    }

    logger.info('Nutrition calculation complete', {
      userId,
      nutritionScore,
      nutritionStatus,
    });

    return record;
  } catch (error) {
    logger.error('Nutrition calculation failed', { error, userId });
    return null;
  }
}

/**
 * Get today's nutrition record
 */
export async function getNutritionToday(userId: string): Promise<NutritionRecord | null> {
  const today = new Date().toISOString().split('T')[0];

  // Try to get existing record for today
  const { data: existing, error } = await supabase
    .from('nutrition_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing && !error) {
    return {
      id: existing.id,
      userId: existing.user_id,
      date: existing.date,
      nutritionScore: existing.nutrition_score,
      nutritionStatus: existing.nutrition_status,
      calorieTargets: existing.calorie_targets,
      macroTargets: existing.macro_targets,
      proteinAdequacy: existing.protein_adequacy,
      hydrationScore: existing.hydration_score,
      hydrationLevel: existing.hydration_level,
      metabolicSupportScore: existing.metabolic_support_score,
      inputs: existing.inputs,
      createdAt: existing.created_at,
    };
  }

  // Calculate new record
  return calculateNutrition(userId);
}

// Export engine following standard interface
export const NutritionEngine: HealthEngine<NutritionRecord> = {
  calculate: calculateNutrition,
};

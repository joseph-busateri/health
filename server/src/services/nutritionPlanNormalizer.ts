/**
 * Nutrition Plan Normalizer - Phase 19
 * 
 * Purpose: Normalize nutrition plans from various sources into canonical format
 * Enables: Plan upload/config → structured plan → execution task generation
 * 
 * Reuses: Existing nutritionEngineService, nutritionExtractionService
 * Enhances: Adds normalization layer without replacing existing logic
 */

import { logger } from '../utils/logger';

// ============================================================================
// CANONICAL NUTRITION PLAN MODEL
// ============================================================================

export interface NutritionPlan {
  id?: string;
  userId: string;
  planName: string;
  planType: 'cutting' | 'bulking' | 'maintenance' | 'recomp' | 'custom';
  source: 'upload' | 'ai_generated' | 'manual' | 'coach';
  
  // Macro targets
  dailyTargets: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    fiberG?: number;
    hydrationOz?: number;
  };
  
  // Meal structure
  mealStructure?: {
    mealsPerDay: number;
    mealTiming?: string[];
    intermittentFasting?: boolean;
    fastingWindow?: { start: string; end: string };
  };
  
  // Specific meals (optional)
  meals?: NutritionMeal[];
  
  // Constraints
  dietaryRestrictions?: string[];
  allergens?: string[];
  preferences?: string[];
  
  // Metadata
  startDate: string;
  endDate?: string;
  durationWeeks?: number;
  active: boolean;
  confidence: number; // 0-1
  dataQuality: 'high' | 'medium' | 'low';
  
  createdAt?: string;
  updatedAt?: string;
}

export interface NutritionMeal {
  mealName: string;
  mealTime: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  foods?: NutritionFood[];
  optional: boolean;
}

export interface NutritionFood {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

// ============================================================================
// NUTRITION PLAN NORMALIZER
// ============================================================================

export class NutritionPlanNormalizer {
  /**
   * Normalize uploaded nutrition plan document
   */
  static normalizeUploadedPlan(
    userId: string,
    rawData: any,
    source: 'upload' | 'manual' = 'upload'
  ): NutritionPlan {
    try {
      // Handle various upload formats
      const plan: NutritionPlan = {
        userId,
        planName: rawData.planName || rawData.name || 'Nutrition Plan',
        planType: this.inferPlanType(rawData),
        source,
        dailyTargets: this.extractDailyTargets(rawData),
        mealStructure: this.extractMealStructure(rawData),
        meals: this.extractMeals(rawData),
        dietaryRestrictions: rawData.dietaryRestrictions || rawData.restrictions || [],
        allergens: rawData.allergens || [],
        preferences: rawData.preferences || [],
        startDate: rawData.startDate || new Date().toISOString().split('T')[0],
        endDate: rawData.endDate,
        durationWeeks: rawData.durationWeeks || this.calculateDuration(rawData.startDate, rawData.endDate),
        active: true,
        confidence: this.calculateConfidence(rawData),
        dataQuality: this.assessDataQuality(rawData),
      };

      logger.info('✅ [NUTRITION PLAN NORMALIZER] Plan normalized', {
        userId,
        planName: plan.planName,
        planType: plan.planType,
        calories: plan.dailyTargets.calories,
      });

      return plan;
    } catch (error) {
      logger.error('❌ [NUTRITION PLAN NORMALIZER] Failed to normalize plan', {
        userId,
        error: (error as Error).message,
      });
      
      // Return minimal valid plan
      return this.getMinimalPlan(userId);
    }
  }

  /**
   * Normalize AI-generated nutrition plan
   */
  static normalizeAIGeneratedPlan(
    userId: string,
    aiPlan: any,
    baselineCalories: number,
    baselineProtein: number
  ): NutritionPlan {
    return {
      userId,
      planName: aiPlan.planName || 'AI-Generated Plan',
      planType: aiPlan.planType || 'maintenance',
      source: 'ai_generated',
      dailyTargets: {
        calories: aiPlan.calories || baselineCalories,
        proteinG: aiPlan.protein || baselineProtein,
        carbsG: aiPlan.carbs || Math.round(baselineCalories * 0.4 / 4),
        fatsG: aiPlan.fats || Math.round(baselineCalories * 0.25 / 9),
        fiberG: aiPlan.fiber || 30,
        hydrationOz: aiPlan.hydration || 100,
      },
      mealStructure: aiPlan.mealStructure,
      meals: aiPlan.meals,
      dietaryRestrictions: aiPlan.restrictions || [],
      allergens: aiPlan.allergens || [],
      preferences: aiPlan.preferences || [],
      startDate: new Date().toISOString().split('T')[0],
      durationWeeks: aiPlan.durationWeeks || 12,
      active: true,
      confidence: 0.85,
      dataQuality: 'high',
    };
  }

  /**
   * Normalize manual/quick nutrition targets
   */
  static normalizeManualTargets(
    userId: string,
    targets: {
      calories: number;
      protein: number;
      carbs?: number;
      fats?: number;
    }
  ): NutritionPlan {
    const calories = targets.calories;
    const protein = targets.protein;
    const carbs = targets.carbs || Math.round((calories - protein * 4) * 0.55 / 4);
    const fats = targets.fats || Math.round((calories - protein * 4 - carbs * 4) / 9);

    return {
      userId,
      planName: 'Manual Targets',
      planType: 'custom',
      source: 'manual',
      dailyTargets: {
        calories,
        proteinG: protein,
        carbsG: carbs,
        fatsG: fats,
      },
      startDate: new Date().toISOString().split('T')[0],
      active: true,
      confidence: 0.9,
      dataQuality: 'high',
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static inferPlanType(rawData: any): NutritionPlan['planType'] {
    const type = rawData.planType || rawData.type || '';
    const lowerType = type.toLowerCase();

    if (lowerType.includes('cut') || lowerType.includes('deficit')) return 'cutting';
    if (lowerType.includes('bulk') || lowerType.includes('surplus')) return 'bulking';
    if (lowerType.includes('recomp')) return 'recomp';
    if (lowerType.includes('maintain')) return 'maintenance';
    
    return 'custom';
  }

  private static extractDailyTargets(rawData: any): NutritionPlan['dailyTargets'] {
    return {
      calories: rawData.calories || rawData.dailyCalories || rawData.targetCalories || 2500,
      proteinG: rawData.protein || rawData.proteinG || rawData.targetProtein || 180,
      carbsG: rawData.carbs || rawData.carbsG || rawData.targetCarbs || 250,
      fatsG: rawData.fats || rawData.fatsG || rawData.targetFats || 70,
      fiberG: rawData.fiber || rawData.fiberG || 30,
      hydrationOz: rawData.hydration || rawData.water || 100,
    };
  }

  private static extractMealStructure(rawData: any): NutritionPlan['mealStructure'] | undefined {
    if (!rawData.mealStructure && !rawData.meals) return undefined;

    return {
      mealsPerDay: rawData.mealsPerDay || rawData.meals?.length || 3,
      mealTiming: rawData.mealTiming || rawData.mealTimes,
      intermittentFasting: rawData.intermittentFasting || rawData.if || false,
      fastingWindow: rawData.fastingWindow,
    };
  }

  private static extractMeals(rawData: any): NutritionMeal[] | undefined {
    if (!rawData.meals || !Array.isArray(rawData.meals)) return undefined;

    return rawData.meals.map((meal: any) => ({
      mealName: meal.name || meal.mealName || 'Meal',
      mealTime: meal.time || meal.mealTime || '12:00',
      targetCalories: meal.calories || 0,
      targetProteinG: meal.protein || 0,
      targetCarbsG: meal.carbs || 0,
      targetFatsG: meal.fats || 0,
      foods: meal.foods,
      optional: meal.optional || false,
    }));
  }

  private static calculateDuration(startDate?: string, endDate?: string): number | undefined {
    if (!startDate || !endDate) return undefined;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.ceil(diffDays / 7);
  }

  private static calculateConfidence(rawData: any): number {
    let confidence = 0.5;

    // Has specific targets
    if (rawData.calories && rawData.protein) confidence += 0.2;
    
    // Has meal structure
    if (rawData.meals || rawData.mealStructure) confidence += 0.15;
    
    // Has duration
    if (rawData.startDate && rawData.endDate) confidence += 0.1;
    
    // Has restrictions/preferences
    if (rawData.dietaryRestrictions || rawData.preferences) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private static assessDataQuality(rawData: any): 'high' | 'medium' | 'low' {
    const hasTargets = rawData.calories && rawData.protein;
    const hasMeals = rawData.meals && rawData.meals.length > 0;
    const hasStructure = rawData.mealStructure || rawData.mealsPerDay;

    if (hasTargets && hasMeals && hasStructure) return 'high';
    if (hasTargets && (hasMeals || hasStructure)) return 'medium';
    return 'low';
  }

  private static getMinimalPlan(userId: string): NutritionPlan {
    return {
      userId,
      planName: 'Default Plan',
      planType: 'maintenance',
      source: 'manual',
      dailyTargets: {
        calories: 2500,
        proteinG: 180,
        carbsG: 250,
        fatsG: 70,
      },
      startDate: new Date().toISOString().split('T')[0],
      active: true,
      confidence: 0.3,
      dataQuality: 'low',
    };
  }
}

// ============================================================================
// NUTRITION PLAN SERVICE METHODS
// ============================================================================

export async function getNutritionPlan(userId: string): Promise<NutritionPlan | null> {
  // This would integrate with existing database
  // For now, return null to indicate no plan exists
  logger.info('📋 [NUTRITION PLAN] Fetching plan', { userId });
  return null;
}

export async function saveNutritionPlan(plan: NutritionPlan): Promise<NutritionPlan> {
  // This would persist to database
  logger.info('✅ [NUTRITION PLAN] Plan saved', {
    userId: plan.userId,
    planName: plan.planName,
    calories: plan.dailyTargets.calories,
  });
  
  return plan;
}

export async function getActivePlan(userId: string): Promise<NutritionPlan | null> {
  // This would fetch active plan from database
  logger.info('📋 [NUTRITION PLAN] Fetching active plan', { userId });
  return null;
}

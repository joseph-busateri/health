/**
 * Nutrition Execution Linkage - Phase 19
 * 
 * Purpose: Link nutrition intake to execution tasks, adherence, and interventions
 * Critical Gap: Nutrition exists but doesn't generate execution tasks or track adherence
 * 
 * Integrates with:
 * - Phase 15 Execution Intelligence
 * - Phase 16 Predictive Behavior
 * - Phase 17 Autonomous Adjustment
 */

import { logger } from '../utils/logger';
import type { NutritionPlan } from './nutritionPlanNormalizer';

// ============================================================================
// NUTRITION EXECUTION TASK MODEL
// ============================================================================

export interface NutritionExecutionTask {
  id: string;
  userId: string;
  date: string;
  domain: 'nutrition';
  
  // Task details
  taskType: 'meal' | 'protein_target' | 'hydration' | 'macro_target' | 'supplement';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'moderate' | 'low';
  
  // Targets
  targetValue?: number;
  targetUnit?: string;
  mealName?: string;
  mealTime?: string;
  
  // Status
  status: 'pending' | 'completed' | 'partial' | 'skipped';
  completedAt?: string;
  actualValue?: number;
  
  // Execution metadata
  expectedImpact: string;
  adherenceWeight: number; // 0-1, how much this affects overall adherence
}

export interface NutritionAdherence {
  userId: string;
  date: string;
  
  // Overall
  overallScore: number; // 0-100
  
  // By category
  mealAdherence: number; // 0-100
  proteinAdherence: number; // 0-100
  calorieAdherence: number; // 0-100
  macroAdherence: number; // 0-100
  hydrationAdherence: number; // 0-100
  
  // Details
  mealsCompleted: number;
  mealsTarget: number;
  proteinConsumedG: number;
  proteinTargetG: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  
  // Trend
  trend: 'improving' | 'stable' | 'declining';
  streak: number; // days of good adherence
}

export interface NutritionIntervention {
  id: string;
  userId: string;
  date: string;
  interventionType: 'missed_meal' | 'low_protein' | 'low_hydration' | 'macro_imbalance' | 'calorie_deficit';
  
  urgency: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction: string;
  
  // Context
  currentValue: number;
  targetValue: number;
  gap: number;
  
  dismissed: boolean;
  createdAt: string;
}

// ============================================================================
// NUTRITION EXECUTION LINKAGE SERVICE
// ============================================================================

export class NutritionExecutionLinkage {
  /**
   * Generate execution tasks from nutrition plan
   */
  static generateDailyTasks(
    userId: string,
    plan: NutritionPlan,
    date: string
  ): NutritionExecutionTask[] {
    const tasks: NutritionExecutionTask[] = [];

    // Task 1: Daily protein target
    tasks.push({
      id: `nutrition-protein-${date}`,
      userId,
      date,
      domain: 'nutrition',
      taskType: 'protein_target',
      title: `Hit ${plan.dailyTargets.proteinG}g protein`,
      description: `Consume ${plan.dailyTargets.proteinG}g protein throughout the day`,
      priority: 'high',
      targetValue: plan.dailyTargets.proteinG,
      targetUnit: 'g',
      status: 'pending',
      expectedImpact: 'Maintain muscle mass and support recovery',
      adherenceWeight: 0.3,
    });

    // Task 2: Daily calorie target
    tasks.push({
      id: `nutrition-calories-${date}`,
      userId,
      date,
      domain: 'nutrition',
      taskType: 'macro_target',
      title: `Stay within ${plan.dailyTargets.calories} calories`,
      description: `Target: ${plan.dailyTargets.calories} cal (${plan.dailyTargets.carbsG}g carbs, ${plan.dailyTargets.fatsG}g fats)`,
      priority: 'moderate',
      targetValue: plan.dailyTargets.calories,
      targetUnit: 'cal',
      status: 'pending',
      expectedImpact: `Support ${plan.planType} goals`,
      adherenceWeight: 0.25,
    });

    // Task 3: Hydration target
    if (plan.dailyTargets.hydrationOz) {
      tasks.push({
        id: `nutrition-hydration-${date}`,
        userId,
        date,
        domain: 'nutrition',
        taskType: 'hydration',
        title: `Drink ${plan.dailyTargets.hydrationOz}oz water`,
        description: 'Stay hydrated throughout the day',
        priority: 'moderate',
        targetValue: plan.dailyTargets.hydrationOz,
        targetUnit: 'oz',
        status: 'pending',
        expectedImpact: 'Optimize performance and recovery',
        adherenceWeight: 0.15,
      });
    }

    // Task 4-N: Individual meals (if structured plan)
    if (plan.meals && plan.meals.length > 0) {
      plan.meals.forEach((meal, index) => {
        if (!meal.optional) {
          tasks.push({
            id: `nutrition-meal-${date}-${index}`,
            userId,
            date,
            domain: 'nutrition',
            taskType: 'meal',
            title: meal.mealName,
            description: `${meal.targetCalories} cal, ${meal.targetProteinG}g protein`,
            priority: 'moderate',
            mealName: meal.mealName,
            mealTime: meal.mealTime,
            targetValue: meal.targetCalories,
            targetUnit: 'cal',
            status: 'pending',
            expectedImpact: 'Hit daily nutrition targets',
            adherenceWeight: 0.3 / plan.meals.length,
          });
        }
      });
    }

    logger.info('✅ [NUTRITION EXECUTION] Tasks generated', {
      userId,
      date,
      taskCount: tasks.length,
    });

    return tasks;
  }

  /**
   * Calculate nutrition adherence from intake and tasks
   */
  static calculateAdherence(
    userId: string,
    date: string,
    plan: NutritionPlan,
    intake: NutritionIntake,
    tasks: NutritionExecutionTask[]
  ): NutritionAdherence {
    // Meal adherence
    const mealTasks = tasks.filter(t => t.taskType === 'meal');
    const completedMeals = mealTasks.filter(t => t.status === 'completed').length;
    const mealAdherence = mealTasks.length > 0 
      ? (completedMeals / mealTasks.length) * 100 
      : 100;

    // Protein adherence
    const proteinConsumed = intake.totalProteinG || 0;
    const proteinTarget = plan.dailyTargets.proteinG;
    const proteinAdherence = Math.min((proteinConsumed / proteinTarget) * 100, 100);

    // Calorie adherence (within ±10% is perfect)
    const caloriesConsumed = intake.totalCalories || 0;
    const caloriesTarget = plan.dailyTargets.calories;
    const calorieDeviation = Math.abs(caloriesConsumed - caloriesTarget) / caloriesTarget;
    const calorieAdherence = Math.max(0, (1 - calorieDeviation / 0.1) * 100);

    // Macro adherence (average of carbs and fats)
    const carbsConsumed = intake.totalCarbsG || 0;
    const carbsTarget = plan.dailyTargets.carbsG;
    const carbsAdherence = Math.min((carbsConsumed / carbsTarget) * 100, 100);

    const fatsConsumed = intake.totalFatsG || 0;
    const fatsTarget = plan.dailyTargets.fatsG;
    const fatsAdherence = Math.min((fatsConsumed / fatsTarget) * 100, 100);

    const macroAdherence = (carbsAdherence + fatsAdherence) / 2;

    // Hydration adherence
    const hydrationConsumed = intake.hydrationOz || 0;
    const hydrationTarget = plan.dailyTargets.hydrationOz || 100;
    const hydrationAdherence = Math.min((hydrationConsumed / hydrationTarget) * 100, 100);

    // Overall score (weighted average)
    const overallScore = Math.round(
      proteinAdherence * 0.35 +
      calorieAdherence * 0.25 +
      mealAdherence * 0.2 +
      macroAdherence * 0.1 +
      hydrationAdherence * 0.1
    );

    // Determine trend (would use historical data in production)
    const trend: 'improving' | 'stable' | 'declining' = 
      overallScore >= 80 ? 'improving' :
      overallScore >= 60 ? 'stable' : 'declining';

    return {
      userId,
      date,
      overallScore,
      mealAdherence: Math.round(mealAdherence),
      proteinAdherence: Math.round(proteinAdherence),
      calorieAdherence: Math.round(calorieAdherence),
      macroAdherence: Math.round(macroAdherence),
      hydrationAdherence: Math.round(hydrationAdherence),
      mealsCompleted: completedMeals,
      mealsTarget: mealTasks.length,
      proteinConsumedG: proteinConsumed,
      proteinTargetG: proteinTarget,
      caloriesConsumed,
      caloriesTarget,
      trend,
      streak: 0, // Would calculate from historical data
    };
  }

  /**
   * Generate interventions for nutrition adherence issues
   */
  static generateInterventions(
    userId: string,
    date: string,
    adherence: NutritionAdherence,
    currentTime: Date
  ): NutritionIntervention[] {
    const interventions: NutritionIntervention[] = [];
    const hour = currentTime.getHours();

    // Intervention 1: Low protein by evening
    if (hour >= 18 && adherence.proteinAdherence < 70) {
      const proteinGap = adherence.proteinTargetG - adherence.proteinConsumedG;
      interventions.push({
        id: `intervention-protein-${date}`,
        userId,
        date,
        interventionType: 'low_protein',
        urgency: proteinGap > 50 ? 'high' : 'medium',
        title: `Protein intake low (${Math.round(adherence.proteinAdherence)}%)`,
        description: `You've consumed ${adherence.proteinConsumedG}g of ${adherence.proteinTargetG}g protein target`,
        suggestedAction: `Add ${Math.round(proteinGap)}g protein before bed (protein shake, Greek yogurt, or lean meat)`,
        currentValue: adherence.proteinConsumedG,
        targetValue: adherence.proteinTargetG,
        gap: proteinGap,
        dismissed: false,
        createdAt: currentTime.toISOString(),
      });
    }

    // Intervention 2: Missed meals
    if (adherence.mealsCompleted < adherence.mealsTarget && hour >= 14) {
      interventions.push({
        id: `intervention-meals-${date}`,
        userId,
        date,
        interventionType: 'missed_meal',
        urgency: 'medium',
        title: `Missed ${adherence.mealsTarget - adherence.mealsCompleted} meal(s)`,
        description: `Only ${adherence.mealsCompleted} of ${adherence.mealsTarget} meals completed`,
        suggestedAction: 'Prioritize remaining meals to hit daily targets',
        currentValue: adherence.mealsCompleted,
        targetValue: adherence.mealsTarget,
        gap: adherence.mealsTarget - adherence.mealsCompleted,
        dismissed: false,
        createdAt: currentTime.toISOString(),
      });
    }

    // Intervention 3: Low hydration
    if (adherence.hydrationAdherence < 60 && hour >= 16) {
      const hydrationGap = (adherence.hydrationAdherence / 100) * 100; // Simplified
      interventions.push({
        id: `intervention-hydration-${date}`,
        userId,
        date,
        interventionType: 'low_hydration',
        urgency: 'medium',
        title: `Hydration low (${Math.round(adherence.hydrationAdherence)}%)`,
        description: 'You\'re behind on daily hydration target',
        suggestedAction: `Drink ${Math.round(hydrationGap)}oz water before end of day`,
        currentValue: 0, // Would track actual hydration
        targetValue: 100,
        gap: hydrationGap,
        dismissed: false,
        createdAt: currentTime.toISOString(),
      });
    }

    logger.info('✅ [NUTRITION EXECUTION] Interventions generated', {
      userId,
      date,
      interventionCount: interventions.length,
    });

    return interventions;
  }

  /**
   * Update task status from intake logging
   */
  static updateTaskFromIntake(
    task: NutritionExecutionTask,
    intake: Partial<NutritionIntake>
  ): NutritionExecutionTask {
    const updated = { ...task };

    if (task.taskType === 'protein_target' && intake.totalProteinG) {
      updated.actualValue = intake.totalProteinG;
      updated.status = intake.totalProteinG >= (task.targetValue || 0) ? 'completed' : 'partial';
      updated.completedAt = new Date().toISOString();
    }

    if (task.taskType === 'macro_target' && intake.totalCalories) {
      updated.actualValue = intake.totalCalories;
      const target = task.targetValue || 0;
      const withinRange = Math.abs(intake.totalCalories - target) / target <= 0.1;
      updated.status = withinRange ? 'completed' : 'partial';
      updated.completedAt = new Date().toISOString();
    }

    if (task.taskType === 'hydration' && intake.hydrationOz) {
      updated.actualValue = intake.hydrationOz;
      updated.status = intake.hydrationOz >= (task.targetValue || 0) ? 'completed' : 'partial';
      updated.completedAt = new Date().toISOString();
    }

    return updated;
  }
}

// ============================================================================
// NUTRITION INTAKE MODEL
// ============================================================================

export interface NutritionIntake {
  userId: string;
  date: string;
  
  // Daily totals
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatsG: number;
  totalFiberG?: number;
  hydrationOz?: number;
  
  // Meals logged
  meals: Array<{
    mealName: string;
    mealTime: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
  }>;
  
  // Metadata
  loggedAt: string;
}

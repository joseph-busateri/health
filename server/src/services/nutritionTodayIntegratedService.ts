import { randomUUID } from 'crypto';

import { getEngineSnapshot } from './engineStateService';
import { getWorkoutTodayIntegrated } from './workoutTodayIntegratedService';
import { getCrossEngineIntelligenceToday } from './crossEngineIntelligenceService';
import { getBaselineProfile } from './baselineProfileService';
import { getLatestBodyCompositionContext, calculateLeanBodyMassLb } from './bodyCompositionContextService';
import { logger } from '../utils/logger';
import type {
  NutritionTodayIntegrated,
  NutritionTargets,
  NutritionMealTiming,
  NutritionAdjustmentApplied,
  NutritionCrossEngineInfluence,
  NutritionTodayContext,
  NutritionSource,
} from '../types/nutritionTodayIntegrated';

const nutritionTodayStore = new Map<string, NutritionTodayIntegrated[]>();

interface BaselineNutrition {
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  hydrationOz: number;
  bodyWeight?: number;
}

const baselineNutritionStore = new Map<string, BaselineNutrition>();

export async function seedNutritionBaseline(baseline: BaselineNutrition): Promise<void> {
  baselineNutritionStore.set(baseline.userId, baseline);
  logger.info('📋 [NUTRITION BASELINE] Baseline seeded', { userId: baseline.userId });
}

function getActivityMultiplier(activityLevel: string): number {
  switch (activityLevel) {
    case 'sedentary': return 1.2;
    case 'lightly_active': return 1.375;
    case 'moderately_active': return 1.55;
    case 'very_active': return 1.725;
    case 'extremely_active': return 1.9;
    default: return 1.55; // Default to moderately active
  }
}

async function getBaselineNutrition(userId: string): Promise<BaselineNutrition> {
  // Check in-memory store first (for backward compatibility)
  const baseline = baselineNutritionStore.get(userId);
  if (baseline) {
    return baseline;
  }

  // Load body composition for accurate calorie/protein calculations
  const bodyComp = await getLatestBodyCompositionContext(userId);
  
  // Try to load from baseline profile
  try {
    const profile = await getBaselineProfile(userId);
    
    if (profile.baselineCalories && profile.baselineProteinG) {
      let calories = profile.baselineCalories;
      let protein = profile.baselineProteinG;
      let bodyWeight = profile.weightLbs || 180;
      
      // Use body composition for more accurate calculations if available
      if (bodyComp.hasBodyComposition) {
        logger.info('✅ [NUTRITION BASELINE] Body composition available', {
          userId,
          bodyFatPercentage: bodyComp.bodyFatPercentage,
          leanMassLb: bodyComp.dryLeanMassLb,
          weightLb: bodyComp.weightLb,
          bmr: bodyComp.basalMetabolicRateKcal,
        });
        
        // Use actual weight from body composition
        if (bodyComp.weightLb !== null) {
          bodyWeight = bodyComp.weightLb;
        }
        
        // Calculate calories using Katch-McArdle formula if lean mass available
        if (bodyComp.basalMetabolicRateKcal !== null) {
          // Use measured BMR from body composition scan
          const bmr = bodyComp.basalMetabolicRateKcal;
          const activityMultiplier = getActivityMultiplier(profile.activityLevel || 'moderately_active');
          calories = Math.round(bmr * activityMultiplier);
          logger.info('📊 [NUTRITION BASELINE] Using measured BMR from body composition', {
            userId,
            bmr,
            activityMultiplier,
            tdee: calories,
          });
        } else if (bodyComp.bodyFatPercentage !== null && bodyComp.weightLb !== null) {
          // Calculate using Katch-McArdle formula: BMR = 370 + (21.6 * lean mass in kg)
          const leanMassLb = calculateLeanBodyMassLb(bodyComp);
          if (leanMassLb !== null) {
            const leanMassKg = leanMassLb * 0.453592;
            const bmr = 370 + (21.6 * leanMassKg);
            const activityMultiplier = getActivityMultiplier(profile.activityLevel || 'moderately_active');
            calories = Math.round(bmr * activityMultiplier);
            logger.info('📊 [NUTRITION BASELINE] Using Katch-McArdle formula with body composition', {
              userId,
              leanMassLb,
              leanMassKg,
              bmr,
              activityMultiplier,
              tdee: calories,
            });
          }
        }
        
        // Calculate protein based on lean mass if available
        const leanMassLb = calculateLeanBodyMassLb(bodyComp);
        if (leanMassLb !== null) {
          // 1g protein per lb of lean mass (standard for body composition-based calculation)
          protein = Math.round(leanMassLb);
          logger.info('📊 [NUTRITION BASELINE] Using lean mass for protein target', {
            userId,
            leanMassLb,
            proteinG: protein,
          });
        }
      } else {
        logger.info('⚠️ [NUTRITION BASELINE] No body composition available, using baseline profile values', { userId });
      }
      
      const baselineFromProfile: BaselineNutrition = {
        userId,
        calories,
        protein,
        carbs: profile.baselineCarbsG || Math.round((calories - (protein * 4) - (80 * 9)) / 4),
        fats: profile.baselineFatsG || 80,
        hydrationOz: profile.baselineHydrationOz || 100,
        bodyWeight,
      };
      
      // Cache in memory for subsequent calls
      baselineNutritionStore.set(userId, baselineFromProfile);
      
      logger.info('✅ [NUTRITION BASELINE] Loaded from baseline profile', { 
        userId, 
        calories: baselineFromProfile.calories 
      });
      
      return baselineFromProfile;
    }
  } catch (error) {
    logger.warn('⚠️ [NUTRITION BASELINE] Failed to load from profile, using defaults', { 
      userId, 
      error: (error as Error).message 
    });
  }

  // Fallback to defaults if profile not available
  let calories = 2800;
  let protein = 200;
  let bodyWeight = 180;
  
  // Even without profile, try to use body composition if available
  if (bodyComp.hasBodyComposition) {
    logger.info('⚠️ [NUTRITION BASELINE] No profile, but body composition available', { userId });
    
    if (bodyComp.weightLb !== null) {
      bodyWeight = bodyComp.weightLb;
    }
    
    if (bodyComp.basalMetabolicRateKcal !== null) {
      const bmr = bodyComp.basalMetabolicRateKcal;
      const activityMultiplier = 1.55; // Assume moderately active
      calories = Math.round(bmr * activityMultiplier);
      logger.info('📊 [NUTRITION BASELINE] Using measured BMR from body composition (no profile)', {
        userId,
        bmr,
        tdee: calories,
      });
    } else if (bodyComp.bodyFatPercentage !== null && bodyComp.weightLb !== null) {
      const leanMassLb = calculateLeanBodyMassLb(bodyComp);
      if (leanMassLb !== null) {
        const leanMassKg = leanMassLb * 0.453592;
        const bmr = 370 + (21.6 * leanMassKg);
        const activityMultiplier = 1.55; // Assume moderately active
        calories = Math.round(bmr * activityMultiplier);
        logger.info('📊 [NUTRITION BASELINE] Using Katch-McArdle formula (no profile)', {
          userId,
          leanMassLb,
          bmr,
          tdee: calories,
        });
      }
    }
    
    const leanMassLb = calculateLeanBodyMassLb(bodyComp);
    if (leanMassLb !== null) {
      protein = Math.round(leanMassLb);
      logger.info('📊 [NUTRITION BASELINE] Using lean mass for protein (no profile)', {
        userId,
        leanMassLb,
        proteinG: protein,
      });
    }
  }
  
  const defaultBaseline: BaselineNutrition = {
    userId,
    calories,
    protein,
    carbs: Math.round((calories - (protein * 4) - (80 * 9)) / 4),
    fats: 80,
    hydrationOz: 100,
    bodyWeight,
  };
  
  baselineNutritionStore.set(userId, defaultBaseline);
  
  logger.warn('⚠️ [NUTRITION BASELINE] Using default values', { userId });
  
  return defaultBaseline;
}

function applyWorkoutLoadAdjustment(
  targets: NutritionTargets,
  workoutStatus: string,
  workoutIntensity: string,
  reason: string,
): { targets: NutritionTargets; adjustment: NutritionAdjustmentApplied } {
  const adjustedTargets = { ...targets };
  let carbIncrease = 0;
  let calorieIncrease = 0;

  if (workoutStatus === 'optimal' || workoutIntensity?.includes('RPE 8-9')) {
    carbIncrease = 20;
    calorieIncrease = Math.round(targets.carbs * 0.2 * 4);
    adjustedTargets.carbs = Math.round(targets.carbs * 1.2);
    adjustedTargets.calories += calorieIncrease;
  } else if (workoutStatus === 'moderate' || workoutIntensity?.includes('RPE 7-8')) {
    carbIncrease = 15;
    calorieIncrease = Math.round(targets.carbs * 0.15 * 4);
    adjustedTargets.carbs = Math.round(targets.carbs * 1.15);
    adjustedTargets.calories += calorieIncrease;
  } else if (workoutStatus === 'deload') {
    carbIncrease = -15;
    calorieIncrease = Math.round(targets.carbs * -0.15 * 4);
    adjustedTargets.carbs = Math.round(targets.carbs * 0.85);
    adjustedTargets.calories += calorieIncrease;
  }

  return {
    targets: adjustedTargets,
    adjustment: {
      type: 'carbs',
      reason,
      adjustment: `Carbs ${carbIncrease > 0 ? 'increased' : 'decreased'} by ${Math.abs(carbIncrease)}% (${targets.carbs}g → ${adjustedTargets.carbs}g) due to ${workoutStatus} workout`,
    },
  };
}

function applyRecoveryAdjustment(
  targets: NutritionTargets,
  recoveryScore: number,
  reason: string,
): { targets: NutritionTargets; adjustment: NutritionAdjustmentApplied } {
  const adjustedTargets = { ...targets };
  
  if (recoveryScore < 60) {
    const proteinIncrease = Math.round(targets.protein * 0.15);
    adjustedTargets.protein = Math.round(targets.protein * 1.15);
    adjustedTargets.calories += proteinIncrease * 4;

    return {
      targets: adjustedTargets,
      adjustment: {
        type: 'protein',
        reason,
        adjustment: `Protein increased by 15% (${targets.protein}g → ${adjustedTargets.protein}g) to support recovery`,
      },
    };
  }

  return { targets: adjustedTargets, adjustment: { type: 'protein', reason: 'No adjustment needed', adjustment: 'Recovery adequate' } };
}

function applyStressAdjustment(
  targets: NutritionTargets,
  stressScore: number,
  reason: string,
): { targets: NutritionTargets; adjustment: NutritionAdjustmentApplied } {
  const adjustedTargets = { ...targets };
  
  if (stressScore > 65) {
    const hydrationIncrease = Math.round(targets.hydrationOz * 0.15);
    adjustedTargets.hydrationOz = Math.round(targets.hydrationOz * 1.15);

    return {
      targets: adjustedTargets,
      adjustment: {
        type: 'hydration',
        reason,
        adjustment: `Hydration increased by 15% (${targets.hydrationOz}oz → ${adjustedTargets.hydrationOz}oz) due to elevated stress`,
      },
    };
  }

  return { targets: adjustedTargets, adjustment: { type: 'hydration', reason: 'No adjustment needed', adjustment: 'Stress manageable' } };
}

function applyGoalAdjustment(
  targets: NutritionTargets,
  goalType: string,
  reason: string,
): { targets: NutritionTargets; adjustment: NutritionAdjustmentApplied } {
  const adjustedTargets = { ...targets };
  let adjustment = '';

  if (goalType === 'muscle_gain' || goalType === 'strength') {
    const calorieIncrease = 400;
    const proteinIncrease = 20;
    adjustedTargets.calories += calorieIncrease;
    adjustedTargets.protein += proteinIncrease;
    adjustedTargets.carbs = Math.round((adjustedTargets.calories - (adjustedTargets.protein * 4) - (adjustedTargets.fats * 9)) / 4);
    adjustment = `Calories +${calorieIncrease}, Protein +${proteinIncrease}g for muscle gain`;
  } else if (goalType === 'fat_loss' || goalType === 'weight_loss') {
    const calorieDecrease = 400;
    const proteinIncrease = 30;
    adjustedTargets.calories -= calorieDecrease;
    adjustedTargets.protein += proteinIncrease;
    adjustedTargets.carbs = Math.round((adjustedTargets.calories - (adjustedTargets.protein * 4) - (adjustedTargets.fats * 9)) / 4);
    adjustment = `Calories -${calorieDecrease}, Protein +${proteinIncrease}g for fat loss`;
  } else if (goalType === 'performance' || goalType === 'athletic_performance') {
    const carbIncrease = Math.round(targets.carbs * 0.2);
    adjustedTargets.carbs += carbIncrease;
    adjustedTargets.calories += carbIncrease * 4;
    adjustment = `Carbs +${carbIncrease}g for performance`;
  }

  return {
    targets: adjustedTargets,
    adjustment: {
      type: 'goal_driven',
      reason,
      adjustment: adjustment || 'No goal-specific adjustment',
    },
  };
}

function buildMealTiming(
  hasWorkout: boolean,
  workoutType: string,
  targets: NutritionTargets,
): NutritionMealTiming {
  if (!hasWorkout) {
    return {
      breakfast: `${Math.round(targets.protein * 0.25)}g protein, ${Math.round(targets.carbs * 0.25)}g carbs`,
      lunch: `${Math.round(targets.protein * 0.3)}g protein, ${Math.round(targets.carbs * 0.3)}g carbs`,
      dinner: `${Math.round(targets.protein * 0.3)}g protein, ${Math.round(targets.carbs * 0.25)}g carbs`,
      snacks: `${Math.round(targets.protein * 0.15)}g protein, ${Math.round(targets.carbs * 0.2)}g carbs`,
    };
  }

  const preWorkoutCarbs = Math.round(targets.carbs * 0.15);
  const preWorkoutProtein = Math.round(targets.protein * 0.15);
  const postWorkoutCarbs = Math.round(targets.carbs * 0.25);
  const postWorkoutProtein = Math.round(targets.protein * 0.25);

  return {
    preWorkout: `${preWorkoutCarbs}g carbs, ${preWorkoutProtein}g protein (1-2 hours before)`,
    postWorkout: `${postWorkoutCarbs}g carbs, ${postWorkoutProtein}g protein (within 1 hour)`,
    breakfast: `${Math.round(targets.protein * 0.2)}g protein, ${Math.round(targets.carbs * 0.2)}g carbs`,
    lunch: `${Math.round(targets.protein * 0.2)}g protein, ${Math.round(targets.carbs * 0.2)}g carbs`,
    dinner: `${Math.round(targets.protein * 0.2)}g protein, ${Math.round(targets.carbs * 0.2)}g carbs`,
  };
}

function applyAdherenceSimplification(
  targets: NutritionTargets,
  adherenceScore: number,
): { targets: NutritionTargets; adjustment: NutritionAdjustmentApplied | null } {
  if (adherenceScore < 60) {
    const simplifiedTargets = {
      ...targets,
      protein: Math.round(targets.protein / 10) * 10,
      carbs: Math.round(targets.carbs / 20) * 20,
      fats: Math.round(targets.fats / 10) * 10,
      calories: Math.round(targets.calories / 100) * 100,
      hydrationOz: Math.round(targets.hydrationOz / 10) * 10,
    };

    return {
      targets: simplifiedTargets,
      adjustment: {
        type: 'goal_driven',
        reason: `Low adherence (${adherenceScore}) - simplified targets`,
        adjustment: 'Rounded targets to simpler numbers for easier tracking',
      },
    };
  }

  return { targets, adjustment: null };
}

export async function getNutritionTodayIntegrated(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<NutritionTodayIntegrated> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = nutritionTodayStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 [NUTRITION TODAY] Returning cached nutrition plan', { userId, date });
    return existing;
  }

  logger.info('🔵 [NUTRITION TODAY] Generating integrated nutrition plan', { userId, date });

  const baseline = await getBaselineNutrition(userId);
  const snapshot = await getEngineSnapshot(userId);

  let workoutToday;
  try {
    workoutToday = await getWorkoutTodayIntegrated(userId);
  } catch (error) {
    logger.warn('⚠️ [NUTRITION TODAY] Workout today not available', { userId });
  }

  const context: NutritionTodayContext = {
    userId,
    date,
    baselineNutrition: baseline,
    workoutToday,
    recoveryScore: snapshot.recoveryCluster?.recoveryScore,
    stressScore: snapshot.recoveryCluster?.stressScore,
    adherenceScore: snapshot.workout?.adherenceScore,
    goalType: (snapshot as any).goal?.primaryGoal || (snapshot as any).goals?.primaryGoal,
    predictiveRisk: (snapshot as any).predictiveIntelligence?.riskLevel || (snapshot as any).predictive?.riskLevel,
    bodyWeight: baseline.bodyWeight,
  };

  logger.info('📋 [NUTRITION TODAY] Baseline loaded', {
    userId,
    calories: baseline.calories,
    protein: baseline.protein,
    carbs: baseline.carbs,
    fats: baseline.fats,
  });

  let targets: NutritionTargets = {
    calories: baseline.calories,
    protein: baseline.protein,
    carbs: baseline.carbs,
    fats: baseline.fats,
    hydrationOz: baseline.hydrationOz,
  };

  const baselineTargets = { ...targets };
  const adjustments: NutritionAdjustmentApplied[] = [];

  logger.info('🔵 [NUTRITION TODAY] Applying adjustments', {
    userId,
    hasWorkout: !!workoutToday,
    recoveryScore: context.recoveryScore,
    stressScore: context.stressScore,
  });

  if (workoutToday && workoutToday.workoutStatus) {
    const workoutResult = applyWorkoutLoadAdjustment(
      targets,
      workoutToday.workoutStatus,
      workoutToday.exercises?.[0]?.intensity || '',
      `Workout status: ${workoutToday.workoutStatus}`,
    );
    targets = workoutResult.targets;
    adjustments.push(workoutResult.adjustment);
  }

  if (context.recoveryScore != null && context.recoveryScore < 60) {
    const recoveryResult = applyRecoveryAdjustment(
      targets,
      context.recoveryScore,
      `Low recovery score: ${context.recoveryScore}`,
    );
    targets = recoveryResult.targets;
    if (recoveryResult.adjustment.adjustment !== 'Recovery adequate') {
      adjustments.push(recoveryResult.adjustment);
    }
  }

  if (context.stressScore != null && context.stressScore > 65) {
    const stressResult = applyStressAdjustment(
      targets,
      context.stressScore,
      `Elevated stress score: ${context.stressScore}`,
    );
    targets = stressResult.targets;
    if (stressResult.adjustment.adjustment !== 'Stress manageable') {
      adjustments.push(stressResult.adjustment);
    }
  }

  if (context.goalType) {
    const goalResult = applyGoalAdjustment(
      targets,
      context.goalType,
      `Goal type: ${context.goalType}`,
    );
    targets = goalResult.targets;
    if (goalResult.adjustment.adjustment !== 'No goal-specific adjustment') {
      adjustments.push(goalResult.adjustment);
    }
  }

  if (context.adherenceScore != null) {
    const adherenceResult = applyAdherenceSimplification(targets, context.adherenceScore);
    targets = adherenceResult.targets;
    if (adherenceResult.adjustment) {
      adjustments.push(adherenceResult.adjustment);
    }
  }

  const mealTiming = buildMealTiming(
    !!workoutToday,
    workoutToday?.workoutType || '',
    targets,
  );

  const summary = adjustments.length > 0
    ? `Nutrition plan adjusted based on ${adjustments.length} factors: ${adjustments.map(a => a.type).join(', ')}`
    : 'Baseline nutrition plan - no adjustments needed';

  const source: NutritionSource = adjustments.length > 0 ? 'ai_optimized' : 'baseline';

  // Load cross-engine intelligence for transparency
  let crossEngineInfluence: NutritionCrossEngineInfluence | undefined;
  try {
    const crossEngine = await getCrossEngineIntelligenceToday(userId);
    if (crossEngine) {
      const uniqueEngines = new Set<string>();
      crossEngine.patterns?.forEach(p => {
        p.sourceEngines?.forEach(e => uniqueEngines.add(e));
      });

      crossEngineInfluence = {
        applied: true,
        overallStatus: crossEngine.overallStatus,
        influencingEngines: Array.from(uniqueEngines),
        patterns: crossEngine.patterns?.slice(0, 3).map(p => ({
          name: p.name,
          severity: p.severity,
          summary: p.summary,
        })),
        summary: crossEngine.recommendation?.summary,
      };

      logger.info('✅ [NUTRITION TODAY] Cross-engine influence loaded', {
        userId,
        overallStatus: crossEngine.overallStatus,
        patternCount: crossEngine.patterns?.length || 0,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [NUTRITION TODAY] Cross-engine intelligence unavailable', {
      userId,
      error: (error as Error).message,
    });
  }

  // Build adjustmentsApplied with enhanced transparency
  const adjustmentsApplied: NutritionAdjustmentApplied[] = adjustments.map(adj => ({
    type: adj.type,
    change: adj.adjustment,
    reason: adj.reason,
    source: adj.type === 'hydration' && context.stressScore ? 'Stress Engine' : 
            adj.type === 'protein' && context.recoveryScore ? 'Recovery Engine' : 
            'Nutrition Engine',
  }));

  const record: NutritionTodayIntegrated = {
    id: randomUUID(),
    userId,
    date,
    targets,
    baselineTargets,
    mealTiming,
    adjustments,
    adjustmentsApplied,
    summary,
    source,
    crossEngineInfluence,
    sourceSignals: {
      recoveryScore: context.recoveryScore,
      stressScore: context.stressScore,
      adherenceScore: context.adherenceScore,
      workoutStatus: workoutToday?.workoutStatus,
      workoutIntensity: workoutToday?.exercises?.[0]?.intensity,
      goalType: context.goalType,
      predictiveRisk: context.predictiveRisk,
    },
    createdAt: new Date().toISOString(),
  };

  const history = nutritionTodayStore.get(userId) ?? [];
  nutritionTodayStore.set(userId, [record, ...history]);

  logger.info('✅ [NUTRITION TODAY] Integrated nutrition plan generated', {
    userId,
    adjustmentCount: adjustments.length,
    calories: targets.calories,
    protein: targets.protein,
    source,
  });

  return record;
}

export async function getNutritionTodayHistory(userId: string): Promise<NutritionTodayIntegrated[]> {
  return nutritionTodayStore.get(userId) ?? [];
}

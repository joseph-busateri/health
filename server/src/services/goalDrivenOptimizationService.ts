import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getPredictiveToday } from './predictiveIntelligenceService';
import { getAdaptiveInsights } from './adaptiveScoringService';
import { getAutonomousToday } from './autonomousOptimizationService';
import { buildGoalDrivenPlan } from './goalPlanBuilder';
import { enrichGoalPlanWithAI } from './goalAIEnrichment';
import { normalizeGoalPlan } from './goalRecommendationNormalizer';
import { validateGoalPlan } from './goalRecommendationValidator';
import type { GoalDrivenRecord, GoalOptimizationContext, UserGoal } from '../types/goalOptimization';

const goalStore = new Map<string, GoalDrivenRecord[]>();
const userGoalsStore = new Map<string, UserGoal[]>();

async function buildGoalOptimizationContext(userId: string): Promise<GoalOptimizationContext> {
  logger.info('🔵 Building goal optimization context', { userId });

  // Fetch user goals
  const goals = userGoalsStore.get(userId) ?? [];

  // Fetch current signals
  const [recovery, stress, joint] = await Promise.all([
    getRecoveryToday(userId).catch(() => null),
    getStressToday(userId).catch(() => null),
    getJointHealthToday(userId).catch(() => null),
  ]);

  // Fetch predictive trends
  let predictiveTrends = null;
  try {
    const predictive = await getPredictiveToday(userId);
    predictiveTrends = {
      recoveryTrend: predictive.evidence?.signals?.find((s: any) => s.name === 'recoveryTrend')?.trend,
      stressTrend: predictive.evidence?.signals?.find((s: any) => s.name === 'stressTrend')?.trend,
      jointTrend: predictive.evidence?.signals?.find((s: any) => s.name === 'jointTrend')?.trend,
    };
  } catch (error) {
    logger.warn('⚠️  Failed to fetch predictive trends', { userId });
  }

  // Fetch adaptive insights
  let adaptiveInsights = null;
  try {
    adaptiveInsights = getAdaptiveInsights(userId);
  } catch (error) {
    logger.warn('⚠️  Failed to fetch adaptive insights', { userId });
  }

  // Fetch autonomous plan
  let autonomousPlan = null;
  try {
    const autonomous = await getAutonomousToday(userId);
    autonomousPlan = autonomous.plan;
  } catch (error) {
    logger.warn('⚠️  Failed to fetch autonomous plan', { userId });
  }

  const context: GoalOptimizationContext = {
    userId,
    goals,
    recoveryScore: recovery?.recoveryScore,
    recoveryStatus: recovery?.recoveryStatus,
    stressScore: stress?.stressScore,
    stressStatus: stress?.stressStatus,
    jointRiskLevel: joint?.riskLevel,
    predictiveTrends,
    adaptiveInsights,
    autonomousPlan,
  };

  logger.info('✅ Goal optimization context built', {
    userId,
    goalCount: goals.length,
    hasRecovery: !!recovery,
    hasStress: !!stress,
    hasJoint: !!joint,
    hasPredictive: !!predictiveTrends,
    hasAdaptive: !!adaptiveInsights,
    hasAutonomous: !!autonomousPlan,
  });

  return context;
}

export async function getGoalDrivenToday(
  userId: string,
  options?: { regenerate?: boolean }
): Promise<GoalDrivenRecord> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = goalStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 Returning cached goal-driven record', { userId, date });
    return existing;
  }

  logger.info('🔵 Starting goal-driven optimization', { userId });

  // Step 1: Build optimization context
  const context = await buildGoalOptimizationContext(userId);

  if (context.goals.length === 0) {
    logger.warn('⚠️  No goals set for user', { userId });
  }

  // Step 2: Build goal-driven plan
  const basePlan = buildGoalDrivenPlan(context);

  logger.info('📊 Base goal plan generated', {
    userId,
    adjustmentCount: basePlan.adjustments.length,
    primaryGoal: basePlan.primaryGoal,
    goalAlignment: basePlan.goalAlignment,
  });

  // Step 3: AI enrichment (if enabled)
  const useAI = process.env.USE_AI_ENRICHMENT === 'true' && 
                process.env.USE_AI_ENRICHMENT_GOALS === 'true';

  let finalPlan = basePlan;

  if (useAI && context.goals.length > 0) {
    logger.info('🟢 AI enrichment enabled for goal-driven plan', { userId });

    const aiResult = await enrichGoalPlanWithAI(context, basePlan);

    if (aiResult.success && aiResult.output) {
      const normalized = normalizeGoalPlan(aiResult.output, basePlan);
      const validation = validateGoalPlan(normalized);

      if (validation.valid) {
        finalPlan = normalized;
        logger.info('✅ AI-enriched goal plan validated', { userId });
      } else {
        logger.warn('⚠️  AI-enriched plan failed validation, using fallback', {
          userId,
          errors: validation.errors,
        });
      }
    } else {
      logger.warn('⚠️  AI enrichment failed, using fallback', {
        userId,
        error: aiResult.error,
      });
    }
  } else {
    logger.info('ℹ️  Using fallback goal-driven plan', {
      userId,
      reason: !useAI ? 'AI disabled' : 'No goals set',
    });
  }

  // Step 4: Validate final plan
  const validation = validateGoalPlan(finalPlan);
  if (!validation.valid) {
    logger.error('❌ Final plan validation failed', {
      userId,
      errors: validation.errors,
    });
    throw new Error('Goal-driven plan validation failed');
  }

  // Step 5: Create record
  const record: GoalDrivenRecord = {
    id: randomUUID(),
    userId,
    date,
    goals: context.goals,
    plan: finalPlan,
    createdAt: new Date().toISOString(),
  };

  // Step 6: Store record
  const history = goalStore.get(userId) ?? [];
  goalStore.set(userId, [record, ...history]);

  logger.info('✅ Goal-driven optimization complete', {
    userId,
    goalCount: context.goals.length,
    adjustmentCount: finalPlan.adjustments.length,
    primaryGoal: finalPlan.primaryGoal,
    goalAlignment: finalPlan.goalAlignment,
    source: finalPlan.source,
  });

  return record;
}

export async function getGoalDrivenHistory(userId: string): Promise<GoalDrivenRecord[]> {
  return goalStore.get(userId) ?? [];
}

export function setUserGoals(userId: string, goals: UserGoal[]): void {
  logger.info('🎯 Setting user goals', { userId, goalCount: goals.length });
  userGoalsStore.set(userId, goals);
}

export function getUserGoals(userId: string): UserGoal[] {
  return userGoalsStore.get(userId) ?? [];
}

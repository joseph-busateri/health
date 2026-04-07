import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getPredictiveToday } from './predictiveIntelligenceService';
import { getAdaptiveInsights } from './adaptiveScoringService';
import { buildAutonomousPlan } from './autonomousPlanBuilder';
import { enrichAutonomousPlanWithAI } from './autonomousAIEnrichment';
import { normalizeAutonomousPlan } from './autonomousRecommendationNormalizer';
import { validateAutonomousPlan } from './autonomousRecommendationValidator';
import type { AutonomousRecord, OptimizationContext } from '../types/autonomousOptimization';

const autonomousStore = new Map<string, AutonomousRecord[]>();

async function buildOptimizationContext(userId: string): Promise<OptimizationContext> {
  logger.info('🔵 Building optimization context', { userId });

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

  const context: OptimizationContext = {
    userId,
    recoveryScore: recovery?.recoveryScore,
    recoveryStatus: recovery?.recoveryStatus,
    stressScore: stress?.stressScore,
    stressStatus: stress?.stressStatus,
    jointRiskLevel: joint?.riskLevel,
    predictiveTrends,
    adaptiveInsights,
  };

  logger.info('✅ Optimization context built', {
    userId,
    hasRecovery: !!recovery,
    hasStress: !!stress,
    hasJoint: !!joint,
    hasPredictive: !!predictiveTrends,
    hasAdaptive: !!adaptiveInsights,
  });

  return context;
}

export async function getAutonomousToday(
  userId: string,
  options?: { regenerate?: boolean }
): Promise<AutonomousRecord> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = autonomousStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 Returning cached autonomous record', { userId, date });
    return existing;
  }

  logger.info('🔵 Starting autonomous optimization', { userId });

  // Step 1: Build optimization context
  const context = await buildOptimizationContext(userId);

  // Step 2: Build autonomous plan
  const basePlan = buildAutonomousPlan(context);

  logger.info('📊 Base plan generated', {
    userId,
    adjustmentCount: basePlan.adjustments.length,
    priority: basePlan.priority,
  });

  // Step 3: AI enrichment (if enabled)
  const useAI = process.env.USE_AI_ENRICHMENT === 'true' && 
                process.env.USE_AI_ENRICHMENT_AUTONOMOUS === 'true';

  let finalPlan = basePlan;

  if (useAI) {
    logger.info('🟢 AI enrichment enabled for autonomous plan', { userId });

    const aiResult = await enrichAutonomousPlanWithAI(context, basePlan);

    if (aiResult.success && aiResult.output) {
      const normalized = normalizeAutonomousPlan(aiResult.output, basePlan);
      const validation = validateAutonomousPlan(normalized);

      if (validation.valid) {
        finalPlan = normalized;
        logger.info('✅ AI-enriched autonomous plan validated', { userId });
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
    logger.info('ℹ️  Using fallback autonomous plan', {
      userId,
      reason: !useAI ? 'AI disabled' : 'unknown',
    });
  }

  // Step 4: Validate final plan
  const validation = validateAutonomousPlan(finalPlan);
  if (!validation.valid) {
    logger.error('❌ Final plan validation failed', {
      userId,
      errors: validation.errors,
    });
    throw new Error('Autonomous plan validation failed');
  }

  // Step 5: Create record
  const record: AutonomousRecord = {
    id: randomUUID(),
    userId,
    date,
    plan: finalPlan,
    createdAt: new Date().toISOString(),
  };

  // Step 6: Store record
  const history = autonomousStore.get(userId) ?? [];
  autonomousStore.set(userId, [record, ...history]);

  logger.info('✅ Autonomous optimization complete', {
    userId,
    adjustmentCount: finalPlan.adjustments.length,
    priority: finalPlan.priority,
    source: finalPlan.source,
  });

  return record;
}

export async function getAutonomousHistory(userId: string): Promise<AutonomousRecord[]> {
  return autonomousStore.get(userId) ?? [];
}

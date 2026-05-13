import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getCrossEngineToday } from './crossEngineSynthesisService';
import { getPredictiveToday } from './predictiveIntelligenceService';
import { logger } from '../utils/logger';
import type { PrioritizationInput } from '../types/recommendationPrioritization';

export async function collectRecoveryRecommendations(userId: string): Promise<any | null> {
  try {
    const result = await getRecoveryToday(userId);
    logger.info('📥 Collected Recovery recommendation', {
      userId,
      hasRecommendation: !!result?.recommendation,
    });
    return result;
  } catch (error) {
    logger.warn('⚠️  Failed to collect Recovery recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function collectStressRecommendations(userId: string): Promise<any | null> {
  try {
    const result = await getStressToday(userId);
    logger.info('📥 Collected Stress recommendation', {
      userId,
      hasRecommendation: !!result?.recommendation,
    });
    return result;
  } catch (error) {
    logger.warn('⚠️  Failed to collect Stress recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function collectJointRecommendations(userId: string): Promise<any | null> {
  try {
    const result = await getJointHealthToday(userId);
    logger.info('📥 Collected Joint recommendation', {
      userId,
      hasRecommendation: !!result?.recommendation,
    });
    return result;
  } catch (error) {
    logger.warn('⚠️  Failed to collect Joint recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function collectCrossEngineRecommendations(userId: string): Promise<any | null> {
  try {
    const result = await getCrossEngineToday(userId);
    logger.info('📥 Collected Cross-Engine recommendation', {
      userId,
      hasRecommendation: !!result?.recommendation,
    });
    return result;
  } catch (error) {
    logger.warn('⚠️  Failed to collect Cross-Engine recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function collectPredictiveRecommendations(userId: string): Promise<any | null> {
  try {
    const result = await getPredictiveToday(userId);
    logger.info('📥 Collected Predictive recommendation', {
      userId,
      hasRecommendation: !!result?.recommendation,
    });
    return result;
  } catch (error) {
    logger.warn('⚠️  Failed to collect Predictive recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function collectAllRecommendations(userId: string): Promise<PrioritizationInput> {
  logger.info('🔵 Starting recommendation collection', { userId });

  const [recovery, stress, joint, crossEngine, predictive] = await Promise.all([
    collectRecoveryRecommendations(userId),
    collectStressRecommendations(userId),
    collectJointRecommendations(userId),
    collectCrossEngineRecommendations(userId),
    collectPredictiveRecommendations(userId),
  ]);

  const input: PrioritizationInput = {
    recovery,
    stress,
    joint,
    crossEngine,
    predictive,
  };

  const collectedCount = [recovery, stress, joint, crossEngine, predictive].filter(r => r !== null).length;

  logger.info('✅ Recommendation collection complete', {
    userId,
    collectedCount,
    hasRecovery: !!recovery,
    hasStress: !!stress,
    hasJoint: !!joint,
    hasCrossEngine: !!crossEngine,
    hasPredictive: !!predictive,
  });

  return input;
}

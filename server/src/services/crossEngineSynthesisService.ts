import { randomUUID } from 'crypto';
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { buildCrossEngineEvidence } from './crossEngineEvidenceBuilder';
import { buildCrossEngineFallbackRecommendation } from './crossEngineFallbackBuilder';
import { enrichCrossEngineRecommendationWithAI } from './crossEngineAIEnrichment';
import { normalizeCrossEngineRecommendation } from './crossEngineRecommendationNormalizer';
import { validateCrossEngineRecommendation } from './crossEngineRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { logger } from '../utils/logger';
import type {
  CrossEngineInputs,
  CrossEngineResult,
  CrossEngineRecommendation,
} from '../types/crossEngine';

const crossEngineStore = new Map<string, CrossEngineResult[]>();

export const getCrossEngineToday = async (
  userId: string,
  options?: { regenerate?: boolean },
): Promise<CrossEngineResult> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = crossEngineStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  logger.info('🔵 Cross-Engine: Starting synthesis', { userId });

  // Step 1: Fetch engine results
  const [recoveryResult, stressResult, jointResult] = await Promise.all([
    getRecoveryToday(userId).catch(() => null),
    getStressToday(userId).catch(() => null),
    getJointHealthToday(userId).catch(() => null),
  ]);

  logger.info('🔵 Cross-Engine: Engine results fetched', {
    userId,
    hasRecovery: !!recoveryResult,
    hasStress: !!stressResult,
    hasJoint: !!jointResult,
  });

  // Step 2: Build inputs
  const inputs: CrossEngineInputs = {
    recoveryScore: recoveryResult?.recoveryScore,
    recoveryStatus: recoveryResult?.status,
    stressScore: stressResult?.stressScore,
    stressStatus: stressResult?.status,
    jointRiskLevel: jointResult?.riskLevel,
    jointStatus: jointResult?.jointHealthStatus,
  };

  // Step 3: Build evidence
  const evidence = buildCrossEngineEvidence(inputs);

  logger.info('🔵 Cross-Engine: Evidence built', {
    userId,
    overallStatus: evidence.overallStatus,
    signalCount: evidence.signals.length,
  });

  // Step 4: Build fallback recommendation
  const fallbackRecommendation = buildCrossEngineFallbackRecommendation(
    evidence.overallStatus,
    inputs,
  );

  logger.info('🔵 Cross-Engine: Fallback recommendation ready', {
    userId,
    priority: fallbackRecommendation.priority,
    source: fallbackRecommendation.source,
  });

  // Step 5: AI Enrichment (if enabled)
  const useAIEnrichment =
    process.env.USE_AI_ENRICHMENT === 'true' &&
    process.env.USE_AI_ENRICHMENT_CROSS_ENGINE === 'true';
  const shouldEnrich =
    useAIEnrichment &&
    (evidence.overallStatus === 'constrained' || evidence.overallStatus === 'high_risk');

  let finalRecommendation: CrossEngineRecommendation = fallbackRecommendation;

  if (shouldEnrich) {
    logger.info('🟢 Cross-Engine: AI enrichment attempt', {
      userId,
      overallStatus: evidence.overallStatus,
    });

    try {
      const aiResponse = await enrichCrossEngineRecommendationWithAI(evidence, fallbackRecommendation);

      if (aiResponse.success && aiResponse.output) {
        logger.info('🟢 Cross-Engine: AI enrichment successful', {
          userId,
          hasSummary: !!aiResponse.output.summary,
          hasRationale: !!aiResponse.output.rationale,
        });

        // Step 6: Normalize AI Output
        const normalized = normalizeCrossEngineRecommendation(aiResponse.output, fallbackRecommendation);

        logger.info('🟢 Cross-Engine: Normalization complete', {
          userId,
          priority: normalized.priority,
          actionCount: normalized.actions.length,
        });

        // Step 7: Validate
        const validation = validateCrossEngineRecommendation(normalized);

        if (validation.valid) {
          finalRecommendation = normalized;
          logger.info('🟢 Cross-Engine: Validation passed - using AI-enriched recommendation', {
            userId,
            source: finalRecommendation.source,
          });
        } else {
          logger.warn('🔴 Cross-Engine: Validation failed - using fallback', {
            userId,
            errors: validation.errors,
          });
        }
      } else {
        logger.warn('🔴 Cross-Engine: AI enrichment failed - using fallback', {
          userId,
          error: aiResponse.error,
        });
      }
    } catch (error) {
      logger.error('🔴 Cross-Engine: AI enrichment error - using fallback', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger.info('🔵 Cross-Engine: AI enrichment skipped', {
      userId,
      useAIEnrichment,
      overallStatus: evidence.overallStatus,
      reason: !useAIEnrichment ? 'feature flags disabled' : 'optimal/moderate status',
    });
  }

  // Step 8: Persist through RecommendationEngine
  try {
    const recommendationRequest = {
      sourceEngine: 'holistic' as const,
      sourceRecordId: undefined,
      title: `Cross-Engine Analysis: ${evidence.overallStatus}`,
      description: finalRecommendation.summary,
      rationale: finalRecommendation.rationale,
      priority: finalRecommendation.priority ?? 'important',
      category: 'performance_enhancement' as const,
      actionType: undefined,
      actionTarget: 'overall_health',
      actionDetails: {
        overallStatus: evidence.overallStatus,
        signals: evidence.signals,
        source: finalRecommendation.source,
      },
      confidenceLevel: 'high' as const,
      dataQualityScore: evidence.signals.length > 4 ? 90 : 75,
      supportingMetrics: evidence.signals.map(s => ({
        name: s.name,
        value: String(s.value),
        status: 'normal' as const,
      })),
    };

    await createRecommendation({
      userId,
      request: recommendationRequest as any,
    });

    logger.info('🟢 Cross-Engine: Recommendation persisted', {
      userId,
      source: finalRecommendation.source,
    });
  } catch (error) {
    logger.error('🔴 Cross-Engine: Failed to persist recommendation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Step 9: Create result
  const result: CrossEngineResult = {
    id: randomUUID(),
    userId,
    date,
    overallStatus: evidence.overallStatus,
    evidence,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
  };

  const history = crossEngineStore.get(userId) ?? [];
  crossEngineStore.set(userId, [result, ...history]);

  logger.info('✅ Cross-Engine: Complete', {
    userId,
    overallStatus: result.overallStatus,
    source: finalRecommendation.source,
  });

  return result;
};

export const getCrossEngineHistory = async (userId: string): Promise<CrossEngineResult[]> => {
  return crossEngineStore.get(userId) ?? [];
};

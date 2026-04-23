import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { getBaselineFields } from './baselineContextService';
import { getDeviceContext } from './deviceContextService';
import {
  emitRecommendation,
  calculateConfidenceLevel,
  calculateDataQualityScore,
  calculateUrgencyScore,
} from '../utils/recommendationEmitter';
import { analyzeRecoveryRecord } from './recommendationAnalysisService';
import { enrichRecommendationWithAI } from './recommendationPromptBuilder';
import { normalizeRecommendation, validateRecommendation } from './recommendationNormalizer';
import { createRecommendation } from './recommendationEngineService';
import { logger } from '../utils/logger';
import {
  trackAIEnrichmentAttempted,
  trackAIEnrichmentSucceeded,
  trackAIEnrichmentFailed,
  trackFallbackUsed,
  trackValidationAttempted,
  trackValidationPassed,
  trackValidationFailed,
  trackNormalizationAttempted,
  trackNormalizationSucceeded,
} from './recommendationMetricsService';
import type {
  RecoveryReadiness,
  RecoveryRecord,
  RecoveryRecommendation,
  RecoverySourceInputs,
  RecoveryStatus,
} from '../types/recoveryEngine';

const recoveryStore = new Map<string, RecoveryRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeHrv = (value: number) => clamp(((value - 20) / 80) * 100, 0, 100);
const normalizeSleepDuration = (value: number) => clamp((value / 8) * 100, 0, 100);
const normalizeSleepQuality = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeRestingHr = (value: number) => clamp(((90 - value) / 40) * 100, 0, 100);
const normalizeStress = (value: number) => clamp(((5 - value) / 4) * 100, 0, 100);
const normalizeWorkoutLoad = (value: number) => clamp(((10 - value) / 10) * 100, 0, 100);
const normalizeVerbalRecovery = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeAdherence = (value: number) => clamp(value, 0, 100);

export const calculateRecoveryScore = (inputs: RecoverySourceInputs): number => {
  const weightedSignals: Array<{ score: number; weight: number }> = [];

  const addSignal = (
    raw: number | undefined,
    normalize: (value: number) => number,
    weight: number
  ) => {
    if (raw == null || !Number.isFinite(raw)) {
      weightedSignals.push({ score: 65, weight });
      return;
    }
    weightedSignals.push({ score: normalize(raw), weight });
  };

  addSignal(inputs.hrv, normalizeHrv, 0.16);
  addSignal(inputs.sleepDurationHours, normalizeSleepDuration, 0.19);
  addSignal(inputs.sleepQuality, normalizeSleepQuality, 0.14);
  addSignal(inputs.restingHr, normalizeRestingHr, 0.14);
  addSignal(inputs.stressLevel, normalizeStress, 0.14);
  addSignal(inputs.workoutLoad, normalizeWorkoutLoad, 0.09);
  addSignal(inputs.verbalRecoveryFeeling, normalizeVerbalRecovery, 0.09);
  addSignal(inputs.adherenceScore, normalizeAdherence, 0.05);

  const totalWeight = weightedSignals.reduce((sum, signal) => sum + signal.weight, 0);
  const weightedScore = weightedSignals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);

  return Math.round(clamp(weightedScore / totalWeight, 0, 100));
};

export const evaluateRecoveryStatus = (
  score: number
): {
  recoveryStatus: RecoveryStatus;
  readinessClassification: RecoveryReadiness;
} => {
  if (score >= 75) {
    return {
      recoveryStatus: 'fully_recovered',
      readinessClassification: 'ready',
    };
  }

  if (score >= 45) {
    return {
      recoveryStatus: 'moderate_recovery',
      readinessClassification: 'caution',
    };
  }

  return {
    recoveryStatus: 'poor_recovery',
    readinessClassification: 'recovery_focus',
  };
};

export const generateRecoveryRecommendation = (
  status: RecoveryStatus,
  inputs: RecoverySourceInputs
): RecoveryRecommendation => {
  if (status === 'fully_recovered') {
    return {
      summary: 'Recovery markers are strong. Proceed with normal training demand.',
      actions: [
        'Maintain sleep consistency and hydration.',
        'Keep planned training intensity unless symptoms change.',
      ],
    };
  }

  if (status === 'moderate_recovery') {
    const actions = [
      'Cap top-set intensity and extend warm-up by 5-10 minutes.',
      'Prioritize earlier bedtime and reduce evening stimulation.',
    ];

    if ((inputs.stressLevel ?? 0) >= 4) {
      actions.push('Add 10 minutes of down-regulation breathing or low-intensity walk.');
    }

    return {
      summary: 'Recovery is moderate. Use a conservative training approach today.',
      actions,
    };
  }

  const actions = [
    'Shift to recovery day or reduce session volume by 30-40%.',
    'Prioritize sleep opportunity and hydration/electrolytes.',
  ];

  if ((inputs.workoutLoad ?? 0) >= 8) {
    actions.push('Avoid additional high-load training until recovery rebounds.');
  }

  return {
    summary: 'Recovery is poor. Focus on restoration before high training stress.',
    actions,
  };
};

const mergeInputs = async (
  userId: string,
  override?: RecoverySourceInputs
): Promise<RecoverySourceInputs> => {
  const source: RecoverySourceInputs = {
    hrv: undefined,
    sleepDurationHours: undefined,
    sleepQuality: undefined,
    restingHr: undefined,
    stressLevel: undefined,
    workoutLoad: undefined,
    verbalRecoveryFeeling: undefined,
    adherenceScore: undefined,
    ...override,
  };

  // Phase 12: Integrate device context for real-time recovery intelligence
  try {
    const deviceContext = await getDeviceContext(userId);
    
    if (deviceContext.flags.hasSleepData && deviceContext.sleep) {
      // Device sleep data takes priority for real-time accuracy
      source.sleepDurationHours ??= deviceContext.sleep.lastNightDuration 
        ? deviceContext.sleep.lastNightDuration / 60 
        : undefined;
      
      // Map sleep quality to 1-5 scale
      if (deviceContext.sleep.lastNightQuality) {
        const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
        source.sleepQuality ??= qualityMap[deviceContext.sleep.lastNightQuality] || 3;
      }
      
      logger.info('[DeviceRecovery] Sleep signals integrated', {
        userId,
        sleepDuration: source.sleepDurationHours,
        sleepQuality: source.sleepQuality,
        source: deviceContext.sleep.source,
      });
    }
    
    if (deviceContext.flags.hasCardiovascularData && deviceContext.cardiovascular) {
      // Device cardiovascular data for HRV and resting HR
      source.hrv ??= deviceContext.cardiovascular.hrv;
      source.restingHr ??= deviceContext.cardiovascular.restingHR;
      
      logger.info('[DeviceRecovery] Cardiovascular signals integrated', {
        userId,
        hrv: source.hrv,
        restingHR: source.restingHr,
        source: deviceContext.cardiovascular.source,
      });
    }
    
    if (deviceContext.flags.hasRecoveryData && deviceContext.recovery) {
      // Device recovery signals (Oura readiness, etc.)
      // Use readiness score to influence recovery feeling if not manually set
      if (deviceContext.recovery.readinessScore && !source.verbalRecoveryFeeling) {
        // Map readiness score (0-100) to recovery feeling (1-5)
        const readiness = deviceContext.recovery.readinessScore;
        if (readiness >= 85) source.verbalRecoveryFeeling = 5;
        else if (readiness >= 70) source.verbalRecoveryFeeling = 4;
        else if (readiness >= 55) source.verbalRecoveryFeeling = 3;
        else if (readiness >= 40) source.verbalRecoveryFeeling = 2;
        else source.verbalRecoveryFeeling = 1;
      }
      
      logger.info('[DeviceRecovery] Recovery signals integrated', {
        userId,
        readinessScore: deviceContext.recovery.readinessScore,
        recoveryStatus: deviceContext.recovery.recoveryStatus,
        source: deviceContext.recovery.source,
      });
    }
  } catch (error) {
    // Gracefully continue if device context unavailable
    logger.warn('[DeviceRecovery] Device context unavailable, using fallback sources', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Existing logic preserved - daily logs as fallback
  try {
    const latestLog = (await getDailyLogsForUser(userId, 1))[0];
    if (latestLog) {
      source.sleepDurationHours ??= latestLog.sleepHours;
      source.stressLevel ??= latestLog.stressLevel;
      source.verbalRecoveryFeeling ??= latestLog.recoveryFeeling;
      source.adherenceScore ??= latestLog.workoutAdherence;
    }
  } catch {
    // Gracefully continue when external source is unavailable.
  }

  // Existing logic preserved - engine snapshot as fallback
  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.stressLevel ??=
    snapshot?.recoveryCluster?.stressScore != null
      ? Math.round(5 - (snapshot.recoveryCluster.stressScore / 100) * 4)
      : undefined;
  source.verbalRecoveryFeeling ??=
    snapshot?.recoveryCluster?.recoveryScore != null
      ? Math.round(1 + (snapshot.recoveryCluster.recoveryScore / 100) * 4)
      : undefined;
  source.adherenceScore ??=
    snapshot?.recoveryCluster?.adherenceScore ?? snapshot?.workout?.adherenceScore;

  return source;
};

function buildAIRecommendationRequest(
  userId: string,
  record: RecoveryRecord,
  recommendation: RecoveryRecommendation,
  normalized: any,
  recoveryScore: number,
  recoveryStatus: RecoveryStatus,
  readinessClassification: RecoveryReadiness
) {
  return {
    sourceEngine: 'recovery' as const,
    sourceRecordId: record.id,
    title: normalized.title || 'Modify Today\'s Workout for Better Recovery',
    description: normalized.description || recommendation.summary,
    rationale:
      normalized.description ||
      `Recovery score is ${recoveryScore}/100. ${recommendation.actions.join(' ')}`,
    priority: normalized.priority || 'important',
    urgencyScore: typeof normalized.urgencyScore === 'number' ? normalized.urgencyScore : 80,
    category: normalized.category || 'workout_modification',
    actionType: normalized.actionType || 'modify',
    actionTarget: normalized.actionTarget || 'Today\'s Workout',
    actionDetails: {
      recoveryScore,
      recoveryStatus,
      readinessClassification,
      recommendedActions: recommendation.actions,
      ...(normalized.actionDetails ?? {}),
    },
    confidenceLevel: normalized.confidenceLevel || 'high',
    dataQualityScore:
      typeof normalized.dataQualityScore === 'number' ? normalized.dataQualityScore : 95,
    expiresInHours: 24,
    expirationReason: 'Recovery status changes daily',
    reasonCodes: Array.isArray(normalized.reasonCodes) ? normalized.reasonCodes : [],
    recommendationGroup: normalized.recommendationGroup || 'recovery',
    supportingMetrics: Array.isArray(normalized.supportingMetrics)
      ? normalized.supportingMetrics
      : [],
    isInsightOnly: Boolean(normalized.isInsightOnly),
    requiresUserDecision: Boolean(normalized.requiresUserDecision),
  };
}

export const getRecoveryToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: RecoverySourceInputs }
): Promise<RecoveryRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = recoveryStore.get(userId)?.find((record) => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  // Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [RECOVERY ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    trainingExperience: baseline.trainingExperience,
    sleepTarget: baseline.sleepTarget,
    trainingDaysPerWeek: baseline.trainingDaysPerWeek,
  });

  const sourceInputs = await mergeInputs(userId, options?.override);
  const recoveryScore = calculateRecoveryScore(sourceInputs);
  const { recoveryStatus, readinessClassification } = evaluateRecoveryStatus(recoveryScore);
  const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);

  const record: RecoveryRecord = {
    id: randomUUID(),
    userId,
    date,
    recoveryScore,
    recoveryStatus,
    readinessClassification,
    sourceInputs,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  logger.info('Recovery scoring complete', {
    domain: 'recovery',
    stage: 'recovery_scoring_complete',
    userId,
    recovery_score: recoveryScore,
    recovery_state: recoveryStatus,
    readiness_classification: readinessClassification,
  });

  const history = recoveryStore.get(userId) ?? [];
  recoveryStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: record.id,
    field_name: 'recovery_score',
    new_value: String(record.recoveryScore),
    change_source: 'agent_adjustment',
    rationale: `Recovery engine computed ${record.recoveryStatus}`,
    confidence: 0.88,
  }).catch(() => undefined);

  if (recoveryStatus === 'poor_recovery' || recoveryStatus === 'moderate_recovery') {
    const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true';

    logger.info('AI enrichment decision', {
      domain: 'recovery',
      stage: 'ai_enrichment_attempt',
      userId,
      ai_enrichment_enabled: useAIEnrichment,
    });

    if (useAIEnrichment) {
      const aiStartTime = Date.now();

      try {
        logger.info('Using AI-enriched recommendation flow', { userId, recoveryScore });

        const evidence = analyzeRecoveryRecord(record, userId);

        if (!evidence) {
          logger.warn('No evidence generated, falling back to direct emission', { userId });
          trackFallbackUsed('evidence_generation_failed');
          throw new Error('Evidence generation returned null');
        }

        logger.info('Evidence built successfully', {
          userId,
          trigger: evidence.trigger,
          priority: evidence.priority,
          urgencyScore: evidence.urgencyScore,
          factorCount: evidence.contributingFactors.length,
        });

        trackAIEnrichmentAttempted();
        const aiResponse = await enrichRecommendationWithAI(evidence);
        const aiLatencyMs = Date.now() - aiStartTime;
        trackAIEnrichmentSucceeded(aiLatencyMs);

        logger.info('AI enrichment result', {
          domain: 'recovery',
          stage: 'ai_enrichment_result',
          userId,
          ai_enrichment_result: 'success',
          latency_ms: aiLatencyMs,
        });

        logger.info('AI enrichment completed', {
          userId,
          title: aiResponse.title,
          reasonCodeCount: Array.isArray(aiResponse.reasonCodes) ? aiResponse.reasonCodes.length : 0,
          latencyMs: aiLatencyMs,
        });

        trackNormalizationAttempted();
        const normalized = normalizeRecommendation(aiResponse);
        trackNormalizationSucceeded();

        logger.info('Normalization applied', {
          domain: 'recovery',
          stage: 'normalization_applied',
          userId,
        });

        trackValidationAttempted();
        const validation = validateRecommendation(normalized);

        if (!validation.valid) {
          const errorMessages = Array.isArray(validation.errors)
            ? validation.errors.map((e) => String(e))
            : ['Validation failed'];

          trackValidationFailed(errorMessages);

          logger.warn('Validation result', {
            domain: 'recovery',
            stage: 'validation_result',
            userId,
            validation_status: 'fail',
            error_count: errorMessages.length,
          });

          logger.warn('Recommendation validation failed, falling back to direct emission', {
            userId,
            errors: errorMessages,
          });

          trackFallbackUsed('validation_failed');
          throw new Error('Validation failed');
        }

        trackValidationPassed();

        logger.info('Validation result', {
          domain: 'recovery',
          stage: 'validation_result',
          userId,
          validation_status: 'pass',
        });

        logger.info('Recommendation validated successfully', { userId });

        const recommendationRequest = buildAIRecommendationRequest(
          userId,
          record,
          recommendation,
          normalized,
          recoveryScore,
          recoveryStatus,
          readinessClassification
        );

        logger.info('🔵 [AI PATH] BEFORE createRecommendation call', {
          userId,
          sourceEngine: 'recovery',
          sourceRecordId: record.id,
          title: recommendationRequest.title,
          priority: recommendationRequest.priority,
          urgencyScore: recommendationRequest.urgencyScore,
          category: recommendationRequest.category,
          normalized_request: JSON.stringify(recommendationRequest),
        });

        let result: any;
        try {
          result = await createRecommendation({
            userId,
            request: recommendationRequest as any,
          });

          logger.info('🟢 [AI PATH] AFTER createRecommendation call - SUCCESS', {
            userId,
            result_exists: !!result,
            recommendation_exists: !!result?.recommendation,
            full_result: JSON.stringify(result),
          });
        } catch (createError: any) {
          logger.error('🔴 [AI PATH] createRecommendation threw error', {
            userId,
            error_message: createError.message,
            error_stack: createError.stack,
            error_full: JSON.stringify(createError),
          });
          throw createError;
        }

        if (!result || !result.recommendation) {
          logger.error('🔴 [AI PATH] createRecommendation returned null or invalid result', {
            userId,
            result_is_null: result === null,
            result_is_undefined: result === undefined,
            recommendation_is_null: result?.recommendation === null,
            recommendation_is_undefined: result?.recommendation === undefined,
          });
          throw new Error('createRecommendation returned null or invalid result');
        }

        const conflictCount = Array.isArray(result?.conflicts) ? result.conflicts.length : 0;

        logger.info('Recommendation persisted', {
          domain: 'recovery',
          stage: 'recommendation_persisted',
          userId,
          recommendation_source: 'ai',
          persisted_by: 'recommendation_engine',
          recommendation_id: result.recommendation.id,
          source_engine: result.recommendation.sourceEngine,
          state: result.recommendation.state,
          user_id_in_recommendation: result.recommendation.userId,
          created_at: result.recommendation.createdAt,
          expires_at: result.recommendation.expiresAt,
          full_recommendation: JSON.stringify(result.recommendation),
        });

        logger.info('AI-enriched recommendation created successfully', {
          userId,
          recommendationId: result.recommendation.id,
          sourceEngine: result.recommendation.sourceEngine,
          conflictCount,
        });
      } catch (error: any) {
        const aiLatencyMs = Date.now() - aiStartTime;

        logger.error('🔴 [AI PATH] Caught error in AI enrichment flow', {
          userId,
          error_message: error.message,
          error_stack: error.stack,
          error_name: error.name,
          full_error: JSON.stringify(error),
        });

        const isExpectedFallback =
          error.message.includes('Evidence generation') ||
          error.message.includes('Validation failed') ||
          error.message.includes('timeout');

        let fallbackReason = 'error';
        if (error.message.includes('timeout')) fallbackReason = 'timeout';
        else if (error.message.includes('Evidence generation')) fallbackReason = 'evidence_failed';
        else if (error.message.includes('Validation failed')) fallbackReason = 'validation_failed';

        logger.warn('AI enrichment result', {
          domain: 'recovery',
          stage: 'ai_enrichment_result',
          userId,
          ai_enrichment_result: fallbackReason,
          latency_ms: aiLatencyMs,
        });

        if (isExpectedFallback) {
          logger.warn('AI-enriched flow failed (expected), falling back to direct emission', {
            userId,
            error: error.message,
            latencyMs: aiLatencyMs,
          });
        } else {
          logger.error('AI-enriched flow failed (unexpected), falling back to direct emission', {
            userId,
            error: error.message,
            latencyMs: aiLatencyMs,
          });
          trackAIEnrichmentFailed(error.message, aiLatencyMs);
        }

        logger.info('🟡 [FALLBACK PATH] Calling emitDirectRecommendation', { userId });
        await emitDirectRecommendation(
          userId,
          record,
          recoveryScore,
          recoveryStatus,
          readinessClassification,
          recommendation,
          sourceInputs
        );
      }
    } else {
      logger.info('Using direct emission flow (AI enrichment disabled)', { userId });

      logger.info('AI enrichment result', {
        domain: 'recovery',
        stage: 'ai_enrichment_result',
        userId,
        ai_enrichment_result: 'disabled',
        latency_ms: 0,
      });

      await emitDirectRecommendation(
        userId,
        record,
        recoveryScore,
        recoveryStatus,
        readinessClassification,
        recommendation,
        sourceInputs
      );
    }
  }

  return record;
};

export const getRecoveryHistory = async (userId: string): Promise<RecoveryRecord[]> => {
  return recoveryStore.get(userId) ?? [];
};

async function emitDirectRecommendation(
  userId: string,
  record: RecoveryRecord,
  recoveryScore: number,
  recoveryStatus: RecoveryStatus,
  readinessClassification: RecoveryReadiness,
  recommendation: RecoveryRecommendation,
  sourceInputs: RecoverySourceInputs
): Promise<void> {
  const requiredDataPoints = 8;
  const availableDataPoints = [
    sourceInputs.hrv,
    sourceInputs.sleepDurationHours,
    sourceInputs.sleepQuality,
    sourceInputs.restingHr,
    sourceInputs.stressLevel,
    sourceInputs.workoutLoad,
    sourceInputs.verbalRecoveryFeeling,
    sourceInputs.adherenceScore,
  ].filter((v) => v !== undefined && v !== null).length;

  const confidenceLevel = calculateConfidenceLevel(requiredDataPoints, availableDataPoints);
  const dataQualityScore = calculateDataQualityScore({
    dataAvailability: availableDataPoints / requiredDataPoints,
    dataRecency: 1.0,
    dataAccuracy: 0.9,
  });

  const severity = 100 - recoveryScore;
  const timeSensitivity = recoveryStatus === 'poor_recovery' ? 90 : 60;
  const urgencyScore = calculateUrgencyScore(severity, timeSensitivity);
  const priority: 'important' | 'optimization' =
    recoveryStatus === 'poor_recovery' ? 'important' : 'optimization';
  const actionType: 'modify' | 'decrease' =
    recoveryStatus === 'poor_recovery' ? 'modify' : 'decrease';

  const emitInput = {
    userId,
    sourceEngine: 'recovery' as const,
    sourceRecordId: record.id,
    title: recoveryStatus === 'poor_recovery' ? 'Take a recovery day' : 'Reduce training intensity',
    description: recommendation.summary,
    rationale: `Recovery score is ${recoveryScore}/100. ${recommendation.actions.join(' ')}`,
    priority,
    urgencyScore,
    category: 'workout_modification' as const,
    actionType,
    actionTarget: 'Today\'s Workout',
    actionDetails: {
      recoveryScore,
      recoveryStatus,
      readinessClassification,
      recommendedActions: recommendation.actions,
    },
    confidenceLevel,
    dataQualityScore,
    expiresInHours: 24,
    expirationReason: 'Recovery status changes daily',
  };

  logger.info('🔵 [FALLBACK PATH] BEFORE emitRecommendation call', {
    userId,
    sourceEngine: 'recovery',
    recoveryStatus,
    emit_input: JSON.stringify(emitInput),
  });

  let fallbackResult: any;
  try {
    fallbackResult = await emitRecommendation(emitInput);

    logger.info('🟢 [FALLBACK PATH] AFTER emitRecommendation call - SUCCESS', {
      userId,
      result_exists: !!fallbackResult,
      recommendation_exists: !!fallbackResult?.recommendation,
      full_result: JSON.stringify(fallbackResult),
    });
  } catch (err: any) {
    logger.error('🔴 [FALLBACK PATH] emitRecommendation threw error', {
      userId,
      error_message: err.message,
      error_stack: err.stack,
      error_full: JSON.stringify(err),
    });
    fallbackResult = null;
  }

  if (fallbackResult && fallbackResult.recommendation) {
    logger.info('🟢 [FALLBACK PATH] Fallback recommendation persisted successfully', {
      userId,
      recommendationId: fallbackResult.recommendation.id,
      sourceEngine: fallbackResult.recommendation.sourceEngine,
      state: fallbackResult.recommendation.state,
      user_id_in_recommendation: fallbackResult.recommendation.userId,
      created_at: fallbackResult.recommendation.createdAt,
      expires_at: fallbackResult.recommendation.expiresAt,
      full_recommendation: JSON.stringify(fallbackResult.recommendation),
    });
  } else {
    logger.error('🔴 [FALLBACK PATH] Fallback recommendation failed to persist', {
      userId,
      result_is_null: fallbackResult === null,
      result_is_undefined: fallbackResult === undefined,
    });
  }
}
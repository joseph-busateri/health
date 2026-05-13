import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getBaselineFields } from './baselineContextService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { createRecommendation } from './recommendationEngineService';
import { enrichStressRecommendationWithAI } from './stressAIEnrichment';
import { normalizeStressRecommendation } from './stressRecommendationNormalizer';
import { validateStressRecommendation } from './stressRecommendationValidator';
import { logger } from '../utils/logger';
import type {
  StressRecord,
  StressRecommendation,
  StressSourceInputs,
  StressStatus,
  StressEvidence,
  StressEvidenceSignal,
  StressRecommendationPriority,
} from '../types/stressEngine';

const stressStore = new Map<string, StressRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeInterviewStress = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeHrvToStress = (value: number) => clamp(100 - ((value - 20) / 80) * 100, 0, 100);
const normalizeSleepToStress = (value: number) => clamp(100 - (value / 8) * 100, 0, 100);
const normalizeWorkoutLoadToStress = (value: number) => clamp((value / 10) * 100, 0, 100);
const normalizeRecoveryToStress = (value: number) => clamp(100 - value, 0, 100);

export const calculateStressScore = (inputs: StressSourceInputs): number => {
  const weightedSignals: Array<{ score: number; weight: number }> = [];

  const addSignal = (raw: number | undefined, normalize: (value: number) => number, weight: number) => {
    if (raw == null || !Number.isFinite(raw)) {
      weightedSignals.push({ score: 50, weight });
      return;
    }
    weightedSignals.push({ score: normalize(raw), weight });
  };

  addSignal(inputs.interviewStressLevel, normalizeInterviewStress, 0.3);
  addSignal(inputs.hrv, normalizeHrvToStress, 0.2);
  addSignal(inputs.sleepDurationHours, normalizeSleepToStress, 0.2);
  addSignal(inputs.workoutLoad, normalizeWorkoutLoadToStress, 0.15);
  addSignal(inputs.recoveryScore, normalizeRecoveryToStress, 0.15);

  const totalWeight = weightedSignals.reduce((sum, signal) => sum + signal.weight, 0);
  const weightedScore = weightedSignals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);

  return Math.round(clamp(weightedScore / totalWeight, 0, 100));
};

const scoreToStatus = (score: number): StressStatus => {
  if (score >= 70) {
    return 'high';
  }
  if (score >= 45) {
    return 'moderate';
  }
  return 'low';
};

export const evaluateCNSLoad = (inputs: StressSourceInputs, stressScore: number): StressStatus => {
  const workload = inputs.workoutLoad ?? 5;
  const hrv = inputs.hrv ?? 45;

  if (stressScore >= 70 || (workload >= 8 && hrv <= 35)) {
    return 'high';
  }

  if (stressScore >= 45 || workload >= 6 || hrv <= 45) {
    return 'moderate';
  }

  return 'low';
};

function buildStressEvidence(
  stressScore: number,
  stressStatus: StressStatus,
  cnsLoadStatus: StressStatus,
  sourceInputs: StressSourceInputs
): StressEvidence {
  const signals: StressEvidenceSignal[] = [];

  if (sourceInputs.interviewStressLevel !== undefined) {
    signals.push({
      name: 'interviewStressLevel',
      value: sourceInputs.interviewStressLevel,
      interpretation:
        sourceInputs.interviewStressLevel >= 4
          ? 'Self-reported stress is elevated'
          : 'Self-reported stress is manageable',
    });
  }

  if (sourceInputs.hrv !== undefined) {
    signals.push({
      name: 'hrv',
      value: sourceInputs.hrv,
      interpretation:
        sourceInputs.hrv <= 35
          ? 'Low HRV indicates nervous system strain'
          : 'HRV supports recovery',
    });
  }

  if (sourceInputs.sleepDurationHours !== undefined) {
    signals.push({
      name: 'sleepDuration',
      value: sourceInputs.sleepDurationHours,
      interpretation:
        sourceInputs.sleepDurationHours < 6
          ? 'Short sleep contributing to stress'
          : 'Sleep supports recovery',
    });
  }

  if (sourceInputs.workoutLoad !== undefined) {
    signals.push({
      name: 'workoutLoad',
      value: sourceInputs.workoutLoad,
      interpretation:
        sourceInputs.workoutLoad >= 8
          ? 'High workout load contributing to CNS fatigue'
          : 'Workout load manageable',
    });
  }

  if (sourceInputs.recoveryScore !== undefined) {
    signals.push({
      name: 'recoveryScore',
      value: sourceInputs.recoveryScore,
      interpretation:
        sourceInputs.recoveryScore < 50
          ? 'Low recovery increasing stress load'
          : 'Recovery supporting resilience',
    });
  }

  return {
    stressScore,
    stressStatus,
    cnsLoadStatus,
    sourceInputs,
    signals,
    summary: `Stress is ${stressStatus} with ${cnsLoadStatus} CNS load`,
  };
}

function buildStressFallbackRecommendation(
  stressStatus: StressStatus,
  cnsLoadStatus: StressStatus
): StressRecommendation {
  if (stressStatus === 'high' || cnsLoadStatus === 'high') {
    return {
      type: 'stress',
      priority: 'critical',
      summary: 'Reduce load and prioritize recovery today',
      rationale: 'Stress and CNS load elevated',
      actions: [
        'Reduce training intensity',
        'Increase sleep opportunity',
        'Prioritize hydration',
      ],
      source: 'fallback',
    };
  }

  if (stressStatus === 'moderate') {
    return {
      type: 'stress',
      priority: 'important',
      summary: 'Use moderate training and prioritize recovery',
      actions: [
        'Monitor fatigue',
        'Maintain hydration',
        'Consider lighter accessory work',
      ],
      source: 'fallback',
    };
  }

  return {
    type: 'stress',
    priority: 'optimization',
    summary: 'Stress manageable — proceed as planned',
    actions: ['Maintain routine', 'Continue recovery habits'],
    source: 'fallback',
  };
}

export const generateStressRecommendation = (
  stressStatus: StressStatus,
  cnsLoadStatus: StressStatus
): StressRecommendation => {
  if (stressStatus === 'low' && cnsLoadStatus === 'low') {
    return {
      summary: 'Stress and CNS load are low. Training load can remain normal.',
      actions: [
        'Proceed with planned training intensity.',
        'Maintain sleep and recovery routines to keep stress low.',
      ],
    };
  }

  if (stressStatus === 'moderate' || cnsLoadStatus === 'moderate') {
    return {
      summary: 'Stress/CNS load is moderate. Use controlled intensity and prioritize recovery inputs.',
      actions: [
        'Reduce top-end intensity by ~10% for today.',
        'Add post-session down-regulation (breathing, walk, or mobility).',
      ],
    };
  }

  return {
    summary: 'Stress and/or CNS load are high. Prioritize restoration before heavy training.',
    actions: [
      'Shift to recovery-focused training or deload session.',
      'Increase sleep opportunity and reduce additional workload today.',
    ],
  };
};

const mergeInputs = async (userId: string, override?: StressSourceInputs): Promise<StressSourceInputs> => {
  const source: StressSourceInputs = {
    ...override,
  };

  try {
    const latestLog = (await getDailyLogsForUser(userId, 1))[0];
    if (latestLog) {
      source.interviewStressLevel ??= latestLog.stressLevel;
      source.sleepDurationHours ??= latestLog.sleepHours;
      source.workoutLoad ??= clamp(Math.round((latestLog.workoutAdherence / 100) * 10), 1, 10);
    }
  } catch {
    // Graceful fallback when daily log source is unavailable.
  }

  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.interviewStressLevel ??= snapshot?.recoveryCluster?.stressScore != null
    ? Math.round(5 - (snapshot.recoveryCluster.stressScore / 100) * 4)
    : undefined;
  source.recoveryScore ??= snapshot?.recoveryCluster?.recoveryScore;
  source.workoutLoad ??= snapshot?.workout?.plannedSessions != null
    ? clamp(snapshot.workout.plannedSessions * 2, 1, 10)
    : undefined;

  return source;
};

export const getStressToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: StressSourceInputs }
): Promise<StressRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = stressStore.get(userId)?.find((record) => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  // Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [STRESS ENGINE] Baseline profile loaded', {
    userId,
    activityLevel: baseline.activityLevel,
    trainingExperience: baseline.trainingExperience,
    trainingDaysPerWeek: baseline.trainingDaysPerWeek,
  });

  const sourceInputs = await mergeInputs(userId, options?.override);
  const stressScore = calculateStressScore(sourceInputs);
  const stressStatus = scoreToStatus(stressScore);
  const cnsLoadStatus = evaluateCNSLoad(sourceInputs, stressScore);
  const deterministicRecommendation = generateStressRecommendation(stressStatus, cnsLoadStatus);

  // Build evidence for AI enrichment
  const evidence = buildStressEvidence(stressScore, stressStatus, cnsLoadStatus, sourceInputs);
  const fallbackRecommendation = buildStressFallbackRecommendation(stressStatus, cnsLoadStatus);

  let finalRecommendation = deterministicRecommendation;

  // AI Enrichment Flow (mirrors Recovery Engine)
  if (stressStatus === 'moderate' || stressStatus === 'high') {
    const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true' && process.env.USE_AI_ENRICHMENT_STRESS === 'true';

    logger.info('Stress AI enrichment decision', {
      domain: 'stress',
      stage: 'ai_enrichment_attempt',
      userId,
      stressStatus,
      cnsLoadStatus,
      ai_enrichment_enabled: useAIEnrichment,
    });

    if (useAIEnrichment) {
      const aiStartTime = Date.now();
      try {
        logger.info('Using AI-enriched stress recommendation flow', { userId, stressScore });

        // Step 1: AI enrichment
        const aiResponse = await enrichStressRecommendationWithAI(evidence, fallbackRecommendation);
        const aiLatencyMs = Date.now() - aiStartTime;

        logger.info('Stress AI enrichment result', {
          domain: 'stress',
          stage: 'ai_enrichment_result',
          userId,
          ai_enrichment_result: 'success',
          latency_ms: aiLatencyMs,
        });

        // Step 2: Normalize
        const normalized = normalizeStressRecommendation(aiResponse, fallbackRecommendation);

        logger.info('Stress normalization applied', {
          domain: 'stress',
          stage: 'normalization_applied',
          userId,
        });

        // Step 3: Validate
        const validation = validateStressRecommendation(normalized);

        if (!validation.valid) {
          logger.warn('Stress validation result', {
            domain: 'stress',
            stage: 'validation_result',
            userId,
            validation_status: 'fail',
            error_count: validation.errors.length,
          });

          logger.warn('Stress recommendation validation failed, using fallback', {
            userId,
            errors: validation.errors,
          });

          throw new Error('Validation failed');
        }

        logger.info('Stress validation result', {
          domain: 'stress',
          stage: 'validation_result',
          userId,
          validation_status: 'pass',
        });

        finalRecommendation = normalized;

        // Step 4: Persist through RecommendationEngine
        logger.info('🔵 [STRESS AI PATH] BEFORE createRecommendation call', {
          userId,
          sourceEngine: 'stress',
          stressScore,
          stressStatus,
          cnsLoadStatus,
        });

        const recommendationRequest = {
          sourceEngine: 'stress' as const,
          sourceRecordId: randomUUID(),
          title: normalized.summary,
          description: normalized.rationale || normalized.summary,
          rationale: normalized.rationale || evidence.summary,
          priority: normalized.priority || 'important',
          urgencyScore: Math.round(stressScore),
          category: 'stress_management' as const,
          actionType: 'modify' as const,
          actionTarget: 'Training Load',
          actionDetails: {
            stressScore,
            stressStatus,
            cnsLoadStatus,
            recommendedActions: normalized.actions,
          },
          confidenceLevel: 'medium' as const,
          dataQualityScore: 85,
          expiresInHours: 24,
          expirationReason: 'Stress status changes daily',
        };

        try {
          const result = await createRecommendation({
            userId,
            request: recommendationRequest as any,
          });

          logger.info('🟢 [STRESS AI PATH] AFTER createRecommendation call - SUCCESS', {
            userId,
            result_exists: !!result,
            recommendation_exists: !!result?.recommendation,
            full_result: JSON.stringify(result),
          });

          if (result && result.recommendation) {
            logger.info('Stress recommendation persisted', {
              domain: 'stress',
              stage: 'recommendation_persisted',
              userId,
              recommendation_source: 'ai',
              persisted_by: 'recommendation_engine',
              recommendation_id: result.recommendation.id,
              source_engine: result.recommendation.sourceEngine,
              state: result.recommendation.state,
            });
          }
        } catch (persistError: any) {
          logger.error('🔴 [STRESS AI PATH] createRecommendation threw error', {
            userId,
            error_message: persistError.message,
            error_stack: persistError.stack,
          });
        }
      } catch (error: any) {
        const aiLatencyMs = Date.now() - aiStartTime;

        logger.error('🔴 [STRESS AI PATH] Caught error in AI enrichment flow', {
          userId,
          error_message: error.message,
          error_stack: error.stack,
        });

        logger.warn('Stress AI enrichment result', {
          domain: 'stress',
          stage: 'ai_enrichment_result',
          userId,
          ai_enrichment_result: 'fallback',
          latency_ms: aiLatencyMs,
        });

        finalRecommendation = fallbackRecommendation;
      }
    } else {
      logger.info('Stress AI enrichment disabled', {
        domain: 'stress',
        stage: 'ai_enrichment_result',
        userId,
        ai_enrichment_result: 'disabled',
      });

      finalRecommendation = fallbackRecommendation;
    }
  }

  const record: StressRecord = {
    id: randomUUID(),
    userId,
    date,
    stressScore,
    stressStatus,
    cnsLoadStatus,
    sourceInputs,
    evidence,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
  };

  const history = stressStore.get(userId) ?? [];
  stressStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: record.id,
    field_name: 'stress_score',
    new_value: String(record.stressScore),
    change_source: 'agent_adjustment',
    rationale: `Stress/CNS engine computed status ${record.stressStatus}/${record.cnsLoadStatus}`,
    confidence: 0.87,
  }).catch(() => undefined);

  return record;
};

export const getStressHistory = async (userId: string): Promise<StressRecord[]> => {
  return stressStore.get(userId) ?? [];
};

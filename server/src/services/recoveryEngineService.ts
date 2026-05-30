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
import type { InputMetadata, InputSource } from '../types/inputMetadata';

const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

const recoveryStore = new Map<string, RecoveryRecord[]>();

/**
 * Clear all recovery cache
 */
export function clearRecoveryCache(): void {
  recoveryStore.clear();
  logger.info('🗑️ [RECOVERY ENGINE] All cache cleared');
}

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

export const calculateRecoveryScoreBreakdown = (inputs: RecoverySourceInputs): any => {
  // Category 1: Sleep Recovery (33 points = 19% + 14%)
  const sleepHasData = inputs.sleepDurationHours != null || inputs.sleepQuality != null;
  let sleepRecoveryScore = 0;
  if (sleepHasData) {
    const sleepDurationNormalized = inputs.sleepDurationHours != null 
      ? normalizeSleepDuration(inputs.sleepDurationHours) 
      : 65;
    const sleepQualityNormalized = inputs.sleepQuality != null 
      ? normalizeSleepQuality(inputs.sleepQuality) 
      : 65;
    sleepRecoveryScore = Math.round((sleepDurationNormalized * 0.19 + sleepQualityNormalized * 0.14));
  }
  const sleepRecoveryPercentage = sleepHasData ? Math.round((sleepRecoveryScore / 33) * 100) : 0;

  // Category 2: Cardiovascular Recovery (30 points = 16% + 14%)
  const cardiovascularHasData = inputs.hrv != null || inputs.restingHr != null;
  let cardiovascularRecoveryScore = 0;
  if (cardiovascularHasData) {
    const hrvNormalized = inputs.hrv != null ? normalizeHrv(inputs.hrv) : 65;
    const restingHrNormalized = inputs.restingHr != null ? normalizeRestingHr(inputs.restingHr) : 65;
    cardiovascularRecoveryScore = Math.round((hrvNormalized * 0.16 + restingHrNormalized * 0.14));
  }
  const cardiovascularRecoveryPercentage = cardiovascularHasData ? Math.round((cardiovascularRecoveryScore / 30) * 100) : 0;

  // Category 3: Training Load (14 points = 9% + 5%)
  const trainingHasData = inputs.workoutLoad != null || inputs.adherenceScore != null;
  let trainingLoadScore = 0;
  if (trainingHasData) {
    const workoutLoadNormalized = inputs.workoutLoad != null ? normalizeWorkoutLoad(inputs.workoutLoad) : 65;
    const adherenceNormalized = inputs.adherenceScore != null ? normalizeAdherence(inputs.adherenceScore) : 65;
    trainingLoadScore = Math.round((workoutLoadNormalized * 0.09 + adherenceNormalized * 0.05));
  }
  const trainingLoadPercentage = trainingHasData ? Math.round((trainingLoadScore / 14) * 100) : 0;

  // Category 4: Subjective Recovery (23 points = 14% + 9%)
  const subjectiveHasData = inputs.stressLevel != null || inputs.verbalRecoveryFeeling != null;
  let subjectiveRecoveryScore = 0;
  if (subjectiveHasData) {
    const stressNormalized = inputs.stressLevel != null ? normalizeStress(inputs.stressLevel) : 65;
    const verbalRecoveryNormalized = inputs.verbalRecoveryFeeling != null 
      ? normalizeVerbalRecovery(inputs.verbalRecoveryFeeling) 
      : 65;
    subjectiveRecoveryScore = Math.round((stressNormalized * 0.14 + verbalRecoveryNormalized * 0.09));
  }
  const subjectiveRecoveryPercentage = subjectiveHasData ? Math.round((subjectiveRecoveryScore / 23) * 100) : 0;

  // Only include categories with data in total calculation
  let total = 0;
  let maxTotal = 0;

  if (sleepHasData) {
    total += sleepRecoveryScore;
    maxTotal += 33;
  }

  if (cardiovascularHasData) {
    total += cardiovascularRecoveryScore;
    maxTotal += 30;
  }

  if (trainingHasData) {
    total += trainingLoadScore;
    maxTotal += 14;
  }

  if (subjectiveHasData) {
    total += subjectiveRecoveryScore;
    maxTotal += 23;
  }

  // Calculate percentage (handle division by zero)
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return {
    sleepRecovery: {
      score: sleepRecoveryScore,
      max: 33,
      percentage: sleepRecoveryPercentage,
      hasData: sleepHasData,
    },
    cardiovascularRecovery: {
      score: cardiovascularRecoveryScore,
      max: 30,
      percentage: cardiovascularRecoveryPercentage,
      hasData: cardiovascularHasData,
    },
    trainingLoad: {
      score: trainingLoadScore,
      max: 14,
      percentage: trainingLoadPercentage,
      hasData: trainingHasData,
    },
    subjectiveRecovery: {
      score: subjectiveRecoveryScore,
      max: 23,
      percentage: subjectiveRecoveryPercentage,
      hasData: subjectiveHasData,
    },
    total,
    maxTotal,
    percentage,
  };
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
};

interface RecoveryContextData {
  deviceContext: any;
  dailyLog: any;
  engineSnapshot: any;
}

/**
 * Calculate individual input score based on value and optimal ranges
 * Returns: 90 (optimal), 70 (moderate), 50 (elevated_risk), or 30 (high_risk)
 */
function calculateRecoveryInputScore(name: string, value: any): number | undefined {
  if (value === undefined || value === null) return undefined;

  switch (name) {
    case 'Heart Rate Variability':
      if (value >= 60) return 90;  // optimal
      if (value >= 45) return 70;  // moderate
      if (value >= 30) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Sleep Duration':
      if (value >= 8) return 90;   // optimal
      if (value >= 7) return 70;   // moderate
      if (value >= 6) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Sleep Quality':
      if (value >= 80) return 90;  // optimal
      if (value >= 60) return 70;  // moderate
      if (value >= 40) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Resting Heart Rate':
      if (value < 60) return 90;   // optimal (athletic)
      if (value < 70) return 70;   // moderate
      if (value < 80) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Stress Level':
      if (value <= 2) return 90;   // optimal
      if (value <= 3) return 70;   // moderate
      if (value <= 4) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Workout Load':
      // Lower is better for recovery
      if (value <= 3) return 90;   // optimal (light load)
      if (value <= 5) return 70;   // moderate
      if (value <= 7) return 50;   // elevated_risk
      return 30;                    // high_risk (overtraining)

    case 'Verbal Recovery Feeling':
      if (value >= 4) return 90;   // optimal (feeling great on 1-5 scale)
      if (value >= 3) return 70;   // moderate
      if (value >= 2) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Adherence Score':
      if (value >= 80) return 90;  // optimal
      if (value >= 60) return 70;  // moderate
      if (value >= 40) return 50;  // elevated_risk
      return 30;                    // high_risk

    default:
      return undefined;
  }
}

const buildRecoveryInputMetadata = (
  inputs: RecoverySourceInputs,
  contextData: RecoveryContextData
): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // HRV - from device context or derived
  metadata.push({
    name: 'Heart Rate Variability',
    value: inputs.hrv,
    unit: 'ms',
    source: inputs.hrv !== undefined
      ? (contextData.deviceContext?.cardiovascular?.source ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.hrv !== undefined
      ? { integration: contextData.deviceContext?.cardiovascular?.source || 'device' }
      : undefined,
    lastUpdated: inputs.hrv !== undefined ? now : undefined,
    category: 'Vitals',
    score: calculateRecoveryInputScore('Heart Rate Variability', inputs.hrv),
  });

  // Sleep Duration - from device context or daily log
  metadata.push({
    name: 'Sleep Duration',
    value: inputs.sleepDurationHours,
    unit: 'hours',
    source: inputs.sleepDurationHours !== undefined
      ? (contextData.deviceContext?.sleep?.source ? 'ACTUAL' : 'ACTUAL')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.sleepDurationHours !== undefined
      ? { integration: contextData.deviceContext?.sleep?.source || 'daily log' }
      : undefined,
    lastUpdated: inputs.sleepDurationHours !== undefined ? now : undefined,
    category: 'Sleep',
    score: calculateRecoveryInputScore('Sleep Duration', inputs.sleepDurationHours),
  });

  // Sleep Quality - from device context or daily log
  metadata.push({
    name: 'Sleep Quality',
    value: inputs.sleepQuality,
    unit: 'scale (1-5)',
    source: inputs.sleepQuality !== undefined
      ? (contextData.deviceContext?.sleep?.source ? 'ACTUAL' : 'ACTUAL')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.sleepQuality !== undefined
      ? { integration: contextData.deviceContext?.sleep?.source || 'daily log' }
      : undefined,
    lastUpdated: inputs.sleepQuality !== undefined ? now : undefined,
    category: 'Sleep',
    score: calculateRecoveryInputScore('Sleep Quality', inputs.sleepQuality),
  });

  // Resting Heart Rate - from device context
  metadata.push({
    name: 'Resting Heart Rate',
    value: inputs.restingHr,
    unit: 'bpm',
    source: inputs.restingHr !== undefined
      ? (contextData.deviceContext?.cardiovascular?.source ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.restingHr !== undefined
      ? { integration: contextData.deviceContext?.cardiovascular?.source || 'device' }
      : undefined,
    lastUpdated: inputs.restingHr !== undefined ? now : undefined,
    category: 'Vitals',
    score: calculateRecoveryInputScore('Resting Heart Rate', inputs.restingHr),
  });

  // Stress Level - from daily log or engine snapshot
  metadata.push({
    name: 'Stress Level',
    value: inputs.stressLevel,
    unit: 'scale (1-5)',
    source: inputs.stressLevel !== undefined
      ? (contextData.dailyLog?.stressLevel ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.stressLevel !== undefined
      ? { table: contextData.dailyLog?.stressLevel ? 'daily_logs' : 'engine_snapshot', field: 'stressLevel' }
      : undefined,
    lastUpdated: inputs.stressLevel !== undefined ? now : undefined,
    category: 'Wellness',
    score: calculateRecoveryInputScore('Stress Level', inputs.stressLevel),
  });

  // Workout Load - from engine snapshot
  metadata.push({
    name: 'Workout Load',
    value: inputs.workoutLoad,
    unit: 'scale (1-10)',
    source: inputs.workoutLoad !== undefined
      ? (contextData.engineSnapshot?.recoveryCluster?.workoutLoad ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.workoutLoad !== undefined
      ? { table: 'engine_snapshot', field: 'workoutLoad' }
      : undefined,
    lastUpdated: inputs.workoutLoad !== undefined ? now : undefined,
    category: 'Training',
    score: calculateRecoveryInputScore('Workout Load', inputs.workoutLoad),
  });

  // Verbal Recovery Feeling - from device context or daily log
  metadata.push({
    name: 'Verbal Recovery Feeling',
    value: inputs.verbalRecoveryFeeling,
    unit: 'scale (1-5)',
    source: inputs.verbalRecoveryFeeling !== undefined
      ? (contextData.deviceContext?.recovery?.source ? 'ACTUAL' : 'ACTUAL')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.verbalRecoveryFeeling !== undefined
      ? { integration: contextData.deviceContext?.recovery?.source || 'daily log' }
      : undefined,
    lastUpdated: inputs.verbalRecoveryFeeling !== undefined ? now : undefined,
    category: 'Subjective',
    score: calculateRecoveryInputScore('Verbal Recovery Feeling', inputs.verbalRecoveryFeeling),
  });

  // Adherence Score - from daily log
  metadata.push({
    name: 'Adherence Score',
    value: inputs.adherenceScore,
    unit: 'percentage',
    source: inputs.adherenceScore !== undefined
      ? (contextData.dailyLog?.workoutAdherence ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.adherenceScore !== undefined
      ? { table: 'daily_logs', field: 'workoutAdherence' }
      : undefined,
    lastUpdated: inputs.adherenceScore !== undefined ? now : undefined,
    category: 'Training',
    score: calculateRecoveryInputScore('Adherence Score', inputs.adherenceScore),
  });

  return metadata;
};

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
  const scoreBreakdown = calculateRecoveryScoreBreakdown(sourceInputs);
  const recoveryScore = scoreBreakdown.total; // Use breakdown total for consistency
  const { recoveryStatus, readinessClassification } = evaluateRecoveryStatus(recoveryScore);
  const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);

  // Build context data for detailed input metadata (if feature flag enabled)
  const contextData = SHOW_DETAIL_SCREEN_INPUTS ? {
    deviceContext: await getDeviceContext(userId).catch(() => null),
    dailyLog: (await getDailyLogsForUser(userId, 1))[0] || null,
    engineSnapshot: await getEngineSnapshot(userId).catch(() => null),
  } : undefined;

  // Build detailed input metadata (if feature flag enabled)
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS && contextData) {
    detailedInputs = buildRecoveryInputMetadata(sourceInputs, contextData);
    logger.info('✅ [RECOVERY ENGINE] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  const record: RecoveryRecord = {
    id: randomUUID(),
    userId,
    date,
    recoveryScore,
    recoveryStatus,
    readinessClassification,
    sourceInputs,
    recommendation,
    scoreBreakdown,
    createdAt: new Date().toISOString(),
    ...(detailedInputs && { detailedInputs }),
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
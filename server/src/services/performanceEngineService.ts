import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { getRecoveryToday } from './recoveryEngineService';
import { getLatestBodyCompositionContext } from './bodyCompositionContextService';
import { getDeviceContext } from './deviceContextService';
import { getDailyLogsForUser } from './structuredDailyLogService';
import { getEngineSnapshot } from './engineStateService';
import type { InputMetadata } from '../types/inputMetadata';
import type {
  PerformanceStatus,
  PerformanceSourceInputs,
  PerformanceRecommendation,
  PerformanceRecord,
  PerformanceScoreBreakdown,
  PerformanceEvidence,
  PerformanceEvidenceSignal,
} from '../types/performanceEngine';

const performanceStore = new Map<string, PerformanceRecord[]>();
const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Normalization functions - convert raw values to 0-100 scale
 */

// Joint Health Normalizations (lower is better for pain/tightness/soreness)
const normalizePainLevel = (painLevel: number): number => {
  if (painLevel === 0) return 90;
  if (painLevel <= 3) return 70;
  if (painLevel <= 6) return 50;
  return 30;
};

const normalizeTightnessLevel = (tightnessLevel: number): number => {
  if (tightnessLevel === 0) return 90;
  if (tightnessLevel <= 3) return 70;
  if (tightnessLevel <= 6) return 50;
  return 30;
};

const normalizeSorenessLevel = (sorenessLevel: number): number => {
  if (sorenessLevel === 0) return 90;
  if (sorenessLevel <= 3) return 70;
  if (sorenessLevel <= 6) return 50;
  return 30;
};

// Training Execution Normalizations
const normalizeWorkoutAdherence = (adherence: number): number => {
  if (adherence >= 80) return 90;
  if (adherence >= 60) return 70;
  if (adherence >= 40) return 50;
  return 30;
};

const normalizeWorkoutLoad = (load: number): number => {
  if (load >= 4 && load <= 7) return 90; // Optimal moderate load
  if (load >= 2 && load <= 8) return 70;
  if (load >= 1 && load <= 9) return 50;
  return 30; // Extreme load
};

const normalizeSessionCompletion = (completion: number): number => {
  if (completion >= 90) return 90;
  if (completion >= 75) return 70;
  if (completion >= 50) return 50;
  return 30;
};

// Physical Capacity Normalizations
const normalizeVO2Max = (vo2Max: number): number => {
  if (vo2Max >= 50) return 90;
  if (vo2Max >= 40) return 70;
  if (vo2Max >= 30) return 50;
  return 30;
};

const normalizeRestingHR = (hr: number): number => {
  if (hr < 50) return 90;
  if (hr < 60) return 70;
  if (hr < 70) return 50;
  return 30;
};

const normalizeLeanMass = (leanMassLb: number, heightInches?: number): number => {
  // Simplified - ideally would use FFMI (Fat-Free Mass Index)
  if (!heightInches) {
    // Default scoring based on absolute lean mass
    if (leanMassLb >= 150) return 90;
    if (leanMassLb >= 130) return 70;
    if (leanMassLb >= 110) return 50;
    return 30;
  }
  
  // Calculate FFMI if height available
  const heightMeters = heightInches * 0.0254;
  const leanMassKg = leanMassLb * 0.453592;
  const ffmi = leanMassKg / (heightMeters * heightMeters);
  
  if (ffmi >= 22) return 90; // High muscle mass
  if (ffmi >= 19) return 70; // Moderate
  if (ffmi >= 16) return 50; // Low
  return 30; // Very low
};

// Recovery Readiness Normalizations
const normalizeRecoveryScore = (score: number): number => {
  if (score >= 75) return 90;
  if (score >= 50) return 70;
  if (score >= 30) return 50;
  return 30;
};

const normalizeSleepQuality = (quality: number): number => {
  if (quality >= 4) return 90;
  if (quality >= 3) return 70;
  if (quality >= 2) return 50;
  return 30;
};

const normalizeStressScore = (stress: number): number => {
  // Lower stress is better
  if (stress <= 30) return 90;
  if (stress <= 50) return 70;
  if (stress <= 70) return 50;
  return 30;
};

/**
 * Calculate Performance Score Breakdown
 */
export const calculatePerformanceScoreBreakdown = (inputs: PerformanceSourceInputs): PerformanceScoreBreakdown => {
  // Category 1: Joint Health (30 points = 10% + 8% + 8% + 4%)
  const jointHasData = inputs.painLevel != null || inputs.tightnessLevel != null || 
                       inputs.sorenessLevel != null || inputs.recoveryScore != null;
  let jointHealthScore = 0;
  if (jointHasData) {
    const painNormalized = inputs.painLevel != null ? normalizePainLevel(inputs.painLevel) : 65;
    const tightnessNormalized = inputs.tightnessLevel != null ? normalizeTightnessLevel(inputs.tightnessLevel) : 65;
    const sorenessNormalized = inputs.sorenessLevel != null ? normalizeSorenessLevel(inputs.sorenessLevel) : 65;
    const recoveryNormalized = inputs.recoveryScore != null ? normalizeRecoveryScore(inputs.recoveryScore) : 65;
    
    jointHealthScore = Math.round(
      painNormalized * 0.10 + 
      tightnessNormalized * 0.08 + 
      sorenessNormalized * 0.08 + 
      recoveryNormalized * 0.04
    );
  }
  const jointHealthPercentage = jointHasData ? Math.round((jointHealthScore / 30) * 100) : 0;

  // Category 2: Training Execution (35 points = 14% + 11% + 10%)
  const trainingHasData = inputs.workoutAdherence != null || inputs.workoutLoad != null || 
                          inputs.sessionCompletionRate != null;
  let trainingExecutionScore = 0;
  if (trainingHasData) {
    const adherenceNormalized = inputs.workoutAdherence != null ? normalizeWorkoutAdherence(inputs.workoutAdherence) : 65;
    const loadNormalized = inputs.workoutLoad != null ? normalizeWorkoutLoad(inputs.workoutLoad) : 65;
    const completionNormalized = inputs.sessionCompletionRate != null ? normalizeSessionCompletion(inputs.sessionCompletionRate) : 65;
    
    trainingExecutionScore = Math.round(
      adherenceNormalized * 0.14 + 
      loadNormalized * 0.11 + 
      completionNormalized * 0.10
    );
  }
  const trainingExecutionPercentage = trainingHasData ? Math.round((trainingExecutionScore / 35) * 100) : 0;

  // Category 3: Physical Capacity (20 points = 8% + 7% + 5%)
  const capacityHasData = inputs.vo2Max != null || inputs.restingHeartRate != null || inputs.leanMassLb != null;
  let physicalCapacityScore = 0;
  if (capacityHasData) {
    const vo2Normalized = inputs.vo2Max != null ? normalizeVO2Max(inputs.vo2Max) : 65;
    const hrNormalized = inputs.restingHeartRate != null ? normalizeRestingHR(inputs.restingHeartRate) : 65;
    const leanMassNormalized = inputs.leanMassLb != null ? normalizeLeanMass(inputs.leanMassLb) : 65;
    
    physicalCapacityScore = Math.round(
      vo2Normalized * 0.08 + 
      hrNormalized * 0.07 + 
      leanMassNormalized * 0.05
    );
  }
  const physicalCapacityPercentage = capacityHasData ? Math.round((physicalCapacityScore / 20) * 100) : 0;

  // Category 4: Recovery Readiness (15 points = 7.5% + 4% + 3.5%)
  const readinessHasData = inputs.recoveryScore != null || inputs.sleepQuality != null || inputs.stressScore != null;
  let recoveryReadinessScore = 0;
  if (readinessHasData) {
    const recoveryNormalized = inputs.recoveryScore != null ? normalizeRecoveryScore(inputs.recoveryScore) : 65;
    const sleepNormalized = inputs.sleepQuality != null ? normalizeSleepQuality(inputs.sleepQuality) : 65;
    const stressNormalized = inputs.stressScore != null ? normalizeStressScore(inputs.stressScore) : 65;
    
    recoveryReadinessScore = Math.round(
      recoveryNormalized * 0.075 + 
      sleepNormalized * 0.04 + 
      stressNormalized * 0.035
    );
  }
  const recoveryReadinessPercentage = readinessHasData ? Math.round((recoveryReadinessScore / 15) * 100) : 0;

  // Only include categories with data in total calculation
  let total = 0;
  let maxTotal = 0;

  if (jointHasData) {
    total += jointHealthScore;
    maxTotal += 30;
  }

  if (trainingHasData) {
    total += trainingExecutionScore;
    maxTotal += 35;
  }

  if (capacityHasData) {
    total += physicalCapacityScore;
    maxTotal += 20;
  }

  if (readinessHasData) {
    total += recoveryReadinessScore;
    maxTotal += 15;
  }

  // Calculate percentage (handle division by zero)
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return {
    jointHealth: {
      score: jointHealthScore,
      max: 30,
      percentage: jointHealthPercentage,
      hasData: jointHasData,
    },
    trainingExecution: {
      score: trainingExecutionScore,
      max: 35,
      percentage: trainingExecutionPercentage,
      hasData: trainingHasData,
    },
    physicalCapacity: {
      score: physicalCapacityScore,
      max: 20,
      percentage: physicalCapacityPercentage,
      hasData: capacityHasData,
    },
    recoveryReadiness: {
      score: recoveryReadinessScore,
      max: 15,
      percentage: recoveryReadinessPercentage,
      hasData: readinessHasData,
    },
    total,
    maxTotal,
    percentage,
  };
};

/**
 * Determine performance status from score
 */
const evaluatePerformanceStatus = (score: number): PerformanceStatus => {
  if (score >= 80) return 'optimal';
  if (score >= 65) return 'good';
  if (score >= 50) return 'moderate';
  return 'limited';
};

/**
 * Build evidence signals
 */
const buildPerformanceEvidence = (
  inputs: PerformanceSourceInputs,
  performanceStatus: PerformanceStatus
): PerformanceEvidence => {
  const signals: PerformanceEvidenceSignal[] = [];

  // Joint Health signals
  if (inputs.painLevel != null) {
    signals.push({
      name: 'Pain Level',
      value: inputs.painLevel,
      interpretation: inputs.painLevel === 0 ? 'No pain reported - joints are healthy' :
                     inputs.painLevel <= 3 ? 'Mild pain - manageable with proper warm-up' :
                     inputs.painLevel <= 6 ? 'Moderate pain - consider exercise modifications' :
                     'Severe pain - joint-friendly alternatives required',
    });
  }

  if (inputs.tightnessLevel != null) {
    signals.push({
      name: 'Tightness Level',
      value: inputs.tightnessLevel,
      interpretation: inputs.tightnessLevel === 0 ? 'No tightness - full range of motion' :
                     inputs.tightnessLevel <= 3 ? 'Mild tightness - extra mobility work recommended' :
                     inputs.tightnessLevel <= 6 ? 'Moderate tightness - extended warm-up needed' :
                     'Severe tightness - focus on mobility before loading',
    });
  }

  // Training Execution signals
  if (inputs.workoutAdherence != null) {
    signals.push({
      name: 'Workout Adherence',
      value: inputs.workoutAdherence,
      interpretation: inputs.workoutAdherence >= 80 ? 'Excellent consistency - supports progressive overload' :
                     inputs.workoutAdherence >= 60 ? 'Moderate consistency - some room for improvement' :
                     'Low consistency - may need plan simplification',
    });
  }

  if (inputs.workoutLoad != null) {
    signals.push({
      name: 'Workout Load',
      value: inputs.workoutLoad,
      interpretation: inputs.workoutLoad >= 4 && inputs.workoutLoad <= 7 ? 'Optimal training load' :
                     inputs.workoutLoad < 4 ? 'Training load may be too light for adaptation' :
                     'Training load may be excessive - monitor recovery',
    });
  }

  // Physical Capacity signals
  if (inputs.vo2Max != null) {
    signals.push({
      name: 'VO2 Max',
      value: inputs.vo2Max,
      interpretation: inputs.vo2Max >= 50 ? 'Excellent cardiovascular fitness' :
                     inputs.vo2Max >= 40 ? 'Good cardiovascular fitness' :
                     inputs.vo2Max >= 30 ? 'Moderate cardiovascular fitness' :
                     'Low cardiovascular fitness - focus on aerobic work',
    });
  }

  if (inputs.leanMassLb != null) {
    signals.push({
      name: 'Lean Mass',
      value: inputs.leanMassLb,
      interpretation: `${inputs.leanMassLb.toFixed(1)} lbs - supports strength and metabolic health`,
    });
  }

  // Recovery Readiness signals
  if (inputs.recoveryScore != null) {
    signals.push({
      name: 'Recovery Score',
      value: inputs.recoveryScore,
      interpretation: inputs.recoveryScore >= 75 ? 'High recovery - ready for intense training' :
                     inputs.recoveryScore >= 50 ? 'Moderate recovery - maintain current load' :
                     'Low recovery - reduce training intensity',
    });
  }

  const summary = performanceStatus === 'optimal' 
    ? 'Performance capacity is optimal. All systems support high-intensity training.'
    : performanceStatus === 'good'
    ? 'Performance capacity is good. Minor limitations present but manageable.'
    : performanceStatus === 'moderate'
    ? 'Performance capacity is moderate. Some constraints on training intensity.'
    : 'Performance capacity is limited. Conservative training approach recommended.';

  return { signals, summary };
};

/**
 * Generate performance recommendation
 */
const generatePerformanceRecommendation = (
  performanceStatus: PerformanceStatus,
  inputs: PerformanceSourceInputs
): PerformanceRecommendation => {
  const actions: string[] = [];

  if (performanceStatus === 'optimal') {
    actions.push('Continue current training approach - all systems are optimal.');
    actions.push('Consider progressive overload to drive continued adaptation.');
    if (inputs.workoutAdherence && inputs.workoutAdherence >= 80) {
      actions.push('Excellent adherence - maintain this consistency.');
    }
  } else if (performanceStatus === 'good') {
    if (inputs.painLevel && inputs.painLevel > 3) {
      actions.push('Address joint discomfort with targeted mobility work.');
    }
    if (inputs.recoveryScore && inputs.recoveryScore < 65) {
      actions.push('Prioritize recovery to support training capacity.');
    }
    actions.push('Training can continue with minor modifications as needed.');
  } else if (performanceStatus === 'moderate') {
    if (inputs.workoutLoad && inputs.workoutLoad > 7) {
      actions.push('Reduce training load to allow for better recovery.');
    }
    if (inputs.painLevel && inputs.painLevel > 5) {
      actions.push('Use joint-friendly exercise variations.');
    }
    actions.push('Focus on quality over quantity in training sessions.');
  } else {
    actions.push('Implement conservative training approach.');
    if (inputs.recoveryScore && inputs.recoveryScore < 50) {
      actions.push('Prioritize recovery - consider deload week.');
    }
    if (inputs.painLevel && inputs.painLevel > 6) {
      actions.push('Avoid exercises that aggravate joint pain.');
    }
    actions.push('Focus on movement quality and technique refinement.');
  }

  const summary = performanceStatus === 'optimal'
    ? 'Performance is optimal - continue current approach'
    : performanceStatus === 'good'
    ? 'Performance is good with minor limitations'
    : performanceStatus === 'moderate'
    ? 'Performance is moderate - some training modifications needed'
    : 'Performance is limited - conservative approach required';

  return { summary, actions };
};

/**
 * Build detailed input metadata for InputDetailsPanel
 */
const buildPerformanceInputMetadata = (
  inputs: PerformanceSourceInputs,
  contextData: any
): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // Joint Health Category
  metadata.push({
    name: 'Pain Level',
    value: inputs.painLevel,
    unit: 'scale (0-10)',
    source: inputs.painLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.painLevel !== undefined ? { table: 'daily_logs', field: 'painLevel' } : undefined,
    lastUpdated: inputs.painLevel !== undefined ? now : undefined,
    category: 'Joint Health',
    score: inputs.painLevel !== undefined ? normalizePainLevel(inputs.painLevel) : undefined,
  });

  metadata.push({
    name: 'Tightness Level',
    value: inputs.tightnessLevel,
    unit: 'scale (0-10)',
    source: inputs.tightnessLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.tightnessLevel !== undefined ? { table: 'daily_logs', field: 'tightnessLevel' } : undefined,
    lastUpdated: inputs.tightnessLevel !== undefined ? now : undefined,
    category: 'Joint Health',
    score: inputs.tightnessLevel !== undefined ? normalizeTightnessLevel(inputs.tightnessLevel) : undefined,
  });

  metadata.push({
    name: 'Soreness Level',
    value: inputs.sorenessLevel,
    unit: 'scale (0-10)',
    source: inputs.sorenessLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sorenessLevel !== undefined ? { table: 'daily_logs', field: 'sorenessLevel' } : undefined,
    lastUpdated: inputs.sorenessLevel !== undefined ? now : undefined,
    category: 'Joint Health',
    score: inputs.sorenessLevel !== undefined ? normalizeSorenessLevel(inputs.sorenessLevel) : undefined,
  });

  // Training Execution Category
  metadata.push({
    name: 'Workout Adherence',
    value: inputs.workoutAdherence,
    unit: 'percentage',
    source: inputs.workoutAdherence !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.workoutAdherence !== undefined ? { derivedFrom: ['adherence_engine'] } : undefined,
    lastUpdated: inputs.workoutAdherence !== undefined ? now : undefined,
    category: 'Training',
    score: inputs.workoutAdherence !== undefined ? normalizeWorkoutAdherence(inputs.workoutAdherence) : undefined,
  });

  metadata.push({
    name: 'Workout Load',
    value: inputs.workoutLoad,
    unit: 'scale (1-10)',
    source: inputs.workoutLoad !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.workoutLoad !== undefined ? { table: 'daily_logs', field: 'workoutLoad' } : undefined,
    lastUpdated: inputs.workoutLoad !== undefined ? now : undefined,
    category: 'Training',
    score: inputs.workoutLoad !== undefined ? normalizeWorkoutLoad(inputs.workoutLoad) : undefined,
  });

  metadata.push({
    name: 'Session Completion Rate',
    value: inputs.sessionCompletionRate,
    unit: 'percentage',
    source: inputs.sessionCompletionRate !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sessionCompletionRate !== undefined ? { derivedFrom: ['workout_sessions'] } : undefined,
    lastUpdated: inputs.sessionCompletionRate !== undefined ? now : undefined,
    category: 'Training',
    score: inputs.sessionCompletionRate !== undefined ? normalizeSessionCompletion(inputs.sessionCompletionRate) : undefined,
  });

  // Physical Capacity Category
  metadata.push({
    name: 'VO2 Max',
    value: inputs.vo2Max,
    unit: 'ml/kg/min',
    source: inputs.vo2Max !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.vo2Max !== undefined ? { derivedFrom: ['device_data', 'estimated'] } : undefined,
    lastUpdated: inputs.vo2Max !== undefined ? now : undefined,
    category: 'Vitals',
    score: inputs.vo2Max !== undefined ? normalizeVO2Max(inputs.vo2Max) : undefined,
  });

  metadata.push({
    name: 'Resting Heart Rate',
    value: inputs.restingHeartRate,
    unit: 'bpm',
    source: inputs.restingHeartRate !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.restingHeartRate !== undefined ? { table: 'device_data', field: 'restingHeartRate' } : undefined,
    lastUpdated: inputs.restingHeartRate !== undefined ? now : undefined,
    category: 'Vitals',
    score: inputs.restingHeartRate !== undefined ? normalizeRestingHR(inputs.restingHeartRate) : undefined,
  });

  metadata.push({
    name: 'Lean Mass',
    value: inputs.leanMassLb,
    unit: 'lbs',
    source: inputs.leanMassLb !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.leanMassLb !== undefined ? { table: 'body_composition_scans', field: 'dryLeanMassLb' } : undefined,
    lastUpdated: inputs.leanMassLb !== undefined ? now : undefined,
    category: 'Body Composition',
    score: inputs.leanMassLb !== undefined ? normalizeLeanMass(inputs.leanMassLb) : undefined,
  });

  // Recovery Readiness Category
  metadata.push({
    name: 'Recovery Score',
    value: inputs.recoveryScore,
    unit: 'score (0-100)',
    source: inputs.recoveryScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.recoveryScore !== undefined ? { derivedFrom: ['recovery_engine'] } : undefined,
    lastUpdated: inputs.recoveryScore !== undefined ? now : undefined,
    category: 'Wellness',
    score: inputs.recoveryScore !== undefined ? normalizeRecoveryScore(inputs.recoveryScore) : undefined,
  });

  metadata.push({
    name: 'Sleep Quality',
    value: inputs.sleepQuality,
    unit: 'scale (1-5)',
    source: inputs.sleepQuality !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sleepQuality !== undefined ? { table: 'daily_logs', field: 'sleepQuality' } : undefined,
    lastUpdated: inputs.sleepQuality !== undefined ? now : undefined,
    category: 'Sleep',
    score: inputs.sleepQuality !== undefined ? normalizeSleepQuality(inputs.sleepQuality) : undefined,
  });

  metadata.push({
    name: 'Stress Score',
    value: inputs.stressScore,
    unit: 'score (0-100)',
    source: inputs.stressScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.stressScore !== undefined ? { derivedFrom: ['stress_engine'] } : undefined,
    lastUpdated: inputs.stressScore !== undefined ? now : undefined,
    category: 'Wellness',
    score: inputs.stressScore !== undefined ? normalizeStressScore(inputs.stressScore) : undefined,
  });

  return metadata;
};

/**
 * Merge inputs from various sources
 */
const mergePerformanceInputs = async (userId: string): Promise<PerformanceSourceInputs> => {
  const inputs: PerformanceSourceInputs = {};

  try {
    // Get joint health data
    const jointHealth = await getJointHealthToday(userId).catch(() => null);
    if (jointHealth) {
      inputs.painLevel = jointHealth.sourceInputs.painLevel;
      inputs.tightnessLevel = jointHealth.sourceInputs.tightnessLevel;
      inputs.sorenessLevel = jointHealth.sourceInputs.sorenessLevel;
      inputs.affectedArea = jointHealth.sourceInputs.affectedArea;
      inputs.jointHealthStatus = jointHealth.jointHealthStatus;
    }

    // Get adherence data
    const adherence = await getAdherenceToday(userId).catch(() => null);
    if (adherence) {
      inputs.workoutAdherence = adherence.breakdown?.workout;
      inputs.sessionCompletionRate = adherence.adherenceScore; // Use overall as proxy
    }

    // Get recovery data
    const recovery = await getRecoveryToday(userId).catch(() => null);
    if (recovery) {
      inputs.recoveryScore = recovery.recoveryScore;
      inputs.sleepQuality = recovery.sourceInputs.sleepQuality;
      inputs.stressScore = recovery.sourceInputs.stressLevel ? recovery.sourceInputs.stressLevel * 10 : undefined;
    }

    // Get body composition data
    const bodyComp = await getLatestBodyCompositionContext(userId).catch(() => null);
    if (bodyComp?.hasBodyComposition) {
      inputs.leanMassLb = bodyComp.dryLeanMassLb ?? undefined;
      inputs.skeletalMuscleMassLb = bodyComp.skeletalMuscleMassLb ?? undefined;
      inputs.bodyFatPercentage = bodyComp.bodyFatPercentage ?? undefined;
    }

    // Get device data for VO2 max and resting HR
    const deviceContext = await getDeviceContext(userId).catch(() => null);
    if (deviceContext) {
      inputs.vo2Max = deviceContext.vo2Max ?? undefined;
      inputs.restingHeartRate = deviceContext.restingHeartRate ?? undefined;
    }

    // Get daily log data for workout load
    const dailyLogs = await getDailyLogsForUser(userId, 1).catch(() => []);
    if (dailyLogs.length > 0) {
      const latestLog = dailyLogs[0];
      inputs.workoutLoad = latestLog.workoutLoad ?? undefined;
    }

  } catch (error) {
    logger.error('Error merging performance inputs', { error: (error as Error).message, userId });
  }

  return inputs;
};

/**
 * Get performance data for today
 */
export const getPerformanceToday = async (
  userId: string,
  options?: { regenerate?: boolean }
): Promise<PerformanceRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = performanceStore.get(userId)?.find((record) => record.date === date);
  
  if (existing && !options?.regenerate) {
    return existing;
  }

  logger.info('✅ [PERFORMANCE ENGINE] Generating performance assessment', { userId });

  // Merge inputs from all sources
  const sourceInputs = await mergePerformanceInputs(userId);
  
  // Calculate score breakdown
  const scoreBreakdown = calculatePerformanceScoreBreakdown(sourceInputs);
  const performanceScore = scoreBreakdown.total;
  
  // Determine status
  const performanceStatus = evaluatePerformanceStatus(performanceScore);
  
  // Build evidence
  const evidence = buildPerformanceEvidence(sourceInputs, performanceStatus);
  
  // Generate recommendation
  const recommendation = generatePerformanceRecommendation(performanceStatus, sourceInputs);

  // Build detailed inputs if feature flag enabled
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS) {
    const contextData = {
      deviceContext: await getDeviceContext(userId).catch(() => null),
      dailyLog: (await getDailyLogsForUser(userId, 1))[0] || null,
      engineSnapshot: await getEngineSnapshot(userId).catch(() => null),
    };
    detailedInputs = buildPerformanceInputMetadata(sourceInputs, contextData);
    
    logger.info('✅ [PERFORMANCE ENGINE] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  const record: PerformanceRecord = {
    id: randomUUID(),
    userId,
    date,
    performanceScore,
    performanceStatus,
    sourceInputs,
    recommendation,
    evidence,
    createdAt: new Date().toISOString(),
    detailedInputs,
    scoreBreakdown,
  };

  // Store in cache
  const userRecords = performanceStore.get(userId) || [];
  performanceStore.set(userId, [...userRecords.filter(r => r.date !== date), record]);

  logger.info('✅ [PERFORMANCE ENGINE] Performance assessment complete', {
    userId,
    performanceScore,
    performanceStatus,
    breakdown: scoreBreakdown,
  });

  return record;
};

/**
 * Clear performance cache
 */
export function clearPerformanceCache(): void {
  performanceStore.clear();
  logger.info('🗑️ [PERFORMANCE ENGINE] All cache cleared');
}

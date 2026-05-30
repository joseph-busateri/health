/**
 * DailyHealthSnapshotService
 * 
 * Architecture:
 * - Aggregates outputs from all individual engines
 * - Calculates cross-engine derived intelligence
 * - Provides caching with TTL
 * - Does NOT own recommendation generation (that's RecommendationEngine's job)
 * - Does NOT contain domain-specific business logic (that's in individual engines)
 * 
 * Responsibilities:
 * 1. Call all engines in parallel to gather data
 * 2. Transform engine outputs into DailyHealthSnapshot structure
 * 3. Calculate cross-engine derived intelligence (fatigue risk, overtraining risk, etc.)
 * 4. Track data quality and freshness
 * 5. Cache results with 15-minute TTL
 */

import { logger } from '../utils/logger';
import type {
  DailyHealthSnapshot,
  RecoverySnapshot,
  StressSnapshot,
  WorkoutSnapshot,
  BodyCompositionSnapshot,
  SexualHealthSnapshot,
  MetabolicSnapshot,
  CardiovascularSnapshot,
  AdherenceSnapshot,
  JointHealthSnapshot,
  NutritionSnapshot,
  PredictionSnapshot,
  DerivedIntelligence,
  DataQuality,
  SnapshotEngineInput,
  DerivedIntelligenceConfig,
  CachedSnapshot,
  HealthStatus,
  TrendDirection,
  RiskLevel,
} from '../types/dailyHealthSnapshot';

// Import existing engines
import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { getWorkoutToday } from './workoutTodayService';
import { generateSupplementRecommendations } from './supplementEngineService';

// Import new Phase 2 engines
import { getNutritionToday } from './nutritionEngineService';
import { getCardiovascularToday } from './cardiovascularEngineService';
import { getMetabolicToday } from './metabolicEngineService';
import { getSexualHealthToday } from './sexualHealthEngineService';

// Import engine types
import type { RecoveryRecord } from '../types/recoveryEngine';
import type { StressRecord } from '../types/stressEngine';
import type { JointHealthRecord } from '../types/jointHealthEngine';
import type { AdherenceRecord } from '../types/adherenceEngine';
import type { WorkoutTodayRecord } from '../types/workoutToday';
import type { NutritionRecord } from '../types/nutritionEngine';
import type { CardiovascularRecord } from '../types/cardiovascularEngine';
import type { MetabolicRecord } from '../types/metabolicEngine';
import type { SexualHealthRecord } from '../types/sexualHealthEngine';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: DerivedIntelligenceConfig = {
  weights: {
    cardiovascular: 0.25,
    recovery: 0.25,
    metabolic: 0.20,
    performance: 0.20,
    sexualHealth: 0.10,
  },
  riskThresholds: {
    fatigue: { low: 70, moderate: 50, high: 30 },
    overtraining: { low: 70, moderate: 50, high: 30 },
    injury: { low: 70, moderate: 50, high: 30 },
  },
  statusThresholds: {
    optimal: 80,
    stable: 60,
    moderate: 40,
    atRisk: 0,
  },
};

const CACHE_TTL_MINUTES = 15;

// ============================================================================
// TYPE ADAPTERS
// ============================================================================

/**
 * Adapter functions to transform engine outputs into snapshot sections
 * These adapters handle the impedance mismatch between engine types and snapshot types
 */

/**
 * Adapt RecoveryRecord to RecoverySnapshot
 */
function adaptRecoveryRecordToSnapshot(record: RecoveryRecord): RecoverySnapshot {
  return {
    score: record.recoveryScore,
    status: mapRecoveryStatusToHealthStatus(record.recoveryStatus),
    trend: 'stable', // TODO: Calculate from historical data
    hrv: record.sourceInputs.hrv,
    sleepHours: record.sourceInputs.sleepDurationHours,
    sleepQuality: record.sourceInputs.sleepQuality,
    restingHr: record.sourceInputs.restingHr,
    verbalRecoveryFeeling: record.sourceInputs.verbalRecoveryFeeling,
    lastUpdated: record.createdAt, // Note: using createdAt, not timestamp
    dataSource: 'interview',
    confidence: 'medium',
  };
}

/**
 * Adapt StressRecord to StressSnapshot
 */
function adaptStressRecordToSnapshot(record: StressRecord): StressSnapshot {
  return {
    score: record.stressScore,
    status: mapStressStatusToHealthStatus(record.stressStatus),
    trend: 'stable', // TODO: Calculate from historical data
    cnsLoad: record.cnsLoadStatus as 'low' | 'moderate' | 'high', // Types are compatible
    interviewStressLevel: record.sourceInputs.interviewStressLevel,
    hrvStressIndicator: record.sourceInputs.hrv,
    sleepDisruption: (record.sourceInputs.sleepDurationHours ?? 7) < 6,
    lastUpdated: record.createdAt, // Note: using createdAt, not timestamp
    dataSource: 'interview',
    confidence: 'medium',
  };
}

/**
 * Adapt JointHealthRecord to JointHealthSnapshot
 */
function adaptJointHealthRecordToSnapshot(record: JointHealthRecord): JointHealthSnapshot {
  return {
    status: record.jointHealthStatus, // Types match exactly
    riskLevel: record.riskLevel as RiskLevel, // Types are compatible
    affectedAreas: [record.affectedArea], // Wrap single area in array
    painLevel: record.inputs.painLevel,
    tightness: record.inputs.tightnessLevel,
    soreness: record.inputs.sorenessLevel,
    workoutModifications: record.recommendation.modifications, // Extract modifications array from object
    lastUpdated: record.createdAt, // Note: using createdAt, not timestamp
    dataSource: 'interview',
    confidence: 'medium',
  };
}

/**
 * Adapt AdherenceRecord to AdherenceSnapshot
 */
function adaptAdherenceRecordToSnapshot(record: AdherenceRecord): AdherenceSnapshot {
  return {
    overallScore: record.adherenceScore,
    status: mapAdherenceStatusToHealthStatus(record.status), // Note: using status, not adherenceStatus
    trend: record.trend, // Types match exactly
    breakdown: record.breakdown, // Structure matches exactly
    lastUpdated: record.createdAt, // Note: using createdAt, not timestamp
    dataSource: 'interview',
    confidence: 'medium',
  };
}

/**
 * Adapt WorkoutTodayRecord to WorkoutSnapshot
 */
function adaptWorkoutTodayRecordToSnapshot(record: WorkoutTodayRecord): WorkoutSnapshot {
  // Derive readiness score from status (WorkoutTodayRecord doesn't have numeric score)
  const readinessScoreMap: Record<string, number> = {
    ready: 85,
    moderate: 65,
    low: 40,
  };
  const readinessScore = readinessScoreMap[record.readinessStatus] ?? 70;

  // Map readiness status (ready → high, moderate → moderate, low → low)
  const readinessStatusMap: Record<string, 'low' | 'moderate' | 'high'> = {
    ready: 'high',
    moderate: 'moderate',
    low: 'low',
  };
  const readinessStatus = readinessStatusMap[record.readinessStatus] ?? 'moderate';

  return {
    readinessScore,
    readinessStatus,
    todayWorkoutPlan: {
      day: record.adjustedWorkout.day, // Note: using adjustedWorkout, not workout
      focus: record.adjustedWorkout.dayPlan ?? 'General',
      exercises: record.adjustedWorkout.exercises.length,
      adjustments: record.adjustments.map(a => a.description),
    },
    workoutLoad: undefined, // Not available in WorkoutTodayRecord
    targetedFocus: undefined, // Not available in WorkoutTodayRecord
    lastUpdated: record.createdAt, // Note: using createdAt, not generatedAt
    dataSource: 'derived',
    confidence: 'high',
  };
}

/**
 * Adapt NutritionRecord to NutritionSnapshot
 */
function adaptNutritionRecordToSnapshot(record: NutritionRecord): NutritionSnapshot {
  return {
    calorieTarget: record.calorieTargets.currentGoal,
    macroTargets: {
      protein: record.macroTargets.protein,
      carbs: record.macroTargets.carbs,
      fat: record.macroTargets.fats,
    },
    hydrationTarget: undefined, // TODO: Calculate from user weight
    actualIntake: undefined, // TODO: Get from food tracking
    adherenceScore: record.proteinAdequacy, // Use protein adequacy as proxy for now
    lastUpdated: record.createdAt,
    dataSource: 'derived',
    confidence: 'medium',
  };
}

/**
 * Adapt CardiovascularRecord to CardiovascularSnapshot
 */
function adaptCardiovascularRecordToSnapshot(record: CardiovascularRecord): CardiovascularSnapshot {
  // Map BP risk to status
  const bpStatusMap: Record<string, 'optimal' | 'elevated' | 'hypertensive'> = {
    optimal: 'optimal',
    normal: 'optimal',
    elevated: 'elevated',
    stage1: 'hypertensive',
    stage2: 'hypertensive',
  };

  return {
    riskScore: record.cardiovascularRiskScore,
    riskLevel: record.cardiovascularRiskLevel as RiskLevel,
    trend: 'stable', // TODO: Calculate from historical data
    lipids: record.lipidPanel ? {
      ldl: record.lipidPanel.ldl,
      hdl: record.lipidPanel.hdl,
      triglycerides: record.lipidPanel.triglycerides,
      totalCholesterol: record.lipidPanel.totalCholesterol,
    } : undefined,
    bloodPressure: record.bpAnalysis.systolic && record.bpAnalysis.diastolic ? {
      systolic: record.bpAnalysis.systolic,
      diastolic: record.bpAnalysis.diastolic,
      status: bpStatusMap[record.bpAnalysis.bpRisk] ?? 'optimal',
    } : undefined,
    restingHr: record.restingHRAnalysis.restingHR,
    hrv: record.hrvCardiovascularSignal,
    cardiovascularRisk: record.cardiovascularRiskLevel as RiskLevel,
    lastUpdated: record.createdAt,
    dataSource: record.lipidPanel ? 'bloodwork' : 'device',
    confidence: record.lipidPanel ? 'high' : 'medium',
  };
}

/**
 * Adapt MetabolicRecord to MetabolicSnapshot
 */
function adaptMetabolicRecordToSnapshot(record: MetabolicRecord): MetabolicSnapshot {
  // Map glucose status
  const glucoseStatusMap: Record<string, 'optimal' | 'prediabetic' | 'diabetic'> = {
    optimal: 'optimal',
    normal: 'optimal',
    prediabetic: 'prediabetic',
    diabetic: 'diabetic',
  };

  // Map insulin sensitivity to score (0-100)
  const insulinSensitivityScore: Record<string, number> = {
    high: 90,
    normal: 70,
    reduced: 40,
    resistant: 20,
  };

  return {
    score: record.metabolicScore,
    status: mapMetabolicStatusToHealthStatus(record.metabolicStatus),
    trend: 'stable', // TODO: Calculate from historical data
    glucose: {
      fasting: record.glucoseMetrics.fastingGlucose,
      status: glucoseStatusMap[record.glucoseMetrics.glucoseStatus] ?? 'optimal',
    },
    a1c: record.glucoseMetrics.a1c ? {
      value: record.glucoseMetrics.a1c,
      status: glucoseStatusMap[record.glucoseMetrics.glucoseStatus] ?? 'optimal',
      trend: 'stable', // TODO: Calculate from historical data
    } : undefined,
    insulin: record.inputs.fastingInsulin,
    insulinSensitivity: insulinSensitivityScore[record.insulinMetrics.insulinSensitivity] ?? 70,
    metabolicRisk: record.metabolicRisk as RiskLevel,
    lastUpdated: record.createdAt,
    dataSource: record.glucoseMetrics.fastingGlucose || record.glucoseMetrics.a1c ? 'bloodwork' : 'derived',
    confidence: record.glucoseMetrics.fastingGlucose || record.glucoseMetrics.a1c ? 'high' : 'low',
  };
}

/**
 * Adapt SexualHealthRecord to SexualHealthSnapshot
 */
function adaptSexualHealthRecordToSnapshot(record: SexualHealthRecord): SexualHealthSnapshot {
  // Map testosterone status
  const testosteroneStatusMap: Record<string, 'optimal' | 'suboptimal' | 'low'> = {
    optimal: 'optimal',
    normal: 'optimal',
    low: 'suboptimal',
    very_low: 'low',
  };

  return {
    score: record.sexualHealthScore,
    status: mapSexualHealthStatusToHealthStatus(record.sexualHealthStatus),
    trend: 'stable', // TODO: Calculate from historical data
    testosterone: {
      total: record.testosteroneMetrics.totalTestosterone,
      free: record.testosteroneMetrics.freeTestosterone,
      status: testosteroneStatusMap[record.testosteroneMetrics.testosteroneStatus] ?? 'optimal',
    },
    libidoLevel: record.libidoMetrics.libidoScore / 10, // Convert 0-100 to 1-10
    erectileFunctionScore: record.erectileMetrics.erectileScore / 10, // Convert 0-100 to 1-10
    morningErections: record.inputs.morningErectionsFrequency,
    lastUpdated: record.createdAt,
    dataSource: record.testosteroneMetrics.totalTestosterone ? 'bloodwork' : 'interview',
    confidence: record.testosteroneMetrics.totalTestosterone ? 'high' : 'medium',
  };
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

const snapshotCache = new Map<string, CachedSnapshot>();

function getCacheKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

function isCacheValid(cached: CachedSnapshot): boolean {
  const now = new Date();
  const expiresAt = new Date(cached.metadata.expiresAt);
  return now < expiresAt;
}

// ============================================================================
// ENGINE AGGREGATION
// ============================================================================

/**
 * Aggregate data from existing engines
 */
async function aggregateEngineData(userId: string): Promise<SnapshotEngineInput> {
  logger.info('Aggregating engine data', { userId });

  // Call all engines in parallel (existing + new Phase 2 engines)
  const [
    recoveryResult,
    stressResult,
    jointHealthResult,
    adherenceResult,
    workoutResult,
    nutritionResult,
    cardiovascularResult,
    metabolicResult,
    sexualHealthResult,
  ] = await Promise.allSettled([
    getRecoveryToday(userId),
    getStressToday(userId),
    getJointHealthToday(userId),
    getAdherenceToday(userId),
    getWorkoutToday(userId),
    getNutritionToday(userId),
    getCardiovascularToday(userId),
    getMetabolicToday(userId),
    getSexualHealthToday(userId),
  ]);

  const engineInput: SnapshotEngineInput = {};

  // Transform Recovery Engine output using adapter
  if (recoveryResult.status === 'fulfilled' && recoveryResult.value) {
    engineInput.recovery = adaptRecoveryRecordToSnapshot(recoveryResult.value);
  }

  // Transform Stress Engine output using adapter
  if (stressResult.status === 'fulfilled' && stressResult.value) {
    engineInput.stress = adaptStressRecordToSnapshot(stressResult.value);
  }

  // Transform Joint Health Engine output using adapter
  if (jointHealthResult.status === 'fulfilled' && jointHealthResult.value) {
    engineInput.jointHealth = adaptJointHealthRecordToSnapshot(jointHealthResult.value);
  }

  // Transform Adherence Engine output using adapter
  if (adherenceResult.status === 'fulfilled' && adherenceResult.value) {
    engineInput.adherence = adaptAdherenceRecordToSnapshot(adherenceResult.value);
  }

  // Transform Workout Today output using adapter
  if (workoutResult.status === 'fulfilled' && workoutResult.value) {
    engineInput.workout = adaptWorkoutTodayRecordToSnapshot(workoutResult.value);
  }

  // Transform Nutrition Engine output using adapter
  if (nutritionResult.status === 'fulfilled' && nutritionResult.value) {
    engineInput.nutrition = adaptNutritionRecordToSnapshot(nutritionResult.value);
  }

  // Transform Cardiovascular Engine output using adapter
  if (cardiovascularResult.status === 'fulfilled' && cardiovascularResult.value) {
    engineInput.cardiovascular = adaptCardiovascularRecordToSnapshot(cardiovascularResult.value);
  }

  // Transform Metabolic Engine output using adapter
  if (metabolicResult.status === 'fulfilled' && metabolicResult.value) {
    engineInput.metabolic = adaptMetabolicRecordToSnapshot(metabolicResult.value);
  }

  // Transform Sexual Health Engine output using adapter
  if (sexualHealthResult.status === 'fulfilled' && sexualHealthResult.value) {
    engineInput.sexualHealth = adaptSexualHealthRecordToSnapshot(sexualHealthResult.value);
  }

  // Placeholder for Body Composition (future: from body comp upload)
  engineInput.bodyComposition = {
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    confidence: 'low',
  };

  return engineInput;
}

// ============================================================================
// STATUS MAPPING HELPERS
// ============================================================================

function mapRecoveryStatusToHealthStatus(status: string): HealthStatus {
  switch (status) {
    case 'fully_recovered':
      return 'optimal';
    case 'moderate_recovery':
      return 'stable';
    case 'poor_recovery':
      return 'at_risk';
    default:
      return 'moderate';
  }
}

function mapStressStatusToHealthStatus(status: string): HealthStatus {
  switch (status) {
    case 'low':
      return 'optimal';
    case 'moderate':
      return 'stable';
    case 'high':
      return 'at_risk';
    default:
      return 'moderate';
  }
}

function mapAdherenceStatusToHealthStatus(status: string): HealthStatus {
  switch (status) {
    case 'high':
      return 'optimal';
    case 'moderate':
      return 'stable';
    case 'low':
      return 'at_risk';
    default:
      return 'moderate';
  }
}

function mapMetabolicStatusToHealthStatus(status: string): HealthStatus {
  switch (status) {
    case 'optimal':
      return 'optimal';
    case 'healthy':
      return 'stable';
    case 'at_risk':
      return 'at_risk';
    case 'impaired':
      return 'critical';
    default:
      return 'moderate';
  }
}

function mapSexualHealthStatusToHealthStatus(status: string): HealthStatus {
  switch (status) {
    case 'optimal':
      return 'optimal';
    case 'healthy':
      return 'stable';
    case 'suboptimal':
      return 'moderate';
    case 'concerning':
      return 'at_risk';
    default:
      return 'moderate';
  }
}

// ============================================================================
// DERIVED INTELLIGENCE CALCULATION
// ============================================================================

/**
 * Calculate cross-engine derived intelligence
 * This is the ONLY place where cross-engine business logic should live
 */
function calculateDerivedIntelligence(
  input: SnapshotEngineInput,
  config: DerivedIntelligenceConfig = DEFAULT_CONFIG
): DerivedIntelligence {
  // Calculate overall score (weighted average of available components)
  const componentScores: Array<{ score: number | null; weight: number }> = [
    { score: input.cardiovascular?.riskScore ?? null, weight: config.weights.cardiovascular },
    { score: input.recovery?.score ?? null, weight: config.weights.recovery },
    { score: input.metabolic?.score ?? null, weight: config.weights.metabolic },
    { score: input.workout?.readinessScore ?? null, weight: config.weights.performance },
    { score: input.sexualHealth?.score ?? null, weight: config.weights.sexualHealth },
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  componentScores.forEach(({ score, weight }) => {
    if (score !== null && !isNaN(score)) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  });

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

  // Calculate overall status
  const overallStatus = scoreToStatus(overallScore, config.statusThresholds);

  // Calculate overall trend (simplified - would use historical data)
  const overallTrend: TrendDirection = 'stable';

  // Calculate fatigue risk (low recovery + high stress + high workout load)
  const fatigueRisk = calculateFatigueRisk(input, config);

  // Calculate overtraining risk (declining HRV + declining performance + persistent soreness)
  const overtrainingRisk = calculateOvertrainingRisk(input, config);

  // Calculate injury risk (high joint pain + low recovery + high workout load)
  const injuryRisk = calculateInjuryRisk(input, config);

  // Calculate readiness score (composite of recovery + stress + joint health)
  const readinessScore = calculateReadinessScore(input);

  // Calculate performance capacity
  const performanceCapacity = calculatePerformanceCapacity(input);

  return {
    overallScore,
    overallStatus,
    overallTrend,
    fatigueRisk,
    overtrainingRisk,
    injuryRisk,
    metabolicRisk: input.metabolic?.metabolicRisk ?? 'moderate',
    cardiovascularRisk: input.cardiovascular?.cardiovascularRisk ?? 'moderate',
    readinessScore,
    performanceCapacity,
    sleepTrend: 'stable', // TODO: Calculate from 7-day moving average
    performanceTrend: 'stable', // TODO: Calculate from 7-day moving average
    recoveryTrend: 'stable', // TODO: Calculate from 7-day moving average
    calculatedAt: new Date().toISOString(),
  };
}

function scoreToStatus(score: number | null, thresholds: DerivedIntelligenceConfig['statusThresholds']): HealthStatus {
  if (score === null) return 'moderate';
  if (score >= thresholds.optimal) return 'optimal';
  if (score >= thresholds.stable) return 'stable';
  if (score >= thresholds.moderate) return 'moderate';
  return 'at_risk';
}

function calculateFatigueRisk(input: SnapshotEngineInput, config: DerivedIntelligenceConfig): RiskLevel {
  const recoveryScore = input.recovery?.score ?? 70;
  const stressScore = input.stress?.score ?? 70;
  const workoutLoad = input.workout?.workoutLoad ?? 50;

  // Fatigue risk increases when:
  // - Recovery is low (score < 60)
  // - Stress is high (score < 60, since higher score = less stress)
  // - Workout load is high (> 70)

  const fatigueIndicator = (recoveryScore + stressScore) / 2 - (workoutLoad > 70 ? 20 : 0);

  if (fatigueIndicator >= config.riskThresholds.fatigue.low) return 'low';
  if (fatigueIndicator >= config.riskThresholds.fatigue.moderate) return 'moderate';
  return 'high';
}

function calculateOvertrainingRisk(input: SnapshotEngineInput, config: DerivedIntelligenceConfig): RiskLevel {
  const recoveryScore = input.recovery?.score ?? 70;
  const jointStatus = input.jointHealth?.status ?? 'stable';
  const adherenceScore = input.adherence?.overallScore ?? 70;

  // Overtraining risk increases when:
  // - Recovery is persistently low
  // - Joint health is aggravated
  // - High adherence but declining performance (not yet tracked)

  let riskIndicator = recoveryScore;

  if (jointStatus === 'aggravated') riskIndicator -= 20;
  if (jointStatus === 'caution') riskIndicator -= 10;

  if (riskIndicator >= config.riskThresholds.overtraining.low) return 'low';
  if (riskIndicator >= config.riskThresholds.overtraining.moderate) return 'moderate';
  return 'high';
}

function calculateInjuryRisk(input: SnapshotEngineInput, config: DerivedIntelligenceConfig): RiskLevel {
  const jointRiskLevel = input.jointHealth?.riskLevel ?? 'low';
  const recoveryScore = input.recovery?.score ?? 70;
  const workoutLoad = input.workout?.workoutLoad ?? 50;

  // Injury risk increases when:
  // - Joint health risk is high
  // - Recovery is low
  // - Workout load is high

  if (jointRiskLevel === 'high' || jointRiskLevel === 'critical') return 'high';
  if (jointRiskLevel === 'moderate' && recoveryScore < 60) return 'moderate';
  if (workoutLoad > 80 && recoveryScore < 50) return 'high';

  return 'low';
}

function calculateReadinessScore(input: SnapshotEngineInput): number | null {
  const recoveryScore = input.recovery?.score ?? null;
  const stressScore = input.stress?.score ?? null;
  const jointHealthScore = mapJointStatusToScore(input.jointHealth?.status ?? 'stable');

  if (recoveryScore === null && stressScore === null) return null;

  const scores = [recoveryScore, stressScore, jointHealthScore].filter(s => s !== null) as number[];
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return Math.round(average);
}

function calculatePerformanceCapacity(input: SnapshotEngineInput): number | null {
  const readinessScore = calculateReadinessScore(input);
  const adherenceScore = input.adherence?.overallScore ?? null;

  if (readinessScore === null) return null;

  // Performance capacity is readiness adjusted by adherence
  const capacity = adherenceScore !== null
    ? Math.round(readinessScore * 0.7 + adherenceScore * 0.3)
    : readinessScore;

  return capacity;
}

function mapJointStatusToScore(status: string): number {
  switch (status) {
    case 'stable':
      return 85;
    case 'caution':
      return 65;
    case 'aggravated':
      return 40;
    default:
      return 70;
  }
}

// ============================================================================
// DATA QUALITY TRACKING
// ============================================================================

function calculateDataQuality(input: SnapshotEngineInput): DataQuality {
  const now = new Date();

  // Check data availability
  const recoveryDataAvailable = input.recovery !== undefined && input.recovery.score !== null;
  const stressDataAvailable = input.stress !== undefined && input.stress.score !== null;
  const workoutDataAvailable = input.workout !== undefined;
  const bodyCompDataAvailable = input.bodyComposition !== undefined && input.bodyComposition.weight !== undefined;
  const bloodworkDataAvailable = false; // TODO: Check bloodwork data
  const sexualHealthDataAvailable = input.sexualHealth !== undefined && input.sexualHealth.score !== null;
  const metabolicDataAvailable = input.metabolic !== undefined && input.metabolic.score !== null;
  const cardiovascularDataAvailable = input.cardiovascular !== undefined && input.cardiovascular.riskScore !== null;
  const adherenceDataAvailable = input.adherence !== undefined && input.adherence.overallScore !== null;
  const jointHealthDataAvailable = input.jointHealth !== undefined;

  // Calculate completeness score
  const availableCount = [
    recoveryDataAvailable,
    stressDataAvailable,
    workoutDataAvailable,
    bodyCompDataAvailable,
    bloodworkDataAvailable,
    sexualHealthDataAvailable,
    metabolicDataAvailable,
    cardiovascularDataAvailable,
    adherenceDataAvailable,
    jointHealthDataAvailable,
  ].filter(Boolean).length;

  const dataCompletenessScore = Math.round((availableCount / 10) * 100);

  // Determine data availability state
  let dataAvailabilityState: 'complete' | 'partial' | 'minimal';
  if (dataCompletenessScore >= 80) dataAvailabilityState = 'complete';
  else if (dataCompletenessScore >= 40) dataAvailabilityState = 'partial';
  else dataAvailabilityState = 'minimal';

  // Identify missing data sources
  const missingDataSources: string[] = [];
  if (!recoveryDataAvailable) missingDataSources.push('Recovery');
  if (!stressDataAvailable) missingDataSources.push('Stress');
  if (!workoutDataAvailable) missingDataSources.push('Workout');
  if (!bodyCompDataAvailable) missingDataSources.push('Body Composition');
  if (!bloodworkDataAvailable) missingDataSources.push('Bloodwork');
  if (!sexualHealthDataAvailable) missingDataSources.push('Sexual Health');
  if (!metabolicDataAvailable) missingDataSources.push('Metabolic');
  if (!cardiovascularDataAvailable) missingDataSources.push('Cardiovascular');
  if (!adherenceDataAvailable) missingDataSources.push('Adherence');
  if (!jointHealthDataAvailable) missingDataSources.push('Joint Health');

  // Calculate freshness
  const lastUpdated = input.recovery?.lastUpdated ?? now.toISOString();
  const deviceSyncRecency = calculateRecency(lastUpdated);

  // Overall confidence
  const overallConfidence = dataCompletenessScore >= 70 ? 'high' : dataCompletenessScore >= 40 ? 'medium' : 'low';

  return {
    recoveryDataAvailable,
    stressDataAvailable,
    workoutDataAvailable,
    bodyCompDataAvailable,
    bloodworkDataAvailable,
    sexualHealthDataAvailable,
    metabolicDataAvailable,
    cardiovascularDataAvailable,
    adherenceDataAvailable,
    jointHealthDataAvailable,
    lastUpdated,
    deviceSyncRecency,
    bloodworkRecency: undefined, // TODO: Calculate from bloodwork data
    bodyCompRecency: undefined, // TODO: Calculate from body comp data
    dataCompletenessScore,
    dataAvailabilityState,
    missingDataSources,
    overallConfidence,
  };
}

function calculateRecency(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate DailyHealthSnapshot for a user
 * This is the main entry point for getting the unified health state
 */
export async function generateDailyHealthSnapshot(
  userId: string,
  options?: { bypassCache?: boolean }
): Promise<DailyHealthSnapshot> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const cacheKey = getCacheKey(userId, date);

  // Check cache
  if (!options?.bypassCache) {
    const cached = snapshotCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      logger.info('Returning cached snapshot', { userId, date });
      return cached.snapshot;
    }
  }

  logger.info('Generating new snapshot', { userId, date });

  try {
    // Step 1: Aggregate data from all engines
    const engineInput = await aggregateEngineData(userId);

    // Step 2: Calculate derived intelligence
    const derivedIntelligence = calculateDerivedIntelligence(engineInput);

    // Step 3: Calculate data quality
    const dataQuality = calculateDataQuality(engineInput);

    // Step 4: Build snapshot
    const snapshot: DailyHealthSnapshot = {
      userId,
      date,
      timestamp: new Date().toISOString(),
      recovery: engineInput.recovery ?? createEmptyRecoverySnapshot(),
      stress: engineInput.stress ?? createEmptyStressSnapshot(),
      workout: engineInput.workout ?? createEmptyWorkoutSnapshot(),
      bodyComposition: engineInput.bodyComposition ?? createEmptyBodyCompositionSnapshot(),
      sexualHealth: engineInput.sexualHealth ?? createEmptySexualHealthSnapshot(),
      metabolic: engineInput.metabolic ?? createEmptyMetabolicSnapshot(),
      cardiovascular: engineInput.cardiovascular ?? createEmptyCardiovascularSnapshot(),
      adherence: engineInput.adherence ?? createEmptyAdherenceSnapshot(),
      jointHealth: engineInput.jointHealth ?? createEmptyJointHealthSnapshot(),
      nutrition: engineInput.nutrition,
      prediction: engineInput.prediction,
      derivedIntelligence,
      dataQuality,
      schemaVersion: '1.0.0',
    };

    // Step 5: Cache the snapshot
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);
    snapshotCache.set(cacheKey, {
      snapshot,
      metadata: {
        userId,
        date,
        cachedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        ttlMinutes: CACHE_TTL_MINUTES,
      },
    });

    logger.info('Snapshot generated and cached', { userId, date, expiresAt });

    return snapshot;
  } catch (error) {
    logger.error('Failed to generate snapshot', { error: (error as Error).message, userId, date });
    throw error;
  }
}

/**
 * Get cached snapshot if available
 */
export async function getCachedSnapshot(userId: string): Promise<DailyHealthSnapshot | null> {
  const date = new Date().toISOString().slice(0, 10);
  const cacheKey = getCacheKey(userId, date);
  const cached = snapshotCache.get(cacheKey);

  if (cached && isCacheValid(cached)) {
    return cached.snapshot;
  }

  return null;
}

/**
 * Invalidate cache for a user
 * Call this when new data arrives (e.g., after interview submission, device sync)
 */
export async function invalidateSnapshotCache(userId: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const cacheKey = getCacheKey(userId, date);
  snapshotCache.delete(cacheKey);
  logger.info('Snapshot cache invalidated', { userId, date });
}

// ============================================================================
// EMPTY SNAPSHOT HELPERS
// ============================================================================

function createEmptyRecoverySnapshot(): RecoverySnapshot {
  return {
    score: null,
    status: 'moderate',
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyStressSnapshot(): StressSnapshot {
  return {
    score: null,
    status: 'moderate',
    trend: 'stable',
    cnsLoad: 'moderate',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyWorkoutSnapshot(): WorkoutSnapshot {
  return {
    readinessScore: null,
    readinessStatus: 'moderate',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyBodyCompositionSnapshot(): BodyCompositionSnapshot {
  return {
    lastUpdated: new Date().toISOString(),
    dataSource: 'manual',
    confidence: 'low',
  };
}

function createEmptySexualHealthSnapshot(): SexualHealthSnapshot {
  return {
    score: null,
    status: 'moderate',
    trend: 'stable',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyMetabolicSnapshot(): MetabolicSnapshot {
  return {
    score: null,
    status: 'moderate',
    trend: 'stable',
    metabolicRisk: 'moderate',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyCardiovascularSnapshot(): CardiovascularSnapshot {
  return {
    riskScore: null,
    riskLevel: 'moderate',
    trend: 'stable',
    cardiovascularRisk: 'moderate',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyAdherenceSnapshot(): AdherenceSnapshot {
  return {
    overallScore: null,
    status: 'moderate',
    trend: 'stable',
    breakdown: {
      workout: 0,
      nutrition: 0,
      sleep: 0,
      supplement: 0,
    },
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

function createEmptyJointHealthSnapshot(): JointHealthSnapshot {
  return {
    status: 'stable',
    riskLevel: 'low',
    lastUpdated: new Date().toISOString(),
    dataSource: 'derived',
    confidence: 'low',
  };
}

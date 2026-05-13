import { randomUUID } from 'crypto';

import { getRecoveryToday } from './recoveryEngineService';
import { getStressToday } from './stressEngineService';
import { getJointHealthToday } from './jointHealthEngineService';
import { getAdherenceToday } from './adherenceEngineService';
import { getWorkoutRecommendationToday } from './workoutEngineService';
import { getNutritionToday } from './nutritionEngineService';
import { getMetabolicToday } from './metabolicEngineService';
import { getCardiovascularToday } from './cardiovascularEngineService';
import { getSexualHealthToday } from './sexualHealthEngineService';
import { getSupplementToday } from './supplementEngineService';
import { enrichCrossEngineIntelligenceWithAI } from './crossEngineIntelligenceAIEnrichment';
import { normalizeCrossEngineRecommendation } from './crossEngineIntelligenceNormalizer';
import { validateCrossEngineRecommendation } from './crossEngineIntelligenceValidator';
import { createRecommendation } from './recommendationEngineService';
import { logger } from '../utils/logger';
import type {
  CrossEngineOverallStatus,
  CrossEngineEngineSnapshot,
  CrossEngineEvidenceSignal,
  CrossEnginePattern,
  CrossEngineRecommendation,
  CrossEngineIntelligenceRecord,
} from '../types/crossEngineIntelligence';
import type { RecommendationRequest } from '../types/recommendationEngine';

// In-memory store for cross-engine intelligence records
const crossEngineRecordStore = new Map<string, CrossEngineIntelligenceRecord[]>();

/**
 * Build engine snapshot from all 10 engine outputs
 */
async function buildEngineSnapshot(userId: string): Promise<CrossEngineEngineSnapshot> {
  const snapshot: CrossEngineEngineSnapshot = {};

  try {
    const recovery = await getRecoveryToday(userId);
    snapshot.recoveryStatus = recovery?.recoveryStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Recovery engine unavailable', { userId });
  }

  try {
    const stress = await getStressToday(userId);
    snapshot.stressStatus = stress?.stressStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Stress engine unavailable', { userId });
  }

  try {
    const joint = await getJointHealthToday(userId);
    snapshot.jointStatus = joint?.riskLevel; // Use riskLevel as status
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Joint engine unavailable', { userId });
  }

  try {
    const adherence = await getAdherenceToday(userId);
    snapshot.adherenceStatus = adherence?.status; // Use status property
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Adherence engine unavailable', { userId });
  }

  try {
    const workout = await getWorkoutRecommendationToday(userId);
    snapshot.workoutStatus = workout?.workoutStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Workout engine unavailable', { userId });
  }

  try {
    const nutrition = await getNutritionToday(userId);
    snapshot.nutritionStatus = nutrition?.nutritionStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Nutrition engine unavailable', { userId });
  }

  try {
    const metabolic = await getMetabolicToday(userId);
    snapshot.metabolicStatus = metabolic?.metabolicStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Metabolic engine unavailable', { userId });
  }

  try {
    const cardiovascular = await getCardiovascularToday(userId);
    snapshot.cardiovascularStatus = cardiovascular?.cardiovascularStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Cardiovascular engine unavailable', { userId });
  }

  try {
    const sexualHealth = await getSexualHealthToday(userId);
    snapshot.sexualHealthStatus = sexualHealth?.sexualHealthStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Sexual health engine unavailable', { userId });
  }

  try {
    const supplement = await getSupplementToday(userId);
    snapshot.supplementStatus = supplement?.supplementStatus;
  } catch (error) {
    logger.warn('⚠️ [CROSS-ENGINE] Supplement engine unavailable', { userId });
  }

  return snapshot;
}

/**
 * Build cross-engine evidence signals
 */
function buildCrossEngineEvidence(snapshot: CrossEngineEngineSnapshot): CrossEngineEvidenceSignal[] {
  const evidence: CrossEngineEvidenceSignal[] = [];

  // Recovery + Stress interaction
  if (snapshot.recoveryStatus === 'low' && snapshot.stressStatus === 'high') {
    evidence.push({
      name: 'Recovery-Stress Strain',
      interpretation: 'Recovery is low and stress is high, reducing system resilience',
      severity: 'high',
      sourceEngines: ['Recovery', 'Stress'],
    });
  }

  // Joint + Workout interaction
  if (
    (snapshot.jointStatus === 'elevated_risk' || snapshot.jointStatus === 'high_risk') &&
    (snapshot.workoutStatus === 'demanding' || snapshot.workoutStatus === 'progressive')
  ) {
    evidence.push({
      name: 'Musculoskeletal Load Mismatch',
      interpretation: 'Joint risk is elevated while workout load remains demanding',
      severity: 'high',
      sourceEngines: ['Joint', 'Workout'],
    });
  }

  // Metabolic + Cardiovascular coupling
  if (
    (snapshot.metabolicStatus === 'elevated_risk' || snapshot.metabolicStatus === 'high_risk') &&
    (snapshot.cardiovascularStatus === 'elevated_risk' || snapshot.cardiovascularStatus === 'high_risk')
  ) {
    evidence.push({
      name: 'Metabolic-Cardiovascular Risk Coupling',
      interpretation: 'Metabolic and cardiovascular signals both indicate increased health risk',
      severity: 'high',
      sourceEngines: ['Metabolic', 'Cardiovascular'],
    });
  }

  // Sexual Health + Stress + Recovery
  if (
    (snapshot.sexualHealthStatus === 'reduced' || snapshot.sexualHealthStatus === 'low') &&
    snapshot.stressStatus === 'high' &&
    snapshot.recoveryStatus === 'low'
  ) {
    evidence.push({
      name: 'Sexual Health Suppression Pattern',
      interpretation: 'Sexual health readiness is reduced in the context of stress and recovery strain',
      severity: 'moderate',
      sourceEngines: ['Sexual Health', 'Stress', 'Recovery'],
    });
  }

  // Adherence + Complexity
  if (
    snapshot.adherenceStatus === 'low' &&
    (snapshot.supplementStatus === 'inefficient' || snapshot.supplementStatus === 'conflicted')
  ) {
    evidence.push({
      name: 'Behavioral Friction',
      interpretation: 'Adherence is low, suggesting the plan may be too complex',
      severity: 'moderate',
      sourceEngines: ['Adherence', 'Supplement'],
    });
  }

  // Nutrition + Workout + Recovery alignment
  if (
    snapshot.recoveryStatus === 'low' &&
    (snapshot.workoutStatus === 'demanding' || snapshot.workoutStatus === 'progressive') &&
    snapshot.nutritionStatus !== 'optimal'
  ) {
    evidence.push({
      name: 'Training-Nutrition-Recovery Misalignment',
      interpretation: 'Nutrition and workout demands are misaligned with current recovery capacity',
      severity: 'moderate',
      sourceEngines: ['Nutrition', 'Workout', 'Recovery'],
    });
  }

  // Supplement + Metabolic + Cardiovascular alignment
  if (
    (snapshot.metabolicStatus === 'elevated_risk' || snapshot.cardiovascularStatus === 'elevated_risk') &&
    (snapshot.supplementStatus === 'suboptimal' || snapshot.supplementStatus === 'inefficient')
  ) {
    evidence.push({
      name: 'Supplement-Health Misalignment',
      interpretation: 'Supplement stack may be misaligned with current metabolic and cardiovascular needs',
      severity: 'moderate',
      sourceEngines: ['Supplement', 'Metabolic', 'Cardiovascular'],
    });
  }

  // Opportunity window detection
  if (
    snapshot.recoveryStatus === 'optimal' &&
    snapshot.stressStatus === 'low' &&
    snapshot.adherenceStatus === 'high' &&
    snapshot.jointStatus === 'low_risk'
  ) {
    evidence.push({
      name: 'Progression Opportunity Window',
      interpretation: 'Recovery is high, stress is low, adherence is strong, and joint risk is minimal - opportunity for progression',
      severity: 'low',
      sourceEngines: ['Recovery', 'Stress', 'Adherence', 'Joint'],
    });
  }

  return evidence;
}

/**
 * Detect cross-engine patterns
 */
function detectCrossEnginePatterns(
  snapshot: CrossEngineEngineSnapshot,
  evidence: CrossEngineEvidenceSignal[],
): CrossEnginePattern[] {
  const patterns: CrossEnginePattern[] = [];

  // Pattern 1: Systemic Strain
  if (
    snapshot.recoveryStatus === 'low' &&
    snapshot.stressStatus === 'high' &&
    (snapshot.workoutStatus === 'constrained' || snapshot.workoutStatus === 'demanding')
  ) {
    patterns.push({
      name: 'Systemic Strain',
      summary: 'Low recovery and high stress are reducing resilience across training and health domains',
      severity: 'high',
      sourceEngines: ['Recovery', 'Stress', 'Workout'],
    });
  }

  // Pattern 2: Musculoskeletal Overload
  if (
    (snapshot.jointStatus === 'elevated_risk' || snapshot.jointStatus === 'high_risk') &&
    (snapshot.workoutStatus === 'demanding' || snapshot.workoutStatus === 'progressive') &&
    snapshot.recoveryStatus === 'low'
  ) {
    patterns.push({
      name: 'Musculoskeletal Overload',
      summary: 'Joint risk is elevated with demanding training and low recovery - injury risk pattern',
      severity: 'high',
      sourceEngines: ['Joint', 'Workout', 'Recovery'],
    });
  }

  // Pattern 3: Metabolic-Cardiovascular Risk Coupling
  if (
    (snapshot.metabolicStatus === 'elevated_risk' || snapshot.metabolicStatus === 'high_risk') &&
    (snapshot.cardiovascularStatus === 'elevated_risk' || snapshot.cardiovascularStatus === 'high_risk')
  ) {
    patterns.push({
      name: 'Metabolic-Cardiovascular Risk Coupling',
      summary: 'Both metabolic and cardiovascular health show elevated risk - health risk escalation pattern',
      severity: 'high',
      sourceEngines: ['Metabolic', 'Cardiovascular'],
    });
  }

  // Pattern 4: Behavioral Friction
  if (
    snapshot.adherenceStatus === 'low' &&
    (snapshot.supplementStatus === 'inefficient' || snapshot.supplementStatus === 'conflicted' ||
     snapshot.nutritionStatus === 'complex' || snapshot.workoutStatus === 'demanding')
  ) {
    patterns.push({
      name: 'Behavioral Friction',
      summary: 'Low adherence with complex supplement, nutrition, or workout demands - execution mismatch',
      severity: 'moderate',
      sourceEngines: ['Adherence', 'Supplement', 'Nutrition', 'Workout'],
    });
  }

  // Pattern 5: Sexual Health Suppression Pattern
  if (
    (snapshot.sexualHealthStatus === 'reduced' || snapshot.sexualHealthStatus === 'low') &&
    snapshot.stressStatus === 'high' &&
    snapshot.recoveryStatus === 'low'
  ) {
    patterns.push({
      name: 'Sexual Health Suppression Pattern',
      summary: 'Sexual health readiness reduced with high stress and low recovery - systemic strain affecting hormonal health',
      severity: 'moderate',
      sourceEngines: ['Sexual Health', 'Stress', 'Recovery'],
    });
  }

  // Pattern 6: Goal Misalignment (inferred from demanding workout with constrained status)
  if (
    (snapshot.workoutStatus === 'demanding' || snapshot.workoutStatus === 'progressive') &&
    (snapshot.recoveryStatus === 'low' || snapshot.stressStatus === 'high' || snapshot.jointStatus === 'elevated_risk')
  ) {
    patterns.push({
      name: 'Goal Misalignment',
      summary: 'Goal-driven plan is aggressive while current engine statuses are constrained - short-term goal conflict',
      severity: 'moderate',
      sourceEngines: ['Workout', 'Recovery', 'Stress', 'Joint'],
    });
  }

  // Pattern 7: Opportunity Window
  if (
    snapshot.recoveryStatus === 'optimal' &&
    snapshot.stressStatus === 'low' &&
    snapshot.adherenceStatus === 'high' &&
    (snapshot.jointStatus === 'low_risk' || snapshot.jointStatus === 'optimal')
  ) {
    patterns.push({
      name: 'Opportunity Window',
      summary: 'Recovery is high, stress is low, adherence is strong, and joint risk is minimal - progression opportunity',
      severity: 'low',
      sourceEngines: ['Recovery', 'Stress', 'Adherence', 'Joint'],
    });
  }

  return patterns;
}

/**
 * Determine overall cross-engine status
 */
function determineCrossEngineOverallStatus(
  snapshot: CrossEngineEngineSnapshot,
  patterns: CrossEnginePattern[],
): CrossEngineOverallStatus {
  // High risk conditions
  const highSeverityPatterns = patterns.filter(p => p.severity === 'high');
  if (highSeverityPatterns.length >= 2) {
    return 'high_risk';
  }

  if (
    (snapshot.metabolicStatus === 'high_risk' || snapshot.cardiovascularStatus === 'high_risk') &&
    (snapshot.recoveryStatus === 'low' || snapshot.stressStatus === 'high')
  ) {
    return 'high_risk';
  }

  if (
    snapshot.recoveryStatus === 'low' &&
    snapshot.stressStatus === 'high' &&
    snapshot.adherenceStatus === 'low'
  ) {
    return 'high_risk';
  }

  // Constrained conditions
  const moderateSeverityPatterns = patterns.filter(p => p.severity === 'moderate');
  if (moderateSeverityPatterns.length >= 2) {
    return 'constrained';
  }

  if (
    (snapshot.recoveryStatus === 'low' || snapshot.stressStatus === 'high') &&
    (snapshot.jointStatus === 'elevated_risk' || snapshot.workoutStatus === 'demanding')
  ) {
    return 'constrained';
  }

  if (
    snapshot.metabolicStatus === 'elevated_risk' ||
    snapshot.cardiovascularStatus === 'elevated_risk'
  ) {
    return 'constrained';
  }

  // Moderate conditions
  if (patterns.length > 0 && !patterns.some(p => p.name === 'Opportunity Window')) {
    return 'moderate';
  }

  if (
    snapshot.recoveryStatus === 'moderate' ||
    snapshot.stressStatus === 'moderate' ||
    snapshot.adherenceStatus === 'moderate'
  ) {
    return 'moderate';
  }

  // Optimal conditions
  if (patterns.some(p => p.name === 'Opportunity Window')) {
    return 'optimal';
  }

  if (
    snapshot.recoveryStatus === 'optimal' &&
    snapshot.stressStatus === 'low' &&
    snapshot.adherenceStatus === 'high'
  ) {
    return 'optimal';
  }

  // Default to moderate
  return 'moderate';
}

/**
 * Build fallback cross-engine recommendation
 */
function buildCrossEngineFallbackRecommendation(
  overallStatus: CrossEngineOverallStatus,
  patterns: CrossEnginePattern[],
  snapshot: CrossEngineEngineSnapshot,
): CrossEngineRecommendation {
  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  switch (overallStatus) {
    case 'high_risk':
      priority = 'critical';
      summary = 'Reduce strain across training, recovery, and daily plan complexity today';
      actions = [
        'Reduce workout intensity by 20-30%',
        'Increase hydration and prioritize sleep quality',
        'Simplify nutrition targets to core macros only',
        'Reduce supplement stack complexity',
        'Avoid high-strain training until recovery improves',
        'Protect cardiovascular and metabolic stability',
      ];
      break;

    case 'constrained':
      priority = 'important';
      summary = 'Use controlled execution across training and nutrition while protecting recovery';
      actions = [
        'Use controlled workout execution - avoid pushing limits',
        'Emphasize protein intake and hydration',
        'Reduce unnecessary plan complexity',
        'Maintain recovery focus with sleep and stress management',
        'Keep plan aligned with realistic adherence capacity',
      ];
      break;

    case 'moderate':
      priority = 'important';
      summary = 'Maintain current structure with minor adjustments to address emerging patterns';
      actions = [
        'Maintain current training and nutrition structure',
        'Monitor emerging strain signals',
        'Reinforce consistency and adherence',
        'Make minor adjustments as needed',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Progress training modestly while maintaining current recovery and nutrition practices';
      actions = [
        'Progress training intensity by 5-10% if desired',
        'Maintain current nutrition structure',
        'Reinforce habits that are already working',
        'Monitor for any emerging strain signals',
      ];
      break;
  }

  // Add pattern-specific actions
  if (patterns.some(p => p.name === 'Metabolic-Cardiovascular Risk Coupling')) {
    actions.unshift('Address metabolic and cardiovascular health with targeted nutrition and cardio');
  }

  if (patterns.some(p => p.name === 'Musculoskeletal Overload')) {
    actions.unshift('Reduce training volume to protect joints');
  }

  if (patterns.some(p => p.name === 'Behavioral Friction')) {
    actions.push('Simplify supplement and nutrition complexity to improve adherence');
  }

  return {
    type: 'cross_engine_intelligence',
    priority,
    summary,
    actions: actions.slice(0, 6), // Limit to 6 actions
    source: 'deterministic',
  };
}

/**
 * Get cross-engine intelligence for a user
 */
export async function getCrossEngineIntelligence(
  userId: string,
): Promise<CrossEngineIntelligenceRecord> {
  logger.info('🔵 [CROSS-ENGINE] Intelligence generation started', { userId });

  // Load all engine outputs
  const engineSnapshot = await buildEngineSnapshot(userId);
  logger.info('✅ [CROSS-ENGINE] Engine snapshot built', {
    userId,
    availableEngines: Object.keys(engineSnapshot).filter(k => engineSnapshot[k as keyof CrossEngineEngineSnapshot] !== undefined).length,
  });

  // Build evidence
  const evidence = buildCrossEngineEvidence(engineSnapshot);
  logger.info('✅ [CROSS-ENGINE] Evidence built', {
    userId,
    evidenceCount: evidence.length,
  });

  // Detect patterns
  const patterns = detectCrossEnginePatterns(engineSnapshot, evidence);
  logger.info('✅ [CROSS-ENGINE] Patterns detected', {
    userId,
    patternCount: patterns.length,
    patterns: patterns.map(p => p.name),
  });

  // Determine overall status
  const overallStatus = determineCrossEngineOverallStatus(engineSnapshot, patterns);
  logger.info('✅ [CROSS-ENGINE] Overall status determined', {
    userId,
    overallStatus,
  });

  // Build fallback recommendation
  const fallbackRecommendation = buildCrossEngineFallbackRecommendation(
    overallStatus,
    patterns,
    engineSnapshot,
  );
  logger.info('✅ [CROSS-ENGINE] Fallback recommendation built', {
    userId,
    priority: fallbackRecommendation.priority,
  });

  // AI enrichment (if enabled)
  let recommendation = fallbackRecommendation;
  const useAI = process.env.USE_AI_ENRICHMENT_CROSS_ENGINE_INTELLIGENCE === 'true' ||
                process.env.USE_AI_ENRICHMENT === 'true';
  if (useAI) {
    recommendation = await enrichCrossEngineIntelligenceWithAI(
      engineSnapshot,
      evidence,
      patterns,
      fallbackRecommendation,
    );
  } else {
    logger.info('⚠️ [CROSS-ENGINE] AI enrichment disabled', { userId });
  }

  // Normalize
  recommendation = normalizeCrossEngineRecommendation(recommendation);
  logger.info('✅ [CROSS-ENGINE] Recommendation normalized', { userId });

  // Validate
  const isValid = validateCrossEngineRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [CROSS-ENGINE] Validation failed, using fallback', { userId });
    recommendation = fallbackRecommendation;
  } else {
    logger.info('✅ [CROSS-ENGINE] Recommendation validated', { userId });
  }

  // Create record
  const record: CrossEngineIntelligenceRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().split('T')[0],
    overallStatus,
    engineSnapshot,
    patterns,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  // Persist to in-memory store
  const history = crossEngineRecordStore.get(userId) ?? [];
  crossEngineRecordStore.set(userId, [record, ...history]);
  logger.info('✅ [CROSS-ENGINE] Record persisted to in-memory store', { userId });

  // Persist to RecommendationEngine
  try {
    const recommendationRequest: RecommendationRequest = {
      sourceEngine: 'holistic',
      title: 'Cross-Engine Health Orchestration',
      description: recommendation.summary,
      rationale: recommendation.rationale,
      priority: recommendation.priority,
      category: 'performance_enhancement',
      confidenceLevel: 'high',
      supportingMetrics: evidence.map(e => ({
        name: e.name,
        value: e.interpretation,
        status: e.severity === 'high' ? 'concerning' : e.severity === 'moderate' ? 'suboptimal' : 'normal',
      })),
      reasonCodes: patterns.map(p => p.name),
      recommendationGroup: 'cross_engine_orchestration',
    };

    await createRecommendation({
      userId,
      request: recommendationRequest,
    });

    logger.info('✅ [CROSS-ENGINE] Persisted to RecommendationEngine', { userId });
  } catch (error) {
    logger.error('❌ [CROSS-ENGINE] Failed to persist to RecommendationEngine', {
      userId,
      error: (error as Error).message,
    });
  }

  logger.info('✅ [CROSS-ENGINE] Intelligence generation complete', {
    userId,
    overallStatus: record.overallStatus,
    patternCount: patterns.length,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}

/**
 * Get today's cross-engine intelligence
 */
export async function getCrossEngineIntelligenceToday(
  userId: string,
): Promise<CrossEngineIntelligenceRecord | null> {
  const date = new Date().toISOString().split('T')[0];
  const history = crossEngineRecordStore.get(userId) ?? [];
  const existing = history.find(record => record.date === date);

  if (existing) {
    logger.info('📋 [CROSS-ENGINE] Returning cached record', { userId, date });
    return existing;
  }

  return getCrossEngineIntelligence(userId);
}

/**
 * Get cross-engine intelligence history
 */
export async function getCrossEngineIntelligenceHistory(
  userId: string,
): Promise<CrossEngineIntelligenceRecord[]> {
  return crossEngineRecordStore.get(userId) ?? [];
}

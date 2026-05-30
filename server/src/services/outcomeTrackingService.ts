import { logger } from '../utils/logger';
import { getRecoveryHistory } from './recoveryEngineService';
import { getStressHistory } from './stressEngineService';
import { getJointHealthHistory } from './jointHealthEngineService';
import type { RecommendationOutcome } from '../types/adaptiveIntelligence';

export interface OutcomeMetrics {
  recoveryScore?: number;
  stressScore?: number;
  jointRisk?: string;
}

export async function trackOutcome(
  userId: string,
  recommendationId: string,
  outcome: RecommendationOutcome
): Promise<void> {
  logger.info('🔵 Tracking recommendation outcome', {
    userId,
    recommendationId,
    improvementDetected: outcome.improvementDetected,
  });

  // Outcome is already tracked via adherence service
  // This function can be extended for additional outcome persistence
  
  logger.info('✅ Outcome tracked', {
    userId,
    recommendationId,
  });
}

export async function compareOutcomes(
  userId: string,
  beforeDate: string,
  afterDate: string
): Promise<{ improvement: boolean; metrics: OutcomeMetrics }> {
  logger.info('🔵 Comparing outcomes', {
    userId,
    beforeDate,
    afterDate,
  });

  const [recoveryHistory, stressHistory, jointHistory] = await Promise.all([
    getRecoveryHistory(userId),
    getStressHistory(userId),
    getJointHealthHistory(userId),
  ]);

  const beforeRecovery = recoveryHistory.find(r => r.date === beforeDate);
  const afterRecovery = recoveryHistory.find(r => r.date === afterDate);

  const beforeStress = stressHistory.find(s => s.date === beforeDate);
  const afterStress = stressHistory.find(s => s.date === afterDate);

  const beforeJoint = jointHistory.find(j => j.date === beforeDate);
  const afterJoint = jointHistory.find(j => j.date === afterDate);

  let improvement = false;
  const metrics: OutcomeMetrics = {};

  // Check recovery improvement
  if (beforeRecovery && afterRecovery) {
    const recoveryImproved = afterRecovery.recoveryScore > beforeRecovery.recoveryScore;
    metrics.recoveryScore = afterRecovery.recoveryScore;
    if (recoveryImproved) improvement = true;
  }

  // Check stress improvement (lower is better)
  if (beforeStress && afterStress) {
    const stressImproved = afterStress.stressScore < beforeStress.stressScore;
    metrics.stressScore = afterStress.stressScore;
    if (stressImproved) improvement = true;
  }

  // Check joint improvement
  if (beforeJoint && afterJoint) {
    const jointRiskMapping: Record<string, number> = { low: 1, moderate: 2, high: 3 };
    const beforeRisk = jointRiskMapping[beforeJoint.riskLevel] || 2;
    const afterRisk = jointRiskMapping[afterJoint.riskLevel] || 2;
    const jointImproved = afterRisk < beforeRisk;
    metrics.jointRisk = afterJoint.riskLevel;
    if (jointImproved) improvement = true;
  }

  logger.info('✅ Outcome comparison complete', {
    userId,
    improvement,
    hasRecoveryData: !!metrics.recoveryScore,
    hasStressData: !!metrics.stressScore,
    hasJointData: !!metrics.jointRisk,
  });

  return { improvement, metrics };
}

export async function detectImprovement(
  userId: string,
  recommendationDate: string
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  
  // Compare recommendation date to today
  const { improvement } = await compareOutcomes(userId, recommendationDate, today);
  
  return improvement;
}

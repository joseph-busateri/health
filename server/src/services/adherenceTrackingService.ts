import { logger } from '../utils/logger';
import type { AdherenceStatus, RecommendationOutcome } from '../types/adaptiveIntelligence';

const adherenceStore = new Map<string, RecommendationOutcome[]>();

export interface AdherenceInput {
  recommendationId: string;
  userId: string;
  adherenceStatus: AdherenceStatus;
  notes?: string;
}

export function trackAdherence(input: AdherenceInput): void {
  logger.info('🔵 Tracking recommendation adherence', {
    userId: input.userId,
    recommendationId: input.recommendationId,
    status: input.adherenceStatus,
  });

  const userOutcomes = adherenceStore.get(input.userId) || [];
  
  const existingIndex = userOutcomes.findIndex(
    o => o.recommendationId === input.recommendationId
  );

  const outcome: RecommendationOutcome = {
    recommendationId: input.recommendationId,
    adherenceStatus: input.adherenceStatus,
    outcomeMetrics: {},
    improvementDetected: false,
    timestamp: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    userOutcomes[existingIndex] = outcome;
  } else {
    userOutcomes.push(outcome);
  }

  adherenceStore.set(input.userId, userOutcomes);

  logger.info('✅ Adherence tracked', {
    userId: input.userId,
    totalOutcomes: userOutcomes.length,
  });
}

export function getAdherenceHistory(userId: string): RecommendationOutcome[] {
  return adherenceStore.get(userId) || [];
}

export function calculateAdherenceRate(userId: string): number {
  const outcomes = adherenceStore.get(userId) || [];
  
  if (outcomes.length === 0) return 0;

  const completedCount = outcomes.filter(
    o => o.adherenceStatus === 'completed' || o.adherenceStatus === 'partial'
  ).length;

  return (completedCount / outcomes.length) * 100;
}

export function inferAdherenceFromData(
  userId: string,
  recommendationType: string,
  currentMetrics: any,
  previousMetrics: any
): AdherenceStatus {
  logger.info('🔵 Inferring adherence from data', {
    userId,
    recommendationType,
  });

  // Simple heuristic: if metrics improved, assume recommendation was followed
  if (recommendationType.includes('recovery') || recommendationType.includes('reduce')) {
    if (currentMetrics.recoveryScore > previousMetrics.recoveryScore) {
      return 'completed';
    } else if (currentMetrics.recoveryScore === previousMetrics.recoveryScore) {
      return 'partial';
    } else {
      return 'skipped';
    }
  }

  if (recommendationType.includes('stress')) {
    if (currentMetrics.stressScore < previousMetrics.stressScore) {
      return 'completed';
    } else if (currentMetrics.stressScore === previousMetrics.stressScore) {
      return 'partial';
    } else {
      return 'skipped';
    }
  }

  return 'unknown';
}

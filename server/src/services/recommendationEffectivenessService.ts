import { logger } from '../utils/logger';
import { getAdherenceHistory } from './adherenceTrackingService';
import type { EffectivenessScore, RecommendationOutcome } from '../types/adaptiveIntelligence';

const effectivenessStore = new Map<string, EffectivenessScore[]>();

export function calculateEffectiveness(
  userId: string,
  recommendationType: string
): EffectivenessScore {
  logger.info('🔵 Calculating recommendation effectiveness', {
    userId,
    recommendationType,
  });

  const outcomes = getAdherenceHistory(userId);
  
  // Filter outcomes for this recommendation type
  const relevantOutcomes = outcomes.filter(outcome => {
    // Simple matching - in production, would need more sophisticated type matching
    return outcome.recommendationId.includes(recommendationType.toLowerCase());
  });

  if (relevantOutcomes.length === 0) {
    logger.info('ℹ️  No outcomes found for recommendation type', {
      userId,
      recommendationType,
    });

    return {
      recommendationType,
      effectiveness: 0.5, // Default neutral effectiveness
      sampleSize: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Calculate effectiveness based on improvements
  const improvementCount = relevantOutcomes.filter(o => o.improvementDetected).length;
  const effectiveness = improvementCount / relevantOutcomes.length;

  logger.info('✅ Effectiveness calculated', {
    userId,
    recommendationType,
    effectiveness: Math.round(effectiveness * 100) + '%',
    sampleSize: relevantOutcomes.length,
  });

  return {
    recommendationType,
    effectiveness,
    sampleSize: relevantOutcomes.length,
    lastUpdated: new Date().toISOString(),
  };
}

export function calculateAllEffectiveness(userId: string): EffectivenessScore[] {
  logger.info('🔵 Calculating all effectiveness scores', { userId });

  const recommendationTypes = [
    'recovery',
    'stress',
    'joint',
    'reduce_volume',
    'reduce_intensity',
    'prioritize_sleep',
    'hydration',
    'rest_day',
  ];

  const scores = recommendationTypes.map(type => calculateEffectiveness(userId, type));

  // Store for future reference
  effectivenessStore.set(userId, scores);

  logger.info('✅ All effectiveness scores calculated', {
    userId,
    scoreCount: scores.length,
  });

  return scores;
}

export function getEffectivenessScores(userId: string): EffectivenessScore[] {
  return effectivenessStore.get(userId) || [];
}

export function updateEffectivenessScore(
  userId: string,
  outcome: RecommendationOutcome
): void {
  logger.info('🔵 Updating effectiveness score', {
    userId,
    recommendationId: outcome.recommendationId,
    improvementDetected: outcome.improvementDetected,
  });

  // Recalculate effectiveness for all types
  calculateAllEffectiveness(userId);

  logger.info('✅ Effectiveness score updated', { userId });
}

export function getTopEffectiveRecommendations(
  userId: string,
  limit: number = 3
): EffectivenessScore[] {
  const scores = getEffectivenessScores(userId);
  
  // Filter out scores with insufficient sample size
  const validScores = scores.filter(s => s.sampleSize >= 2);
  
  // Sort by effectiveness descending
  return validScores
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, limit);
}

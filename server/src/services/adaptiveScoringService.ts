import { logger } from '../utils/logger';
import { getEffectivenessScores, getTopEffectiveRecommendations } from './recommendationEffectivenessService';
import { calculateAdherenceRate } from './adherenceTrackingService';
import type { EffectivenessScore } from '../types/adaptiveIntelligence';

export interface AdaptiveScoreBoost {
  effectivenessBoost: number;
  adherenceBoost: number;
  userPreferenceBoost: number;
  totalBoost: number;
}

export function calculateAdaptiveBoost(
  userId: string,
  recommendationType: string,
  basePriority: string
): AdaptiveScoreBoost {
  logger.info('🔵 Calculating adaptive score boost', {
    userId,
    recommendationType,
    basePriority,
  });

  let effectivenessBoost = 0;
  let adherenceBoost = 0;
  let userPreferenceBoost = 0;

  // 1. Effectiveness boost
  const effectivenessScores = getEffectivenessScores(userId);
  const relevantScore = effectivenessScores.find(s => 
    s.recommendationType.toLowerCase().includes(recommendationType.toLowerCase()) ||
    recommendationType.toLowerCase().includes(s.recommendationType.toLowerCase())
  );

  if (relevantScore && relevantScore.sampleSize >= 2) {
    // Boost based on effectiveness (0-20 points)
    // 100% effective = +20, 50% effective = 0, 0% effective = -10
    effectivenessBoost = (relevantScore.effectiveness - 0.5) * 40;
    
    logger.info('📊 Effectiveness boost applied', {
      userId,
      recommendationType,
      effectiveness: Math.round(relevantScore.effectiveness * 100) + '%',
      boost: effectivenessBoost,
    });
  }

  // 2. Adherence likelihood boost
  const adherenceRate = calculateAdherenceRate(userId);
  if (adherenceRate > 0) {
    // Users with high adherence get slight boost (0-10 points)
    adherenceBoost = (adherenceRate / 100) * 10;
    
    logger.info('📊 Adherence boost applied', {
      userId,
      adherenceRate: Math.round(adherenceRate) + '%',
      boost: adherenceBoost,
    });
  }

  // 3. User preference boost (based on top effective recommendations)
  const topEffective = getTopEffectiveRecommendations(userId, 3);
  const isTopEffective = topEffective.some(s => 
    s.recommendationType.toLowerCase().includes(recommendationType.toLowerCase())
  );

  if (isTopEffective) {
    userPreferenceBoost = 15;
    
    logger.info('📊 User preference boost applied', {
      userId,
      recommendationType,
      boost: userPreferenceBoost,
    });
  }

  const totalBoost = effectivenessBoost + adherenceBoost + userPreferenceBoost;

  logger.info('✅ Adaptive boost calculated', {
    userId,
    recommendationType,
    effectivenessBoost: Math.round(effectivenessBoost),
    adherenceBoost: Math.round(adherenceBoost),
    userPreferenceBoost,
    totalBoost: Math.round(totalBoost),
  });

  return {
    effectivenessBoost,
    adherenceBoost,
    userPreferenceBoost,
    totalBoost,
  };
}

export function applyAdaptiveScoring(
  userId: string,
  recommendations: Array<{ id: string; type: string; priority: string; score: number }>
): Array<{ id: string; type: string; priority: string; score: number; adaptiveBoost: number }> {
  logger.info('🔵 Applying adaptive scoring to recommendations', {
    userId,
    recommendationCount: recommendations.length,
  });

  const scoredRecommendations = recommendations.map(rec => {
    const boost = calculateAdaptiveBoost(userId, rec.type, rec.priority);
    
    return {
      ...rec,
      score: rec.score + boost.totalBoost,
      adaptiveBoost: boost.totalBoost,
    };
  });

  logger.info('✅ Adaptive scoring applied', {
    userId,
    recommendationCount: scoredRecommendations.length,
  });

  return scoredRecommendations;
}

export function getAdaptiveInsights(userId: string): {
  topEffective: EffectivenessScore[];
  adherenceRate: number;
  totalOutcomes: number;
} {
  const topEffective = getTopEffectiveRecommendations(userId, 5);
  const adherenceRate = calculateAdherenceRate(userId);
  const effectivenessScores = getEffectivenessScores(userId);
  const totalOutcomes = effectivenessScores.reduce((sum, s) => sum + s.sampleSize, 0);

  return {
    topEffective,
    adherenceRate,
    totalOutcomes,
  };
}

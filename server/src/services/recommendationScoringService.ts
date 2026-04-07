import { logger } from '../utils/logger';
import type { PrioritizedRecommendation, PriorityLevel, ScoringFactors } from '../types/recommendationPrioritization';

const PRIORITY_SCORES: Record<PriorityLevel, number> = {
  critical: 100,
  important: 70,
  optimization: 40,
};

const CROSS_ENGINE_BOOST = 20;
const MULTI_ENGINE_ALIGNMENT_BOOST = 15;
const RECENCY_BOOST = 5;
const RISK_AMPLIFICATION_BOOST = 10;

function calculatePriorityScore(priority: PriorityLevel): number {
  return PRIORITY_SCORES[priority] || 40;
}

function calculateCrossEngineBoost(source: string): number {
  if (source.toLowerCase().includes('cross') || source.toLowerCase().includes('holistic')) {
    return CROSS_ENGINE_BOOST;
  }
  return 0;
}

function calculateMultiEngineAlignment(source: string): number {
  const sources = source.split('+').map(s => s.trim());
  if (sources.length > 1) {
    return (sources.length - 1) * MULTI_ENGINE_ALIGNMENT_BOOST;
  }
  return 0;
}

function calculateRecencyBoost(createdAt?: string): number {
  if (!createdAt) return 0;
  
  const created = new Date(createdAt);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceCreation < 1) {
    return RECENCY_BOOST;
  }
  return 0;
}

function calculateRiskAmplification(recommendation: PrioritizedRecommendation): number {
  if (recommendation.priority !== 'critical') return 0;
  
  const riskKeywords = [
    'high risk',
    'elevated risk',
    'multiple systems',
    'aggravated',
    'severe',
    'immediate',
  ];
  
  const text = `${recommendation.summary} ${recommendation.rationale || ''}`.toLowerCase();
  const riskCount = riskKeywords.filter(keyword => text.includes(keyword)).length;
  
  if (riskCount >= 2) {
    return RISK_AMPLIFICATION_BOOST;
  }
  return 0;
}

export function scoreRecommendation(recommendation: PrioritizedRecommendation): ScoringFactors {
  const priorityScore = calculatePriorityScore(recommendation.priority);
  const crossEngineBoost = calculateCrossEngineBoost(recommendation.source);
  const multiEngineAlignment = calculateMultiEngineAlignment(recommendation.source);
  const recencyBoost = calculateRecencyBoost(recommendation.createdAt);
  const riskAmplification = calculateRiskAmplification(recommendation);

  const totalScore = 
    priorityScore + 
    crossEngineBoost + 
    multiEngineAlignment + 
    recencyBoost + 
    riskAmplification;

  return {
    priorityScore,
    crossEngineBoost,
    multiEngineAlignment,
    recencyBoost,
    riskAmplification,
    totalScore,
  };
}

export function scoreRecommendations(
  recommendations: PrioritizedRecommendation[],
): PrioritizedRecommendation[] {
  logger.info('🔵 Starting recommendation scoring', {
    count: recommendations.length,
  });

  const scored = recommendations.map(rec => {
    const factors = scoreRecommendation(rec);
    
    logger.info('📊 Scored recommendation', {
      summary: rec.summary.substring(0, 50),
      priority: rec.priority,
      source: rec.source,
      totalScore: factors.totalScore,
      breakdown: {
        priority: factors.priorityScore,
        crossEngine: factors.crossEngineBoost,
        multiEngine: factors.multiEngineAlignment,
        recency: factors.recencyBoost,
        risk: factors.riskAmplification,
      },
    });

    return {
      ...rec,
      score: factors.totalScore,
    };
  });

  logger.info('✅ Recommendation scoring complete', {
    count: scored.length,
    avgScore: scored.reduce((sum, r) => sum + r.score, 0) / scored.length,
    maxScore: Math.max(...scored.map(r => r.score)),
    minScore: Math.min(...scored.map(r => r.score)),
  });

  return scored;
}

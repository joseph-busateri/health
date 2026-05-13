import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { calculateAllEffectiveness, getEffectivenessScores } from './recommendationEffectivenessService';
import { getAdherenceHistory } from './adherenceTrackingService';
import { getAdaptiveInsights } from './adaptiveScoringService';
import { getLongitudinalIntelligenceContext } from './longitudinalIntelligenceService';
import type { AdaptiveRecord, UserPattern, AdaptiveRecommendation } from '../types/adaptiveIntelligence';

const adaptiveStore = new Map<string, AdaptiveRecord[]>();

function identifyUserPatterns(userId: string): UserPattern[] {
  logger.info('🔵 Identifying user patterns', { userId });

  const patterns: UserPattern[] = [];
  const insights = getAdaptiveInsights(userId);

  // Pattern 1: High adherence
  if (insights.adherenceRate >= 70) {
    patterns.push({
      patternType: 'high_adherence',
      frequency: insights.adherenceRate,
      description: `User follows recommendations ${Math.round(insights.adherenceRate)}% of the time`,
    });
  }

  // Pattern 2: Low adherence
  if (insights.adherenceRate < 40 && insights.totalOutcomes >= 5) {
    patterns.push({
      patternType: 'low_adherence',
      frequency: insights.adherenceRate,
      description: `User struggles with adherence (${Math.round(insights.adherenceRate)}%)`,
    });
  }

  // Pattern 3: Top effective recommendation types
  insights.topEffective.forEach((score, index) => {
    if (score.effectiveness >= 0.7 && score.sampleSize >= 3) {
      patterns.push({
        patternType: 'effective_recommendation',
        frequency: score.effectiveness * 100,
        description: `${score.recommendationType} recommendations are ${Math.round(score.effectiveness * 100)}% effective`,
      });
    }
  });

  // Pattern 4: Consistent improvement
  const adherenceHistory = getAdherenceHistory(userId);
  const recentOutcomes = adherenceHistory.slice(-5);
  const improvementCount = recentOutcomes.filter(o => o.improvementDetected).length;
  
  if (recentOutcomes.length >= 3 && improvementCount / recentOutcomes.length >= 0.6) {
    patterns.push({
      patternType: 'consistent_improvement',
      frequency: (improvementCount / recentOutcomes.length) * 100,
      description: `User shows consistent improvement (${improvementCount}/${recentOutcomes.length} recent outcomes)`,
    });
  }

  logger.info('✅ User patterns identified', {
    userId,
    patternCount: patterns.length,
  });

  return patterns;
}

function buildAdaptiveFallbackRecommendation(
  userId: string,
  effectivenessScores: any[],
  userPatterns: UserPattern[]
): AdaptiveRecommendation {
  logger.info('🔵 Building adaptive fallback recommendation', { userId });

  const insights = getAdaptiveInsights(userId);

  let priority: 'critical' | 'important' | 'optimization' = 'important';
  let summary: string;
  let actions: string[] = [];

  // Determine priority and content based on patterns
  if (insights.totalOutcomes < 3) {
    priority = 'optimization';
    summary = 'Continue building your health data history. The system will learn your patterns over time.';
    actions = [
      'Continue logging daily metrics consistently',
      'Follow recommendations to build effectiveness data',
      'Track your adherence and outcomes',
      'Check back after 5+ recommendation cycles',
    ];
  } else if (insights.adherenceRate < 40) {
    priority = 'important';
    summary = 'Your adherence rate is low. Focus on following recommendations to see better results.';
    actions = [
      'Start with one recommendation at a time',
      'Set reminders for key actions',
      'Track what makes adherence easier for you',
      'Celebrate small wins to build momentum',
    ];
  } else if (insights.topEffective.length > 0) {
    const topRec = insights.topEffective[0];
    priority = 'important';
    summary = `Your data shows ${topRec.recommendationType} recommendations are ${Math.round(topRec.effectiveness * 100)}% effective for you. Continue this approach.`;
    actions = [
      `Prioritize ${topRec.recommendationType} recommendations`,
      'Maintain your current adherence patterns',
      'Continue tracking outcomes',
      'Build on what works for you',
    ];
  } else {
    priority = 'optimization';
    summary = 'Your adaptive intelligence is learning your patterns. Continue following recommendations.';
    actions = [
      'Maintain consistent adherence',
      'Track outcomes after each recommendation',
      'Note which recommendations feel most effective',
      'Continue building your health data',
    ];
  }

  return {
    type: 'adaptive',
    priority,
    summary,
    actions,
    source: 'fallback',
  };
}

export async function getAdaptiveToday(
  userId: string,
  options?: { regenerate?: boolean }
): Promise<AdaptiveRecord> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = adaptiveStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 Returning cached adaptive record', { userId, date });
    return existing;
  }

  logger.info('🔵 Starting adaptive intelligence analysis', { userId });

  // Step 1: Calculate effectiveness scores
  const effectivenessScores = calculateAllEffectiveness(userId);

  logger.info('📊 Effectiveness scores calculated', {
    userId,
    scoreCount: effectivenessScores.length,
  });

  // Step 2: Identify user patterns
  const userPatterns = identifyUserPatterns(userId);

  logger.info('📊 User patterns identified', {
    userId,
    patternCount: userPatterns.length,
  });

  // Step 3: Build fallback recommendation
  const fallbackRecommendation = buildAdaptiveFallbackRecommendation(
    userId,
    effectivenessScores,
    userPatterns
  );

  // Step 4: AI enrichment (if enabled and sufficient data)
  const useAI = process.env.USE_AI_ENRICHMENT === 'true' && 
                process.env.USE_AI_ENRICHMENT_ADAPTIVE === 'true' &&
                effectivenessScores.some(s => s.sampleSize >= 3);

  let finalRecommendation = fallbackRecommendation;

  if (useAI) {
    logger.info('🟢 AI enrichment enabled for adaptive recommendation', {
      userId,
      sufficientData: true,
    });

    // AI enrichment would be called here
    // For now, using fallback
    logger.info('ℹ️  Using fallback adaptive recommendation', {
      userId,
      reason: 'AI enrichment placeholder',
    });
  } else {
    logger.info('ℹ️  Using fallback adaptive recommendation', {
      userId,
      reason: !useAI ? 'AI disabled or insufficient data' : 'unknown',
    });
  }

  // Step 5: Create record
  const record: AdaptiveRecord = {
    id: randomUUID(),
    userId,
    date,
    effectiveness: effectivenessScores,
    userPatterns,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
  };

  // Step 6: Store record
  const history = adaptiveStore.get(userId) ?? [];
  adaptiveStore.set(userId, [record, ...history]);

  logger.info('✅ Adaptive intelligence analysis complete', {
    userId,
    effectivenessScoreCount: effectivenessScores.length,
    patternCount: userPatterns.length,
    priority: finalRecommendation.priority,
    source: finalRecommendation.source,
  });

  return record;
}

export async function getAdaptiveHistory(userId: string): Promise<AdaptiveRecord[]> {
  return adaptiveStore.get(userId) ?? [];
}

export function getAdaptiveContext(userId: string) {
  const effectivenessScores = getEffectivenessScores(userId);
  const recentOutcomes = getAdherenceHistory(userId).slice(-10);
  const userPatterns = identifyUserPatterns(userId);

  return {
    userId,
    effectivenessScores,
    recentOutcomes,
    userPatterns,
  };
}

import { randomUUID } from 'crypto';
import { collectAllRecommendations } from './recommendationCollectorService';
import { deduplicateRecommendations } from './recommendationDeduplicationService';
import { resolveConflicts } from './recommendationConflictResolver';
import { scoreRecommendations } from './recommendationScoringService';
import { enhanceRecommendationsWithFusion } from './fusionPrioritizationEnhancer';
import { logger } from '../utils/logger';
import type { PrioritizationResult, PrioritizedRecommendation } from '../types/recommendationPrioritization';

const prioritizationStore = new Map<string, PrioritizationResult[]>();

function extractRecommendations(input: any): PrioritizedRecommendation[] {
  const recommendations: PrioritizedRecommendation[] = [];

  if (input.recovery?.recommendation) {
    recommendations.push({
      id: randomUUID(),
      source: 'Recovery',
      sourceEngine: 'recovery',
      priority: input.recovery.recommendation.priority || 'important',
      summary: input.recovery.recommendation.summary || '',
      rationale: input.recovery.recommendation.rationale,
      actions: input.recovery.recommendation.actions || [],
      score: 0,
      createdAt: input.recovery.createdAt,
    });
  }

  if (input.stress?.recommendation) {
    recommendations.push({
      id: randomUUID(),
      source: 'Stress',
      sourceEngine: 'stress',
      priority: input.stress.recommendation.priority || 'important',
      summary: input.stress.recommendation.summary || '',
      rationale: input.stress.recommendation.rationale,
      actions: input.stress.recommendation.actions || [],
      score: 0,
      createdAt: input.stress.createdAt,
    });
  }

  if (input.joint?.recommendation) {
    recommendations.push({
      id: randomUUID(),
      source: 'Joint',
      sourceEngine: 'joint_health',
      priority: input.joint.recommendation.priority || 'important',
      summary: input.joint.recommendation.summary || '',
      rationale: input.joint.recommendation.rationale,
      actions: input.joint.recommendation.actions || [],
      score: 0,
      createdAt: input.joint.createdAt,
    });
  }

  if (input.crossEngine?.recommendation) {
    recommendations.push({
      id: randomUUID(),
      source: 'Cross-Engine',
      sourceEngine: 'holistic',
      priority: input.crossEngine.recommendation.priority || 'important',
      summary: input.crossEngine.recommendation.summary || '',
      rationale: input.crossEngine.recommendation.rationale,
      actions: input.crossEngine.recommendation.actions || [],
      score: 0,
      createdAt: input.crossEngine.createdAt,
    });
  }

  if (input.predictive?.recommendation) {
    recommendations.push({
      id: randomUUID(),
      source: 'Predictive',
      sourceEngine: 'predictive',
      priority: input.predictive.recommendation.priority || 'important',
      summary: input.predictive.recommendation.summary || '',
      rationale: input.predictive.recommendation.rationale,
      actions: input.predictive.recommendation.actions || [],
      score: 0,
      createdAt: input.predictive.createdAt,
    });
  }

  return recommendations;
}

export async function getPrioritizedRecommendations(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<PrioritizationResult> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = prioritizationStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    logger.info('📋 Returning cached prioritization', { userId, date });
    return existing;
  }

  logger.info('🔵 Starting recommendation prioritization', { userId });

  // Step 1: Collect recommendations from all engines
  const input = await collectAllRecommendations(userId);

  // Step 2: Extract recommendations
  const rawRecommendations = extractRecommendations(input);

  logger.info('📊 Extracted recommendations', {
    userId,
    count: rawRecommendations.length,
  });

  if (rawRecommendations.length === 0) {
    logger.warn('⚠️  No recommendations to prioritize', { userId });
    
    const emptyResult: PrioritizationResult = {
      topPriorities: [],
      allRecommendations: [],
      userId,
      date,
      createdAt: new Date().toISOString(),
    };

    const history = prioritizationStore.get(userId) ?? [];
    prioritizationStore.set(userId, [emptyResult, ...history]);

    return emptyResult;
  }

  // Step 3: Deduplicate
  const deduplicated = deduplicateRecommendations(rawRecommendations);

  // Step 4: Resolve conflicts
  const conflictResolved = resolveConflicts(deduplicated);

  // Step 5: Score
  const scored = scoreRecommendations(conflictResolved);

  // Step 6: Enhance with fusion intelligence (additive)
  const fusionEnhanced = await enhanceRecommendationsWithFusion(userId, scored);

  logger.info('✅ [PRIORITIZATION] Fusion enhancement applied', {
    userId,
    enhancedCount: fusionEnhanced.filter((r: any) => r.fusionInfluence).length,
  });

  // Step 7: Sort descending by score (now includes fusion adjustments)
  const sorted = fusionEnhanced.sort((a, b) => b.score - a.score);

  // Step 8: Select Top 3
  const topPriorities = sorted.slice(0, 3);

  logger.info('✅ Prioritization complete', {
    userId,
    totalRecommendations: sorted.length,
    topPrioritiesCount: topPriorities.length,
    topScores: topPriorities.map(r => r.score),
    fusionInfluenced: topPriorities.filter((r: any) => r.fusionInfluence).length,
  });

  const result: PrioritizationResult = {
    topPriorities,
    allRecommendations: sorted,
    userId,
    date,
    createdAt: new Date().toISOString(),
  };

  // Store result
  const history = prioritizationStore.get(userId) ?? [];
  prioritizationStore.set(userId, [result, ...history]);

  return result;
}

export async function getPrioritizationHistory(userId: string): Promise<PrioritizationResult[]> {
  return prioritizationStore.get(userId) ?? [];
}

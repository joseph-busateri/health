import type { CardiovascularRecommendation } from '../types/cardiovascularEngine';
import { logger } from '../utils/logger';

export function normalizeCardiovascularRecommendation(
  recommendation: CardiovascularRecommendation,
): CardiovascularRecommendation {
  logger.info('🔧 [CARDIOVASCULAR NORMALIZER] Normalizing recommendation');

  const normalized: CardiovascularRecommendation = {
    type: 'cardiovascular',
    priority: recommendation.priority || 'optimization',
    summary: recommendation.summary?.trim() || 'Cardiovascular recommendation generated',
    actions: recommendation.actions && recommendation.actions.length > 0
      ? recommendation.actions.map(action => action.trim()).filter(action => action.length > 0)
      : ['Monitor cardiovascular health'],
    rationale: recommendation.rationale?.trim(),
    source: recommendation.source || 'deterministic',
  };

  logger.info('✅ [CARDIOVASCULAR NORMALIZER] Normalization complete', {
    priority: normalized.priority,
    actionCount: normalized.actions.length,
    source: normalized.source,
  });

  return normalized;
}

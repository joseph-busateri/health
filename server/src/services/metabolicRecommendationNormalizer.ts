import type { MetabolicRecommendation } from '../types/metabolicEngine';
import { logger } from '../utils/logger';

export function normalizeMetabolicRecommendation(
  recommendation: MetabolicRecommendation,
): MetabolicRecommendation {
  logger.info('🔧 [METABOLIC NORMALIZER] Normalizing recommendation');

  const normalized: MetabolicRecommendation = {
    type: 'metabolic',
    priority: recommendation.priority || 'optimization',
    summary: recommendation.summary?.trim() || 'Metabolic recommendation generated',
    actions: recommendation.actions && recommendation.actions.length > 0
      ? recommendation.actions.map(action => action.trim()).filter(action => action.length > 0)
      : ['Monitor metabolic health'],
    rationale: recommendation.rationale?.trim(),
    source: recommendation.source || 'deterministic',
  };

  logger.info('✅ [METABOLIC NORMALIZER] Normalization complete', {
    priority: normalized.priority,
    actionCount: normalized.actions.length,
    source: normalized.source,
  });

  return normalized;
}

import type { SexualHealthRecommendation } from '../types/sexualHealthEngine';
import { logger } from '../utils/logger';

export function normalizeSexualHealthRecommendation(
  recommendation: SexualHealthRecommendation,
): SexualHealthRecommendation {
  logger.info('🔧 [SEXUAL HEALTH NORMALIZER] Normalizing recommendation');

  const normalized: SexualHealthRecommendation = {
    type: 'sexual_health',
    priority: recommendation.priority || 'optimization',
    summary: recommendation.summary?.trim() || 'Sexual health recommendation generated',
    actions: recommendation.actions && recommendation.actions.length > 0
      ? recommendation.actions.map(action => action.trim()).filter(action => action.length > 0)
      : ['Monitor sexual health and recovery'],
    rationale: recommendation.rationale?.trim(),
    source: recommendation.source || 'deterministic',
  };

  logger.info('✅ [SEXUAL HEALTH NORMALIZER] Normalization complete', {
    priority: normalized.priority,
    actionCount: normalized.actions.length,
    source: normalized.source,
  });

  return normalized;
}

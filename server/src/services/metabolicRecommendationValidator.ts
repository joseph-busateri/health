import type { MetabolicRecommendation } from '../types/metabolicEngine';
import { logger } from '../utils/logger';

export function validateMetabolicRecommendation(
  recommendation: MetabolicRecommendation,
): boolean {
  logger.info('✓ [METABOLIC VALIDATOR] Validating recommendation');

  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    logger.warn('⚠️ [METABOLIC VALIDATOR] Missing summary');
    return false;
  }

  if (!recommendation.actions || recommendation.actions.length === 0) {
    logger.warn('⚠️ [METABOLIC VALIDATOR] Missing actions');
    return false;
  }

  if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
    logger.warn('⚠️ [METABOLIC VALIDATOR] Invalid priority');
    return false;
  }

  logger.info('✅ [METABOLIC VALIDATOR] Validation passed');
  return true;
}

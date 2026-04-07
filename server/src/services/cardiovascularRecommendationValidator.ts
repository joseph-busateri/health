import type { CardiovascularRecommendation } from '../types/cardiovascularEngine';
import { logger } from '../utils/logger';

export function validateCardiovascularRecommendation(
  recommendation: CardiovascularRecommendation,
): boolean {
  logger.info('✓ [CARDIOVASCULAR VALIDATOR] Validating recommendation');

  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    logger.warn('⚠️ [CARDIOVASCULAR VALIDATOR] Missing summary');
    return false;
  }

  if (!recommendation.actions || recommendation.actions.length === 0) {
    logger.warn('⚠️ [CARDIOVASCULAR VALIDATOR] Missing actions');
    return false;
  }

  if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
    logger.warn('⚠️ [CARDIOVASCULAR VALIDATOR] Invalid priority');
    return false;
  }

  logger.info('✅ [CARDIOVASCULAR VALIDATOR] Validation passed');
  return true;
}

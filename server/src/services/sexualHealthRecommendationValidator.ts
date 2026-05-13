import type { SexualHealthRecommendation } from '../types/sexualHealthEngine';
import { logger } from '../utils/logger';

export function validateSexualHealthRecommendation(
  recommendation: SexualHealthRecommendation,
): boolean {
  logger.info('✓ [SEXUAL HEALTH VALIDATOR] Validating recommendation');

  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    logger.warn('⚠️ [SEXUAL HEALTH VALIDATOR] Missing summary');
    return false;
  }

  if (!recommendation.actions || recommendation.actions.length === 0) {
    logger.warn('⚠️ [SEXUAL HEALTH VALIDATOR] Missing actions');
    return false;
  }

  if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
    logger.warn('⚠️ [SEXUAL HEALTH VALIDATOR] Invalid priority');
    return false;
  }

  logger.info('✅ [SEXUAL HEALTH VALIDATOR] Validation passed');
  return true;
}

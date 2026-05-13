import { logger } from '../utils/logger';
import type { PredictiveRecommendation } from '../types/predictiveIntelligence';

export interface PredictiveValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePredictiveRecommendation(
  recommendation: PredictiveRecommendation,
): PredictiveValidationResult {
  const errors: string[] = [];

  if (!recommendation.type || recommendation.type !== 'predictive') {
    errors.push('Invalid or missing type (must be "predictive")');
  }

  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    errors.push('Summary is required and cannot be empty');
  }

  if (!recommendation.priority) {
    errors.push('Priority is required');
  } else if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
    errors.push(`Invalid priority: ${recommendation.priority}`);
  }

  if (!Array.isArray(recommendation.actions)) {
    errors.push('Actions must be an array');
  } else if (recommendation.actions.length === 0) {
    errors.push('Actions array cannot be empty');
  }

  if (recommendation.source && !['ai_enriched', 'fallback'].includes(recommendation.source)) {
    errors.push(`Invalid source: ${recommendation.source}`);
  }

  const valid = errors.length === 0;

  if (!valid) {
    logger.warn('⚠️  Predictive recommendation validation failed', { errors });
  } else {
    logger.info('✅ Predictive recommendation validation passed');
  }

  return { valid, errors };
}

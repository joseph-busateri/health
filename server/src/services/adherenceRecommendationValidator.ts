import type { AdherenceRecommendation } from '../types/adherenceEngine';

export function validateAdherenceRecommendation(
  recommendation: AdherenceRecommendation,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!recommendation.summary || typeof recommendation.summary !== 'string' || recommendation.summary.trim().length === 0) {
    errors.push('summary must be a non-empty string');
  }

  if (!recommendation.note || typeof recommendation.note !== 'string' || recommendation.note.trim().length === 0) {
    errors.push('note must be a non-empty string');
  }

  if (recommendation.actions) {
    if (!Array.isArray(recommendation.actions)) {
      errors.push('actions must be an array');
    } else if (recommendation.actions.length === 0) {
      errors.push('actions array must have at least 1 item');
    }
  }

  if (recommendation.priority) {
    if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
      errors.push('priority must be one of: critical, important, optimization');
    }
  }

  if (recommendation.type && recommendation.type !== 'adherence') {
    errors.push('type must be "adherence"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

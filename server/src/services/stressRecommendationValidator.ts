/**
 * Stress Recommendation Validator
 * 
 * Mirrors Recovery Engine validation architecture.
 * Validates stress recommendations before persistence.
 */

import type { StressRecommendation } from '../types/stressEngine';

export interface StressValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate stress recommendation
 */
export function validateStressRecommendation(
  rec: StressRecommendation
): StressValidationResult {
  const errors: string[] = [];

  if (!rec || typeof rec !== 'object') {
    return {
      valid: false,
      errors: ['Recommendation is missing or invalid'],
    };
  }

  if (!rec.summary || typeof rec.summary !== 'string' || rec.summary.trim().length === 0) {
    errors.push('summary is required and must be a non-empty string');
  }

  if (!Array.isArray(rec.actions) || rec.actions.length === 0) {
    errors.push('actions is required and must be a non-empty array');
  }

  if (rec.priority && !['critical', 'important', 'optimization'].includes(rec.priority)) {
    errors.push('priority must be critical, important, or optimization');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Actuarial Recommendation Normalizer
 * Ensures recommendation data quality and consistency
 */

import type { ActuarialRecommendation } from '../types/actuarialRiskEngine';

/**
 * Normalize actuarial recommendation
 * Ensures all fields are properly formatted and valid
 */
export function normalizeActuarialRecommendation(
  recommendation: ActuarialRecommendation
): ActuarialRecommendation {
  return {
    type: 'actuarial_risk',
    priority: recommendation.priority || 'important',
    summary: recommendation.summary?.trim() || 'No summary provided',
    actions: Array.isArray(recommendation.actions)
      ? recommendation.actions.filter(a => a && a.trim().length > 0)
      : [],
    riskReductionPotential: Math.max(0, Math.min(100, recommendation.riskReductionPotential || 0)),
    primaryRiskDrivers: Array.isArray(recommendation.primaryRiskDrivers)
      ? recommendation.primaryRiskDrivers.filter(d => d && d.trim().length > 0)
      : [],
    preventionStrategies: Array.isArray(recommendation.preventionStrategies)
      ? recommendation.preventionStrategies.filter(s => s && s.trim().length > 0)
      : [],
    rationale: recommendation.rationale?.trim() || undefined,
    source: recommendation.source || 'deterministic',
  };
}

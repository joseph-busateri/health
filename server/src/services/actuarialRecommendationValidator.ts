/**
 * Actuarial Recommendation Validator
 * Validates recommendation structure and content
 */

import type { ActuarialRecommendation } from '../types/actuarialRiskEngine';

/**
 * Validate actuarial recommendation
 * Returns true if recommendation is valid, false otherwise
 */
export function validateActuarialRecommendation(
  recommendation: ActuarialRecommendation
): boolean {
  // Validate type
  if (recommendation.type !== 'actuarial_risk') {
    return false;
  }

  // Validate priority
  const validPriorities = ['critical', 'important', 'optimization'];
  if (!validPriorities.includes(recommendation.priority)) {
    return false;
  }

  // Validate summary
  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    return false;
  }

  // Validate actions
  if (!Array.isArray(recommendation.actions) || recommendation.actions.length === 0) {
    return false;
  }

  // Validate risk reduction potential
  if (
    typeof recommendation.riskReductionPotential !== 'number' ||
    recommendation.riskReductionPotential < 0 ||
    recommendation.riskReductionPotential > 100
  ) {
    return false;
  }

  // Validate primary risk drivers
  if (!Array.isArray(recommendation.primaryRiskDrivers)) {
    return false;
  }

  // Validate prevention strategies
  if (!Array.isArray(recommendation.preventionStrategies)) {
    return false;
  }

  // Validate source
  const validSources = ['deterministic', 'ai_enriched', 'fallback'];
  if (!validSources.includes(recommendation.source)) {
    return false;
  }

  return true;
}

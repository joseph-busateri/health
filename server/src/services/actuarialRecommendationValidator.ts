/**
 * Actuarial Recommendation Validator
 * Validates recommendation structure and content
 * 
 * Responsibilities:
 * - Validate all required fields are present
 * - Validate field types and formats
 * - Validate business rules
 * - Validate data consistency
 * - Provide detailed error messages
 */

import { logger } from '../utils/logger';
import type { ActuarialRecommendation } from '../types/actuarialRiskEngine';

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_SUMMARY_LENGTH = 10;
const MAX_SUMMARY_LENGTH = 500;
const MIN_ACTION_LENGTH = 5;
const MAX_ACTION_LENGTH = 200;
const MIN_ACTIONS_COUNT = 1;
const MAX_ACTIONS_COUNT = 20;
const MAX_RATIONALE_LENGTH = 1000;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate actuarial recommendation
 * Returns true if recommendation is valid, false otherwise
 */
export function validateActuarialRecommendation(
  recommendation: ActuarialRecommendation
): boolean {
  const result = validateActuarialRecommendationDetailed(recommendation);
  
  if (!result.isValid) {
    logger.warn('⚠️ [VALIDATOR] Recommendation validation failed', {
      errors: result.errors,
    });
  }
  
  return result.isValid;
}

/**
 * Validate actuarial recommendation with detailed error messages
 * Returns validation result with specific error messages
 */
export function validateActuarialRecommendationDetailed(
  recommendation: ActuarialRecommendation
): ValidationResult {
  const errors: string[] = [];

  // Validate type
  if (!recommendation.type) {
    errors.push('Missing required field: type');
  } else if (recommendation.type !== 'actuarial_risk') {
    errors.push(`Invalid type: expected "actuarial_risk", got "${recommendation.type}"`);
  }

  // Validate priority
  const validPriorities = ['critical', 'important', 'optimization'];
  if (!recommendation.priority) {
    errors.push('Missing required field: priority');
  } else if (!validPriorities.includes(recommendation.priority)) {
    errors.push(`Invalid priority: must be one of ${validPriorities.join(', ')}`);
  }

  // Validate summary
  if (!recommendation.summary) {
    errors.push('Missing required field: summary');
  } else {
    const summaryLength = recommendation.summary.trim().length;
    if (summaryLength === 0) {
      errors.push('Summary cannot be empty');
    } else if (summaryLength < MIN_SUMMARY_LENGTH) {
      errors.push(`Summary too short: minimum ${MIN_SUMMARY_LENGTH} characters`);
    } else if (summaryLength > MAX_SUMMARY_LENGTH) {
      errors.push(`Summary too long: maximum ${MAX_SUMMARY_LENGTH} characters`);
    }
  }

  // Validate actions
  if (!recommendation.actions) {
    errors.push('Missing required field: actions');
  } else if (!Array.isArray(recommendation.actions)) {
    errors.push('Actions must be an array');
  } else {
    if (recommendation.actions.length < MIN_ACTIONS_COUNT) {
      errors.push(`Too few actions: minimum ${MIN_ACTIONS_COUNT} required`);
    } else if (recommendation.actions.length > MAX_ACTIONS_COUNT) {
      errors.push(`Too many actions: maximum ${MAX_ACTIONS_COUNT} allowed`);
    }

    // Validate each action
    recommendation.actions.forEach((action, index) => {
      if (typeof action !== 'string') {
        errors.push(`Action ${index + 1} must be a string`);
      } else {
        const actionLength = action.trim().length;
        if (actionLength === 0) {
          errors.push(`Action ${index + 1} cannot be empty`);
        } else if (actionLength < MIN_ACTION_LENGTH) {
          errors.push(`Action ${index + 1} too short: minimum ${MIN_ACTION_LENGTH} characters`);
        } else if (actionLength > MAX_ACTION_LENGTH) {
          errors.push(`Action ${index + 1} too long: maximum ${MAX_ACTION_LENGTH} characters`);
        }
      }
    });

    // Check for duplicate actions
    const uniqueActions = new Set(recommendation.actions.map(a => a.trim().toLowerCase()));
    if (uniqueActions.size < recommendation.actions.length) {
      errors.push('Duplicate actions detected');
    }
  }

  // Validate risk reduction potential
  if (recommendation.riskReductionPotential === undefined || recommendation.riskReductionPotential === null) {
    errors.push('Missing required field: riskReductionPotential');
  } else if (typeof recommendation.riskReductionPotential !== 'number') {
    errors.push('Risk reduction potential must be a number');
  } else if (isNaN(recommendation.riskReductionPotential)) {
    errors.push('Risk reduction potential cannot be NaN');
  } else if (recommendation.riskReductionPotential < 0) {
    errors.push('Risk reduction potential cannot be negative');
  } else if (recommendation.riskReductionPotential > 100) {
    errors.push('Risk reduction potential cannot exceed 100%');
  } else if (!Number.isInteger(recommendation.riskReductionPotential)) {
    errors.push('Risk reduction potential must be an integer');
  }

  // Validate primary risk drivers
  if (!recommendation.primaryRiskDrivers) {
    errors.push('Missing required field: primaryRiskDrivers');
  } else if (!Array.isArray(recommendation.primaryRiskDrivers)) {
    errors.push('Primary risk drivers must be an array');
  } else {
    recommendation.primaryRiskDrivers.forEach((driver, index) => {
      if (typeof driver !== 'string') {
        errors.push(`Risk driver ${index + 1} must be a string`);
      } else if (driver.trim().length === 0) {
        errors.push(`Risk driver ${index + 1} cannot be empty`);
      }
    });
  }

  // Validate prevention strategies
  if (!recommendation.preventionStrategies) {
    errors.push('Missing required field: preventionStrategies');
  } else if (!Array.isArray(recommendation.preventionStrategies)) {
    errors.push('Prevention strategies must be an array');
  } else {
    recommendation.preventionStrategies.forEach((strategy, index) => {
      if (typeof strategy !== 'string') {
        errors.push(`Prevention strategy ${index + 1} must be a string`);
      } else if (strategy.trim().length === 0) {
        errors.push(`Prevention strategy ${index + 1} cannot be empty`);
      }
    });
  }

  // Validate rationale (optional field)
  if (recommendation.rationale !== undefined) {
    if (typeof recommendation.rationale !== 'string') {
      errors.push('Rationale must be a string');
    } else if (recommendation.rationale.trim().length > MAX_RATIONALE_LENGTH) {
      errors.push(`Rationale too long: maximum ${MAX_RATIONALE_LENGTH} characters`);
    }
  }

  // Validate source
  const validSources = ['deterministic', 'ai_enriched', 'fallback'];
  if (!recommendation.source) {
    errors.push('Missing required field: source');
  } else if (!validSources.includes(recommendation.source)) {
    errors.push(`Invalid source: must be one of ${validSources.join(', ')}`);
  }

  // Business rule validations
  validateBusinessRules(recommendation, errors);

  const isValid = errors.length === 0;

  if (isValid) {
    logger.info('✅ [VALIDATOR] Recommendation validation passed');
  } else {
    logger.warn('❌ [VALIDATOR] Recommendation validation failed', {
      errorCount: errors.length,
      errors: errors.slice(0, 5), // Log first 5 errors
    });
  }

  return {
    isValid,
    errors,
  };
}

/**
 * Validate business rules
 */
function validateBusinessRules(
  recommendation: ActuarialRecommendation,
  errors: string[]
): void {
  // Rule 1: Critical priority should have high risk reduction potential
  if (recommendation.priority === 'critical' && recommendation.riskReductionPotential < 20) {
    errors.push('Critical priority recommendations should have risk reduction potential >= 20%');
  }

  // Rule 2: Optimization priority should have lower risk reduction potential
  if (recommendation.priority === 'optimization' && recommendation.riskReductionPotential > 30) {
    errors.push('Optimization priority recommendations should have risk reduction potential <= 30%');
  }

  // Rule 3: Critical priority should have more actions
  if (recommendation.priority === 'critical' && recommendation.actions.length < 3) {
    errors.push('Critical priority recommendations should have at least 3 actions');
  }

  // Rule 4: Should have at least one primary risk driver for important/critical
  if (
    (recommendation.priority === 'critical' || recommendation.priority === 'important') &&
    recommendation.primaryRiskDrivers.length === 0
  ) {
    errors.push('Important/critical recommendations should identify at least one primary risk driver');
  }

  // Rule 5: Should have prevention strategies for all priorities
  if (recommendation.preventionStrategies.length === 0) {
    errors.push('All recommendations should include at least one prevention strategy');
  }

  // Rule 6: AI-enriched recommendations should have rationale
  if (recommendation.source === 'ai_enriched' && !recommendation.rationale) {
    logger.warn('⚠️ [VALIDATOR] AI-enriched recommendation missing rationale (recommended but not required)');
  }
}

/**
 * Validate recommendation field by field (for debugging)
 */
export function validateRecommendationFields(
  recommendation: Partial<ActuarialRecommendation>
): Record<string, boolean> {
  return {
    type: recommendation.type === 'actuarial_risk',
    priority: ['critical', 'important', 'optimization'].includes(recommendation.priority as string),
    summary: !!recommendation.summary && recommendation.summary.trim().length >= MIN_SUMMARY_LENGTH,
    actions: Array.isArray(recommendation.actions) && recommendation.actions.length >= MIN_ACTIONS_COUNT,
    riskReductionPotential:
      typeof recommendation.riskReductionPotential === 'number' &&
      recommendation.riskReductionPotential >= 0 &&
      recommendation.riskReductionPotential <= 100,
    primaryRiskDrivers: Array.isArray(recommendation.primaryRiskDrivers),
    preventionStrategies: Array.isArray(recommendation.preventionStrategies),
    source: ['deterministic', 'ai_enriched', 'fallback'].includes(recommendation.source as string),
  };
}

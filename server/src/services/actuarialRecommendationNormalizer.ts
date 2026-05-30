/**
 * Actuarial Recommendation Normalizer
 * Ensures recommendation data quality and consistency
 * 
 * Responsibilities:
 * - Sanitize and normalize all text fields
 * - Ensure numeric values are within valid ranges
 * - Remove duplicates and empty values
 * - Apply consistent formatting
 * - Handle edge cases gracefully
 */

import { logger } from '../utils/logger';
import type { ActuarialRecommendation } from '../types/actuarialRiskEngine';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_SUMMARY_LENGTH = 500;
const MAX_ACTION_LENGTH = 200;
const MAX_RATIONALE_LENGTH = 1000;
const MAX_ACTIONS_COUNT = 20;
const MAX_RISK_DRIVERS_COUNT = 10;
const MAX_PREVENTION_STRATEGIES_COUNT = 10;

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize actuarial recommendation
 * Ensures all fields are properly formatted and valid
 */
export function normalizeActuarialRecommendation(
  recommendation: ActuarialRecommendation
): ActuarialRecommendation {
  logger.info('🔧 [NORMALIZER] Normalizing actuarial recommendation', {
    source: recommendation.source,
    priority: recommendation.priority,
  });

  const normalized: ActuarialRecommendation = {
    type: 'actuarial_risk',
    priority: normalizePriority(recommendation.priority),
    summary: normalizeSummary(recommendation.summary),
    actions: normalizeActions(recommendation.actions),
    riskReductionPotential: normalizeRiskReductionPotential(recommendation.riskReductionPotential),
    primaryRiskDrivers: normalizePrimaryRiskDrivers(recommendation.primaryRiskDrivers),
    preventionStrategies: normalizePreventionStrategies(recommendation.preventionStrategies),
    rationale: normalizeRationale(recommendation.rationale),
    source: normalizeSource(recommendation.source),
  };

  logger.info('✅ [NORMALIZER] Normalization complete', {
    actionCount: normalized.actions.length,
    riskDriverCount: normalized.primaryRiskDrivers.length,
    strategyCount: normalized.preventionStrategies.length,
  });

  return normalized;
}

/**
 * Normalize priority field
 */
function normalizePriority(
  priority: 'critical' | 'important' | 'optimization' | undefined
): 'critical' | 'important' | 'optimization' {
  const validPriorities: Array<'critical' | 'important' | 'optimization'> = [
    'critical',
    'important',
    'optimization',
  ];

  if (priority && validPriorities.includes(priority)) {
    return priority;
  }

  logger.warn('⚠️ [NORMALIZER] Invalid priority, defaulting to "important"', { priority });
  return 'important';
}

/**
 * Normalize summary field
 */
function normalizeSummary(summary: string | undefined): string {
  if (!summary || typeof summary !== 'string') {
    logger.warn('⚠️ [NORMALIZER] Missing or invalid summary');
    return 'No summary provided';
  }

  // Trim and remove extra whitespace
  let normalized = summary.trim().replace(/\s+/g, ' ');

  // Truncate if too long
  if (normalized.length > MAX_SUMMARY_LENGTH) {
    logger.warn('⚠️ [NORMALIZER] Summary too long, truncating', {
      original: normalized.length,
      max: MAX_SUMMARY_LENGTH,
    });
    normalized = normalized.substring(0, MAX_SUMMARY_LENGTH - 3) + '...';
  }

  // Ensure it's not empty after normalization
  if (normalized.length === 0) {
    return 'No summary provided';
  }

  return normalized;
}

/**
 * Normalize actions array
 */
function normalizeActions(actions: string[] | undefined): string[] {
  if (!Array.isArray(actions)) {
    logger.warn('⚠️ [NORMALIZER] Actions is not an array');
    return [];
  }

  // Filter, trim, and deduplicate
  const normalized = actions
    .filter(action => action && typeof action === 'string')
    .map(action => action.trim().replace(/\s+/g, ' '))
    .filter(action => action.length > 0)
    .map(action => {
      // Truncate if too long
      if (action.length > MAX_ACTION_LENGTH) {
        return action.substring(0, MAX_ACTION_LENGTH - 3) + '...';
      }
      return action;
    })
    .filter((action, index, self) => self.indexOf(action) === index); // Remove duplicates

  // Limit count
  if (normalized.length > MAX_ACTIONS_COUNT) {
    logger.warn('⚠️ [NORMALIZER] Too many actions, limiting', {
      original: normalized.length,
      max: MAX_ACTIONS_COUNT,
    });
    return normalized.slice(0, MAX_ACTIONS_COUNT);
  }

  return normalized;
}

/**
 * Normalize risk reduction potential
 */
function normalizeRiskReductionPotential(potential: number | undefined): number {
  if (typeof potential !== 'number' || isNaN(potential)) {
    logger.warn('⚠️ [NORMALIZER] Invalid risk reduction potential, defaulting to 0', {
      potential,
    });
    return 0;
  }

  // Clamp to 0-100 range
  const clamped = Math.max(0, Math.min(100, Math.round(potential)));

  if (clamped !== potential) {
    logger.warn('⚠️ [NORMALIZER] Risk reduction potential clamped', {
      original: potential,
      clamped,
    });
  }

  return clamped;
}

/**
 * Normalize primary risk drivers
 */
function normalizePrimaryRiskDrivers(drivers: string[] | undefined): string[] {
  if (!Array.isArray(drivers)) {
    logger.warn('⚠️ [NORMALIZER] Primary risk drivers is not an array');
    return [];
  }

  const normalized = drivers
    .filter(driver => driver && typeof driver === 'string')
    .map(driver => driver.trim().replace(/\s+/g, ' '))
    .filter(driver => driver.length > 0)
    .filter((driver, index, self) => self.indexOf(driver) === index); // Remove duplicates

  // Limit count
  if (normalized.length > MAX_RISK_DRIVERS_COUNT) {
    logger.warn('⚠️ [NORMALIZER] Too many risk drivers, limiting', {
      original: normalized.length,
      max: MAX_RISK_DRIVERS_COUNT,
    });
    return normalized.slice(0, MAX_RISK_DRIVERS_COUNT);
  }

  return normalized;
}

/**
 * Normalize prevention strategies
 */
function normalizePreventionStrategies(strategies: string[] | undefined): string[] {
  if (!Array.isArray(strategies)) {
    logger.warn('⚠️ [NORMALIZER] Prevention strategies is not an array');
    return [];
  }

  const normalized = strategies
    .filter(strategy => strategy && typeof strategy === 'string')
    .map(strategy => strategy.trim().replace(/\s+/g, ' '))
    .filter(strategy => strategy.length > 0)
    .filter((strategy, index, self) => self.indexOf(strategy) === index); // Remove duplicates

  // Limit count
  if (normalized.length > MAX_PREVENTION_STRATEGIES_COUNT) {
    logger.warn('⚠️ [NORMALIZER] Too many prevention strategies, limiting', {
      original: normalized.length,
      max: MAX_PREVENTION_STRATEGIES_COUNT,
    });
    return normalized.slice(0, MAX_PREVENTION_STRATEGIES_COUNT);
  }

  return normalized;
}

/**
 * Normalize rationale field
 */
function normalizeRationale(rationale: string | undefined): string | undefined {
  if (!rationale || typeof rationale !== 'string') {
    return undefined;
  }

  // Trim and remove extra whitespace
  let normalized = rationale.trim().replace(/\s+/g, ' ');

  // Truncate if too long
  if (normalized.length > MAX_RATIONALE_LENGTH) {
    logger.warn('⚠️ [NORMALIZER] Rationale too long, truncating', {
      original: normalized.length,
      max: MAX_RATIONALE_LENGTH,
    });
    normalized = normalized.substring(0, MAX_RATIONALE_LENGTH - 3) + '...';
  }

  // Return undefined if empty after normalization
  if (normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

/**
 * Normalize source field
 */
function normalizeSource(
  source: 'deterministic' | 'ai_enriched' | 'fallback' | undefined
): 'deterministic' | 'ai_enriched' | 'fallback' {
  const validSources: Array<'deterministic' | 'ai_enriched' | 'fallback'> = [
    'deterministic',
    'ai_enriched',
    'fallback',
  ];

  if (source && validSources.includes(source)) {
    return source;
  }

  logger.warn('⚠️ [NORMALIZER] Invalid source, defaulting to "deterministic"', { source });
  return 'deterministic';
}

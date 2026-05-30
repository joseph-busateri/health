import { logger } from '../utils/logger';
import type { AutonomousPlan } from '../types/autonomousOptimization';

export interface AutonomousValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAutonomousPlan(plan: AutonomousPlan): AutonomousValidationResult {
  const errors: string[] = [];

  if (!plan.summary || plan.summary.trim().length === 0) {
    errors.push('Summary is required and cannot be empty');
  }

  if (!plan.priority) {
    errors.push('Priority is required');
  } else if (!['critical', 'important', 'optimization'].includes(plan.priority)) {
    errors.push(`Invalid priority: ${plan.priority}`);
  }

  if (!Array.isArray(plan.adjustments)) {
    errors.push('Adjustments must be an array');
  } else if (plan.adjustments.length === 0) {
    errors.push('Adjustments array cannot be empty');
  } else {
    // Validate each adjustment
    plan.adjustments.forEach((adj, index) => {
      if (!adj.category) {
        errors.push(`Adjustment ${index}: category is required`);
      }
      if (!adj.adjustment || adj.adjustment.trim().length === 0) {
        errors.push(`Adjustment ${index}: adjustment text is required`);
      }
      if (!adj.rationale || adj.rationale.trim().length === 0) {
        errors.push(`Adjustment ${index}: rationale is required`);
      }
      if (!adj.priority || !['critical', 'important', 'optimization'].includes(adj.priority)) {
        errors.push(`Adjustment ${index}: invalid priority`);
      }
    });
  }

  if (plan.source && !['ai_enriched', 'fallback'].includes(plan.source)) {
    errors.push(`Invalid source: ${plan.source}`);
  }

  const valid = errors.length === 0;

  if (!valid) {
    logger.warn('⚠️  Autonomous plan validation failed', { errors });
  } else {
    logger.info('✅ Autonomous plan validation passed');
  }

  return { valid, errors };
}

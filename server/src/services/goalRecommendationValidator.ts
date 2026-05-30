import { logger } from '../utils/logger';
import type { GoalDrivenPlan } from '../types/goalOptimization';

export interface GoalValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGoalPlan(plan: GoalDrivenPlan): GoalValidationResult {
  const errors: string[] = [];

  if (!plan.summary || plan.summary.trim().length === 0) {
    errors.push('Summary is required and cannot be empty');
  }

  if (!Array.isArray(plan.adjustments)) {
    errors.push('Adjustments must be an array');
  } else {
    // Validate each adjustment
    plan.adjustments.forEach((adj, index) => {
      if (!adj.goal) {
        errors.push(`Adjustment ${index}: goal is required`);
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
      if (!adj.impact || !['high', 'medium', 'low'].includes(adj.impact)) {
        errors.push(`Adjustment ${index}: invalid impact`);
      }
    });
  }

  if (plan.goalAlignment !== undefined && (plan.goalAlignment < 0 || plan.goalAlignment > 100)) {
    errors.push('Goal alignment must be between 0 and 100');
  }

  if (plan.source && !['ai_enriched', 'fallback'].includes(plan.source)) {
    errors.push(`Invalid source: ${plan.source}`);
  }

  const valid = errors.length === 0;

  if (!valid) {
    logger.warn('⚠️  Goal-driven plan validation failed', { errors });
  } else {
    logger.info('✅ Goal-driven plan validation passed');
  }

  return { valid, errors };
}

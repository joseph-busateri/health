import type { JointRecommendation } from '../types/jointHealthEngine';

export interface JointValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJointRecommendation(
  recommendation: JointRecommendation,
): JointValidationResult {
  const errors: string[] = [];

  // Validate summary
  if (!recommendation.summary || typeof recommendation.summary !== 'string') {
    errors.push('summary is required and must be a non-empty string');
  } else if (recommendation.summary.trim().length === 0) {
    errors.push('summary cannot be empty');
  }

  // Validate actions
  if (!Array.isArray(recommendation.actions)) {
    errors.push('actions must be an array');
  } else if (recommendation.actions.length === 0) {
    errors.push('actions must contain at least one item');
  } else {
    const invalidActions = recommendation.actions.filter(
      action => typeof action !== 'string' || action.trim().length === 0,
    );
    if (invalidActions.length > 0) {
      errors.push('all actions must be non-empty strings');
    }
  }

  // Validate priority
  if (recommendation.priority) {
    const validPriorities = ['critical', 'important', 'optimization'];
    if (!validPriorities.includes(recommendation.priority)) {
      errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
    }
  }

  // Validate type
  if (recommendation.type && recommendation.type !== 'joint') {
    errors.push('type must be "joint"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

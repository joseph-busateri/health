import type { WorkoutRecommendation } from '../types/workoutEngine';

export function validateWorkoutRecommendation(
  recommendation: WorkoutRecommendation,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!recommendation.summary || typeof recommendation.summary !== 'string' || recommendation.summary.trim().length === 0) {
    errors.push('summary must be a non-empty string');
  }

  if (!recommendation.actions || !Array.isArray(recommendation.actions)) {
    errors.push('actions must be an array');
  } else if (recommendation.actions.length === 0) {
    errors.push('actions array must have at least 1 item');
  }

  if (recommendation.priority) {
    if (!['critical', 'important', 'optimization'].includes(recommendation.priority)) {
      errors.push('priority must be one of: critical, important, optimization');
    }
  }

  if (recommendation.type && recommendation.type !== 'workout') {
    errors.push('type must be "workout"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

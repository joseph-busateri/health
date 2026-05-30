import type { SupplementRecommendationEnriched } from '../types/supplementEngine';

export function validateSupplementRecommendation(
  recommendation: SupplementRecommendationEnriched,
): boolean {
  if (!recommendation.summary || recommendation.summary.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(recommendation.actions) || recommendation.actions.length === 0) {
    return false;
  }

  const validPriorities = ['critical', 'important', 'optimization'];
  if (!validPriorities.includes(recommendation.priority)) {
    return false;
  }

  return true;
}

import type { CrossEngineRecommendation } from '../types/crossEngineIntelligence';

export function validateCrossEngineRecommendation(
  recommendation: CrossEngineRecommendation,
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

  if (recommendation.type !== 'cross_engine_intelligence') {
    return false;
  }

  return true;
}

import type { SupplementRecommendationEnriched } from '../types/supplementEngine';

export function normalizeSupplementRecommendation(
  recommendation: SupplementRecommendationEnriched,
): SupplementRecommendationEnriched {
  return {
    type: 'supplement',
    priority: recommendation.priority || 'optimization',
    summary: recommendation.summary?.trim() || 'Supplement optimization recommendation',
    actions: Array.isArray(recommendation.actions) && recommendation.actions.length > 0
      ? recommendation.actions
      : ['Review supplement stack'],
    rationale: recommendation.rationale?.trim(),
    source: recommendation.source || 'deterministic',
  };
}

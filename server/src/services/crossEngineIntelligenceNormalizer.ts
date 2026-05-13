import type { CrossEngineRecommendation } from '../types/crossEngineIntelligence';

export function normalizeCrossEngineRecommendation(
  recommendation: CrossEngineRecommendation,
): CrossEngineRecommendation {
  return {
    type: 'cross_engine_intelligence',
    priority: recommendation.priority || 'optimization',
    summary: recommendation.summary?.trim() || 'Cross-engine health orchestration recommendation',
    actions: Array.isArray(recommendation.actions) && recommendation.actions.length > 0
      ? recommendation.actions
      : ['Monitor health status across all domains'],
    rationale: recommendation.rationale?.trim(),
    source: recommendation.source || 'deterministic',
  };
}

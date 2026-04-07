import { logger } from '../utils/logger';
import type { GoalDrivenPlan } from '../types/goalOptimization';

function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function normalizeGoalAlignment(alignment?: number): number {
  if (alignment === undefined || alignment === null) return 50;
  if (alignment < 0) return 0;
  if (alignment > 100) return 100;
  return Math.round(alignment);
}

export function normalizeGoalPlan(
  rawOutput: any,
  fallback: GoalDrivenPlan,
): GoalDrivenPlan {
  logger.info('🔵 Normalizing goal-driven plan');

  const normalized: GoalDrivenPlan = {
    adjustments: fallback.adjustments, // Keep original adjustments
    summary: sanitizeText(rawOutput?.summary || fallback.summary),
    primaryGoal: rawOutput?.primaryGoal || fallback.primaryGoal,
    goalAlignment: normalizeGoalAlignment(rawOutput?.goalAlignment || fallback.goalAlignment),
    source: rawOutput?.source || 'ai_enriched',
  };

  logger.info('✅ Goal-driven plan normalized', {
    adjustmentCount: normalized.adjustments.length,
    primaryGoal: normalized.primaryGoal,
    goalAlignment: normalized.goalAlignment,
    summaryLength: normalized.summary.length,
    source: normalized.source,
  });

  return normalized;
}

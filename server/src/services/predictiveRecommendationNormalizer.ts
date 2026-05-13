import { logger } from '../utils/logger';
import type { PredictiveRecommendation } from '../types/predictiveIntelligence';

function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function normalizePriority(priority?: string): 'critical' | 'important' | 'optimization' {
  if (!priority) return 'important';
  
  const normalized = priority.toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'critical';
  if (normalized === 'important' || normalized === 'moderate') return 'important';
  if (normalized === 'optimization' || normalized === 'low') return 'optimization';
  
  return 'important';
}

function normalizeActions(actions?: string[]): string[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return ['Monitor trends and adjust as needed'];
  }
  
  return actions
    .filter(action => typeof action === 'string' && action.trim().length > 0)
    .map(action => sanitizeText(action))
    .slice(0, 5);
}

export function normalizePredictiveRecommendation(
  rawOutput: any,
  fallback: PredictiveRecommendation,
): PredictiveRecommendation {
  logger.info('🔵 Normalizing predictive recommendation');

  const normalized: PredictiveRecommendation = {
    type: 'predictive',
    priority: normalizePriority(rawOutput?.priority),
    summary: sanitizeText(rawOutput?.summary || fallback.summary),
    actions: normalizeActions(rawOutput?.actions),
    rationale: rawOutput?.rationale ? sanitizeText(rawOutput.rationale) : undefined,
    source: rawOutput?.source || 'ai_enriched',
  };

  logger.info('✅ Predictive recommendation normalized', {
    priority: normalized.priority,
    summaryLength: normalized.summary.length,
    actionCount: normalized.actions.length,
    hasRationale: !!normalized.rationale,
    source: normalized.source,
  });

  return normalized;
}

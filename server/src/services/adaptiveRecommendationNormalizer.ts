import { logger } from '../utils/logger';
import type { AdaptiveRecommendation } from '../types/adaptiveIntelligence';

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
    return ['Continue tracking metrics and following recommendations'];
  }
  
  return actions
    .filter(action => typeof action === 'string' && action.trim().length > 0)
    .map(action => sanitizeText(action))
    .slice(0, 5);
}

export function normalizeAdaptiveRecommendation(
  rawOutput: any,
  fallback: AdaptiveRecommendation,
): AdaptiveRecommendation {
  logger.info('🔵 Normalizing adaptive recommendation');

  const normalized: AdaptiveRecommendation = {
    type: 'adaptive',
    priority: normalizePriority(rawOutput?.priority),
    summary: sanitizeText(rawOutput?.summary || fallback.summary),
    actions: normalizeActions(rawOutput?.actions),
    rationale: rawOutput?.rationale ? sanitizeText(rawOutput.rationale) : undefined,
    source: rawOutput?.source || 'ai_enriched',
    adaptiveBoost: rawOutput?.adaptiveBoost,
  };

  logger.info('✅ Adaptive recommendation normalized', {
    priority: normalized.priority,
    summaryLength: normalized.summary.length,
    actionCount: normalized.actions.length,
    hasRationale: !!normalized.rationale,
    source: normalized.source,
  });

  return normalized;
}

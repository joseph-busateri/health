import type { CrossEngineRecommendation, CrossEnginePriority } from '../types/crossEngine';
import { logger } from '../utils/logger';

interface AICrossEngineOutput {
  priority?: string;
  summary?: string;
  rationale?: string;
  actions?: string[];
}

const isValidPriority = (value: unknown): value is CrossEnginePriority => {
  return value === 'critical' || value === 'important' || value === 'optimization';
};

const sanitizeText = (text: unknown): string => {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, 2000);
};

const sanitizeActions = (actions: unknown): string[] => {
  if (!Array.isArray(actions)) return [];
  return actions
    .filter(a => typeof a === 'string')
    .map(a => sanitizeText(a))
    .filter(a => a.length > 0)
    .slice(0, 10);
};

export function normalizeCrossEngineRecommendation(
  aiOutput: unknown,
  fallback: CrossEngineRecommendation,
): CrossEngineRecommendation {
  const output = aiOutput as AICrossEngineOutput;

  const priority = isValidPriority(output?.priority) ? output.priority : fallback.priority ?? 'important';
  const summary = sanitizeText(output?.summary) || fallback.summary;
  const rationale = sanitizeText(output?.rationale) || undefined;
  const actions = sanitizeActions(output?.actions);
  const finalActions = actions.length > 0 ? actions : fallback.actions;

  const normalized: CrossEngineRecommendation = {
    type: 'cross_engine',
    priority,
    summary,
    rationale,
    actions: finalActions,
    source: 'ai_enriched',
  };

  logger.info('Cross-Engine recommendation normalized', {
    priority: normalized.priority,
    hasRationale: !!normalized.rationale,
    actionCount: normalized.actions.length,
  });

  return normalized;
}

import type { JointRecommendation, JointRecommendationPriority } from '../types/jointHealthEngine';
import { logger } from '../utils/logger';

interface AIJointOutput {
  priority?: string;
  summary?: string;
  rationale?: string;
  actions?: string[];
}

const isValidPriority = (value: unknown): value is JointRecommendationPriority => {
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

export function normalizeJointRecommendation(
  aiOutput: unknown,
  fallback: JointRecommendation,
): JointRecommendation {
  const output = aiOutput as AIJointOutput;

  const priority = isValidPriority(output?.priority) ? output.priority : fallback.priority ?? 'important';
  const summary = sanitizeText(output?.summary) || fallback.summary;
  const rationale = sanitizeText(output?.rationale) || undefined;
  const actions = sanitizeActions(output?.actions);
  const finalActions = actions.length > 0 ? actions : fallback.actions;

  const normalized: JointRecommendation = {
    type: 'joint',
    priority,
    summary,
    rationale,
    actions: finalActions,
    source: 'ai_enriched',
  };

  logger.info('Joint recommendation normalized', {
    priority: normalized.priority,
    hasRationale: !!normalized.rationale,
    actionCount: normalized.actions.length,
  });

  return normalized;
}

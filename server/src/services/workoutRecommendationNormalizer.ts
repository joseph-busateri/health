import type { WorkoutRecommendation } from '../types/workoutEngine';

export function normalizeWorkoutRecommendation(
  aiOutput: unknown,
  fallback: WorkoutRecommendation,
): WorkoutRecommendation {
  if (!aiOutput || typeof aiOutput !== 'object') {
    return fallback;
  }

  const output = aiOutput as Record<string, unknown>;

  const priority =
    output.priority === 'critical' || output.priority === 'important' || output.priority === 'optimization'
      ? output.priority
      : fallback.priority;

  const summary =
    typeof output.summary === 'string' && output.summary.length > 0
      ? sanitizeText(output.summary)
      : fallback.summary;

  const rationale =
    typeof output.rationale === 'string' && output.rationale.length > 0
      ? sanitizeText(output.rationale)
      : fallback.rationale;

  const actions = Array.isArray(output.actions)
    ? output.actions
        .filter((a): a is string => typeof a === 'string' && a.length > 0)
        .map(sanitizeText)
    : fallback.actions;

  return {
    type: 'workout',
    priority,
    summary,
    rationale,
    actions: actions.length > 0 ? actions : fallback.actions,
    source: 'ai_enriched',
  };
}

function sanitizeText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\n]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

import { z } from 'zod';

import { getOpenAIClient } from './openAIService';
import { logger } from '../utils/logger';
import type { ReadinessSnapshot } from '../types/progression';
import type { WorkoutExercise } from '../types/workoutDocument';

export interface OverloadContextExercise {
  key: string;
  name: string;
  grouping?: string;
  setRepLoadNotes?: string;
  recentAdjustments?: string | null;
}

export interface OverloadHistoryEntry {
  date: string;
  exerciseKey: string;
  progressionStep?: string | null;
  adjustmentSource?: 'baseline' | 'heuristic' | 'ai';
  appliedPayload: WorkoutExercise;
}

export interface OverloadContext {
  date: string;
  readiness: ReadinessSnapshot;
  baselineDay: string;
  baselinePlan?: string;
  exercises: OverloadContextExercise[];
  history: OverloadHistoryEntry[];
  adherenceTrend?: 'low' | 'moderate' | 'high';
  jointTrend?: 'low' | 'moderate' | 'high';
  laggingMuscleGroup?: string;
}

export interface OverloadAdjustment {
  exerciseKey: string;
  loadDeltaPercent?: number;
  addSet?: boolean;
  removeSet?: boolean;
  cue?: string;
  justification?: string;
}

export interface OverloadDecision {
  confidence: number;
  summary: string;
  notes: string[];
  adjustments: OverloadAdjustment[];
}

const adjustmentSchema = z.object({
  exerciseKey: z.string(),
  loadDeltaPercent: z.number().min(-0.1).max(0.1).optional(),
  addSet: z.boolean().optional(),
  removeSet: z.boolean().optional(),
  cue: z.string().optional(),
  justification: z.string().optional(),
});

const overloadDecisionSchema = z.object({
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  notes: z.array(z.string()).default([]),
  adjustments: z.array(adjustmentSchema).max(12).default([]),
});

const DEFAULT_MODEL = process.env.AI_OVERLOAD_MODEL || 'gpt-4o-mini';
const MAX_HISTORY_ENTRIES = 40;

export const generateProgressiveOverload = async (
  context: OverloadContext,
): Promise<OverloadDecision | null> => {
  try {
    const client = getOpenAIClient();

    const trimmedHistory = context.history.slice(0, MAX_HISTORY_ENTRIES);

    const prompt = buildPrompt({ ...context, history: trimmedHistory });

    logger.info('AI overload planner: requesting decision', {
      exerciseCount: context.exercises.length,
      historyEntries: trimmedHistory.length,
      readiness: context.readiness,
    });

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a strength coach AI tasked with prescribing progressive overload safely. Respect recovery signals, joint stress, and adherence trends. Stay within +/-5% load changes and at most +1 working set per movement. Prefer qualitative cues when data is uncertain. Return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      logger.warn('AI overload planner: no response content');
      return null;
    }

    const parsed = overloadDecisionSchema.safeParse(JSON.parse(rawContent));
    if (!parsed.success) {
      logger.warn('AI overload planner: validation failed', {
        issues: parsed.error.issues,
      });
      return null;
    }

    return parsed.data;
  } catch (error) {
    logger.error('AI overload planner: failed to generate decision', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

const buildPrompt = (context: OverloadContext): string => {
  const lines: string[] = [];
  lines.push(`Date: ${context.date}`);
  lines.push(
    `Readiness scores -> recovery: ${formatScore(context.readiness.recoveryScore)}, stress: ${formatScore(
      context.readiness.stressScore,
    )}, joint: ${formatScore(context.readiness.jointScore)}, adherence: ${formatScore(
      context.readiness.adherenceScore,
    )}`,
  );
  lines.push(`Training day: ${context.baselineDay}`);
  if (context.baselinePlan) {
    lines.push(`Baseline plan focus: ${context.baselinePlan}`);
  }
  if (context.laggingMuscleGroup) {
    lines.push(`Lagging muscle focus: ${context.laggingMuscleGroup}`);
  }
  if (context.jointTrend) {
    lines.push(`Joint trend: ${context.jointTrend}`);
  }
  if (context.adherenceTrend) {
    lines.push(`Adherence trend: ${context.adherenceTrend}`);
  }

  lines.push('\nExercises today:');
  context.exercises.forEach(ex => {
    lines.push(
      `- ${ex.key}: ${ex.name}${ex.grouping ? ` (${ex.grouping})` : ''} | plan: ${ex.setRepLoadNotes ?? 'n/a'}${ex.recentAdjustments ? ` | last change: ${ex.recentAdjustments}` : ''}`,
    );
  });

  if (context.history.length > 0) {
    lines.push('\nRecent progression history (most recent first):');
    context.history.slice(0, MAX_HISTORY_ENTRIES).forEach(entry => {
      lines.push(
        `- ${entry.date} :: ${entry.exerciseKey} :: step=${entry.progressionStep ?? 'baseline'} :: source=${entry.adjustmentSource ?? 'baseline'} :: applied=${entry.appliedPayload.setRepLoadNotes ?? 'n/a'}`,
      );
    });
  }

  lines.push('\nReturn JSON with: { "confidence": number 0-1, "summary": string, "notes": string[], "adjustments": [{ "exerciseKey", "loadDeltaPercent"?, "addSet"?, "removeSet"?, "cue"?, "justification"? }] }');
  lines.push('Only recommend overload where readiness and history support it.');

  return lines.join('\n');
};

const formatScore = (value?: number | null): string => {
  if (value == null) {
    return 'unknown';
  }
  return value.toFixed(0);
};

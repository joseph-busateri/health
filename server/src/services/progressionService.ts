import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type {
  ExerciseProgressState,
  ProgressionRecordingInput,
  ProgressionSource,
  WorkoutDailyProgression,
  WorkoutWeeklyProgression,
  WeeklyProgressionSummaryInput,
} from '../types/progression';

const DAILY_TABLE = 'workout_daily_progressions';
const WEEKLY_TABLE = 'workout_weekly_progressions';

const mapDailyProgression = (row: any): WorkoutDailyProgression => ({
  id: row.id,
  userId: row.user_id,
  exerciseKey: row.exercise_key,
  exerciseName: row.exercise_name,
  planDate: row.plan_date,
  baselinePayload: row.baseline_payload,
  appliedPayload: row.applied_payload,
  progressionStep: row.progression_step,
  adjustmentSource: row.adjustment_source as ProgressionSource,
  readinessSnapshot: row.readiness_snapshot ?? undefined,
  jointSnapshot: row.joint_snapshot ?? undefined,
  adherenceSnapshot: row.adherence_snapshot ?? undefined,
  aiConfidence: row.ai_confidence ?? undefined,
  rationale: row.rationale ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getLatestProgressionForExercise = async (
  userId: string,
  exerciseKey: string,
): Promise<ExerciseProgressState | null> => {
  const { data, error } = await supabase
    .from(DAILY_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_key', exerciseKey)
    .order('plan_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.warn('Failed to fetch latest progression entry', { userId, exerciseKey, error });
    throw error;
  }

  const progression = mapDailyProgression(data);
  return {
    exerciseKey,
    lastAppliedDate: progression.planDate,
    progressionStep: progression.progressionStep ?? undefined,
    adjustmentSource: progression.adjustmentSource,
    appliedPayload: progression.appliedPayload,
    baselinePayload: progression.baselinePayload,
    aiConfidence: progression.aiConfidence ?? undefined,
    rationale: progression.rationale ?? undefined,
  };
};

export const getRecentProgressions = async (
  userId: string,
  days: number = 30,
): Promise<WorkoutDailyProgression[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from(DAILY_TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('plan_date', startDate.toISOString().slice(0, 10))
    .order('plan_date', { ascending: false });

  if (error) {
    logger.warn('Failed to fetch recent progression entries', { userId, days, error });
    throw error;
  }

  return (data ?? []).map(mapDailyProgression);
};

export const getLatestProgressionsForExercises = async (
  userId: string,
  exerciseKeys: string[],
): Promise<Map<string, ExerciseProgressState>> => {
  if (exerciseKeys.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(DAILY_TABLE)
    .select('*')
    .eq('user_id', userId)
    .in('exercise_key', exerciseKeys)
    .order('plan_date', { ascending: false });

  if (error) {
    logger.warn('Failed to fetch batch progression entries', { userId, exerciseKeys, error });
    throw error;
  }

  const result = new Map<string, ExerciseProgressState>();
  for (const row of data ?? []) {
    if (!result.has(row.exercise_key)) {
      const progression = mapDailyProgression(row);
      result.set(row.exercise_key, {
        exerciseKey: progression.exerciseKey,
        lastAppliedDate: progression.planDate,
        progressionStep: progression.progressionStep ?? undefined,
        adjustmentSource: progression.adjustmentSource,
        appliedPayload: progression.appliedPayload,
        baselinePayload: progression.baselinePayload,
        aiConfidence: progression.aiConfidence ?? undefined,
        rationale: progression.rationale ?? undefined,
      });
    }
  }

  return result;
};

export const recordDailyProgression = async (
  input: ProgressionRecordingInput,
): Promise<void> => {
  const { error } = await supabase
    .from(DAILY_TABLE)
    .upsert(
      {
        user_id: input.userId,
        exercise_key: input.exerciseKey,
        exercise_name: input.exerciseName,
        plan_date: input.planDate,
        baseline_payload: input.baselinePayload,
        applied_payload: input.appliedPayload,
        progression_step: input.progressionStep ?? null,
        adjustment_source: input.adjustmentSource,
        readiness_snapshot: input.readinessSnapshot ?? null,
        joint_snapshot: input.jointSnapshot ?? null,
        adherence_snapshot: input.adherenceSnapshot ?? null,
        ai_confidence: input.aiConfidence ?? null,
        rationale: input.rationale ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_key,plan_date' },
    );

  if (error) {
    logger.error('Failed to record workout daily progression', { input, error });
    throw error;
  }
};

export const upsertWeeklyProgressionSummary = async (
  input: WeeklyProgressionSummaryInput,
): Promise<WorkoutWeeklyProgression> => {
  const { data, error } = await supabase
    .from(WEEKLY_TABLE)
    .upsert(
      {
        user_id: input.userId,
        week_start_date: input.weekStartDate,
        week_label: input.weekLabel ?? null,
        block_label: input.blockLabel ?? null,
        summary_payload: input.summaryPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week_start_date' },
    )
    .select()
    .single();

  if (error) {
    logger.error('Failed to upsert weekly progression summary', { input, error });
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    weekStartDate: data.week_start_date,
    weekLabel: data.week_label ?? undefined,
    blockLabel: data.block_label ?? undefined,
    summaryPayload: data.summary_payload ?? {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

import type { WorkoutExercise } from './workoutDocument';

export type ProgressionSource = 'baseline' | 'heuristic' | 'ai';

export interface ReadinessSnapshot {
  recoveryScore?: number | null;
  stressScore?: number | null;
  jointScore?: number | null;
  adherenceScore?: number | null;
}

export interface ProgressionSnapshots {
  readiness?: ReadinessSnapshot;
  jointTrend?: 'low' | 'moderate' | 'high';
  adherenceTrend?: 'low' | 'moderate' | 'high';
}

export interface WorkoutDailyProgression {
  id: string;
  userId: string;
  exerciseKey: string;
  exerciseName: string;
  planDate: string;
  baselinePayload: WorkoutExercise;
  appliedPayload: WorkoutExercise;
  progressionStep?: string | null;
  adjustmentSource: ProgressionSource;
  readinessSnapshot?: ReadinessSnapshot;
  jointSnapshot?: Record<string, unknown> | null;
  adherenceSnapshot?: Record<string, unknown> | null;
  aiConfidence?: number | null;
  rationale?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutWeeklyProgression {
  id: string;
  userId: string;
  weekStartDate: string;
  weekLabel?: string | null;
  blockLabel?: string | null;
  summaryPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseProgressState {
  exerciseKey: string;
  lastAppliedDate?: string;
  progressionStep?: string | null;
  adjustmentSource?: ProgressionSource;
  appliedPayload?: WorkoutExercise;
  baselinePayload?: WorkoutExercise;
  aiConfidence?: number | null;
  rationale?: string | null;
}

export interface ProgressionRecordingInput {
  userId: string;
  exerciseKey: string;
  exerciseName: string;
  planDate: string;
  baselinePayload: WorkoutExercise;
  appliedPayload: WorkoutExercise;
  progressionStep?: string;
  adjustmentSource: ProgressionSource;
  readinessSnapshot?: ReadinessSnapshot;
  jointSnapshot?: Record<string, unknown>;
  adherenceSnapshot?: Record<string, unknown>;
  aiConfidence?: number;
  rationale?: string;
}

export interface WeeklyProgressionSummaryInput {
  userId: string;
  weekStartDate: string;
  weekLabel?: string;
  blockLabel?: string;
  summaryPayload: Record<string, unknown>;
}

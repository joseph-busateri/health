import { randomUUID } from 'crypto';

import type { WorkoutBaseline, WorkoutExercise } from '../types/workoutDocument';
import type {
  WorkoutAdjustment,
  WorkoutGenerationContextOverride,
  WorkoutReadinessStatus,
  WorkoutTodayPlan,
  WorkoutTodayRecord,
} from '../types/workoutToday';
import type { ExerciseProgressState, ProgressionRecordingInput, ReadinessSnapshot } from '../types/progression';
import { getWorkoutBaseline } from './workoutDocumentService';
import { getEngineSnapshot } from './engineStateService';
import { getLatestBodyComposition } from './bodyCompositionService';
import {
  getLatestProgressionsForExercises,
  getRecentProgressions,
  recordDailyProgression,
  upsertWeeklyProgressionSummary,
} from './progressionService';
import { generateProgressiveOverload } from './overloadPlannerService';
import { createChangeEvent } from './pointInTimeService';
import { normalizeUserId } from '../utils/userId';
import { buildExerciseKey } from '../utils/exerciseKey';
import { logger } from '../utils/logger';

const workoutTodayStore = new Map<string, WorkoutTodayRecord[]>();
const workoutBaselineOverrideStore = new Map<string, WorkoutBaseline>();

const ENABLE_AI_OVERLOAD = process.env.ENABLE_AI_OVERLOAD === 'true';
const AI_OVERLOAD_CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_OVERLOAD_CONFIDENCE_THRESHOLD ?? '0.6');

const dayKey = (date = new Date()): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

const getDayPlan = (baseline: WorkoutBaseline, key: string): string | undefined => {
  const mapping: Record<string, string | undefined> = {
    monday: baseline.mondayPlan,
    tuesday: baseline.tuesdayPlan,
    wednesday: baseline.wednesdayPlan,
    thursday: baseline.thursdayPlan,
    friday: baseline.fridayPlan,
    saturday: baseline.saturdayPlan,
    sunday: baseline.sundayPlan,
  };
  return mapping[key];
};

const getDayExercises = (baseline: WorkoutBaseline, key: string): WorkoutExercise[] => {
  const dayName = key.slice(0, 3).toLowerCase();
  const exercises = baseline.exercises ?? [];
  const filtered = exercises.filter(exercise => exercise.dayAssociation.toLowerCase().includes(dayName));
  return filtered.length > 0 ? filtered : exercises;
};

const cloneExercises = (exercises: WorkoutExercise[]): WorkoutExercise[] => exercises.map(exercise => ({ ...exercise }));

const resolveLaggingMuscle = async (
  userId: string,
  override?: WorkoutGenerationContextOverride
): Promise<string | undefined> => {
  if (override?.laggingMuscleGroup) {
    return override.laggingMuscleGroup;
  }

  const latest = await getLatestBodyComposition(userId);
  if (!latest) {
    return undefined;
  }

  if (typeof latest.notes === 'string' && latest.notes.toLowerCase().includes('lagging')) {
    return latest.notes;
  }

  return undefined;
};

const deriveReadiness = (
  recoveryScore?: number,
  stressScore?: number,
  jointScore?: number,
  adherenceScore?: number,
): WorkoutReadinessStatus => {
  if ((recoveryScore != null && recoveryScore < 55) || (stressScore != null && stressScore < 45) || (jointScore != null && jointScore < 45)) {
    return 'low';
  }

  if ((recoveryScore != null && recoveryScore < 70) || (stressScore != null && stressScore < 60) || (jointScore != null && jointScore < 70) || (adherenceScore != null && adherenceScore < 65)) {
    return 'moderate';
  }

  return 'ready';
};

const applyJointPainModifications = (exercises: WorkoutExercise[]): WorkoutExercise[] => {
  return exercises.map(exercise => {
    const lower = exercise.name.toLowerCase();
    if (lower.includes('squat')) {
      return { ...exercise, name: `${exercise.name} (swap to machine/goblet variation)`, setRepLoadNotes: `${exercise.setRepLoadNotes ?? ''} reduce load 15%`.trim() };
    }
    if (lower.includes('deadlift')) {
      return { ...exercise, name: `${exercise.name} (swap to RDL/hinge variation)`, setRepLoadNotes: `${exercise.setRepLoadNotes ?? ''} reduce load 15%`.trim() };
    }
    if (lower.includes('press')) {
      return { ...exercise, name: `${exercise.name} (neutral-grip variation)`, setRepLoadNotes: `${exercise.setRepLoadNotes ?? ''} keep RPE <= 7`.trim() };
    }
    return { ...exercise };
  });
};

const maybeAddTargetedFocus = (
  exercises: WorkoutExercise[],
  laggingMuscleGroup: string
): WorkoutExercise[] => {
  const hasFocusExercise = exercises.some(exercise => exercise.name.toLowerCase().includes(laggingMuscleGroup.toLowerCase()));
  if (hasFocusExercise) {
    return exercises;
  }

  return [
    ...exercises,
    {
      name: `${laggingMuscleGroup} targeted accessory block`,
      dayAssociation: 'today',
      setRepLoadNotes: '2-3 sets, moderate load, technical focus',
      grouping: 'targeted_emphasis',
    },
  ];
};

export const seedWorkoutBaselineOverride = async (userId: string, baseline: WorkoutBaseline): Promise<void> => {
  workoutBaselineOverrideStore.set(userId, baseline);
};

export const getWorkoutToday = async (
  incomingUserId: string,
  options?: { regenerate?: boolean; override?: WorkoutGenerationContextOverride }
): Promise<WorkoutTodayRecord> => {
  const userId = normalizeUserId(incomingUserId);
  const date = new Date().toISOString().slice(0, 10);
  const existing = workoutTodayStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  const baseline = (await getWorkoutBaseline(userId)) ?? workoutBaselineOverrideStore.get(userId);
  if (!baseline) {
    throw new Error('Workout baseline not found for user.');
  }

  const snapshot = await getEngineSnapshot(userId);
  const recoveryScore = options?.override?.recoveryScore ?? snapshot.recoveryCluster?.recoveryScore;
  const stressScore = options?.override?.stressScore ?? snapshot.recoveryCluster?.stressScore;
  const jointScore = options?.override?.jointScore ?? snapshot.recoveryCluster?.jointScore;
  const adherenceScore = options?.override?.adherenceScore ?? snapshot.workout?.adherenceScore;
  const laggingMuscleGroup = await resolveLaggingMuscle(userId, options?.override);

  const readinessStatus = deriveReadiness(recoveryScore, stressScore, jointScore, adherenceScore);

  const key = dayKey();
  const baselineWorkout: WorkoutTodayPlan = {
    day: key,
    dayPlan: getDayPlan(baseline, key),
    exercises: cloneExercises(getDayExercises(baseline, key)),
    notes: [],
  };

  const adjustedWorkout: WorkoutTodayPlan = {
    day: baselineWorkout.day,
    dayPlan: baselineWorkout.dayPlan,
    exercises: cloneExercises(baselineWorkout.exercises),
    notes: [],
  };

  const adjustments: WorkoutAdjustment[] = [];
  const rationaleParts: string[] = [];

  if (readinessStatus === 'low') {
    adjustedWorkout.notes.push('Reduced intensity and volume due to low readiness signals.');
    adjustedWorkout.exercises = adjustedWorkout.exercises.map(exercise => ({
      ...exercise,
      setRepLoadNotes: `${exercise.setRepLoadNotes ?? ''} deload 15-20% and reduce 1 set`.trim(),
    }));
    adjustments.push({
      code: 'recovery_deload',
      description: 'Recovery/stress signals are low. Volume and intensity reduced for today.',
    });
    rationaleParts.push('Poor recovery/stress readiness triggered deload protocol.');
  } else if (readinessStatus === 'moderate') {
    adjustedWorkout.notes.push('Moderate readiness: keep form-first effort and avoid max intensity.');
    adjustments.push({
      code: 'recovery_deload',
      description: 'Readiness is moderate. Intensity capped and effort kept submaximal.',
    });
    rationaleParts.push('Moderate readiness triggered conservative intensity guidance.');
  } else {
    rationaleParts.push('Good recovery and stress profile supports baseline workout execution.');
  }

  if (jointScore != null && jointScore < 70) {
    adjustedWorkout.exercises = applyJointPainModifications(adjustedWorkout.exercises);
    adjustedWorkout.notes.push('Joint pain flagged: applied movement substitutions and load reductions.');
    adjustments.push({
      code: 'joint_pain_modification',
      description: 'Joint pain signal detected. Joint-friendly substitutions were applied.',
    });
    rationaleParts.push('Joint pain score triggered exercise modification logic.');
  }

  if ((adherenceScore ?? 0) >= 85 && laggingMuscleGroup && readinessStatus !== 'low') {
    adjustedWorkout.exercises = maybeAddTargetedFocus(adjustedWorkout.exercises, laggingMuscleGroup);
    adjustedWorkout.notes.push(`Added targeted emphasis for lagging muscle group: ${laggingMuscleGroup}.`);
    adjustments.push({
      code: 'targeted_emphasis',
      description: `High adherence + body composition lag detected. Added focus work for ${laggingMuscleGroup}.`,
    });
    rationaleParts.push('High adherence and lagging muscle indicator triggered targeted emphasis.');
  }

  const record: WorkoutTodayRecord = {
    id: randomUUID(),
    userId,
    date,
    baselineWorkout,
    adjustedWorkout,
    readinessStatus,
    rationale: rationaleParts.join(' '),
    adjustments,
    baselineSnapshot: baseline,
    createdAt: new Date().toISOString(),
  };

  const history = workoutTodayStore.get(userId) ?? [];
  workoutTodayStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'workout_baseline',
    entity_id: baseline.id,
    field_name: 'today_adjustments',
    new_value: JSON.stringify(adjustments),
    change_source: 'agent_adjustment',
    rationale: 'Generated today workout with readiness-based adjustment engine',
    confidence: 0.9,
  }).catch(() => undefined);

  return record;
};

export const getWorkoutTodayHistory = async (incomingUserId: string): Promise<WorkoutTodayRecord[]> => {
  const userId = normalizeUserId(incomingUserId);
  return workoutTodayStore.get(userId) ?? [];
};

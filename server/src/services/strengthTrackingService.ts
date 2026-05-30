import { randomUUID } from 'crypto';

import type {
  StrengthSessionInput,
  StrengthSessionRecord,
  StrengthExerciseSummary,
  StrengthExerciseEntryInput,
} from '../types/strengthTracking';

const strengthStore = new Map<string, StrengthSessionRecord[]>();

const toKg = (loadKg?: number, loadLbs?: number): number | undefined => {
  if (typeof loadKg === 'number' && !Number.isNaN(loadKg)) {
    return loadKg;
  }
  if (typeof loadLbs === 'number' && !Number.isNaN(loadLbs)) {
    return Number((loadLbs * 0.45359237).toFixed(2));
  }
  return undefined;
};

const estimateOneRepMax = (loadKg: number, reps: number): number => {
  const safeReps = Math.max(1, reps);
  return Number((loadKg * (1 + safeReps / 30)).toFixed(2));
};

const summarizeExercise = (entry: StrengthExerciseEntryInput): StrengthExerciseSummary => {
  const totalSets = entry.sets.length;
  const totalReps = entry.sets.reduce((sum, set) => sum + (set.reps || 0), 0);

  let topSetLoadKg: number | undefined;
  let estimatedOneRepMaxKg: number | undefined;

  for (const set of entry.sets) {
    const loadKg = toKg(set.loadKg, set.loadLbs);
    if (loadKg == null) {
      continue;
    }
    if (topSetLoadKg == null || loadKg > topSetLoadKg) {
      topSetLoadKg = loadKg;
    }

    const e1rm = estimateOneRepMax(loadKg, set.reps || 1);
    if (estimatedOneRepMaxKg == null || e1rm > estimatedOneRepMaxKg) {
      estimatedOneRepMaxKg = e1rm;
    }
  }

  return {
    exerciseName: entry.exerciseName,
    totalSets,
    totalReps,
    topSetLoadKg,
    estimatedOneRepMaxKg,
  };
};

export const createStrengthSession = async (input: StrengthSessionInput): Promise<StrengthSessionRecord> => {
  const sessionDate = input.sessionDate ? new Date(input.sessionDate).toISOString() : new Date().toISOString();

  const summaries = input.entries.map(summarizeExercise);

  const record: StrengthSessionRecord = {
    id: randomUUID(),
    userId: input.userId,
    sessionDate,
    programName: input.programName,
    notes: input.notes,
    entries: input.entries,
    summaries,
    createdAt: new Date().toISOString(),
  };

  const existing = strengthStore.get(input.userId) ?? [];
  strengthStore.set(input.userId, [record, ...existing]);

  return record;
};

export const getStrengthSessionsForUser = async (userId: string): Promise<StrengthSessionRecord[]> => {
  return strengthStore.get(userId) ?? [];
};

export const getLatestStrengthSession = async (userId: string): Promise<StrengthSessionRecord | null> => {
  const sessions = strengthStore.get(userId) ?? [];
  return sessions.length > 0 ? sessions[0] : null;
};

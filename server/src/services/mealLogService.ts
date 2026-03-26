import { randomUUID } from 'crypto';

import type { MealLogInput, MealLogRecord, MealLabel } from '../types/mealLog';

const mealLogsStore = new Map<string, MealLogRecord[]>();

const normalizeMealLabel = (value: unknown): MealLabel | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase() as MealLabel;
  if (['breakfast', 'lunch', 'dinner', 'snack'].includes(normalized)) {
    return normalized;
  }
  return undefined;
};

export const createMealLog = async (input: MealLogInput): Promise<MealLogRecord> => {
  const takenAt = input.takenAt ? new Date(input.takenAt).toISOString() : new Date().toISOString();

  const record: MealLogRecord = {
    id: randomUUID(),
    userId: input.userId,
    takenAt,
    photoUri: input.photoUri,
    mealLabel: normalizeMealLabel(input.mealLabel),
    notes: input.notes,
    aiStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  const existing = mealLogsStore.get(input.userId) ?? [];
  mealLogsStore.set(input.userId, [record, ...existing]);

  return record;
};

export const getMealLogsForUser = async (userId: string): Promise<MealLogRecord[]> => {
  return mealLogsStore.get(userId) ?? [];
};

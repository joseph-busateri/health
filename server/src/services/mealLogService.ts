import { supabase } from '../config/supabase';
import type { MealLogInput, MealLogRecord, MealLabel } from '../types/mealLog';

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

  const { data, error } = await supabase
    .from('meal_logs')
    .insert({
      user_id: input.userId,
      photo_uri: input.photoUri,
      meal_label: normalizeMealLabel(input.mealLabel),
      taken_at: takenAt,
      notes: input.notes,
      ai_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meal log: ${error.message}`);
  }

  const record: MealLogRecord = {
    id: data.id,
    userId: data.user_id,
    takenAt: data.taken_at,
    photoUri: data.photo_uri,
    mealLabel: data.meal_label as MealLabel | undefined,
    notes: data.notes,
    aiStatus: data.ai_status,
    createdAt: data.created_at,
  };

  return record;
};

export const getMealLogsForUser = async (userId: string): Promise<MealLogRecord[]> => {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch meal logs: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    takenAt: row.taken_at,
    photoUri: row.photo_uri,
    mealLabel: row.meal_label as MealLabel | undefined,
    notes: row.notes,
    aiStatus: row.ai_status,
    createdAt: row.created_at,
  }));
};

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type { ExerciseClassificationRecord } from '../types/overloadTracking';

/**
 * Get exercise classification from database
 */
export const getExerciseClassificationFromDB = async (
  exerciseName: string,
): Promise<ExerciseClassificationRecord | null> => {
  try {
    const normalizedName = exerciseName.toLowerCase().trim();

    const { data, error } = await supabase
      .from('exercise_classification')
      .select('*')
      .or(`exercise_name.ilike.${normalizedName},exercise_key.eq.${normalizedName.replace(/\s+/g, '_')}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    // Update usage count
    await supabase
      .from('exercise_classification')
      .update({
        usage_count: data.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    return mapToExerciseClassificationRecord(data);
  } catch (error) {
    logger.error('Failed to get exercise classification from database', {
      error: error instanceof Error ? error.message : String(error),
      exerciseName,
    });
    return null;
  }
};

/**
 * Get multiple exercise classifications from database
 */
export const getExerciseClassificationsFromDB = async (
  exerciseNames: string[],
): Promise<ExerciseClassificationRecord[]> => {
  try {
    const normalizedNames = exerciseNames.map(name => name.toLowerCase().trim());

    const { data, error } = await supabase
      .from('exercise_classification')
      .select('*')
      .in('exercise_name', normalizedNames);

    if (error) throw error;

    return (data || []).map(mapToExerciseClassificationRecord);
  } catch (error) {
    logger.error('Failed to get exercise classifications from database', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Create exercise classification in database
 */
export const createExerciseClassificationInDB = async (
  exerciseName: string,
  classification: 'compound' | 'isolation' | 'unknown',
  movementPattern?: string,
  primaryMuscles?: string[],
  secondaryMuscles?: string[],
): Promise<ExerciseClassificationRecord> => {
  try {
    const exerciseKey = exerciseName.toLowerCase().trim().replace(/\s+/g, '_');

    const { data, error } = await supabase
      .from('exercise_classification')
      .insert({
        exercise_name: exerciseName,
        exercise_key: exerciseKey,
        classification,
        movement_pattern: movementPattern,
        primary_muscles: primaryMuscles,
        secondary_muscles: secondaryMuscles,
        is_primary_compound: classification === 'compound' && movementPattern !== undefined,
        usage_count: 1,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Exercise classification created in database', {
      exerciseName,
      classification,
      movementPattern,
    });

    return mapToExerciseClassificationRecord(data);
  } catch (error) {
    logger.error('Failed to create exercise classification in database', {
      error: error instanceof Error ? error.message : String(error),
      exerciseName,
    });
    throw error;
  }
};

/**
 * Get all exercise classifications from database
 */
export const getAllExerciseClassificationsFromDB = async (): Promise<ExerciseClassificationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('exercise_classification')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapToExerciseClassificationRecord);
  } catch (error) {
    logger.error('Failed to get all exercise classifications from database', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Get primary compound exercises from database
 */
export const getPrimaryCompoundExercisesFromDB = async (): Promise<ExerciseClassificationRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('exercise_classification')
      .select('*')
      .eq('is_primary_compound', true)
      .order('movement_pattern', { ascending: true });

    if (error) throw error;

    return (data || []).map(mapToExerciseClassificationRecord);
  } catch (error) {
    logger.error('Failed to get primary compound exercises from database', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Map database record to ExerciseClassificationRecord
 */
const mapToExerciseClassificationRecord = (data: any): ExerciseClassificationRecord => {
  return {
    id: data.id,
    exerciseName: data.exercise_name,
    exerciseKey: data.exercise_key,
    classification: data.classification,
    movementPattern: data.movement_pattern,
    primaryMuscles: data.primary_muscles,
    secondaryMuscles: data.secondary_muscles,
    isPrimaryCompound: data.is_primary_compound,
    difficultyLevel: data.difficulty_level,
    equipmentRequired: data.equipment_required,
    usageCount: data.usage_count,
    lastUsedAt: data.last_used_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

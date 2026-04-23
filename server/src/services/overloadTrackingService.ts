import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type {
  OverloadCompletionRecord,
  OverloadCompletionInput,
  OverloadHistoryRecord,
  OverloadCompletionStats,
  ProgressiveOverloadConfigRecord,
  ProgressiveOverloadConfigInput,
} from '../types/overloadTracking';

/**
 * Create overload completion tracking record
 */
export const createOverloadTracking = async (
  input: OverloadCompletionInput,
): Promise<OverloadCompletionRecord> => {
  try {
    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .insert({
        user_id: input.userId,
        date: input.date,
        exercise_key: input.exerciseKey,
        exercise_name: input.exerciseName,
        original_sets: input.originalSets,
        original_reps: input.originalReps,
        original_load: input.originalLoad,
        new_sets: input.newSets,
        new_reps: input.newReps,
        new_load: input.newLoad,
        load_delta_percent: input.loadDeltaPercent,
        adjustment_type: input.adjustmentType,
        adjustment_source: input.adjustmentSource,
        ai_confidence: input.aiConfidence,
        ai_justification: input.aiJustification,
        ai_cue: input.aiCue,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Overload tracking record created', {
      userId: input.userId,
      exerciseKey: input.exerciseKey,
      adjustmentType: input.adjustmentType,
    });

    return mapToOverloadCompletionRecord(data);
  } catch (error) {
    logger.error('Failed to create overload tracking record', {
      error: error instanceof Error ? error.message : String(error),
      userId: input.userId,
    });
    throw error;
  }
};

/**
 * Mark overload as completed
 */
export const markOverloadCompleted = async (
  userId: string,
  date: string,
  exerciseKey: string,
  completionNotes?: string,
): Promise<OverloadCompletionRecord> => {
  try {
    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes,
      })
      .eq('user_id', userId)
      .eq('date', date)
      .eq('exercise_key', exerciseKey)
      .select()
      .single();

    if (error) throw error;

    logger.info('Overload marked as completed', {
      userId,
      date,
      exerciseKey,
    });

    return mapToOverloadCompletionRecord(data);
  } catch (error) {
    logger.error('Failed to mark overload as completed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      exerciseKey,
    });
    throw error;
  }
};

/**
 * Get overload tracking records for a user and date
 */
export const getOverloadTrackingByDate = async (
  userId: string,
  date: string,
): Promise<OverloadCompletionRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapToOverloadCompletionRecord);
  } catch (error) {
    logger.error('Failed to get overload tracking by date', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      date,
    });
    return [];
  }
};

/**
 * Get overload tracking history for a user
 */
export const getOverloadTrackingHistory = async (
  userId: string,
  limit: number = 30,
): Promise<OverloadCompletionRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(mapToOverloadCompletionRecord);
  } catch (error) {
    logger.error('Failed to get overload tracking history', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return [];
  }
};

/**
 * Get overload tracking for a specific exercise
 */
export const getOverloadTrackingByExercise = async (
  userId: string,
  exerciseKey: string,
  limit: number = 10,
): Promise<OverloadCompletionRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_key', exerciseKey)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(mapToOverloadCompletionRecord);
  } catch (error) {
    logger.error('Failed to get overload tracking by exercise', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      exerciseKey,
    });
    return [];
  }
};

/**
 * Get overload completion statistics
 */
export const getOverloadCompletionStats = async (
  userId: string,
  days: number = 30,
): Promise<OverloadCompletionStats> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('overload_completion_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().slice(0, 10));

    if (error) throw error;

    const records = data || [];
    const totalRecommendations = records.length;
    const completedRecommendations = records.filter(r => r.completed).length;
    const completionRate = totalRecommendations > 0 ? (completedRecommendations / totalRecommendations) * 100 : 0;

    const loadDeltas = records.filter(r => r.load_delta_percent != null).map(r => r.load_delta_percent);
    const averageLoadDelta = loadDeltas.length > 0 ? loadDeltas.reduce((sum, val) => sum + val, 0) / loadDeltas.length : 0;

    const setAdditions = records.filter(r => r.new_sets != null && r.original_sets != null).map(r => r.new_sets - r.original_sets);
    const averageSetAddition = setAdditions.length > 0 ? setAdditions.reduce((sum, val) => sum + val, 0) / setAdditions.length : 0;

    const aiRecommendations = records.filter(r => r.adjustment_source === 'ai_overload_planner').length;
    const simpleRecommendations = records.filter(r => r.adjustment_source === 'simple_overload').length;
    const aiAcceptanceRate = totalRecommendations > 0 ? (aiRecommendations / totalRecommendations) * 100 : 0;

    return {
      totalRecommendations,
      completedRecommendations,
      completionRate,
      averageLoadDelta,
      averageSetAddition,
      aiRecommendations,
      simpleRecommendations,
      aiAcceptanceRate,
    };
  } catch (error) {
    logger.error('Failed to get overload completion stats', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return {
      totalRecommendations: 0,
      completedRecommendations: 0,
      completionRate: 0,
      averageLoadDelta: 0,
      averageSetAddition: 0,
      aiRecommendations: 0,
      simpleRecommendations: 0,
      aiAcceptanceRate: 0,
    };
  }
};

/**
 * Create overload history record
 */
export const createOverloadHistory = async (
  userId: string,
  date: string,
  workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload',
  decisionSource: 'ai_overload_planner' | 'simple_overload' | 'none',
  adjustmentsCount: number,
  options?: {
    trainingPhase?: string;
    recoveryScore?: number;
    stressScore?: number;
    jointScore?: number;
    adherenceScore?: number;
    aiConfidence?: number;
    summary?: string;
  },
): Promise<OverloadHistoryRecord> => {
  try {
    const { data, error } = await supabase
      .from('overload_history')
      .insert({
        user_id: userId,
        date,
        workout_status: workoutStatus,
        training_phase: options?.trainingPhase,
        recovery_score: options?.recoveryScore,
        stress_score: options?.stressScore,
        joint_score: options?.jointScore,
        adherence_score: options?.adherenceScore,
        decision_source: decisionSource,
        ai_confidence: options?.aiConfidence,
        adjustments_count: adjustmentsCount,
        summary: options?.summary,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Overload history record created', {
      userId,
      date,
      decisionSource,
      adjustmentsCount,
    });

    return mapToOverloadHistoryRecord(data);
  } catch (error) {
    logger.error('Failed to create overload history record', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
};

/**
 * Get overload history for a user
 */
export const getOverloadHistory = async (
  userId: string,
  limit: number = 30,
): Promise<OverloadHistoryRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('overload_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(mapToOverloadHistoryRecord);
  } catch (error) {
    logger.error('Failed to get overload history', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return [];
  }
};

/**
 * Get or create progressive overload config for a user
 */
export const getOrCreateOverloadConfig = async (
  userId: string,
): Promise<ProgressiveOverloadConfigRecord> => {
  try {
    // Try to get existing config
    const { data: existing, error: selectError } = await supabase
      .from('progressive_overload_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing && !selectError) {
      return mapToOverloadConfigRecord(existing);
    }

    // Create default config
    const { data, error } = await supabase
      .from('progressive_overload_config')
      .insert({
        user_id: userId,
        adherence_threshold: 85,
        max_load_delta_percent: 5.0,
        max_set_additions: 1,
        enable_ai_overload: false,
        ai_confidence_threshold: 0.60,
        enable_exercise_classification: true,
        enable_training_phase_logic: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Overload config created with defaults', { userId });

    return mapToOverloadConfigRecord(data);
  } catch (error) {
    logger.error('Failed to get or create overload config', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
};

/**
 * Update progressive overload config for a user
 */
export const updateOverloadConfig = async (
  userId: string,
  input: ProgressiveOverloadConfigInput,
): Promise<ProgressiveOverloadConfigRecord> => {
  try {
    const updateData: any = {};

    if (input.adherenceThreshold !== undefined) updateData.adherence_threshold = input.adherenceThreshold;
    if (input.maxLoadDeltaPercent !== undefined) updateData.max_load_delta_percent = input.maxLoadDeltaPercent;
    if (input.maxSetAdditions !== undefined) updateData.max_set_additions = input.maxSetAdditions;
    if (input.enableAIOverload !== undefined) updateData.enable_ai_overload = input.enableAIOverload;
    if (input.aiConfidenceThreshold !== undefined) updateData.ai_confidence_threshold = input.aiConfidenceThreshold;
    if (input.trainingPhase !== undefined) updateData.training_phase = input.trainingPhase;
    if (input.trainingPhaseOverride !== undefined) updateData.training_phase_override = input.trainingPhaseOverride;
    if (input.enableExerciseClassification !== undefined) updateData.enable_exercise_classification = input.enableExerciseClassification;
    if (input.enableTrainingPhaseLogic !== undefined) updateData.enable_training_phase_logic = input.enableTrainingPhaseLogic;

    const { data, error } = await supabase
      .from('progressive_overload_config')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Overload config updated', { userId, updates: Object.keys(updateData) });

    return mapToOverloadConfigRecord(data);
  } catch (error) {
    logger.error('Failed to update overload config', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
};

/**
 * Map database record to OverloadCompletionRecord
 */
const mapToOverloadCompletionRecord = (data: any): OverloadCompletionRecord => {
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    exerciseKey: data.exercise_key,
    exerciseName: data.exercise_name,
    originalSets: data.original_sets,
    originalReps: data.original_reps,
    originalLoad: data.original_load,
    newSets: data.new_sets,
    newReps: data.new_reps,
    newLoad: data.new_load,
    loadDeltaPercent: data.load_delta_percent,
    adjustmentType: data.adjustment_type,
    adjustmentSource: data.adjustment_source,
    aiConfidence: data.ai_confidence,
    aiJustification: data.ai_justification,
    aiCue: data.ai_cue,
    completed: data.completed,
    completedAt: data.completed_at,
    completionNotes: data.completion_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Map database record to OverloadHistoryRecord
 */
const mapToOverloadHistoryRecord = (data: any): OverloadHistoryRecord => {
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    workoutStatus: data.workout_status,
    trainingPhase: data.training_phase,
    recoveryScore: data.recovery_score,
    stressScore: data.stress_score,
    jointScore: data.joint_score,
    adherenceScore: data.adherence_score,
    decisionSource: data.decision_source,
    aiConfidence: data.ai_confidence,
    adjustmentsCount: data.adjustments_count,
    summary: data.summary,
    createdAt: data.created_at,
  };
};

/**
 * Map database record to ProgressiveOverloadConfigRecord
 */
const mapToOverloadConfigRecord = (data: any): ProgressiveOverloadConfigRecord => {
  return {
    id: data.id,
    userId: data.user_id,
    adherenceThreshold: data.adherence_threshold,
    maxLoadDeltaPercent: data.max_load_delta_percent,
    maxSetAdditions: data.max_set_additions,
    enableAIOverload: data.enable_ai_overload,
    aiConfidenceThreshold: data.ai_confidence_threshold,
    trainingPhase: data.training_phase,
    trainingPhaseOverride: data.training_phase_override,
    enableExerciseClassification: data.enable_exercise_classification,
    enableTrainingPhaseLogic: data.enable_training_phase_logic,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

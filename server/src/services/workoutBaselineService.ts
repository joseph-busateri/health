// Workout Baseline Service
// Handles workout plan uploads, versioning, and agent-managed updates

import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase';
import { extractTextFromBuffer } from './ocrService';
import { parseWorkoutExcel } from '../utils/workoutExcelParser';
import { logger } from '../utils/logger';

import type {
  TrainingCycle,
  WorkoutPlanVersion,
  WorkoutSplitDay,
  WorkoutExercise,
  WorkoutExecutionLog,
  WorkoutPlanChange,
  WorkoutBaselineDocument,
  CompleteWorkoutPlan,
  CreateTrainingCycleInput,
  CreateWorkoutPlanVersionInput,
  CreateWorkoutExerciseInput,
  LogWorkoutExecutionInput,
  ParsedWorkoutData,
} from '../types/workoutBaseline';

// ============================================================================
// DOCUMENT UPLOAD & PROCESSING
// ============================================================================

export const uploadWorkoutBaselineDocument = async (
  userId: string,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ documentId: string; versionId?: string }> => {
  const documentId = randomUUID();
  const filePath = `workouts/${userId}/${documentId}_${fileName}`;

  try {
    // Store document metadata
    const { error: docError } = await supabase
      .from('workout_baseline_documents')
      .insert({
        id: documentId,
        user_id: userId,
        file_name: fileName,
        file_path: filePath,
        file_size: file.length,
        mime_type: mimeType,
        processing_status: 'pending',
        uploaded_at: new Date().toISOString(),
      });

    if (docError) throw docError;

    // Process document asynchronously
    processWorkoutDocument(documentId, file, mimeType, userId);

    return { documentId };
  } catch (error) {
    logger.error('Failed to upload workout baseline document', { error, userId });
    throw error;
  }
};

const processWorkoutDocument = async (
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<void> => {
  try {
    // Update status to processing
    await supabase
      .from('workout_baseline_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Extract text via OCR
    const { text: extractedText } = await extractTextFromBuffer(fileBuffer, mimeType);

    // Parse workout data
    const parsedData = parseWorkoutExcel(extractedText);

    // Update document with extracted data
    await supabase
      .from('workout_baseline_documents')
      .update({
        processing_status: 'completed',
        extracted_text: extractedText,
        parsed_workout_data: parsedData,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Create workout plan from parsed data
    if (parsedData && parsedData.splitDays && parsedData.splitDays.length > 0) {
      await createWorkoutPlanFromParsedData(userId, parsedData, documentId);
    }

    logger.info('Workout baseline document processed successfully', { documentId, userId });
  } catch (error) {
    logger.error('Failed to process workout baseline document', { error, documentId });
    
    await supabase
      .from('workout_baseline_documents')
      .update({
        processing_status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);
  }
};

const createWorkoutPlanFromParsedData = async (
  userId: string,
  parsedData: ParsedWorkoutData,
  documentId: string
): Promise<void> => {
  // Create training cycle
  const cycleInput: CreateTrainingCycleInput = {
    userId,
    cycleNumber: 1,
    totalWeeks: parsedData.cycleConfig?.totalWeeks || 12,
    currentWeek: 1,
    concentricWeeks: parsedData.cycleConfig?.concentricWeeks || '1-10',
    eccentricWeeks: parsedData.cycleConfig?.eccentricWeeks || '11',
    isometricWeeks: parsedData.cycleConfig?.isometricWeeks || '12',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
  };

  const cycle = await createTrainingCycle(cycleInput);

  // Create workout plan version
  const versionInput: CreateWorkoutPlanVersionInput = {
    userId,
    trainingCycleId: cycle.id,
    versionNumber: 1,
    createdBy: 'user',
    createdReason: 'Initial baseline upload',
    effectiveFrom: new Date().toISOString().split('T')[0],
    isCurrent: true,
  };

  const version = await createWorkoutPlanVersion(versionInput);

  // Link document to version
  await supabase
      .from('workout_baseline_documents')
      .update({ plan_version_id: version.id })
      .eq('id', documentId);

  // Create split days and exercises
  for (const splitDay of parsedData.splitDays) {
    const splitDayId = await createWorkoutSplitDay({
      planVersionId: version.id,
      dayName: splitDay.dayName,
      splitFocus: splitDay.splitFocus,
      dayOrder: splitDay.dayOrder,
    });

    // Create exercises for this split day
    for (const exercise of splitDay.exercises) {
      await createWorkoutExercise({
        splitDayId,
        exerciseName: exercise.exerciseName,
        exerciseDescription: exercise.exerciseDescription,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        restPeriodSeconds: exercise.restPeriodSeconds,
        tempo: exercise.tempo,
        executionNotes: exercise.executionNotes,
        alternativeExercises: exercise.alternativeExercises,
        exerciseOrder: exercise.exerciseOrder,
      });
    }
  }

  logger.info('Workout plan created from parsed data', { userId, versionId: version.id });
};

// ============================================================================
// TRAINING CYCLE CRUD
// ============================================================================

export const createTrainingCycle = async (
  input: CreateTrainingCycleInput
): Promise<TrainingCycle> => {
  const cycleId = randomUUID();

  const { data, error } = await supabase
    .from('training_cycles')
    .insert({
      id: cycleId,
      user_id: input.userId,
      cycle_number: input.cycleNumber,
      total_weeks: input.totalWeeks,
      current_week: input.currentWeek,
      concentric_weeks: input.concentricWeeks,
      eccentric_weeks: input.eccentricWeeks,
      isometric_weeks: input.isometricWeeks,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToCycle(data);
};

export const getCurrentTrainingCycle = async (userId: string): Promise<TrainingCycle | null> => {
  const { data, error } = await supabase
    .from('training_cycles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapDatabaseToCycle(data);
};

// ============================================================================
// WORKOUT PLAN VERSION CRUD
// ============================================================================

export const createWorkoutPlanVersion = async (
  input: CreateWorkoutPlanVersionInput
): Promise<WorkoutPlanVersion> => {
  const versionId = randomUUID();

  const { data, error } = await supabase
    .from('workout_plan_versions')
    .insert({
      id: versionId,
      user_id: input.userId,
      training_cycle_id: input.trainingCycleId,
      version_number: input.versionNumber,
      version_name: input.versionName,
      created_by: input.createdBy,
      created_reason: input.createdReason,
      based_on_recommendation_id: input.basedOnRecommendationId,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      is_current: input.isCurrent !== false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToVersion(data);
};

export const getCurrentWorkoutPlan = async (userId: string): Promise<CompleteWorkoutPlan | null> => {
  // Get current version
  const { data: versionData, error: versionError } = await supabase
    .from('workout_plan_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .single();

  if (versionError) {
    if (versionError.code === 'PGRST116') return null;
    throw versionError;
  }

  const version = mapDatabaseToVersion(versionData);

  // Get split days
  const { data: splitDaysData, error: splitError } = await supabase
    .from('workout_split_days')
    .select('*')
    .eq('plan_version_id', version.id)
    .order('day_order');

  if (splitError) throw splitError;

  const splitDays: WorkoutSplitDay[] = [];
  
  for (const splitData of splitDaysData) {
    // Get exercises for this split day
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('split_day_id', splitData.id)
      .order('exercise_order');

    if (exercisesError) throw exercisesError;

    const exercises = exercisesData.map(mapDatabaseToExercise);

    splitDays.push({
      ...mapDatabaseToSplitDay(splitData),
      exercises,
    });
  }

  // Get recent changes
  const { data: changesData } = await supabase
    .from('workout_plan_changes')
    .select('*')
    .eq('to_version_id', version.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const changes = changesData ? changesData.map(mapDatabaseToChange) : [];

  return {
    version,
    splitDays,
    changes,
  };
};

// ============================================================================
// WORKOUT SPLIT DAY CRUD
// ============================================================================

const createWorkoutSplitDay = async (input: {
  planVersionId: string;
  dayName: string;
  splitFocus?: string;
  dayOrder: number;
}): Promise<string> => {
  const splitDayId = randomUUID();

  const { error } = await supabase
    .from('workout_split_days')
    .insert({
      id: splitDayId,
      plan_version_id: input.planVersionId,
      day_name: input.dayName,
      split_focus: input.splitFocus,
      day_order: input.dayOrder,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
  return splitDayId;
};

// ============================================================================
// WORKOUT EXERCISE CRUD
// ============================================================================

const createWorkoutExercise = async (input: CreateWorkoutExerciseInput): Promise<string> => {
  const exerciseId = randomUUID();

  const { error } = await supabase
    .from('workout_exercises')
    .insert({
      id: exerciseId,
      split_day_id: input.splitDayId,
      exercise_name: input.exerciseName,
      exercise_description: input.exerciseDescription,
      sets: input.sets,
      reps: input.reps,
      weight: input.weight,
      rest_period_seconds: input.restPeriodSeconds,
      tempo: input.tempo,
      execution_notes: input.executionNotes,
      alternative_exercises: input.alternativeExercises,
      exercise_order: input.exerciseOrder,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
  return exerciseId;
};

// ============================================================================
// WORKOUT EXECUTION LOG
// ============================================================================

export const logWorkoutExecution = async (
  input: LogWorkoutExecutionInput
): Promise<WorkoutExecutionLog> => {
  const logId = randomUUID();

  const { data, error } = await supabase
    .from('workout_execution_log')
    .insert({
      id: logId,
      user_id: input.userId,
      exercise_id: input.exerciseId,
      plan_version_id: input.planVersionId,
      execution_date: input.executionDate,
      planned_sets: input.plannedSets,
      completed_sets: input.completedSets,
      planned_reps: input.plannedReps,
      completed_reps: input.completedReps,
      planned_weight: input.plannedWeight,
      completed_weight: input.completedWeight,
      rpe: input.rpe,
      form_quality: input.formQuality,
      skipped: input.skipped || false,
      skip_reason: input.skipReason,
      notes: input.notes,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToExecutionLog(data);
};

export const getWorkoutExecutionHistory = async (
  userId: string,
  days: number = 30
): Promise<WorkoutExecutionLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('workout_execution_log')
    .select('*')
    .eq('user_id', userId)
    .gte('execution_date', startDate.toISOString().split('T')[0])
    .order('execution_date', { ascending: false });

  if (error) throw error;
  return data.map(mapDatabaseToExecutionLog);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapDatabaseToCycle = (data: any): TrainingCycle => ({
  id: data.id,
  userId: data.user_id,
  cycleNumber: data.cycle_number,
  totalWeeks: data.total_weeks,
  currentWeek: data.current_week,
  concentricWeeks: data.concentric_weeks,
  eccentricWeeks: data.eccentric_weeks,
  isometricWeeks: data.isometric_weeks,
  startDate: data.start_date,
  endDate: data.end_date,
  status: data.status,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapDatabaseToVersion = (data: any): WorkoutPlanVersion => ({
  id: data.id,
  userId: data.user_id,
  trainingCycleId: data.training_cycle_id,
  versionNumber: data.version_number,
  versionName: data.version_name,
  createdBy: data.created_by,
  createdReason: data.created_reason,
  basedOnRecommendationId: data.based_on_recommendation_id,
  effectiveFrom: data.effective_from,
  effectiveTo: data.effective_to,
  isCurrent: data.is_current,
  createdAt: data.created_at,
});

const mapDatabaseToSplitDay = (data: any): WorkoutSplitDay => ({
  id: data.id,
  planVersionId: data.plan_version_id,
  dayName: data.day_name,
  splitFocus: data.split_focus,
  dayOrder: data.day_order,
  createdAt: data.created_at,
  exercises: [],
});

const mapDatabaseToExercise = (data: any): WorkoutExercise => ({
  id: data.id,
  splitDayId: data.split_day_id,
  exerciseName: data.exercise_name,
  exerciseDescription: data.exercise_description,
  sets: data.sets,
  reps: data.reps,
  weight: data.weight,
  restPeriodSeconds: data.rest_period_seconds,
  tempo: data.tempo,
  executionNotes: data.execution_notes,
  alternativeExercises: data.alternative_exercises,
  exerciseOrder: data.exercise_order,
  createdAt: data.created_at,
});

const mapDatabaseToExecutionLog = (data: any): WorkoutExecutionLog => ({
  id: data.id,
  userId: data.user_id,
  exerciseId: data.exercise_id,
  planVersionId: data.plan_version_id,
  executionDate: data.execution_date,
  plannedSets: data.planned_sets,
  completedSets: data.completed_sets,
  plannedReps: data.planned_reps,
  completedReps: data.completed_reps,
  plannedWeight: data.planned_weight,
  completedWeight: data.completed_weight,
  rpe: data.rpe,
  formQuality: data.form_quality,
  skipped: data.skipped,
  skipReason: data.skip_reason,
  notes: data.notes,
  createdAt: data.created_at,
});

const mapDatabaseToChange = (data: any): WorkoutPlanChange => ({
  id: data.id,
  fromVersionId: data.from_version_id,
  toVersionId: data.to_version_id,
  changeType: data.change_type,
  changeDescription: data.change_description,
  exerciseName: data.exercise_name,
  oldValue: data.old_value,
  newValue: data.new_value,
  reason: data.reason,
  triggeredByPerformance: data.triggered_by_performance,
  triggeredByRecovery: data.triggered_by_recovery,
  triggeredByAdherence: data.triggered_by_adherence,
  triggeredByBloodwork: data.triggered_by_bloodwork,
  createdAt: data.created_at,
});

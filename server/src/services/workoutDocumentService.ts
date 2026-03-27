import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import type { Database } from '../types/database';
import {
  WorkoutDocument,
  WorkoutBaseline,
  WorkoutExtractedSection,
  WorkoutChangeLog,
  CreateWorkoutDocumentRequest,
  ManualWorkoutData,
  WorkoutDocumentResult,
  WorkoutChangeSource,
  WORKOUT_TABLES,
} from '../types/workoutDocument';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Create workout document with structured data
export const createWorkoutDocument = async (
  request: CreateWorkoutDocumentRequest
): Promise<WorkoutDocumentResult> => {
  const now = new Date().toISOString();

  // Create workout document record
  const { data: document, error: documentError } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_DOCUMENTS)
    .insert({
      user_id: request.userId,
      file_reference: request.fileReference,
      storage_path: request.storagePath,
      upload_date: now.split('T')[0],
      document_type: request.documentType,
      program_start_date: request.programStartDate,
      parse_status: 'completed' as any,
      extraction_confidence: request.manualWorkoutData ? 1.0 : null,
      notes: request.notes,
      created_at: now,
      updated_at: now,
    } as any)
    .select()
    .single();

  if (documentError || !document) {
    logger.error('Failed to create workout document', { error: documentError });
    throw new Error('Failed to create workout document');
  }

  // Create workout baseline record
  let baselineData: any = {
    user_id: request.userId,
    document_id: (document as any).id,
    extracted_at: now,
    created_at: now,
    updated_at: now,
  };

  if (request.manualWorkoutData) {
    // Flatten the structured data into JSON fields
    baselineData = {
      ...baselineData,
      program_name: request.manualWorkoutData.programName || null,
      split_name: request.manualWorkoutData.splitName || null,
      workout_days_per_week: request.manualWorkoutData.workoutDaysPerWeek || null,
      rest_days_per_week: request.manualWorkoutData.restDaysPerWeek || null,
      training_style: request.manualWorkoutData.trainingStyle || null,
      program_notes: request.manualWorkoutData.programNotes || null,
      monday_plan: request.manualWorkoutData.mondayPlan || null,
      tuesday_plan: request.manualWorkoutData.tuesdayPlan || null,
      wednesday_plan: request.manualWorkoutData.wednesdayPlan || null,
      thursday_plan: request.manualWorkoutData.thursdayPlan || null,
      friday_plan: request.manualWorkoutData.fridayPlan || null,
      saturday_plan: request.manualWorkoutData.saturdayPlan || null,
      sunday_plan: request.manualWorkoutData.sundayPlan || null,
      muscle_group_focus: request.manualWorkoutData.muscleGroupFocus || null,
      frequency_by_muscle_group: request.manualWorkoutData.frequencyByMuscleGroup || null,
      planned_volume_notes: request.manualWorkoutData.plannedVolumeNotes || null,
      planned_intensity_notes: request.manualWorkoutData.plannedIntensityNotes || null,
      cardio_or_conditioning_notes: request.manualWorkoutData.cardioOrConditioningNotes || null,
      mobility_or_recovery_notes: request.manualWorkoutData.mobilityOrRecoveryNotes || null,
      exercises: request.manualWorkoutData.exercises || null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_BASELINES)
    .insert(baselineData as any)
    .select()
    .single();

  if (profileError || !profile) {
    logger.error('Failed to create workout baseline', { error: profileError });
    throw new Error('Failed to create workout baseline');
  }

  // Create extracted sections (placeholder for manual entry)
  const extractedSections: WorkoutExtractedSection[] = [];

  if (request.manualWorkoutData) {
    // Create extracted sections for manual data
    const sections = [
      { name: 'program_structure', data: request.manualWorkoutData },
      { name: 'weekly_schedule', data: request.manualWorkoutData },
      { name: 'workout_context', data: request.manualWorkoutData },
      { name: 'exercise_layer', data: request.manualWorkoutData.exercises },
    ];

    for (const section of sections) {
      if (section.data) {
        const { data: extracted, error: extractedError } = await supabase
          .from(WORKOUT_TABLES.WORKOUT_EXTRACTED_SECTIONS)
          .insert({
            user_id: request.userId,
            document_id: (document as any).id,
            raw_text: JSON.stringify(section.data),
            normalized_name: section.name,
            extraction_confidence: 1.0,
            created_at: now,
          } as any)
          .select()
          .single();

        if (!extractedError && extracted) {
          extractedSections.push({
            id: (extracted as any).id,
            userId: (extracted as any).user_id,
            documentId: (extracted as any).document_id,
            rawText: (extracted as any).raw_text,
            normalizedName: (extracted as any).normalized_name,
            extractionConfidence: (extracted as any).extraction_confidence,
            createdAt: (extracted as any).created_at,
          });
        }
      }
    }
  }

  // Map database records to TypeScript interfaces
  const workoutDocument: WorkoutDocument = {
    id: (document as any).id,
    userId: (document as any).user_id,
    fileReference: (document as any).file_reference,
    storagePath: (document as any).storage_path,
    uploadDate: (document as any).upload_date,
    documentType: (document as any).document_type,
    programStartDate: (document as any).program_start_date,
    parseStatus: (document as any).parse_status,
    extractionConfidence: (document as any).extraction_confidence,
    notes: (document as any).notes,
    createdAt: (document as any).created_at,
    updatedAt: (document as any).updated_at,
  };

  const workoutBaseline: WorkoutBaseline = {
    id: (profile as any).id,
    userId: (profile as any).user_id,
    documentId: (profile as any).document_id,
    programName: (profile as any).program_name,
    splitName: (profile as any).split_name,
    workoutDaysPerWeek: (profile as any).workout_days_per_week,
    restDaysPerWeek: (profile as any).rest_days_per_week,
    trainingStyle: (profile as any).training_style,
    programNotes: (profile as any).program_notes,
    mondayPlan: (profile as any).monday_plan,
    tuesdayPlan: (profile as any).tuesday_plan,
    wednesdayPlan: (profile as any).wednesday_plan,
    thursdayPlan: (profile as any).thursday_plan,
    fridayPlan: (profile as any).friday_plan,
    saturdayPlan: (profile as any).saturday_plan,
    sundayPlan: (profile as any).sunday_plan,
    muscleGroupFocus: (profile as any).muscle_group_focus,
    frequencyByMuscleGroup: (profile as any).frequency_by_muscle_group,
    plannedVolumeNotes: (profile as any).planned_volume_notes,
    plannedIntensityNotes: (profile as any).planned_intensity_notes,
    cardioOrConditioningNotes: (profile as any).cardio_or_conditioning_notes,
    mobilityOrRecoveryNotes: (profile as any).mobility_or_recovery_notes,
    exercises: (profile as any).exercises,
    extractedAt: (profile as any).extracted_at,
    createdAt: (profile as any).created_at,
    updatedAt: (profile as any).updated_at,
  };

  return {
    document: workoutDocument,
    baseline: workoutBaseline,
    extractedSections,
  };
};

// Get latest workout document for a user
export const getLatestWorkoutDocument = async (userId: string): Promise<WorkoutDocument | null> => {
  const { data, error } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_DOCUMENTS)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: (data as any).id,
    userId: (data as any).user_id,
    fileReference: (data as any).file_reference,
    storagePath: (data as any).storage_path,
    uploadDate: (data as any).upload_date,
    documentType: (data as any).document_type,
    programStartDate: (data as any).program_start_date,
    parseStatus: (data as any).parse_status,
    extractionConfidence: (data as any).extraction_confidence,
    notes: (data as any).notes,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  };
};

// Get workout baseline for a user
export const getWorkoutBaseline = async (userId: string): Promise<WorkoutBaseline | null> => {
  const { data, error } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_BASELINES)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: (data as any).id,
    userId: (data as any).user_id,
    documentId: (data as any).document_id,
    programName: (data as any).program_name,
    splitName: (data as any).split_name,
    workoutDaysPerWeek: (data as any).workout_days_per_week,
    restDaysPerWeek: (data as any).rest_days_per_week,
    trainingStyle: (data as any).training_style,
    programNotes: (data as any).program_notes,
    mondayPlan: (data as any).monday_plan,
    tuesdayPlan: (data as any).tuesday_plan,
    wednesdayPlan: (data as any).wednesday_plan,
    thursdayPlan: (data as any).thursday_plan,
    fridayPlan: (data as any).friday_plan,
    saturdayPlan: (data as any).saturday_plan,
    sundayPlan: (data as any).sunday_plan,
    muscleGroupFocus: (data as any).muscle_group_focus,
    frequencyByMuscleGroup: (data as any).frequency_by_muscle_group,
    plannedVolumeNotes: (data as any).planned_volume_notes,
    plannedIntensityNotes: (data as any).planned_intensity_notes,
    cardioOrConditioningNotes: (data as any).cardio_or_conditioning_notes,
    mobilityOrRecoveryNotes: (data as any).mobility_or_recovery_notes,
    exercises: (data as any).exercises,
    extractedAt: (data as any).extracted_at,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  };
};

// Log workout baseline changes (for future agent refinement)
export const logWorkoutChange = async (
  userId: string,
  workoutBaselineId: string,
  fieldName: string,
  oldValue: string | undefined,
  newValue: string | undefined,
  changeSource: WorkoutChangeSource,
  rationale?: string
): Promise<WorkoutChangeLog> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_CHANGE_LOG)
    .insert({
      user_id: userId,
      workout_baseline_id: workoutBaselineId,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      change_source: changeSource,
      rationale,
      changed_at: now,
    } as any)
    .select()
    .single();

  if (error || !data) {
    logger.error('Failed to log workout change', { error });
    throw new Error('Failed to log workout change');
  }

  return {
    id: (data as any).id,
    userId: (data as any).user_id,
    workoutBaselineId: (data as any).workout_baseline_id,
    fieldName: (data as any).field_name,
    oldValue: (data as any).old_value,
    newValue: (data as any).new_value,
    changeSource: (data as any).change_source,
    rationale: (data as any).rationale,
    changedAt: (data as any).changed_at,
  };
};

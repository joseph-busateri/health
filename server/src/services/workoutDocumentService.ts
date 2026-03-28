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
import { uploadFileToStorage, downloadFileFromStorage, getPublicUrlForStoragePath } from './storageService';
import { extractTextFromBuffer } from './ocrService';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function parseListLines(lines: string[]): string[] {
  return lines
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
}

function parseNamedSection(lines: string[], sectionName: string): string[] {
  const startIndex = lines.findIndex(line => line.toLowerCase().startsWith(sectionName.toLowerCase()));
  if (startIndex === -1) {
    return [];
  }

  const sectionLines: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (/^[A-Z][A-Za-z\s]+:$/.test(line)) {
      break;
    }
    sectionLines.push(line);
  }
  return sectionLines;
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }
  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseWorkoutText(text: string): ManualWorkoutData | undefined {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) {
    return undefined;
  }

  const lines = cleaned.split(/\n|\. /).map(line => line.trim()).filter(Boolean);

  const data: ManualWorkoutData = {};

  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) {
      continue;
    }
    const key = kv.key.toLowerCase();
    const value = kv.value;

    if (key.includes('program name')) {
      data.programName = value;
    } else if (key.includes('split')) {
      data.splitName = value;
    } else if (key.includes('days per week')) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        data.workoutDaysPerWeek = numeric;
      }
    } else if (key.includes('rest days')) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        data.restDaysPerWeek = numeric;
      }
    } else if (key.includes('training style')) {
      data.trainingStyle = value;
    } else if (key.includes('program notes')) {
      data.programNotes = value;
    }
  }

  const weeklySection = parseNamedSection(lines, 'Weekly Schedule:');
  weeklySection.forEach(line => {
    const kv = parseKeyValue(line);
    if (!kv) return;
    const day = kv.key.toLowerCase();
    const value = kv.value;
    if (day.includes('monday')) data.mondayPlan = value;
    if (day.includes('tuesday')) data.tuesdayPlan = value;
    if (day.includes('wednesday')) data.wednesdayPlan = value;
    if (day.includes('thursday')) data.thursdayPlan = value;
    if (day.includes('friday')) data.fridayPlan = value;
    if (day.includes('saturday')) data.saturdayPlan = value;
    if (day.includes('sunday')) data.sundayPlan = value;
  });

  const contextSection = parseNamedSection(lines, 'Workout Context:');
  if (contextSection.length) {
    const contextMap: Record<string, string> = {};
    contextSection.forEach(line => {
      const kv = parseKeyValue(line);
      if (!kv) return;
      contextMap[kv.key.toLowerCase()] = kv.value;
    });
    if (contextMap['muscle group focus']) {
      data.muscleGroupFocus = contextMap['muscle group focus'].split(',').map(value => value.trim()).filter(Boolean);
    }
    if (contextMap['cardio']) {
      data.cardioOrConditioningNotes = contextMap['cardio'];
    }
    if (contextMap['mobility']) {
      data.mobilityOrRecoveryNotes = contextMap['mobility'];
    }
    if (contextMap['volume']) {
      data.plannedVolumeNotes = contextMap['volume'];
    }
    if (contextMap['intensity']) {
      data.plannedIntensityNotes = contextMap['intensity'];
    }
  }

  const exerciseLines = parseNamedSection(lines, 'Exercises:');
  if (exerciseLines.length) {
    data.exercises = exerciseLines.map(line => {
      const match = /^(?<day>[A-Za-z]+)\s*-\s*(?<name>[^-]+?)(?:\s*-\s*(?<notes>.+))?$/.exec(line);
      if (!match?.groups) {
        return {
          name: line,
          dayAssociation: 'unspecified',
        };
      }
      return {
        name: match.groups.name.trim(),
        dayAssociation: match.groups.day.trim(),
        setRepLoadNotes: match.groups.notes?.trim(),
      };
    });
  }

  const hasData = Object.values(data).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
    return value != null && value !== '';
  });

  return hasData ? data : undefined;
}

export const createWorkoutDocument = async (
  request: CreateWorkoutDocumentRequest & { fileBuffer?: Buffer; mimeType?: string; originalFileName?: string }
): Promise<WorkoutDocumentResult> => {
  const now = new Date().toISOString();

  let storagePath = request.storagePath;
  let fileReference = request.fileReference;
  let publicUrl: string | null = null;

  if (request.fileBuffer && !storagePath) {
    const fileExtension = request.originalFileName ? `.${request.originalFileName.split('.').pop()}` : '.bin';
    storagePath = `workout/${request.userId}/${Date.now()}${fileExtension}`;
    const uploadResult = await uploadFileToStorage({
      path: storagePath,
      file: request.fileBuffer,
      contentType: request.mimeType,
    });
    publicUrl = uploadResult.publicUrl;
    fileReference = publicUrl ?? storagePath;
  }

  const { data: document, error: documentError } = await supabase
    .from(WORKOUT_TABLES.WORKOUT_DOCUMENTS)
    .insert({
      user_id: request.userId,
      file_reference: fileReference,
      storage_path: storagePath,
      upload_date: now.split('T')[0],
      document_type: request.documentType,
      program_start_date: request.programStartDate,
      parse_status: 'processing' as any,
      extraction_confidence: null,
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

  let manualData = request.manualWorkoutData;

  if (!manualData && storagePath) {
    const fileBuffer = await downloadFileFromStorage(storagePath);
    const { text } = await extractTextFromBuffer(fileBuffer, request.mimeType);
    manualData = parseWorkoutText(text);
  }

  const baselineData: any = {
    user_id: request.userId,
    document_id: (document as any).id,
    extracted_at: now,
    created_at: now,
    updated_at: now,
    program_name: manualData?.programName || null,
    split_name: manualData?.splitName || null,
    workout_days_per_week: manualData?.workoutDaysPerWeek ?? null,
    rest_days_per_week: manualData?.restDaysPerWeek ?? null,
    training_style: manualData?.trainingStyle || null,
    program_notes: manualData?.programNotes || null,
    monday_plan: manualData?.mondayPlan || null,
    tuesday_plan: manualData?.tuesdayPlan || null,
    wednesday_plan: manualData?.wednesdayPlan || null,
    thursday_plan: manualData?.thursdayPlan || null,
    friday_plan: manualData?.fridayPlan || null,
    saturday_plan: manualData?.saturdayPlan || null,
    sunday_plan: manualData?.sundayPlan || null,
    muscle_group_focus: manualData?.muscleGroupFocus || null,
    frequency_by_muscle_group: manualData?.frequencyByMuscleGroup || null,
    planned_volume_notes: manualData?.plannedVolumeNotes || null,
    planned_intensity_notes: manualData?.plannedIntensityNotes || null,
    cardio_or_conditioning_notes: manualData?.cardioOrConditioningNotes || null,
    mobility_or_recovery_notes: manualData?.mobilityOrRecoveryNotes || null,
    exercises: manualData?.exercises || null,
  };

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

  if (manualData) {
    const sections = [
      { name: 'program_structure', data: manualData },
      { name: 'weekly_schedule', data: manualData },
      { name: 'workout_context', data: manualData },
      { name: 'exercise_layer', data: manualData.exercises },
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
    fileReference: fileReference || undefined,
    storagePath: storagePath || undefined,
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

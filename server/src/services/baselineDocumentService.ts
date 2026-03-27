import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type {
  BaselineDocument,
  BaselineProfile,
  BaselineExtractedSection,
  BaselineChangeLog,
  DocumentType,
  ParseStatus,
  Demographics,
  TrainingContext,
  LifestyleContext,
  OverallHealthGoals,
  SexualPerformanceGoals,
  WorkoutGoals,
  SecondaryGoals,
  PriorityOrder,
  ChangeSource,
} from '../types/baselineDocument';
import { logger } from '../utils/logger';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TABLES = {
  BASELINE_DOCUMENTS: 'baseline_documents',
  BASELINE_PROFILES: 'baseline_profiles',
  BASELINE_EXTRACTED_SECTIONS: 'baseline_extracted_sections',
  BASELINE_CHANGE_LOG: 'baseline_change_log',
} as const;

export interface CreateBaselineDocumentRequest {
  userId: string;
  documentType: DocumentType;
  fileReference?: string;
  storagePath?: string;
  notes?: string;
  manualProfileData?: ManualBaselineProfileData;
}

export interface ManualBaselineProfileData {
  demographics?: Demographics;
  trainingContext?: TrainingContext;
  lifestyleContext?: LifestyleContext;
  overallHealthGoals?: OverallHealthGoals;
  sexualPerformanceGoals?: SexualPerformanceGoals;
  workoutGoals?: WorkoutGoals;
  secondaryGoals?: SecondaryGoals;
  priorityOrder?: PriorityOrder;
}

export interface BaselineUploadResult {
  document: BaselineDocument;
  profile: BaselineProfile;
  extractedSections: BaselineExtractedSection[];
}

export const createBaselineDocument = async (
  request: CreateBaselineDocumentRequest,
): Promise<BaselineUploadResult> => {
  const now = new Date().toISOString();

  // Create baseline document record
  const { data: document, error: documentError } = await supabase
    .from(TABLES.BASELINE_DOCUMENTS)
    .insert({
      user_id: request.userId,
      file_reference: request.fileReference,
      storage_path: request.storagePath,
      upload_date: now.split('T')[0],
      document_type: request.documentType,
      parse_status: 'completed' as ParseStatus,
      extraction_confidence: request.manualProfileData ? 1.0 : null,
      notes: request.notes,
      created_at: now,
      updated_at: now,
    } as any)
    .select()
    .single();

  if (documentError || !document) {
    logger.error('Failed to create baseline document', { error: documentError });
    throw new Error('Failed to create baseline document');
  }

  // Create baseline profile record
  let profileData: any = {
    user_id: request.userId,
    document_id: (document as any).id,
    extracted_at: now,
    created_at: now,
    updated_at: now,
  };

  if (request.manualProfileData) {
    // Flatten the structured data into JSON fields
    profileData = {
      ...profileData,
      demographics: request.manualProfileData.demographics || null,
      training_context: request.manualProfileData.trainingContext || null,
      lifestyle_context: request.manualProfileData.lifestyleContext || null,
      overall_health_goals: request.manualProfileData.overallHealthGoals || null,
      sexual_performance_goals: request.manualProfileData.sexualPerformanceGoals || null,
      workout_goals: request.manualProfileData.workoutGoals || null,
      secondary_goals: request.manualProfileData.secondaryGoals || null,
      priority_order: request.manualProfileData.priorityOrder || null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.BASELINE_PROFILES)
    .insert(profileData as any)
    .select()
    .single();

  if (profileError || !profile) {
    logger.error('Failed to create baseline profile', { error: profileError });
    throw new Error('Failed to create baseline profile');
  }

  // Create extracted sections (placeholder for manual entry)
  const extractedSections: BaselineExtractedSection[] = [];
  if (request.manualProfileData) {
    const sections = [
      { name: 'demographics', data: request.manualProfileData.demographics },
      { name: 'training_context', data: request.manualProfileData.trainingContext },
      { name: 'lifestyle_context', data: request.manualProfileData.lifestyleContext },
      { name: 'overall_health_goals', data: request.manualProfileData.overallHealthGoals },
      { name: 'sexual_performance_goals', data: request.manualProfileData.sexualPerformanceGoals },
      { name: 'workout_goals', data: request.manualProfileData.workoutGoals },
      { name: 'secondary_goals', data: request.manualProfileData.secondaryGoals },
      { name: 'priority_order', data: request.manualProfileData.priorityOrder },
    ];

    for (const section of sections) {
      if (section.data) {
        const { data: extracted, error: extractedError } = await supabase
          .from(TABLES.BASELINE_EXTRACTED_SECTIONS)
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
  const baselineDocument: BaselineDocument = {
    id: (document as any).id,
    userId: (document as any).user_id,
    fileReference: (document as any).file_reference,
    storagePath: (document as any).storage_path,
    uploadDate: (document as any).upload_date,
    documentType: (document as any).document_type,
    parseStatus: (document as any).parse_status,
    extractionConfidence: (document as any).extraction_confidence,
    notes: (document as any).notes,
    createdAt: (document as any).created_at,
    updatedAt: (document as any).updated_at,
  };

  const baselineProfile: BaselineProfile = {
    id: (profile as any).id,
    userId: (profile as any).user_id,
    documentId: (profile as any).document_id,
    demographics: (profile as any).demographics,
    trainingContext: (profile as any).training_context,
    lifestyleContext: (profile as any).lifestyle_context,
    overallHealthGoals: (profile as any).overall_health_goals,
    sexualPerformanceGoals: (profile as any).sexual_performance_goals,
    workoutGoals: (profile as any).workout_goals,
    secondaryGoals: (profile as any).secondary_goals,
    priorityOrder: (profile as any).priority_order,
    extractedAt: (profile as any).extracted_at,
    createdAt: (profile as any).created_at,
    updatedAt: (profile as any).updated_at,
  };

  return {
    document: baselineDocument,
    profile: baselineProfile,
    extractedSections,
  };
};

export const getLatestBaselineDocument = async (userId: string): Promise<BaselineDocument | null> => {
  const { data, error } = await supabase
    .from(TABLES.BASELINE_DOCUMENTS)
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
    parseStatus: (data as any).parse_status,
    extractionConfidence: (data as any).extraction_confidence,
    notes: (data as any).notes,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  };
};

export const getBaselineProfile = async (userId: string): Promise<BaselineProfile | null> => {
  const { data, error } = await supabase
    .from(TABLES.BASELINE_PROFILES)
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
    demographics: (data as any).demographics,
    trainingContext: (data as any).training_context,
    lifestyleContext: (data as any).lifestyle_context,
    overallHealthGoals: (data as any).overall_health_goals,
    sexualPerformanceGoals: (data as any).sexual_performance_goals,
    workoutGoals: (data as any).workout_goals,
    secondaryGoals: (data as any).secondary_goals,
    priorityOrder: (data as any).priority_order,
    extractedAt: (data as any).extracted_at,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  };
};

export const logBaselineChange = async (
  userId: string,
  baselineProfileId: string,
  fieldName: string,
  oldValue: string | undefined,
  newValue: string | undefined,
  changeSource: ChangeSource,
  rationale?: string,
): Promise<BaselineChangeLog> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLES.BASELINE_CHANGE_LOG)
    .insert({
      user_id: userId,
      baseline_profile_id: baselineProfileId,
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
    logger.error('Failed to log baseline change', { error });
    throw new Error('Failed to log baseline change');
  }

  return {
    id: (data as any).id,
    userId: (data as any).user_id,
    baselineProfileId: (data as any).baseline_profile_id,
    fieldName: (data as any).field_name,
    oldValue: (data as any).old_value,
    newValue: (data as any).new_value,
    changeSource: (data as any).change_source,
    rationale: (data as any).rationale,
    changedAt: (data as any).changed_at,
  };
};

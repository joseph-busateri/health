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
import { uploadFileToStorage, downloadFileFromStorage } from './storageService';
import { extractTextFromBuffer } from './ocrService';

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

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, '').replace(/\t/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function extractSection(lines: string[], header: string): string[] {
  const start = lines.findIndex(line => line.toLowerCase().startsWith(header.toLowerCase()));
  if (start === -1) return [];
  const sectionLines: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (/^[A-Z][A-Za-z\s]+:$/.test(line)) break;
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

function parseJsonBlock(lines: string[]): Record<string, unknown> | null {
  const joined = lines.join(' ');
  const jsonStart = joined.indexOf('{');
  if (jsonStart === -1) return null;
  const jsonEnd = joined.lastIndexOf('}');
  if (jsonEnd === -1) return null;
  try {
    return JSON.parse(joined.slice(jsonStart, jsonEnd + 1));
  } catch (error) {
    logger.warn('Failed to parse JSON block from baseline OCR', { error: (error as Error).message, joined });
    return null;
  }
}

function parseBaselineText(ocrText: string): ManualBaselineProfileData | undefined {
  const cleaned = normalizeWhitespace(ocrText);
  if (!cleaned) return undefined;

  const lines = cleaned.split(/\n|\. /).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return undefined;
  }

  const data: ManualBaselineProfileData = {};

  const demographicsBlock = extractSection(lines, 'Demographics:');
  if (demographicsBlock.length) {
    const parsed = parseJsonBlock(demographicsBlock);
    if (parsed) {
      data.demographics = parsed as Demographics;
    }
  }

  const trainingBlock = extractSection(lines, 'Training Context:');
  if (trainingBlock.length) {
    const parsed = parseJsonBlock(trainingBlock);
    if (parsed) {
      data.trainingContext = parsed as TrainingContext;
    }
  }

  const lifestyleBlock = extractSection(lines, 'Lifestyle Context:');
  if (lifestyleBlock.length) {
    const parsed = parseJsonBlock(lifestyleBlock);
    if (parsed) {
      data.lifestyleContext = parsed as LifestyleContext;
    }
  }

  const overallGoalsBlock = extractSection(lines, 'Overall Health Goals:');
  if (overallGoalsBlock.length) {
    const parsed = parseJsonBlock(overallGoalsBlock);
    if (parsed) {
      data.overallHealthGoals = parsed as OverallHealthGoals;
    }
  }

  const sexualGoalsBlock = extractSection(lines, 'Sexual Performance Goals:');
  if (sexualGoalsBlock.length) {
    const parsed = parseJsonBlock(sexualGoalsBlock);
    if (parsed) {
      data.sexualPerformanceGoals = parsed as SexualPerformanceGoals;
    }
  }

  const workoutGoalsBlock = extractSection(lines, 'Workout Goals:');
  if (workoutGoalsBlock.length) {
    const parsed = parseJsonBlock(workoutGoalsBlock);
    if (parsed) {
      data.workoutGoals = parsed as WorkoutGoals;
    }
  }

  const secondaryGoalsBlock = extractSection(lines, 'Secondary Goals:');
  if (secondaryGoalsBlock.length) {
    const parsed = parseJsonBlock(secondaryGoalsBlock);
    if (parsed) {
      data.secondaryGoals = parsed as SecondaryGoals;
    }
  }

  const priorityBlock = extractSection(lines, 'Priority Order:');
  if (priorityBlock.length) {
    const parsed = parseJsonBlock(priorityBlock);
    if (parsed) {
      data.priorityOrder = parsed as PriorityOrder;
    }
  }

  if (!data.demographics) {
    const simpleDemographics: Record<string, string> = {};
    for (const line of lines) {
      const kv = parseKeyValue(line);
      if (!kv) continue;
      if (['age', 'gender', 'height', 'weight'].some(token => kv.key.toLowerCase().includes(token))) {
        simpleDemographics[kv.key.toLowerCase()] = kv.value;
      }
    }
    if (Object.keys(simpleDemographics).length > 0) {
      data.demographics = simpleDemographics as Demographics;
    }
  }

  const hasData = Object.values(data).some(value => value != null);
  return hasData ? data : undefined;
}

export const createBaselineDocument = async (
  request: CreateBaselineDocumentRequest & { fileBuffer?: Buffer; mimeType?: string; originalFileName?: string }
): Promise<BaselineUploadResult> => {
  const now = new Date().toISOString();

  let storagePath = request.storagePath;
  let fileReference = request.fileReference;

  if (request.fileBuffer && !storagePath) {
    const fileExtension = request.originalFileName ? `.${request.originalFileName.split('.').pop()}` : '.bin';
    storagePath = `baseline/${request.userId}/${Date.now()}${fileExtension}`;
    const uploadResult = await uploadFileToStorage({
      path: storagePath,
      file: request.fileBuffer,
      contentType: request.mimeType,
    });
    fileReference = uploadResult.publicUrl ?? storagePath;
  }

  let manualProfileData = request.manualProfileData;

  if (!manualProfileData && storagePath) {
    const fileBuffer = await downloadFileFromStorage(storagePath);
    const { text } = await extractTextFromBuffer(fileBuffer, request.mimeType);
    manualProfileData = parseBaselineText(text);
  }

  const { data: document, error: documentError } = await supabase
    .from(TABLES.BASELINE_DOCUMENTS)
    .insert({
      user_id: request.userId,
      file_reference: fileReference,
      storage_path: storagePath,
      upload_date: now.split('T')[0],
      document_type: request.documentType,
      parse_status: manualProfileData ? 'completed' : ('processing' as ParseStatus),
      extraction_confidence: manualProfileData ? 1.0 : null,
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

  if (manualProfileData) {
    profileData = {
      ...profileData,
      demographics: manualProfileData.demographics || null,
      training_context: manualProfileData.trainingContext || null,
      lifestyle_context: manualProfileData.lifestyleContext || null,
      overall_health_goals: manualProfileData.overallHealthGoals || null,
      sexual_performance_goals: manualProfileData.sexualPerformanceGoals || null,
      workout_goals: manualProfileData.workoutGoals || null,
      secondary_goals: manualProfileData.secondaryGoals || null,
      priority_order: manualProfileData.priorityOrder || null,
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
  if (manualProfileData) {
    const sections = [
      { name: 'demographics', data: manualProfileData.demographics },
      { name: 'training_context', data: manualProfileData.trainingContext },
      { name: 'lifestyle_context', data: manualProfileData.lifestyleContext },
      { name: 'overall_health_goals', data: manualProfileData.overallHealthGoals },
      { name: 'sexual_performance_goals', data: manualProfileData.sexualPerformanceGoals },
      { name: 'workout_goals', data: manualProfileData.workoutGoals },
      { name: 'secondary_goals', data: manualProfileData.secondaryGoals },
      { name: 'priority_order', data: manualProfileData.priorityOrder },
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

// Supplement Baseline Service
// Handles supplement stack uploads, versioning, and agent-managed updates

import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase';
import { extractTextFromBuffer } from './ocrService';
import { parseSupplementExcel } from '../utils/supplementExcelParser';
import { logger } from '../utils/logger';

import type {
  SupplementStackVersion,
  Supplement,
  SupplementAdherenceLog,
  SupplementStackChange,
  SupplementBaselineDocument,
  SupplementInteraction,
  SupplementInventory,
  CompleteSupplementStack,
  CreateSupplementStackVersionInput,
  CreateSupplementInput,
  CreateSupplementAdherenceLogInput,
  ParsedSupplementData,
} from '../types/supplementBaseline';

// ============================================================================
// DOCUMENT UPLOAD & PROCESSING
// ============================================================================

export const uploadSupplementBaselineDocument = async (
  userId: string,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ documentId: string; stackVersionId?: string }> => {
  const documentId = randomUUID();
  const filePath = `supplements/${userId}/${documentId}_${fileName}`;

  try {
    // Store document metadata
    const { error: docError } = await supabase
      .from('supplement_baseline_documents')
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
    processSupplementDocument(documentId, file, mimeType, userId);

    return { documentId };
  } catch (error) {
    logger.error('Failed to upload supplement baseline document', { error, userId });
    throw error;
  }
};

const processSupplementDocument = async (
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<void> => {
  try {
    // Update status to processing
    await supabase
      .from('supplement_baseline_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Extract text via OCR
    const { text: extractedText } = await extractTextFromBuffer(fileBuffer, mimeType);

    // Parse supplement data
    const parsedData = parseSupplementExcel(extractedText);

    // Update document with extracted data
    await supabase
      .from('supplement_baseline_documents')
      .update({
        processing_status: 'completed',
        extracted_text: extractedText,
        parsed_supplement_data: parsedData,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Create supplement stack from parsed data
    if (parsedData && parsedData.supplements && parsedData.supplements.length > 0) {
      await createSupplementStackFromParsedData(userId, parsedData, documentId);
    }

    logger.info('Supplement baseline document processed successfully', { documentId, userId });
  } catch (error) {
    logger.error('Failed to process supplement baseline document', { error, documentId });
    
    await supabase
      .from('supplement_baseline_documents')
      .update({
        processing_status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);
  }
};

const createSupplementStackFromParsedData = async (
  userId: string,
  parsedData: ParsedSupplementData,
  documentId: string
): Promise<void> => {
  // Create supplement stack version
  const versionInput: CreateSupplementStackVersionInput = {
    userId,
    createdBy: 'user',
    createdReason: 'Initial baseline upload',
    effectiveFrom: new Date().toISOString().split('T')[0],
  };

  const version = await createSupplementStackVersion(versionInput);

  // Link document to version
  await supabase
    .from('supplement_baseline_documents')
    .update({ stack_version_id: version.id })
    .eq('id', documentId);

  // Create supplements
  for (const supplement of parsedData.supplements) {
    await createSupplement({
      stackVersionId: version.id,
      supplementName: supplement.supplementName,
      brand: supplement.brand,
      dosageAmount: supplement.dosageAmount,
      dosageUnit: supplement.dosageUnit,
      timing: supplement.timing,
      frequency: supplement.frequency || 'daily',
      goal: supplement.goal,
      reasonToTake: supplement.reasonToTake,
      supplementOrder: supplement.order,
    });
  }

  logger.info('Supplement stack created from parsed data', { userId, versionId: version.id });
};

// ============================================================================
// SUPPLEMENT STACK VERSION CRUD
// ============================================================================

export const createSupplementStackVersion = async (
  input: CreateSupplementStackVersionInput
): Promise<SupplementStackVersion> => {
  const versionId = randomUUID();

  // Get next version number
  const { data: existingVersions } = await supabase
    .from('supplement_stack_versions')
    .select('version_number')
    .eq('user_id', input.userId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersionNumber = existingVersions && existingVersions.length > 0 
    ? existingVersions[0].version_number + 1 
    : 1;

  const { data, error } = await supabase
    .from('supplement_stack_versions')
    .insert({
      id: versionId,
      user_id: input.userId,
      version_number: nextVersionNumber,
      version_name: input.versionName,
      is_current: true,
      created_by: input.createdBy,
      created_reason: input.createdReason,
      based_on_recommendation_id: input.basedOnRecommendationId,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToStackVersion(data);
};

export const getCurrentSupplementStack = async (userId: string): Promise<CompleteSupplementStack | null> => {
  // Get current version
  const { data: versionData, error: versionError } = await supabase
    .from('supplement_stack_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .single();

  if (versionError) {
    if (versionError.code === 'PGRST116') return null;
    throw versionError;
  }

  const version = mapDatabaseToStackVersion(versionData);

  // Get supplements
  const { data: supplementsData, error: supplementsError } = await supabase
    .from('supplements')
    .select('*')
    .eq('stack_version_id', version.id)
    .eq('status', 'active')
    .order('supplement_order');

  if (supplementsError) throw supplementsError;

  const supplements = supplementsData.map(mapDatabaseToSupplement);

  // Get recent changes
  const { data: changesData } = await supabase
    .from('supplement_stack_changes')
    .select('*')
    .eq('to_version_id', version.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const changes = changesData ? changesData.map(mapDatabaseToChange) : [];

  // Check for interactions
  const supplementNames = supplements.map(s => s.supplementName);
  const interactions = await checkSupplementInteractions(supplementNames);

  return {
    version,
    supplements,
    changes,
    interactions,
  };
};

// ============================================================================
// SUPPLEMENT CRUD
// ============================================================================

const createSupplement = async (input: CreateSupplementInput): Promise<string> => {
  const supplementId = randomUUID();

  const { error } = await supabase
    .from('supplements')
    .insert({
      id: supplementId,
      stack_version_id: input.stackVersionId,
      supplement_name: input.supplementName,
      brand: input.brand,
      form: input.form,
      dosage_amount: input.dosageAmount,
      dosage_unit: input.dosageUnit,
      timing: input.timing,
      frequency: input.frequency,
      times_per_day: input.timesPerDay || 1,
      goal: input.goal,
      reason_to_take: input.reasonToTake,
      take_with_food: input.takeWithFood || false,
      take_with_water: input.takeWithWater !== false,
      avoid_with: input.avoidWith,
      cost_per_serving: input.costPerServing,
      servings_per_container: input.servingsPerContainer,
      status: 'active',
      supplement_order: input.supplementOrder,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
  return supplementId;
};

// ============================================================================
// ADHERENCE LOGGING
// ============================================================================

export const logSupplementAdherence = async (
  input: CreateSupplementAdherenceLogInput
): Promise<SupplementAdherenceLog> => {
  const logId = randomUUID();

  const { data, error } = await supabase
    .from('supplement_adherence_log')
    .insert({
      id: logId,
      user_id: input.userId,
      supplement_id: input.supplementId,
      stack_version_id: input.stackVersionId,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      taken: input.taken,
      taken_at: input.takenAt,
      planned_dosage_amount: input.plannedDosageAmount,
      actual_dosage_amount: input.actualDosageAmount,
      dosage_unit: input.dosageUnit,
      missed: input.missed || false,
      miss_reason: input.missReason,
      side_effects_reported: input.sideEffectsReported || false,
      side_effects_description: input.sideEffectsDescription,
      side_effects_severity: input.sideEffectsSeverity,
      perceived_effectiveness: input.perceivedEffectiveness,
      notes: input.notes,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToAdherenceLog(data);
};

export const getSupplementAdherenceHistory = async (
  userId: string,
  days: number = 30
): Promise<SupplementAdherenceLog[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('supplement_adherence_log')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: false });

  if (error) throw error;
  return data.map(mapDatabaseToAdherenceLog);
};

export const calculateSupplementAdherence = async (
  supplementId: string,
  days: number = 30
): Promise<number> => {
  const { data, error } = await supabase.rpc('calculate_supplement_adherence', {
    p_supplement_id: supplementId,
    p_days: days,
  });

  if (error) throw error;
  return data || 0;
};

// ============================================================================
// INTERACTION CHECKING
// ============================================================================

export const checkSupplementInteractions = async (
  supplementNames: string[]
): Promise<SupplementInteraction[]> => {
  if (supplementNames.length === 0) return [];

  const { data, error } = await supabase.rpc('check_supplement_interactions', {
    p_supplement_names: supplementNames,
  });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export const updateSupplementInventory = async (
  userId: string,
  supplementId: string,
  currentServings: number
): Promise<void> => {
  const { error } = await supabase
    .from('supplement_inventory')
    .upsert({
      user_id: userId,
      supplement_id: supplementId,
      current_servings: currentServings,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

export const getReorderAlerts = async (userId: string): Promise<SupplementInventory[]> => {
  const { data, error } = await supabase
    .from('supplement_inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('needs_reorder', true)
    .order('current_servings');

  if (error) throw error;
  return data.map(mapDatabaseToInventory);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapDatabaseToStackVersion = (data: any): SupplementStackVersion => ({
  id: data.id,
  userId: data.user_id,
  versionNumber: data.version_number,
  versionName: data.version_name,
  isCurrent: data.is_current,
  createdBy: data.created_by,
  createdReason: data.created_reason,
  basedOnRecommendationId: data.based_on_recommendation_id,
  effectiveFrom: data.effective_from,
  effectiveTo: data.effective_to,
  createdAt: data.created_at,
});

const mapDatabaseToSupplement = (data: any): Supplement => ({
  id: data.id,
  stackVersionId: data.stack_version_id,
  supplementName: data.supplement_name,
  brand: data.brand,
  form: data.form,
  dosageAmount: data.dosage_amount,
  dosageUnit: data.dosage_unit,
  timing: data.timing,
  frequency: data.frequency,
  timesPerDay: data.times_per_day,
  goal: data.goal,
  reasonToTake: data.reason_to_take,
  takeWithFood: data.take_with_food,
  takeWithWater: data.take_with_water,
  avoidWith: data.avoid_with,
  costPerServing: data.cost_per_serving,
  servingsPerContainer: data.servings_per_container,
  status: data.status,
  discontinueReason: data.discontinue_reason,
  supplementOrder: data.supplement_order,
  createdAt: data.created_at,
});

const mapDatabaseToAdherenceLog = (data: any): SupplementAdherenceLog => ({
  id: data.id,
  userId: data.user_id,
  supplementId: data.supplement_id,
  stackVersionId: data.stack_version_id,
  scheduledDate: data.scheduled_date,
  scheduledTime: data.scheduled_time,
  taken: data.taken,
  takenAt: data.taken_at,
  plannedDosageAmount: data.planned_dosage_amount,
  actualDosageAmount: data.actual_dosage_amount,
  dosageUnit: data.dosage_unit,
  missed: data.missed,
  missReason: data.miss_reason,
  sideEffectsReported: data.side_effects_reported,
  sideEffectsDescription: data.side_effects_description,
  sideEffectsSeverity: data.side_effects_severity,
  perceivedEffectiveness: data.perceived_effectiveness,
  notes: data.notes,
  createdAt: data.created_at,
});

const mapDatabaseToChange = (data: any): SupplementStackChange => ({
  id: data.id,
  fromVersionId: data.from_version_id,
  toVersionId: data.to_version_id,
  changeType: data.change_type,
  changeDescription: data.change_description,
  supplementName: data.supplement_name,
  oldValue: data.old_value,
  newValue: data.new_value,
  reason: data.reason,
  triggeredByBloodwork: data.triggered_by_bloodwork,
  triggeredBySideEffects: data.triggered_by_side_effects,
  triggeredByAdherence: data.triggered_by_adherence,
  triggeredByPerformance: data.triggered_by_performance,
  createdAt: data.created_at,
});

const mapDatabaseToInventory = (data: any): SupplementInventory => ({
  id: data.id,
  userId: data.user_id,
  supplementId: data.supplement_id,
  supplementName: data.supplement_name,
  brand: data.brand,
  currentServings: data.current_servings,
  servingsPerContainer: data.servings_per_container,
  reorderThreshold: data.reorder_threshold,
  needsReorder: data.needs_reorder,
  lastPurchaseDate: data.last_purchase_date,
  lastPurchaseCost: data.last_purchase_cost,
  vendor: data.vendor,
  expirationDate: data.expiration_date,
  updatedAt: data.updated_at,
});

import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase';
import { extractTextFromBuffer } from './ocrService';
import { parseInBodyScan } from '../utils/inbodyParser';
import logger from '../utils/logger';

import type {
  BodyCompositionScan,
  BodyCompositionDocument,
  BodyCompositionGoal,
  BodyCompositionTrend,
  BodyCompositionAnomaly,
  CreateBodyCompositionScanInput,
  CreateBodyCompositionGoalInput,
  UploadBodyCompositionDocumentRequest,
  ParsedScanData,
} from '../types/bodyComposition';

// ============================================================================
// DOCUMENT UPLOAD & PROCESSING
// ============================================================================

export const uploadBodyCompositionDocument = async (
  request: UploadBodyCompositionDocumentRequest
): Promise<{ documentId: string; scanId?: string }> => {
  const documentId = randomUUID();
  const filePath = `body-composition/${request.userId}/${documentId}_${request.fileName}`;

  try {
    // Store document metadata
    const { error: docError } = await supabase
      .from('body_composition_documents')
      .insert({
        id: documentId,
        user_id: request.userId,
        file_name: request.fileName,
        file_path: filePath,
        file_size: request.file.length,
        mime_type: request.mimeType,
        processing_status: 'pending',
        uploaded_at: new Date().toISOString(),
      });

    if (docError) throw docError;

    // Process document asynchronously
    processBodyCompositionDocument(documentId, request.file, request.mimeType, request.userId);

    return { documentId };
  } catch (error) {
    logger.error('Failed to upload body composition document', { error, userId: request.userId });
    throw error;
  }
};

const processBodyCompositionDocument = async (
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string,
  userId: string
): Promise<void> => {
  try {
    // Update status to processing
    await supabase
      .from('body_composition_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Extract text via OCR
    const { text: extractedText } = await extractTextFromBuffer(fileBuffer, mimeType);

    // Parse scan data
    const parsedData = parseInBodyScan(extractedText);

    // Detect scan source
    const detectedSource = detectScanSource(extractedText, parsedData);

    // Update document with extracted data
    await supabase
      .from('body_composition_documents')
      .update({
        processing_status: 'completed',
        extracted_text: extractedText,
        parsed_scan_data: parsedData,
        detected_source: detectedSource,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Create body composition scan from parsed data
    if (parsedData && parsedData.weight) {
      const scanInput = convertParsedDataToScanInput(userId, parsedData, detectedSource, documentId);
      await createBodyCompositionScan(scanInput);
    }

    logger.info('Body composition document processed successfully', { documentId, userId });
  } catch (error) {
    logger.error('Failed to process body composition document', { error, documentId });
    
    await supabase
      .from('body_composition_documents')
      .update({
        processing_status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);
  }
};

const detectScanSource = (extractedText: string, parsedData: ParsedScanData | null): string => {
  const text = extractedText.toLowerCase();
  
  if (text.includes('inbody s2') || text.includes('inbodys2')) return 'inbody_s2';
  if (text.includes('inbody 570') || text.includes('inbody570')) return 'inbody_570';
  if (text.includes('inbody 770') || text.includes('inbody770')) return 'inbody_770';
  if (text.includes('dexa') || text.includes('dxa')) return 'dexa';
  
  return 'other_scale';
};

const convertParsedDataToScanInput = (
  userId: string,
  parsedData: ParsedScanData,
  scanSource: string,
  documentId: string
): CreateBodyCompositionScanInput => {
  // Convert height string to inches if needed
  let heightInches: number | undefined;
  if (parsedData.height) {
    const heightMatch = parsedData.height.match(/(\d+)ft\s*(\d+(?:\.\d+)?)/);
    if (heightMatch) {
      heightInches = parseInt(heightMatch[1]) * 12 + parseFloat(heightMatch[2]);
    }
  }

  // Convert weight to pounds if in kg
  let weightLb = parsedData.weight || 0;
  if (parsedData.weightUnit === 'kg') {
    weightLb = weightLb * 2.20462;
  }

  return {
    userId,
    scanDate: parsedData.testDate || new Date().toISOString().split('T')[0],
    scanSource: scanSource as any,
    scanId: parsedData.scanId,
    heightInches,
    age: parsedData.age,
    gender: parsedData.gender,
    weightLb,
    totalBodyWaterLb: parsedData.totalBodyWater,
    dryLeanMassLb: parsedData.dryLeanMass,
    bodyFatMassLb: parsedData.bodyFatMass,
    bodyFatPercentage: parsedData.bodyFatPercentage,
    skeletalMuscleMassLb: parsedData.skeletalMuscleMass,
    visceralFatLevel: parsedData.visceralFatLevel,
    bmi: parsedData.bmi,
    basalMetabolicRateKcal: parsedData.bmr,
    documentId,
  };
};

// ============================================================================
// BODY COMPOSITION SCAN CRUD
// ============================================================================

export const createBodyCompositionScan = async (
  input: CreateBodyCompositionScanInput
): Promise<BodyCompositionScan> => {
  const scanId = randomUUID();

  const { data, error } = await supabase
    .from('body_composition_scans')
    .insert({
      id: scanId,
      user_id: input.userId,
      scan_date: input.scanDate,
      scan_time: input.scanTime,
      scan_source: input.scanSource,
      scan_id: input.scanId,
      height_inches: input.heightInches,
      age: input.age,
      gender: input.gender,
      weight_lb: input.weightLb,
      total_body_water_lb: input.totalBodyWaterLb,
      dry_lean_mass_lb: input.dryLeanMassLb,
      body_fat_mass_lb: input.bodyFatMassLb,
      body_fat_percentage: input.bodyFatPercentage,
      lean_body_mass_percentage: input.leanBodyMassPercentage,
      body_water_percentage: input.bodyWaterPercentage,
      skeletal_muscle_mass_lb: input.skeletalMuscleMassLb,
      skeletal_muscle_mass_percentage: input.skeletalMuscleMassPercentage,
      visceral_fat_level: input.visceralFatLevel,
      visceral_fat_area_cm2: input.visceralFatAreaCm2,
      subcutaneous_fat_percentage: input.subcutaneousFatPercentage,
      bone_mineral_content_lb: input.boneMineralContentLb,
      protein_mass_lb: input.proteinMassLb,
      protein_percentage: input.proteinPercentage,
      basal_metabolic_rate_kcal: input.basalMetabolicRateKcal,
      total_energy_expenditure_kcal: input.totalEnergyExpenditureKcal,
      bmi: input.bmi,
      body_mass_index_category: input.bodyMassIndexCategory,
      metabolic_age: input.metabolicAge,
      body_type: input.bodyType,
      document_id: input.documentId,
      scan_quality: input.scanQuality,
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToScan(data);
};

export const getLatestBodyComposition = async (userId: string): Promise<BodyCompositionScan | null> => {
  const { data, error } = await supabase
    .from('body_composition_scans')
    .select('*')
    .eq('user_id', userId)
    .order('scan_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }

  return mapDatabaseToScan(data);
};

export const getBodyCompositionScans = async (
  userId: string,
  limit: number = 30
): Promise<BodyCompositionScan[]> => {
  const { data, error } = await supabase
    .from('body_composition_scans')
    .select('*')
    .eq('user_id', userId)
    .order('scan_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(mapDatabaseToScan);
};

export const getBodyCompositionTrends = async (
  userId: string,
  days: number = 30
): Promise<BodyCompositionTrend[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('body_composition_trends')
    .select('*')
    .eq('user_id', userId)
    .gte('scan_date', startDate.toISOString().split('T')[0])
    .order('scan_date', { ascending: false });

  if (error) throw error;
  return data.map(mapDatabaseToTrend);
};

// ============================================================================
// GOAL MANAGEMENT
// ============================================================================

export const createBodyCompositionGoal = async (
  input: CreateBodyCompositionGoalInput
): Promise<BodyCompositionGoal> => {
  const goalId = randomUUID();

  const { data, error } = await supabase
    .from('body_composition_goals')
    .insert({
      id: goalId,
      user_id: input.userId,
      goal_name: input.goalName,
      goal_type: input.goalType,
      created_by: input.createdBy,
      target_weight_lb: input.targetWeightLb,
      target_body_fat_percentage: input.targetBodyFatPercentage,
      target_lean_mass_lb: input.targetLeanMassLb,
      target_skeletal_muscle_lb: input.targetSkeletalMuscleLb,
      target_visceral_fat_level: input.targetVisceralFatLevel,
      target_date: input.targetDate,
      weekly_rate_of_change: input.weeklyRateOfChange,
      status: 'active',
      starting_scan_id: input.startingScanId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapDatabaseToGoal(data);
};

export const getActiveGoals = async (userId: string): Promise<BodyCompositionGoal[]> => {
  const { data, error } = await supabase
    .from('body_composition_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDatabaseToGoal);
};

export const calculateGoalProgress = async (goalId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('calculate_body_comp_progress', {
    p_goal_id: goalId,
  });

  if (error) throw error;
  return data || 0;
};

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export const detectAnomalies = async (
  userId: string,
  scanId: string
): Promise<BodyCompositionAnomaly[]> => {
  const { data, error } = await supabase.rpc('detect_body_comp_anomalies', {
    p_user_id: userId,
    p_scan_id: scanId,
  });

  if (error) throw error;
  return data || [];
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapDatabaseToScan = (data: any): BodyCompositionScan => ({
  id: data.id,
  userId: data.user_id,
  scanDate: data.scan_date,
  scanTime: data.scan_time,
  scanSource: data.scan_source,
  scanId: data.scan_id,
  heightInches: data.height_inches,
  age: data.age,
  gender: data.gender,
  weightLb: data.weight_lb,
  totalBodyWaterLb: data.total_body_water_lb,
  dryLeanMassLb: data.dry_lean_mass_lb,
  bodyFatMassLb: data.body_fat_mass_lb,
  bodyFatPercentage: data.body_fat_percentage,
  leanBodyMassPercentage: data.lean_body_mass_percentage,
  bodyWaterPercentage: data.body_water_percentage,
  skeletalMuscleMassLb: data.skeletal_muscle_mass_lb,
  skeletalMuscleMassPercentage: data.skeletal_muscle_mass_percentage,
  visceralFatLevel: data.visceral_fat_level,
  visceralFatAreaCm2: data.visceral_fat_area_cm2,
  subcutaneousFatPercentage: data.subcutaneous_fat_percentage,
  boneMineralContentLb: data.bone_mineral_content_lb,
  proteinMassLb: data.protein_mass_lb,
  proteinPercentage: data.protein_percentage,
  basalMetabolicRateKcal: data.basal_metabolic_rate_kcal,
  totalEnergyExpenditureKcal: data.total_energy_expenditure_kcal,
  bmi: data.bmi,
  bodyMassIndexCategory: data.body_mass_index_category,
  metabolicAge: data.metabolic_age,
  bodyType: data.body_type,
  documentId: data.document_id,
  scanQuality: data.scan_quality,
  notes: data.notes,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapDatabaseToGoal = (data: any): BodyCompositionGoal => ({
  id: data.id,
  userId: data.user_id,
  goalName: data.goal_name,
  goalType: data.goal_type,
  createdBy: data.created_by,
  targetWeightLb: data.target_weight_lb,
  targetBodyFatPercentage: data.target_body_fat_percentage,
  targetLeanMassLb: data.target_lean_mass_lb,
  targetSkeletalMuscleLb: data.target_skeletal_muscle_lb,
  targetVisceralFatLevel: data.target_visceral_fat_level,
  targetDate: data.target_date,
  weeklyRateOfChange: data.weekly_rate_of_change,
  status: data.status,
  startingScanId: data.starting_scan_id,
  currentProgressPercentage: data.current_progress_percentage,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapDatabaseToTrend = (data: any): BodyCompositionTrend => ({
  userId: data.user_id,
  scanDate: data.scan_date,
  weightLb: data.weight_lb,
  bodyFatPercentage: data.body_fat_percentage,
  bodyFatMassLb: data.body_fat_mass_lb,
  leanBodyMassPercentage: data.lean_body_mass_percentage,
  dryLeanMassLb: data.dry_lean_mass_lb,
  skeletalMuscleMassLb: data.skeletal_muscle_mass_lb,
  visceralFatLevel: data.visceral_fat_level,
  bmi: data.bmi,
  basalMetabolicRateKcal: data.basal_metabolic_rate_kcal,
  previousWeightLb: data.previous_weight_lb,
  weightChangeLb: data.weight_change_lb,
  previousBodyFatPercentage: data.previous_body_fat_percentage,
  bodyFatChangePercentage: data.body_fat_change_percentage,
  previousMuscleMassLb: data.previous_muscle_mass_lb,
  muscleChangeLb: data.muscle_change_lb,
  daysSinceLastScan: data.days_since_last_scan,
});

// Backward compatibility
export const createBodyCompositionUpload = createBodyCompositionScan;
export const getBodyCompositionForUser = getBodyCompositionScans;

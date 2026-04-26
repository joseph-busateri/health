/**
 * Cardiovascular Engine Service
 * AI-enriched cardiovascular intelligence with deterministic fallback
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → AI Enrichment → Normalizer → Validator → Persistence
 * 
 * Preserves backward compatibility with existing cardiovascular logic
 */

import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { enrichCardiovascularRecommendation } from './cardiovascularAIEnrichment';
import { normalizeCardiovascularRecommendation } from './cardiovascularRecommendationNormalizer';
import { validateCardiovascularRecommendation } from './cardiovascularRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import { getLatestBodyCompositionContext } from './bodyCompositionContextService';
import { getStressToday } from './stressEngineService';
import { getRecoveryToday } from './recoveryEngineService';
import { getLatestBloodPressureContext, getSystolic, getDiastolic } from './bloodPressureContextService';
import { getLatestHeartRateContext, getRestingHR } from './heartRateContextService';
import { getLatestHRVContext, getHRV } from './hrvContextService';
import { getLatestFitnessContext, getVO2Max } from './fitnessContextService';
import type {
  CardiovascularRecord,
  CardiovascularStatus,
  CardiovascularInputs,
  CardiovascularEvidence,
  CardiovascularEvidenceSignal,
  CardiovascularRecommendation,
  // Legacy types for backward compatibility
  CardiovascularRiskLevel,
  BPRiskLevel,
  RestingHRAnalysis,
  BPAnalysis,
  LipidPanel,
} from '../types/cardiovascularEngine';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_CARDIOVASCULAR === 'true';

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const cardiovascularRecordStore = new Map<string, CardiovascularRecord[]>();

/**
 * Invalidate cardiovascular cache for a user (for current day)
 * Call this when dependent data changes (e.g., blood pressure, bloodwork)
 */
export function invalidateCardiovascularCache(userId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = cardiovascularRecordStore.get(userId) ?? [];
  const filteredRecords = userRecords.filter(record => record.date !== today);
  cardiovascularRecordStore.set(userId, filteredRecords);
  logger.info('🗑️ [CARDIOVASCULAR ENGINE] Cache invalidated', { userId, date: today });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate blood pressure is within physiologically plausible range
 */
function validateBloodPressure(systolic: number | null | undefined, diastolic: number | null | undefined): {
  valid: boolean;
  systolic: number | null;
  diastolic: number | null;
} {
  const systolicValid = systolic != null && systolic >= 70 && systolic <= 200;
  const diastolicValid = diastolic != null && diastolic >= 40 && diastolic <= 130;

  if (!systolicValid && systolic != null) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Invalid systolic BP rejected', { systolic, validRange: '70-200' });
  }
  if (!diastolicValid && diastolic != null) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Invalid diastolic BP rejected', { diastolic, validRange: '40-130' });
  }

  return {
    valid: systolicValid && diastolicValid,
    systolic: systolicValid ? systolic : null,
    diastolic: diastolicValid ? diastolic : null,
  };
}

/**
 * Validate cholesterol values are within physiologically plausible range
 */
function validateCholesterol(
  totalCholesterol: number | null | undefined,
  hdl: number | null | undefined,
  ldl: number | null | undefined
): {
  totalCholesterol: number | null;
  hdl: number | null;
  ldl: number | null;
} {
  const totalValid = totalCholesterol == null || (totalCholesterol >= 100 && totalCholesterol <= 400);
  const hdlValid = hdl == null || (hdl >= 20 && hdl <= 100);
  const ldlValid = ldl == null || (ldl >= 20 && ldl <= 200);

  if (!totalValid && totalCholesterol != null) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Invalid total cholesterol rejected', { totalCholesterol, validRange: '100-400' });
  }
  if (!hdlValid && hdl != null) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Invalid HDL rejected', { hdl, validRange: '20-100' });
  }
  if (!ldlValid && ldl != null) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Invalid LDL rejected', { ldl, validRange: '20-200' });
  }

  return {
    totalCholesterol: totalValid ? totalCholesterol : null,
    hdl: hdlValid ? hdl : null,
    ldl: ldlValid ? ldl : null,
  };
}

// ============================================================================
// LEGACY CALCULATION HELPERS (Preserved for backward compatibility)
// ============================================================================

/**
 * Analyze resting heart rate
 */
function analyzeRestingHR(restingHR: number | undefined, age: number): RestingHRAnalysis {
  if (!restingHR) {
    return {
      restingHR: undefined,
      hrStatus: 'average',
      hrTrend: 'stable',
    };
  }

  // Age-adjusted HR status
  let hrStatus: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';

  if (restingHR < 60) {
    hrStatus = 'excellent';
  } else if (restingHR < 70) {
    hrStatus = 'good';
  } else if (restingHR < 80) {
    hrStatus = 'average';
  } else if (restingHR < 90) {
    hrStatus = 'below_average';
  } else {
    hrStatus = 'poor';
  }

  return {
    restingHR,
    hrStatus,
    hrTrend: 'stable', // TODO: Calculate from historical data
  };
}

/**
 * Analyze blood pressure
 */
function analyzeBP(systolic: number | undefined, diastolic: number | undefined): BPAnalysis {
  if (!systolic || !diastolic) {
    return {
      systolic: undefined,
      diastolic: undefined,
      bpRisk: 'normal',
      hypertensionRisk: false,
    };
  }

  let bpRisk: BPRiskLevel;
  let hypertensionRisk = false;

  // ACC/AHA Blood Pressure Guidelines
  if (systolic < 120 && diastolic < 80) {
    bpRisk = 'optimal';
  } else if (systolic < 130 && diastolic < 80) {
    bpRisk = 'normal';
  } else if (systolic < 140 || diastolic < 90) {
    bpRisk = 'elevated';
    hypertensionRisk = true;
  } else if (systolic < 160 || diastolic < 100) {
    bpRisk = 'stage1';
    hypertensionRisk = true;
  } else {
    bpRisk = 'stage2';
    hypertensionRisk = true;
  }

  return {
    systolic,
    diastolic,
    bpRisk,
    hypertensionRisk,
  };
}

/**
 * Calculate cardiovascular risk score (0-100)
 * Lower is better
 */
function calculateCardiovascularRiskScore(
  restingHRAnalysis: RestingHRAnalysis,
  bpAnalysis: BPAnalysis,
  hrv: number | undefined,
  lipidPanel: LipidPanel | undefined,
  age: number,
  smokingStatus: boolean
): number {
  let riskScore = 0;

  // Resting HR contribution (0-25 points)
  const hrRiskMap = {
    excellent: 0,
    good: 5,
    average: 10,
    below_average: 18,
    poor: 25,
  };
  riskScore += hrRiskMap[restingHRAnalysis.hrStatus];

  // BP contribution (0-30 points)
  const bpRiskMap: Record<BPRiskLevel, number> = {
    optimal: 0,
    normal: 5,
    elevated: 15,
    stage1: 23,
    stage2: 30,
  };
  riskScore += bpRiskMap[bpAnalysis.bpRisk];

  // HRV contribution (0-20 points)
  if (hrv) {
    if (hrv >= 60) riskScore += 0; // Excellent HRV
    else if (hrv >= 40) riskScore += 5; // Good HRV
    else if (hrv >= 25) riskScore += 12; // Average HRV
    else riskScore += 20; // Poor HRV
  } else {
    riskScore += 10; // Unknown, assume moderate risk
  }

  // Lipid panel contribution (0-15 points)
  if (lipidPanel?.totalCholesterol && lipidPanel?.hdl) {
    const ratio = lipidPanel.totalCholesterol / lipidPanel.hdl;
    if (ratio < 3.5) riskScore += 0; // Optimal
    else if (ratio < 4.5) riskScore += 3; // Good
    else if (ratio < 5.5) riskScore += 8; // Elevated
    else riskScore += 15; // High risk
  } else {
    riskScore += 7; // Unknown, assume moderate risk
  }

  // Age contribution (0-10 points)
  if (age < 40) riskScore += 0;
  else if (age < 50) riskScore += 3;
  else if (age < 60) riskScore += 6;
  else riskScore += 10;

  // Smoking contribution (0-10 points)
  if (smokingStatus) riskScore += 10;

  return Math.min(100, riskScore);
}

/**
 * Determine cardiovascular risk level (legacy)
 */
function determineCardiovascularRiskLevel(riskScore: number): CardiovascularRiskLevel {
  if (riskScore < 20) return 'low';
  if (riskScore < 40) return 'moderate';
  if (riskScore < 70) return 'elevated';
  return 'high';
}

// ============================================================================
// NEW AI ENRICHMENT ARCHITECTURE
// ============================================================================

/**
 * Determine cardiovascular status (new AI enrichment architecture)
 */
function determineCardiovascularStatus(inputs: CardiovascularInputs): CardiovascularStatus {
  const { systolicBP, diastolicBP, restingHR, hrv, lipidPanel, hsCRP, bodyFat, stressScore, recoveryScore } = inputs;

  let riskSignals = 0;

  // High Risk: Multiple severe cardiovascular signals
  if (systolicBP != null && systolicBP >= 160) riskSignals += 3;
  if (diastolicBP != null && diastolicBP >= 100) riskSignals += 3;
  if (restingHR != null && restingHR >= 90) riskSignals += 2;
  if (hrv != null && hrv < 25) riskSignals += 2;
  if (lipidPanel?.cholesterolRatio != null && lipidPanel.cholesterolRatio >= 5.5) riskSignals += 2;
  if (hsCRP != null && hsCRP >= 3.0) riskSignals += 2;
  if (bodyFat != null && bodyFat >= 30) riskSignals += 1;
  if (stressScore != null && stressScore >= 80) riskSignals += 1;
  if (recoveryScore != null && recoveryScore <= 30) riskSignals += 1;

  if (riskSignals >= 6) return 'high_risk';

  // Elevated Risk: Concerning cardiovascular signals
  if (
    (systolicBP != null && systolicBP >= 140) ||
    (diastolicBP != null && diastolicBP >= 90) ||
    (restingHR != null && restingHR >= 85) ||
    (hrv != null && hrv < 35) ||
    (lipidPanel?.cholesterolRatio != null && lipidPanel.cholesterolRatio >= 4.5) ||
    (hsCRP != null && hsCRP >= 2.0) ||
    riskSignals >= 3
  ) {
    return 'elevated_risk';
  }

  // Moderate: Mild cardiovascular concerns
  if (
    (systolicBP != null && systolicBP >= 130) ||
    (diastolicBP != null && diastolicBP >= 80) ||
    (restingHR != null && restingHR >= 75) ||
    (hrv != null && hrv < 45) ||
    (lipidPanel?.cholesterolRatio != null && lipidPanel.cholesterolRatio >= 3.5) ||
    riskSignals >= 1
  ) {
    return 'moderate';
  }

  // Optimal: Favorable cardiovascular health
  return 'optimal';
}

/**
 * Build cardiovascular evidence
 */
function buildCardiovascularEvidence(inputs: CardiovascularInputs, status: CardiovascularStatus, bloodwork?: ReturnType<typeof getLatestBloodworkContext> extends Promise<infer T> ? T : never): CardiovascularEvidence {
  logger.info('📊 [CARDIOVASCULAR EVIDENCE] Building evidence');

  const signals: CardiovascularEvidenceSignal[] = [];

  if (inputs.systolicBP != null && inputs.diastolicBP != null) {
    const bpInterpretation = inputs.systolicBP < 120 && inputs.diastolicBP < 80
      ? 'Optimal blood pressure'
      : inputs.systolicBP < 130 && inputs.diastolicBP < 80
      ? 'Normal blood pressure'
      : inputs.systolicBP < 140 || inputs.diastolicBP < 90
      ? 'Elevated blood pressure'
      : 'High blood pressure';
    
    signals.push({
      name: 'Blood Pressure',
      value: `${inputs.systolicBP}/${inputs.diastolicBP}`,
      interpretation: bpInterpretation,
    });
  }

  if (inputs.restingHR != null) {
    const hrInterpretation = inputs.restingHR < 60
      ? 'Excellent resting heart rate'
      : inputs.restingHR < 70
      ? 'Good resting heart rate'
      : inputs.restingHR < 80
      ? 'Average resting heart rate'
      : inputs.restingHR < 90
      ? 'Elevated resting heart rate'
      : 'High resting heart rate';
    
    signals.push({
      name: 'Resting Heart Rate',
      value: inputs.restingHR,
      interpretation: hrInterpretation,
    });
  }

  if (inputs.hrv != null) {
    const hrvInterpretation = inputs.hrv >= 60
      ? 'Excellent HRV'
      : inputs.hrv >= 40
      ? 'Good HRV'
      : inputs.hrv >= 25
      ? 'Average HRV'
      : 'Low HRV - autonomic strain';
    
    signals.push({
      name: 'HRV',
      value: inputs.hrv,
      interpretation: hrvInterpretation,
    });
  }

  if (inputs.lipidPanel?.cholesterolRatio != null) {
    const ratioInterpretation = inputs.lipidPanel.cholesterolRatio < 3.5
      ? 'Optimal cholesterol ratio'
      : inputs.lipidPanel.cholesterolRatio < 4.5
      ? 'Good cholesterol ratio'
      : inputs.lipidPanel.cholesterolRatio < 5.5
      ? 'Elevated cholesterol ratio'
      : 'High cholesterol ratio';
    
    signals.push({
      name: 'Total Cholesterol/HDL Ratio',
      value: inputs.lipidPanel.cholesterolRatio.toFixed(1),
      interpretation: ratioInterpretation,
    });
  }

  if (inputs.lipidPanel?.triglycerides != null) {
    const trigInterpretation = inputs.lipidPanel.triglycerides < 150
      ? 'Normal triglycerides'
      : inputs.lipidPanel.triglycerides < 200
      ? 'Borderline high triglycerides'
      : 'High triglycerides';
    
    signals.push({
      name: 'Triglycerides',
      value: inputs.lipidPanel.triglycerides,
      interpretation: trigInterpretation,
    });
  }

  if (inputs.hsCRP != null) {
    const crpInterpretation = inputs.hsCRP < 1.0
      ? 'Low inflammatory burden'
      : inputs.hsCRP < 2.0
      ? 'Moderate inflammatory burden'
      : 'Elevated inflammatory burden';
    
    signals.push({
      name: 'hsCRP',
      value: inputs.hsCRP,
      interpretation: crpInterpretation,
    });
  }

  if (inputs.bodyFat != null) {
    const bfInterpretation = inputs.bodyFat < 20
      ? 'Healthy body fat'
      : inputs.bodyFat < 25
      ? 'Moderate body fat'
      : 'Elevated body fat';
    
    signals.push({
      name: 'Body Fat',
      value: `${inputs.bodyFat}%`,
      interpretation: bfInterpretation,
    });
  }

  if (inputs.stressScore != null) {
    signals.push({
      name: 'Stress Score',
      value: inputs.stressScore,
      interpretation: inputs.stressScore < 50 ? 'Low stress' : inputs.stressScore < 75 ? 'Moderate stress' : 'High stress',
    });
  }

  if (inputs.recoveryScore != null) {
    signals.push({
      name: 'Recovery Score',
      value: inputs.recoveryScore,
      interpretation: inputs.recoveryScore >= 70 ? 'Good recovery' : inputs.recoveryScore >= 50 ? 'Moderate recovery' : 'Poor recovery',
    });
  }

  const summary = `Cardiovascular status: ${status}. ${signals.length} cardiovascular signals analyzed.`;

  logger.info('✅ [CARDIOVASCULAR EVIDENCE] Evidence built', { signalCount: signals.length, status });

  return {
    cardiovascularStatus: status,
    signals,
    summary,
  };
}

/**
 * Build fallback cardiovascular recommendation
 */
function buildCardiovascularFallbackRecommendation(status: CardiovascularStatus): CardiovascularRecommendation {
  logger.info('🔧 [CARDIOVASCULAR FALLBACK] Building fallback recommendation');

  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  switch (status) {
    case 'high_risk':
      priority = 'critical';
      summary = 'Cardiovascular health requires immediate attention';
      actions = [
        'Reduce training intensity today',
        'Avoid excessive strain or max-effort work',
        'Prioritize hydration and recovery',
        'Monitor blood pressure if available',
        'Discuss abnormal values with clinician if persistent',
      ];
      break;

    case 'elevated_risk':
      priority = 'important';
      summary = 'Cardiovascular signals show elevated risk';
      actions = [
        'Use lower-intensity cardio or active recovery',
        'Emphasize hydration and sleep',
        'Reduce excessive sodium intake',
        'Reinforce nutrition support',
        'Monitor cardiovascular load',
      ];
      break;

    case 'moderate':
      priority = 'important';
      summary = 'Cardiovascular health shows mild concerns';
      actions = [
        'Monitor training load',
        'Keep cardiovascular work moderate and sustainable',
        'Emphasize consistency',
        'Maintain hydration',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Cardiovascular health is optimal';
      actions = [
        'Maintain current practices',
        'Continue steady aerobic work',
        'Reinforce healthy routine',
      ];
      break;
  }

  logger.info('✅ [CARDIOVASCULAR FALLBACK] Fallback recommendation built', { priority, status });

  return {
    type: 'cardiovascular',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}

// ============================================================================
// MAIN ENGINE FLOW
// ============================================================================

export async function getCardiovascularRecommendation(
  userId: string,
  inputs: CardiovascularInputs,
  bloodwork?: Awaited<ReturnType<typeof getLatestBloodworkContext>>,
): Promise<CardiovascularRecord> {
  logger.info('🔵 [CARDIOVASCULAR ENGINE] Starting cardiovascular recommendation flow', { userId });

  // Step 0: Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [CARDIOVASCULAR ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    hasFamilyHistory: baseline.familyHistory?.cardiovascular_disease || false,
  });

  // Step 0b: Use provided bloodwork or fetch if not provided (for backward compatibility)
  const bloodworkData = bloodwork || await getLatestBloodworkContext(userId);
  if (bloodworkData.hasBloodwork) {
    logger.info('✅ [CARDIOVASCULAR ENGINE] Bloodwork loaded', {
      userId,
      latestTestDate: bloodworkData.latestTestDate,
      hasLDL: !!bloodworkData.markers.ldl,
      hasHDL: !!bloodworkData.markers.hdl,
      hasTriglycerides: !!bloodworkData.markers.triglycerides,
      hasApoB: !!bloodworkData.markers.apoB,
      hasLpa: !!bloodworkData.markers.lpa,
      hasHsCRP: !!bloodworkData.markers.hsCRP,
    });

    // Enrich inputs with lipid panel from bloodwork (preserve user-provided values if present)
    if (!inputs.lipidPanel) {
      const lipidPanel: Partial<LipidPanel> = {};

      if (bloodworkData.markers.totalCholesterol) {
        lipidPanel.totalCholesterol = getMarkerValue(bloodworkData.markers.totalCholesterol) ?? undefined;
      }
      if (bloodworkData.markers.ldl) {
        lipidPanel.ldl = getMarkerValue(bloodworkData.markers.ldl) ?? undefined;
      }
      if (bloodworkData.markers.hdl) {
        lipidPanel.hdl = getMarkerValue(bloodworkData.markers.hdl) ?? undefined;
      }
      if (bloodworkData.markers.triglycerides) {
        lipidPanel.triglycerides = getMarkerValue(bloodworkData.markers.triglycerides) ?? undefined;
      }

      // Calculate estimated total cholesterol from LDL + HDL if total cholesterol is missing
      // This is a conservative estimate (assumes normal triglycerides)
      if (!lipidPanel.totalCholesterol && lipidPanel.ldl && lipidPanel.hdl) {
        lipidPanel.totalCholesterol = lipidPanel.ldl + lipidPanel.hdl;
        logger.info('📊 [CARDIOVASCULAR ENGINE] Using estimated total cholesterol (LDL + HDL)', {
          userId,
          ldl: lipidPanel.ldl,
          hdl: lipidPanel.hdl,
          estimatedTotal: lipidPanel.totalCholesterol,
        });
      }

      // Calculate cholesterol ratio if we have both total and HDL
      if (lipidPanel.totalCholesterol && lipidPanel.hdl) {
        lipidPanel.cholesterolRatio = lipidPanel.totalCholesterol / lipidPanel.hdl;
      }

      // Calculate LDL/HDL ratio as alternative risk metric
      if (lipidPanel.ldl && lipidPanel.hdl) {
        lipidPanel.ldlHdlRatio = lipidPanel.ldl / lipidPanel.hdl;
      }

      if (Object.keys(lipidPanel).length > 0) {
        inputs.lipidPanel = lipidPanel as LipidPanel;
        logger.info('📊 [CARDIOVASCULAR ENGINE] Using lipid panel from bloodwork', {
          ldl: lipidPanel.ldl,
          hdl: lipidPanel.hdl,
          triglycerides: lipidPanel.triglycerides,
          totalCholesterol: lipidPanel.totalCholesterol,
          cholesterolSource: bloodworkData.markers.totalCholesterol ? 'bloodwork' : 'estimated',
        });
      }
    }

    // Add inflammation marker if available
    if (!inputs.hsCRP && bloodworkData.markers.hsCRP) {
      inputs.hsCRP = getMarkerValue(bloodworkData.markers.hsCRP) ?? undefined;
      logger.info('📊 [CARDIOVASCULAR ENGINE] Using hsCRP from bloodwork', { hsCRP: inputs.hsCRP });
    }
  } else {
    logger.info('⚠️ [CARDIOVASCULAR ENGINE] No bloodwork available, using provided inputs only', { userId });
  }

  // Step 1: Deterministic status
  const cardiovascularStatus = determineCardiovascularStatus(inputs);
  logger.info('📊 [CARDIOVASCULAR ENGINE] Status determined', { cardiovascularStatus });

  // Step 2: Build evidence (include bloodwork)
  const evidence = buildCardiovascularEvidence(inputs, cardiovascularStatus, bloodworkData);

  // Step 3: Build fallback recommendation
  const fallbackRecommendation = buildCardiovascularFallbackRecommendation(cardiovascularStatus);

  // Step 4: AI enrichment (if enabled)
  let recommendation: CardiovascularRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [CARDIOVASCULAR ENGINE] AI enrichment enabled');
    recommendation = await enrichCardiovascularRecommendation(evidence, fallbackRecommendation);
  } else {
    logger.info('🔧 [CARDIOVASCULAR ENGINE] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  // Step 5: Normalize
  recommendation = normalizeCardiovascularRecommendation(recommendation);

  // Step 6: Validate
  const isValid = validateCardiovascularRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] Validation failed, using fallback');
    recommendation = normalizeCardiovascularRecommendation(fallbackRecommendation);
  }

  // Step 7: Create record
  const record: CardiovascularRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    cardiovascularStatus,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  // Step 8: Persist to in-memory store
  const userRecords = cardiovascularRecordStore.get(userId) ?? [];
  cardiovascularRecordStore.set(userId, [record, ...userRecords]);

  // Step 9: Persist to RecommendationEngine
  try {
    await createRecommendation({
      userId,
      request: {
        sourceEngine: 'cardiovascular',
        title: recommendation.summary,
        description: recommendation.actions.join('. '),
        rationale: recommendation.rationale,
        priority: recommendation.priority,
        category: 'health_monitoring',
        confidenceLevel: recommendation.source === 'ai_enriched' ? 'high' : 'medium',
        actionType: 'monitor',
        actionTarget: 'cardiovascular_health',
      },
    });
    logger.info('✅ [CARDIOVASCULAR ENGINE] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [CARDIOVASCULAR ENGINE] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [CARDIOVASCULAR ENGINE] Cardiovascular recommendation complete', {
    userId,
    cardiovascularStatus,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}


export async function getCardiovascularToday(userId: string, options?: { regenerate?: boolean }): Promise<CardiovascularRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = cardiovascularRecordStore.get(userId) ?? [];
  const existing = userRecords.find(record => record.date === today);

  if (existing && !options?.regenerate) {
    logger.info('📋 [CARDIOVASCULAR ENGINE] Returning cached record', { userId, date: today });
    return existing;
  }

  if (options?.regenerate) {
    logger.info('🔄 [CARDIOVASCULAR ENGINE] Regenerate flag set, bypassing cache', { userId });
  } else {
    logger.info('🔄 [CARDIOVASCULAR ENGINE] No cached record, generating new', { userId });
  }
  
  // Fetch real data from other engines and context services
  const [bodyComp, stress, recovery, bpContext, hrContext, hrvContext, fitnessContext, bloodworkContext, baselineContext] = await Promise.allSettled([
    getLatestBodyCompositionContext(userId),
    getStressToday(userId),
    getRecoveryToday(userId),
    getLatestBloodPressureContext(userId),
    getLatestHeartRateContext(userId),
    getLatestHRVContext(userId),
    getLatestFitnessContext(userId),
    getLatestBloodworkContext(userId),
    getBaselineFields(userId),
  ]);

  // Extract body fat percentage
  const bodyFatPercentage = bodyComp.status === 'fulfilled' && bodyComp.value?.bodyFatPercentage
    ? bodyComp.value.bodyFatPercentage
    : undefined;

  // Extract stress score
  const stressScore = stress.status === 'fulfilled' && stress.value?.stressScore !== undefined
    ? stress.value.stressScore
    : undefined;

  // Extract recovery score
  const recoveryScore = recovery.status === 'fulfilled' && recovery.value?.recoveryScore !== undefined
    ? recovery.value.recoveryScore
    : undefined;

  // Extract cardiovascular context values (no hardcoded fallbacks)
  const rawSystolicBP = bpContext.status === 'fulfilled' ? getSystolic(bpContext.value) : undefined;
  const rawDiastolicBP = bpContext.status === 'fulfilled' ? getDiastolic(bpContext.value) : undefined;

  // Validate BP ranges
  const bpValidation = validateBloodPressure(rawSystolicBP, rawDiastolicBP);
  const systolicBP = bpValidation.systolic ?? undefined;
  const diastolicBP = bpValidation.diastolic ?? undefined;

  const restingHR = hrContext.status === 'fulfilled' ? getRestingHR(hrContext.value) : undefined;
  const hrv = hrvContext.status === 'fulfilled' ? getHRV(hrvContext.value) : undefined;
  const vo2Max = fitnessContext.status === 'fulfilled' ? getVO2Max(fitnessContext.value) : undefined;

  // Extract baseline demographics
  const baseline = baselineContext.status === 'fulfilled' ? baselineContext.value : null;
  const age = baseline?.age ?? undefined;
  const smokingStatus = baseline?.smokingStatus ?? undefined;

  // Extract bloodwork lipid panel
  const bloodwork = bloodworkContext.status === 'fulfilled' ? bloodworkContext.value : null;
  const rawTotalCholesterol = bloodwork?.markers ? getMarkerValue(bloodwork.markers.totalCholesterol) : undefined;
  const rawHdl = bloodwork?.markers ? getMarkerValue(bloodwork.markers.hdl) : undefined;
  const rawLdl = bloodwork?.markers ? getMarkerValue(bloodwork.markers.ldl) : undefined;

  // Validate cholesterol ranges
  const cholesterolValidation = validateCholesterol(rawTotalCholesterol, rawHdl, rawLdl);

  const lipidPanel = bloodwork?.markers ? {
    totalCholesterol: cholesterolValidation.totalCholesterol,
    hdl: cholesterolValidation.hdl,
    ldl: cholesterolValidation.ldl,
    triglycerides: getMarkerValue(bloodwork.markers.triglycerides),
    cholesterolRatio: cholesterolValidation.totalCholesterol && cholesterolValidation.hdl
      ? cholesterolValidation.totalCholesterol / cholesterolValidation.hdl
      : undefined,
  } : undefined;

  const apoB = bloodwork?.markers ? getMarkerValue(bloodwork.markers.apoB) : undefined;
  const lipoproteinA = bloodwork?.markers ? getMarkerValue(bloodwork.markers.lpa) : undefined;
  const hsCRP = bloodwork?.markers ? getMarkerValue(bloodwork.markers.hsCRP) : undefined;

  logger.info('📊 [CARDIOVASCULAR ENGINE] Fetched cross-engine data', {
    userId,
    age,
    smokingStatus,
    bodyFatPercentage,
    stressScore,
    recoveryScore,
    systolicBP,
    diastolicBP,
    restingHR,
    hrv,
    vo2Max,
    hasLipidPanel: !!lipidPanel,
  });
  
  // Build inputs with real data only (no hardcoded fallbacks)
  const inputs: CardiovascularInputs = {
    systolicBP,
    diastolicBP,
    restingHR,
    hrv,
    lipidPanel,
    age,
    smokingStatus,
    vo2Max,
    apoB,
    lipoproteinA,
    hsCRP,
    bodyFat: bodyFatPercentage,
    stressScore,
    recoveryScore,
  };
  
  // Log undefined values for monitoring
  const undefinedInputs = Object.entries(inputs)
    .filter(([_, value]) => value === undefined)
    .map(([key]) => key);
  
  if (undefinedInputs.length > 0) {
    logger.info('⚠️ [CARDIOVASCULAR ENGINE] Some inputs unavailable', {
      userId,
      undefinedInputs,
      dataAvailability: `${Object.keys(inputs).length - undefinedInputs.length}/${Object.keys(inputs).length}`,
    });
  }

  return getCardiovascularRecommendation(userId, inputs, bloodwork);
}

export async function getCardiovascularHistory(userId: string): Promise<CardiovascularRecord[]> {
  return cardiovascularRecordStore.get(userId) ?? [];
}

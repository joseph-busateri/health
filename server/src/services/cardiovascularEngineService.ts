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
import type { InputMetadata, InputSource } from '../types/inputMetadata';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_CARDIOVASCULAR === 'true';
const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

// Log feature flag status on module load
logger.info('🔧 [CARDIOVASCULAR ENGINE] Feature flags initialized', {
  USE_AI_ENRICHMENT,
  SHOW_DETAIL_SCREEN_INPUTS,
  env_value: process.env.SHOW_DETAIL_SCREEN_INPUTS,
});

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

/**
 * Clear all cardiovascular cache
 */
export function clearCardiovascularCache(): void {
  cardiovascularRecordStore.clear();
  logger.info('🗑️ [CARDIOVASCULAR ENGINE] All cache cleared');
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
// WEIGHTED SCORING SYSTEM
// ============================================================================

/**
 * Calculate Blood Pressure Score (25 points max)
 */
function calculateBPScore(systolic?: number, diastolic?: number): { score: number; max: number; hasData: boolean } {
  const max = 25;
  const hasData = systolic !== undefined && systolic !== null || diastolic !== undefined && diastolic !== null;
  
  if (!hasData) {
    return { score: max, max, hasData: false }; // No data
  }

  const sys = systolic ?? 120;
  const dia = diastolic ?? 80;

  // Stage 2 Hypertension (≥160/100)
  if (sys >= 160 || dia >= 100) return { score: 5, max, hasData };
  
  // Stage 1 Hypertension (140-159/90-99)
  if (sys >= 140 || dia >= 90) return { score: 10, max, hasData };
  
  // Elevated (130-139/80-89)
  if (sys >= 130 || dia >= 80) return { score: 15, max, hasData };
  
  // Normal (120-129/<80)
  if (sys >= 120 && dia < 80) return { score: 20, max, hasData };
  
  // Optimal (<120/<80)
  return { score: 25, max, hasData };
}

/**
 * Calculate Lipid Profile Score (20 points max)
 */
function calculateLipidScore(lipidPanel?: LipidPanel): { score: number; max: number; hasData: boolean } {
  const max = 20;
  const hasData = lipidPanel !== undefined && lipidPanel !== null;
  
  if (!hasData) return { score: max, max, hasData: false }; // No data

  let score = 0;
  let factors = 0;

  let availableMax = 0;

  // Total Cholesterol (4 points)
  if (lipidPanel.totalCholesterol !== undefined) {
    factors++;
    availableMax += 4;
    if (lipidPanel.totalCholesterol < 200) score += 4;
    else if (lipidPanel.totalCholesterol < 240) score += 2;
    else score += 0;
  }

  // LDL (5 points) - Most important
  if (lipidPanel.ldl !== undefined) {
    factors++;
    availableMax += 5;
    if (lipidPanel.ldl < 100) score += 5;
    else if (lipidPanel.ldl < 130) score += 3;
    else if (lipidPanel.ldl < 160) score += 1;
    else score += 0;
  }

  // HDL (4 points) - Higher is better
  if (lipidPanel.hdl !== undefined) {
    factors++;
    availableMax += 4;
    if (lipidPanel.hdl >= 60) score += 4;
    else if (lipidPanel.hdl >= 40) score += 2;
    else score += 0;
  }

  // Triglycerides (3 points)
  if (lipidPanel.triglycerides !== undefined) {
    factors++;
    availableMax += 3;
    if (lipidPanel.triglycerides < 150) score += 3;
    else if (lipidPanel.triglycerides < 200) score += 1.5;
    else score += 0;
  }

  // TC/HDL Ratio (4 points) - Key risk indicator
  if (lipidPanel.cholesterolRatio !== undefined) {
    factors++;
    availableMax += 4;
    if (lipidPanel.cholesterolRatio < 3.5) score += 4;
    else if (lipidPanel.cholesterolRatio < 4.5) score += 2;
    else if (lipidPanel.cholesterolRatio < 5.5) score += 1;
    else score += 0;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Cardiac Function Score (15 points max)
 */
function calculateCardiacScore(restingHR?: number, hrv?: number): { score: number; max: number; hasData: boolean } {
  const max = 15;
  const hasData = (restingHR !== undefined && restingHR !== null) || (hrv !== undefined && hrv !== null);
  
  let score = 0;
  let factors = 0;

  let availableMax = 0;

  // Resting HR (8 points)
  if (restingHR !== undefined && restingHR !== null) {
    factors++;
    availableMax += 8;
    if (restingHR < 60) score += 8;
    else if (restingHR < 70) score += 6;
    else if (restingHR < 80) score += 4;
    else if (restingHR < 90) score += 2;
    else score += 0;
  }

  // HRV (7 points)
  if (hrv !== undefined && hrv !== null) {
    factors++;
    availableMax += 7;
    if (hrv >= 60) score += 7;
    else if (hrv >= 45) score += 5;
    else if (hrv >= 30) score += 3;
    else score += 1;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Fitness & Metabolism Score (15 points max)
 */
function calculateFitnessScore(vo2Max?: number, bodyFat?: number, age?: number): { score: number; max: number; hasData: boolean } {
  const max = 15;
  const hasData = (vo2Max !== undefined && vo2Max !== null) || (bodyFat !== undefined && bodyFat !== null);
  
  let score = 0;
  let factors = 0;

  let availableMax = 0;

  // VO2 Max (8 points) - Age-adjusted
  if (vo2Max !== undefined && vo2Max !== null && age !== undefined) {
    factors++;
    availableMax += 8;
    const ageAdjusted = age < 40 ? 50 : age < 50 ? 45 : age < 60 ? 40 : 35;
    if (vo2Max >= ageAdjusted) score += 8;
    else if (vo2Max >= ageAdjusted - 10) score += 5;
    else if (vo2Max >= ageAdjusted - 20) score += 2;
    else score += 0;
  }

  // Body Fat % (7 points)
  if (bodyFat !== undefined && bodyFat !== null) {
    factors++;
    availableMax += 7;
    if (bodyFat < 15) score += 7;
    else if (bodyFat < 20) score += 5;
    else if (bodyFat < 25) score += 3;
    else if (bodyFat < 30) score += 1;
    else score += 0;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Advanced Markers Score (10 points max)
 */
function calculateAdvancedScore(hsCRP?: number, apoB?: number, lpa?: number): { score: number; max: number; hasData: boolean } {
  const max = 10;
  const hasData = (hsCRP !== undefined && hsCRP !== null) || (apoB !== undefined && apoB !== null) || (lpa !== undefined && lpa !== null);
  
  let score = 0;
  let factors = 0;

  let availableMax = 0;

  // hs-CRP (4 points) - Inflammation marker
  if (hsCRP !== undefined && hsCRP !== null) {
    factors++;
    availableMax += 4;
    if (hsCRP < 1.0) score += 4;
    else if (hsCRP < 3.0) score += 2;
    else score += 0;
  }

  // ApoB (3 points) - Better than LDL
  if (apoB !== undefined && apoB !== null) {
    factors++;
    availableMax += 3;
    if (apoB < 90) score += 3;
    else if (apoB < 120) score += 1.5;
    else score += 0;
  }

  // Lp(a) (3 points) - Genetic risk
  if (lpa !== undefined && lpa !== null) {
    factors++;
    availableMax += 3;
    if (lpa < 30) score += 3;
    else if (lpa < 50) score += 1.5;
    else score += 0;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Lifestyle & Demographics Score (10 points max)
 */
function calculateLifestyleScore(
  age?: number,
  smoking?: 'never' | 'former' | 'current' | boolean,
  stressScore?: number,
  recoveryScore?: number
): { score: number; max: number; hasData: boolean } {
  const max = 10;
  let score = 0;

  // Age (3 points) - Non-modifiable risk
  if (age !== undefined) {
    if (age < 40) score += 3;
    else if (age < 50) score += 2.5;
    else if (age < 60) score += 2;
    else if (age < 70) score += 1;
    else score += 0;
  } else {
    score += 1.5; // Default moderate
  }

  // Smoking (3 points) - Major risk factor
  if (smoking !== undefined) {
    const smokingStatus = typeof smoking === 'boolean' ? (smoking ? 'current' : 'never') : smoking;
    if (smokingStatus === 'never') score += 3;
    else if (smokingStatus === 'former') score += 1.5;
    else score += 0;
  } else {
    score += 1.5; // Default moderate
  }

  // Stress (2 points)
  if (stressScore !== undefined) {
    if (stressScore < 40) score += 2;
    else if (stressScore < 60) score += 1.5;
    else if (stressScore < 80) score += 1;
    else score += 0;
  } else {
    score += 1; // Default moderate
  }

  // Recovery (2 points)
  if (recoveryScore !== undefined) {
    if (recoveryScore >= 75) score += 2;
    else if (recoveryScore >= 60) score += 1.5;
    else if (recoveryScore >= 40) score += 1;
    else score += 0;
  } else {
    score += 1; // Default moderate
  }

  return { score, max, hasData: true }; // Always has data (has defaults)
}

/**
 * Calculate Baseline Risk Adjustment (5 points max)
 */
function calculateBaselineScore(familyHistory?: boolean): { score: number; max: number; hasData: boolean } {
  const max = 5;
  let score = 5;

  // Family history penalty
  if (familyHistory === true) score -= 2;

  return { score: Math.max(0, score), max, hasData: true }; // Always has data
}

/**
 * Calculate comprehensive weighted cardiovascular score
 */
function calculateWeightedCardiovascularScore(
  inputs: CardiovascularInputs,
  baseline: { familyHistory?: { cardiovascular_disease?: boolean } }
): { score: number; breakdown: any } {
  const bpScore = calculateBPScore(inputs.systolicBP, inputs.diastolicBP);
  const lipidScore = calculateLipidScore(inputs.lipidPanel);
  const cardiacScore = calculateCardiacScore(inputs.restingHR, inputs.hrv);
  const fitnessScore = calculateFitnessScore(inputs.vo2Max, inputs.bodyFat, inputs.age);
  const advancedScore = calculateAdvancedScore(inputs.hsCRP, inputs.apoB, inputs.lipoproteinA);
  const lifestyleScore = calculateLifestyleScore(inputs.age, inputs.smokingStatus, inputs.stressScore, inputs.recoveryScore);
  const baselineScore = calculateBaselineScore(baseline.familyHistory?.cardiovascular_disease);

  // Only include categories that have data
  let total = 0;
  let maxTotal = 0;

  // Blood Pressure - include if data exists
  if (inputs.systolicBP !== undefined && inputs.systolicBP !== null ||
      inputs.diastolicBP !== undefined && inputs.diastolicBP !== null) {
    total += bpScore.score;
    maxTotal += bpScore.max;
  }

  // Lipid Profile - include if data exists
  if (inputs.lipidPanel !== undefined && inputs.lipidPanel !== null) {
    total += lipidScore.score;
    maxTotal += lipidScore.max;
  }

  // Cardiac Function - include if data exists
  if ((inputs.restingHR !== undefined && inputs.restingHR !== null) ||
      (inputs.hrv !== undefined && inputs.hrv !== null)) {
    total += cardiacScore.score;
    maxTotal += cardiacScore.max;
  }

  // Fitness - include if data exists
  if ((inputs.vo2Max !== undefined && inputs.vo2Max !== null) ||
      (inputs.bodyFat !== undefined && inputs.bodyFat !== null)) {
    total += fitnessScore.score;
    maxTotal += fitnessScore.max;
  }

  // Advanced Markers - include if data exists
  if ((inputs.hsCRP !== undefined && inputs.hsCRP !== null) ||
      (inputs.apoB !== undefined && inputs.apoB !== null) ||
      (inputs.lipoproteinA !== undefined && inputs.lipoproteinA !== null)) {
    total += advancedScore.score;
    maxTotal += advancedScore.max;
  }

  // Lifestyle - always included (has defaults)
  total += lifestyleScore.score;
  maxTotal += lifestyleScore.max;

  // Baseline - always included
  total += baselineScore.score;
  maxTotal += baselineScore.max;

  // Fallback if no data at all
  if (maxTotal === 0) {
    total = 50;
    maxTotal = 100;
  }

  const breakdown = {
    bloodPressure: { score: Math.round(bpScore.score * 10) / 10, max: bpScore.max, percentage: Math.round((bpScore.score / bpScore.max) * 100), hasData: bpScore.hasData },
    lipidProfile: { score: Math.round(lipidScore.score * 10) / 10, max: lipidScore.max, percentage: Math.round((lipidScore.score / lipidScore.max) * 100), hasData: lipidScore.hasData },
    cardiacFunction: { score: Math.round(cardiacScore.score * 10) / 10, max: cardiacScore.max, percentage: Math.round((cardiacScore.score / cardiacScore.max) * 100), hasData: cardiacScore.hasData },
    fitnessMetabolism: { score: Math.round(fitnessScore.score * 10) / 10, max: fitnessScore.max, percentage: Math.round((fitnessScore.score / fitnessScore.max) * 100), hasData: fitnessScore.hasData },
    advancedMarkers: { score: Math.round(advancedScore.score * 10) / 10, max: advancedScore.max, percentage: Math.round((advancedScore.score / advancedScore.max) * 100), hasData: advancedScore.hasData },
    lifestyle: { score: Math.round(lifestyleScore.score * 10) / 10, max: lifestyleScore.max, percentage: Math.round((lifestyleScore.score / lifestyleScore.max) * 100), hasData: lifestyleScore.hasData },
    baselineAdjustment: { score: Math.round(baselineScore.score * 10) / 10, max: baselineScore.max, percentage: Math.round((baselineScore.score / baselineScore.max) * 100), hasData: baselineScore.hasData },
    total: Math.round(total * 10) / 10,
    maxTotal,
    percentage: Math.round((total / maxTotal) * 100),
  };

  return { score: Math.round(total), breakdown };
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
// INPUT METADATA BUILDER
// ============================================================================

/**
 * Calculate individual input score based on value and optimal ranges
 * Returns: 90 (optimal), 70 (moderate), 50 (elevated_risk), or 30 (high_risk)
 */
function calculateCardiovascularInputScore(name: string, value: any): number | undefined {
  if (value === undefined || value === null) return undefined;

  switch (name) {
    case 'Systolic Blood Pressure':
      if (value < 120) return 90;  // optimal
      if (value < 130) return 70;  // moderate (elevated)
      if (value < 140) return 50;  // elevated_risk (stage 1 hypertension)
      return 30;                    // high_risk (stage 2 hypertension)

    case 'Diastolic Blood Pressure':
      if (value < 80) return 90;   // optimal
      if (value < 85) return 70;   // moderate (elevated)
      if (value < 90) return 50;   // elevated_risk (stage 1 hypertension)
      return 30;                    // high_risk (stage 2 hypertension)

    case 'Resting Heart Rate':
      if (value < 60) return 90;   // optimal (athletic)
      if (value < 70) return 90;   // optimal
      if (value < 80) return 70;   // moderate
      if (value < 90) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Heart Rate Variability':
      if (value >= 60) return 90;  // optimal
      if (value >= 45) return 70;  // moderate
      if (value >= 30) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'VO2 Max':
      // Age-adjusted, using general guidelines
      if (value >= 50) return 90;  // optimal (excellent)
      if (value >= 40) return 70;  // moderate (good)
      if (value >= 30) return 50;  // elevated_risk (fair)
      return 30;                    // high_risk (poor)

    case 'Total Cholesterol':
      if (value < 200) return 90;  // optimal
      if (value < 240) return 70;  // moderate (borderline high)
      return 30;                    // high_risk (high)

    case 'HDL Cholesterol':
      if (value >= 60) return 90;  // optimal
      if (value >= 40) return 70;  // moderate
      return 30;                    // high_risk (low)

    case 'LDL Cholesterol':
      if (value < 100) return 90;  // optimal
      if (value < 130) return 70;  // moderate (borderline high)
      if (value < 160) return 50;  // elevated_risk (high)
      return 30;                    // high_risk (very high)

    case 'Triglycerides':
      if (value < 150) return 90;  // optimal
      if (value < 200) return 70;  // moderate (borderline high)
      return 30;                    // high_risk (high)

    case 'Total Cholesterol/HDL Ratio':
      if (value < 3.5) return 90;  // optimal
      if (value < 4.5) return 70;  // moderate
      if (value < 5.5) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Age':
      // Age-based risk scoring (3 points max in lifestyle score)
      if (value < 40) return 90;  // optimal (young)
      if (value < 50) return 83;  // moderate
      if (value < 60) return 67;  // moderate
      if (value < 70) return 33;  // elevated_risk
      return 30;                    // high_risk (older)

    case 'Smoking Status':
      // Smoking status scoring (3 points max in lifestyle score)
      const smokingValue = typeof value === 'boolean' ? (value ? 'current' : 'never') : value;
      if (smokingValue === 'never') return 90;  // optimal
      if (smokingValue === 'former') return 50;  // moderate
      return 30;                                  // high_risk (current smoker)

    case 'Body Fat Percentage':
      if (value < 20) return 90;   // optimal (for men)
      if (value < 25) return 70;   // moderate
      if (value < 30) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Stress Level':
      if (value <= 2) return 90;   // optimal
      if (value <= 3) return 70;   // moderate
      if (value <= 4) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Recovery Score':
      if (value >= 75) return 90;  // optimal
      if (value >= 50) return 70;  // moderate
      if (value >= 30) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Exercise Frequency':
      if (value >= 5) return 90;   // optimal (5+ days/week)
      if (value >= 3) return 70;   // moderate (3-4 days/week)
      if (value >= 1) return 50;   // elevated_risk (1-2 days/week)
      return 30;                    // high_risk (sedentary)

    case 'BMI':
      if (value < 25) return 90;   // optimal
      if (value < 30) return 70;   // moderate (overweight)
      if (value < 35) return 50;   // elevated_risk (obese class I)
      return 30;                    // high_risk (obese class II+)

    default:
      return undefined;
  }
}

/**
 * Build detailed input metadata for cardiovascular inputs
 * Tracks source, last updated, and other metadata for transparency
 */
function buildCardiovascularInputMetadata(
  inputs: CardiovascularInputs,
  contextData: {
    bpContext: any;
    hrContext: any;
    hrvContext: any;
    fitnessContext: any;
    bloodworkContext: any;
    baselineContext: any;
    bodyComp: any;
    stress: any;
    recovery: any;
  }
): InputMetadata[] {
  const metadata: InputMetadata[] = [];

  // Blood Pressure (Systolic)
  if (inputs.systolicBP !== undefined) {
    metadata.push({
      name: 'Systolic Blood Pressure',
      value: inputs.systolicBP,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'blood_pressure_readings',
        field: 'systolic_bp',
        integration: contextData.bpContext?.source || 'manual',
      },
      lastUpdated: contextData.bpContext?.timestamp,
      unit: 'mmHg',
      category: 'vitals',
      score: calculateCardiovascularInputScore('Systolic Blood Pressure', inputs.systolicBP),
    });
  } else {
    metadata.push({
      name: 'Systolic Blood Pressure',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mmHg',
      category: 'vitals',
    });
  }

  // Blood Pressure (Diastolic)
  if (inputs.diastolicBP !== undefined) {
    metadata.push({
      name: 'Diastolic Blood Pressure',
      value: inputs.diastolicBP,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'blood_pressure_readings',
        field: 'diastolic_bp',
        integration: contextData.bpContext?.source || 'manual',
      },
      lastUpdated: contextData.bpContext?.timestamp,
      unit: 'mmHg',
      category: 'vitals',
      score: calculateCardiovascularInputScore('Diastolic Blood Pressure', inputs.diastolicBP),
    });
  } else {
    metadata.push({
      name: 'Diastolic Blood Pressure',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mmHg',
      category: 'vitals',
    });
  }

  // Resting Heart Rate
  if (inputs.restingHR !== undefined) {
    metadata.push({
      name: 'Resting Heart Rate',
      value: inputs.restingHR,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'heart_rate_readings',
        field: 'resting_hr',
        integration: contextData.hrContext?.source || 'wearable',
      },
      lastUpdated: contextData.hrContext?.timestamp,
      unit: 'bpm',
      category: 'vitals',
      score: calculateCardiovascularInputScore('Resting Heart Rate', inputs.restingHR),
    });
  } else {
    metadata.push({
      name: 'Resting Heart Rate',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'bpm',
      category: 'vitals',
    });
  }

  // Heart Rate Variability
  if (inputs.hrv !== undefined) {
    metadata.push({
      name: 'Heart Rate Variability',
      value: inputs.hrv,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'hrv_readings',
        field: 'hrv',
        integration: contextData.hrvContext?.source || 'wearable',
      },
      lastUpdated: contextData.hrvContext?.timestamp,
      unit: 'ms',
      category: 'vitals',
      score: calculateCardiovascularInputScore('Heart Rate Variability', inputs.hrv),
    });
  } else {
    metadata.push({
      name: 'Heart Rate Variability',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'ms',
      category: 'vitals',
    });
  }

  // Lipid Panel - Total Cholesterol
  if (inputs.lipidPanel?.totalCholesterol !== undefined) {
    // Determine if this was from bloodwork or calculated from LDL + HDL
    // Check if bloodwork has a valid (non-null) value for total cholesterol
    const bloodworkTotalChol = contextData.bloodworkContext?.markers?.totalCholesterol 
      ? getMarkerValue(contextData.bloodworkContext.markers.totalCholesterol) 
      : null;
    const totalCholFromBloodwork = bloodworkTotalChol !== null && bloodworkTotalChol !== undefined;
    const totalCholInput: InputMetadata = {
      name: 'Total Cholesterol',
      value: inputs.lipidPanel.totalCholesterol,
      source: (totalCholFromBloodwork ? 'ACTUAL' : 'DERIVED') as InputSource,
      sourceDetails: totalCholFromBloodwork 
        ? {
            table: 'bloodwork_results',
            field: 'total_cholesterol',
          }
        : {
            derivedFrom: ['LDL', 'HDL'],
            formula: 'LDL + HDL',
          },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
      score: calculateCardiovascularInputScore('Total Cholesterol', inputs.lipidPanel?.totalCholesterol),
    };
    metadata.push(totalCholInput);
    logger.info('📊 [CARDIOVASCULAR METADATA] Added Total Cholesterol to detailedInputs', {
      value: totalCholInput.value,
      source: totalCholInput.source,
      score: totalCholInput.score,
    });
  } else {
    metadata.push({
      name: 'Total Cholesterol',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // Lipid Panel - LDL
  if (inputs.lipidPanel?.ldl !== undefined) {
    metadata.push({
      name: 'LDL Cholesterol',
      value: inputs.lipidPanel.ldl,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'ldl',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
      score: calculateCardiovascularInputScore('LDL Cholesterol', inputs.lipidPanel?.ldl),
    });
  } else {
    metadata.push({
      name: 'LDL Cholesterol',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // Lipid Panel - HDL
  if (inputs.lipidPanel?.hdl !== undefined) {
    metadata.push({
      name: 'HDL Cholesterol',
      value: inputs.lipidPanel.hdl,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'hdl',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
      score: calculateCardiovascularInputScore('HDL Cholesterol', inputs.lipidPanel?.hdl),
    });
  } else {
    metadata.push({
      name: 'HDL Cholesterol',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // Lipid Panel - Cholesterol Ratio (Total Cholesterol / HDL)
  if (inputs.lipidPanel?.cholesterolRatio !== undefined) {
    const ratioInput: InputMetadata = {
      name: 'Total Cholesterol/HDL Ratio',
      value: inputs.lipidPanel.cholesterolRatio,
      source: 'DERIVED',
      sourceDetails: {
        derivedFrom: ['total_cholesterol', 'hdl'],
        formula: 'total_cholesterol / hdl',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'ratio',
      category: 'bloodwork',
      score: calculateCardiovascularInputScore('Total Cholesterol/HDL Ratio', inputs.lipidPanel?.cholesterolRatio),
    };
    metadata.push(ratioInput);
    logger.info('📊 [CARDIOVASCULAR METADATA] Added Total Cholesterol/HDL Ratio to detailedInputs', {
      value: ratioInput.value,
      source: ratioInput.source,
      score: ratioInput.score,
    });
  } else {
    metadata.push({
      name: 'Total Cholesterol/HDL Ratio',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'ratio',
      category: 'bloodwork',
    });
  }

  // Lipid Panel - Triglycerides
  if (inputs.lipidPanel?.triglycerides !== undefined) {
    metadata.push({
      name: 'Triglycerides',
      value: inputs.lipidPanel.triglycerides,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'triglycerides',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
      score: calculateCardiovascularInputScore('Triglycerides', inputs.lipidPanel?.triglycerides),
    });
  } else {
    metadata.push({
      name: 'Triglycerides',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // VO2 Max
  if (inputs.vo2Max !== undefined) {
    metadata.push({
      name: 'VO2 Max',
      value: inputs.vo2Max,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'fitness_assessments',
        field: 'vo2_max',
        integration: contextData.fitnessContext?.source || 'wearable',
      },
      lastUpdated: contextData.fitnessContext?.timestamp,
      unit: 'mL/kg/min',
      category: 'fitness',
      score: calculateCardiovascularInputScore('VO2 Max', inputs.vo2Max),
    });
  } else {
    metadata.push({
      name: 'VO2 Max',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mL/kg/min',
      category: 'fitness',
    });
  }

  // Age
  if (inputs.age !== undefined) {
    metadata.push({
      name: 'Age',
      value: inputs.age,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'baseline_profile',
        field: 'date_of_birth',
      },
      unit: 'years',
      category: 'demographics',
      score: calculateCardiovascularInputScore('Age', inputs.age),
    });
  } else {
    metadata.push({
      name: 'Age',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'years',
      category: 'demographics',
    });
  }

  // Smoking Status
  if (inputs.smokingStatus !== undefined) {
    metadata.push({
      name: 'Smoking Status',
      value: typeof inputs.smokingStatus === 'boolean' 
        ? (inputs.smokingStatus ? 'current' : 'never')
        : inputs.smokingStatus,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'baseline_profile',
        field: 'smoking_status',
      },
      category: 'demographics',
      score: calculateCardiovascularInputScore('Smoking Status', inputs.smokingStatus),
    });
  } else {
    metadata.push({
      name: 'Smoking Status',
      value: null,
      source: 'NOT_AVAILABLE',
      category: 'demographics',
    });
  }

  // ApoB
  if (inputs.apoB !== undefined) {
    metadata.push({
      name: 'Apolipoprotein B',
      value: inputs.apoB,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'apo_b',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
      score: undefined, // ApoB scoring not yet defined
    });
  } else {
    metadata.push({
      name: 'Apolipoprotein B',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // Lipoprotein(a)
  if (inputs.lipoproteinA !== undefined) {
    metadata.push({
      name: 'Lipoprotein(a)',
      value: inputs.lipoproteinA,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'lpa',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  } else {
    metadata.push({
      name: 'Lipoprotein(a)',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/dL',
      category: 'bloodwork',
    });
  }

  // hs-CRP
  if (inputs.hsCRP !== undefined) {
    metadata.push({
      name: 'High-Sensitivity C-Reactive Protein',
      value: inputs.hsCRP,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'bloodwork_results',
        field: 'hs_crp',
      },
      lastUpdated: contextData.bloodworkContext?.latestTestDate,
      unit: 'mg/L',
      category: 'bloodwork',
      score: undefined, // hs-CRP scoring not yet defined
    });
  } else {
    metadata.push({
      name: 'High-Sensitivity C-Reactive Protein',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: 'mg/L',
      category: 'bloodwork',
    });
  }

  // Body Fat %
  if (inputs.bodyFat !== undefined) {
    metadata.push({
      name: 'Body Fat Percentage',
      value: inputs.bodyFat,
      source: 'ACTUAL',
      sourceDetails: {
        table: 'body_composition_scans',
        field: 'body_fat_percentage',
        integration: contextData.bodyComp?.source || 'manual',
      },
      lastUpdated: contextData.bodyComp?.scanDate,
      unit: '%',
      category: 'body_composition',
      score: calculateCardiovascularInputScore('Body Fat Percentage', inputs.bodyFat),
    });
  } else {
    metadata.push({
      name: 'Body Fat Percentage',
      value: null,
      source: 'NOT_AVAILABLE',
      unit: '%',
      category: 'body_composition',
    });
  }

  // Stress Score
  if (inputs.stressScore !== undefined) {
    metadata.push({
      name: 'Stress Score',
      value: inputs.stressScore,
      source: 'DERIVED',
      sourceDetails: {
        derivedFrom: ['hrv', 'sleep_quality', 'activity_level'],
        formula: 'Stress Engine Algorithm',
      },
      lastUpdated: contextData.stress?.timestamp,
      category: 'derived_metrics',
      score: calculateCardiovascularInputScore('Stress Level', inputs.stressScore),
    });
  } else {
    metadata.push({
      name: 'Stress Score',
      value: null,
      source: 'NOT_AVAILABLE',
      category: 'derived_metrics',
    });
  }

  // Recovery Score
  if (inputs.recoveryScore !== undefined) {
    metadata.push({
      name: 'Recovery Score',
      value: inputs.recoveryScore,
      source: 'DERIVED',
      sourceDetails: {
        derivedFrom: ['hrv', 'sleep_duration', 'sleep_quality', 'resting_hr'],
        formula: 'Recovery Engine Algorithm',
      },
      lastUpdated: contextData.recovery?.timestamp,
      category: 'derived_metrics',
      score: calculateCardiovascularInputScore('Recovery Score', inputs.recoveryScore),
    });
  } else {
    metadata.push({
      name: 'Recovery Score',
      value: null,
      source: 'NOT_AVAILABLE',
      category: 'derived_metrics',
    });
  }

  return metadata;
}

// ============================================================================
// MAIN ENGINE FLOW
// ============================================================================

export async function getCardiovascularRecommendation(
  userId: string,
  inputs: CardiovascularInputs,
  bloodwork?: Awaited<ReturnType<typeof getLatestBloodworkContext>>,
  contextData?: {
    bpContext: any;
    hrContext: any;
    hrvContext: any;
    fitnessContext: any;
    bloodworkContext: any;
    baselineContext: any;
    bodyComp: any;
    stress: any;
    recovery: any;
  },
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
    // Create or update lipid panel
    const lipidPanel: Partial<LipidPanel> = inputs.lipidPanel ? { ...inputs.lipidPanel } : {};

    // Get LDL and HDL from bloodwork if not already present
    if (!lipidPanel.ldl && bloodworkData.markers.ldl) {
      lipidPanel.ldl = getMarkerValue(bloodworkData.markers.ldl) ?? undefined;
    }
    if (!lipidPanel.hdl && bloodworkData.markers.hdl) {
      lipidPanel.hdl = getMarkerValue(bloodworkData.markers.hdl) ?? undefined;
    }
    if (!lipidPanel.triglycerides && bloodworkData.markers.triglycerides) {
      lipidPanel.triglycerides = getMarkerValue(bloodworkData.markers.triglycerides) ?? undefined;
    }

    // Only use total cholesterol from bloodwork if it has a valid value
    if (!lipidPanel.totalCholesterol) {
      const totalCholFromBloodwork = bloodworkData.markers.totalCholesterol 
        ? getMarkerValue(bloodworkData.markers.totalCholesterol) 
        : null;
      
      if (totalCholFromBloodwork !== null && totalCholFromBloodwork !== undefined) {
        lipidPanel.totalCholesterol = totalCholFromBloodwork;
      }
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
    if (lipidPanel.totalCholesterol && lipidPanel.hdl && !lipidPanel.cholesterolRatio) {
      lipidPanel.cholesterolRatio = lipidPanel.totalCholesterol / lipidPanel.hdl;
      logger.info('📊 [CARDIOVASCULAR ENGINE] Calculated Total Cholesterol/HDL Ratio', {
        userId,
        totalCholesterol: lipidPanel.totalCholesterol,
        hdl: lipidPanel.hdl,
        cholesterolRatio: lipidPanel.cholesterolRatio,
      });
    }

    // Calculate LDL/HDL ratio as alternative risk metric
    if (lipidPanel.ldl && lipidPanel.hdl && !lipidPanel.ldlHdlRatio) {
      lipidPanel.ldlHdlRatio = lipidPanel.ldl / lipidPanel.hdl;
      logger.info('📊 [CARDIOVASCULAR ENGINE] Calculated LDL/HDL Ratio', {
        userId,
        ldl: lipidPanel.ldl,
        hdl: lipidPanel.hdl,
        ldlHdlRatio: lipidPanel.ldlHdlRatio,
      });
    }

    if (Object.keys(lipidPanel).length > 0) {
      inputs.lipidPanel = lipidPanel as LipidPanel;
      logger.info('📊 [CARDIOVASCULAR ENGINE] Using lipid panel from bloodwork', {
        ldl: lipidPanel.ldl,
        hdl: lipidPanel.hdl,
        triglycerides: lipidPanel.triglycerides,
        totalCholesterol: lipidPanel.totalCholesterol,
        cholesterolRatio: lipidPanel.cholesterolRatio,
        ldlHdlRatio: lipidPanel.ldlHdlRatio,
        cholesterolSource: bloodworkData.markers.totalCholesterol ? 'bloodwork' : 'estimated',
      });
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

  // Step 1b: Calculate weighted score
  const { score: cardiovascularScore, breakdown: scoreBreakdown } = calculateWeightedCardiovascularScore(inputs, baseline);
  logger.info('📊 [CARDIOVASCULAR ENGINE] Weighted score calculated', { 
    cardiovascularScore, 
    percentage: scoreBreakdown.percentage,
    breakdown: scoreBreakdown 
  });

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

  // Step 7: Build detailed input metadata (if feature flag enabled)
  let detailedInputs: InputMetadata[] | undefined;
  logger.info('🔍 [CARDIOVASCULAR ENGINE] Checking detailedInputs generation', {
    userId,
    SHOW_DETAIL_SCREEN_INPUTS,
    hasContextData: !!contextData,
    willBuildDetailedInputs: SHOW_DETAIL_SCREEN_INPUTS && !!contextData,
  });
  
  if (SHOW_DETAIL_SCREEN_INPUTS && contextData) {
    const allInputs = buildCardiovascularInputMetadata(inputs, contextData);
    
    // Filter to only show inputs used in weighted score calculation
    const inputsUsedInCalculation = [
      'Systolic Blood Pressure',
      'Diastolic Blood Pressure',
      'Resting Heart Rate',
      'Heart Rate Variability',
      'Total Cholesterol',
      'LDL Cholesterol',
      'HDL Cholesterol',
      'Triglycerides',
      'Total Cholesterol/HDL Ratio',
      'VO2 Max',
      'Age',
      'Smoking Status',
      'Apolipoprotein B',
      'Lipoprotein(a)',
      'High-Sensitivity C-Reactive Protein',
      'Body Fat Percentage',
      'Stress Score',
      'Recovery Score',
    ];
    
    detailedInputs = allInputs.filter(input => inputsUsedInCalculation.includes(input.name));
    
    logger.info('✅ [CARDIOVASCULAR ENGINE] Built detailed input metadata', {
      userId,
      totalInputCount: allInputs.length,
      filteredInputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  } else {
    logger.warn('⚠️ [CARDIOVASCULAR ENGINE] NOT building detailed inputs', {
      userId,
      reason: !SHOW_DETAIL_SCREEN_INPUTS ? 'Feature flag disabled' : 'No context data',
    });
  }

  // Step 8: Create record
  const record: CardiovascularRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    cardiovascularStatus,
    cardiovascularScore,
    scoreBreakdown,
    evidence,
    recommendation,
    inputs, // Include all contributing inputs for frontend transparency
    createdAt: new Date().toISOString(),
    ...(detailedInputs && { detailedInputs }), // Add detailed inputs if feature flag enabled
  };

  logger.info('📦 [CARDIOVASCULAR ENGINE] Record created', {
    userId,
    hasDetailedInputs: !!record.detailedInputs,
    detailedInputsCount: record.detailedInputs?.length || 0,
    recordKeys: Object.keys(record),
  });

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

  // Build context data for detailed input metadata (if feature flag enabled)
  const contextData = SHOW_DETAIL_SCREEN_INPUTS ? {
    bpContext: bpContext.status === 'fulfilled' ? bpContext.value : null,
    hrContext: hrContext.status === 'fulfilled' ? hrContext.value : null,
    hrvContext: hrvContext.status === 'fulfilled' ? hrvContext.value : null,
    fitnessContext: fitnessContext.status === 'fulfilled' ? fitnessContext.value : null,
    bloodworkContext: bloodwork,
    baselineContext: baseline,
    bodyComp: bodyComp.status === 'fulfilled' ? bodyComp.value : null,
    stress: stress.status === 'fulfilled' ? stress.value : null,
    recovery: recovery.status === 'fulfilled' ? recovery.value : null,
  } : undefined;

  return getCardiovascularRecommendation(userId, inputs, bloodwork, contextData);
}

export async function getCardiovascularHistory(userId: string): Promise<CardiovascularRecord[]> {
  return cardiovascularRecordStore.get(userId) ?? [];
}

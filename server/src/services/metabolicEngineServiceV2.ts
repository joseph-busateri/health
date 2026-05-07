/**
 * Metabolic Engine Service V2
 * AI-enriched metabolic intelligence with deterministic fallback
 * 
 * V2 Improvements:
 * - Removed hardcoded defaults (no demo data)
 * - Fixed sex usage in body fat category calculation
 * - Added weight trend calculation from historical data
 * - Added HOMA-IR insulin resistance calculation
 * - Added data validation
 * - Fixed duplicate data fetching
 * - Added data freshness tracking
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → AI Enrichment → Normalizer → Validator → Persistence
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';
import { enrichMetabolicRecommendation } from './metabolicAIEnrichment';
import { normalizeMetabolicRecommendation } from './metabolicRecommendationNormalizer';
import { validateMetabolicRecommendation } from './metabolicRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import { getLatestBodyCompositionContext, getBodyFatCategory, getVisceralFatRisk } from './bodyCompositionContextService';
import { getBodyCompositionScans } from './bodyCompositionService';
import type {
  MetabolicRecord,
  MetabolicStatus,
  MetabolicInputs,
  MetabolicEvidence,
  MetabolicEvidenceSignal,
  MetabolicRecommendation,
} from '../types/metabolicEngine';
import type { InputMetadata } from '../types/inputMetadata';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_METABOLIC === 'true';
const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

// ============================================================================
// WEIGHTED METABOLIC SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate Glucose Control Score (30 points max)
 * Inputs: Fasting Glucose (10), A1C (10), Fasting Insulin (5), Insulin Resistance (5)
 */
function calculateGlucoseControlScore(
  fastingGlucose?: number,
  a1c?: number,
  fastingInsulin?: number,
  insulinResistance?: string
): { score: number; max: number; hasData: boolean } {
  const max = 30;
  let score = 0;
  let factors = 0;

  const hasData = fastingGlucose !== undefined || a1c !== undefined || 
                 fastingInsulin !== undefined || insulinResistance !== undefined;

  let availableMax = 0;

  // Fasting Glucose (10 points)
  if (fastingGlucose !== undefined) {
    factors++;
    availableMax += 10;
    if (fastingGlucose < 100) score += 10;
    else if (fastingGlucose < 126) score += 7;
    else score += 3;
  }

  // A1C (10 points)
  if (a1c !== undefined) {
    factors++;
    availableMax += 10;
    if (a1c < 5.7) score += 10;
    else if (a1c < 6.5) score += 7;
    else score += 3;
  }

  // Fasting Insulin (5 points)
  if (fastingInsulin !== undefined) {
    factors++;
    availableMax += 5;
    if (fastingInsulin < 10) score += 5;
    else if (fastingInsulin < 20) score += 3.5;
    else score += 1.5;
  }

  // Insulin Resistance (5 points)
  if (insulinResistance !== undefined) {
    factors++;
    availableMax += 5;
    if (insulinResistance === 'low') score += 5;
    else if (insulinResistance === 'moderate') score += 3.5;
    else score += 1.5;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Lipid Profile Score (25 points max)
 * Inputs: Triglycerides (8), HDL (7), LDL (5), TC/HDL Ratio (5)
 */
function calculateLipidScore(
  triglycerides?: number,
  hdl?: number,
  ldl?: number,
  totalCholesterol?: number
): { score: number; max: number; hasData: boolean } {
  const max = 25;
  let score = 0;
  let factors = 0;

  const hasData = triglycerides !== undefined || hdl !== undefined || 
                 ldl !== undefined || totalCholesterol !== undefined;

  let availableMax = 0;

  // Triglycerides (8 points)
  if (triglycerides !== undefined) {
    factors++;
    availableMax += 8;
    if (triglycerides < 150) score += 8;
    else if (triglycerides < 200) score += 5.6;
    else score += 2.4;
  }

  // HDL Cholesterol (7 points)
  if (hdl !== undefined) {
    factors++;
    availableMax += 7;
    if (hdl >= 60) score += 7;
    else if (hdl >= 40) score += 4.9;
    else score += 2.1;
  }

  // LDL Cholesterol (5 points)
  if (ldl !== undefined) {
    factors++;
    availableMax += 5;
    if (ldl < 100) score += 5;
    else if (ldl < 130) score += 3.5;
    else if (ldl < 160) score += 2.5;
    else score += 1.5;
  }

  // Total Cholesterol/HDL Ratio (5 points)
  if (totalCholesterol !== undefined && hdl !== undefined) {
    factors++;
    availableMax += 5;
    const ratio = totalCholesterol / hdl;
    if (ratio < 3.5) score += 5;
    else if (ratio < 5) score += 3.5;
    else score += 1.5;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Body Composition Score (30 points max)
 * Inputs: Body Fat % (10), BMI (8), Waist Circumference (7), Weight Trend (5)
 */
function calculateBodyCompositionScore(
  bodyFat?: number,
  bmi?: number,
  waistCircumference?: number,
  weightTrend?: string
): { score: number; max: number; hasData: boolean } {
  const max = 30;
  let score = 0;
  let factors = 0;

  const hasData = bodyFat !== undefined || bmi !== undefined || 
                 waistCircumference !== undefined || weightTrend !== undefined;

  let availableMax = 0;

  // Body Fat Percentage (10 points)
  if (bodyFat !== undefined) {
    factors++;
    availableMax += 10;
    if (bodyFat < 15) score += 10;
    else if (bodyFat < 20) score += 7;
    else if (bodyFat < 25) score += 4;
    else score += 2;
  }

  // BMI (8 points)
  if (bmi !== undefined) {
    factors++;
    availableMax += 8;
    if (bmi < 25) score += 8;
    else if (bmi < 30) score += 5.6;
    else score += 2.4;
  }

  // Waist Circumference (7 points)
  if (waistCircumference !== undefined) {
    factors++;
    availableMax += 7;
    if (waistCircumference < 40) score += 7;
    else if (waistCircumference < 45) score += 4.9;
    else score += 2.1;
  }

  // Weight Trend (5 points)
  if (weightTrend !== undefined) {
    factors++;
    availableMax += 5;
    if (weightTrend === 'stable' || weightTrend === 'losing') score += 5;
    else if (weightTrend === 'gaining') score += 2.5;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Vitals Score (15 points max)
 * Inputs: Resting Heart Rate (15)
 */
function calculateVitalsScore(
  restingHeartRate?: number
): { score: number; max: number; hasData: boolean } {
  const max = 15;
  let score = 0;
  let factors = 0;

  const hasData = restingHeartRate !== undefined && restingHeartRate !== null;

  let availableMax = 0;

  // Resting Heart Rate (15 points)
  if (restingHeartRate !== undefined && restingHeartRate !== null) {
    factors++;
    availableMax += 15;
    if (restingHeartRate < 60) score += 15;
    else if (restingHeartRate < 70) score += 12;
    else if (restingHeartRate < 80) score += 9;
    else score += 5;
  }

  // Scale to full max if we have any data
  const scaledScore = availableMax > 0 ? (score / availableMax) * max : max;
  return { score: scaledScore, max, hasData };
}

/**
 * Calculate Weighted Metabolic Score (100 points max)
 * Aggregates all category scores into overall metabolic score
 */
function calculateWeightedMetabolicScore(
  inputs: MetabolicInputs,
  bodyComp?: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>
): { score: number; breakdown: import('../types/metabolicEngine').MetabolicScoreBreakdown } {
  const glucoseControl = calculateGlucoseControlScore(
    inputs.fastingGlucose,
    inputs.a1c,
    inputs.fastingInsulin,
    inputs.insulinResistance
  );

  const lipidProfile = calculateLipidScore(
    inputs.triglycerides,
    inputs.hdl,
    inputs.ldl,
    inputs.totalCholesterol
  );

  const bodyComposition = calculateBodyCompositionScore(
    inputs.bodyFat,
    bodyComp?.bmi,
    inputs.waistCircumference,
    inputs.weightTrend
  );

  const vitals = calculateVitalsScore(
    inputs.restingHeartRate
  );

  // Only include categories that have data
  let total = 0;
  let maxTotal = 0;

  // Glucose Control - include if any glucose data exists
  if (inputs.fastingGlucose !== undefined || inputs.a1c !== undefined ||
      inputs.fastingInsulin !== undefined || inputs.insulinResistance !== undefined) {
    total += glucoseControl.score;
    maxTotal += glucoseControl.max;
  }

  // Lipid Profile - include if any lipid data exists
  if (inputs.triglycerides !== undefined || inputs.hdl !== undefined ||
      inputs.ldl !== undefined || inputs.totalCholesterol !== undefined) {
    total += lipidProfile.score;
    maxTotal += lipidProfile.max;
  }

  // Body Composition - include if any body comp data exists
  if (inputs.bodyFat !== undefined || bodyComp?.bmi !== undefined ||
      inputs.waistCircumference !== undefined || inputs.weightTrend !== undefined) {
    total += bodyComposition.score;
    maxTotal += bodyComposition.max;
  }

  // Vitals - include if resting HR exists
  if (inputs.restingHeartRate !== undefined && inputs.restingHeartRate !== null) {
    total += vitals.score;
    maxTotal += vitals.max;
  }

  // Fallback if no data at all
  if (maxTotal === 0) {
    total = 50;
    maxTotal = 100;
  }

  const percentage = Math.round((total / maxTotal) * 100);

  return {
    score: Math.round(total),
    breakdown: {
      glucoseControl: {
        score: Math.round(glucoseControl.score * 10) / 10,
        max: glucoseControl.max,
        percentage: Math.round((glucoseControl.score / glucoseControl.max) * 100),
        hasData: glucoseControl.hasData,
      },
      lipidProfile: {
        score: Math.round(lipidProfile.score * 10) / 10,
        max: lipidProfile.max,
        percentage: Math.round((lipidProfile.score / lipidProfile.max) * 100),
        hasData: lipidProfile.hasData,
      },
      bodyComposition: {
        score: Math.round(bodyComposition.score * 10) / 10,
        max: bodyComposition.max,
        percentage: Math.round((bodyComposition.score / bodyComposition.max) * 100),
        hasData: bodyComposition.hasData,
      },
      vitals: {
        score: Math.round(vitals.score * 10) / 10,
        max: vitals.max,
        percentage: Math.round((vitals.score / vitals.max) * 100),
        hasData: vitals.hasData,
      },
      total: Math.round(total),
      maxTotal,
      percentage,
    },
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Calculate individual input score based on value and optimal ranges
 * Returns: 90 (optimal), 70 (moderate), 50 (elevated_risk), or 30 (high_risk)
 */
function calculateMetabolicInputScore(name: string, value: any): number | undefined {
  if (value === undefined || value === null) return undefined;

  switch (name) {
    case 'Fasting Glucose':
      if (value < 100) return 90;  // optimal
      if (value < 126) return 70;  // moderate (prediabetic range)
      return 30;                    // high_risk (diabetic range)

    case 'A1C':
      if (value < 5.7) return 90;  // optimal
      if (value < 6.5) return 70;  // moderate (prediabetic range)
      return 30;                    // high_risk (diabetic range)

    case 'Fasting Insulin':
      if (value < 10) return 90;   // optimal
      if (value < 20) return 70;   // moderate
      return 30;                    // high_risk

    case 'Triglycerides':
      if (value < 150) return 90;  // optimal
      if (value < 200) return 70;  // moderate (borderline high)
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

    case 'Total Cholesterol':
      if (value < 200) return 90;  // optimal
      if (value < 240) return 70;  // moderate (borderline high)
      return 30;                    // high_risk (high)

    case 'Total Cholesterol/HDL Ratio':
      if (value < 3.5) return 90;  // optimal
      if (value < 4.5) return 70;  // moderate
      if (value < 5.5) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'LDL/HDL Ratio':
      if (value < 2.0) return 90;  // optimal
      if (value < 3.0) return 70;  // moderate
      if (value < 4.0) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Triglyceride/HDL Ratio':
      if (value < 2.0) return 90;  // optimal
      if (value < 3.0) return 70;  // moderate
      if (value < 4.0) return 50;  // elevated_risk
      return 30;                    // high_risk

    case 'Body Fat Percentage':
      if (value < 20) return 90;   // optimal (for men)
      if (value < 25) return 70;   // moderate
      if (value < 30) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Weight Trend':
      if (value === 'stable') return 90;
      if (value === 'slow_loss') return 90;
      if (value === 'slow_gain') return 70;
      if (value === 'rapid_loss') return 50;
      return 30;                    // rapid_gain

    case 'Weight':
      // Weight alone doesn't indicate health, use BMI instead
      return undefined;

    case 'Waist Circumference':
      if (value < 40) return 90;   // optimal (for men)
      if (value < 45) return 70;   // moderate
      return 30;                    // high_risk

    case 'BMI':
      if (value < 25) return 90;   // optimal
      if (value < 30) return 70;   // moderate (overweight)
      if (value < 35) return 50;   // elevated_risk (obese class I)
      return 30;                    // high_risk (obese class II+)

    case 'Resting Heart Rate':
      if (value < 60) return 90;   // optimal (athletic)
      if (value < 70) return 90;   // optimal
      if (value < 80) return 70;   // moderate
      if (value < 90) return 50;   // elevated_risk
      return 30;                    // high_risk

    case 'Insulin Resistance':
      if (value === 'low') return 90;
      if (value === 'moderate') return 70;
      return 30;                    // high

    default:
      return undefined;
  }
}

/**
 * Build detailed input metadata for Metabolic Health V2
 */
const buildMetabolicInputMetadata = (
  inputs: MetabolicInputs,
  bloodwork?: Awaited<ReturnType<typeof getLatestBloodworkContext>>,
  bodyComp?: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>
): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // Fasting Glucose
  metadata.push({
    name: 'Fasting Glucose',
    value: inputs.fastingGlucose,
    unit: 'mg/dL',
    source: inputs.fastingGlucose !== undefined
      ? (bloodwork?.markers?.glucose ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.fastingGlucose !== undefined
      ? { table: 'bloodwork_results', field: 'glucose' }
      : undefined,
    lastUpdated: inputs.fastingGlucose !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Fasting Glucose', inputs.fastingGlucose),
  });

  // A1C
  metadata.push({
    name: 'A1C',
    value: inputs.a1c,
    unit: '%',
    source: inputs.a1c !== undefined
      ? (bloodwork?.markers?.a1c ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.a1c !== undefined
      ? { table: 'bloodwork_results', field: 'a1c' }
      : undefined,
    lastUpdated: inputs.a1c !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('A1C', inputs.a1c),
  });

  // Fasting Insulin
  metadata.push({
    name: 'Fasting Insulin',
    value: inputs.fastingInsulin,
    unit: 'µU/mL',
    source: inputs.fastingInsulin !== undefined
      ? (bloodwork?.markers?.insulin ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.fastingInsulin !== undefined
      ? { table: 'bloodwork_results', field: 'insulin' }
      : undefined,
    lastUpdated: inputs.fastingInsulin !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Fasting Insulin', inputs.fastingInsulin),
  });

  // Triglycerides
  metadata.push({
    name: 'Triglycerides',
    value: inputs.triglycerides,
    unit: 'mg/dL',
    source: inputs.triglycerides !== undefined
      ? (bloodwork?.markers?.triglycerides ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.triglycerides !== undefined
      ? { table: 'bloodwork_results', field: 'triglycerides' }
      : undefined,
    lastUpdated: inputs.triglycerides !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Triglycerides', inputs.triglycerides),
  });

  // HDL Cholesterol
  metadata.push({
    name: 'HDL Cholesterol',
    value: inputs.hdl,
    unit: 'mg/dL',
    source: inputs.hdl !== undefined
      ? (bloodwork?.markers?.hdl ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.hdl !== undefined
      ? { table: 'bloodwork_results', field: 'hdl' }
      : undefined,
    lastUpdated: inputs.hdl !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('HDL Cholesterol', inputs.hdl),
  });

  // LDL Cholesterol
  metadata.push({
    name: 'LDL Cholesterol',
    value: inputs.ldl,
    unit: 'mg/dL',
    source: inputs.ldl !== undefined
      ? (bloodwork?.markers?.ldl ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.ldl !== undefined
      ? { table: 'bloodwork_results', field: 'ldl' }
      : undefined,
    lastUpdated: inputs.ldl !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('LDL Cholesterol', inputs.ldl),
  });

  // Body Fat Percentage
  metadata.push({
    name: 'Body Fat Percentage',
    value: inputs.bodyFat,
    unit: '%',
    source: inputs.bodyFat !== undefined
      ? (bodyComp?.bodyFatPercentage ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.bodyFat !== undefined
      ? { table: 'body_composition_scans', field: 'body_fat_percentage' }
      : undefined,
    lastUpdated: inputs.bodyFat !== undefined ? bodyComp?.latestScanDate : undefined,
    category: 'Body Composition',
    score: calculateMetabolicInputScore('Body Fat Percentage', inputs.bodyFat),
  });

  // Weight Trend
  metadata.push({
    name: 'Weight Trend',
    value: inputs.weightTrend,
    unit: 'trend',
    source: inputs.weightTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.weightTrend !== undefined
      ? { derivedFrom: ['body_composition_history'] }
      : undefined,
    lastUpdated: inputs.weightTrend !== undefined ? now : undefined,
    category: 'Body Composition',
    score: calculateMetabolicInputScore('Weight Trend', inputs.weightTrend),
  });

  // Insulin Resistance
  metadata.push({
    name: 'Insulin Resistance',
    value: inputs.insulinResistance,
    unit: 'classification',
    source: inputs.insulinResistance !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.insulinResistance !== undefined
      ? { derivedFrom: ['glucose', 'insulin'], formula: 'HOMA-IR' }
      : undefined,
    lastUpdated: inputs.insulinResistance !== undefined ? now : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Insulin Resistance', inputs.insulinResistance),
  });

  // Total Cholesterol
  metadata.push({
    name: 'Total Cholesterol',
    value: inputs.totalCholesterol,
    unit: 'mg/dL',
    source: inputs.totalCholesterol !== undefined
      ? (bloodwork?.markers?.totalCholesterol ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.totalCholesterol !== undefined
      ? bloodwork?.markers?.totalCholesterol
        ? { table: 'bloodwork_results', field: 'total_cholesterol' }
        : { derivedFrom: ['ldl', 'hdl'], formula: 'ldl + hdl' }
      : undefined,
    lastUpdated: inputs.totalCholesterol !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Total Cholesterol', inputs.totalCholesterol),
  });

  // Waist Circumference
  metadata.push({
    name: 'Waist Circumference',
    value: inputs.waistCircumference,
    unit: 'inches',
    source: inputs.waistCircumference !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.waistCircumference !== undefined
      ? { table: 'baseline_profile', field: 'waist_circumference' }
      : undefined,
    lastUpdated: inputs.waistCircumference !== undefined ? now : undefined,
    category: 'Body Composition',
    score: calculateMetabolicInputScore('Waist Circumference', inputs.waistCircumference),
  });

  // Weight
  metadata.push({
    name: 'Weight',
    value: inputs.weight,
    unit: 'lbs',
    source: inputs.weight !== undefined
      ? (bodyComp?.weightLb ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.weight !== undefined
      ? { table: 'body_composition_scans', field: 'weight_lb' }
      : undefined,
    lastUpdated: inputs.weight !== undefined ? bodyComp?.latestScanDate : undefined,
    category: 'Body Composition',
    score: calculateMetabolicInputScore('Weight', inputs.weight),
  });

  // Resting Heart Rate
  metadata.push({
    name: 'Resting Heart Rate',
    value: inputs.restingHeartRate,
    unit: 'bpm',
    source: inputs.restingHeartRate !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.restingHeartRate !== undefined
      ? { integration: 'wearable' }
      : undefined,
    lastUpdated: inputs.restingHeartRate !== undefined ? now : undefined,
    category: 'Vitals',
    score: calculateMetabolicInputScore('Resting Heart Rate', inputs.restingHeartRate),
  });

  // Cholesterol Ratio (Total Cholesterol / HDL)
  const cholesterolRatio = inputs.totalCholesterol && inputs.hdl ? inputs.totalCholesterol / inputs.hdl : undefined;
  metadata.push({
    name: 'Total Cholesterol/HDL Ratio',
    value: cholesterolRatio,
    unit: 'ratio',
    source: cholesterolRatio !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: cholesterolRatio !== undefined
      ? { derivedFrom: ['total_cholesterol', 'hdl'], formula: 'total_cholesterol / hdl' }
      : undefined,
    lastUpdated: cholesterolRatio !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Total Cholesterol/HDL Ratio', cholesterolRatio),
  });

  // LDL/HDL Ratio
  const ldlHdlRatio = inputs.ldl && inputs.hdl ? inputs.ldl / inputs.hdl : undefined;
  metadata.push({
    name: 'LDL/HDL Ratio',
    value: ldlHdlRatio,
    unit: 'ratio',
    source: ldlHdlRatio !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: ldlHdlRatio !== undefined
      ? { derivedFrom: ['ldl', 'hdl'], formula: 'ldl / hdl' }
      : undefined,
    lastUpdated: ldlHdlRatio !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('LDL/HDL Ratio', ldlHdlRatio),
  });

  // Triglyceride/HDL Ratio
  const trigHdlRatio = inputs.triglycerides && inputs.hdl ? inputs.triglycerides / inputs.hdl : undefined;
  metadata.push({
    name: 'Triglyceride/HDL Ratio',
    value: trigHdlRatio,
    unit: 'ratio',
    source: trigHdlRatio !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: trigHdlRatio !== undefined
      ? { derivedFrom: ['triglycerides', 'hdl'], formula: 'triglycerides / hdl' }
      : undefined,
    lastUpdated: trigHdlRatio !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateMetabolicInputScore('Triglyceride/HDL Ratio', trigHdlRatio),
  });

  // BMI (from body composition context)
  metadata.push({
    name: 'BMI',
    value: bodyComp?.bmi,
    unit: 'kg/m²',
    source: bodyComp?.bmi !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: bodyComp?.bmi !== undefined
      ? { derivedFrom: ['weight', 'height'], formula: 'calculated from body composition scan' }
      : undefined,
    lastUpdated: bodyComp?.bmi !== undefined ? bodyComp?.latestScanDate : undefined,
    category: 'Body Composition',
    score: calculateMetabolicInputScore('BMI', bodyComp?.bmi),
  });

  return metadata;
};

/**
 * Validate glucose is within physiologically plausible range
 */
function validateGlucose(value: number | null | undefined): number | null {
  if (value == null) return null;
  const valid = value >= 70 && value <= 400;
  if (!valid) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Invalid glucose rejected', { value, validRange: '70-400' });
    return null;
  }
  return value;
}

/**
 * Validate A1C is within physiologically plausible range
 */
function validateA1C(value: number | null | undefined): number | null {
  if (value == null) return null;
  const valid = value >= 3 && value <= 15;
  if (!valid) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Invalid A1C rejected', { value, validRange: '3-15' });
    return null;
  }
  return value;
}

/**
 * Validate insulin is within physiologically plausible range
 */
function validateInsulin(value: number | null | undefined): number | null {
  if (value == null) return null;
  const valid = value >= 2 && value <= 50;
  if (!valid) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Invalid insulin rejected', { value, validRange: '2-50' });
    return null;
  }
  return value;
}

/**
 * Validate body fat percentage is within physiologically plausible range
 */
function validateBodyFat(value: number | null | undefined): number | null {
  if (value == null) return null;
  const valid = value >= 3 && value <= 60;
  if (!valid) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Invalid body fat rejected', { value, validRange: '3-60' });
    return null;
  }
  return value;
}

// ============================================================================
// WEIGHT TREND CALCULATION
// ============================================================================

/**
 * Calculate weight trend from historical body composition data
 * Returns: 'rapid_loss' | 'slow_loss' | 'stable' | 'slow_gain' | 'rapid_gain'
 */
async function calculateWeightTrend(
  userId: string
): Promise<'rapid_loss' | 'slow_loss' | 'stable' | 'slow_gain' | 'rapid_gain'> {
  try {
    logger.info('📊 [METABOLIC ENGINE V2] Calculating weight trend', { userId });

    // Get last 90 days of body composition scans
    const scans = await getBodyCompositionScans(userId, 100);
    
    if (!scans || scans.length < 2) {
      logger.info('⚠️ [METABOLIC ENGINE V2] Insufficient data for weight trend (need 2+ scans)', { 
        userId, 
        scanCount: scans?.length || 0 
      });
      return 'stable';
    }

    // Filter to last 90 days and sort by date
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentScans = scans
      .filter(scan => new Date(scan.scanDate) >= ninetyDaysAgo)
      .sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());

    if (recentScans.length < 2) {
      logger.info('⚠️ [METABOLIC ENGINE V2] Insufficient recent data for weight trend', { 
        userId, 
        recentScanCount: recentScans.length 
      });
      return 'stable';
    }

    // Calculate linear regression slope (weight change per day)
    const firstScan = recentScans[0];
    const lastScan = recentScans[recentScans.length - 1];
    
    const daysDiff = (new Date(lastScan.scanDate).getTime() - new Date(firstScan.scanDate).getTime()) / (1000 * 60 * 60 * 24);
    const weightDiff = lastScan.weightLb - firstScan.weightLb;
    
    // Calculate weight change per week
    const weightChangePerWeek = (weightDiff / daysDiff) * 7;
    
    logger.info('📊 [METABOLIC ENGINE V2] Weight trend calculated', {
      userId,
      scanCount: recentScans.length,
      daysDiff,
      weightDiff: weightDiff.toFixed(2),
      weightChangePerWeek: weightChangePerWeek.toFixed(2),
    });

    // Classify trend
    // Rapid: >2 lbs/week, Slow: 0.5-2 lbs/week, Stable: <0.5 lbs/week
    if (weightChangePerWeek > 2) return 'rapid_gain';
    if (weightChangePerWeek > 0.5) return 'slow_gain';
    if (weightChangePerWeek < -2) return 'rapid_loss';
    if (weightChangePerWeek < -0.5) return 'slow_loss';
    return 'stable';
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE V2] Failed to calculate weight trend', {
      error: (error as Error).message,
    });
    return 'stable';
  }
}

// ============================================================================
// HOMA-IR CALCULATION
// ============================================================================

/**
 * Calculate HOMA-IR (Homeostatic Model Assessment of Insulin Resistance)
 * Formula: (fasting insulin μIU/mL × fasting glucose mg/dL) / 405
 */
function calculateHOMAIR(fastingGlucose: number | null, fastingInsulin: number | null): number | null {
  if (fastingGlucose == null || fastingInsulin == null) {
    return null;
  }
  
  const homaIR = (fastingInsulin * fastingGlucose) / 405;
  
  logger.info('📊 [METABOLIC ENGINE V2] HOMA-IR calculated', {
    fastingGlucose,
    fastingInsulin,
    homaIR: homaIR.toFixed(2),
  });
  
  return homaIR;
}

/**
 * Classify insulin resistance based on HOMA-IR
 * <2.5: Low, 2.5-4.5: Moderate, >4.5: High
 */
function classifyInsulinResistance(homaIR: number | null): 'low' | 'moderate' | 'high' | null {
  if (homaIR == null) return null;
  
  if (homaIR < 2.5) return 'low';
  if (homaIR < 4.5) return 'moderate';
  return 'high';
}

// ============================================================================
// DATA FRESHNESS CALCULATION
// ============================================================================

/**
 * Calculate how old data is in human-readable format
 */
function calculateDataAge(date: string | null): string | null {
  if (!date) return null;
  
  const dataDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dataDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ============================================================================
// DETERMINISTIC METABOLIC STATUS LOGIC
// ============================================================================

/**
 * Determine metabolic status by aggregating scores from all 17 inputs
 * This ensures the overall score reflects ALL metabolic inputs, not just a few
 */
function determineMetabolicStatus(
  inputs: MetabolicInputs,
  bodyComp?: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>
): MetabolicStatus {
  // Calculate individual scores for all 17 inputs
  const scores: (number | undefined)[] = [
    calculateMetabolicInputScore('Fasting Glucose', inputs.fastingGlucose),
    calculateMetabolicInputScore('A1C', inputs.a1c),
    calculateMetabolicInputScore('Fasting Insulin', inputs.fastingInsulin),
    calculateMetabolicInputScore('Triglycerides', inputs.triglycerides),
    calculateMetabolicInputScore('HDL Cholesterol', inputs.hdl),
    calculateMetabolicInputScore('LDL Cholesterol', inputs.ldl),
    calculateMetabolicInputScore('Total Cholesterol', inputs.totalCholesterol),
    calculateMetabolicInputScore('Body Fat Percentage', inputs.bodyFat),
    calculateMetabolicInputScore('Weight Trend', inputs.weightTrend),
    calculateMetabolicInputScore('Insulin Resistance', inputs.insulinResistance),
    calculateMetabolicInputScore('Waist Circumference', inputs.waistCircumference),
    calculateMetabolicInputScore('Weight', inputs.weight),
    calculateMetabolicInputScore('Resting Heart Rate', inputs.restingHeartRate),
    calculateMetabolicInputScore('Total Cholesterol/HDL Ratio', inputs.totalCholesterol && inputs.hdl ? inputs.totalCholesterol / inputs.hdl : undefined),
    calculateMetabolicInputScore('LDL/HDL Ratio', inputs.ldl && inputs.hdl ? inputs.ldl / inputs.hdl : undefined),
    calculateMetabolicInputScore('Triglyceride/HDL Ratio', inputs.triglycerides && inputs.hdl ? inputs.triglycerides / inputs.hdl : undefined),
    calculateMetabolicInputScore('BMI', bodyComp?.bmi),
  ];

  // Filter out undefined scores and calculate average
  const validScores = scores.filter((s): s is number => s !== undefined);
  
  if (validScores.length === 0) {
    // No data available, return optimal as default
    return 'optimal';
  }

  // Calculate average score
  const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;

  // Log the scoring details for debugging
  logger.info('📊 [METABOLIC ENGINE V2] Individual input scores', {
    fastingGlucose: calculateMetabolicInputScore('Fasting Glucose', inputs.fastingGlucose),
    a1c: calculateMetabolicInputScore('A1C', inputs.a1c),
    fastingInsulin: calculateMetabolicInputScore('Fasting Insulin', inputs.fastingInsulin),
    triglycerides: calculateMetabolicInputScore('Triglycerides', inputs.triglycerides),
    hdl: calculateMetabolicInputScore('HDL Cholesterol', inputs.hdl),
    ldl: calculateMetabolicInputScore('LDL Cholesterol', inputs.ldl),
    totalCholesterol: calculateMetabolicInputScore('Total Cholesterol', inputs.totalCholesterol),
    bodyFat: calculateMetabolicInputScore('Body Fat Percentage', inputs.bodyFat),
    weightTrend: calculateMetabolicInputScore('Weight Trend', inputs.weightTrend),
    insulinResistance: calculateMetabolicInputScore('Insulin Resistance', inputs.insulinResistance),
    waistCircumference: calculateMetabolicInputScore('Waist Circumference', inputs.waistCircumference),
    weight: calculateMetabolicInputScore('Weight', inputs.weight),
    restingHeartRate: calculateMetabolicInputScore('Resting Heart Rate', inputs.restingHeartRate),
    cholesterolRatio: calculateMetabolicInputScore('Total Cholesterol/HDL Ratio', inputs.totalCholesterol && inputs.hdl ? inputs.totalCholesterol / inputs.hdl : undefined),
    ldlHdlRatio: calculateMetabolicInputScore('LDL/HDL Ratio', inputs.ldl && inputs.hdl ? inputs.ldl / inputs.hdl : undefined),
    trigHdlRatio: calculateMetabolicInputScore('Triglyceride/HDL Ratio', inputs.triglycerides && inputs.hdl ? inputs.triglycerides / inputs.hdl : undefined),
    bmi: calculateMetabolicInputScore('BMI', bodyComp?.bmi),
    validScoresCount: validScores.length,
    averageScore: averageScore.toFixed(2),
  });

  // Map average score to metabolic status
  if (averageScore >= 85) return 'optimal';
  if (averageScore >= 70) return 'moderate';
  if (averageScore >= 50) return 'elevated_risk';
  return 'high_risk';
}

// ============================================================================
// DETERMINISTIC METABOLIC STATUS LOGIC (LEGACY - KEPT FOR REFERENCE)
// ============================================================================

/**
 * Legacy metabolic status determination (only used 4 inputs)
 * Replaced by the new comprehensive scoring system above
 */
function determineMetabolicStatusLegacy(inputs: MetabolicInputs): MetabolicStatus {
  const { a1c, fastingGlucose, weightTrend, insulinResistance } = inputs;

  // High Risk: A1C high, rapid weight gain, insulin resistance
  if (
    (a1c != null && a1c >= 6.5) ||
    insulinResistance === 'high' ||
    weightTrend === 'rapid_gain'
  ) {
    return 'high_risk';
  }

  // Elevated Risk: A1C rising, fasting glucose elevated
  if (
    (a1c != null && a1c >= 5.7) ||
    (fastingGlucose != null && fastingGlucose >= 100) ||
    insulinResistance === 'moderate'
  ) {
    return 'elevated_risk';
  }

  // Moderate: Mild elevated glucose, minor weight drift
  if (
    (a1c != null && a1c >= 5.5) ||
    (fastingGlucose != null && fastingGlucose >= 95) ||
    weightTrend === 'slow_gain'
  ) {
    return 'moderate';
  }

  // Optimal: A1C < 5.7, fasting glucose normal, stable weight
  return 'optimal';
}

// ============================================================================
// EVIDENCE BUILDER
// ============================================================================

function buildMetabolicEvidence(
  inputs: MetabolicInputs, 
  status: MetabolicStatus, 
  bloodwork?: Awaited<ReturnType<typeof getLatestBloodworkContext>>,
  bodyComp?: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>,
  baseline?: Awaited<ReturnType<typeof getBaselineFields>>
): MetabolicEvidence {
  logger.info('📊 [METABOLIC EVIDENCE V2] Building evidence');

  const signals: MetabolicEvidenceSignal[] = [];

  if (inputs.a1c != null) {
    signals.push({
      name: 'A1C',
      value: inputs.a1c,
      interpretation: inputs.a1c < 5.7 ? 'Normal' : inputs.a1c < 6.5 ? 'Prediabetic range' : 'Diabetic range',
      dataAge: bloodwork?.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
    });
  }

  if (inputs.fastingGlucose != null) {
    signals.push({
      name: 'Fasting Glucose',
      value: inputs.fastingGlucose,
      interpretation: inputs.fastingGlucose < 100 ? 'Normal' : inputs.fastingGlucose < 126 ? 'Elevated' : 'High',
      dataAge: bloodwork?.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
    });
  }

  // Add HOMA-IR if available
  if (inputs.fastingInsulin != null && inputs.fastingGlucose != null) {
    const homaIR = calculateHOMAIR(inputs.fastingGlucose, inputs.fastingInsulin);
    if (homaIR != null) {
      signals.push({
        name: 'HOMA-IR',
        value: homaIR,
        interpretation: homaIR < 2.5 ? 'Low insulin resistance' : homaIR < 4.5 ? 'Moderate insulin resistance' : 'High insulin resistance',
        dataAge: bloodwork?.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
      });
    }
  }

  // Add body composition-based evidence signals
  if (bodyComp?.hasBodyComposition) {
    if (bodyComp.visceralFatLevel !== null) {
      const visceralRisk = getVisceralFatRisk(bodyComp.visceralFatLevel);
      signals.push({
        name: 'Visceral Fat Level',
        value: bodyComp.visceralFatLevel,
        interpretation: `${visceralRisk} risk (${bodyComp.visceralFatLevel < 10 ? 'Normal' : bodyComp.visceralFatLevel < 15 ? 'Elevated' : 'High'})`,
        dataAge: bodyComp.latestScanDate ? calculateDataAge(bodyComp.latestScanDate) : null,
      });
    }

    if (bodyComp.bodyFatPercentage !== null) {
      // Use actual user sex from baseline profile (V2 FIX)
      const userSex = (baseline?.sex === 'female' ? 'female' : 'male') as 'male' | 'female';
      const bodyFatCategory = getBodyFatCategory(bodyComp.bodyFatPercentage, userSex);
      signals.push({
        name: 'Body Fat Percentage',
        value: bodyComp.bodyFatPercentage,
        interpretation: `${bodyFatCategory} (${bodyComp.bodyFatPercentage.toFixed(1)}%)`,
        dataAge: bodyComp.latestScanDate ? calculateDataAge(bodyComp.latestScanDate) : null,
      });
    }

    if (bodyComp.weightLb !== null && bodyComp.bmi !== null) {
      signals.push({
        name: 'BMI',
        value: bodyComp.bmi,
        interpretation: bodyComp.bmi < 18.5 ? 'Underweight' : bodyComp.bmi < 25 ? 'Normal' : bodyComp.bmi < 30 ? 'Overweight' : 'Obese',
        dataAge: bodyComp.latestScanDate ? calculateDataAge(bodyComp.latestScanDate) : null,
      });
    }
  }

  // Add bloodwork-based evidence signals
  if (bloodwork?.hasBloodwork) {
    if (bloodwork.markers.triglycerides) {
      const tgValue = getMarkerValue(bloodwork.markers.triglycerides);
      if (tgValue !== null) {
        signals.push({
          name: 'Triglycerides',
          value: tgValue,
          interpretation: tgValue < 150 ? 'Normal' : tgValue < 200 ? 'Borderline high' : 'High',
          dataAge: bloodwork.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
        });
      }
    }

    if (bloodwork.markers.hdl) {
      const hdlValue = getMarkerValue(bloodwork.markers.hdl);
      if (hdlValue !== null) {
        signals.push({
          name: 'HDL Cholesterol',
          value: hdlValue,
          interpretation: hdlValue >= 60 ? 'Optimal' : hdlValue >= 40 ? 'Acceptable' : 'Low',
          dataAge: bloodwork.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
        });
      }
    }

    if (bloodwork.markers.ldl) {
      const ldlValue = getMarkerValue(bloodwork.markers.ldl);
      if (ldlValue !== null) {
        signals.push({
          name: 'LDL Cholesterol',
          value: ldlValue,
          interpretation: ldlValue < 100 ? 'Optimal' : ldlValue < 130 ? 'Near optimal' : ldlValue < 160 ? 'Borderline high' : 'High',
          dataAge: bloodwork.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
        });
      }
    }

    if (bloodwork.markers.insulin) {
      const insulinValue = getMarkerValue(bloodwork.markers.insulin);
      if (insulinValue !== null) {
        signals.push({
          name: 'Insulin',
          value: insulinValue,
          interpretation: insulinValue < 5 ? 'Normal' : insulinValue < 10 ? 'Elevated' : 'High',
          dataAge: bloodwork.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
        });
      }
    }
  }

  if (inputs.weightTrend) {
    signals.push({
      name: 'Weight Trend',
      value: inputs.weightTrend,
      interpretation: inputs.weightTrend === 'stable' ? 'Stable' : 
                      inputs.weightTrend === 'slow_gain' ? 'Gradual increase' : 
                      inputs.weightTrend === 'rapid_gain' ? 'Rapid increase' :
                      inputs.weightTrend === 'slow_loss' ? 'Gradual decrease' : 'Rapid decrease',
      dataAge: bodyComp?.latestScanDate ? calculateDataAge(bodyComp.latestScanDate) : null,
    });
  }

  if (inputs.insulinResistance) {
    signals.push({
      name: 'Insulin Resistance',
      value: inputs.insulinResistance,
      interpretation: inputs.insulinResistance === 'low' ? 'Low risk' : inputs.insulinResistance === 'moderate' ? 'Moderate risk' : 'High risk',
      dataAge: bloodwork?.latestTestDate ? calculateDataAge(bloodwork.latestTestDate) : null,
    });
  }

  const summary = `Metabolic status: ${status}. ${signals.length} metabolic signals analyzed.`;

  logger.info('✅ [METABOLIC EVIDENCE V2] Evidence built', { signalCount: signals.length, status });

  return {
    metabolicStatus: status,
    signals,
    summary,
  };
}

// ============================================================================
// FALLBACK RECOMMENDATION BUILDER
// ============================================================================

function buildMetabolicFallbackRecommendation(status: MetabolicStatus): MetabolicRecommendation {
  logger.info('🔧 [METABOLIC FALLBACK V2] Building fallback recommendation');

  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  switch (status) {
    case 'high_risk':
      priority = 'critical';
      summary = 'Metabolic health requires immediate intervention';
      actions = [
        'Aggressive carbohydrate reduction',
        'Increase daily activity significantly',
        'Consider time-restricted eating',
        'Consult healthcare provider for metabolic assessment',
      ];
      break;

    case 'elevated_risk':
      priority = 'important';
      summary = 'Metabolic risk is increasing and requires attention';
      actions = [
        'Reduce refined carbohydrates',
        'Increase physical activity',
        'Monitor weight and glucose trends',
        'Optimize sleep and stress management',
      ];
      break;

    case 'moderate':
      priority = 'important';
      summary = 'Metabolic health shows mild risk signals';
      actions = [
        'Maintain balanced macronutrient intake',
        'Continue regular exercise',
        'Monitor metabolic markers',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Metabolic health is optimal';
      actions = [
        'Maintain current nutrition and activity patterns',
        'Continue monitoring metabolic markers',
        'Focus on long-term metabolic health',
      ];
      break;
  }

  logger.info('✅ [METABOLIC FALLBACK V2] Fallback recommendation built', { priority, status });

  return {
    type: 'metabolic',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}


// ============================================================================
// MAIN ENGINE FLOW
// ============================================================================

export async function getMetabolicRecommendationV2(
  userId: string,
  inputs: MetabolicInputs,
  bloodwork?: Awaited<ReturnType<typeof getLatestBloodworkContext>>,
  bodyComp?: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>,
  baseline?: Awaited<ReturnType<typeof getBaselineFields>>
): Promise<MetabolicRecord> {
  logger.info('🔵 [METABOLIC ENGINE V2] Starting metabolic recommendation flow', { userId });

  // Step 0: Load baseline profile for personalized context (if not provided)
  const baselineData = baseline || await getBaselineFields(userId);
  logger.info('✅ [METABOLIC ENGINE V2] Baseline profile loaded', {
    userId,
    age: baselineData.age,
    sex: baselineData.sex,
    weight: baselineData.weight,
    activityLevel: baselineData.activityLevel,
    diabetesStatus: baselineData.diabetesStatus,
  });

  // Step 0b: Load bloodwork for metabolic markers (if not provided)
  const bloodworkData = bloodwork || await getLatestBloodworkContext(userId);
  
  // Step 0c: Load body composition for metabolic risk assessment (if not provided)
  const bodyCompData = bodyComp || await getLatestBodyCompositionContext(userId);
  
  if (bloodworkData.hasBloodwork) {
    logger.info('✅ [METABOLIC ENGINE V2] Bloodwork loaded', {
      userId,
      latestTestDate: bloodworkData.latestTestDate,
      hasGlucose: !!bloodworkData.markers.glucose,
      hasA1C: !!bloodworkData.markers.a1c,
      hasInsulin: !!bloodworkData.markers.insulin,
      hasTriglycerides: !!bloodworkData.markers.triglycerides,
      hasHDL: !!bloodworkData.markers.hdl,
      hasLDL: !!bloodworkData.markers.ldl,
    });

    // Enrich inputs with actual bloodwork values (preserve user-provided values if present)
    if (!inputs.a1c && bloodworkData.markers.a1c) {
      const rawA1C = getMarkerValue(bloodworkData.markers.a1c);
      inputs.a1c = validateA1C(rawA1C);
      logger.info('📊 [METABOLIC ENGINE V2] Using A1C from bloodwork', { a1c: inputs.a1c });
    }
    if (!inputs.fastingGlucose && bloodworkData.markers.glucose) {
      const rawGlucose = getMarkerValue(bloodworkData.markers.glucose);
      inputs.fastingGlucose = validateGlucose(rawGlucose);
      logger.info('📊 [METABOLIC ENGINE V2] Using glucose from bloodwork', { glucose: inputs.fastingGlucose });
    }
    if (!inputs.fastingInsulin && bloodworkData.markers.insulin) {
      const rawInsulin = getMarkerValue(bloodworkData.markers.insulin);
      inputs.fastingInsulin = validateInsulin(rawInsulin);
      logger.info('📊 [METABOLIC ENGINE V2] Using insulin from bloodwork', { insulin: inputs.fastingInsulin });
    }
    if (!inputs.hdl && bloodworkData.markers.hdl) {
      const rawHDL = getMarkerValue(bloodworkData.markers.hdl);
      inputs.hdl = rawHDL;
      logger.info('📊 [METABOLIC ENGINE V2] Using HDL from bloodwork', { hdl: inputs.hdl });
    }
    if (!inputs.ldl && bloodworkData.markers.ldl) {
      const rawLDL = getMarkerValue(bloodworkData.markers.ldl);
      inputs.ldl = rawLDL;
      logger.info('📊 [METABOLIC ENGINE V2] Using LDL from bloodwork', { ldl: inputs.ldl });
    }
    if (!inputs.triglycerides && bloodworkData.markers.triglycerides) {
      const rawTriglycerides = getMarkerValue(bloodworkData.markers.triglycerides);
      inputs.triglycerides = rawTriglycerides;
      logger.info('📊 [METABOLIC ENGINE V2] Using triglycerides from bloodwork', { triglycerides: inputs.triglycerides });
    }

    // Calculate total cholesterol from LDL + HDL if total cholesterol is missing
    if (!inputs.totalCholesterol && inputs.ldl && inputs.hdl) {
      inputs.totalCholesterol = inputs.ldl + inputs.hdl;
      logger.info('📊 [METABOLIC ENGINE V2] Calculated total cholesterol from LDL + HDL', { totalCholesterol: inputs.totalCholesterol });
    }
  } else {
    logger.info('⚠️ [METABOLIC ENGINE V2] No bloodwork available, using provided inputs only', { userId });
  }
  
  if (bodyCompData.hasBodyComposition) {
    logger.info('✅ [METABOLIC ENGINE V2] Body composition loaded', {
      userId,
      latestScanDate: bodyCompData.latestScanDate,
      bodyFatPercentage: bodyCompData.bodyFatPercentage,
      visceralFatLevel: bodyCompData.visceralFatLevel,
      weightLb: bodyCompData.weightLb,
    });
    
    // Enrich inputs with body composition
    if (!inputs.bodyFat && bodyCompData.bodyFatPercentage !== null) {
      inputs.bodyFat = validateBodyFat(bodyCompData.bodyFatPercentage);
    }
  } else {
    logger.info('⚠️ [METABOLIC ENGINE V2] No body composition available', { userId });
  }

  // Step 1: Calculate weight trend (V2 NEW)
  if (!inputs.weightTrend) {
    inputs.weightTrend = await calculateWeightTrend(userId);
    logger.info('📊 [METABOLIC ENGINE V2] Weight trend calculated', { weightTrend: inputs.weightTrend });
  }

  // Step 2: Calculate insulin resistance via HOMA-IR (V2 NEW)
  if (!inputs.insulinResistance && inputs.fastingGlucose && inputs.fastingInsulin) {
    const homaIR = calculateHOMAIR(inputs.fastingGlucose, inputs.fastingInsulin);
    inputs.insulinResistance = classifyInsulinResistance(homaIR) || undefined;
    logger.info('📊 [METABOLIC ENGINE V2] Insulin resistance calculated', { 
      homaIR: homaIR?.toFixed(2), 
      insulinResistance: inputs.insulinResistance 
    });
  }

  // Step 3: Deterministic status (using all 17 inputs)
  const metabolicStatus = determineMetabolicStatus(inputs, bodyCompData);
  logger.info('📊 [METABOLIC ENGINE V2] Status determined', { userId, metabolicStatus });

  // Step 3.5: Calculate weighted metabolic score
  const { score: metabolicScore, breakdown: scoreBreakdown } = calculateWeightedMetabolicScore(inputs, bodyCompData);
  logger.info('📊 [METABOLIC ENGINE V2] Weighted metabolic score calculated', {
    userId,
    metabolicScore,
    percentage: scoreBreakdown.percentage,
    breakdown: scoreBreakdown
  });

  // Step 4: Build evidence (include bloodwork, body composition, and baseline)
  const evidence = buildMetabolicEvidence(inputs, metabolicStatus, bloodworkData, bodyCompData, baselineData);

  // Step 5: Build fallback recommendation
  const fallbackRecommendation = buildMetabolicFallbackRecommendation(metabolicStatus);

  // Step 6: AI enrichment (if enabled)
  let recommendation: MetabolicRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [METABOLIC ENGINE V2] AI enrichment enabled');
    recommendation = await enrichMetabolicRecommendation(evidence, fallbackRecommendation);
  } else {
    logger.info('🔧 [METABOLIC ENGINE V2] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  // Step 7: Normalize
  recommendation = normalizeMetabolicRecommendation(recommendation);

  // Step 8: Validate
  const isValid = validateMetabolicRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Validation failed, using fallback');
    recommendation = normalizeMetabolicRecommendation(fallbackRecommendation);
  }

  // Step 8.5: Build detailed input metadata (if feature flag enabled)
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS) {
    const allInputs = buildMetabolicInputMetadata(inputs, bloodworkData, bodyCompData);
    // Filter to only show inputs used in weighted scoring (13 inputs)
    const usedInputNames = [
      'Fasting Glucose', 'A1C', 'Fasting Insulin', 'Insulin Resistance',
      'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'Total Cholesterol/HDL Ratio',
      'Body Fat Percentage', 'BMI', 'Waist Circumference', 'Weight Trend',
      'Resting Heart Rate'
    ];
    detailedInputs = allInputs.filter(input => usedInputNames.includes(input.name));
    logger.info('✅ [METABOLIC ENGINE V2] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  // Step 9: Create record
  const record: MetabolicRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    metabolicStatus,
    metabolicScore,
    scoreBreakdown,
    evidence,
    recommendation,
    inputs,
    createdAt: new Date().toISOString(),
    ...(detailedInputs && { detailedInputs }),
  };

  // Step 10: Persist to database
  try {
    const { error: dbError } = await supabase
      .from('metabolic_records')
      .upsert({
        user_id: userId,
        date: record.date,
        metabolic_score: Math.round((metabolicStatus === 'optimal' ? 90 : metabolicStatus === 'moderate' ? 70 : metabolicStatus === 'elevated_risk' ? 50 : 30)),
        metabolic_status: metabolicStatus === 'optimal' ? 'optimal' : metabolicStatus === 'moderate' ? 'healthy' : metabolicStatus === 'elevated_risk' ? 'at_risk' : 'impaired',
        metabolic_risk: metabolicStatus === 'high_risk' ? 'very_high' : metabolicStatus === 'elevated_risk' ? 'high' : metabolicStatus === 'moderate' ? 'moderate' : 'low',
        glucose_metrics: {
          fastingGlucose: inputs.fastingGlucose,
          a1c: inputs.a1c,
          glucoseStatus: inputs.fastingGlucose && inputs.fastingGlucose >= 126 ? 'high' : inputs.fastingGlucose && inputs.fastingGlucose >= 100 ? 'elevated' : 'normal',
        },
        insulin_metrics: {
          insulinSensitivity: inputs.insulinResistance || 'unknown',
          estimatedHOMAIR: inputs.fastingGlucose && inputs.fastingInsulin ? calculateHOMAIR(inputs.fastingGlucose, inputs.fastingInsulin) : null,
        },
        inputs: inputs,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      });

    if (dbError) {
      logger.error('❌ [METABOLIC ENGINE V2] Failed to persist to database', {
        error: dbError.message,
      });
    } else {
      logger.info('✅ [METABOLIC ENGINE V2] Persisted to database');
    }
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE V2] Database error', {
      error: (error as Error).message,
    });
  }

  // Step 11: Persist to RecommendationEngine
  try {
    await createRecommendation({
      userId,
      request: {
        sourceEngine: 'metabolic',
        title: recommendation.summary,
        description: recommendation.actions.join('. '),
        rationale: recommendation.rationale,
        priority: recommendation.priority,
        category: 'health_monitoring',
        confidenceLevel: recommendation.source === 'ai_enriched' ? 'high' : 'medium',
        actionType: 'monitor',
        actionTarget: 'metabolic_health',
      },
    });
    logger.info('✅ [METABOLIC ENGINE V2] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE V2] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [METABOLIC ENGINE V2] Metabolic recommendation complete', {
    userId,
    metabolicStatus,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}

export async function getMetabolicTodayV2(userId: string): Promise<MetabolicRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  
  // Try to fetch from database first
  try {
    const { data, error } = await supabase
      .from('metabolic_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (data && !error) {
      logger.info('📋 [METABOLIC ENGINE V2] Returning database record', { userId, date: today });
      
      // Map database record to MetabolicRecord format
      const inputs = data.inputs as MetabolicInputs;
      const metabolicStatus = data.metabolic_status === 'optimal' ? 'optimal' : 
                             data.metabolic_status === 'healthy' ? 'moderate' :
                             data.metabolic_status === 'at_risk' ? 'elevated_risk' : 'high_risk';
      
      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        metabolicStatus,
        evidence: {
          metabolicStatus,
          signals: [],
          summary: `Metabolic status: ${data.metabolic_status}`,
        },
        recommendation: {
          type: 'metabolic',
          priority: data.metabolic_risk === 'very_high' ? 'critical' : data.metabolic_risk === 'high' ? 'important' : 'optimization',
          summary: `Metabolic health assessment for ${data.date}`,
          actions: [],
          rationale: `Based on metabolic score: ${data.metabolic_score}`,
          source: 'deterministic',
        },
        inputs: data.inputs,
        createdAt: data.created_at,
        detailedInputs: data.detailed_inputs,
      };
    }
  } catch (error) {
    logger.warn('⚠️ [METABOLIC ENGINE V2] Database fetch failed, will generate new', {
      error: (error as Error).message,
    });
  }

  logger.info('🔄 [METABOLIC ENGINE V2] No database record, generating new', { userId });
  
  // V2: NO HARDCODED DEFAULTS - fetch real data from context services
  const [bloodwork, bodyComp, baseline] = await Promise.allSettled([
    getLatestBloodworkContext(userId),
    getLatestBodyCompositionContext(userId),
    getBaselineFields(userId),
  ]);

  const bloodworkData = bloodwork.status === 'fulfilled' ? bloodwork.value : undefined;
  const bodyCompData = bodyComp.status === 'fulfilled' ? bodyComp.value : undefined;
  const baselineData = baseline.status === 'fulfilled' ? baseline.value : undefined;

  // Build inputs from actual data only (no hardcoded defaults)
  const inputs: MetabolicInputs = {};

  return getMetabolicRecommendationV2(userId, inputs, bloodworkData, bodyCompData, baselineData);
}

export async function getMetabolicHistoryV2(userId: string): Promise<MetabolicRecord[]> {
  try {
    const { data, error } = await supabase
      .from('metabolic_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (error) {
      logger.error('❌ [METABOLIC ENGINE V2] Failed to fetch history', {
        error: error.message,
      });
      return [];
    }

    // Map database records to MetabolicRecord format
    return (data || []).map(row => {
      const metabolicStatus = row.metabolic_status === 'optimal' ? 'optimal' : 
                             row.metabolic_status === 'healthy' ? 'moderate' :
                             row.metabolic_status === 'at_risk' ? 'elevated_risk' : 'high_risk';
      
      return {
        id: row.id,
        userId: row.user_id,
        date: row.date,
        metabolicStatus,
        evidence: {
          metabolicStatus,
          signals: [],
          summary: `Metabolic status: ${row.metabolic_status}`,
        },
        recommendation: {
          type: 'metabolic',
          priority: row.metabolic_risk === 'very_high' ? 'critical' : row.metabolic_risk === 'high' ? 'important' : 'optimization',
          summary: `Metabolic health assessment for ${row.date}`,
          actions: [],
          rationale: `Based on metabolic score: ${row.metabolic_score}`,
          source: 'deterministic',
        },
        inputs: row.inputs,
        createdAt: row.created_at,
        detailedInputs: row.detailed_inputs,
      };
    });
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE V2] Database error fetching history', {
      error: (error as Error).message,
    });
    return [];
  }
}

/**
 * Sexual Health Engine Service V3
 * Extends V2 with raw hormone values for display
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → Trend Enrichment → Raw Value Addition → AI Enrichment → Normalizer → Validator → Persistence
 * 
 * Extends V2 with:
 * - Raw hormone values in trend signals (rawValue, rawUnit)
 * - Absolute value signals for testosterone and free testosterone
 * - Enhanced display context for clinical interpretation
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { enrichSexualHealthRecommendation } from './sexualHealthAIEnrichment';
import { normalizeSexualHealthRecommendation } from './sexualHealthRecommendationNormalizer';
import { validateSexualHealthRecommendation } from './sexualHealthRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue } from './bloodworkContextService';
import { getBloodworkTrendsByUser } from './bloodworkTrendService';
import { supabase } from '../config/supabase';
import type {
  SexualHealthRecordV3,
  SexualHealthInputsV3,
  SexualHealthEvidenceV3,
  SexualHealthEvidenceSignalV3,
  SexualHealthStatus,
  SexualHealthRecommendation,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  ScoreComponent,
  SexualHealthScoreBreakdown,
} from '../types/sexualHealthEngineV3';
import type { BloodworkTrend, GetBloodworkTrendsResponse } from '../types/bloodworkTrends';
import type { InputMetadata } from '../types/inputMetadata';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_SEXUAL_HEALTH === 'true';
const USE_TREND_ANALYSIS = process.env.USE_TREND_ANALYSIS_SEXUAL_HEALTH === 'true';
const SHOW_DETAIL_SCREEN_INPUTS = process.env.SHOW_DETAIL_SCREEN_INPUTS === 'true';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate individual input score based on value and optimal ranges
 * Returns: 90 (optimal), 70 (moderate), 50 (elevated_risk), or 30 (high_risk)
 */
function calculateSexualHealthInputScore(name: string, value: any, age?: number): number | undefined {
  if (value === undefined || value === null) return undefined;

  switch (name) {
    case 'Total Testosterone':
      const optimalMin = age && age < 40 ? 600 : age && age < 50 ? 500 : 400;
      const normalMin = age && age < 40 ? 400 : age && age < 50 ? 350 : 300;
      const lowMin = age && age < 40 ? 250 : age && age < 50 ? 230 : 200;
      if (value >= optimalMin) return 90;
      if (value >= normalMin) return 70;
      if (value >= lowMin) return 50;
      return 30;

    case 'Free Testosterone':
      if (value >= 15) return 90;
      if (value >= 10) return 70;
      if (value >= 5) return 50;
      return 30;

    case 'Libido Self Rating':
    case 'Erectile Function Rating':
      if (value >= 4) return 90;
      if (value >= 3) return 70;
      if (value >= 2) return 50;
      return 30;

    case 'Morning Erections Frequency':
      if (value >= 5) return 90;
      if (value >= 3) return 70;
      if (value >= 1) return 50;
      return 30;

    case 'Stress Level':
      if (value <= 2) return 90;
      if (value <= 3) return 70;
      if (value <= 4) return 50;
      return 30;

    case 'Sleep Quality':
      if (value >= 4) return 90;
      if (value >= 3) return 70;
      if (value >= 2) return 50;
      return 30;

    case 'Sleep Hours':
      if (value >= 7 && value <= 9) return 90;
      if (value >= 6 && value <= 10) return 70;
      if (value >= 5 && value <= 11) return 50;
      return 30;

    case 'Recovery Score':
    case 'Adherence Score':
      if (value >= 80) return 90;
      if (value >= 60) return 70;
      if (value >= 40) return 50;
      return 30;

    case 'Stress Score':
      if (value <= 30) return 90;
      if (value <= 50) return 70;
      if (value <= 70) return 50;
      return 30;

    case 'Fatigue Score':
      if (value <= 3) return 90;
      if (value <= 5) return 70;
      if (value <= 7) return 50;
      return 30;

    case 'Heart Rate Variability':
      if (value >= 60) return 90;
      if (value >= 45) return 70;
      if (value >= 30) return 50;
      return 30;

    case 'Resting Heart Rate':
      if (value < 60) return 90;
      if (value < 70) return 70;
      if (value < 80) return 50;
      return 30;

    default:
      return undefined;
  }
}

/**
 * Build detailed input metadata for Sexual Health V3
 */
const buildSexualHealthInputMetadata = (
  inputs: SexualHealthInputsV3,
  bloodwork: any
): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // Total Testosterone
  metadata.push({
    name: 'Total Testosterone',
    value: inputs.totalTestosterone,
    unit: 'ng/dL',
    source: inputs.totalTestosterone !== undefined
      ? (bloodwork?.markers?.totalTestosterone ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.totalTestosterone !== undefined
      ? { table: 'bloodwork_results', field: 'total_testosterone' }
      : undefined,
    lastUpdated: inputs.totalTestosterone !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateSexualHealthInputScore('Total Testosterone', inputs.totalTestosterone, inputs.age),
  });

  // Free Testosterone
  metadata.push({
    name: 'Free Testosterone',
    value: inputs.freeTestosterone,
    unit: 'pg/mL',
    source: inputs.freeTestosterone !== undefined
      ? (bloodwork?.markers?.freeTestosterone ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.freeTestosterone !== undefined
      ? { table: 'bloodwork_results', field: 'free_testosterone' }
      : undefined,
    lastUpdated: inputs.freeTestosterone !== undefined ? bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
    score: calculateSexualHealthInputScore('Free Testosterone', inputs.freeTestosterone),
  });

  // Libido Self Rating
  metadata.push({
    name: 'Libido Self Rating',
    value: inputs.libidoSelfRating,
    unit: 'scale (1-5)',
    source: inputs.libidoSelfRating !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.libidoSelfRating !== undefined
      ? { table: 'daily_logs', field: 'libido_rating' }
      : undefined,
    lastUpdated: inputs.libidoSelfRating !== undefined ? now : undefined,
    category: 'Self-Reported',
    score: calculateSexualHealthInputScore('Libido Self Rating', inputs.libidoSelfRating),
  });

  // Erectile Function Rating
  metadata.push({
    name: 'Erectile Function Rating',
    value: inputs.erectileFunctionRating,
    unit: 'scale (1-5)',
    source: inputs.erectileFunctionRating !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.erectileFunctionRating !== undefined
      ? { table: 'daily_logs', field: 'erectile_function' }
      : undefined,
    lastUpdated: inputs.erectileFunctionRating !== undefined ? now : undefined,
    category: 'Self-Reported',
    score: calculateSexualHealthInputScore('Erectile Function Rating', inputs.erectileFunctionRating),
  });

  // Morning Erections Frequency
  metadata.push({
    name: 'Morning Erections Frequency',
    value: inputs.morningErectionsFrequency,
    unit: 'days/week',
    source: inputs.morningErectionsFrequency !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.morningErectionsFrequency !== undefined
      ? { table: 'daily_logs', field: 'morning_erections' }
      : undefined,
    lastUpdated: inputs.morningErectionsFrequency !== undefined ? now : undefined,
    category: 'Self-Reported',
    score: calculateSexualHealthInputScore('Morning Erections Frequency', inputs.morningErectionsFrequency),
  });

  // Age
  metadata.push({
    name: 'Age',
    value: inputs.age,
    unit: 'years',
    source: inputs.age !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.age !== undefined
      ? { table: 'baseline_profile', field: 'age' }
      : undefined,
    lastUpdated: inputs.age !== undefined ? now : undefined,
    category: 'Demographics',
  });

  // Stress Level
  metadata.push({
    name: 'Stress Level',
    value: inputs.stressLevel,
    unit: 'scale (1-5)',
    source: inputs.stressLevel !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.stressLevel !== undefined
      ? { table: 'daily_logs', field: 'stress_level' }
      : undefined,
    lastUpdated: inputs.stressLevel !== undefined ? now : undefined,
    category: 'Wellness',
    score: calculateSexualHealthInputScore('Stress Level', inputs.stressLevel),
  });

  // Sleep Quality
  metadata.push({
    name: 'Sleep Quality',
    value: inputs.sleepQuality,
    unit: 'scale (1-5)',
    source: inputs.sleepQuality !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sleepQuality !== undefined
      ? { table: 'daily_logs', field: 'sleep_quality' }
      : undefined,
    lastUpdated: inputs.sleepQuality !== undefined ? now : undefined,
    category: 'Sleep',
    score: calculateSexualHealthInputScore('Sleep Quality', inputs.sleepQuality),
  });

  // Sleep Hours
  metadata.push({
    name: 'Sleep Hours',
    value: inputs.sleepHours,
    unit: 'hours',
    source: inputs.sleepHours !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.sleepHours !== undefined
      ? { derivedFrom: ['device_context', 'daily_logs'] }
      : undefined,
    lastUpdated: inputs.sleepHours !== undefined ? now : undefined,
    category: 'Sleep',
    score: calculateSexualHealthInputScore('Sleep Hours', inputs.sleepHours),
  });

  // Recovery Score
  metadata.push({
    name: 'Recovery Score',
    value: inputs.recoveryScore,
    unit: 'score (0-100)',
    source: inputs.recoveryScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.recoveryScore !== undefined
      ? { derivedFrom: ['recovery_engine'] }
      : undefined,
    lastUpdated: inputs.recoveryScore !== undefined ? now : undefined,
    category: 'Wellness',
    score: calculateSexualHealthInputScore('Recovery Score', inputs.recoveryScore),
  });

  // Stress Score
  metadata.push({
    name: 'Stress Score',
    value: inputs.stressScore,
    unit: 'score (0-100)',
    source: inputs.stressScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.stressScore !== undefined
      ? { derivedFrom: ['stress_engine'] }
      : undefined,
    lastUpdated: inputs.stressScore !== undefined ? now : undefined,
    category: 'Wellness',
    score: calculateSexualHealthInputScore('Stress Score', inputs.stressScore),
  });

  // Cardiovascular Status
  metadata.push({
    name: 'Cardiovascular Status',
    value: inputs.cardiovascularStatus,
    unit: null,
    source: inputs.cardiovascularStatus !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.cardiovascularStatus !== undefined
      ? { derivedFrom: ['cardiovascular_engine'] }
      : undefined,
    lastUpdated: inputs.cardiovascularStatus !== undefined ? now : undefined,
    category: 'Health Scores',
  });

  // Metabolic Status
  metadata.push({
    name: 'Metabolic Status',
    value: inputs.metabolicStatus,
    unit: null,
    source: inputs.metabolicStatus !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.metabolicStatus !== undefined
      ? { derivedFrom: ['metabolic_engine'] }
      : undefined,
    lastUpdated: inputs.metabolicStatus !== undefined ? now : undefined,
    category: 'Health Scores',
  });

  // Fatigue Score
  metadata.push({
    name: 'Fatigue Score',
    value: inputs.fatigueScore,
    unit: 'scale (0-10)',
    source: inputs.fatigueScore !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.fatigueScore !== undefined
      ? { table: 'daily_logs', field: 'fatigue_level' }
      : undefined,
    lastUpdated: inputs.fatigueScore !== undefined ? now : undefined,
    category: 'Wellness',
    score: calculateSexualHealthInputScore('Fatigue Score', inputs.fatigueScore),
  });

  // Heart Rate Variability
  metadata.push({
    name: 'Heart Rate Variability',
    value: inputs.hrv,
    unit: 'ms',
    source: inputs.hrv !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.hrv !== undefined
      ? { integration: 'wearable_device' }
      : undefined,
    lastUpdated: inputs.hrv !== undefined ? now : undefined,
    category: 'Vitals',
    score: calculateSexualHealthInputScore('Heart Rate Variability', inputs.hrv),
  });

  // Adherence Score
  metadata.push({
    name: 'Adherence Score',
    value: inputs.adherenceScore,
    unit: 'score (0-100)',
    source: inputs.adherenceScore !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.adherenceScore !== undefined
      ? { derivedFrom: ['adherence_engine'] }
      : undefined,
    lastUpdated: inputs.adherenceScore !== undefined ? now : undefined,
    category: 'Adherence',
    score: calculateSexualHealthInputScore('Adherence Score', inputs.adherenceScore),
  });

  // Testosterone (legacy/duplicate field)
  if (inputs.testosterone !== undefined && inputs.testosterone !== inputs.totalTestosterone) {
    metadata.push({
      name: 'Testosterone (Legacy)',
      value: inputs.testosterone,
      unit: 'ng/dL',
      source: 'DERIVED',
      sourceDetails: { derivedFrom: ['legacy_field'] },
      lastUpdated: now,
      category: 'Lab Results',
      score: calculateSexualHealthInputScore('Total Testosterone', inputs.testosterone, inputs.age),
    });
  }

  // Resting Heart Rate
  metadata.push({
    name: 'Resting Heart Rate',
    value: inputs.restingHeartRate,
    unit: 'bpm',
    source: inputs.restingHeartRate !== undefined ? 'ACTUAL' : 'NOT_AVAILABLE',
    sourceDetails: inputs.restingHeartRate !== undefined
      ? { integration: 'wearable_device' }
      : undefined,
    lastUpdated: inputs.restingHeartRate !== undefined ? now : undefined,
    category: 'Vitals',
    score: calculateSexualHealthInputScore('Resting Heart Rate', inputs.restingHeartRate),
  });

  // Testosterone Trend
  metadata.push({
    name: 'Testosterone Trend',
    value: inputs.testosteroneTrend?.trend_direction,
    unit: null,
    source: inputs.testosteroneTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.testosteroneTrend !== undefined
      ? { derivedFrom: ['bloodwork_history'], formula: 'trend_analysis' }
      : undefined,
    lastUpdated: inputs.testosteroneTrend !== undefined ? now : undefined,
    category: 'Trends',
  });

  // Free Testosterone Trend
  metadata.push({
    name: 'Free Testosterone Trend',
    value: inputs.freeTestosteroneTrend?.trend_direction,
    unit: null,
    source: inputs.freeTestosteroneTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.freeTestosteroneTrend !== undefined
      ? { derivedFrom: ['bloodwork_history'], formula: 'trend_analysis' }
      : undefined,
    lastUpdated: inputs.freeTestosteroneTrend !== undefined ? now : undefined,
    category: 'Trends',
  });

  // Estradiol Trend
  metadata.push({
    name: 'Estradiol Trend',
    value: inputs.estradiolTrend?.trend_direction,
    unit: null,
    source: inputs.estradiolTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.estradiolTrend !== undefined
      ? { derivedFrom: ['bloodwork_history'], formula: 'trend_analysis' }
      : undefined,
    lastUpdated: inputs.estradiolTrend !== undefined ? now : undefined,
    category: 'Trends',
  });

  // SHBG Trend
  metadata.push({
    name: 'SHBG Trend',
    value: inputs.shbgTrend?.trend_direction,
    unit: null,
    source: inputs.shbgTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.shbgTrend !== undefined
      ? { derivedFrom: ['bloodwork_history'], formula: 'trend_analysis' }
      : undefined,
    lastUpdated: inputs.shbgTrend !== undefined ? now : undefined,
    category: 'Trends',
  });

  return metadata;
};

/**
 * Fetch historical bloodwork values for a specific marker
 * Limited to 10 most recent data points for performance
 */
async function getMarkerHistory(
  userId: string,
  markerName: string
): Promise<Array<{ date: string; value: number | string }>> {
  try {
    const { data: scans, error } = await supabase
      .from('bloodwork_scans')
      .select('test_date, parsed_data')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(10);

    if (error) {
      logger.warn('[SEXUAL HEALTH V3] Failed to fetch bloodwork history', {
        userId,
        markerName,
        error: error.message,
      });
      return [];
    }

    if (!scans || scans.length === 0) {
      return [];
    }

    const history: Array<{ date: string; value: number | string }> = [];

    for (const scan of scans) {
      if (!scan.parsed_data?.markers) continue;

      const marker = scan.parsed_data.markers.find(
        (m: any) => m.name.toLowerCase() === markerName.toLowerCase()
      );

      if (marker && marker.value !== null && marker.value !== undefined) {
        history.push({
          date: scan.test_date,
          value: typeof marker.value === 'number' ? marker.value : parseFloat(marker.value),
        });
      }
    }

    // Sort chronologically (oldest to newest)
    return history.reverse();
  } catch (error) {
    logger.error('[SEXUAL HEALTH V3] Error fetching marker history', {
      userId,
      markerName,
      error: (error as Error).message,
    });
    return [];
  }
}

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const sexualHealthRecordStoreV3 = new Map<string, SexualHealthRecordV3[]>();

/**
 * Clear all sexual health V3 cache
 */
export function clearSexualHealthCacheV3(): void {
  sexualHealthRecordStoreV3.clear();
  logger.info('🗑️ [SEXUAL HEALTH V3 ENGINE] All cache cleared');
}

// ============================================================================
// LEGACY CALCULATION HELPERS (Preserved from V1 for backward compatibility)
// ============================================================================

function analyzeTestosteroneMetrics(
  totalTestosterone: number | undefined,
  freeTestosterone: number | undefined,
  age: number
): { metrics: TestosteroneMetrics; scoreComponent: ScoreComponent } {
  const max = 40;
  let score = 0;
  const hasData = totalTestosterone !== undefined || freeTestosterone !== undefined;

  const optimalMin = age < 40 ? 600 : age < 50 ? 500 : 400;
  const normalMin = age < 40 ? 400 : age < 50 ? 350 : 300;
  const lowMin = age < 40 ? 250 : age < 50 ? 230 : 200;

  let testosteroneStatus: 'optimal' | 'normal' | 'low' | 'very_low';

  if (totalTestosterone !== undefined) {
    if (totalTestosterone >= optimalMin) {
      testosteroneStatus = 'optimal';
      score = 40;
    } else if (totalTestosterone >= normalMin) {
      testosteroneStatus = 'normal';
      score = 30;
    } else if (totalTestosterone >= lowMin) {
      testosteroneStatus = 'low';
      score = 20;
    } else {
      testosteroneStatus = 'very_low';
      score = 10;
    }
  } else {
    testosteroneStatus = 'normal';
    score = 28; // 70% of 40
  }

  return {
    metrics: {
      totalTestosterone,
      freeTestosterone,
      testosteroneStatus,
    },
    scoreComponent: {
      score: hasData ? score : 28,
      max,
      percentage: Math.round((score / max) * 100),
      hasData,
    },
  };
}

function analyzeLibidoMetrics(
  libidoSelfRating: number | undefined,
  stressLevel: number | undefined,
  sleepQuality: number | undefined
): { metrics: LibidoMetrics; scoreComponent: ScoreComponent } {
  const max = 30;
  let score = 0;
  const hasData = libidoSelfRating !== undefined;

  if (libidoSelfRating !== undefined) {
    score = libidoSelfRating * 6; // Scale 1-5 to 6-30 range
  } else {
    score = 21; // 70% of 30
  }

  if (stressLevel !== undefined && stressLevel >= 4) {
    score -= 4.5; // 15% penalty
  }

  if (sleepQuality !== undefined && sleepQuality <= 2) {
    score -= 3; // 10% penalty
  }

  score = Math.max(0, Math.min(max, score));

  let libidoLevel: LibidoLevel;
  if (score >= 24) libidoLevel = 'high';
  else if (score >= 18) libidoLevel = 'normal';
  else if (score >= 12) libidoLevel = 'reduced';
  else libidoLevel = 'low';

  const libidoScore = Math.round((score / max) * 100);

  return {
    metrics: {
      libidoScore,
      libidoLevel,
    },
    scoreComponent: {
      score: Math.round(score * 10) / 10,
      max,
      percentage: Math.round((score / max) * 100),
      hasData,
    },
  };
}

function analyzeErectileMetrics(
  erectileFunctionRating: number | undefined,
  morningErectionsFrequency: number | undefined,
  age: number
): { metrics: ErectileMetrics; scoreComponent: ScoreComponent } {
  const max = 30;
  let score = 0;
  const hasData = erectileFunctionRating !== undefined;

  if (erectileFunctionRating !== undefined) {
    score = erectileFunctionRating * 6; // Scale 1-5 to 6-30 range
  } else {
    score = 21; // 70% of 30
  }

  if (morningErectionsFrequency !== undefined && morningErectionsFrequency <= 2) {
    score -= 4.5; // 15% penalty
  }

  if (age > 50) {
    score -= 1.5; // 5% penalty
  }

  score = Math.max(0, Math.min(max, score));

  let erectilePerformance: ErectilePerformance;
  if (score >= 24) erectilePerformance = 'excellent';
  else if (score >= 18) erectilePerformance = 'good';
  else if (score >= 12) erectilePerformance = 'fair';
  else erectilePerformance = 'poor';

  let morningErections: 'frequent' | 'occasional' | 'rare' | 'none' | undefined;
  if (morningErectionsFrequency !== undefined) {
    if (morningErectionsFrequency >= 5) morningErections = 'frequent';
    else if (morningErectionsFrequency >= 3) morningErections = 'occasional';
    else if (morningErectionsFrequency >= 1) morningErections = 'rare';
    else morningErections = 'none';
  }

  const erectileScore = Math.round((score / max) * 100);

  return {
    metrics: {
      erectileScore,
      erectilePerformance,
      morningErections,
    },
    scoreComponent: {
      score: Math.round(score * 10) / 10,
      max,
      percentage: Math.round((score / max) * 100),
      hasData,
    },
  };
}

function calculateSexualHealthScore(
  testosteroneMetrics: TestosteroneMetrics,
  libidoMetrics: LibidoMetrics,
  erectileMetrics: ErectileMetrics
): number {
  const testosteroneWeight = 0.4;
  const libidoWeight = 0.3;
  const erectileWeight = 0.3;

  let testosteroneScore = 70;
  if (testosteroneMetrics.testosteroneStatus === 'optimal') testosteroneScore = 90;
  else if (testosteroneMetrics.testosteroneStatus === 'normal') testosteroneScore = 75;
  else if (testosteroneMetrics.testosteroneStatus === 'low') testosteroneScore = 50;
  else if (testosteroneMetrics.testosteroneStatus === 'very_low') testosteroneScore = 30;

  const weightedScore =
    testosteroneScore * testosteroneWeight +
    libidoMetrics.libidoScore * libidoWeight +
    erectileMetrics.erectileScore * erectileWeight;

  return Math.round(weightedScore);
}

/**
 * Calculate Weighted Sexual Health Score (100 points max)
 * Aggregates all category scores into overall sexual health score
 * Only includes categories that have data
 */
function calculateWeightedSexualHealthScore(
  testosteroneResult: { metrics: TestosteroneMetrics; scoreComponent: ScoreComponent },
  libidoResult: { metrics: LibidoMetrics; scoreComponent: ScoreComponent },
  erectileResult: { metrics: ErectileMetrics; scoreComponent: ScoreComponent }
): { score: number; breakdown: SexualHealthScoreBreakdown } {
  let total = 0;
  let maxTotal = 0;

  // Always include all categories in total score calculation
  // Categories provide calculated/default scores even without raw user input
  total += testosteroneResult.scoreComponent.score;
  maxTotal += testosteroneResult.scoreComponent.max;

  total += libidoResult.scoreComponent.score;
  maxTotal += libidoResult.scoreComponent.max;

  total += erectileResult.scoreComponent.score;
  maxTotal += erectileResult.scoreComponent.max;

  if (maxTotal === 0) {
    total = 70;
    maxTotal = 100;
  }

  const percentage = Math.round((total / maxTotal) * 100);

  return {
    score: Math.round(total),
    breakdown: {
      testosterone: {
        score: Math.round(testosteroneResult.scoreComponent.score * 10) / 10,
        max: testosteroneResult.scoreComponent.max,
        percentage: Math.round((testosteroneResult.scoreComponent.score / testosteroneResult.scoreComponent.max) * 100),
        hasData: testosteroneResult.scoreComponent.hasData,
      },
      libido: {
        score: Math.round(libidoResult.scoreComponent.score * 10) / 10,
        max: libidoResult.scoreComponent.max,
        percentage: Math.round((libidoResult.scoreComponent.score / libidoResult.scoreComponent.max) * 100),
        hasData: libidoResult.scoreComponent.hasData,
      },
      erectileFunction: {
        score: Math.round(erectileResult.scoreComponent.score * 10) / 10,
        max: erectileResult.scoreComponent.max,
        percentage: Math.round((erectileResult.scoreComponent.score / erectileResult.scoreComponent.max) * 100),
        hasData: erectileResult.scoreComponent.hasData,
      },
      total: Math.round(total),
      maxTotal,
      percentage,
    },
  };
}

function determineHormonalRisk(
  testosteroneMetrics: TestosteroneMetrics,
  age: number
): HormonalRiskLevel {
  if (testosteroneMetrics.testosteroneStatus === 'very_low') return 'high';
  if (testosteroneMetrics.testosteroneStatus === 'low') return 'moderate';
  if (age > 50 && testosteroneMetrics.testosteroneStatus === 'normal') return 'moderate';
  return 'low';
}

// ============================================================================
// V2/V3: TREND-AWARE STATUS DETERMINATION
// ============================================================================

export function determineSexualHealthStatusV3(
  inputs: SexualHealthInputsV3,
  testosteroneMetrics: TestosteroneMetrics
): SexualHealthStatus {
  const { recoveryScore, stressScore, cardiovascularStatus, metabolicStatus, sleepHours, fatigueScore } = inputs;
  const { testosteroneTrend, freeTestosteroneTrend } = inputs;

  let riskSignals = 0;

  if (recoveryScore != null && recoveryScore <= 30) riskSignals += 3;
  if (stressScore != null && stressScore >= 80) riskSignals += 3;
  if (cardiovascularStatus === 'high_risk' || cardiovascularStatus === 'elevated_risk') riskSignals += 2;
  if (metabolicStatus === 'high_risk' || metabolicStatus === 'elevated_risk') riskSignals += 2;
  if (sleepHours != null && sleepHours < 5) riskSignals += 2;
  if (fatigueScore != null && fatigueScore >= 80) riskSignals += 2;

  if (testosteroneTrend?.trend_direction === 'worsening') {
    if (testosteroneTrend.percent_change && testosteroneTrend.percent_change > 10) {
      riskSignals += 2;
    }
  }
  if (freeTestosteroneTrend?.trend_direction === 'worsening') {
    if (freeTestosteroneTrend.percent_change && freeTestosteroneTrend.percent_change > 10) {
      riskSignals += 2;
    }
  }

  if (riskSignals >= 6) return 'high_risk';

  if (
    (recoveryScore != null && recoveryScore <= 50) ||
    (stressScore != null && stressScore >= 70) ||
    (sleepHours != null && sleepHours < 6) ||
    (fatigueScore != null && fatigueScore >= 70) ||
    riskSignals >= 3
  ) {
    return 'reduced';
  }

  if (
    (recoveryScore != null && recoveryScore <= 70) ||
    (stressScore != null && stressScore >= 50) ||
    (sleepHours != null && sleepHours < 7) ||
    (fatigueScore != null && fatigueScore >= 50) ||
    riskSignals >= 1
  ) {
    return 'moderate';
  }

  return 'optimal';
}

// ============================================================================
// V3: ENHANCED EVIDENCE BUILDER WITH RAW VALUES
// ============================================================================

/**
 * Build sexual health evidence with trend signals AND raw values
 * NEW in V3: Adds rawValue and rawUnit to trend signals, plus absolute value signals, plus historical data
 */
export async function buildSexualHealthEvidenceV3(
  inputs: SexualHealthInputsV3,
  status: SexualHealthStatus,
  userId: string,
  bloodwork?: any
): Promise<SexualHealthEvidenceV3> {
  logger.info('📊 [SEXUAL HEALTH V3] Building evidence with raw values and trend analysis');

  const signals: SexualHealthEvidenceSignalV3[] = [];
  const trendMetadata: SexualHealthEvidenceV3['trendMetadata'] = {};

  // Non-hormonal signals (same as V2)
  if (inputs.recoveryScore != null) {
    const interpretation = inputs.recoveryScore >= 70
      ? 'Good recovery'
      : inputs.recoveryScore >= 50
      ? 'Moderate recovery'
      : 'Poor recovery - may reduce hormonal readiness';
    
    signals.push({
      name: 'Recovery Score',
      value: inputs.recoveryScore,
      interpretation,
    });
  }

  if (inputs.stressScore != null) {
    const interpretation = inputs.stressScore < 50
      ? 'Low stress'
      : inputs.stressScore < 70
      ? 'Moderate stress'
      : 'High stress - may reduce hormonal readiness';
    
    signals.push({
      name: 'Stress Score',
      value: inputs.stressScore,
      interpretation,
    });
  }

  if (inputs.cardiovascularStatus) {
    signals.push({
      name: 'Cardiovascular Status',
      value: inputs.cardiovascularStatus,
      interpretation: inputs.cardiovascularStatus === 'optimal' ? 'Optimal cardiovascular health' : 'Cardiovascular concerns may impact sexual health',
    });
  }

  if (inputs.metabolicStatus) {
    signals.push({
      name: 'Metabolic Status',
      value: inputs.metabolicStatus,
      interpretation: inputs.metabolicStatus === 'optimal' ? 'Optimal metabolic health' : 'Metabolic concerns may impact hormonal health',
    });
  }

  if (inputs.sleepHours != null) {
    const interpretation = inputs.sleepHours >= 7
      ? 'Adequate sleep'
      : inputs.sleepHours >= 6
      ? 'Moderate sleep'
      : 'Poor sleep - may reduce hormonal production';
    
    signals.push({
      name: 'Sleep Hours',
      value: inputs.sleepHours,
      interpretation,
    });
  }

  if (inputs.fatigueScore != null) {
    const interpretation = inputs.fatigueScore < 50
      ? 'Low fatigue'
      : inputs.fatigueScore < 70
      ? 'Moderate fatigue'
      : 'High fatigue - may reduce sexual readiness';
    
    signals.push({
      name: 'Fatigue Score',
      value: inputs.fatigueScore,
      interpretation,
    });
  }

  // NEW V3: Add absolute value signals for testosterone
  if (inputs.totalTestosterone != null) {
    let clinicalCategory: 'optimal' | 'borderline' | 'low' | 'high';
    let interpretation: string;
    const referenceRange = { min: 300, max: 1000 };
    
    if (inputs.totalTestosterone >= 300 && inputs.totalTestosterone <= 1000) {
      clinicalCategory = 'optimal';
      interpretation = 'Total testosterone in optimal range';
    } else if (inputs.totalTestosterone >= 250 && inputs.totalTestosterone < 300) {
      clinicalCategory = 'borderline';
      interpretation = 'Total testosterone borderline - monitor closely';
    } else if (inputs.totalTestosterone < 250) {
      clinicalCategory = 'low';
      interpretation = 'Total testosterone below optimal - consider intervention';
    } else {
      clinicalCategory = 'high';
      interpretation = 'Total testosterone elevated - investigate cause';
    }
    
    signals.push({
      name: 'Total Testosterone',
      value: inputs.totalTestosterone,
      rawValue: inputs.totalTestosterone,
      rawUnit: 'ng/dL',
      referenceRange,
      clinicalCategory,
      interpretation,
    });
  }

  if (inputs.freeTestosterone != null) {
    let clinicalCategory: 'optimal' | 'borderline' | 'low' | 'high';
    let interpretation: string;
    const referenceRange = { min: 9, max: 30 };
    
    if (inputs.freeTestosterone >= 9 && inputs.freeTestosterone <= 30) {
      clinicalCategory = 'optimal';
      interpretation = 'Free testosterone in optimal range';
    } else if (inputs.freeTestosterone >= 7 && inputs.freeTestosterone < 9) {
      clinicalCategory = 'borderline';
      interpretation = 'Free testosterone borderline - monitor closely';
    } else if (inputs.freeTestosterone < 7) {
      clinicalCategory = 'low';
      interpretation = 'Free testosterone below optimal - consider intervention';
    } else {
      clinicalCategory = 'high';
      interpretation = 'Free testosterone elevated - investigate cause';
    }
    
    signals.push({
      name: 'Free Testosterone',
      value: inputs.freeTestosterone,
      rawValue: inputs.freeTestosterone,
      rawUnit: 'ng/dL',
      referenceRange,
      clinicalCategory,
      interpretation,
    });
  }

  // V3: Enhanced trend signals with raw values and history
  if (inputs.testosteroneTrend) {
    const trend = inputs.testosteroneTrend;
    const interpretation = trend.trend_direction === 'improving'
      ? `Testosterone improving ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'worsening'
      ? `Testosterone declining ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests - early warning`
      : trend.trend_direction === 'stable'
      ? `Testosterone stable over ${trend.data_points} tests`
      : 'Insufficient data for trend analysis';

    const history = await getMarkerHistory(userId, 'Testosterone');

    signals.push({
      name: 'Testosterone Trend',
      value: trend.trend_direction,
      rawValue: trend.latest_value,
      rawUnit: trend.unit,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
      history: history.length > 0 ? history : undefined,
    });

    const firstDate = new Date(trend.first_test_date);
    const latestDate = new Date(trend.latest_test_date);
    const timespanDays = Math.floor((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    trendMetadata.testosterone = {
      direction: trend.trend_direction,
      percentChange: trend.percent_change,
      dataPoints: trend.data_points,
      timespanDays,
    };
  }

  if (inputs.freeTestosteroneTrend) {
    const trend = inputs.freeTestosteroneTrend;
    const interpretation = trend.trend_direction === 'improving'
      ? `Free testosterone improving ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'worsening'
      ? `Free testosterone declining ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'stable'
      ? `Free testosterone stable over ${trend.data_points} tests`
      : 'Insufficient data for trend analysis';

    const history = await getMarkerHistory(userId, 'Free Testosterone');

    signals.push({
      name: 'Free Testosterone Trend',
      value: trend.trend_direction,
      rawValue: trend.latest_value,
      rawUnit: trend.unit,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
      history: history.length > 0 ? history : undefined,
    });

    const firstDate = new Date(trend.first_test_date);
    const latestDate = new Date(trend.latest_test_date);
    const timespanDays = Math.floor((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    trendMetadata.freeTestosterone = {
      direction: trend.trend_direction,
      percentChange: trend.percent_change,
      dataPoints: trend.data_points,
      timespanDays,
    };
  }

  // NEW: Add estradiol trend signal with history
  if (inputs.estradiolTrend) {
    const trend = inputs.estradiolTrend;
    const interpretation = trend.trend_direction === 'improving'
      ? `Estradiol optimizing ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'worsening'
      ? `Estradiol concerning ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'stable'
      ? `Estradiol stable over ${trend.data_points} tests`
      : 'Insufficient data for trend analysis';

    const history = await getMarkerHistory(userId, 'Estradiol');

    signals.push({
      name: 'Estradiol Trend',
      value: trend.trend_direction,
      rawValue: trend.latest_value,
      rawUnit: trend.unit,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
      history: history.length > 0 ? history : undefined,
    });

    const firstDate = new Date(trend.first_test_date);
    const latestDate = new Date(trend.latest_test_date);
    const timespanDays = Math.floor((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    trendMetadata.estradiol = {
      direction: trend.trend_direction,
      percentChange: trend.percent_change,
      dataPoints: trend.data_points,
      timespanDays,
    };
  }

  // NEW: Add SHBG trend signal with history
  if (inputs.shbgTrend) {
    const trend = inputs.shbgTrend;
    const interpretation = trend.trend_direction === 'improving'
      ? `SHBG optimizing ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'worsening'
      ? `SHBG concerning ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'stable'
      ? `SHBG stable over ${trend.data_points} tests`
      : 'Insufficient data for trend analysis';

    const history = await getMarkerHistory(userId, 'SHBG');

    signals.push({
      name: 'SHBG Trend',
      value: trend.trend_direction,
      rawValue: trend.latest_value,
      rawUnit: trend.unit,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
      history: history.length > 0 ? history : undefined,
    });

    const firstDate = new Date(trend.first_test_date);
    const latestDate = new Date(trend.latest_test_date);
    const timespanDays = Math.floor((latestDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    trendMetadata.shbg = {
      direction: trend.trend_direction,
      percentChange: trend.percent_change,
      dataPoints: trend.data_points,
      timespanDays,
    };
  }

  const absoluteSignalCount = signals.filter(s => s.name.includes('Total') || s.name.includes('Free Testosterone') && !s.name.includes('Trend')).length;
  const summary = `Sexual health status: ${status}. ${signals.length} signals analyzed (${Object.keys(trendMetadata).length} trend signals, ${absoluteSignalCount} absolute value signals).`;

  logger.info('✅ [SEXUAL HEALTH V3] Evidence built with raw values and trends', { 
    signalCount: signals.length, 
    status,
    trendCount: Object.keys(trendMetadata).length,
    absoluteSignalCount,
  });

  return {
    sexualHealthStatus: status,
    signals,
    summary,
    trendMetadata,
  };
}

export function buildSexualHealthFallbackRecommendation(status: SexualHealthStatus): SexualHealthRecommendation {
  logger.info('🔧 [SEXUAL HEALTH V3] Building fallback recommendation');

  let priority: 'critical' | 'important' | 'optimization';
  let summary: string;
  let actions: string[];

  switch (status) {
    case 'high_risk':
      priority = 'critical';
      summary = 'Sexual health readiness is significantly reduced';
      actions = [
        'Focus on recovery and stress reduction',
        'Reduce training load',
        'Improve sleep quality and duration',
        'Consider medical consultation for hormonal assessment',
        'Prioritize hydration and nutrition',
      ];
      break;

    case 'reduced':
      priority = 'important';
      summary = 'Sexual health readiness is reduced';
      actions = [
        'Reduce training strain',
        'Improve recovery practices',
        'Reduce stress through relaxation techniques',
        'Optimize sleep schedule',
        'Maintain hydration',
      ];
      break;

    case 'moderate':
      priority = 'optimization';
      summary = 'Sexual health readiness is moderate';
      actions = [
        'Maintain current recovery practices',
        'Monitor stress levels',
        'Ensure adequate sleep',
        'Continue balanced training',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Sexual health readiness is optimal';
      actions = [
        'Maintain current lifestyle practices',
        'Continue monitoring hormonal markers',
        'Sustain balanced training and recovery',
      ];
      break;
  }

  return {
    type: 'sexual_health',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}

export async function getSexualHealthRecommendationV3(
  userId: string,
  inputs: SexualHealthInputsV3
): Promise<SexualHealthRecordV3> {
  logger.info('🔵 [SEXUAL HEALTH V3] Starting sexual health recommendation flow with raw values', { userId });

  const baseline = await getBaselineFields(userId);
  logger.info('✅ [SEXUAL HEALTH V3] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    trtUsage: baseline.trtUsage,
    weight: baseline.weight,
  });

  const bloodwork = await getLatestBloodworkContext(userId);
  if (bloodwork.hasBloodwork) {
    logger.info('✅ [SEXUAL HEALTH V3] Bloodwork loaded', {
      userId,
      latestTestDate: bloodwork.latestTestDate,
      hasTotalTestosterone: !!bloodwork.markers.totalTestosterone,
      hasFreeTestosterone: !!bloodwork.markers.freeTestosterone,
    });

    if (!inputs.totalTestosterone && bloodwork.markers.totalTestosterone) {
      inputs.totalTestosterone = getMarkerValue(bloodwork.markers.totalTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH V3] Using total testosterone from bloodwork', { totalTestosterone: inputs.totalTestosterone });
    }
    if (!inputs.freeTestosterone && bloodwork.markers.freeTestosterone) {
      inputs.freeTestosterone = getMarkerValue(bloodwork.markers.freeTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH V3] Using free testosterone from bloodwork', { freeTestosterone: inputs.freeTestosterone });
    }
  } else {
    logger.info('⚠️ [SEXUAL HEALTH V3] No bloodwork available, using provided inputs only', { userId });
  }

  let trendData: GetBloodworkTrendsResponse | undefined;
  if (USE_TREND_ANALYSIS) {
    try {
      trendData = await getBloodworkTrendsByUser({
        user_id: userId,
        category: 'hormonal',
        min_data_points: 2,
      });

      if (trendData.success && trendData.data?.trends) {
        logger.info('✅ [SEXUAL HEALTH V3] Trends loaded', { 
          userId, 
          trendCount: trendData.data.trends.length 
        });
      }
    } catch (error) {
      logger.warn('⚠️ [SEXUAL HEALTH V3] Failed to load trends, continuing without', {
        userId,
        error: (error as Error).message,
      });
    }
  }

  if (trendData?.data?.trends) {
    const testosteroneTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('testosterone') && !t.marker_name.toLowerCase().includes('free'));
    const freeTestosteroneTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('free testosterone'));

    inputs.testosteroneTrend = testosteroneTrend || undefined;
    inputs.freeTestosteroneTrend = freeTestosteroneTrend || undefined;
  }

  const age = baseline.age ?? 35;
  const testosteroneResult = analyzeTestosteroneMetrics(
    inputs.totalTestosterone,
    inputs.freeTestosterone,
    age
  );
  const libidoResult = analyzeLibidoMetrics(
    inputs.libidoSelfRating,
    inputs.stressLevel,
    inputs.sleepQuality
  );
  const erectileResult = analyzeErectileMetrics(
    inputs.erectileFunctionRating,
    inputs.morningErectionsFrequency,
    age
  );
  const { score: sexualHealthScore, breakdown: scoreBreakdown } = calculateWeightedSexualHealthScore(
    testosteroneResult,
    libidoResult,
    erectileResult
  );

  const sexualHealthStatus = determineSexualHealthStatusV3(inputs, testosteroneResult.metrics);
  logger.info('📊 [SEXUAL HEALTH V3] Status determined', { sexualHealthStatus });

  const evidence = await buildSexualHealthEvidenceV3(inputs, sexualHealthStatus, userId, bloodwork);

  const fallbackRecommendation = buildSexualHealthFallbackRecommendation(sexualHealthStatus);

  let recommendation: SexualHealthRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [SEXUAL HEALTH V3] AI enrichment enabled');
    const evidenceV1 = {
      sexualHealthStatus: evidence.sexualHealthStatus,
      signals: evidence.signals.map(s => ({
        name: s.name,
        value: s.value,
        interpretation: s.interpretation,
      })),
      summary: evidence.summary,
    };
    recommendation = await enrichSexualHealthRecommendation(evidenceV1, fallbackRecommendation);
  } else {
    logger.info('🔧 [SEXUAL HEALTH V3] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  recommendation = normalizeSexualHealthRecommendation(recommendation);

  const isValid = validateSexualHealthRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [SEXUAL HEALTH V3] Validation failed, using fallback');
    recommendation = fallbackRecommendation;
  }
  logger.info('✅ [SEXUAL HEALTH V3] Validation passed');

  // Build detailed input metadata (if feature flag enabled)
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS) {
    detailedInputs = buildSexualHealthInputMetadata(inputs, bloodwork);
    logger.info('✅ [SEXUAL HEALTH V3] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  const record: SexualHealthRecordV3 = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    sexualHealthScore,
    testosteroneMetrics: testosteroneResult.metrics,
    libidoMetrics: libidoResult.metrics,
    erectileMetrics: erectileResult.metrics,
    hormonalRisk: determineHormonalRisk(testosteroneResult.metrics, age),
    inputs,
    sexualHealthStatus,
    evidence,
    recommendation,
    trendMetadata: evidence.trendMetadata,
    createdAt: new Date().toISOString(),
    scoreBreakdown,
    ...(detailedInputs && { detailedInputs }),
  };

  const userRecords = sexualHealthRecordStoreV3.get(userId) ?? [];
  sexualHealthRecordStoreV3.set(userId, [record, ...userRecords]);

  try {
    await createRecommendation({
      userId,
      request: {
        sourceEngine: 'sexual_health',
        title: recommendation.summary,
        description: recommendation.actions.join('. '),
        rationale: recommendation.rationale,
        priority: recommendation.priority,
        category: 'health_monitoring',
        confidenceLevel: recommendation.source === 'ai_enriched' ? 'high' : 'medium',
        actionType: 'monitor',
        actionTarget: 'sexual_health',
      },
    });
    logger.info('✅ [SEXUAL HEALTH V3] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V3] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [SEXUAL HEALTH V3] Sexual health recommendation complete with raw values', {
    userId,
    sexualHealthStatus,
    priority: recommendation.priority,
    source: recommendation.source,
    hasTrends: !!evidence.trendMetadata,
    hasRawValues: evidence.signals.some(s => s.rawValue !== undefined),
  });

  return record;
}

export async function getSexualHealthTodayV3(userId: string): Promise<SexualHealthRecordV3 | null> {
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = sexualHealthRecordStoreV3.get(userId) ?? [];
  const existing = userRecords.find(record => record.date === today);

  if (existing) {
    logger.info('📋 [SEXUAL HEALTH V3] Returning cached record', { userId, date: today });
    return existing;
  }

  logger.info('🔵 [SEXUAL HEALTH V3] No cached record, generating new', { userId, date: today });
  const inputs: SexualHealthInputsV3 = {};
  return getSexualHealthRecommendationV3(userId, inputs);
}

export async function getSexualHealthHistoryV3(userId: string): Promise<SexualHealthRecordV3[]> {
  return sexualHealthRecordStoreV3.get(userId) ?? [];
}

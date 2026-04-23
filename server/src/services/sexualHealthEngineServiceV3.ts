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
} from '../types/sexualHealthEngineV3';
import type { BloodworkTrend, GetBloodworkTrendsResponse } from '../types/bloodworkTrends';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_SEXUAL_HEALTH === 'true';
const USE_TREND_ANALYSIS = process.env.USE_TREND_ANALYSIS_SEXUAL_HEALTH === 'true';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// LEGACY CALCULATION HELPERS (Preserved from V1 for backward compatibility)
// ============================================================================

function analyzeTestosteroneMetrics(
  totalTestosterone: number | undefined,
  freeTestosterone: number | undefined,
  age: number
): TestosteroneMetrics {
  let testosteroneStatus: 'optimal' | 'normal' | 'low' | 'very_low';

  const optimalMin = age < 40 ? 600 : age < 50 ? 500 : 400;
  const normalMin = age < 40 ? 400 : age < 50 ? 350 : 300;
  const lowMin = age < 40 ? 250 : age < 50 ? 230 : 200;

  if (totalTestosterone !== undefined) {
    if (totalTestosterone >= optimalMin) testosteroneStatus = 'optimal';
    else if (totalTestosterone >= normalMin) testosteroneStatus = 'normal';
    else if (totalTestosterone >= lowMin) testosteroneStatus = 'low';
    else testosteroneStatus = 'very_low';
  } else {
    testosteroneStatus = 'normal';
  }

  return {
    totalTestosterone,
    freeTestosterone,
    testosteroneStatus,
  };
}

function analyzeLibidoMetrics(
  libidoSelfRating: number | undefined,
  stressLevel: number | undefined,
  sleepQuality: number | undefined
): LibidoMetrics {
  let libidoScore = 70;
  let libidoLevel: LibidoLevel;

  if (libidoSelfRating !== undefined) {
    libidoScore = libidoSelfRating * 10;
  }

  if (stressLevel !== undefined && stressLevel >= 4) {
    libidoScore -= 15;
  }

  if (sleepQuality !== undefined && sleepQuality <= 2) {
    libidoScore -= 10;
  }

  if (libidoScore >= 80) libidoLevel = 'high';
  else if (libidoScore >= 60) libidoLevel = 'normal';
  else if (libidoScore >= 40) libidoLevel = 'reduced';
  else libidoLevel = 'low';

  return {
    libidoScore,
    libidoLevel,
  };
}

function analyzeErectileMetrics(
  erectileFunctionRating: number | undefined,
  morningErectionsFrequency: number | undefined,
  age: number
): ErectileMetrics {
  let erectileScore = 70;
  let erectilePerformance: ErectilePerformance;

  if (erectileFunctionRating !== undefined) {
    erectileScore = erectileFunctionRating * 10;
  }

  if (morningErectionsFrequency !== undefined && morningErectionsFrequency <= 2) {
    erectileScore -= 15;
  }

  if (age > 50) {
    erectileScore -= 5;
  }

  if (erectileScore >= 80) erectilePerformance = 'excellent';
  else if (erectileScore >= 60) erectilePerformance = 'good';
  else if (erectileScore >= 40) erectilePerformance = 'fair';
  else erectilePerformance = 'poor';

  return {
    erectileScore,
    erectilePerformance,
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
  const testosteroneMetrics = analyzeTestosteroneMetrics(
    inputs.totalTestosterone,
    inputs.freeTestosterone,
    age
  );
  const libidoMetrics = analyzeLibidoMetrics(
    inputs.libidoSelfRating,
    inputs.stressLevel,
    inputs.sleepQuality
  );
  const erectileMetrics = analyzeErectileMetrics(
    inputs.erectileFunctionRating,
    inputs.morningErectionsFrequency,
    age
  );
  const sexualHealthScore = calculateSexualHealthScore(
    testosteroneMetrics,
    libidoMetrics,
    erectileMetrics
  );

  const sexualHealthStatus = determineSexualHealthStatusV3(inputs, testosteroneMetrics);
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
    recommendation = normalizeSexualHealthRecommendation(fallbackRecommendation);
  }

  const record: SexualHealthRecordV3 = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    sexualHealthScore,
    testosteroneMetrics,
    libidoMetrics,
    erectileMetrics,
    hormonalRisk: determineHormonalRisk(testosteroneMetrics, age),
    inputs,
    sexualHealthStatus,
    evidence,
    recommendation,
    trendMetadata: evidence.trendMetadata,
    createdAt: new Date().toISOString(),
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

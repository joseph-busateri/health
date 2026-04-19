/**
 * Sexual Health Engine Service V2
 * AI-enriched sexual health intelligence with trend analysis
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → Trend Enrichment → AI Enrichment → Normalizer → Validator → Persistence
 * 
 * Extends V1 with:
 * - Bloodwork trend analysis integration
 * - Trend-aware status determination
 * - Trend-aware recommendation generation
 * - Graceful fallback to V1 behavior when trends unavailable
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { enrichSexualHealthRecommendation } from './sexualHealthAIEnrichment';
import { normalizeSexualHealthRecommendation } from './sexualHealthRecommendationNormalizer';
import { validateSexualHealthRecommendation } from './sexualHealthRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import { getBloodworkTrendsByUser } from './bloodworkTrendService';
import { sexualHealthMetrics, METRIC_NAMES } from '../utils/sexualHealthMetrics';
import { trendServiceCircuitBreaker } from '../utils/circuitBreaker';
import { getCachedTrendData, setCachedTrendData } from './cacheManager';
import { alertTrendServiceFailure, alertTrendServiceCircuitOpen, alertHighLatency } from '../utils/alerting';
import type {
  SexualHealthRecordV2,
  SexualHealthInputsV2,
  SexualHealthEvidenceV2,
  SexualHealthEvidenceSignalV2,
  SexualHealthStatus,
  SexualHealthRecommendation,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
} from '../types/sexualHealthEngineV2';
import type { BloodworkTrend, GetBloodworkTrendsResponse } from '../types/bloodworkTrends';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_SEXUAL_HEALTH === 'true';
const USE_TREND_ANALYSIS = process.env.USE_TREND_ANALYSIS_SEXUAL_HEALTH === 'true';

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const sexualHealthRecordStoreV2 = new Map<string, SexualHealthRecordV2[]>();

// ============================================================================
// LEGACY CALCULATION HELPERS (Preserved from V1 for backward compatibility)
// ============================================================================

/**
 * Analyze testosterone metrics
 */
function analyzeTestosteroneMetrics(
  totalTestosterone: number | undefined,
  freeTestosterone: number | undefined,
  age: number
): TestosteroneMetrics {
  let testosteroneStatus: 'optimal' | 'normal' | 'low' | 'very_low';

  // Age-adjusted testosterone ranges (ng/dL)
  const optimalMin = age < 40 ? 600 : age < 50 ? 500 : 400;
  const normalMin = age < 40 ? 400 : age < 50 ? 350 : 300;
  const lowMin = age < 40 ? 250 : age < 50 ? 230 : 200;

  if (totalTestosterone !== undefined) {
    if (totalTestosterone >= optimalMin) testosteroneStatus = 'optimal';
    else if (totalTestosterone >= normalMin) testosteroneStatus = 'normal';
    else if (totalTestosterone >= lowMin) testosteroneStatus = 'low';
    else testosteroneStatus = 'very_low';
  } else {
    testosteroneStatus = 'normal'; // Unknown, assume normal
  }

  return {
    totalTestosterone,
    freeTestosterone,
    testosteroneStatus,
  };
}

/**
 * Analyze libido metrics
 */
function analyzeLibidoMetrics(
  libidoSelfRating: number | undefined,
  stressLevel: number | undefined,
  sleepQuality: number | undefined
): LibidoMetrics {
  let libidoScore = 70; // Default moderate
  let libidoLevel: LibidoLevel;

  if (libidoSelfRating !== undefined) {
    // Self-rating is 1-10 scale
    libidoScore = libidoSelfRating * 10;

    // Adjust for stress and sleep
    if (stressLevel !== undefined && stressLevel > 7) {
      libidoScore -= 15; // High stress reduces libido
    }
    if (sleepQuality !== undefined && sleepQuality < 3) {
      libidoScore -= 10; // Poor sleep reduces libido
    }

    libidoScore = Math.max(0, Math.min(100, libidoScore));
  }

  // Determine libido level
  if (libidoScore >= 80) libidoLevel = 'high';
  else if (libidoScore >= 60) libidoLevel = 'normal';
  else if (libidoScore >= 40) libidoLevel = 'reduced';
  else libidoLevel = 'low';

  return {
    libidoLevel,
    libidoScore,
    libidoTrend: 'stable', // TODO: Calculate from historical data
  };
}

/**
 * Analyze erectile metrics
 */
function analyzeErectileMetrics(
  erectileFunctionRating: number | undefined,
  morningErectionsFrequency: number | undefined,
  age: number
): ErectileMetrics {
  let erectileScore = 70; // Default moderate
  let erectilePerformance: ErectilePerformance;
  let morningErections: 'frequent' | 'occasional' | 'rare' | 'none';

  if (erectileFunctionRating !== undefined) {
    // Self-rating is 1-10 scale
    erectileScore = erectileFunctionRating * 10;

    // Age adjustment (slight decline expected)
    if (age > 50) erectileScore = Math.max(erectileScore - 5, 0);
    if (age > 60) erectileScore = Math.max(erectileScore - 10, 0);
  }

  // Morning erections are a good indicator of vascular health
  if (morningErectionsFrequency !== undefined) {
    if (morningErectionsFrequency >= 5) {
      morningErections = 'frequent';
      erectileScore = Math.min(erectileScore + 10, 100);
    } else if (morningErectionsFrequency >= 3) {
      morningErections = 'occasional';
    } else if (morningErectionsFrequency >= 1) {
      morningErections = 'rare';
      erectileScore = Math.max(erectileScore - 10, 0);
    } else {
      morningErections = 'none';
      erectileScore = Math.max(erectileScore - 20, 0);
    }
  } else {
    morningErections = 'occasional'; // Unknown, assume moderate
  }

  // Determine erectile performance
  if (erectileScore >= 85) erectilePerformance = 'excellent';
  else if (erectileScore >= 70) erectilePerformance = 'good';
  else if (erectileScore >= 50) erectilePerformance = 'fair';
  else erectilePerformance = 'poor';

  return {
    erectilePerformance,
    erectileScore,
    morningErections,
  };
}

/**
 * Calculate sexual health score (0-100)
 */
function calculateSexualHealthScore(
  testosteroneMetrics: TestosteroneMetrics,
  libidoMetrics: LibidoMetrics,
  erectileMetrics: ErectileMetrics
): number {
  // Testosterone contribution (30%)
  const testosteroneScoreMap = {
    optimal: 100,
    normal: 80,
    low: 50,
    very_low: 20,
  };
  const testosteroneScore = testosteroneScoreMap[testosteroneMetrics.testosteroneStatus];

  // Libido contribution (35%)
  const libidoScore = libidoMetrics.libidoScore;

  // Erectile function contribution (35%)
  const erectileScore = erectileMetrics.erectileScore;

  return Math.round(
    (testosteroneScore * 0.3) +
    (libidoScore * 0.35) +
    (erectileScore * 0.35)
  );
}

// ============================================================================
// NEW V2: TREND-AWARE STATUS DETERMINATION
// ============================================================================

/**
 * Determine sexual health status with trend awareness
 * Extends V1 logic to consider trajectory, not just current values
 * Exported for unit testing
 */
export function determineSexualHealthStatusV2(
  inputs: SexualHealthInputsV2,
  testosteroneMetrics: TestosteroneMetrics
): SexualHealthStatus {
  const { recoveryScore, stressScore, cardiovascularStatus, metabolicStatus, sleepHours, fatigueScore } = inputs;
  const { testosteroneTrend, freeTestosteroneTrend } = inputs;

  let riskSignals = 0;

  // High Risk: Multiple severe signals
  if (recoveryScore != null && recoveryScore <= 30) riskSignals += 3;
  if (stressScore != null && stressScore >= 80) riskSignals += 3;
  if (cardiovascularStatus === 'high_risk' || cardiovascularStatus === 'elevated_risk') riskSignals += 2;
  if (metabolicStatus === 'high_risk' || metabolicStatus === 'elevated_risk') riskSignals += 2;
  if (sleepHours != null && sleepHours < 5) riskSignals += 2;
  if (fatigueScore != null && fatigueScore >= 80) riskSignals += 2;

  // NEW: Add trend signals
  if (testosteroneTrend?.trend_direction === 'worsening') {
    // Significant decline (>10%) adds risk
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

  // Reduced: Concerning signals
  if (
    (recoveryScore != null && recoveryScore <= 50) ||
    (stressScore != null && stressScore >= 70) ||
    (sleepHours != null && sleepHours < 6) ||
    (fatigueScore != null && fatigueScore >= 70) ||
    riskSignals >= 3
  ) {
    return 'reduced';
  }

  // Moderate: Mixed signals
  if (
    (recoveryScore != null && recoveryScore <= 70) ||
    (stressScore != null && stressScore >= 50) ||
    (sleepHours != null && sleepHours < 7) ||
    (fatigueScore != null && fatigueScore >= 50) ||
    riskSignals >= 1
  ) {
    return 'moderate';
  }

  // Optimal: Good recovery, low stress, good sleep, stable or improving trends
  return 'optimal';
}

// ============================================================================
// NEW V2: TREND-AWARE EVIDENCE BUILDER
// ============================================================================

/**
 * Build sexual health evidence with trend signals
 * Exported for unit testing
 */
export function buildSexualHealthEvidenceV2(
  inputs: SexualHealthInputsV2,
  status: SexualHealthStatus,
  bloodwork?: any
): SexualHealthEvidenceV2 {
  logger.info('📊 [SEXUAL HEALTH V2] Building evidence with trend analysis');

  const signals: SexualHealthEvidenceSignalV2[] = [];
  const trendMetadata: SexualHealthEvidenceV2['trendMetadata'] = {};

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

  // NEW: Add trend signals
  if (inputs.testosteroneTrend) {
    const trend = inputs.testosteroneTrend;
    const interpretation = trend.trend_direction === 'improving'
      ? `Testosterone improving ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests`
      : trend.trend_direction === 'worsening'
      ? `Testosterone declining ${trend.percent_change?.toFixed(1)}% over ${trend.data_points} tests - early warning`
      : trend.trend_direction === 'stable'
      ? `Testosterone stable over ${trend.data_points} tests`
      : 'Insufficient data for trend analysis';

    signals.push({
      name: 'Testosterone Trend',
      value: trend.trend_direction,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
    });

    // Add to metadata for quick access
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

    signals.push({
      name: 'Free Testosterone Trend',
      value: trend.trend_direction,
      interpretation,
      trendDirection: trend.trend_direction,
      trendPercentChange: trend.percent_change,
      trendDataPoints: trend.data_points,
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

  const summary = `Sexual health status: ${status}. ${signals.length} signals analyzed (${Object.keys(trendMetadata).length} trend signals).`;

  logger.info('✅ [SEXUAL HEALTH V2] Evidence built with trends', { 
    signalCount: signals.length, 
    status,
    trendCount: Object.keys(trendMetadata).length,
  });

  return {
    sexualHealthStatus: status,
    signals,
    summary,
    trendMetadata,
  };
}

/**
 * Build fallback sexual health recommendation (same as V1)
 * Exported for unit testing
 */
export function buildSexualHealthFallbackRecommendation(status: SexualHealthStatus): SexualHealthRecommendation {
  logger.info('🔧 [SEXUAL HEALTH V2] Building fallback recommendation');

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
      priority = 'important';
      summary = 'Sexual health readiness shows mixed signals';
      actions = [
        'Reduce fatigue through better recovery',
        'Improve sleep quality',
        'Hydration optimization',
        'Monitor stress levels',
      ];
      break;

    case 'optimal':
    default:
      priority = 'optimization';
      summary = 'Sexual health readiness is optimal';
      actions = [
        'Maintain recovery practices',
        'Continue training balance',
        'Maintain hydration and nutrition',
      ];
      break;
  }

  logger.info('✅ [SEXUAL HEALTH V2] Fallback recommendation built', { priority, status });

  return {
    type: 'sexual_health',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}

/**
 * Determine hormonal risk level (same as V1)
 */
function determineHormonalRisk(
  testosteroneMetrics: TestosteroneMetrics,
  age: number
): HormonalRiskLevel {
  if (testosteroneMetrics.testosteroneStatus === 'very_low') return 'high';
  if (testosteroneMetrics.testosteroneStatus === 'low') return 'moderate';
  
  // Age-related risk
  if (age > 60 && testosteroneMetrics.testosteroneStatus === 'normal') return 'moderate';
  
  return 'low';
}

// ============================================================================
// MAIN ENGINE FLOW V2
// ============================================================================

/**
 * Load bloodwork trends for sexual health markers
 */
async function loadSexualHealthTrends(userId: string): Promise<{
  testosteroneTrend?: BloodworkTrend;
  freeTestosteroneTrend?: BloodworkTrend;
  estradiolTrend?: BloodworkTrend;
  shbgTrend?: BloodworkTrend;
}> {
  if (!USE_TREND_ANALYSIS) {
    logger.info('🔧 [SEXUAL HEALTH V2] Trend analysis disabled via feature flag');
    return {};
  }

  try {
    logger.info('🔵 [SEXUAL HEALTH V2] Loading bloodwork trends', { userId });

    const response: GetBloodworkTrendsResponse = await getBloodworkTrendsByUser({
      user_id: userId,
      category: 'hormonal',
      min_data_points: 2,
    });

    if (!response.success || !response.data?.trends) {
      logger.info('⚠️ [SEXUAL HEALTH V2] No trend data available', { 
        userId, 
        error: response.error 
      });
      return {};
    }

    const trends = response.data.trends;
    const trendMap = new Map<string, BloodworkTrend>();

    // Map trends by marker name
    for (const trend of trends) {
      const markerLower = trend.marker_name.toLowerCase();
      trendMap.set(markerLower, trend);
    }

    logger.info('✅ [SEXUAL HEALTH V2] Trends loaded', { 
      userId, 
      trendCount: trends.length 
    });

    return {
      testosteroneTrend: trendMap.get('testosterone') || trendMap.get('total testosterone'),
      freeTestosteroneTrend: trendMap.get('free testosterone'),
      estradiolTrend: trendMap.get('estradiol'),
      shbgTrend: trendMap.get('shbg') || trendMap.get('sex hormone binding globulin'),
    };
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V2] Failed to load trends', { 
      userId, 
      error: (error as Error).message 
    });
    // Graceful fallback - return empty trends
    return {};
  }
}

export async function getSexualHealthRecommendationV2(
  userId: string,
  inputs: SexualHealthInputsV2
): Promise<SexualHealthRecordV2> {
  logger.info('🔵 [SEXUAL HEALTH V2] Starting sexual health recommendation flow with trend analysis', { userId });

  // Step 0: Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [SEXUAL HEALTH V2] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    trtUsage: baseline.trtUsage,
    weight: baseline.weight,
  });

  // Step 0b: Load bloodwork for hormonal markers
  const bloodwork = await getLatestBloodworkContext(userId);
  if (bloodwork.hasBloodwork) {
    logger.info('✅ [SEXUAL HEALTH V2] Bloodwork loaded', {
      userId,
      latestTestDate: bloodwork.latestTestDate,
      hasTotalTestosterone: !!bloodwork.markers.totalTestosterone,
      hasFreeTestosterone: !!bloodwork.markers.freeTestosterone,
    });

    // Enrich inputs with hormonal markers from bloodwork (preserve user-provided values if present)
    if (!inputs.totalTestosterone && bloodwork.markers.totalTestosterone) {
      inputs.totalTestosterone = getMarkerValue(bloodwork.markers.totalTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH V2] Using total testosterone from bloodwork', { totalTestosterone: inputs.totalTestosterone });
    }
    if (!inputs.freeTestosterone && bloodwork.markers.freeTestosterone) {
      inputs.freeTestosterone = getMarkerValue(bloodwork.markers.freeTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH V2] Using free testosterone from bloodwork', { freeTestosterone: inputs.freeTestosterone });
    }
  } else {
    logger.info('⚠️ [SEXUAL HEALTH V2] No bloodwork available, using provided inputs only', { userId });
  }

  // Step 0c: Load bloodwork trends (NEW in V2)
  let trendData: GetBloodworkTrendsResponse | null = null;
  if (USE_TREND_ANALYSIS) {
    const trendServiceStart = Date.now();
    sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_SERVICE_CALLS_TOTAL);
    
    try {
      // Check cache first
      trendData = getCachedTrendData(userId, 'hormonal');
      
      if (trendData) {
        logger.info('📈 [SEXUAL HEALTH V2] Using cached trend data', { userId });
      } else {
        logger.info('📈 [SEXUAL HEALTH V2] Fetching bloodwork trends for trend analysis');
        
        // Wrap with circuit breaker
        trendData = await trendServiceCircuitBreaker.execute(async () => {
          return await getBloodworkTrendsByUser({
            user_id: userId,
            category: 'hormonal',
            min_data_points: 2,
          });
        });
        
        // Cache the result
        if (trendData) {
          setCachedTrendData(userId, trendData, 'hormonal');
        }
      }
      
      const trendServiceLatency = (Date.now() - trendServiceStart) / 1000;
      sexualHealthMetrics.record(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_SERVICE_LATENCY_SECONDS, trendServiceLatency);
      
      logger.info('📈 [SEXUAL HEALTH V2] Bloodwork trends fetched successfully', {
        userId,
        trendCount: trendData.data?.trends?.length || 0,
        latency: trendServiceLatency,
        circuitState: trendServiceCircuitBreaker.getState().state,
        cached: getCachedTrendData(userId, 'hormonal') !== null,
      });
      
      if (trendData.data?.trends && trendData.data.trends.length > 0) {
        sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_AVAILABLE_TOTAL);
      } else {
        sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_INSUFFICIENT_DATA_TOTAL);
      }
    } catch (error) {
      const trendServiceLatency = (Date.now() - trendServiceStart) / 1000;
      sexualHealthMetrics.record(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_SERVICE_LATENCY_SECONDS, trendServiceLatency);
      sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_TREND_SERVICE_ERRORS_TOTAL);
      
      const circuitState = trendServiceCircuitBreaker.getState().state;
      logger.error('❌ [SEXUAL HEALTH V2] Failed to fetch bloodwork trends', { 
        userId, 
        error: (error as Error).message,
        circuitState,
        isOpen: trendServiceCircuitBreaker.isOpen(),
      });
      
      // Send alert for trend service failure
      alertTrendServiceFailure(userId, error as Error, circuitState);
      
      // If circuit is open, send alert and log a warning
      if (trendServiceCircuitBreaker.isOpen()) {
        logger.warn('⚠️ [SEXUAL HEALTH V2] Circuit breaker is OPEN for trend service - skipping trend analysis');
        alertTrendServiceCircuitOpen(userId);
      }
      
      // Alert on high latency (>5 seconds)
      if (trendServiceLatency > 5) {
        alertHighLatency('sexual-health-v2', 'trend_service_fetch', trendServiceLatency * 1000, 5000);
      }
      
      // Continue without trend data - fallback to V1 behavior
    }
  }

  // Add trend data to inputs
  if (trendData?.data?.trends) {
    const testosteroneTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('testosterone') && !t.marker_name.toLowerCase().includes('free'));
    const freeTestosteroneTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('free testosterone'));
    const estradiolTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('estradiol'));
    const shbgTrend = trendData.data.trends.find(t => t.marker_name.toLowerCase().includes('shbg') || t.marker_name.toLowerCase().includes('sex hormone binding globulin'));

    inputs.testosteroneTrend = testosteroneTrend || undefined;
    inputs.freeTestosteroneTrend = freeTestosteroneTrend || undefined;
    inputs.estradiolTrend = estradiolTrend || undefined;
    inputs.shbgTrend = shbgTrend || undefined;
  }

  // Step 1: Calculate legacy metrics (for backward compatibility)
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

  // Step 2: Trend-aware status determination (NEW in V2)
  const sexualHealthStatus = determineSexualHealthStatusV2(inputs, testosteroneMetrics);
  logger.info('📊 [SEXUAL HEALTH V2] Status determined with trend analysis', { sexualHealthStatus });

  // Step 3: Build evidence with trends (NEW in V2)
  const evidence = buildSexualHealthEvidenceV2(inputs, sexualHealthStatus, bloodwork);

  // Step 4: Build fallback recommendation
  const fallbackRecommendation = buildSexualHealthFallbackRecommendation(sexualHealthStatus);

  // Step 5: AI enrichment (if enabled)
  let recommendation: SexualHealthRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [SEXUAL HEALTH V2] AI enrichment enabled');
    // Convert V2 evidence to V1 format for AI enrichment
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
    logger.info('🔧 [SEXUAL HEALTH V2] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  // Step 6: Normalize
  recommendation = normalizeSexualHealthRecommendation(recommendation);

  // Step 7: Validate
  const isValid = validateSexualHealthRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [SEXUAL HEALTH V2] Validation failed, using fallback');
    recommendation = normalizeSexualHealthRecommendation(fallbackRecommendation);
  }

  // Step 8: Create record
  const record: SexualHealthRecordV2 = {
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

  // Step 9: Persist to in-memory store
  const userRecords = sexualHealthRecordStoreV2.get(userId) ?? [];
  sexualHealthRecordStoreV2.set(userId, [record, ...userRecords]);

  // Step 10: Persist to RecommendationEngine
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
    logger.info('✅ [SEXUAL HEALTH V2] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V2] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [SEXUAL HEALTH V2] Sexual health recommendation complete with trend analysis', {
    userId,
    sexualHealthStatus,
    priority: recommendation.priority,
    source: recommendation.source,
    hasTrends: !!evidence.trendMetadata,
  });

  return record;
}

export async function getSexualHealthTodayV2(userId: string): Promise<SexualHealthRecordV2 | null> {
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = sexualHealthRecordStoreV2.get(userId) ?? [];
  const existing = userRecords.find(record => record.date === today);

  if (existing) {
    logger.info('📋 [SEXUAL HEALTH V2] Returning cached record', { userId, date: today });
    return existing;
  }

  logger.info('🔄 [SEXUAL HEALTH V2] No cached record, generating new', { userId });
  
  // Default inputs for demo (same as V1)
  const inputs: SexualHealthInputsV2 = {
    recoveryScore: 72,
    stressScore: 45,
    cardiovascularStatus: 'optimal',
    metabolicStatus: 'optimal',
    sleepHours: 7.5,
    fatigueScore: 35,
    hrv: 55,
    adherenceScore: 80,
  };

  return getSexualHealthRecommendationV2(userId, inputs);
}

export async function getSexualHealthHistoryV2(userId: string): Promise<SexualHealthRecordV2[]> {
  return sexualHealthRecordStoreV2.get(userId) ?? [];
}

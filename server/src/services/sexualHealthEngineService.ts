/**
 * Sexual Health Engine Service
 * AI-enriched sexual health intelligence with deterministic fallback
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → AI Enrichment → Normalizer → Validator → Persistence
 * 
 * Preserves backward compatibility with existing sexual health logic
 */

import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { enrichSexualHealthRecommendation } from './sexualHealthAIEnrichment';
import { normalizeSexualHealthRecommendation } from './sexualHealthRecommendationNormalizer';
import { validateSexualHealthRecommendation } from './sexualHealthRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import type {
  SexualHealthRecord,
  SexualHealthStatus,
  SexualHealthInputs,
  SexualHealthEvidence,
  SexualHealthEvidenceSignal,
  SexualHealthRecommendation,
  // Legacy types for backward compatibility
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
} from '../types/sexualHealthEngine';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_SEXUAL_HEALTH === 'true';

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const sexualHealthRecordStore = new Map<string, SexualHealthRecord[]>();

// ============================================================================
// LEGACY CALCULATION HELPERS (Preserved for backward compatibility)
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

/**
 * Determine sexual health status (legacy - maps old status to new)
 */
function determineSexualHealthStatusLegacy(sexualHealthScore: number): SexualHealthStatus {
  if (sexualHealthScore >= 80) return 'optimal';
  if (sexualHealthScore >= 65) return 'moderate';
  if (sexualHealthScore >= 45) return 'reduced';
  return 'high_risk';
}

// ============================================================================
// NEW AI ENRICHMENT ARCHITECTURE
// ============================================================================

/**
 * Determine sexual health status (new AI enrichment architecture)
 */
function determineSexualHealthStatus(inputs: SexualHealthInputs): SexualHealthStatus {
  const { recoveryScore, stressScore, cardiovascularStatus, metabolicStatus, sleepHours, fatigueScore } = inputs;

  let riskSignals = 0;

  // High Risk: Multiple severe signals
  if (recoveryScore != null && recoveryScore <= 30) riskSignals += 3;
  if (stressScore != null && stressScore >= 80) riskSignals += 3;
  if (cardiovascularStatus === 'high_risk' || cardiovascularStatus === 'elevated_risk') riskSignals += 2;
  if (metabolicStatus === 'high_risk' || metabolicStatus === 'elevated_risk') riskSignals += 2;
  if (sleepHours != null && sleepHours < 5) riskSignals += 2;
  if (fatigueScore != null && fatigueScore >= 80) riskSignals += 2;

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

  // Optimal: Good recovery, low stress, good sleep
  return 'optimal';
}

/**
 * Build sexual health evidence
 */
function buildSexualHealthEvidence(inputs: SexualHealthInputs, status: SexualHealthStatus, bloodwork?: ReturnType<typeof getLatestBloodworkContext> extends Promise<infer T> ? T : never): SexualHealthEvidence {
  logger.info('📊 [SEXUAL HEALTH EVIDENCE] Building evidence');

  const signals: SexualHealthEvidenceSignal[] = [];

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

  if (inputs.hrv != null) {
    const interpretation = inputs.hrv >= 60
      ? 'Excellent HRV'
      : inputs.hrv >= 40
      ? 'Good HRV'
      : 'Low HRV - autonomic strain';
    
    signals.push({
      name: 'HRV',
      value: inputs.hrv,
      interpretation,
    });
  }

  if (inputs.adherenceScore != null) {
    signals.push({
      name: 'Adherence Score',
      value: inputs.adherenceScore,
      interpretation: inputs.adherenceScore >= 70 ? 'Good adherence' : 'Adherence concerns',
    });
  }

  const summary = `Sexual health status: ${status}. ${signals.length} sexual health signals analyzed.`;

  logger.info('✅ [SEXUAL HEALTH EVIDENCE] Evidence built', { signalCount: signals.length, status });

  return {
    sexualHealthStatus: status,
    signals,
    summary,
  };
}

/**
 * Build fallback sexual health recommendation
 */
function buildSexualHealthFallbackRecommendation(status: SexualHealthStatus): SexualHealthRecommendation {
  logger.info('🔧 [SEXUAL HEALTH FALLBACK] Building fallback recommendation');

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

  logger.info('✅ [SEXUAL HEALTH FALLBACK] Fallback recommendation built', { priority, status });

  return {
    type: 'sexual_health',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
}

/**
 * Determine hormonal risk level
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
// MAIN ENGINE FLOW
// ============================================================================

export async function getSexualHealthRecommendation(
  userId: string,
  inputs: SexualHealthInputs,
): Promise<SexualHealthRecord> {
  logger.info('🔵 [SEXUAL HEALTH ENGINE] Starting sexual health recommendation flow', { userId });

  // Step 0: Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [SEXUAL HEALTH ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    trtUsage: baseline.trtUsage,
    weight: baseline.weight,
  });

  // Step 0b: Load bloodwork for hormonal markers
  const bloodwork = await getLatestBloodworkContext(userId);
  if (bloodwork.hasBloodwork) {
    logger.info('✅ [SEXUAL HEALTH ENGINE] Bloodwork loaded', {
      userId,
      latestTestDate: bloodwork.latestTestDate,
      hasTotalTestosterone: !!bloodwork.markers.totalTestosterone,
      hasFreeTestosterone: !!bloodwork.markers.freeTestosterone,
      hasEstradiol: !!bloodwork.markers.estradiol,
      hasSHBG: !!bloodwork.markers.shbg,
      hasPSA: !!bloodwork.markers.psa,
      hasHematocrit: !!bloodwork.markers.hematocrit,
    });

    // Enrich inputs with hormonal markers from bloodwork (preserve user-provided values if present)
    if (!inputs.totalTestosterone && bloodwork.markers.totalTestosterone) {
      inputs.totalTestosterone = getMarkerValue(bloodwork.markers.totalTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH ENGINE] Using total testosterone from bloodwork', { totalTestosterone: inputs.totalTestosterone });
    }
    if (!inputs.freeTestosterone && bloodwork.markers.freeTestosterone) {
      inputs.freeTestosterone = getMarkerValue(bloodwork.markers.freeTestosterone) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH ENGINE] Using free testosterone from bloodwork', { freeTestosterone: inputs.freeTestosterone });
    }
    if (!inputs.estradiol && bloodwork.markers.estradiol) {
      inputs.estradiol = getMarkerValue(bloodwork.markers.estradiol) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH ENGINE] Using estradiol from bloodwork', { estradiol: inputs.estradiol });
    }
    if (!inputs.shbg && bloodwork.markers.shbg) {
      inputs.shbg = getMarkerValue(bloodwork.markers.shbg) ?? undefined;
      logger.info('📊 [SEXUAL HEALTH ENGINE] Using SHBG from bloodwork', { shbg: inputs.shbg });
    }
  } else {
    logger.info('⚠️ [SEXUAL HEALTH ENGINE] No bloodwork available, using provided inputs only', { userId });
  }

  // Step 1: Deterministic status
  const sexualHealthStatus = determineSexualHealthStatus(inputs);
  logger.info('📊 [SEXUAL HEALTH ENGINE] Status determined', { sexualHealthStatus });

  // Step 2: Build evidence (include bloodwork)
  const evidence = buildSexualHealthEvidence(inputs, sexualHealthStatus, bloodwork);

  // Step 3: Build fallback recommendation
  const fallbackRecommendation = buildSexualHealthFallbackRecommendation(sexualHealthStatus);

  // Step 4: AI enrichment (if enabled)
  let recommendation: SexualHealthRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [SEXUAL HEALTH ENGINE] AI enrichment enabled');
    recommendation = await enrichSexualHealthRecommendation(evidence, fallbackRecommendation);
  } else {
    logger.info('🔧 [SEXUAL HEALTH ENGINE] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  // Step 5: Normalize
  recommendation = normalizeSexualHealthRecommendation(recommendation);

  // Step 6: Validate
  const isValid = validateSexualHealthRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [SEXUAL HEALTH ENGINE] Validation failed, using fallback');
    recommendation = normalizeSexualHealthRecommendation(fallbackRecommendation);
  }

  // Step 7: Create record
  const record: SexualHealthRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    sexualHealthStatus,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  // Step 8: Persist to in-memory store
  const userRecords = sexualHealthRecordStore.get(userId) ?? [];
  sexualHealthRecordStore.set(userId, [record, ...userRecords]);

  // Step 9: Persist to RecommendationEngine
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
    logger.info('✅ [SEXUAL HEALTH ENGINE] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH ENGINE] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [SEXUAL HEALTH ENGINE] Sexual health recommendation complete', {
    userId,
    sexualHealthStatus,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}

/**
 * Legacy calculate function (preserved for backward compatibility)
 */
export async function calculateSexualHealth(userId: string): Promise<SexualHealthRecord | null> {
  try {
    logger.info('Calculating sexual health metrics', { userId });

    // Get user baseline profile for age
    const { data: baseline, error: baselineError } = await supabase
      .from('baseline_profiles')
      .select('demographics')
      .eq('user_id', userId)
      .single();

    if (baselineError) {
      logger.warn('No baseline profile found for sexual health calculation', { userId });
    }

    // Get latest bloodwork for testosterone (if available)
    const { data: bloodwork, error: bloodworkError } = await supabase
      .from('bloodwork_results')
      .select('biomarkers')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(1)
      .single();

    if (bloodworkError) {
      logger.warn('No bloodwork found for sexual health calculation', { userId });
    }

    // Get latest stress and sleep data
    const { data: stress, error: stressError } = await supabase
      .from('stress_records')
      .select('stress_score')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (stressError) {
      logger.warn('No stress record found for sexual health calculation', { userId });
    }

    const { data: recovery, error: recoveryError } = await supabase
      .from('recovery_records')
      .select('source_inputs')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (recoveryError) {
      logger.warn('No recovery record found for sexual health calculation', { userId });
    }

    // Get sexual health interview data (if available)
    // TODO: Add sexual health questions to daily interview
    const { data: sexualHealthLog, error: sexualHealthError } = await supabase
      .from('sexual_health_logs')
      .select('libido_rating, erectile_function_rating, morning_erections_frequency')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (sexualHealthError) {
      logger.warn('No sexual health log found for sexual health calculation', { userId });
    }

    // Build inputs from available data
    const age = baseline?.demographics?.age ?? 35;
    const inputs: SexualHealthInputs = {
      totalTestosterone: bloodwork?.biomarkers?.total_testosterone,
      freeTestosterone: bloodwork?.biomarkers?.free_testosterone,
      libidoSelfRating: sexualHealthLog?.libido_rating,
      erectileFunctionRating: sexualHealthLog?.erectile_function_rating,
      morningErectionsFrequency: sexualHealthLog?.morning_erections_frequency,
      age,
      stressLevel: stress?.stress_score,
      sleepQuality: recovery?.source_inputs?.sleepQuality,
    };

    // Calculate all metrics
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
    const sexualHealthStatus = determineSexualHealthStatusLegacy(sexualHealthScore);
    const hormonalRisk = determineHormonalRisk(testosteroneMetrics, age);

    const record: SexualHealthRecord = {
      id: uuidv4(),
      userId,
      date: new Date().toISOString().split('T')[0],
      sexualHealthScore,
      testosteroneMetrics,
      libidoMetrics,
      erectileMetrics,
      hormonalRisk,
      inputs,
      // New required fields with fallback values
      sexualHealthStatus: determineSexualHealthStatusLegacy(sexualHealthScore),
      recommendation: {
        type: 'sexual_health',
        priority: sexualHealthScore >= 65 ? 'optimization' : sexualHealthScore >= 45 ? 'important' : 'critical',
        summary: `Sexual health status is ${sexualHealthStatus}`,
        actions: ['Monitor sexual health and recovery'],
        source: 'deterministic',
      },
      createdAt: new Date().toISOString(),
    };

    // Store record in database
    const { error: insertError } = await supabase
      .from('sexual_health_records')
      .insert({
        id: record.id,
        user_id: record.userId,
        date: record.date,
        sexual_health_score: record.sexualHealthScore,
        sexual_health_status: record.sexualHealthStatus,
        testosterone_metrics: record.testosteroneMetrics,
        libido_metrics: record.libidoMetrics,
        erectile_metrics: record.erectileMetrics,
        hormonal_risk: record.hormonalRisk,
        inputs: record.inputs,
        created_at: record.createdAt,
      });

    if (insertError) {
      logger.error('Failed to store sexual health record', { error: insertError, userId });
    }

    logger.info('Sexual health calculation complete', {
      userId,
      sexualHealthScore,
      sexualHealthStatus,
      hormonalRisk,
    });

    return record;
  } catch (error) {
    logger.error('Sexual health calculation failed', { error, userId });
    return null;
  }
}

export async function getSexualHealthToday(userId: string): Promise<SexualHealthRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = sexualHealthRecordStore.get(userId) ?? [];
  const existing = userRecords.find(record => record.date === today);

  if (existing) {
    logger.info('📋 [SEXUAL HEALTH ENGINE] Returning cached record', { userId, date: today });
    return existing;
  }

  logger.info('🔄 [SEXUAL HEALTH ENGINE] No cached record, generating new', { userId });
  
  // Default inputs for demo
  const inputs: SexualHealthInputs = {
    recoveryScore: 72,
    stressScore: 45,
    cardiovascularStatus: 'optimal',
    metabolicStatus: 'optimal',
    sleepHours: 7.5,
    fatigueScore: 35,
    hrv: 55,
    adherenceScore: 80,
  };

  return getSexualHealthRecommendation(userId, inputs);
}

export async function getSexualHealthHistory(userId: string): Promise<SexualHealthRecord[]> {
  return sexualHealthRecordStore.get(userId) ?? [];
}

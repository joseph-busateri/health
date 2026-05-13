/**
 * Metabolic Engine Service
 * AI-enriched metabolic intelligence with deterministic fallback
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
// DATABASE PERSISTENCE (Supabase)
// ============================================================================

// ============================================================================
// DETERMINISTIC METABOLIC STATUS LOGIC
// ============================================================================

function determineMetabolicStatus(inputs: MetabolicInputs): MetabolicStatus {
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
  bloodwork?: ReturnType<typeof getLatestBloodworkContext> extends Promise<infer T> ? T : never,
  bodyComp?: ReturnType<typeof getLatestBodyCompositionContext> extends Promise<infer T> ? T : never
): MetabolicEvidence {
  logger.info('📊 [METABOLIC EVIDENCE] Building evidence');

  const signals: MetabolicEvidenceSignal[] = [];

  if (inputs.a1c != null) {
    signals.push({
      name: 'A1C',
      value: inputs.a1c,
      interpretation: inputs.a1c < 5.7 ? 'Normal' : inputs.a1c < 6.5 ? 'Prediabetic range' : 'Diabetic range',
    });
  }

  if (inputs.fastingGlucose != null) {
    signals.push({
      name: 'Fasting Glucose',
      value: inputs.fastingGlucose,
      interpretation: inputs.fastingGlucose < 100 ? 'Normal' : inputs.fastingGlucose < 126 ? 'Elevated' : 'High',
    });
  }

  // Add body composition-based evidence signals
  if (bodyComp?.hasBodyComposition) {
    if (bodyComp.visceralFatLevel !== null) {
      const visceralRisk = getVisceralFatRisk(bodyComp.visceralFatLevel);
      signals.push({
        name: 'Visceral Fat Level',
        value: bodyComp.visceralFatLevel,
        interpretation: `${visceralRisk} risk (${bodyComp.visceralFatLevel < 10 ? 'Normal' : bodyComp.visceralFatLevel < 15 ? 'Elevated' : 'High'})`,
      });
    }

    if (bodyComp.bodyFatPercentage !== null) {
      const baseline = { sex: 'male' as const }; // TODO: Get from baseline profile
      const bodyFatCategory = getBodyFatCategory(bodyComp.bodyFatPercentage, baseline.sex);
      signals.push({
        name: 'Body Fat Percentage',
        value: bodyComp.bodyFatPercentage,
        interpretation: `${bodyFatCategory} (${bodyComp.bodyFatPercentage.toFixed(1)}%)`,
      });
    }

    if (bodyComp.weightLb !== null && bodyComp.bmi !== null) {
      signals.push({
        name: 'BMI',
        value: bodyComp.bmi,
        interpretation: bodyComp.bmi < 18.5 ? 'Underweight' : bodyComp.bmi < 25 ? 'Normal' : bodyComp.bmi < 30 ? 'Overweight' : 'Obese',
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
        });
      }
    }
  }

  if (inputs.weightTrend) {
    signals.push({
      name: 'Weight Trend',
      value: inputs.weightTrend,
      interpretation: inputs.weightTrend === 'stable' ? 'Stable' : inputs.weightTrend === 'slow_gain' ? 'Gradual increase' : 'Rapid increase',
    });
  }

  if (inputs.bodyFat != null) {
    signals.push({
      name: 'Body Fat',
      value: inputs.bodyFat,
      interpretation: inputs.bodyFat < 20 ? 'Healthy range' : inputs.bodyFat < 25 ? 'Moderate' : 'Elevated',
    });
  }

  if (inputs.triglycerides != null) {
    signals.push({
      name: 'Triglycerides',
      value: inputs.triglycerides,
      interpretation: inputs.triglycerides < 150 ? 'Normal' : inputs.triglycerides < 200 ? 'Borderline high' : 'High',
    });
  }

  if (inputs.hdl != null) {
    signals.push({
      name: 'HDL',
      value: inputs.hdl,
      interpretation: inputs.hdl >= 60 ? 'Optimal' : inputs.hdl >= 40 ? 'Normal' : 'Low',
    });
  }

  if (inputs.insulinResistance) {
    signals.push({
      name: 'Insulin Resistance',
      value: inputs.insulinResistance,
      interpretation: inputs.insulinResistance === 'low' ? 'Low risk' : inputs.insulinResistance === 'moderate' ? 'Moderate risk' : 'High risk',
    });
  }

  const summary = `Metabolic status: ${status}. ${signals.length} metabolic signals analyzed.`;

  logger.info('✅ [METABOLIC EVIDENCE] Evidence built', { signalCount: signals.length, status });

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
  logger.info('🔧 [METABOLIC FALLBACK] Building fallback recommendation');

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

  logger.info('✅ [METABOLIC FALLBACK] Fallback recommendation built', { priority, status });

  return {
    type: 'metabolic',
    priority,
    summary,
    actions,
    source: 'deterministic',
  };
};

// ============================================================================
// MAIN ENGINE FLOW
// ============================================================================

interface MetabolicContextData {
  bloodwork: any;
  bodyComp: any;
  baseline: any;
}

const buildMetabolicInputMetadata = (
  inputs: MetabolicInputs,
  contextData: MetabolicContextData
): InputMetadata[] => {
  const metadata: InputMetadata[] = [];
  const now = new Date().toISOString();

  // Fasting Glucose - from bloodwork
  metadata.push({
    name: 'Fasting Glucose',
    value: inputs.fastingGlucose,
    unit: 'mg/dL',
    source: inputs.fastingGlucose !== undefined
      ? (contextData.bloodwork?.markers?.glucose ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.fastingGlucose !== undefined
      ? { table: 'bloodwork_results', field: 'glucose' }
      : undefined,
    lastUpdated: inputs.fastingGlucose !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // A1C - from bloodwork
  metadata.push({
    name: 'A1C',
    value: inputs.a1c,
    unit: '%',
    source: inputs.a1c !== undefined
      ? (contextData.bloodwork?.markers?.a1c ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.a1c !== undefined
      ? { table: 'bloodwork_results', field: 'a1c' }
      : undefined,
    lastUpdated: inputs.a1c !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // Resting Heart Rate - from device or derived
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
  });

  // Body Fat - from body composition
  metadata.push({
    name: 'Body Fat',
    value: inputs.bodyFat,
    unit: '%',
    source: inputs.bodyFat !== undefined
      ? (contextData.bodyComp?.hasBodyComposition ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.bodyFat !== undefined
      ? { table: 'body_composition', field: 'body_fat_percentage' }
      : undefined,
    lastUpdated: inputs.bodyFat !== undefined ? contextData.bodyComp?.latestScanDate : undefined,
    category: 'Body Composition',
  });

  // Weight Trend - from baseline or derived
  metadata.push({
    name: 'Weight Trend',
    value: inputs.weightTrend,
    unit: 'trend',
    source: inputs.weightTrend !== undefined ? 'DERIVED' : 'NOT_AVAILABLE',
    sourceDetails: inputs.weightTrend !== undefined
      ? { derivedFrom: ['weight_history'] }
      : undefined,
    lastUpdated: inputs.weightTrend !== undefined ? now : undefined,
    category: 'Body Composition',
  });

  // Insulin Resistance - from bloodwork or derived
  metadata.push({
    name: 'Insulin Resistance',
    value: inputs.insulinResistance,
    unit: 'level',
    source: inputs.insulinResistance !== undefined
      ? (contextData.bloodwork?.markers?.insulin ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.insulinResistance !== undefined
      ? { table: contextData.bloodwork?.markers?.insulin ? 'bloodwork_results' : undefined, derivedFrom: contextData.bloodwork?.markers?.insulin ? undefined : ['fasting_glucose', 'fasting_insulin'] }
      : undefined,
    lastUpdated: inputs.insulinResistance !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // Triglycerides - from bloodwork
  metadata.push({
    name: 'Triglycerides',
    value: inputs.triglycerides,
    unit: 'mg/dL',
    source: inputs.triglycerides !== undefined
      ? (contextData.bloodwork?.markers?.triglycerides ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.triglycerides !== undefined
      ? { table: 'bloodwork_results', field: 'triglycerides' }
      : undefined,
    lastUpdated: inputs.triglycerides !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // HDL - from bloodwork
  metadata.push({
    name: 'HDL Cholesterol',
    value: inputs.hdl,
    unit: 'mg/dL',
    source: inputs.hdl !== undefined
      ? (contextData.bloodwork?.markers?.hdl ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.hdl !== undefined
      ? { table: 'bloodwork_results', field: 'hdl' }
      : undefined,
    lastUpdated: inputs.hdl !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // LDL - from bloodwork
  metadata.push({
    name: 'LDL Cholesterol',
    value: inputs.ldl,
    unit: 'mg/dL',
    source: inputs.ldl !== undefined
      ? (contextData.bloodwork?.markers?.ldl ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.ldl !== undefined
      ? { table: 'bloodwork_results', field: 'ldl' }
      : undefined,
    lastUpdated: inputs.ldl !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  // Weight - from baseline or body composition
  metadata.push({
    name: 'Weight',
    value: inputs.weight,
    unit: 'lbs',
    source: inputs.weight !== undefined
      ? (contextData.baseline?.weight ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.weight !== undefined
      ? { table: 'baseline_profile', field: 'weight' }
      : undefined,
    lastUpdated: inputs.weight !== undefined ? now : undefined,
    category: 'Body Composition',
  });

  // Waist Circumference - from baseline
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
  });

  // Fasting Insulin - from bloodwork
  metadata.push({
    name: 'Fasting Insulin',
    value: inputs.fastingInsulin,
    unit: 'µIU/mL',
    source: inputs.fastingInsulin !== undefined
      ? (contextData.bloodwork?.markers?.insulin ? 'ACTUAL' : 'DERIVED')
      : 'NOT_AVAILABLE',
    sourceDetails: inputs.fastingInsulin !== undefined
      ? { table: 'bloodwork_results', field: 'insulin' }
      : undefined,
    lastUpdated: inputs.fastingInsulin !== undefined ? contextData.bloodwork?.latestTestDate : undefined,
    category: 'Lab Results',
  });

  return metadata;
};

export async function getMetabolicRecommendation(
  userId: string,
  inputs: MetabolicInputs,
): Promise<MetabolicRecord> {
  logger.info('🔵 [METABOLIC ENGINE] Starting metabolic recommendation flow', { userId });

  // Step 0: Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [METABOLIC ENGINE] Baseline profile loaded', {
    userId,
    age: baseline.age,
    sex: baseline.sex,
    weight: baseline.weight,
    activityLevel: baseline.activityLevel,
    diabetesStatus: baseline.diabetesStatus,
  });

  // Step 0b: Load bloodwork for metabolic markers
  const bloodwork = await getLatestBloodworkContext(userId);
  
  // Step 0c: Load body composition for metabolic risk assessment
  const bodyComp = await getLatestBodyCompositionContext(userId);
  
  if (bloodwork.hasBloodwork) {
    logger.info('✅ [METABOLIC ENGINE] Bloodwork loaded', {
      userId,
      latestTestDate: bloodwork.latestTestDate,
      hasGlucose: !!bloodwork.markers.glucose,
      hasA1C: !!bloodwork.markers.a1c,
      hasInsulin: !!bloodwork.markers.insulin,
      hasTriglycerides: !!bloodwork.markers.triglycerides,
      hasHDL: !!bloodwork.markers.hdl,
    });

    // Enrich inputs with actual bloodwork values (preserve user-provided values if present)
    if (!inputs.a1c && bloodwork.markers.a1c) {
      inputs.a1c = getMarkerValue(bloodwork.markers.a1c) ?? undefined;
      logger.info('📊 [METABOLIC ENGINE] Using A1C from bloodwork', { a1c: inputs.a1c });
    }
    if (!inputs.fastingGlucose && bloodwork.markers.glucose) {
      inputs.fastingGlucose = getMarkerValue(bloodwork.markers.glucose) ?? undefined;
      logger.info('📊 [METABOLIC ENGINE] Using glucose from bloodwork', { glucose: inputs.fastingGlucose });
    }
  } else {
    logger.info('⚠️ [METABOLIC ENGINE] No bloodwork available, using provided inputs only', { userId });
  }
  
  if (bodyComp.hasBodyComposition) {
    logger.info('✅ [METABOLIC ENGINE] Body composition loaded', {
      userId,
      latestScanDate: bodyComp.latestScanDate,
      bodyFatPercentage: bodyComp.bodyFatPercentage,
      visceralFatLevel: bodyComp.visceralFatLevel,
      weightLb: bodyComp.weightLb,
    });
  } else {
    logger.info('⚠️ [METABOLIC ENGINE] No body composition available', { userId });
  }

  // Step 1: Deterministic status
  const metabolicStatus = determineMetabolicStatus(inputs);
  logger.info('📊 [METABOLIC ENGINE] Status determined', { metabolicStatus });

  // Step 2: Build evidence (include bloodwork and body composition)
  const evidence = buildMetabolicEvidence(inputs, metabolicStatus, bloodwork, bodyComp);

  // Step 3: Build fallback recommendation
  const fallbackRecommendation = buildMetabolicFallbackRecommendation(metabolicStatus);

  // Step 4: AI enrichment (if enabled)
  let recommendation: MetabolicRecommendation;
  if (USE_AI_ENRICHMENT) {
    logger.info('🤖 [METABOLIC ENGINE] AI enrichment enabled');
    recommendation = await enrichMetabolicRecommendation(evidence, fallbackRecommendation);
  } else {
    logger.info('🔧 [METABOLIC ENGINE] Using fallback recommendation');
    recommendation = fallbackRecommendation;
  }

  // Step 5: Normalize
  recommendation = normalizeMetabolicRecommendation(recommendation);

  // Step 6: Validate
  const isValid = validateMetabolicRecommendation(recommendation);
  if (!isValid) {
    logger.warn('⚠️ [METABOLIC ENGINE] Validation failed, using fallback');
    recommendation = normalizeMetabolicRecommendation(fallbackRecommendation);
  }

  // Step 7: Build detailed input metadata (if feature flag enabled)
  let detailedInputs: InputMetadata[] | undefined;
  if (SHOW_DETAIL_SCREEN_INPUTS) {
    const contextData: MetabolicContextData = {
      bloodwork,
      bodyComp,
      baseline,
    };
    detailedInputs = buildMetabolicInputMetadata(inputs, contextData);
    logger.info('✅ [METABOLIC ENGINE] Built detailed input metadata', {
      userId,
      inputCount: detailedInputs.length,
      actualCount: detailedInputs.filter(i => i.source === 'ACTUAL').length,
      derivedCount: detailedInputs.filter(i => i.source === 'DERIVED').length,
      notAvailableCount: detailedInputs.filter(i => i.source === 'NOT_AVAILABLE').length,
    });
  }

  // Step 8: Create record
  const record: MetabolicRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    metabolicStatus,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
    ...(detailedInputs && { detailedInputs }),
  };

  // Step 8: Persist to database
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
          estimatedHOMAIR: null,
        },
        inputs: inputs,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      });

    if (dbError) {
      logger.error('❌ [METABOLIC ENGINE] Failed to persist to database', {
        error: dbError.message,
      });
    } else {
      logger.info('✅ [METABOLIC ENGINE] Persisted to database');
    }
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE] Database error', {
      error: (error as Error).message,
    });
  }

  // Step 9: Persist to RecommendationEngine
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
    logger.info('✅ [METABOLIC ENGINE] Persisted to RecommendationEngine');
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE] Failed to persist to RecommendationEngine', {
      error: (error as Error).message,
    });
  }

  logger.info('✅ [METABOLIC ENGINE] Metabolic recommendation complete', {
    userId,
    metabolicStatus,
    priority: recommendation.priority,
    source: recommendation.source,
  });

  return record;
}

export async function getMetabolicToday(userId: string): Promise<MetabolicRecord | null> {
  // Redirect to V2 service which has weighted scoring
  const { getMetabolicTodayV2 } = await import('./metabolicEngineServiceV2');
  return getMetabolicTodayV2(userId);
}

export async function getMetabolicHistory(userId: string): Promise<MetabolicRecord[]> {
  try {
    const { data, error } = await supabase
      .from('metabolic_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (error) {
      logger.error('❌ [METABOLIC ENGINE] Failed to fetch history', {
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
        createdAt: row.created_at,
      };
    });
  } catch (error) {
    logger.error('❌ [METABOLIC ENGINE] Database error fetching history', {
      error: (error as Error).message,
    });
    return [];
  }
}

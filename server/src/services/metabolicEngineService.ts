/**
 * Metabolic Engine Service
 * AI-enriched metabolic intelligence with deterministic fallback
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → AI Enrichment → Normalizer → Validator → Persistence
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
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

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_METABOLIC === 'true';

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const metabolicRecordStore = new Map<string, MetabolicRecord[]>();

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
}


// ============================================================================
// MAIN ENGINE FLOW
// ============================================================================

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

  // Step 7: Create record
  const record: MetabolicRecord = {
    id: randomUUID(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    metabolicStatus,
    evidence,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  // Step 8: Persist to in-memory store
  const userRecords = metabolicRecordStore.get(userId) ?? [];
  metabolicRecordStore.set(userId, [record, ...userRecords]);

  // Step 9: Persist to RecommendationEngine
  try {
    await createRecommendation({
      userId,
      type: 'metabolic',
      priority: recommendation.priority,
      summary: recommendation.summary,
      actions: recommendation.actions,
      rationale: recommendation.rationale,
      sourceEngine: 'metabolic',
      metadata: {
        metabolicStatus,
        evidenceSignalCount: evidence.signals.length,
        source: recommendation.source,
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
  const today = new Date().toISOString().slice(0, 10);
  const userRecords = metabolicRecordStore.get(userId) ?? [];
  const existing = userRecords.find(record => record.date === today);

  if (existing) {
    logger.info('📋 [METABOLIC ENGINE] Returning cached record', { userId, date: today });
    return existing;
  }

  logger.info('🔄 [METABOLIC ENGINE] No cached record, generating new', { userId });
  
  // Default inputs for demo
  const inputs: MetabolicInputs = {
    a1c: 5.5,
    fastingGlucose: 92,
    bodyFat: 18,
    weightTrend: 'stable',
    insulinResistance: 'low',
  };

  return getMetabolicRecommendation(userId, inputs);
}

export async function getMetabolicHistory(userId: string): Promise<MetabolicRecord[]> {
  return metabolicRecordStore.get(userId) ?? [];
}

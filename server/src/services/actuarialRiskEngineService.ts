/**
 * Actuarial Risk Engine Service
 * 10-year cardiovascular risk prediction using validated actuarial models
 * 
 * Architecture:
 * Deterministic Engine → Evidence Builder → AI Enrichment → Normalizer → Validator → Persistence
 * 
 * Integrates:
 * - Framingham Risk Score (2008)
 * - ASCVD Risk Calculator (ACC/AHA 2013)
 * - Lifestyle Risk Modifier
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { calculateFraminghamRisk, type FraminghamInputs } from './framinghamRiskCalculator';
import { calculateASCVDRisk, type ASCVDInputs } from './ascvdRiskCalculator';
import { calculateLifestyleModifiedRisk, type LifestyleFactors } from './lifestyleRiskModifier';
import { enrichActuarialRecommendation } from './actuarialAIEnrichment';
import { normalizeActuarialRecommendation } from './actuarialRecommendationNormalizer';
import { validateActuarialRecommendation } from './actuarialRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import type {
  ActuarialRiskRecord,
  ActuarialRiskInputs,
  ActuarialEvidence,
  ActuarialEvidenceSignal,
  ActuarialRecommendation,
  ActuarialRiskCategory,
  RiskFactorContribution,
  RiskModelResult,
} from '../types/actuarialRiskEngine';

const USE_AI_ENRICHMENT = process.env.USE_AI_ENRICHMENT_ACTUARIAL === 'true';

// ============================================================================
// IN-MEMORY PERSISTENCE
// ============================================================================

const actuarialRiskRecordStore = new Map<string, ActuarialRiskRecord[]>();

// ============================================================================
// MAIN ENGINE FUNCTIONS
// ============================================================================

/**
 * Calculate actuarial risk from inputs
 * Main entry point for actuarial risk calculation
 */
export async function calculateActuarialRisk(
  userId: string,
  inputs: ActuarialRiskInputs
): Promise<ActuarialRiskRecord> {
  logger.info('🧮 [ACTUARIAL RISK] Calculating actuarial risk', { userId });

  try {
    // Step 1: Calculate base risks using validated models
    const framinghamRisk = calculateFraminghamRiskFromInputs(inputs);
    const ascvdRisk = calculateASCVDRiskFromInputs(inputs);

    logger.info('📊 [ACTUARIAL RISK] Base risk calculations complete', {
      framinghamRisk: framinghamRisk.toFixed(1),
      ascvdRisk: ascvdRisk.toFixed(1),
    });

    // Step 2: Build evidence
    const evidence = buildActuarialEvidence(inputs, framinghamRisk, ascvdRisk);

    // Step 3: Build fallback recommendation
    const fallbackRecommendation = buildActuarialFallbackRecommendation(
      evidence.combinedRiskCategory,
      evidence.riskFactors
    );

    // Step 4: AI enrichment (if enabled)
    let recommendation = fallbackRecommendation;
    if (USE_AI_ENRICHMENT) {
      try {
        recommendation = await enrichActuarialRecommendation(evidence, fallbackRecommendation);
        logger.info('✅ [ACTUARIAL RISK] AI enrichment complete', {
          source: recommendation.source,
        });
      } catch (error) {
        logger.warn('⚠️ [ACTUARIAL RISK] AI enrichment failed, using fallback', {
          error: (error as Error).message,
        });
        recommendation = { ...fallbackRecommendation, source: 'fallback' };
      }
    }

    // Step 5: Normalize
    recommendation = normalizeActuarialRecommendation(recommendation);

    // Step 6: Validate
    const isValid = validateActuarialRecommendation(recommendation);
    if (!isValid) {
      throw new Error('Actuarial recommendation validation failed');
    }

    // Step 7: Create record
    const record: ActuarialRiskRecord = {
      id: randomUUID(),
      userId,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      overallRisk: evidence.combinedRiskPercentage,
      riskCategory: evidence.combinedRiskCategory,
      riskModels: {
        framingham: {
          score: framinghamRisk,
          category: determineRiskCategory(framinghamRisk),
          tenYearRisk: framinghamRisk,
        },
        ascvd: {
          score: ascvdRisk,
          category: determineRiskCategory(ascvdRisk),
          tenYearRisk: ascvdRisk,
        },
        lifestyleModified: {
          score: evidence.combinedRiskPercentage,
          category: evidence.combinedRiskCategory,
          tenYearRisk: evidence.combinedRiskPercentage,
          modificationFactor: evidence.lifestyleAdjustment || 0,
        },
      },
      riskFactorContributions: evidence.riskFactors.map(factor => ({
        factor: factor.factor,
        contribution: factor.contribution,
        severity: factor.status === 'negative' ? 'high' : factor.status === 'positive' ? 'low' : 'moderate',
        modifiable: true, // All risk factors are potentially modifiable
      })),
      inputs,
      evidence,
      recommendation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 8: Persist to in-memory store
    const userRecords = actuarialRiskRecordStore.get(userId) || [];
    userRecords.push(record);
    actuarialRiskRecordStore.set(userId, userRecords);

    // Step 9: Persist to RecommendationEngine
    await createRecommendation({
      userId,
      request: {
        sourceEngine: 'cardiovascular',
        title: recommendation.summary,
        description: recommendation.actions.join('\n'),
        rationale: recommendation.rationale,
        priority: recommendation.priority,
        category: 'health_monitoring',
        confidenceLevel: 'high',
        supportingMetrics: [
          {
            name: '10-Year Risk',
            value: `${evidence.combinedRiskPercentage.toFixed(1)}%`,
            status: evidence.combinedRiskCategory === 'low_risk' ? 'optimal' : 
                    evidence.combinedRiskCategory === 'moderate_risk' ? 'normal' :
                    evidence.combinedRiskCategory === 'high_risk' ? 'concerning' : 'concerning',
          },
        ],
      },
    });

    logger.info('✅ [ACTUARIAL RISK] Risk calculation complete', {
      userId,
      riskPercentage: evidence.combinedRiskPercentage.toFixed(1),
      riskCategory: evidence.combinedRiskCategory,
      priority: recommendation.priority,
    });

    return record;
  } catch (error) {
    logger.error('❌ [ACTUARIAL RISK] Risk calculation failed', {
      userId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

// ============================================================================
// RISK CALCULATION HELPERS
// ============================================================================

/**
 * Calculate Framingham risk from actuarial inputs
 */
function calculateFraminghamRiskFromInputs(inputs: ActuarialRiskInputs): number {
  const framinghamInputs: FraminghamInputs = {
    age: inputs.demographic.age,
    gender: inputs.demographic.gender,
    totalCholesterol: inputs.clinical.totalCholesterol,
    hdlCholesterol: inputs.clinical.hdlCholesterol,
    systolicBP: inputs.clinical.systolicBP,
    onBPmedication: inputs.clinical.onBPmedication,
    smoking: inputs.demographic.smokingStatus === 'current',
    diabetes: inputs.clinical.diabetesStatus === 'diabetes',
  };

  const result = calculateFraminghamRisk(framinghamInputs);
  return result.riskPercentage;
}

/**
 * Calculate ASCVD risk from actuarial inputs
 */
function calculateASCVDRiskFromInputs(inputs: ActuarialRiskInputs): number {
  const ascvdInputs: ASCVDInputs = {
    age: inputs.demographic.age,
    gender: inputs.demographic.gender,
    race: inputs.demographic.race === 'white' || inputs.demographic.race === 'black'
      ? inputs.demographic.race
      : 'other',
    totalCholesterol: inputs.clinical.totalCholesterol,
    hdlCholesterol: inputs.clinical.hdlCholesterol,
    systolicBP: inputs.clinical.systolicBP,
    onBPmedication: inputs.clinical.onBPmedication,
    smoking: inputs.demographic.smokingStatus === 'current',
    diabetes: inputs.clinical.diabetesStatus === 'diabetes',
  };

  const result = calculateASCVDRisk(ascvdInputs);
  return result.riskPercentage;
}

// ============================================================================
// EVIDENCE BUILDER
// ============================================================================

/**
 * Build actuarial evidence from inputs and risk calculations
 */
function buildActuarialEvidence(
  inputs: ActuarialRiskInputs,
  framinghamRisk: number,
  ascvdRisk: number
): ActuarialEvidence {
  logger.info('📊 [ACTUARIAL EVIDENCE] Building evidence');

  // Calculate risk factor contributions
  const riskFactors = calculateRiskFactorContributions(inputs);

  // Calculate lifestyle modification
  const lifestyleResult = calculateLifestyleModifiedRisk(
    (framinghamRisk + ascvdRisk) / 2,
    inputs.lifestyle
  );

  // Combine risks with adjustments
  const combinedRiskPercentage = lifestyleResult.modifiedRisk;

  // Determine risk category
  const combinedRiskCategory = determineRiskCategory(combinedRiskPercentage);

  // Build evidence signals
  const signals = buildEvidenceSignals(inputs, framinghamRisk, ascvdRisk, lifestyleResult);

  // Build summary
  const summary = buildRiskSummary(
    combinedRiskPercentage,
    combinedRiskCategory,
    riskFactors
  );

  // Build risk model results
  const framinghamResult: RiskModelResult = {
    modelType: 'framingham',
    riskPercentage: framinghamRisk,
    riskCategory: determineRiskCategory(framinghamRisk),
    confidence: 0.85,
  };

  const ascvdResult: RiskModelResult = {
    modelType: 'ascvd',
    riskPercentage: ascvdRisk,
    riskCategory: determineRiskCategory(ascvdRisk),
    confidence: 0.85,
  };

  return {
    framinghamResult,
    ascvdResult,
    combinedRiskPercentage,
    combinedRiskCategory,
    riskFactors,
    lifestyleAdjustment: lifestyleResult.totalAdjustment * 100,
    fitnessAdjustment: (lifestyleResult.exerciseAdjustment + lifestyleResult.fitnessAdjustment) * 100,
    signals,
    summary,
  };
}

/**
 * Calculate risk factor contributions
 */
function calculateRiskFactorContributions(
  inputs: ActuarialRiskInputs
): RiskFactorContribution[] {
  const contributions: RiskFactorContribution[] = [];

  // Age contribution
  const ageRisk = Math.max(0, (inputs.demographic.age - 40) / 40) * 100;
  contributions.push({
    factor: 'Age',
    contribution: ageRisk,
    status: inputs.demographic.age > 50 ? 'negative' : 'neutral',
    value: `${inputs.demographic.age} years`,
    interpretation: inputs.demographic.age > 50
      ? 'Age increases cardiovascular risk'
      : 'Age within optimal range',
  });

  // Blood pressure contribution
  const bpRisk = inputs.clinical.systolicBP > 140 ? 25 : inputs.clinical.systolicBP > 130 ? 15 : 10;
  contributions.push({
    factor: 'Blood Pressure',
    contribution: bpRisk,
    status: inputs.clinical.systolicBP > 140 ? 'negative' : inputs.clinical.systolicBP > 130 ? 'neutral' : 'positive',
    value: `${inputs.clinical.systolicBP}/${inputs.clinical.diastolicBP} mmHg`,
    interpretation: inputs.clinical.systolicBP > 140
      ? 'Elevated blood pressure increases risk'
      : inputs.clinical.systolicBP > 130
      ? 'Blood pressure slightly elevated'
      : 'Blood pressure in healthy range',
  });

  // Cholesterol contribution
  const ldl = inputs.clinical.ldlCholesterol || 0;
  const cholesterolRisk = ldl > 130 ? 20 : ldl > 100 ? 10 : 5;
  contributions.push({
    factor: 'Cholesterol',
    contribution: cholesterolRisk,
    status: ldl > 130 ? 'negative' : ldl > 100 ? 'neutral' : 'positive',
    value: inputs.clinical.ldlCholesterol ? `LDL ${ldl} mg/dL` : 'Not measured',
    interpretation: ldl > 130
      ? 'Elevated LDL increases risk'
      : ldl > 100
      ? 'LDL slightly elevated'
      : 'Cholesterol within healthy range',
  });

  // Diabetes contribution
  const diabetesRisk = inputs.clinical.diabetesStatus === 'diabetes' ? 30 :
                      inputs.clinical.diabetesStatus === 'prediabetes' ? 15 : 0;
  contributions.push({
    factor: 'Diabetes',
    contribution: diabetesRisk,
    status: inputs.clinical.diabetesStatus === 'none' ? 'positive' : 'negative',
    value: inputs.clinical.diabetesStatus,
    interpretation: inputs.clinical.diabetesStatus === 'diabetes'
      ? 'Diabetes significantly increases cardiovascular risk'
      : inputs.clinical.diabetesStatus === 'prediabetes'
      ? 'Prediabetes increases cardiovascular risk'
      : 'No diabetes risk factor',
  });

  // Smoking contribution
  const smokingRisk = inputs.demographic.smokingStatus === 'current' ? 35 :
                     inputs.demographic.smokingStatus === 'former' ? 10 : 0;
  contributions.push({
    factor: 'Smoking',
    contribution: smokingRisk,
    status: inputs.demographic.smokingStatus === 'never' ? 'positive' : 'negative',
    value: inputs.demographic.smokingStatus,
    interpretation: inputs.demographic.smokingStatus === 'current'
      ? 'Smoking significantly increases cardiovascular risk'
      : inputs.demographic.smokingStatus === 'former'
      ? 'Former smoking slightly increases risk'
      : 'No smoking risk factor',
  });

  // Fitness contribution (positive)
  const fitnessBenefit = inputs.lifestyle.exerciseFrequency >= 3 ? 20 : 0;
  if (fitnessBenefit > 0) {
    contributions.push({
      factor: 'Fitness',
      contribution: fitnessBenefit,
      status: 'positive',
      value: `${inputs.lifestyle.exerciseFrequency} days/week`,
      interpretation: 'Regular exercise significantly reduces cardiovascular risk',
    });
  }

  // Sort by contribution (highest first)
  return contributions.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Build evidence signals
 */
function buildEvidenceSignals(
  inputs: ActuarialRiskInputs,
  framinghamRisk: number,
  ascvdRisk: number,
  lifestyleResult: ReturnType<typeof calculateLifestyleModifiedRisk>
): ActuarialEvidenceSignal[] {
  const signals: ActuarialEvidenceSignal[] = [];

  signals.push({
    name: 'Framingham Risk Score',
    value: `${framinghamRisk.toFixed(1)}%`,
    interpretation: `10-year coronary heart disease risk: ${framinghamRisk.toFixed(1)}%`,
  });

  signals.push({
    name: 'ASCVD Risk Score',
    value: `${ascvdRisk.toFixed(1)}%`,
    interpretation: `10-year ASCVD risk (heart attack + stroke): ${ascvdRisk.toFixed(1)}%`,
  });

  signals.push({
    name: 'Lifestyle Modification',
    value: `${lifestyleResult.riskReduction.toFixed(1)}%`,
    interpretation: lifestyleResult.riskReduction > 0
      ? `Lifestyle factors reduce risk by ${lifestyleResult.riskReduction.toFixed(1)}%`
      : `Lifestyle factors increase risk by ${Math.abs(lifestyleResult.riskReduction).toFixed(1)}%`,
  });

  return signals;
}

/**
 * Determine risk category from percentage
 */
function determineRiskCategory(riskPercentage: number): ActuarialRiskCategory {
  if (riskPercentage < 5) return 'low_risk';
  if (riskPercentage < 7.5) return 'moderate_risk';
  if (riskPercentage < 20) return 'high_risk';
  return 'very_high_risk';
}

/**
 * Build risk summary
 */
function buildRiskSummary(
  riskPercentage: number,
  riskCategory: ActuarialRiskCategory,
  riskFactors: RiskFactorContribution[]
): string {
  const categoryText = riskCategory.replace('_', ' ').toUpperCase();
  const topFactors = riskFactors
    .filter(f => f.status === 'negative')
    .slice(0, 3)
    .map(f => f.factor)
    .join(', ');

  return `10-year cardiovascular risk: ${riskPercentage.toFixed(1)}% (${categoryText}). ${
    topFactors ? `Primary risk factors: ${topFactors}.` : 'No major risk factors identified.'
  }`;
}

// ============================================================================
// FALLBACK RECOMMENDATION BUILDER
// ============================================================================

/**
 * Build fallback recommendation based on risk category
 */
function buildActuarialFallbackRecommendation(
  riskCategory: ActuarialRiskCategory,
  riskFactors: RiskFactorContribution[]
): ActuarialRecommendation {
  const primaryRiskDrivers = riskFactors
    .filter(f => f.status === 'negative' && f.contribution > 10)
    .slice(0, 5)
    .map(f => f.factor);

  switch (riskCategory) {
    case 'low_risk':
      return {
        type: 'actuarial_risk',
        priority: 'optimization',
        summary: '10-year cardiovascular risk is low',
        actions: [
          'Maintain current healthy lifestyle',
          'Continue regular exercise routine',
          'Monitor blood pressure annually',
          'Keep cholesterol in healthy range',
          'Maintain healthy weight',
        ],
        riskReductionPotential: 0,
        primaryRiskDrivers,
        preventionStrategies: ['Maintain healthy lifestyle', 'Regular monitoring'],
        source: 'deterministic',
      };

    case 'moderate_risk':
      return {
        type: 'actuarial_risk',
        priority: 'important',
        summary: '10-year cardiovascular risk is moderate',
        actions: [
          'Increase exercise frequency to 3-5 days per week',
          'Optimize diet (reduce sodium, increase vegetables)',
          'Monitor blood pressure regularly',
          'Consider lipid panel retest in 6 months',
          'Maintain healthy weight',
          'Manage stress through relaxation techniques',
        ],
        riskReductionPotential: 30,
        primaryRiskDrivers,
        preventionStrategies: [
          'Exercise optimization',
          'Dietary improvements',
          'Regular monitoring',
          'Stress management',
        ],
        source: 'deterministic',
      };

    case 'high_risk':
      return {
        type: 'actuarial_risk',
        priority: 'important',
        summary: '10-year cardiovascular risk is high',
        actions: [
          'Consult with healthcare provider about risk reduction',
          'Implement aggressive lifestyle modifications',
          'Achieve and maintain healthy blood pressure',
          'Optimize cholesterol levels',
          'Quit smoking if applicable',
          'Achieve healthy weight',
          'Increase physical activity to 5+ days per week',
          'Consider preventive medications with your doctor',
        ],
        riskReductionPotential: 50,
        primaryRiskDrivers,
        preventionStrategies: [
          'Medical consultation',
          'Lifestyle intervention',
          'Risk factor management',
          'Medication consideration',
        ],
        source: 'deterministic',
      };

    case 'very_high_risk':
      return {
        type: 'actuarial_risk',
        priority: 'critical',
        summary: '10-year cardiovascular risk is very high - immediate attention needed',
        actions: [
          'Urgent consultation with healthcare provider',
          'Immediate lifestyle modifications',
          'Strict blood pressure control',
          'Aggressive cholesterol management',
          'Smoking cessation if applicable',
          'Weight management program',
          'Daily physical activity',
          'Consider preventive medications',
          'Regular cardiovascular monitoring',
        ],
        riskReductionPotential: 60,
        primaryRiskDrivers,
        preventionStrategies: [
          'Medical intervention',
          'Aggressive lifestyle changes',
          'Risk factor control',
          'Medication therapy',
        ],
        source: 'deterministic',
      };
  }
}

// ============================================================================
// RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get actuarial risk record for user
 */
export async function getActuarialRiskRecord(
  userId: string,
  date?: string
): Promise<ActuarialRiskRecord | null> {
  const userRecords = actuarialRiskRecordStore.get(userId) || [];

  if (date) {
    return userRecords.find(r => r.date === date) || null;
  }

  return userRecords[userRecords.length - 1] || null;
}

/**
 * Get actuarial risk history
 */
export async function getActuarialRiskHistory(
  userId: string,
  days: number = 30
): Promise<ActuarialRiskRecord[]> {
  const userRecords = actuarialRiskRecordStore.get(userId) || [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return userRecords.filter(r => new Date(r.date) >= cutoffDate);
}

/**
 * Get all actuarial risk records for user
 */
export async function getAllActuarialRiskRecords(
  userId: string
): Promise<ActuarialRiskRecord[]> {
  return actuarialRiskRecordStore.get(userId) || [];
}

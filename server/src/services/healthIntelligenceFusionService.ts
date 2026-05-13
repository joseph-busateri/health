import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getLatestBloodworkContext, getMarkerValue, isMarkerAbnormal } from './bloodworkContextService';
import { getLatestBodyCompositionContext } from './bodyCompositionContextService';
import { getCurrentSupplementStackContext, hasIngredient, getDoseCategory } from './supplementContextService';
import { getLongitudinalIntelligenceContext, type LongitudinalIntelligenceContext } from './longitudinalIntelligenceService';
import { getAdaptiveIntelligenceContext, type AdaptiveIntelligenceContext } from './adaptiveIntelligencePhase7Service';
import { getDeviceFusionSignals, type DeviceFusionSignals } from './deviceIntelligenceIntegrationService';

/**
 * Health Intelligence Fusion Service
 * 
 * Purpose: Enable cross-engine intelligence reasoning
 * - Aggregates baseline, bloodwork, body composition, and supplement contexts
 * - Generates fusion signals across data sources
 * - Identifies risks, optimizations, and priorities
 * - Enables predictive, adaptive, and context-aware intelligence
 * 
 * This service does NOT rewrite engines - it provides cross-context intelligence
 */

// ============================================================================
// FUSION SIGNAL TYPES
// ============================================================================

export type FusionSignalType = 'risk' | 'optimization' | 'priority' | 'insight';
export type FusionSignalSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type FusionSignalCategory = 
  | 'metabolic'
  | 'cardiovascular'
  | 'hormonal'
  | 'nutritional'
  | 'supplementation'
  | 'training'
  | 'recovery'
  | 'body_composition';

export interface FusionSignal {
  id: string;
  type: FusionSignalType;
  category: FusionSignalCategory;
  severity: FusionSignalSeverity;
  title: string;
  description: string;
  dataSources: string[]; // Which contexts contributed to this signal
  actionable: boolean;
  suggestedAction?: string;
  confidence: number; // 0-1
}

// ============================================================================
// FUSION CONTEXT
// ============================================================================

export interface HealthIntelligenceFusionContext {
  userId: string;
  timestamp: string;
  
  // Individual contexts
  baseline: ReturnType<typeof getBaselineFields> extends Promise<infer T> ? T : never;
  bloodwork: Awaited<ReturnType<typeof getLatestBloodworkContext>>;
  bodyComposition: Awaited<ReturnType<typeof getLatestBodyCompositionContext>>;
  supplements: Awaited<ReturnType<typeof getCurrentSupplementStackContext>>;
  
  // Fusion signals
  fusionSignals: FusionSignal[];
  riskSignals: FusionSignal[];
  optimizationSignals: FusionSignal[];
  prioritySignals: FusionSignal[];
  
  // Summary metrics
  totalSignals: number;
  criticalSignals: number;
  highPrioritySignals: number;
  dataCompleteness: {
    hasBaseline: boolean;
    hasBloodwork: boolean;
    hasBodyComposition: boolean;
    hasSupplements: boolean;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// MAIN FUSION SERVICE
// ============================================================================

/**
 * Get comprehensive health intelligence fusion context
 * Aggregates all data sources and generates cross-engine fusion signals
 */
export async function getHealthIntelligenceFusionContext(userId: string): Promise<HealthIntelligenceFusionContext> {
  logger.info('🔵 [FUSION] Starting health intelligence fusion', { userId });

  try {
    // Load all contexts in parallel
    const [baseline, bloodwork, bodyComposition, supplements] = await Promise.all([
      getBaselineFields(userId),
      getLatestBloodworkContext(userId),
      getLatestBodyCompositionContext(userId),
      getCurrentSupplementStackContext(userId),
    ]);

    logger.info('✅ [FUSION] All contexts loaded', {
      userId,
      hasBloodwork: bloodwork.hasBloodwork,
      hasBodyComposition: bodyComposition.hasBodyComposition,
      hasSupplements: supplements.hasSupplementStack,
    });

    // Calculate data completeness
    const dataCompleteness = {
      hasBaseline: true, // Always have baseline
      hasBloodwork: bloodwork.hasBloodwork,
      hasBodyComposition: bodyComposition.hasBodyComposition,
      hasSupplements: supplements.hasSupplementStack,
      completenessScore: calculateCompletenessScore(bloodwork, bodyComposition, supplements),
    };

    // Generate fusion signals
    const fusionSignals = await generateFusionSignals(
      userId,
      baseline,
      bloodwork,
      bodyComposition,
      supplements
    );

    // Categorize signals
    const riskSignals = fusionSignals.filter(s => s.type === 'risk');
    const optimizationSignals = fusionSignals.filter(s => s.type === 'optimization');
    const prioritySignals = fusionSignals.filter(s => s.type === 'priority');

    const criticalSignals = fusionSignals.filter(s => s.severity === 'critical').length;
    const highPrioritySignals = fusionSignals.filter(s => s.severity === 'high').length;

    logger.info('✅ [FUSION] Fusion signals generated', {
      userId,
      totalSignals: fusionSignals.length,
      riskSignals: riskSignals.length,
      optimizationSignals: optimizationSignals.length,
      prioritySignals: prioritySignals.length,
      criticalSignals,
      highPrioritySignals,
    });

    return {
      userId,
      timestamp: new Date().toISOString(),
      baseline,
      bloodwork,
      bodyComposition,
      supplements,
      fusionSignals,
      riskSignals,
      optimizationSignals,
      prioritySignals,
      totalSignals: fusionSignals.length,
      criticalSignals,
      highPrioritySignals,
      dataCompleteness,
    };
  } catch (error) {
    logger.error('❌ [FUSION] Failed to generate fusion context', { userId, error });
    throw error;
  }
}

// ============================================================================
// FUSION SIGNAL GENERATION
// ============================================================================

async function generateFusionSignals(
  userId: string,
  baseline: any,
  bloodwork: any,
  bodyComposition: any,
  supplements: any
): Promise<FusionSignal[]> {
  const signals: FusionSignal[] = [];

  // 1. Bloodwork + Supplements Fusion
  signals.push(...generateBloodworkSupplementFusion(bloodwork, supplements));

  // 2. Body Composition + Nutrition Fusion
  signals.push(...generateBodyCompositionNutritionFusion(baseline, bodyComposition));

  // 3. Body Composition + Workout Fusion
  signals.push(...generateBodyCompositionWorkoutFusion(baseline, bodyComposition));

  // 4. Bloodwork + Body Composition Fusion
  signals.push(...generateBloodworkBodyCompositionFusion(bloodwork, bodyComposition));

  // 5. Supplements + Bloodwork + Goals Fusion
  signals.push(...generateSupplementsBloodworkGoalsFusion(baseline, bloodwork, supplements));

  // 6. Metabolic Risk Escalation Fusion
  signals.push(...generateMetabolicRiskFusion(bloodwork, bodyComposition, supplements));

  // 7. Hormonal Optimization Fusion
  signals.push(...generateHormonalOptimizationFusion(baseline, bloodwork, bodyComposition, supplements));

  // 8. Recovery Optimization Fusion
  signals.push(...generateRecoveryOptimizationFusion(bloodwork, bodyComposition, supplements));

  // Phase 12: Device Intelligence Fusion Signals
  try {
    const deviceSignals = await getDeviceFusionSignals(userId);
    if (deviceSignals.hasDeviceData) {
      signals.push(...generateDeviceFusionSignals(deviceSignals));
      logger.info('[DeviceFusion] Device fusion signals integrated', {
        userId,
        deviceSignalCount: deviceSignals.signals.length,
      });
    }
  } catch (error) {
    logger.warn('[DeviceFusion] Failed to integrate device signals', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return signals;
}

// ============================================================================
// FUSION SIGNAL GENERATORS
// ============================================================================

/**
 * 1. Bloodwork + Supplements Fusion
 * Detect deficiencies with/without supplementation
 */
function generateBloodworkSupplementFusion(bloodwork: any, supplements: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bloodwork.hasBloodwork) return signals;

  // Vitamin D: Low + Taking Supplement
  if (bloodwork.markers.vitaminD) {
    const vitDValue = getMarkerValue(bloodwork.markers.vitaminD);
    if (vitDValue !== null && vitDValue < 30) {
      const hasVitaminD = supplements.hasSupplementStack && hasIngredient(supplements, 'vitamin d');
      
      if (hasVitaminD) {
        // Taking supplement but still low
        const vitDSupplement = supplements.ingredients.find((i: any) => 
          i.name.toLowerCase().includes('vitamin d')
        );
        const doseCategory = vitDSupplement ? getDoseCategory(vitDSupplement) : 'unknown';
        
        signals.push({
          id: `fusion-vitd-low-supplementing-${Date.now()}`,
          type: 'priority',
          category: 'supplementation',
          severity: 'high',
          title: 'Vitamin D Remains Low Despite Supplementation',
          description: `Vitamin D is ${vitDValue} ng/mL (target >30) despite taking ${vitDSupplement?.dosageAmount}${vitDSupplement?.dosageUnit}. ${doseCategory === 'low' ? 'Current dose is low.' : 'Consider increasing dose or improving adherence.'}`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: doseCategory === 'low' 
            ? 'Increase Vitamin D dose to 5000 IU daily'
            : 'Improve supplement adherence or verify absorption',
          confidence: 0.9,
        });
      } else {
        // Low but not supplementing
        signals.push({
          id: `fusion-vitd-low-not-supplementing-${Date.now()}`,
          type: 'priority',
          category: 'supplementation',
          severity: 'high',
          title: 'Vitamin D Deficiency - Supplementation Gap',
          description: `Vitamin D is ${vitDValue} ng/mL (target >30) and no Vitamin D supplement detected in stack.`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: 'Add Vitamin D3 5000 IU daily',
          confidence: 0.95,
        });
      }
    }
  }

  // Magnesium: Low + No Supplement
  if (bloodwork.markers.magnesium) {
    const magValue = getMarkerValue(bloodwork.markers.magnesium);
    if (magValue !== null && magValue < 2.0) {
      const hasMagnesium = supplements.hasSupplementStack && hasIngredient(supplements, 'magnesium');
      
      if (!hasMagnesium) {
        signals.push({
          id: `fusion-mag-low-not-supplementing-${Date.now()}`,
          type: 'priority',
          category: 'supplementation',
          severity: 'moderate',
          title: 'Magnesium Deficiency - Supplementation Gap',
          description: `Magnesium is ${magValue} mg/dL (target >2.0) and no magnesium supplement detected.`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: 'Add Magnesium Glycinate 400mg evening',
          confidence: 0.9,
        });
      }
    }
  }

  // B12: Low + No Supplement
  if (bloodwork.markers.b12) {
    const b12Value = getMarkerValue(bloodwork.markers.b12);
    if (b12Value !== null && b12Value < 400) {
      const hasB12 = supplements.hasSupplementStack && hasIngredient(supplements, 'b12');
      
      if (!hasB12) {
        signals.push({
          id: `fusion-b12-low-not-supplementing-${Date.now()}`,
          type: 'priority',
          category: 'supplementation',
          severity: 'moderate',
          title: 'B12 Deficiency - Supplementation Gap',
          description: `B12 is ${b12Value} pg/mL (target >400) and no B12 supplement detected.`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: 'Add Vitamin B12 1000mcg daily',
          confidence: 0.9,
        });
      }
    }
  }

  // Omega-3: High LDL + No Omega-3
  if (bloodwork.markers.ldlCholesterol) {
    const ldlValue = getMarkerValue(bloodwork.markers.ldlCholesterol);
    if (ldlValue !== null && ldlValue > 130) {
      const hasOmega3 = supplements.hasSupplementStack && 
        (hasIngredient(supplements, 'omega-3') || hasIngredient(supplements, 'fish oil'));
      
      if (!hasOmega3) {
        signals.push({
          id: `fusion-ldl-high-no-omega3-${Date.now()}`,
          type: 'optimization',
          category: 'cardiovascular',
          severity: 'moderate',
          title: 'Cardiovascular Optimization - Omega-3 Gap',
          description: `LDL cholesterol is ${ldlValue} mg/dL (target <130) and no Omega-3 supplement detected.`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: 'Add Omega-3 fish oil 2000mg daily',
          confidence: 0.85,
        });
      }
    }
  }

  return signals;
}

/**
 * 2. Body Composition + Nutrition Fusion
 * Detect recomposition opportunities
 */
function generateBodyCompositionNutritionFusion(baseline: any, bodyComposition: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bodyComposition.hasBodyComposition) return signals;

  // High Body Fat + Need Recomposition
  if (bodyComposition.bodyFatPercentage !== null && bodyComposition.bodyFatPercentage > 20) {
    signals.push({
      id: `fusion-bodyfat-recomp-${Date.now()}`,
      type: 'optimization',
      category: 'body_composition',
      severity: 'moderate',
      title: 'Body Recomposition Opportunity',
      description: `Body fat is ${bodyComposition.bodyFatPercentage}% (target <20%). Optimize nutrition for fat loss while preserving lean mass.`,
      dataSources: ['body_composition', 'baseline'],
      actionable: true,
      suggestedAction: 'Moderate calorie deficit with high protein (1g per lb lean mass)',
      confidence: 0.85,
    });
  }

  // Low Lean Mass + Need Muscle Growth
  if (bodyComposition.dryLeanMassLb !== null && baseline.sex === 'male' && bodyComposition.dryLeanMassLb < 140) {
    signals.push({
      id: `fusion-leanmass-growth-${Date.now()}`,
      type: 'optimization',
      category: 'nutritional',
      severity: 'moderate',
      title: 'Muscle Growth Opportunity',
      description: `Lean mass is ${bodyComposition.dryLeanMassLb} lbs (below typical target for males). Optimize nutrition for muscle growth.`,
      dataSources: ['body_composition', 'baseline'],
      actionable: true,
      suggestedAction: 'Calorie surplus with high protein (1.2g per lb bodyweight)',
      confidence: 0.8,
    });
  }

  return signals;
}

/**
 * 3. Body Composition + Workout Fusion
 * Detect training optimization opportunities
 */
function generateBodyCompositionWorkoutFusion(baseline: any, bodyComposition: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bodyComposition.hasBodyComposition) return signals;

  // High Body Fat + Need Fat Loss Training
  if (bodyComposition.bodyFatPercentage !== null && bodyComposition.bodyFatPercentage > 25) {
    signals.push({
      id: `fusion-bodyfat-training-${Date.now()}`,
      type: 'optimization',
      category: 'training',
      severity: 'moderate',
      title: 'Fat Loss Training Optimization',
      description: `Body fat is ${bodyComposition.bodyFatPercentage}% (elevated). Hybrid training approach recommended: strength + metabolic conditioning.`,
      dataSources: ['body_composition', 'baseline'],
      actionable: true,
      suggestedAction: 'Combine strength training with HIIT/metabolic conditioning',
      confidence: 0.8,
    });
  }

  // Low Lean Mass + Need Hypertrophy Focus
  if (bodyComposition.dryLeanMassLb !== null && bodyComposition.dryLeanMassLb < 130) {
    signals.push({
      id: `fusion-leanmass-hypertrophy-${Date.now()}`,
      type: 'optimization',
      category: 'training',
      severity: 'moderate',
      title: 'Hypertrophy Training Focus',
      description: `Lean mass is ${bodyComposition.dryLeanMassLb} lbs (below target). Focus on hypertrophy training with progressive overload.`,
      dataSources: ['body_composition', 'baseline'],
      actionable: true,
      suggestedAction: 'Hypertrophy-focused training: 8-12 reps, 3-4 sets, progressive overload',
      confidence: 0.85,
    });
  }

  return signals;
}

/**
 * 4. Bloodwork + Body Composition Fusion
 * Detect metabolic and hormonal risks
 */
function generateBloodworkBodyCompositionFusion(bloodwork: any, bodyComposition: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bloodwork.hasBloodwork || !bodyComposition.hasBodyComposition) return signals;

  // High A1C + High Body Fat = Metabolic Risk Escalation
  if (bloodwork.markers.a1c && bodyComposition.bodyFatPercentage !== null) {
    const a1cValue = getMarkerValue(bloodwork.markers.a1c);
    if (a1cValue !== null && a1cValue > 5.7 && bodyComposition.bodyFatPercentage > 25) {
      signals.push({
        id: `fusion-metabolic-risk-escalation-${Date.now()}`,
        type: 'risk',
        category: 'metabolic',
        severity: 'high',
        title: 'Metabolic Risk Escalation',
        description: `A1C is ${a1cValue}% (elevated) AND body fat is ${bodyComposition.bodyFatPercentage}% (high). Combined metabolic risk requires intervention.`,
        dataSources: ['bloodwork', 'body_composition'],
        actionable: true,
        suggestedAction: 'Prioritize fat loss, improve insulin sensitivity, consider metabolic support supplements',
        confidence: 0.95,
      });
    }
  }

  // Low Testosterone + High Body Fat = Hormonal Optimization
  if (bloodwork.markers.totalTestosterone && bodyComposition.bodyFatPercentage !== null) {
    const testValue = getMarkerValue(bloodwork.markers.totalTestosterone);
    if (testValue !== null && testValue < 400 && bodyComposition.bodyFatPercentage > 20) {
      signals.push({
        id: `fusion-hormonal-optimization-${Date.now()}`,
        type: 'optimization',
        category: 'hormonal',
        severity: 'high',
        title: 'Hormonal Optimization Opportunity',
        description: `Testosterone is ${testValue} ng/dL (suboptimal) AND body fat is ${bodyComposition.bodyFatPercentage}%. Fat loss may improve hormonal profile.`,
        dataSources: ['bloodwork', 'body_composition'],
        actionable: true,
        suggestedAction: 'Prioritize fat loss, optimize sleep, consider Vitamin D/Zinc supplementation',
        confidence: 0.85,
      });
    }
  }

  // High Visceral Fat + Elevated Metabolic Markers
  if (bodyComposition.visceralFatLevel !== null && bodyComposition.visceralFatLevel > 10) {
    if (bloodwork.markers.fastingGlucose || bloodwork.markers.triglycerides) {
      const glucoseValue = bloodwork.markers.fastingGlucose ? getMarkerValue(bloodwork.markers.fastingGlucose) : null;
      const triglyceridesValue = bloodwork.markers.triglycerides ? getMarkerValue(bloodwork.markers.triglycerides) : null;
      
      if ((glucoseValue !== null && glucoseValue > 100) || (triglyceridesValue !== null && triglyceridesValue > 150)) {
        signals.push({
          id: `fusion-visceral-fat-metabolic-${Date.now()}`,
          type: 'risk',
          category: 'metabolic',
          severity: 'high',
          title: 'Visceral Fat + Metabolic Dysregulation',
          description: `Visceral fat level is ${bodyComposition.visceralFatLevel} (elevated) with metabolic markers showing dysregulation. High priority intervention needed.`,
          dataSources: ['bloodwork', 'body_composition'],
          actionable: true,
          suggestedAction: 'Target visceral fat reduction through diet, exercise, and metabolic support',
          confidence: 0.9,
        });
      }
    }
  }

  return signals;
}

/**
 * 5. Supplements + Bloodwork + Goals Fusion
 * Prioritize supplements based on deficiencies and goals
 */
function generateSupplementsBloodworkGoalsFusion(baseline: any, bloodwork: any, supplements: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bloodwork.hasBloodwork) return signals;

  // Low Vitamin D + Fat Loss Goal
  if (bloodwork.markers.vitaminD && baseline.goals?.includes('fat_loss')) {
    const vitDValue = getMarkerValue(bloodwork.markers.vitaminD);
    if (vitDValue !== null && vitDValue < 30) {
      signals.push({
        id: `fusion-vitd-fatloss-${Date.now()}`,
        type: 'priority',
        category: 'supplementation',
        severity: 'high',
        title: 'Vitamin D Priority for Fat Loss Goal',
        description: `Vitamin D is ${vitDValue} ng/mL (low) and you have a fat loss goal. Vitamin D optimization may support fat loss and metabolic health.`,
        dataSources: ['bloodwork', 'baseline', 'supplements'],
        actionable: true,
        suggestedAction: 'Prioritize Vitamin D3 5000 IU daily',
        confidence: 0.85,
      });
    }
  }

  // Low B12 + Fatigue/Recovery Goal
  if (bloodwork.markers.b12 && (baseline.goals?.includes('recovery') || baseline.goals?.includes('energy'))) {
    const b12Value = getMarkerValue(bloodwork.markers.b12);
    if (b12Value !== null && b12Value < 400) {
      signals.push({
        id: `fusion-b12-recovery-${Date.now()}`,
        type: 'priority',
        category: 'supplementation',
        severity: 'moderate',
        title: 'B12 Priority for Recovery/Energy Goal',
        description: `B12 is ${b12Value} pg/mL (low) and you have recovery/energy goals. B12 optimization may improve energy and recovery.`,
        dataSources: ['bloodwork', 'baseline', 'supplements'],
        actionable: true,
        suggestedAction: 'Prioritize Vitamin B12 1000mcg daily',
        confidence: 0.8,
      });
    }
  }

  return signals;
}

/**
 * 6. Metabolic Risk Escalation Fusion
 * Detect compounding metabolic risks
 */
function generateMetabolicRiskFusion(bloodwork: any, bodyComposition: any, supplements: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bloodwork.hasBloodwork) return signals;

  let metabolicRiskFactors = 0;
  const riskDetails: string[] = [];

  // Check A1C
  if (bloodwork.markers.a1c) {
    const a1cValue = getMarkerValue(bloodwork.markers.a1c);
    if (a1cValue !== null && a1cValue > 5.7) {
      metabolicRiskFactors++;
      riskDetails.push(`A1C ${a1cValue}% (elevated)`);
    }
  }

  // Check Fasting Glucose
  if (bloodwork.markers.fastingGlucose) {
    const glucoseValue = getMarkerValue(bloodwork.markers.fastingGlucose);
    if (glucoseValue !== null && glucoseValue > 100) {
      metabolicRiskFactors++;
      riskDetails.push(`Fasting glucose ${glucoseValue} mg/dL (elevated)`);
    }
  }

  // Check Triglycerides
  if (bloodwork.markers.triglycerides) {
    const trigValue = getMarkerValue(bloodwork.markers.triglycerides);
    if (trigValue !== null && trigValue > 150) {
      metabolicRiskFactors++;
      riskDetails.push(`Triglycerides ${trigValue} mg/dL (elevated)`);
    }
  }

  // Check Body Composition
  if (bodyComposition.hasBodyComposition) {
    if (bodyComposition.visceralFatLevel !== null && bodyComposition.visceralFatLevel > 10) {
      metabolicRiskFactors++;
      riskDetails.push(`Visceral fat ${bodyComposition.visceralFatLevel} (elevated)`);
    }
    if (bodyComposition.bodyFatPercentage !== null && bodyComposition.bodyFatPercentage > 25) {
      metabolicRiskFactors++;
      riskDetails.push(`Body fat ${bodyComposition.bodyFatPercentage}% (high)`);
    }
  }

  // If 3+ risk factors, escalate
  if (metabolicRiskFactors >= 3) {
    signals.push({
      id: `fusion-metabolic-risk-compound-${Date.now()}`,
      type: 'risk',
      category: 'metabolic',
      severity: 'critical',
      title: 'Compounding Metabolic Risk Factors',
      description: `${metabolicRiskFactors} metabolic risk factors detected: ${riskDetails.join(', ')}. Comprehensive metabolic intervention recommended.`,
      dataSources: ['bloodwork', 'body_composition', 'supplements'],
      actionable: true,
      suggestedAction: 'Comprehensive metabolic optimization: diet, exercise, supplements, medical consultation',
      confidence: 0.95,
    });
  }

  return signals;
}

/**
 * 7. Hormonal Optimization Fusion
 * Detect hormonal optimization opportunities
 */
function generateHormonalOptimizationFusion(baseline: any, bloodwork: any, bodyComposition: any, supplements: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  if (!bloodwork.hasBloodwork || baseline.sex !== 'male') return signals;

  // Low Testosterone + Multiple Factors
  if (bloodwork.markers.totalTestosterone) {
    const testValue = getMarkerValue(bloodwork.markers.totalTestosterone);
    if (testValue !== null && testValue < 500) {
      const optimizationFactors: string[] = [];
      
      // Check Vitamin D
      if (bloodwork.markers.vitaminD) {
        const vitDValue = getMarkerValue(bloodwork.markers.vitaminD);
        if (vitDValue !== null && vitDValue < 30) {
          optimizationFactors.push('Low Vitamin D');
        }
      }
      
      // Check Zinc supplementation
      if (supplements.hasSupplementStack && !hasIngredient(supplements, 'zinc')) {
        optimizationFactors.push('No Zinc supplementation');
      }
      
      // Check body composition
      if (bodyComposition.hasBodyComposition && bodyComposition.bodyFatPercentage !== null && bodyComposition.bodyFatPercentage > 20) {
        optimizationFactors.push('Elevated body fat');
      }
      
      if (optimizationFactors.length > 0) {
        signals.push({
          id: `fusion-testosterone-optimization-${Date.now()}`,
          type: 'optimization',
          category: 'hormonal',
          severity: 'high',
          title: 'Testosterone Optimization Opportunity',
          description: `Testosterone is ${testValue} ng/dL (suboptimal). Optimization factors: ${optimizationFactors.join(', ')}.`,
          dataSources: ['bloodwork', 'body_composition', 'supplements', 'baseline'],
          actionable: true,
          suggestedAction: 'Optimize Vitamin D, add Zinc, reduce body fat, improve sleep quality',
          confidence: 0.85,
        });
      }
    }
  }

  return signals;
}

/**
 * 8. Recovery Optimization Fusion
 * Detect recovery optimization opportunities
 */
function generateRecoveryOptimizationFusion(bloodwork: any, bodyComposition: any, supplements: any): FusionSignal[] {
  const signals: FusionSignal[] = [];

  // Low Magnesium + No Magnesium Supplement
  if (bloodwork.hasBloodwork && bloodwork.markers.magnesium) {
    const magValue = getMarkerValue(bloodwork.markers.magnesium);
    if (magValue !== null && magValue < 2.0) {
      const hasMagnesium = supplements.hasSupplementStack && hasIngredient(supplements, 'magnesium');
      
      if (!hasMagnesium) {
        signals.push({
          id: `fusion-recovery-magnesium-${Date.now()}`,
          type: 'optimization',
          category: 'recovery',
          severity: 'moderate',
          title: 'Recovery Optimization - Magnesium',
          description: `Magnesium is ${magValue} mg/dL (low). Magnesium supplementation may improve sleep quality and muscle recovery.`,
          dataSources: ['bloodwork', 'supplements'],
          actionable: true,
          suggestedAction: 'Add Magnesium Glycinate 400mg evening for recovery support',
          confidence: 0.85,
        });
      }
    }
  }

  return signals;
}

/**
 * Phase 12: Device Intelligence Fusion Signals
 * Convert device fusion signals into FusionSignal format
 */
function generateDeviceFusionSignals(deviceSignals: DeviceFusionSignals): FusionSignal[] {
  const signals: FusionSignal[] = [];

  // Poor sleep + declining HRV → recovery alert
  if (deviceSignals.poorSleepWithDecliningHRV && deviceSignals.recoveryAlert) {
    signals.push({
      id: `fusion-device-poor-sleep-low-hrv-${Date.now()}`,
      type: 'risk',
      category: 'recovery',
      severity: 'high',
      title: 'Recovery Alert: Poor Sleep + Low HRV',
      description: 'Poor sleep quality combined with declining HRV indicates inadequate recovery. This increases injury risk and reduces training effectiveness.',
      dataSources: ['device_sleep', 'device_hrv'],
      actionable: true,
      suggestedAction: 'Take a recovery day or reduce training intensity by 40%. Prioritize sleep quality tonight.',
      confidence: 0.9,
    });
  }

  // High HRV + strong activity → performance opportunity
  if (deviceSignals.highHRVWithStrongActivity && deviceSignals.performanceOpportunity) {
    signals.push({
      id: `fusion-device-high-hrv-strong-activity-${Date.now()}`,
      type: 'optimization',
      category: 'training',
      severity: 'moderate',
      title: 'Performance Opportunity: Optimal Recovery State',
      description: 'High HRV combined with strong activity levels indicates excellent recovery. This is an ideal time for high-intensity training or progressive overload.',
      dataSources: ['device_hrv', 'device_activity'],
      actionable: true,
      suggestedAction: 'Consider increasing training intensity or attempting a new personal record.',
      confidence: 0.85,
    });
  }

  // High BP + low activity → cardiovascular risk
  if (deviceSignals.highBPWithLowActivity && deviceSignals.cardiovascularRisk) {
    signals.push({
      id: `fusion-device-high-bp-low-activity-${Date.now()}`,
      type: 'risk',
      category: 'cardiovascular',
      severity: 'high',
      title: 'Cardiovascular Risk: Elevated BP + Sedentary Behavior',
      description: 'Elevated blood pressure combined with low activity levels increases cardiovascular risk. Regular movement is critical for BP management.',
      dataSources: ['device_bp', 'device_activity'],
      actionable: true,
      suggestedAction: 'Increase daily movement to 8,000+ steps. Add 20-30 minutes of moderate cardio 3-4x per week.',
      confidence: 0.88,
    });
  }

  // Low sleep + heavy training → overtraining detection
  if (deviceSignals.lowSleepWithHeavyTraining && deviceSignals.overtrainingDetection) {
    signals.push({
      id: `fusion-device-low-sleep-heavy-training-${Date.now()}`,
      type: 'risk',
      category: 'training',
      severity: 'critical',
      title: 'Overtraining Risk: Sleep Debt + High Training Load',
      description: 'Significant sleep debt combined with heavy training load indicates overtraining risk. Recovery is insufficient for current training demands.',
      dataSources: ['device_sleep', 'device_activity', 'device_workouts'],
      actionable: true,
      suggestedAction: 'Reduce training volume by 50% and prioritize sleep recovery for 3-5 days.',
      confidence: 0.92,
    });
  }

  return signals;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate data completeness score (0-100)
 */
function calculateCompletenessScore(bloodwork: any, bodyComposition: any, supplements: any): number {
  let score = 25; // Baseline always present
  
  if (bloodwork.hasBloodwork) score += 25;
  if (bodyComposition.hasBodyComposition) score += 25;
  if (supplements.hasSupplementStack) score += 25;
  
  return score;
}

/**
 * Get fusion signals by category
 */
export function getFusionSignalsByCategory(
  fusionContext: HealthIntelligenceFusionContext,
  category: FusionSignalCategory
): FusionSignal[] {
  return fusionContext.fusionSignals.filter(s => s.category === category);
}

/**
 * Get fusion signals by severity
 */
export function getFusionSignalsBySeverity(
  fusionContext: HealthIntelligenceFusionContext,
  severity: FusionSignalSeverity
): FusionSignal[] {
  return fusionContext.fusionSignals.filter(s => s.severity === severity);
}

/**
 * Get actionable fusion signals
 */
export function getActionableFusionSignals(
  fusionContext: HealthIntelligenceFusionContext
): FusionSignal[] {
  return fusionContext.fusionSignals.filter(s => s.actionable);
}

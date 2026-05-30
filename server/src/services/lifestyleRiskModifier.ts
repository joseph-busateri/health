/**
 * Lifestyle Risk Modifier
 * Adjusts actuarial risk based on lifestyle and fitness factors
 * 
 * Modifies base risk (Framingham/ASCVD) based on:
 * - Exercise frequency and intensity
 * - VO2 max (cardiorespiratory fitness)
 * - Body composition (BMI, body fat %)
 * - Diet quality
 * - Sleep quality
 * - Stress management
 * 
 * Research shows that lifestyle factors can reduce cardiovascular risk by 20-40%
 * even in the presence of traditional risk factors.
 */

import { logger } from '../utils/logger';

// ============================================================================
// LIFESTYLE RISK MODIFIER
// ============================================================================

export interface LifestyleFactors {
  exerciseFrequency: number; // days per week (0-7)
  exerciseIntensity?: 'light' | 'moderate' | 'vigorous';
  vo2Max?: number; // ml/kg/min
  bmi: number;
  bodyFatPercent?: number;
  dietQuality: 'poor' | 'fair' | 'good' | 'excellent';
  sleepQuality: number; // 0-100
  stressLevel: number; // 0-100
  alcoholConsumption?: 'none' | 'light' | 'moderate' | 'heavy';
}

export interface RiskModificationResult {
  originalRisk: number;
  modifiedRisk: number;
  riskReduction: number; // % reduction (negative = increase)
  exerciseAdjustment: number;
  fitnessAdjustment: number;
  bodyCompositionAdjustment: number;
  dietAdjustment: number;
  sleepAdjustment: number;
  stressAdjustment: number;
  alcoholAdjustment: number;
  totalAdjustment: number;
}

/**
 * Calculate lifestyle-adjusted cardiovascular risk
 * Returns modified risk percentage with breakdown of adjustments
 */
export function calculateLifestyleModifiedRisk(
  baseRisk: number,
  lifestyle: LifestyleFactors
): RiskModificationResult {
  logger.info('🏃 [LIFESTYLE] Calculating lifestyle risk modification', {
    baseRisk: baseRisk.toFixed(1),
    exerciseFrequency: lifestyle.exerciseFrequency,
  });

  // Calculate individual adjustments
  const exerciseAdjustment = calculateExerciseAdjustment(
    lifestyle.exerciseFrequency,
    lifestyle.exerciseIntensity
  );
  const fitnessAdjustment = calculateFitnessAdjustment(lifestyle.vo2Max);
  const bodyCompositionAdjustment = calculateBodyCompositionAdjustment(
    lifestyle.bmi,
    lifestyle.bodyFatPercent
  );
  const dietAdjustment = calculateDietAdjustment(lifestyle.dietQuality);
  const sleepAdjustment = calculateSleepAdjustment(lifestyle.sleepQuality);
  const stressAdjustment = calculateStressAdjustment(lifestyle.stressLevel);
  const alcoholAdjustment = calculateAlcoholAdjustment(lifestyle.alcoholConsumption);

  // Total adjustment (sum of all factors)
  const totalAdjustment =
    exerciseAdjustment +
    fitnessAdjustment +
    bodyCompositionAdjustment +
    dietAdjustment +
    sleepAdjustment +
    stressAdjustment +
    alcoholAdjustment;

  // Apply adjustment to base risk (multiplicative)
  const modifiedRisk = baseRisk * (1 + totalAdjustment);

  // Clamp to valid range (0-100%)
  const clampedRisk = Math.max(0, Math.min(100, modifiedRisk));

  // Calculate risk reduction percentage
  const riskReduction = ((baseRisk - clampedRisk) / baseRisk) * 100;

  logger.info('✅ [LIFESTYLE] Risk modification complete', {
    originalRisk: baseRisk.toFixed(1),
    modifiedRisk: clampedRisk.toFixed(1),
    riskReduction: riskReduction.toFixed(1),
    totalAdjustment: (totalAdjustment * 100).toFixed(1),
  });

  return {
    originalRisk: baseRisk,
    modifiedRisk: clampedRisk,
    riskReduction,
    exerciseAdjustment,
    fitnessAdjustment,
    bodyCompositionAdjustment,
    dietAdjustment,
    sleepAdjustment,
    stressAdjustment,
    alcoholAdjustment,
    totalAdjustment,
  };
}

// ============================================================================
// EXERCISE ADJUSTMENT
// ============================================================================

function calculateExerciseAdjustment(
  frequency: number,
  intensity?: 'light' | 'moderate' | 'vigorous'
): number {
  // Research: 150 min/week moderate exercise reduces CVD risk by ~20-30%
  // 75 min/week vigorous exercise has similar benefit

  let adjustment = 0;

  // Base adjustment by frequency
  if (frequency >= 5) {
    adjustment = -0.25; // 25% risk reduction
  } else if (frequency >= 3) {
    adjustment = -0.15; // 15% risk reduction
  } else if (frequency >= 1) {
    adjustment = -0.05; // 5% risk reduction
  } else {
    adjustment = 0.10; // 10% risk increase (sedentary)
  }

  // Intensity modifier
  if (intensity === 'vigorous' && frequency >= 3) {
    adjustment -= 0.05; // Additional 5% reduction for vigorous exercise
  } else if (intensity === 'light' && frequency < 3) {
    adjustment += 0.05; // Less benefit from light exercise
  }

  return adjustment;
}

// ============================================================================
// FITNESS ADJUSTMENT (VO2 MAX)
// ============================================================================

function calculateFitnessAdjustment(vo2Max?: number): number {
  if (!vo2Max) return 0;

  // Research: Each 1 MET (3.5 ml/kg/min) increase in VO2 max
  // reduces CVD mortality by ~13-15%

  // Fitness categories (ml/kg/min):
  // Poor: <25 (men), <20 (women)
  // Fair: 25-33 (men), 20-27 (women)
  // Good: 34-42 (men), 28-36 (women)
  // Excellent: 43-52 (men), 37-45 (women)
  // Superior: >52 (men), >45 (women)

  if (vo2Max >= 50) {
    return -0.30; // 30% risk reduction (superior fitness)
  } else if (vo2Max >= 42) {
    return -0.20; // 20% risk reduction (excellent fitness)
  } else if (vo2Max >= 34) {
    return -0.10; // 10% risk reduction (good fitness)
  } else if (vo2Max >= 25) {
    return 0; // Average fitness (no adjustment)
  } else {
    return 0.15; // 15% risk increase (poor fitness)
  }
}

// ============================================================================
// BODY COMPOSITION ADJUSTMENT
// ============================================================================

function calculateBodyCompositionAdjustment(
  bmi: number,
  bodyFatPercent?: number
): number {
  let adjustment = 0;

  // BMI adjustment
  if (bmi < 18.5) {
    adjustment += 0.05; // Underweight: slight risk increase
  } else if (bmi < 25) {
    adjustment -= 0.05; // Normal weight: slight risk reduction
  } else if (bmi < 30) {
    adjustment += 0.10; // Overweight: 10% risk increase
  } else if (bmi < 35) {
    adjustment += 0.20; // Obese I: 20% risk increase
  } else {
    adjustment += 0.30; // Obese II+: 30% risk increase
  }

  // Body fat percentage adjustment (more accurate than BMI)
  if (bodyFatPercent) {
    // Men: <15% excellent, 15-20% good, 20-25% fair, >25% poor
    // Women: <20% excellent, 20-25% good, 25-30% fair, >30% poor
    // Using conservative thresholds

    if (bodyFatPercent < 15) {
      adjustment -= 0.10; // Excellent body composition
    } else if (bodyFatPercent < 20) {
      adjustment -= 0.05; // Good body composition
    } else if (bodyFatPercent < 25) {
      adjustment += 0; // Average body composition
    } else if (bodyFatPercent < 30) {
      adjustment += 0.10; // Elevated body fat
    } else {
      adjustment += 0.15; // High body fat
    }
  }

  return adjustment;
}

// ============================================================================
// DIET ADJUSTMENT
// ============================================================================

function calculateDietAdjustment(dietQuality: 'poor' | 'fair' | 'good' | 'excellent'): number {
  // Research: Mediterranean diet reduces CVD risk by ~25-30%
  // DASH diet reduces CVD risk by ~20%

  const dietAdjustmentMap = {
    excellent: -0.25, // 25% risk reduction (Mediterranean/DASH)
    good: -0.15,      // 15% risk reduction (mostly healthy)
    fair: 0,          // No adjustment (average diet)
    poor: 0.20,       // 20% risk increase (high processed foods, sodium)
  };

  return dietAdjustmentMap[dietQuality];
}

// ============================================================================
// SLEEP ADJUSTMENT
// ============================================================================

function calculateSleepAdjustment(sleepQuality: number): number {
  // Research: Poor sleep (<6 hrs or >9 hrs) increases CVD risk by ~20-30%
  // Good sleep (7-8 hrs, high quality) is protective

  if (sleepQuality >= 80) {
    return -0.10; // 10% risk reduction (excellent sleep)
  } else if (sleepQuality >= 60) {
    return 0; // No adjustment (adequate sleep)
  } else if (sleepQuality >= 40) {
    return 0.10; // 10% risk increase (poor sleep)
  } else {
    return 0.20; // 20% risk increase (very poor sleep)
  }
}

// ============================================================================
// STRESS ADJUSTMENT
// ============================================================================

function calculateStressAdjustment(stressLevel: number): number {
  // Research: Chronic stress increases CVD risk by ~20-40%
  // Stress management reduces risk

  if (stressLevel < 30) {
    return -0.05; // 5% risk reduction (low stress)
  } else if (stressLevel < 50) {
    return 0; // No adjustment (moderate stress)
  } else if (stressLevel < 70) {
    return 0.10; // 10% risk increase (high stress)
  } else {
    return 0.20; // 20% risk increase (very high stress)
  }
}

// ============================================================================
// ALCOHOL ADJUSTMENT
// ============================================================================

function calculateAlcoholAdjustment(
  alcoholConsumption?: 'none' | 'light' | 'moderate' | 'heavy'
): number {
  if (!alcoholConsumption) return 0;

  // Research: J-shaped curve for alcohol and CVD risk
  // Light-moderate: slight protective effect
  // Heavy: significant risk increase

  const alcoholAdjustmentMap = {
    none: 0,          // No adjustment
    light: -0.05,     // 5% risk reduction (1 drink/day)
    moderate: 0,      // No adjustment (2 drinks/day)
    heavy: 0.25,      // 25% risk increase (>3 drinks/day)
  };

  return alcoholAdjustmentMap[alcoholConsumption];
}

// ============================================================================
// RISK MODIFICATION SUMMARY
// ============================================================================

export interface RiskModificationSummary {
  category: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendations: string[];
}

/**
 * Generate risk modification summary with recommendations
 */
export function generateRiskModificationSummary(
  result: RiskModificationResult
): RiskModificationSummary {
  const riskReduction = result.riskReduction;

  let category: 'excellent' | 'good' | 'fair' | 'poor';
  let description: string;
  const recommendations: string[] = [];

  // Categorize overall lifestyle impact
  if (riskReduction >= 20) {
    category = 'excellent';
    description = 'Lifestyle factors are significantly reducing cardiovascular risk';
  } else if (riskReduction >= 10) {
    category = 'good';
    description = 'Lifestyle factors are moderately reducing cardiovascular risk';
  } else if (riskReduction >= 0) {
    category = 'fair';
    description = 'Lifestyle factors have minimal impact on cardiovascular risk';
  } else {
    category = 'poor';
    description = 'Lifestyle factors are increasing cardiovascular risk';
  }

  // Generate specific recommendations based on weak areas
  if (result.exerciseAdjustment >= 0) {
    recommendations.push('Increase exercise frequency to 3-5 days per week');
  }

  if (result.fitnessAdjustment >= 0) {
    recommendations.push('Improve cardiorespiratory fitness through aerobic training');
  }

  if (result.bodyCompositionAdjustment > 0.10) {
    recommendations.push('Achieve healthy body composition through diet and exercise');
  }

  if (result.dietAdjustment >= 0) {
    recommendations.push('Adopt heart-healthy diet (Mediterranean or DASH)');
  }

  if (result.sleepAdjustment > 0) {
    recommendations.push('Improve sleep quality and duration (7-8 hours)');
  }

  if (result.stressAdjustment > 0) {
    recommendations.push('Implement stress management techniques');
  }

  if (result.alcoholAdjustment > 0) {
    recommendations.push('Reduce alcohol consumption to moderate levels');
  }

  return {
    category,
    description,
    recommendations,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateLifestyleFactors(lifestyle: LifestyleFactors): string[] {
  const errors: string[] = [];

  if (lifestyle.exerciseFrequency < 0 || lifestyle.exerciseFrequency > 7) {
    errors.push('Exercise frequency must be between 0 and 7 days per week');
  }

  if (lifestyle.vo2Max && (lifestyle.vo2Max < 10 || lifestyle.vo2Max > 80)) {
    errors.push('VO2 max must be between 10 and 80 ml/kg/min');
  }

  if (lifestyle.bmi < 15 || lifestyle.bmi > 50) {
    errors.push('BMI must be between 15 and 50');
  }

  if (lifestyle.bodyFatPercent && (lifestyle.bodyFatPercent < 3 || lifestyle.bodyFatPercent > 60)) {
    errors.push('Body fat percentage must be between 3 and 60%');
  }

  if (lifestyle.sleepQuality < 0 || lifestyle.sleepQuality > 100) {
    errors.push('Sleep quality must be between 0 and 100');
  }

  if (lifestyle.stressLevel < 0 || lifestyle.stressLevel > 100) {
    errors.push('Stress level must be between 0 and 100');
  }

  return errors;
}

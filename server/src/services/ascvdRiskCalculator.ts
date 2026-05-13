/**
 * ASCVD Risk Calculator (Pooled Cohort Equations)
 * 10-year atherosclerotic cardiovascular disease risk prediction
 * Based on ACC/AHA 2013 Guidelines
 * 
 * Reference: Goff DC Jr, et al. 2013 ACC/AHA guideline on the assessment of cardiovascular risk.
 * Circulation. 2014;129(25 Suppl 2):S49-73.
 * 
 * Age range: 40-79 years (validated range)
 * Predicts: Heart attack, stroke, and cardiovascular death
 */

import { logger } from '../utils/logger';

// ============================================================================
// ASCVD RISK CALCULATION
// ============================================================================

export interface ASCVDInputs {
  age: number;
  gender: 'male' | 'female';
  race: 'white' | 'black' | 'other'; // Other includes Asian, Hispanic, etc.
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number; // mg/dL
  systolicBP: number; // mmHg
  onBPmedication: boolean;
  smoking: boolean;
  diabetes: boolean;
}

export interface ASCVDResult {
  riskPercentage: number; // 0-100
  riskCategory: 'low' | 'borderline' | 'intermediate' | 'high';
  lifetimeRisk?: number; // Optional: lifetime risk estimate
}

/**
 * Calculate ASCVD Risk using Pooled Cohort Equations
 * Returns 10-year ASCVD risk percentage
 */
export function calculateASCVDRisk(inputs: ASCVDInputs): ASCVDResult {
  logger.info('🧮 [ASCVD] Calculating risk score', {
    age: inputs.age,
    gender: inputs.gender,
    race: inputs.race,
  });

  // Validate age range
  if (inputs.age < 40 || inputs.age > 79) {
    logger.warn('⚠️ [ASCVD] Age outside validated range (40-79)', { age: inputs.age });
  }

  // Select appropriate equation based on race and gender
  const riskPercentage = calculateRiskByRaceGender(inputs);

  // Determine risk category
  const riskCategory = determineASCVDRiskCategory(riskPercentage);

  // Calculate lifetime risk (optional, simplified estimate)
  const lifetimeRisk = estimateLifetimeRisk(inputs);

  logger.info('✅ [ASCVD] Risk calculation complete', {
    riskPercentage: riskPercentage.toFixed(1),
    riskCategory,
    lifetimeRisk: lifetimeRisk?.toFixed(1),
  });

  return {
    riskPercentage,
    riskCategory,
    lifetimeRisk,
  };
}

// ============================================================================
// RACE/GENDER-SPECIFIC CALCULATIONS
// ============================================================================

function calculateRiskByRaceGender(inputs: ASCVDInputs): number {
  const { gender, race } = inputs;

  if (gender === 'male' && race === 'white') {
    return calculateWhiteMaleRisk(inputs);
  } else if (gender === 'male' && race === 'black') {
    return calculateBlackMaleRisk(inputs);
  } else if (gender === 'female' && race === 'white') {
    return calculateWhiteFemaleRisk(inputs);
  } else if (gender === 'female' && race === 'black') {
    return calculateBlackFemaleRisk(inputs);
  } else {
    // For other races, use white equations (most conservative)
    logger.info('ℹ️ [ASCVD] Using white equations for other race', { race });
    return gender === 'male'
      ? calculateWhiteMaleRisk(inputs)
      : calculateWhiteFemaleRisk(inputs);
  }
}

// ============================================================================
// WHITE MALE EQUATION
// ============================================================================

function calculateWhiteMaleRisk(inputs: ASCVDInputs): number {
  const lnAge = Math.log(inputs.age);
  const lnTotalChol = Math.log(inputs.totalCholesterol);
  const lnHDL = Math.log(inputs.hdlCholesterol);
  const lnSBP = inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const lnSBPUntreated = !inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const smoking = inputs.smoking ? 1 : 0;
  const diabetes = inputs.diabetes ? 1 : 0;

  // Coefficients for white males
  const coefficients = {
    lnAge: 12.344,
    lnTotalChol: 11.853,
    lnAgeXlnTotalChol: -2.664,
    lnHDL: -7.990,
    lnAgeXlnHDL: 1.769,
    lnSBPTreated: 1.797,
    lnSBPUntreated: 1.764,
    smoking: 7.837,
    lnAgeXSmoking: -1.795,
    diabetes: 0.658,
  };

  const individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnAgeXlnTotalChol * lnAge * lnTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnAgeXlnHDL * lnAge * lnHDL +
    coefficients.lnSBPTreated * lnSBP +
    coefficients.lnSBPUntreated * lnSBPUntreated +
    coefficients.smoking * smoking +
    coefficients.lnAgeXSmoking * lnAge * smoking +
    coefficients.diabetes * diabetes;

  const meanCoefficient = 61.18;
  const baselineSurvival = 0.9144;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));
  return Math.max(0, Math.min(100, risk * 100));
}

// ============================================================================
// BLACK MALE EQUATION
// ============================================================================

function calculateBlackMaleRisk(inputs: ASCVDInputs): number {
  const lnAge = Math.log(inputs.age);
  const lnTotalChol = Math.log(inputs.totalCholesterol);
  const lnHDL = Math.log(inputs.hdlCholesterol);
  const lnSBP = inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const lnSBPUntreated = !inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const smoking = inputs.smoking ? 1 : 0;
  const diabetes = inputs.diabetes ? 1 : 0;

  // Coefficients for black males
  const coefficients = {
    lnAge: 2.469,
    lnTotalChol: 0.302,
    lnHDL: -0.307,
    lnSBPTreated: 1.916,
    lnSBPUntreated: 1.809,
    smoking: 0.549,
    diabetes: 0.645,
  };

  const individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnSBPTreated * lnSBP +
    coefficients.lnSBPUntreated * lnSBPUntreated +
    coefficients.smoking * smoking +
    coefficients.diabetes * diabetes;

  const meanCoefficient = 19.54;
  const baselineSurvival = 0.8954;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));
  return Math.max(0, Math.min(100, risk * 100));
}

// ============================================================================
// WHITE FEMALE EQUATION
// ============================================================================

function calculateWhiteFemaleRisk(inputs: ASCVDInputs): number {
  const lnAge = Math.log(inputs.age);
  const lnTotalChol = Math.log(inputs.totalCholesterol);
  const lnHDL = Math.log(inputs.hdlCholesterol);
  const lnSBP = inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const lnSBPUntreated = !inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const smoking = inputs.smoking ? 1 : 0;
  const diabetes = inputs.diabetes ? 1 : 0;

  // Coefficients for white females
  const coefficients = {
    lnAge: -29.799,
    lnAgeSquared: 4.884,
    lnTotalChol: 13.540,
    lnAgeXlnTotalChol: -3.114,
    lnHDL: -13.578,
    lnAgeXlnHDL: 3.149,
    lnSBPTreated: 2.019,
    lnSBPUntreated: 1.957,
    smoking: 7.574,
    lnAgeXSmoking: -1.665,
    diabetes: 0.661,
  };

  const individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnAgeSquared * lnAge * lnAge +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnAgeXlnTotalChol * lnAge * lnTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnAgeXlnHDL * lnAge * lnHDL +
    coefficients.lnSBPTreated * lnSBP +
    coefficients.lnSBPUntreated * lnSBPUntreated +
    coefficients.smoking * smoking +
    coefficients.lnAgeXSmoking * lnAge * smoking +
    coefficients.diabetes * diabetes;

  const meanCoefficient = -29.18;
  const baselineSurvival = 0.9665;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));
  return Math.max(0, Math.min(100, risk * 100));
}

// ============================================================================
// BLACK FEMALE EQUATION
// ============================================================================

function calculateBlackFemaleRisk(inputs: ASCVDInputs): number {
  const lnAge = Math.log(inputs.age);
  const lnTotalChol = Math.log(inputs.totalCholesterol);
  const lnHDL = Math.log(inputs.hdlCholesterol);
  const lnSBP = inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const lnSBPUntreated = !inputs.onBPmedication
    ? Math.log(inputs.systolicBP)
    : 0;
  const smoking = inputs.smoking ? 1 : 0;
  const diabetes = inputs.diabetes ? 1 : 0;

  // Coefficients for black females
  const coefficients = {
    lnAge: 17.114,
    lnTotalChol: 0.940,
    lnHDL: -18.920,
    lnAgeXlnHDL: 4.475,
    lnSBPTreated: 29.291,
    lnAgeXlnSBPTreated: -6.432,
    lnSBPUntreated: 27.820,
    lnAgeXlnSBPUntreated: -6.087,
    smoking: 0.691,
    diabetes: 0.874,
  };

  const individualSum =
    coefficients.lnAge * lnAge +
    coefficients.lnTotalChol * lnTotalChol +
    coefficients.lnHDL * lnHDL +
    coefficients.lnAgeXlnHDL * lnAge * lnHDL +
    coefficients.lnSBPTreated * lnSBP +
    coefficients.lnAgeXlnSBPTreated * lnAge * lnSBP +
    coefficients.lnSBPUntreated * lnSBPUntreated +
    coefficients.lnAgeXlnSBPUntreated * lnAge * lnSBPUntreated +
    coefficients.smoking * smoking +
    coefficients.diabetes * diabetes;

  const meanCoefficient = 86.61;
  const baselineSurvival = 0.9533;

  const risk = 1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanCoefficient));
  return Math.max(0, Math.min(100, risk * 100));
}

// ============================================================================
// RISK CATEGORY DETERMINATION
// ============================================================================

function determineASCVDRiskCategory(
  riskPercentage: number
): 'low' | 'borderline' | 'intermediate' | 'high' {
  // ACC/AHA 2018 Guidelines
  if (riskPercentage < 5) return 'low';
  if (riskPercentage < 7.5) return 'borderline';
  if (riskPercentage < 20) return 'intermediate';
  return 'high';
}

// ============================================================================
// LIFETIME RISK ESTIMATION
// ============================================================================

function estimateLifetimeRisk(inputs: ASCVDInputs): number {
  // Simplified lifetime risk estimation
  // Based on number of major risk factors
  let riskFactorCount = 0;

  if (inputs.totalCholesterol >= 240) riskFactorCount++;
  if (inputs.hdlCholesterol < 40) riskFactorCount++;
  if (inputs.systolicBP >= 140) riskFactorCount++;
  if (inputs.smoking) riskFactorCount++;
  if (inputs.diabetes) riskFactorCount++;

  // Lifetime risk estimates (simplified)
  const lifetimeRiskTable: Record<number, number> = {
    0: 5,   // No risk factors: ~5% lifetime risk
    1: 27,  // 1 risk factor: ~27%
    2: 37,  // 2 risk factors: ~37%
    3: 48,  // 3 risk factors: ~48%
    4: 58,  // 4 risk factors: ~58%
    5: 69,  // 5 risk factors: ~69%
  };

  return lifetimeRiskTable[riskFactorCount] || 69;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateASCVDInputs(inputs: ASCVDInputs): string[] {
  const errors: string[] = [];

  if (inputs.age < 40 || inputs.age > 79) {
    errors.push('Age must be between 40 and 79 years');
  }

  if (inputs.totalCholesterol < 130 || inputs.totalCholesterol > 320) {
    errors.push('Total cholesterol must be between 130 and 320 mg/dL');
  }

  if (inputs.hdlCholesterol < 20 || inputs.hdlCholesterol > 100) {
    errors.push('HDL cholesterol must be between 20 and 100 mg/dL');
  }

  if (inputs.systolicBP < 90 || inputs.systolicBP > 200) {
    errors.push('Systolic BP must be between 90 and 200 mmHg');
  }

  return errors;
}

// ============================================================================
// RISK ENHANCERS (for borderline/intermediate risk)
// ============================================================================

export interface RiskEnhancers {
  familyHistory?: boolean; // Premature ASCVD in first-degree relative
  chronicKidneyDisease?: boolean; // eGFR < 60
  metabolicSyndrome?: boolean;
  chronicInflammation?: boolean; // e.g., RA, psoriasis
  earlyMenopause?: boolean; // <40 years
  preeclampsia?: boolean;
  southAsianAncestry?: boolean;
  ldlCholesterol?: number; // ≥160 mg/dL
  lipoproteinA?: number; // ≥50 mg/dL
  apoB?: number; // ≥130 mg/dL
  hsCRP?: number; // ≥2.0 mg/L
  anklebrachialIndex?: number; // <0.9
  cacScore?: number; // Coronary artery calcium score
}

/**
 * Evaluate risk enhancers for borderline/intermediate risk patients
 * Returns true if risk should be upgraded
 */
export function hasRiskEnhancers(enhancers: RiskEnhancers): boolean {
  const enhancerCount = [
    enhancers.familyHistory,
    enhancers.chronicKidneyDisease,
    enhancers.metabolicSyndrome,
    enhancers.chronicInflammation,
    enhancers.earlyMenopause,
    enhancers.preeclampsia,
    enhancers.southAsianAncestry,
    enhancers.ldlCholesterol && enhancers.ldlCholesterol >= 160,
    enhancers.lipoproteinA && enhancers.lipoproteinA >= 50,
    enhancers.apoB && enhancers.apoB >= 130,
    enhancers.hsCRP && enhancers.hsCRP >= 2.0,
    enhancers.anklebrachialIndex && enhancers.anklebrachialIndex < 0.9,
    enhancers.cacScore && enhancers.cacScore > 0,
  ].filter(Boolean).length;

  return enhancerCount >= 2;
}

/**
 * Framingham Risk Score Calculator
 * 10-year coronary heart disease (CHD) risk prediction
 * Based on 2008 Framingham Heart Study
 * 
 * Reference: D'Agostino RB Sr, et al. General cardiovascular risk profile for use in primary care.
 * Circulation. 2008;117(6):743-753.
 * 
 * Age range: 30-74 years
 */

import { logger } from '../utils/logger';

// ============================================================================
// FRAMINGHAM RISK SCORE CALCULATION
// ============================================================================

export interface FraminghamInputs {
  age: number;
  gender: 'male' | 'female';
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number; // mg/dL
  systolicBP: number; // mmHg
  onBPmedication: boolean;
  smoking: boolean;
  diabetes: boolean;
}

export interface FraminghamResult {
  riskPercentage: number; // 0-100
  points: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
}

/**
 * Calculate Framingham Risk Score
 * Returns 10-year CHD risk percentage
 */
export function calculateFraminghamRisk(inputs: FraminghamInputs): FraminghamResult {
  logger.info('🧮 [FRAMINGHAM] Calculating risk score', {
    age: inputs.age,
    gender: inputs.gender,
  });

  // Validate age range
  if (inputs.age < 30 || inputs.age > 74) {
    logger.warn('⚠️ [FRAMINGHAM] Age outside validated range (30-74)', { age: inputs.age });
  }

  // Calculate points based on gender
  const points = inputs.gender === 'male'
    ? calculateMalePoints(inputs)
    : calculateFemalePoints(inputs);

  // Convert points to risk percentage
  const riskPercentage = pointsToRiskPercentage(points, inputs.gender);

  // Determine risk category
  const riskCategory = determineRiskCategory(riskPercentage);

  logger.info('✅ [FRAMINGHAM] Risk calculation complete', {
    points,
    riskPercentage: riskPercentage.toFixed(1),
    riskCategory,
  });

  return {
    riskPercentage,
    points,
    riskCategory,
  };
}

// ============================================================================
// MALE POINT CALCULATION
// ============================================================================

function calculateMalePoints(inputs: FraminghamInputs): number {
  let points = 0;

  // Age points
  points += getMaleAgePoints(inputs.age);

  // Total cholesterol points (age-adjusted)
  points += getMaleTotalCholesterolPoints(inputs.age, inputs.totalCholesterol);

  // HDL cholesterol points
  points += getMaleHDLPoints(inputs.hdlCholesterol);

  // Systolic BP points (medication-adjusted)
  points += getMaleSystolicBPPoints(inputs.systolicBP, inputs.onBPmedication);

  // Smoking points (age-adjusted)
  if (inputs.smoking) {
    points += getMaleSmokerPoints(inputs.age);
  }

  // Diabetes points
  if (inputs.diabetes) {
    points += 10;
  }

  return points;
}

function getMaleAgePoints(age: number): number {
  if (age < 35) return -9;
  if (age < 40) return -4;
  if (age < 45) return 0;
  if (age < 50) return 3;
  if (age < 55) return 6;
  if (age < 60) return 8;
  if (age < 65) return 10;
  if (age < 70) return 11;
  return 12;
}

function getMaleTotalCholesterolPoints(age: number, totalChol: number): number {
  // Age-adjusted total cholesterol points
  if (totalChol < 160) {
    return age < 40 ? 0 : age < 50 ? 0 : age < 60 ? 0 : age < 70 ? 0 : 0;
  }
  if (totalChol < 200) {
    return age < 40 ? 4 : age < 50 ? 3 : age < 60 ? 2 : age < 70 ? 1 : 0;
  }
  if (totalChol < 240) {
    return age < 40 ? 7 : age < 50 ? 5 : age < 60 ? 3 : age < 70 ? 1 : 0;
  }
  if (totalChol < 280) {
    return age < 40 ? 9 : age < 50 ? 6 : age < 60 ? 4 : age < 70 ? 2 : 1;
  }
  // ≥280
  return age < 40 ? 11 : age < 50 ? 8 : age < 60 ? 5 : age < 70 ? 3 : 1;
}

function getMaleHDLPoints(hdl: number): number {
  if (hdl >= 60) return -1;
  if (hdl >= 50) return 0;
  if (hdl >= 40) return 1;
  return 2;
}

function getMaleSystolicBPPoints(systolic: number, onMedication: boolean): number {
  if (systolic < 120) {
    return onMedication ? 0 : 0;
  }
  if (systolic < 130) {
    return onMedication ? 1 : 0;
  }
  if (systolic < 140) {
    return onMedication ? 2 : 1;
  }
  if (systolic < 160) {
    return onMedication ? 2 : 1;
  }
  // ≥160
  return onMedication ? 3 : 2;
}

function getMaleSmokerPoints(age: number): number {
  if (age < 40) return 8;
  if (age < 50) return 5;
  if (age < 60) return 3;
  if (age < 70) return 1;
  return 1;
}

// ============================================================================
// FEMALE POINT CALCULATION
// ============================================================================

function calculateFemalePoints(inputs: FraminghamInputs): number {
  let points = 0;

  // Age points
  points += getFemaleAgePoints(inputs.age);

  // Total cholesterol points (age-adjusted)
  points += getFemaleTotalCholesterolPoints(inputs.age, inputs.totalCholesterol);

  // HDL cholesterol points
  points += getFemaleHDLPoints(inputs.hdlCholesterol);

  // Systolic BP points (medication-adjusted)
  points += getFemaleSystolicBPPoints(inputs.systolicBP, inputs.onBPmedication);

  // Smoking points (age-adjusted)
  if (inputs.smoking) {
    points += getFemaleSmokerPoints(inputs.age);
  }

  // Diabetes points
  if (inputs.diabetes) {
    points += 10;
  }

  return points;
}

function getFemaleAgePoints(age: number): number {
  if (age < 35) return -7;
  if (age < 40) return -3;
  if (age < 45) return 0;
  if (age < 50) return 3;
  if (age < 55) return 6;
  if (age < 60) return 8;
  if (age < 65) return 10;
  if (age < 70) return 12;
  return 14;
}

function getFemaleTotalCholesterolPoints(age: number, totalChol: number): number {
  // Age-adjusted total cholesterol points
  if (totalChol < 160) {
    return age < 40 ? 0 : age < 50 ? 0 : age < 60 ? 0 : age < 70 ? 0 : 0;
  }
  if (totalChol < 200) {
    return age < 40 ? 4 : age < 50 ? 3 : age < 60 ? 2 : age < 70 ? 1 : 1;
  }
  if (totalChol < 240) {
    return age < 40 ? 8 : age < 50 ? 6 : age < 60 ? 4 : age < 70 ? 2 : 1;
  }
  if (totalChol < 280) {
    return age < 40 ? 11 : age < 50 ? 8 : age < 60 ? 5 : age < 70 ? 3 : 2;
  }
  // ≥280
  return age < 40 ? 13 : age < 50 ? 10 : age < 60 ? 7 : age < 70 ? 4 : 2;
}

function getFemaleHDLPoints(hdl: number): number {
  if (hdl >= 60) return -1;
  if (hdl >= 50) return 0;
  if (hdl >= 40) return 1;
  return 2;
}

function getFemaleSystolicBPPoints(systolic: number, onMedication: boolean): number {
  if (systolic < 120) {
    return onMedication ? 0 : 0;
  }
  if (systolic < 130) {
    return onMedication ? 3 : 1;
  }
  if (systolic < 140) {
    return onMedication ? 4 : 2;
  }
  if (systolic < 160) {
    return onMedication ? 5 : 3;
  }
  // ≥160
  return onMedication ? 6 : 4;
}

function getFemaleSmokerPoints(age: number): number {
  if (age < 40) return 9;
  if (age < 50) return 7;
  if (age < 60) return 4;
  if (age < 70) return 2;
  return 1;
}

// ============================================================================
// POINTS TO RISK CONVERSION
// ============================================================================

function pointsToRiskPercentage(points: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return malePointsToRisk(points);
  }
  return femalePointsToRisk(points);
}

function malePointsToRisk(points: number): number {
  // Framingham male risk table
  const riskTable: Record<number, number> = {
    [-3]: 1, [-2]: 1, [-1]: 1, [0]: 1, [1]: 1, [2]: 2, [3]: 2, [4]: 2,
    [5]: 3, [6]: 4, [7]: 5, [8]: 6, [9]: 8, [10]: 10, [11]: 12, [12]: 16,
    [13]: 20, [14]: 25, [15]: 30, [16]: 30, [17]: 30,
  };

  // Clamp points to valid range
  const clampedPoints = Math.max(-3, Math.min(17, points));
  return riskTable[clampedPoints] || 30;
}

function femalePointsToRisk(points: number): number {
  // Framingham female risk table
  const riskTable: Record<number, number> = {
    [-2]: 1, [-1]: 1, [0]: 1, [1]: 1, [2]: 1, [3]: 1, [4]: 1, [5]: 2,
    [6]: 2, [7]: 3, [8]: 4, [9]: 5, [10]: 6, [11]: 8, [12]: 10, [13]: 12,
    [14]: 16, [15]: 20, [16]: 25, [17]: 30, [18]: 30, [19]: 30, [20]: 30,
  };

  // Clamp points to valid range
  const clampedPoints = Math.max(-2, Math.min(20, points));
  return riskTable[clampedPoints] || 30;
}

// ============================================================================
// RISK CATEGORY DETERMINATION
// ============================================================================

function determineRiskCategory(riskPercentage: number): 'low' | 'moderate' | 'high' | 'very_high' {
  if (riskPercentage < 10) return 'low';
  if (riskPercentage < 20) return 'moderate';
  if (riskPercentage < 30) return 'high';
  return 'very_high';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateFraminghamInputs(inputs: FraminghamInputs): string[] {
  const errors: string[] = [];

  if (inputs.age < 30 || inputs.age > 74) {
    errors.push('Age must be between 30 and 74 years');
  }

  if (inputs.totalCholesterol < 100 || inputs.totalCholesterol > 400) {
    errors.push('Total cholesterol must be between 100 and 400 mg/dL');
  }

  if (inputs.hdlCholesterol < 20 || inputs.hdlCholesterol > 100) {
    errors.push('HDL cholesterol must be between 20 and 100 mg/dL');
  }

  if (inputs.systolicBP < 90 || inputs.systolicBP > 200) {
    errors.push('Systolic BP must be between 90 and 200 mmHg');
  }

  return errors;
}

/**
 * Unit Tests for Actuarial Risk Calculators
 * Tests Framingham, ASCVD, and Lifestyle Risk Modifier
 */

import {
  calculateFraminghamRisk,
  validateFraminghamInputs,
  type FraminghamInputs,
} from '../framinghamRiskCalculator';
import {
  calculateASCVDRisk,
  validateASCVDInputs,
  hasRiskEnhancers,
  type ASCVDInputs,
} from '../ascvdRiskCalculator';
import {
  calculateLifestyleModifiedRisk,
  generateRiskModificationSummary,
  validateLifestyleFactors,
  type LifestyleFactors,
} from '../lifestyleRiskModifier';

// ============================================================================
// FRAMINGHAM RISK SCORE TESTS
// ============================================================================

describe('Framingham Risk Calculator', () => {
  describe('Low Risk Male', () => {
    it('should calculate low risk for healthy 40-year-old male', () => {
      const inputs: FraminghamInputs = {
        age: 40,
        gender: 'male',
        totalCholesterol: 180,
        hdlCholesterol: 55,
        systolicBP: 115,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateFraminghamRisk(inputs);

      expect(result.riskPercentage).toBeLessThan(5);
      expect(result.riskCategory).toBe('low');
    });
  });

  describe('Moderate Risk Male', () => {
    it('should calculate moderate risk for 55-year-old male with elevated cholesterol', () => {
      const inputs: FraminghamInputs = {
        age: 55,
        gender: 'male',
        totalCholesterol: 240,
        hdlCholesterol: 40,
        systolicBP: 135,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateFraminghamRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(10);
      expect(result.riskPercentage).toBeLessThan(20);
      expect(result.riskCategory).toBe('moderate');
    });
  });

  describe('High Risk Male', () => {
    it('should calculate high risk for 65-year-old male with multiple risk factors', () => {
      const inputs: FraminghamInputs = {
        age: 65,
        gender: 'male',
        totalCholesterol: 260,
        hdlCholesterol: 35,
        systolicBP: 150,
        onBPmedication: true,
        smoking: true,
        diabetes: true,
      };

      const result = calculateFraminghamRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(20);
      expect(['high', 'very_high']).toContain(result.riskCategory);
    });
  });

  describe('Female Risk Calculation', () => {
    it('should calculate risk for 50-year-old female', () => {
      const inputs: FraminghamInputs = {
        age: 50,
        gender: 'female',
        totalCholesterol: 200,
        hdlCholesterol: 60,
        systolicBP: 120,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateFraminghamRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(0);
      expect(result.riskPercentage).toBeLessThanOrEqual(100);
      expect(result.riskCategory).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate age range', () => {
      const inputs: FraminghamInputs = {
        age: 25,
        gender: 'male',
        totalCholesterol: 180,
        hdlCholesterol: 55,
        systolicBP: 115,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const errors = validateFraminghamInputs(inputs);
      expect(errors).toContain('Age must be between 30 and 74 years');
    });

    it('should validate cholesterol range', () => {
      const inputs: FraminghamInputs = {
        age: 50,
        gender: 'male',
        totalCholesterol: 500,
        hdlCholesterol: 55,
        systolicBP: 115,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const errors = validateFraminghamInputs(inputs);
      expect(errors).toContain('Total cholesterol must be between 100 and 400 mg/dL');
    });
  });
});

// ============================================================================
// ASCVD RISK CALCULATOR TESTS
// ============================================================================

describe('ASCVD Risk Calculator', () => {
  describe('Low Risk White Male', () => {
    it('should calculate low risk for healthy 45-year-old white male', () => {
      const inputs: ASCVDInputs = {
        age: 45,
        gender: 'male',
        race: 'white',
        totalCholesterol: 170,
        hdlCholesterol: 55,
        systolicBP: 115,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateASCVDRisk(inputs);

      expect(result.riskPercentage).toBeLessThan(5);
      expect(result.riskCategory).toBe('low');
    });
  });

  describe('Intermediate Risk Black Male', () => {
    it('should calculate intermediate risk for 60-year-old black male', () => {
      const inputs: ASCVDInputs = {
        age: 60,
        gender: 'male',
        race: 'black',
        totalCholesterol: 220,
        hdlCholesterol: 45,
        systolicBP: 140,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateASCVDRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(7.5);
      expect(['intermediate', 'high']).toContain(result.riskCategory);
    });
  });

  describe('High Risk White Female', () => {
    it('should calculate high risk for 70-year-old white female with diabetes', () => {
      const inputs: ASCVDInputs = {
        age: 70,
        gender: 'female',
        race: 'white',
        totalCholesterol: 240,
        hdlCholesterol: 40,
        systolicBP: 155,
        onBPmedication: true,
        smoking: true,
        diabetes: true,
      };

      const result = calculateASCVDRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(20);
      expect(result.riskCategory).toBe('high');
    });
  });

  describe('Black Female Risk Calculation', () => {
    it('should calculate risk for 55-year-old black female', () => {
      const inputs: ASCVDInputs = {
        age: 55,
        gender: 'female',
        race: 'black',
        totalCholesterol: 200,
        hdlCholesterol: 50,
        systolicBP: 130,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const result = calculateASCVDRisk(inputs);

      expect(result.riskPercentage).toBeGreaterThanOrEqual(0);
      expect(result.riskPercentage).toBeLessThanOrEqual(100);
      expect(result.lifetimeRisk).toBeDefined();
    });
  });

  describe('Risk Enhancers', () => {
    it('should identify risk enhancers', () => {
      const enhancers = {
        familyHistory: true,
        chronicKidneyDisease: true,
        ldlCholesterol: 170,
        hsCRP: 3.0,
      };

      const hasEnhancers = hasRiskEnhancers(enhancers);
      expect(hasEnhancers).toBe(true);
    });

    it('should not flag single risk enhancer', () => {
      const enhancers = {
        familyHistory: true,
      };

      const hasEnhancers = hasRiskEnhancers(enhancers);
      expect(hasEnhancers).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate age range', () => {
      const inputs: ASCVDInputs = {
        age: 35,
        gender: 'male',
        race: 'white',
        totalCholesterol: 180,
        hdlCholesterol: 55,
        systolicBP: 115,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const errors = validateASCVDInputs(inputs);
      expect(errors).toContain('Age must be between 40 and 79 years');
    });
  });
});

// ============================================================================
// LIFESTYLE RISK MODIFIER TESTS
// ============================================================================

describe('Lifestyle Risk Modifier', () => {
  const baseRisk = 10; // 10% baseline risk

  describe('Excellent Lifestyle', () => {
    it('should reduce risk for highly active individual with excellent lifestyle', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 5,
        exerciseIntensity: 'vigorous',
        vo2Max: 50,
        bmi: 23,
        bodyFatPercent: 12,
        dietQuality: 'excellent',
        sleepQuality: 85,
        stressLevel: 25,
        alcoholConsumption: 'light',
      };

      const result = calculateLifestyleModifiedRisk(baseRisk, lifestyle);

      expect(result.modifiedRisk).toBeLessThan(baseRisk);
      expect(result.riskReduction).toBeGreaterThan(20);
      expect(result.exerciseAdjustment).toBeLessThan(0);
      expect(result.fitnessAdjustment).toBeLessThan(0);
    });
  });

  describe('Poor Lifestyle', () => {
    it('should increase risk for sedentary individual with poor lifestyle', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 0,
        vo2Max: 20,
        bmi: 32,
        bodyFatPercent: 35,
        dietQuality: 'poor',
        sleepQuality: 40,
        stressLevel: 75,
        alcoholConsumption: 'heavy',
      };

      const result = calculateLifestyleModifiedRisk(baseRisk, lifestyle);

      expect(result.modifiedRisk).toBeGreaterThan(baseRisk);
      expect(result.riskReduction).toBeLessThan(0);
      expect(result.exerciseAdjustment).toBeGreaterThan(0);
    });
  });

  describe('Average Lifestyle', () => {
    it('should have minimal impact for average lifestyle', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 2,
        bmi: 25,
        dietQuality: 'fair',
        sleepQuality: 65,
        stressLevel: 50,
      };

      const result = calculateLifestyleModifiedRisk(baseRisk, lifestyle);

      expect(result.modifiedRisk).toBeCloseTo(baseRisk, 1);
      expect(Math.abs(result.riskReduction)).toBeLessThan(10);
    });
  });

  describe('Risk Modification Summary', () => {
    it('should generate excellent summary for optimal lifestyle', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 5,
        vo2Max: 50,
        bmi: 22,
        dietQuality: 'excellent',
        sleepQuality: 85,
        stressLevel: 20,
      };

      const result = calculateLifestyleModifiedRisk(baseRisk, lifestyle);
      const summary = generateRiskModificationSummary(result);

      expect(['excellent', 'good']).toContain(summary.category);
      expect(summary.recommendations.length).toBeLessThan(3);
    });

    it('should generate recommendations for poor lifestyle', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 0,
        bmi: 32,
        dietQuality: 'poor',
        sleepQuality: 40,
        stressLevel: 75,
      };

      const result = calculateLifestyleModifiedRisk(baseRisk, lifestyle);
      const summary = generateRiskModificationSummary(result);

      expect(['fair', 'poor']).toContain(summary.category);
      expect(summary.recommendations.length).toBeGreaterThan(3);
    });
  });

  describe('Input Validation', () => {
    it('should validate exercise frequency', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 10,
        bmi: 25,
        dietQuality: 'good',
        sleepQuality: 70,
        stressLevel: 40,
      };

      const errors = validateLifestyleFactors(lifestyle);
      expect(errors).toContain('Exercise frequency must be between 0 and 7 days per week');
    });

    it('should validate BMI range', () => {
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 3,
        bmi: 60,
        dietQuality: 'good',
        sleepQuality: 70,
        stressLevel: 40,
      };

      const errors = validateLifestyleFactors(lifestyle);
      expect(errors).toContain('BMI must be between 15 and 50');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Actuarial Risk Calculator Integration', () => {
  describe('User Profile: 59-year-old athletic male', () => {
    it('should calculate comprehensive risk with lifestyle modification', () => {
      // Base ASCVD risk
      const ascvdInputs: ASCVDInputs = {
        age: 59,
        gender: 'male',
        race: 'white',
        totalCholesterol: 180,
        hdlCholesterol: 55,
        systolicBP: 118,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const ascvdResult = calculateASCVDRisk(ascvdInputs);

      // Lifestyle modification
      const lifestyle: LifestyleFactors = {
        exerciseFrequency: 5,
        vo2Max: 46,
        bmi: 27.5,
        bodyFatPercent: 12,
        dietQuality: 'good',
        sleepQuality: 75,
        stressLevel: 45,
      };

      const modifiedResult = calculateLifestyleModifiedRisk(
        ascvdResult.riskPercentage,
        lifestyle
      );

      // Expectations
      expect(ascvdResult.riskPercentage).toBeGreaterThan(0);
      expect(modifiedResult.modifiedRisk).toBeLessThan(ascvdResult.riskPercentage);
      expect(modifiedResult.riskReduction).toBeGreaterThan(15);
    });
  });

  describe('Framingham vs ASCVD Comparison', () => {
    it('should produce similar results for same inputs', () => {
      const framinghamInputs: FraminghamInputs = {
        age: 55,
        gender: 'male',
        totalCholesterol: 200,
        hdlCholesterol: 50,
        systolicBP: 130,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const ascvdInputs: ASCVDInputs = {
        age: 55,
        gender: 'male',
        race: 'white',
        totalCholesterol: 200,
        hdlCholesterol: 50,
        systolicBP: 130,
        onBPmedication: false,
        smoking: false,
        diabetes: false,
      };

      const framinghamResult = calculateFraminghamRisk(framinghamInputs);
      const ascvdResult = calculateASCVDRisk(ascvdInputs);

      // Results should be within reasonable range of each other
      const difference = Math.abs(framinghamResult.riskPercentage - ascvdResult.riskPercentage);
      expect(difference).toBeLessThan(10); // Within 10% of each other
    });
  });
});

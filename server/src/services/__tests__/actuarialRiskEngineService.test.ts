/**
 * Unit Tests for Actuarial Risk Engine Service
 * Tests main engine logic, evidence builder, and recommendation generation
 */

import {
  calculateActuarialRisk,
  getActuarialRiskRecord,
  getActuarialRiskHistory,
  getAllActuarialRiskRecords,
} from '../actuarialRiskEngineService';
import type { ActuarialRiskInputs } from '../../types/actuarialRiskEngine';

// Mock dependencies
jest.mock('../framinghamRiskCalculator');
jest.mock('../ascvdRiskCalculator');
jest.mock('../lifestyleRiskModifier');
jest.mock('../recommendationEngineService');
jest.mock('../../utils/logger');

import { calculateFraminghamRisk } from '../framinghamRiskCalculator';
import { calculateASCVDRisk } from '../ascvdRiskCalculator';
import { calculateLifestyleModifiedRisk } from '../lifestyleRiskModifier';
import { createRecommendation } from '../recommendationEngineService';

const mockFraminghamRisk = calculateFraminghamRisk as jest.MockedFunction<typeof calculateFraminghamRisk>;
const mockASCVDRisk = calculateASCVDRisk as jest.MockedFunction<typeof calculateASCVDRisk>;
const mockLifestyleModifier = calculateLifestyleModifiedRisk as jest.MockedFunction<typeof calculateLifestyleModifiedRisk>;
const mockCreateRecommendation = createRecommendation as jest.MockedFunction<typeof createRecommendation>;

// ============================================================================
// TEST DATA
// ============================================================================

const lowRiskInputs: ActuarialRiskInputs = {
  demographic: {
    age: 45,
    gender: 'male',
    race: 'white',
    familyHistory: false,
    smokingStatus: 'never',
  },
  clinical: {
    systolicBP: 115,
    diastolicBP: 75,
    onBPmedication: false,
    totalCholesterol: 170,
    hdlCholesterol: 55,
    ldlCholesterol: 95,
    triglycerides: 90,
    diabetesStatus: 'none',
  },
  lifestyle: {
    exerciseFrequency: 5,
    vo2Max: 48,
    bmi: 23,
    bodyFatPercent: 12,
    dietQuality: 'excellent',
    sleepQuality: 85,
    stressLevel: 25,
  },
};

const moderateRiskInputs: ActuarialRiskInputs = {
  demographic: {
    age: 59,
    gender: 'male',
    race: 'white',
    familyHistory: false,
    smokingStatus: 'never',
  },
  clinical: {
    systolicBP: 118,
    diastolicBP: 74,
    onBPmedication: false,
    totalCholesterol: 180,
    hdlCholesterol: 55,
    ldlCholesterol: 102,
    triglycerides: 92,
    diabetesStatus: 'none',
    a1c: 6.1,
  },
  lifestyle: {
    exerciseFrequency: 5,
    vo2Max: 46,
    bmi: 27.5,
    bodyFatPercent: 12,
    dietQuality: 'good',
    sleepQuality: 75,
    stressLevel: 45,
  },
};

const highRiskInputs: ActuarialRiskInputs = {
  demographic: {
    age: 65,
    gender: 'male',
    race: 'white',
    familyHistory: true,
    smokingStatus: 'current',
  },
  clinical: {
    systolicBP: 150,
    diastolicBP: 92,
    onBPmedication: true,
    totalCholesterol: 240,
    hdlCholesterol: 38,
    ldlCholesterol: 160,
    triglycerides: 210,
    diabetesStatus: 'diabetes',
    a1c: 7.5,
  },
  lifestyle: {
    exerciseFrequency: 1,
    bmi: 32,
    bodyFatPercent: 30,
    dietQuality: 'poor',
    sleepQuality: 50,
    stressLevel: 75,
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('Actuarial Risk Engine Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCreateRecommendation.mockResolvedValue({
      success: true,
      recommendation: {} as any,
    });
  });

  describe('calculateActuarialRisk', () => {
    it('should calculate low risk for healthy individual', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 3.5,
        points: 5,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 4.0,
        riskCategory: 'low',
        lifetimeRisk: 25,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 3.75,
        modifiedRisk: 2.5,
        riskReduction: 33.3,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: -0.05,
        dietAdjustment: -0.25,
        sleepAdjustment: -0.10,
        stressAdjustment: -0.05,
        alcoholAdjustment: 0,
        totalAdjustment: -0.33,
      });

      const result = await calculateActuarialRisk('user-1', lowRiskInputs);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.evidence.combinedRiskCategory).toBe('low_risk');
      expect(result.evidence.combinedRiskPercentage).toBeLessThan(5);
      expect(result.recommendation.priority).toBe('optimization');
      expect(mockCreateRecommendation).toHaveBeenCalled();
    });

    it('should calculate moderate risk for 59-year-old with good lifestyle', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0.05,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      const result = await calculateActuarialRisk('user-2', moderateRiskInputs);

      expect(result).toBeDefined();
      expect(result.evidence.combinedRiskCategory).toBe('low_risk');
      expect(result.evidence.framinghamResult?.riskPercentage).toBe(6.0);
      expect(result.evidence.ascvdResult?.riskPercentage).toBe(6.5);
      expect(result.evidence.lifestyleAdjustment).toBeLessThan(0);
      expect(result.recommendation.riskReductionPotential).toBeGreaterThan(0);
    });

    it('should calculate high risk for individual with multiple risk factors', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 25.0,
        points: 15,
        riskCategory: 'high',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 28.0,
        riskCategory: 'high',
        lifetimeRisk: 65,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 26.5,
        modifiedRisk: 32.0,
        riskReduction: -20.8,
        exerciseAdjustment: 0.10,
        fitnessAdjustment: 0.15,
        bodyCompositionAdjustment: 0.15,
        dietAdjustment: 0.20,
        sleepAdjustment: 0.10,
        stressAdjustment: 0.10,
        alcoholAdjustment: 0,
        totalAdjustment: 0.21,
      });

      const result = await calculateActuarialRisk('user-3', highRiskInputs);

      expect(result).toBeDefined();
      expect(result.evidence.combinedRiskCategory).toBe('very_high_risk');
      expect(result.recommendation.priority).toBe('critical');
      expect(result.recommendation.primaryRiskDrivers.length).toBeGreaterThan(0);
      expect(result.recommendation.actions.length).toBeGreaterThan(5);
    });

    it('should include risk factor contributions in evidence', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      const result = await calculateActuarialRisk('user-4', moderateRiskInputs);

      expect(result.evidence.riskFactors).toBeDefined();
      expect(result.evidence.riskFactors.length).toBeGreaterThan(0);
      
      const ageRiskFactor = result.evidence.riskFactors.find(f => f.factor === 'Age');
      expect(ageRiskFactor).toBeDefined();
      expect(ageRiskFactor?.value).toContain('59');
    });

    it('should create recommendation in recommendation engine', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      await calculateActuarialRisk('user-5', moderateRiskInputs);

      expect(mockCreateRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-5',
          request: expect.objectContaining({
            sourceEngine: 'cardiovascular',
            priority: expect.any(String),
            category: 'health_monitoring',
            confidenceLevel: 'high',
          }),
        })
      );
    });
  });

  describe('getActuarialRiskRecord', () => {
    it('should retrieve most recent record when no date specified', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      await calculateActuarialRisk('user-6', moderateRiskInputs);
      const record = await getActuarialRiskRecord('user-6');

      expect(record).toBeDefined();
      expect(record?.userId).toBe('user-6');
    });

    it('should return null for user with no records', async () => {
      const record = await getActuarialRiskRecord('nonexistent-user');
      expect(record).toBeNull();
    });
  });

  describe('getActuarialRiskHistory', () => {
    it('should retrieve risk history for user', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      await calculateActuarialRisk('user-7', moderateRiskInputs);
      const history = await getActuarialRiskHistory('user-7', 30);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should return empty array for user with no history', async () => {
      const history = await getActuarialRiskHistory('nonexistent-user', 30);
      expect(history).toEqual([]);
    });
  });

  describe('getAllActuarialRiskRecords', () => {
    it('should retrieve all records for user', async () => {
      mockFraminghamRisk.mockReturnValue({
        riskPercentage: 6.0,
        points: 8,
        riskCategory: 'low',
      });

      mockASCVDRisk.mockReturnValue({
        riskPercentage: 6.5,
        riskCategory: 'borderline',
        lifetimeRisk: 35,
      });

      mockLifestyleModifier.mockReturnValue({
        originalRisk: 6.25,
        modifiedRisk: 4.5,
        riskReduction: 28.0,
        exerciseAdjustment: -0.25,
        fitnessAdjustment: -0.20,
        bodyCompositionAdjustment: 0,
        dietAdjustment: -0.15,
        sleepAdjustment: 0,
        stressAdjustment: 0,
        alcoholAdjustment: 0,
        totalAdjustment: -0.28,
      });

      await calculateActuarialRisk('user-8', moderateRiskInputs);
      await calculateActuarialRisk('user-8', lowRiskInputs);
      
      const allRecords = await getAllActuarialRiskRecords('user-8');

      expect(allRecords).toBeDefined();
      expect(allRecords.length).toBe(2);
    });
  });
});

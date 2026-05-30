/**
 * Unit Tests for Actuarial Data Unifier
 * Tests data aggregation from multiple engine sources
 */

import {
  unifyActuarialData,
  extractBloodPressure,
  extractCholesterol,
  extractDiabetesStatus,
  extractExerciseData,
  extractBodyComposition,
  extractSleepQuality,
  extractStressLevel,
} from '../actuarialDataUnifier';
import * as cardiovascularEngineService from '../cardiovascularEngineService';
import * as metabolicEngineService from '../metabolicEngineService';
import * as recoveryEngineService from '../recoveryEngineService';
import * as stressEngineService from '../stressEngineService';
import * as workoutEngineService from '../workoutEngineService';
import * as bodyCompositionContextService from '../bodyCompositionContextService';
import * as bloodworkContextService from '../bloodworkContextService';
import * as baselineContextService from '../baselineContextService';

// Mock logger
jest.mock('../../utils/logger');

// Mock all engine services
jest.mock('../cardiovascularEngineService');
jest.mock('../metabolicEngineService');
jest.mock('../recoveryEngineService');
jest.mock('../stressEngineService');
jest.mock('../workoutEngineService');
jest.mock('../bodyCompositionContextService');
jest.mock('../bloodworkContextService');
jest.mock('../baselineContextService');

describe('Actuarial Data Unifier', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unifyActuarialData', () => {
    it('should unify data from all sources successfully', async () => {
      // Mock baseline data
      (baselineContextService.getBaselineFields as jest.Mock).mockResolvedValue({
        age: 55,
        gender: 'male',
        race: 'white',
        familyHistory: true,
        smokingStatus: 'never',
        onBPmedication: false,
        dietQuality: 'good',
      });

      // Mock cardiovascular data
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'blood_pressure', value: { systolic: 130, diastolic: 85 } },
          ],
        },
      });

      // Mock bloodwork data
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue({
        markers: [
          { name: 'Total Cholesterol', value: 200 },
          { name: 'HDL Cholesterol', value: 50 },
          { name: 'LDL Cholesterol', value: 120 },
          { name: 'Triglycerides', value: 150 },
        ],
      });
      (bloodworkContextService.getMarkerValue as jest.Mock).mockImplementation((_, name) => {
        const markers: any = {
          'Total Cholesterol': 200,
          'HDL Cholesterol': 50,
          'LDL Cholesterol': 120,
          'Triglycerides': 150,
        };
        return markers[name];
      });

      // Mock metabolic data
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue({
        status: 'optimal',
      });

      // Mock workout data
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'exercise_frequency', value: 5 },
            { type: 'vo2_max', value: 45 },
          ],
        },
      });

      // Mock body composition data
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue({
        bmi: 24,
        bodyFatPercentage: 18,
      });

      // Mock recovery data
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'sleep_quality', value: 85 },
          ],
        },
      });

      // Mock stress data
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'stress_level', value: 40 },
          ],
        },
      });

      const result = await unifyActuarialData(userId);

      expect(result).toEqual({
        demographic: {
          age: 55,
          gender: 'male',
          race: 'white',
          familyHistory: true,
          smokingStatus: 'never',
        },
        clinical: {
          systolicBP: 130,
          diastolicBP: 85,
          onBPmedication: false,
          totalCholesterol: 200,
          hdlCholesterol: 50,
          ldlCholesterol: 120,
          triglycerides: 150,
          diabetesStatus: 'none',
        },
        lifestyle: {
          exerciseFrequency: 5,
          bmi: 24,
          dietQuality: 'good',
          sleepQuality: 85,
          stressLevel: 40,
          vo2Max: 45,
          bodyFatPercentage: 18,
          alcoholConsumption: undefined,
        },
        advanced: undefined,
      });
    });

    it('should use defaults when no data is available', async () => {
      // Mock all services to return null/undefined
      (baselineContextService.getBaselineFields as jest.Mock).mockResolvedValue(null);
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue(null);
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue(null);
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue(null);
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue(null);
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue(null);
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue(null);
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue(null);

      const result = await unifyActuarialData(userId);

      expect(result.demographic.age).toBe(50);
      expect(result.demographic.gender).toBe('male');
      expect(result.clinical.systolicBP).toBe(120);
      expect(result.clinical.diastolicBP).toBe(80);
      expect(result.lifestyle.exerciseFrequency).toBe(3);
      expect(result.lifestyle.bmi).toBe(25);
    });

    it('should apply overrides correctly', async () => {
      (baselineContextService.getBaselineFields as jest.Mock).mockResolvedValue(null);
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue(null);
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue(null);
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue(null);
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue(null);
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue(null);
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue(null);
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue(null);

      const overrides = {
        demographic: { age: 60, gender: 'female' as const },
        clinical: { systolicBP: 140 },
      };

      const result = await unifyActuarialData(userId, overrides);

      expect(result.demographic.age).toBe(60);
      expect(result.demographic.gender).toBe('female');
      expect(result.clinical.systolicBP).toBe(140);
    });

    it('should include advanced markers when available', async () => {
      (baselineContextService.getBaselineFields as jest.Mock).mockResolvedValue(null);
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue(null);
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue(null);
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue(null);
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue(null);
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue(null);
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue(null);

      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue({
        markers: [
          { name: 'hs-CRP', value: 1.5 },
          { name: 'Lipoprotein(a)', value: 30 },
        ],
      });
      (bloodworkContextService.getMarkerValue as jest.Mock).mockImplementation((_, name) => {
        const markers: any = {
          'hs-CRP': 1.5,
          'Lipoprotein(a)': 30,
        };
        return markers[name];
      });

      const result = await unifyActuarialData(userId);

      expect(result.advanced).toEqual({
        hsCRP: 1.5,
        lipoproteinA: 30,
      });
    });

    it('should handle errors gracefully', async () => {
      (baselineContextService.getBaselineFields as jest.Mock).mockRejectedValue(new Error('Service error'));
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockRejectedValue(new Error('Service error'));
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockRejectedValue(new Error('Service error'));
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockRejectedValue(new Error('Service error'));
      (workoutEngineService.getWorkoutToday as jest.Mock).mockRejectedValue(new Error('Service error'));
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockRejectedValue(new Error('Service error'));
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockRejectedValue(new Error('Service error'));
      (stressEngineService.getStressToday as jest.Mock).mockRejectedValue(new Error('Service error'));

      const result = await unifyActuarialData(userId);

      // Should still return data with defaults
      expect(result.demographic.age).toBe(50);
      expect(result.clinical.systolicBP).toBe(120);
      expect(result.lifestyle.exerciseFrequency).toBe(3);
    });
  });

  describe('extractBloodPressure', () => {
    it('should extract blood pressure from cardiovascular data', async () => {
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'blood_pressure', value: { systolic: 130, diastolic: 85 } },
          ],
        },
      });

      const result = await extractBloodPressure(userId);

      expect(result).toEqual({ systolic: 130, diastolic: 85 });
    });

    it('should return null when no data available', async () => {
      (cardiovascularEngineService.getCardiovascularToday as jest.Mock).mockResolvedValue(null);

      const result = await extractBloodPressure(userId);

      expect(result).toBeNull();
    });
  });

  describe('extractCholesterol', () => {
    it('should extract cholesterol from bloodwork data', async () => {
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue({});
      (bloodworkContextService.getMarkerValue as jest.Mock).mockImplementation((_, name) => {
        const markers: any = {
          'Total Cholesterol': 200,
          'HDL Cholesterol': 50,
          'LDL Cholesterol': 120,
          'Triglycerides': 150,
        };
        return markers[name];
      });

      const result = await extractCholesterol(userId);

      expect(result).toEqual({
        total: 200,
        hdl: 50,
        ldl: 120,
        triglycerides: 150,
      });
    });

    it('should return null when no data available', async () => {
      (bloodworkContextService.getLatestBloodworkContext as jest.Mock).mockResolvedValue(null);

      const result = await extractCholesterol(userId);

      expect(result).toBeNull();
    });
  });

  describe('extractDiabetesStatus', () => {
    it('should return diabetes for high_risk metabolic status', async () => {
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue({
        status: 'high_risk',
      });

      const result = await extractDiabetesStatus(userId);

      expect(result).toBe('diabetes');
    });

    it('should return prediabetes for elevated_risk metabolic status', async () => {
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue({
        status: 'elevated_risk',
      });

      const result = await extractDiabetesStatus(userId);

      expect(result).toBe('prediabetes');
    });

    it('should return none for optimal metabolic status', async () => {
      (metabolicEngineService.getMetabolicToday as jest.Mock).mockResolvedValue({
        status: 'optimal',
      });

      const result = await extractDiabetesStatus(userId);

      expect(result).toBe('none');
    });
  });

  describe('extractExerciseData', () => {
    it('should extract exercise data from workout engine', async () => {
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'exercise_frequency', value: 5 },
            { type: 'vo2_max', value: 45 },
          ],
        },
      });

      const result = await extractExerciseData(userId);

      expect(result).toEqual({ frequency: 5, vo2Max: 45 });
    });

    it('should return null when no data available', async () => {
      (workoutEngineService.getWorkoutToday as jest.Mock).mockResolvedValue(null);

      const result = await extractExerciseData(userId);

      expect(result).toBeNull();
    });
  });

  describe('extractBodyComposition', () => {
    it('should extract body composition data', async () => {
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue({
        bmi: 24,
        bodyFatPercentage: 18,
      });

      const result = await extractBodyComposition(userId);

      expect(result).toEqual({ bmi: 24, bodyFatPercent: 18 });
    });

    it('should return null when no data available', async () => {
      (bodyCompositionContextService.getLatestBodyCompositionContext as jest.Mock).mockResolvedValue(null);

      const result = await extractBodyComposition(userId);

      expect(result).toBeNull();
    });
  });

  describe('extractSleepQuality', () => {
    it('should extract sleep quality from recovery engine', async () => {
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'sleep_quality', value: 85 },
          ],
        },
      });

      const result = await extractSleepQuality(userId);

      expect(result).toBe(85);
    });

    it('should return null when no data available', async () => {
      (recoveryEngineService.getRecoveryToday as jest.Mock).mockResolvedValue(null);

      const result = await extractSleepQuality(userId);

      expect(result).toBeNull();
    });
  });

  describe('extractStressLevel', () => {
    it('should extract stress level from stress engine', async () => {
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue({
        evidence: {
          signals: [
            { type: 'stress_level', value: 40 },
          ],
        },
      });

      const result = await extractStressLevel(userId);

      expect(result).toBe(40);
    });

    it('should return null when no data available', async () => {
      (stressEngineService.getStressToday as jest.Mock).mockResolvedValue(null);

      const result = await extractStressLevel(userId);

      expect(result).toBeNull();
    });
  });
});

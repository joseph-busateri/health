/**
 * Unit Tests for Actuarial Recommendation Normalizer
 * Tests data quality assurance and normalization logic
 */

import { normalizeActuarialRecommendation } from '../actuarialRecommendationNormalizer';
import type { ActuarialRecommendation } from '../../types/actuarialRiskEngine';

// Mock logger
jest.mock('../../utils/logger');

describe('Actuarial Recommendation Normalizer', () => {
  describe('normalizeActuarialRecommendation', () => {
    it('should normalize a valid recommendation without changes', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Your cardiovascular risk is moderate',
        actions: ['Exercise regularly', 'Monitor blood pressure', 'Maintain healthy diet'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age', 'Blood Pressure'],
        preventionStrategies: ['Lifestyle modification', 'Regular monitoring'],
        rationale: 'Evidence-based recommendations',
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result).toEqual(input);
    });

    it('should trim and normalize whitespace in summary', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: '  Your   cardiovascular   risk   is   moderate  ',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.summary).toBe('Your cardiovascular risk is moderate');
    });

    it('should truncate summary if too long', () => {
      const longSummary = 'A'.repeat(600);
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: longSummary,
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.summary.length).toBe(500);
      expect(result.summary.endsWith('...')).toBe(true);
    });

    it('should provide default summary if missing', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: undefined as any,
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.summary).toBe('No summary provided');
    });

    it('should filter out empty actions', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly', '', '  ', 'Monitor blood pressure'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.actions).toEqual(['Exercise regularly', 'Monitor blood pressure']);
    });

    it('should remove duplicate actions', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly', 'Monitor blood pressure', 'Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.actions).toEqual(['Exercise regularly', 'Monitor blood pressure']);
    });

    it('should truncate actions if too long', () => {
      const longAction = 'A'.repeat(250);
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: [longAction],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.actions[0].length).toBe(200);
      expect(result.actions[0].endsWith('...')).toBe(true);
    });

    it('should limit actions count to maximum', () => {
      const manyActions = Array.from({ length: 25 }, (_, i) => `Action ${i + 1}`);
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: manyActions,
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.actions.length).toBe(20);
    });

    it('should clamp risk reduction potential to 0-100 range', () => {
      const input1: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: -10,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result1 = normalizeActuarialRecommendation(input1);
      expect(result1.riskReductionPotential).toBe(0);

      const input2: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 150,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result2 = normalizeActuarialRecommendation(input2);
      expect(result2.riskReductionPotential).toBe(100);
    });

    it('should round risk reduction potential to integer', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30.7,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.riskReductionPotential).toBe(31);
    });

    it('should handle invalid risk reduction potential', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: NaN,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.riskReductionPotential).toBe(0);
    });

    it('should filter out empty primary risk drivers', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age', '', '  ', 'Blood Pressure'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.primaryRiskDrivers).toEqual(['Age', 'Blood Pressure']);
    });

    it('should remove duplicate primary risk drivers', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age', 'Blood Pressure', 'Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.primaryRiskDrivers).toEqual(['Age', 'Blood Pressure']);
    });

    it('should filter out empty prevention strategies', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification', '', '  ', 'Regular monitoring'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.preventionStrategies).toEqual(['Lifestyle modification', 'Regular monitoring']);
    });

    it('should normalize rationale', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        rationale: '  Evidence-based   recommendations  ',
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.rationale).toBe('Evidence-based recommendations');
    });

    it('should return undefined for empty rationale', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        rationale: '   ',
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.rationale).toBeUndefined();
    });

    it('should truncate rationale if too long', () => {
      const longRationale = 'A'.repeat(1100);
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        rationale: longRationale,
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.rationale?.length).toBe(1000);
      expect(result.rationale?.endsWith('...')).toBe(true);
    });

    it('should default invalid priority to "important"', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'invalid' as any,
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.priority).toBe('important');
    });

    it('should default invalid source to "deterministic"', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'invalid' as any,
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.source).toBe('deterministic');
    });

    it('should handle non-array actions', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: 'Not an array' as any,
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.actions).toEqual([]);
    });

    it('should handle non-array primary risk drivers', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: 'Not an array' as any,
        preventionStrategies: ['Lifestyle modification'],
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.primaryRiskDrivers).toEqual([]);
    });

    it('should handle non-array prevention strategies', () => {
      const input: ActuarialRecommendation = {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Risk is moderate',
        actions: ['Exercise regularly'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: 'Not an array' as any,
        source: 'deterministic',
      };

      const result = normalizeActuarialRecommendation(input);

      expect(result.preventionStrategies).toEqual([]);
    });
  });
});

/**
 * Unit Tests for Actuarial Recommendation Validator
 * Tests validation logic and business rules
 */

import {
  validateActuarialRecommendation,
  validateActuarialRecommendationDetailed,
  validateRecommendationFields,
} from '../actuarialRecommendationValidator';
import type { ActuarialRecommendation } from '../../types/actuarialRiskEngine';

// Mock logger
jest.mock('../../utils/logger');

describe('Actuarial Recommendation Validator', () => {
  const validRecommendation: ActuarialRecommendation = {
    type: 'actuarial_risk',
    priority: 'important',
    summary: 'Your cardiovascular risk is moderate at 6.5%',
    actions: [
      'Exercise 5 days per week',
      'Monitor blood pressure monthly',
      'Maintain healthy diet',
    ],
    riskReductionPotential: 30,
    primaryRiskDrivers: ['Age', 'Blood Pressure'],
    preventionStrategies: ['Lifestyle modification', 'Regular monitoring'],
    rationale: 'Evidence-based recommendations for risk reduction',
    source: 'deterministic',
  };

  describe('validateActuarialRecommendation', () => {
    it('should validate a correct recommendation', () => {
      const result = validateActuarialRecommendation(validRecommendation);
      expect(result).toBe(true);
    });

    it('should reject recommendation with invalid type', () => {
      const invalid = { ...validRecommendation, type: 'invalid' as any };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with missing type', () => {
      const invalid = { ...validRecommendation, type: undefined as any };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with invalid priority', () => {
      const invalid = { ...validRecommendation, priority: 'invalid' as any };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with missing summary', () => {
      const invalid = { ...validRecommendation, summary: undefined as any };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with empty summary', () => {
      const invalid = { ...validRecommendation, summary: '   ' };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with summary too short', () => {
      const invalid = { ...validRecommendation, summary: 'Short' };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with summary too long', () => {
      const invalid = { ...validRecommendation, summary: 'A'.repeat(600) };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with no actions', () => {
      const invalid = { ...validRecommendation, actions: [] };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with too many actions', () => {
      const invalid = {
        ...validRecommendation,
        actions: Array.from({ length: 25 }, (_, i) => `Action ${i + 1}`),
      };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with action too short', () => {
      const invalid = { ...validRecommendation, actions: ['Run'] };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with action too long', () => {
      const invalid = { ...validRecommendation, actions: ['A'.repeat(250)] };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with duplicate actions', () => {
      const invalid = {
        ...validRecommendation,
        actions: ['Exercise daily', 'Monitor BP', 'Exercise daily'],
      };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with negative risk reduction potential', () => {
      const invalid = { ...validRecommendation, riskReductionPotential: -10 };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with risk reduction potential > 100', () => {
      const invalid = { ...validRecommendation, riskReductionPotential: 150 };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with non-integer risk reduction potential', () => {
      const invalid = { ...validRecommendation, riskReductionPotential: 30.5 };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with NaN risk reduction potential', () => {
      const invalid = { ...validRecommendation, riskReductionPotential: NaN };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should reject recommendation with invalid source', () => {
      const invalid = { ...validRecommendation, source: 'invalid' as any };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });

    it('should accept recommendation with valid rationale', () => {
      const valid = {
        ...validRecommendation,
        rationale: 'Evidence-based recommendations',
      };
      const result = validateActuarialRecommendation(valid);
      expect(result).toBe(true);
    });

    it('should reject recommendation with rationale too long', () => {
      const invalid = { ...validRecommendation, rationale: 'A'.repeat(1100) };
      const result = validateActuarialRecommendation(invalid);
      expect(result).toBe(false);
    });
  });

  describe('validateActuarialRecommendationDetailed', () => {
    it('should return detailed validation result for valid recommendation', () => {
      const result = validateActuarialRecommendationDetailed(validRecommendation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return detailed errors for invalid recommendation', () => {
      const invalid: ActuarialRecommendation = {
        type: 'invalid' as any,
        priority: 'invalid' as any,
        summary: '',
        actions: [],
        riskReductionPotential: -10,
        primaryRiskDrivers: [],
        preventionStrategies: [],
        source: 'invalid' as any,
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid type: expected "actuarial_risk", got "invalid"');
    });

    it('should validate business rule: critical priority needs high risk reduction', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        priority: 'critical',
        riskReductionPotential: 10,
        actions: ['Action 1', 'Action 2', 'Action 3'],
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Strategy 1'],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Critical priority recommendations should have risk reduction potential >= 20%'
      );
    });

    it('should validate business rule: optimization priority needs lower risk reduction', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        priority: 'optimization',
        riskReductionPotential: 40,
        preventionStrategies: ['Strategy 1'],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Optimization priority recommendations should have risk reduction potential <= 30%'
      );
    });

    it('should validate business rule: critical priority needs at least 3 actions', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        priority: 'critical',
        actions: ['Action 1', 'Action 2'],
        riskReductionPotential: 50,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Strategy 1'],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Critical priority recommendations should have at least 3 actions'
      );
    });

    it('should validate business rule: important/critical needs risk drivers', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        priority: 'critical',
        actions: ['Action 1', 'Action 2', 'Action 3'],
        riskReductionPotential: 50,
        primaryRiskDrivers: [],
        preventionStrategies: ['Strategy 1'],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Important/critical recommendations should identify at least one primary risk driver'
      );
    });

    it('should validate business rule: all recommendations need prevention strategies', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        preventionStrategies: [],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'All recommendations should include at least one prevention strategy'
      );
    });

    it('should validate each action individually', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        actions: ['Valid action', '', 'Run', 'A'.repeat(250)],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Action 2 cannot be empty'))).toBe(true);
      expect(result.errors.some(e => e.includes('Action 3 too short'))).toBe(true);
      expect(result.errors.some(e => e.includes('Action 4 too long'))).toBe(true);
    });

    it('should validate each risk driver individually', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        primaryRiskDrivers: ['Valid driver', '', '  '],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Risk driver 2 cannot be empty'))).toBe(true);
    });

    it('should validate each prevention strategy individually', () => {
      const invalid: ActuarialRecommendation = {
        ...validRecommendation,
        preventionStrategies: ['Valid strategy', '', '  '],
      };

      const result = validateActuarialRecommendationDetailed(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Prevention strategy 2 cannot be empty'))).toBe(
        true
      );
    });
  });

  describe('validateRecommendationFields', () => {
    it('should return field-by-field validation for valid recommendation', () => {
      const result = validateRecommendationFields(validRecommendation);
      expect(result.type).toBe(true);
      expect(result.priority).toBe(true);
      expect(result.summary).toBe(true);
      expect(result.actions).toBe(true);
      expect(result.riskReductionPotential).toBe(true);
      expect(result.primaryRiskDrivers).toBe(true);
      expect(result.preventionStrategies).toBe(true);
      expect(result.source).toBe(true);
    });

    it('should return false for invalid fields', () => {
      const invalid: Partial<ActuarialRecommendation> = {
        type: 'invalid' as any,
        priority: 'invalid' as any,
        summary: 'Short',
        actions: [],
        riskReductionPotential: -10,
        primaryRiskDrivers: 'not an array' as any,
        preventionStrategies: 'not an array' as any,
        source: 'invalid' as any,
      };

      const result = validateRecommendationFields(invalid);
      expect(result.type).toBe(false);
      expect(result.priority).toBe(false);
      expect(result.summary).toBe(false);
      expect(result.actions).toBe(false);
      expect(result.riskReductionPotential).toBe(false);
      expect(result.primaryRiskDrivers).toBe(false);
      expect(result.preventionStrategies).toBe(false);
      expect(result.source).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle recommendation with all valid priorities', () => {
      const priorities: Array<'critical' | 'important' | 'optimization'> = [
        'critical',
        'important',
        'optimization',
      ];

      priorities.forEach(priority => {
        const rec: ActuarialRecommendation = {
          ...validRecommendation,
          priority,
          actions: ['Action 1', 'Action 2', 'Action 3'],
          riskReductionPotential: priority === 'critical' ? 50 : priority === 'important' ? 30 : 10,
          primaryRiskDrivers: priority === 'optimization' ? [] : ['Age'],
          preventionStrategies: ['Strategy 1'],
        };
        const result = validateActuarialRecommendation(rec);
        expect(result).toBe(priority === 'optimization' ? true : true);
      });
    });

    it('should handle recommendation with all valid sources', () => {
      const sources: Array<'deterministic' | 'ai_enriched' | 'fallback'> = [
        'deterministic',
        'ai_enriched',
        'fallback',
      ];

      sources.forEach(source => {
        const rec: ActuarialRecommendation = {
          ...validRecommendation,
          source,
        };
        const result = validateActuarialRecommendation(rec);
        expect(result).toBe(true);
      });
    });

    it('should handle recommendation with minimum valid summary length', () => {
      const rec: ActuarialRecommendation = {
        ...validRecommendation,
        summary: 'A'.repeat(10),
      };
      const result = validateActuarialRecommendation(rec);
      expect(result).toBe(true);
    });

    it('should handle recommendation with maximum valid summary length', () => {
      const rec: ActuarialRecommendation = {
        ...validRecommendation,
        summary: 'A'.repeat(500),
      };
      const result = validateActuarialRecommendation(rec);
      expect(result).toBe(true);
    });

    it('should handle recommendation with minimum valid action length', () => {
      const rec: ActuarialRecommendation = {
        ...validRecommendation,
        actions: ['A'.repeat(5)],
      };
      const result = validateActuarialRecommendation(rec);
      expect(result).toBe(true);
    });

    it('should handle recommendation with maximum valid action length', () => {
      const rec: ActuarialRecommendation = {
        ...validRecommendation,
        actions: ['A'.repeat(200)],
      };
      const result = validateActuarialRecommendation(rec);
      expect(result).toBe(true);
    });

    it('should handle recommendation with risk reduction potential at boundaries', () => {
      const rec1: ActuarialRecommendation = {
        ...validRecommendation,
        riskReductionPotential: 0,
      };
      expect(validateActuarialRecommendation(rec1)).toBe(true);

      const rec2: ActuarialRecommendation = {
        ...validRecommendation,
        riskReductionPotential: 100,
      };
      expect(validateActuarialRecommendation(rec2)).toBe(true);
    });

    it('should handle recommendation without optional rationale', () => {
      const rec: ActuarialRecommendation = {
        ...validRecommendation,
        rationale: undefined,
      };
      const result = validateActuarialRecommendation(rec);
      expect(result).toBe(true);
    });
  });
});

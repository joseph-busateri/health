/**
 * Unit Tests for Actuarial AI Enrichment Service
 * Tests AI-powered recommendation enhancement
 */

import { enrichActuarialRecommendation } from '../actuarialAIEnrichment';
import { getOpenAIClient } from '../openAIService';
import type {
  ActuarialEvidence,
  ActuarialRecommendation,
} from '../../types/actuarialRiskEngine';

// Mock dependencies
jest.mock('../openAIService');
jest.mock('../../utils/logger');

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockEvidence: ActuarialEvidence = {
  framinghamResult: {
    modelType: 'framingham',
    riskPercentage: 6.0,
    riskCategory: 'low_risk',
    confidence: 0.85,
  },
  ascvdResult: {
    modelType: 'ascvd',
    riskPercentage: 6.5,
    riskCategory: 'moderate_risk',
    confidence: 0.85,
  },
  combinedRiskPercentage: 4.5,
  combinedRiskCategory: 'low_risk',
  riskFactors: [
    {
      factor: 'Age',
      contribution: 22.5,
      status: 'negative',
      value: '59 years',
      interpretation: 'Age increases cardiovascular risk',
    },
    {
      factor: 'Blood Pressure',
      contribution: 10,
      status: 'positive',
      value: '118/74 mmHg',
      interpretation: 'Blood pressure in healthy range',
    },
  ],
  lifestyleAdjustment: -28.0,
  fitnessAdjustment: -45.0,
  signals: [
    {
      name: 'Framingham Risk Score',
      value: '6.0%',
      interpretation: '10-year coronary heart disease risk: 6.0%',
    },
    {
      name: 'ASCVD Risk Score',
      value: '6.5%',
      interpretation: '10-year ASCVD risk (heart attack + stroke): 6.5%',
    },
  ],
  summary: '10-year cardiovascular risk: 4.5% (LOW RISK). Primary risk factors: Age.',
};

const mockFallbackRecommendation: ActuarialRecommendation = {
  type: 'actuarial_risk',
  priority: 'optimization',
  summary: '10-year cardiovascular risk is low',
  actions: [
    'Maintain current healthy lifestyle',
    'Continue regular exercise routine',
    'Monitor blood pressure annually',
  ],
  riskReductionPotential: 0,
  primaryRiskDrivers: ['Age'],
  preventionStrategies: ['Maintain healthy lifestyle', 'Regular monitoring'],
  source: 'deterministic',
};

const mockAIResponse = {
  priority: 'optimization',
  summary: 'Your 10-year cardiovascular risk is low at 4.5%, which is excellent. Your healthy lifestyle and regular exercise are key protective factors.',
  actions: [
    'Continue exercising 5 days per week to maintain cardiovascular fitness',
    'Keep blood pressure in optimal range (<120/80) through diet and exercise',
    'Maintain healthy weight and body composition',
    'Get annual cardiovascular health screening',
    'Continue stress management practices',
  ],
  rationale: 'Your current risk is well-controlled due to excellent lifestyle factors. Maintaining these habits will help keep your risk low as you age.',
  primaryRiskDrivers: ['Age (59 years)', 'Lifestyle factors (protective)'],
  preventionStrategies: [
    'Maintain regular aerobic exercise',
    'Continue healthy diet',
    'Annual health monitoring',
  ],
  riskReductionPotential: 10,
};

// ============================================================================
// TESTS
// ============================================================================

describe('Actuarial AI Enrichment Service', () => {
  let mockOpenAIClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    mockGetOpenAIClient.mockReturnValue(mockOpenAIClient);
  });

  describe('enrichActuarialRecommendation', () => {
    it('should enrich recommendation with AI insights for low risk', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result).toBeDefined();
      expect(result.source).toBe('ai_enriched');
      expect(result.priority).toBe('optimization');
      expect(result.summary).toContain('4.5%');
      expect(result.actions.length).toBeGreaterThan(3);
      expect(result.rationale).toBeDefined();
      expect(result.riskReductionPotential).toBe(10);
    });

    it('should enrich recommendation with AI insights for moderate risk', async () => {
      const moderateEvidence: ActuarialEvidence = {
        ...mockEvidence,
        combinedRiskPercentage: 6.5,
        combinedRiskCategory: 'moderate_risk',
      };

      const moderateFallback: ActuarialRecommendation = {
        ...mockFallbackRecommendation,
        priority: 'important',
        summary: '10-year cardiovascular risk is moderate',
      };

      const moderateAIResponse = {
        ...mockAIResponse,
        priority: 'important',
        summary: 'Your 10-year cardiovascular risk is moderate at 6.5%. Lifestyle improvements can significantly reduce this risk.',
        riskReductionPotential: 30,
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(moderateAIResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        moderateEvidence,
        moderateFallback
      );

      expect(result.source).toBe('ai_enriched');
      expect(result.priority).toBe('important');
      expect(result.riskReductionPotential).toBe(30);
    });

    it('should enrich recommendation with AI insights for high risk', async () => {
      const highEvidence: ActuarialEvidence = {
        ...mockEvidence,
        combinedRiskPercentage: 15.0,
        combinedRiskCategory: 'high_risk',
      };

      const highFallback: ActuarialRecommendation = {
        ...mockFallbackRecommendation,
        priority: 'important',
        summary: '10-year cardiovascular risk is high',
      };

      const highAIResponse = {
        ...mockAIResponse,
        priority: 'critical',
        summary: 'Your 10-year cardiovascular risk is high at 15%. Immediate lifestyle changes and medical consultation are recommended.',
        riskReductionPotential: 50,
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(highAIResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        highEvidence,
        highFallback
      );

      expect(result.source).toBe('ai_enriched');
      expect(result.priority).toBe('critical');
      expect(result.riskReductionPotential).toBe(50);
    });

    it('should use fallback when AI returns no content', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.source).toBe('fallback');
      expect(result.summary).toBe(mockFallbackRecommendation.summary);
      expect(result.actions).toEqual(mockFallbackRecommendation.actions);
    });

    it('should use fallback when AI returns invalid JSON', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON content',
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.source).toBe('fallback');
      expect(result.summary).toBe(mockFallbackRecommendation.summary);
    });

    it('should use fallback when AI returns incomplete data', async () => {
      const incompleteResponse = {
        summary: 'Risk is low',
        // Missing actions
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(incompleteResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.source).toBe('fallback');
    });

    it('should use fallback when OpenAI client throws error', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.source).toBe('fallback');
      expect(result.summary).toBe(mockFallbackRecommendation.summary);
    });

    it('should clamp risk reduction potential to 0-100 range', async () => {
      const invalidResponse = {
        ...mockAIResponse,
        riskReductionPotential: 150, // Invalid: >100
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(invalidResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.riskReductionPotential).toBeLessThanOrEqual(100);
      expect(result.riskReductionPotential).toBeGreaterThanOrEqual(0);
    });

    it('should merge AI output with fallback for missing fields', async () => {
      const partialResponse = {
        summary: 'AI-generated summary',
        actions: ['AI action 1', 'AI action 2'],
        // Missing rationale, primaryRiskDrivers, preventionStrategies
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(partialResponse),
            },
          },
        ],
      });

      const result = await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(result.summary).toBe('AI-generated summary');
      expect(result.actions).toEqual(['AI action 1', 'AI action 2']);
      expect(result.primaryRiskDrivers).toEqual(mockFallbackRecommendation.primaryRiskDrivers);
      expect(result.preventionStrategies).toEqual(mockFallbackRecommendation.preventionStrategies);
    });

    it('should call OpenAI with correct parameters', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse),
            },
          },
        ],
      });

      await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('cardiovascular risk expert'),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('RISK ASSESSMENT RESULTS'),
            }),
          ]),
          temperature: 0.7,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should include risk factors in prompt', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse),
            },
          },
        ],
      });

      await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      
      expect(userMessage.content).toContain('Age');
      expect(userMessage.content).toContain('Blood Pressure');
      expect(userMessage.content).toContain('59 years');
    });

    it('should include lifestyle adjustments in prompt', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse),
            },
          },
        ],
      });

      await enrichActuarialRecommendation(
        mockEvidence,
        mockFallbackRecommendation
      );

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      
      expect(userMessage.content).toContain('reduce risk');
      expect(userMessage.content).toContain('28.0%');
    });
  });
});

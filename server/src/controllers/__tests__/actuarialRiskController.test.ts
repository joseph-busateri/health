/**
 * Unit Tests for Actuarial Risk Controller
 * Tests HTTP request handling and response formatting
 */

import { Request, Response } from 'express';
import {
  calculateActuarialRiskHandler,
  getActuarialRiskRecordHandler,
  getActuarialRiskHistoryHandler,
} from '../actuarialRiskController';
import * as actuarialRiskEngineService from '../../services/actuarialRiskEngineService';
import type { ActuarialRiskRecord, ActuarialRiskInputs } from '../../types/actuarialRiskEngine';

// Mock logger
jest.mock('../../utils/logger');

// Mock actuarial risk engine service
jest.mock('../../services/actuarialRiskEngineService');

describe('Actuarial Risk Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      params: {},
      body: {},
      query: {},
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateActuarialRiskHandler', () => {
    const validInputs: ActuarialRiskInputs = {
      demographic: {
        age: 55,
        gender: 'male',
        race: 'white',
      },
      clinical: {
        systolicBP: 130,
        diastolicBP: 85,
        totalCholesterol: 200,
        hdlCholesterol: 50,
        ldlCholesterol: 120,
        triglycerides: 150,
        isSmoker: false,
        isDiabetic: false,
        isOnBPMedication: false,
      },
      lifestyle: {
        exerciseFrequency: 5,
        vo2Max: 45,
        bodyFatPercentage: 18,
        bmi: 24,
      },
    };

    const mockRecord: ActuarialRiskRecord = {
      id: 'test-id',
      userId: 'user-123',
      date: '2026-04-16',
      timestamp: new Date().toISOString(),
      overallRisk: 8.5,
      riskCategory: 'moderate',
      riskModels: {
        framingham: {
          score: 8.0,
          category: 'moderate',
          tenYearRisk: 8.0,
        },
        ascvd: {
          score: 9.0,
          category: 'moderate',
          tenYearRisk: 9.0,
        },
        lifestyleModified: {
          score: 8.5,
          category: 'moderate',
          tenYearRisk: 8.5,
          modificationFactor: 0.95,
        },
      },
      riskFactorContributions: [],
      evidence: {
        signals: [],
        summary: 'Test summary',
        interpretation: 'Test interpretation',
      },
      recommendation: {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Test recommendation',
        actions: ['Action 1', 'Action 2'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Strategy 1'],
        source: 'deterministic',
      },
    };

    it('should calculate actuarial risk successfully', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = validInputs;

      (actuarialRiskEngineService.calculateActuarialRisk as jest.Mock).mockResolvedValue(mockRecord);

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(actuarialRiskEngineService.calculateActuarialRisk).toHaveBeenCalledWith('user-123', validInputs);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRecord,
      });
    });

    it('should return 400 if userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = validInputs;

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required parameter: userId',
      });
    });

    it('should return 400 if demographic is missing', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = { clinical: validInputs.clinical };

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input data',
        details: ['Missing required field: demographic'],
      });
    });

    it('should return 400 if clinical is missing', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = { demographic: validInputs.demographic };

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input data',
        details: ['Missing required field: clinical'],
      });
    });

    it('should return 400 if age is not a number', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = {
        demographic: { ...validInputs.demographic, age: 'invalid' },
        clinical: validInputs.clinical,
      };

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid input data',
        })
      );
    });

    it('should return 400 if gender is invalid', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = {
        demographic: { ...validInputs.demographic, gender: 'invalid' },
        clinical: validInputs.clinical,
      };

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid input data',
        })
      );
    });

    it('should return 500 if service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.body = validInputs;

      (actuarialRiskEngineService.calculateActuarialRisk as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await calculateActuarialRiskHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to calculate actuarial risk',
        details: 'Service error',
      });
    });
  });

  describe('getActuarialRiskRecordHandler', () => {
    const mockRecord: ActuarialRiskRecord = {
      id: 'test-id',
      userId: 'user-123',
      date: '2026-04-16',
      timestamp: new Date().toISOString(),
      overallRisk: 8.5,
      riskCategory: 'moderate',
      riskModels: {
        framingham: {
          score: 8.0,
          category: 'moderate',
          tenYearRisk: 8.0,
        },
        ascvd: {
          score: 9.0,
          category: 'moderate',
          tenYearRisk: 9.0,
        },
        lifestyleModified: {
          score: 8.5,
          category: 'moderate',
          tenYearRisk: 8.5,
          modificationFactor: 0.95,
        },
      },
      riskFactorContributions: [],
      evidence: {
        signals: [],
        summary: 'Test summary',
        interpretation: 'Test interpretation',
      },
      recommendation: {
        type: 'actuarial_risk',
        priority: 'important',
        summary: 'Test recommendation',
        actions: ['Action 1', 'Action 2'],
        riskReductionPotential: 30,
        primaryRiskDrivers: ['Age'],
        preventionStrategies: ['Strategy 1'],
        source: 'deterministic',
      },
    };

    it('should get actuarial risk record successfully', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = {};

      (actuarialRiskEngineService.getActuarialRiskRecord as jest.Mock).mockResolvedValue(mockRecord);

      await getActuarialRiskRecordHandler(mockRequest as Request, mockResponse as Response);

      expect(actuarialRiskEngineService.getActuarialRiskRecord).toHaveBeenCalledWith('user-123', undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRecord,
      });
    });

    it('should get actuarial risk record for specific date', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = { date: '2026-04-15' };

      (actuarialRiskEngineService.getActuarialRiskRecord as jest.Mock).mockResolvedValue(mockRecord);

      await getActuarialRiskRecordHandler(mockRequest as Request, mockResponse as Response);

      expect(actuarialRiskEngineService.getActuarialRiskRecord).toHaveBeenCalledWith('user-123', '2026-04-15');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 if userId is missing', async () => {
      mockRequest.params = {};

      await getActuarialRiskRecordHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required parameter: userId',
      });
    });

    it('should return 404 if no record found', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = {};

      (actuarialRiskEngineService.getActuarialRiskRecord as jest.Mock).mockResolvedValue(null);

      await getActuarialRiskRecordHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'No actuarial risk record found',
        details: 'No records found for user',
      });
    });

    it('should return 500 if service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };

      (actuarialRiskEngineService.getActuarialRiskRecord as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await getActuarialRiskRecordHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get actuarial risk record',
        details: 'Service error',
      });
    });
  });

  describe('getActuarialRiskHistoryHandler', () => {
    const mockHistory: ActuarialRiskRecord[] = [
      {
        id: 'test-id-1',
        userId: 'user-123',
        date: '2026-04-16',
        timestamp: new Date().toISOString(),
        overallRisk: 8.5,
        riskCategory: 'moderate',
        riskModels: {
          framingham: { score: 8.0, category: 'moderate', tenYearRisk: 8.0 },
          ascvd: { score: 9.0, category: 'moderate', tenYearRisk: 9.0 },
          lifestyleModified: { score: 8.5, category: 'moderate', tenYearRisk: 8.5, modificationFactor: 0.95 },
        },
        riskFactorContributions: [],
        evidence: { signals: [], summary: 'Test', interpretation: 'Test' },
        recommendation: {
          type: 'actuarial_risk',
          priority: 'important',
          summary: 'Test',
          actions: ['Action 1'],
          riskReductionPotential: 30,
          primaryRiskDrivers: ['Age'],
          preventionStrategies: ['Strategy 1'],
          source: 'deterministic',
        },
      },
    ];

    it('should get actuarial risk history successfully', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = {};

      (actuarialRiskEngineService.getActuarialRiskHistory as jest.Mock).mockResolvedValue(mockHistory);

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(actuarialRiskEngineService.getActuarialRiskHistory).toHaveBeenCalledWith('user-123', 30);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        metadata: {
          days: 30,
          recordCount: 1,
        },
      });
    });

    it('should get actuarial risk history with custom days', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = { days: '60' };

      (actuarialRiskEngineService.getActuarialRiskHistory as jest.Mock).mockResolvedValue(mockHistory);

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(actuarialRiskEngineService.getActuarialRiskHistory).toHaveBeenCalledWith('user-123', 60);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
        metadata: {
          days: 60,
          recordCount: 1,
        },
      });
    });

    it('should return 400 if userId is missing', async () => {
      mockRequest.params = {};

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required parameter: userId',
      });
    });

    it('should return 400 if days is invalid', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = { days: 'invalid' };

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid query parameter: days must be a positive integer',
      });
    });

    it('should return 400 if days is negative', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = { days: '-5' };

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid query parameter: days must be a positive integer',
      });
    });

    it('should return 500 if service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };

      (actuarialRiskEngineService.getActuarialRiskHistory as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await getActuarialRiskHistoryHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get actuarial risk history',
        details: 'Service error',
      });
    });
  });
});

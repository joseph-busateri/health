/**
 * Regression Tests for Sexual Health Engine Service V1
 * Ensures V1 endpoint still works correctly after V2 changes
 */

import { Request, Response } from 'express';
import {
  getSexualHealthTodayHandler,
} from '../../controllers/sexualHealthEngineController';
import * as sexualHealthEngineService from '../sexualHealthEngineService';

// Mock logger
jest.mock('../../utils/logger');

// Mock sexual health engine service V1
jest.mock('../sexualHealthEngineService');

describe('Sexual Health Engine V1 Regression Tests', () => {
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

  describe('getSexualHealthTodayHandler - V1 Regression', () => {
    it('should return 200 when V1 service returns data', async () => {
      mockRequest.params = { userId: 'user-123' };
      const mockV1Data = {
        id: 'test-id',
        userId: 'user-123',
        date: '2026-04-19',
        sexualHealthScore: 75,
        sexualHealthStatus: 'optimal',
        recommendation: {
          type: 'sexual_health',
          priority: 'optimization',
          summary: 'Sexual health readiness is optimal',
          actions: ['Maintain recovery practices'],
          source: 'deterministic',
        },
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(sexualHealthEngineService, 'getSexualHealthToday').mockResolvedValue(mockV1Data);

      await getSexualHealthTodayHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockV1Data,
      });
    });

    it('should return 404 when V1 service returns null', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineService, 'getSexualHealthToday').mockResolvedValue(null);

      await getSexualHealthTodayHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'No sexual health data available',
      });
    });

    it('should return 500 when V1 service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineService, 'getSexualHealthToday').mockRejectedValue(new Error('V1 Service Error'));

      await getSexualHealthTodayHandler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get sexual health data',
        details: 'V1 Service Error',
      });
    });

    it('should handle array userId parameter', async () => {
      mockRequest.params = { userId: ['user-123', 'user-456'] };
      const mockV1Data = {
        id: 'test-id',
        userId: 'user-123',
        date: '2026-04-19',
        sexualHealthScore: 75,
        sexualHealthStatus: 'optimal',
        recommendation: {
          type: 'sexual_health',
          priority: 'optimization',
          summary: 'Sexual health readiness is optimal',
          actions: ['Maintain recovery practices'],
          source: 'deterministic',
        },
        createdAt: new Date().toISOString(),
      };
      jest.spyOn(sexualHealthEngineService, 'getSexualHealthToday').mockResolvedValue(mockV1Data);

      await getSexualHealthTodayHandler(mockRequest as Request, mockResponse as Response);

      expect(sexualHealthEngineService.getSexualHealthToday).toHaveBeenCalledWith('user-123');
    });
  });

  describe('V1 Service Functions Still Exist', () => {
    it('should have getSexualHealthToday function', () => {
      expect(sexualHealthEngineService.getSexualHealthToday).toBeDefined();
    });

    it('should have getSexualHealthHistory function', () => {
      expect(sexualHealthEngineService.getSexualHealthHistory).toBeDefined();
    });

    it('should have getSexualHealthRecommendation function', () => {
      expect(sexualHealthEngineService.getSexualHealthRecommendation).toBeDefined();
    });
  });

  describe('V1 and V2 Coexist Without Conflicts', () => {
    it('should not break V1 when V2 is imported', async () => {
      // Import V2 to ensure no conflicts
      const sexualHealthEngineServiceV2 = require('../sexualHealthEngineServiceV2');
      
      // V1 functions should still be available
      expect(sexualHealthEngineService.getSexualHealthToday).toBeDefined();
      expect(sexualHealthEngineService.getSexualHealthHistory).toBeDefined();
      
      // V2 functions should also be available
      expect(sexualHealthEngineServiceV2.getSexualHealthTodayV2).toBeDefined();
      expect(sexualHealthEngineServiceV2.getSexualHealthHistoryV2).toBeDefined();
    });
  });
});

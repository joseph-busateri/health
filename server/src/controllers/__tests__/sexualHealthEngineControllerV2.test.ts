/**
 * Integration Tests for Sexual Health Engine Controller V2
 * Tests HTTP request handling and response formatting for V2 endpoints
 */

import { Request, Response } from 'express';
import {
  getSexualHealthTodayV2Handler,
  getSexualHealthHistoryV2Handler,
} from '../sexualHealthEngineControllerV2';
import * as sexualHealthEngineServiceV2 from '../../services/sexualHealthEngineServiceV2';
import type { SexualHealthRecordV2 } from '../../types/sexualHealthEngineV2';

// Mock logger
jest.mock('../../utils/logger');

// Mock sexual health engine service V2
jest.mock('../../services/sexualHealthEngineServiceV2');

describe('Sexual Health Engine Controller V2', () => {
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

  describe('getSexualHealthTodayV2Handler', () => {
    const mockRecord: SexualHealthRecordV2 = {
      id: 'test-id',
      userId: 'user-123',
      date: '2026-04-19',
      sexualHealthStatus: 'optimal',
      recommendation: {
        type: 'sexual_health',
        priority: 'optimization',
        summary: 'Sexual health readiness is optimal',
        actions: ['Maintain recovery practices'],
        source: 'deterministic',
      },
      trendMetadata: {
        testosterone: {
          direction: 'stable',
          percentChange: 2,
          dataPoints: 3,
          timespanDays: 90,
        },
      },
      createdAt: new Date().toISOString(),
    };

    it('should return 200 with sexual health data when successful', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthTodayV2').mockResolvedValue(mockRecord);

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockRecord,
      });
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required parameter: userId',
      });
    });

    it('should return 404 when no data available', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthTodayV2').mockResolvedValue(null);

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'No sexual health data available',
      });
    });

    it('should return 500 when service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthTodayV2').mockRejectedValue(new Error('Database error'));

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get sexual health data',
        details: 'Database error',
      });
    });

    it('should handle array userId parameter', async () => {
      mockRequest.params = { userId: ['user-123', 'user-456'] };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthTodayV2').mockResolvedValue(mockRecord);

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      expect(sexualHealthEngineServiceV2.getSexualHealthTodayV2).toHaveBeenCalledWith('user-123');
    });

    it('should include trendMetadata in response when available', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthTodayV2').mockResolvedValue(mockRecord);

      await getSexualHealthTodayV2Handler(mockRequest as Request, mockResponse as Response);

      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.data.trendMetadata).toBeDefined();
      expect(responseData.data.trendMetadata.testosterone).toBeDefined();
    });
  });

  describe('getSexualHealthHistoryV2Handler', () => {
    const mockHistory: SexualHealthRecordV2[] = [
      {
        id: 'test-id-1',
        userId: 'user-123',
        date: '2026-04-19',
        sexualHealthStatus: 'optimal',
        recommendation: {
          type: 'sexual_health',
          priority: 'optimization',
          summary: 'Sexual health readiness is optimal',
          actions: ['Maintain recovery practices'],
          source: 'deterministic',
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'test-id-2',
        userId: 'user-123',
        date: '2026-04-18',
        sexualHealthStatus: 'moderate',
        recommendation: {
          type: 'sexual_health',
          priority: 'important',
          summary: 'Sexual health readiness shows mixed signals',
          actions: ['Improve sleep quality'],
          source: 'deterministic',
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    it('should return 200 with history data when successful', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthHistoryV2').mockResolvedValue(mockHistory);

      await getSexualHealthHistoryV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
      });
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};

      await getSexualHealthHistoryV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Missing required parameter: userId',
      });
    });

    it('should return 500 when service throws error', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthHistoryV2').mockRejectedValue(new Error('Database error'));

      await getSexualHealthHistoryV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get sexual health history',
        details: 'Database error',
      });
    });

    it('should return empty array when no history exists', async () => {
      mockRequest.params = { userId: 'user-123' };
      jest.spyOn(sexualHealthEngineServiceV2, 'getSexualHealthHistoryV2').mockResolvedValue([]);

      await getSexualHealthHistoryV2Handler(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });
});

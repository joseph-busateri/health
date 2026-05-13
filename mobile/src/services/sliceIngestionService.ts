/**
 * Slice Ingestion Service - Phase 18
 * 
 * Purpose: Mobile service layer for vertical slice ingestion
 * Provides API interface for all data source ingestion
 */

import api from './api';
import type { IngestionRequest, IngestionResult, DataSource, SourceCollection } from '../types/source';
import { SliceOrchestrator } from '../slices/sliceOrchestrator';

// ============================================================================
// SLICE INGESTION SERVICE
// ============================================================================

export const sliceIngestionService = {
  /**
   * Ingest data through vertical slice
   * Falls back to client-side processing if endpoint unavailable
   */
  ingestData: async (request: IngestionRequest): Promise<IngestionResult> => {
    try {
      // Try backend endpoint first
      const response = await api.post<{ success: boolean; data: IngestionResult }>(
        '/ingestion/process',
        request
      );
      return response.data.data;
    } catch (error) {
      console.log('Backend ingestion endpoint not available, processing client-side');
      
      // Fallback to client-side orchestration
      return await SliceOrchestrator.processIngestion(request);
    }
  },

  /**
   * Upload bloodwork data
   */
  uploadBloodwork: async (
    userId: string,
    bloodworkData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'bloodwork',
      sourceSystem: 'upload',
      effectiveDate,
      rawData: bloodworkData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Upload body composition data
   */
  uploadBodyComposition: async (
    userId: string,
    bodyCompData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'bodyComposition',
      sourceSystem: 'upload',
      effectiveDate,
      rawData: bodyCompData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Upload workout program
   */
  uploadWorkoutProgram: async (
    userId: string,
    programData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'workoutProgram',
      sourceSystem: 'upload',
      effectiveDate,
      rawData: programData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Sync device data
   */
  syncDeviceData: async (
    userId: string,
    deviceType: 'whoop' | 'oura' | 'garmin' | 'appleHealth',
    deviceData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'device',
      sourceSystem: deviceType,
      effectiveDate,
      rawData: deviceData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Submit daily interview
   */
  submitDailyInterview: async (
    userId: string,
    interviewData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'dailyInterview',
      sourceSystem: 'ai_interview',
      effectiveDate,
      rawData: interviewData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Log nutrition
   */
  logNutrition: async (
    userId: string,
    nutritionData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'nutrition',
      sourceSystem: 'manual',
      effectiveDate,
      rawData: nutritionData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Log supplements
   */
  logSupplements: async (
    userId: string,
    supplementData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'supplements',
      sourceSystem: 'manual',
      effectiveDate,
      rawData: supplementData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Track execution
   */
  trackExecution: async (
    userId: string,
    executionData: any,
    effectiveDate: string
  ): Promise<IngestionResult> => {
    const request: IngestionRequest = {
      userId,
      sourceType: 'execution',
      sourceSystem: 'execution_tracker',
      effectiveDate,
      rawData: executionData,
    };

    return sliceIngestionService.ingestData(request);
  },

  /**
   * Get source collection for user
   */
  getSourceCollection: async (userId: string, date: string): Promise<SourceCollection | null> => {
    try {
      const response = await api.get<{ success: boolean; data: SourceCollection }>(
        `/ingestion/${userId}/sources?date=${date}`
      );
      return response.data.data;
    } catch (error) {
      console.log('Source collection endpoint not available');
      return null;
    }
  },

  /**
   * Get ingestion history
   */
  getIngestionHistory: async (
    userId: string,
    days: number = 7
  ): Promise<IngestionResult[]> => {
    try {
      const response = await api.get<{ success: boolean; data: IngestionResult[] }>(
        `/ingestion/${userId}/history?days=${days}`
      );
      return response.data.data;
    } catch (error) {
      console.log('Ingestion history endpoint not available');
      return [];
    }
  },
};

export default sliceIngestionService;

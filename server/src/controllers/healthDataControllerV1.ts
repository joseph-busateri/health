import { Request, Response } from 'express';
import { healthDataService, HealthDataSyncRequest } from '../services/healthDataService';
import { logger } from '../utils/logger';

/**
 * Health Data Controller V1
 * Handles health data sync requests from mobile app
 */
export class HealthDataControllerV1 {
  
  /**
   * Sync health data from Apple Health
   * POST /api/health-data/sync
   */
  async syncHealthData(req: Request, res: Response): Promise<void> {
    try {
      const syncRequest: HealthDataSyncRequest = req.body;

      // Validate request structure
      if (!syncRequest.userId || !syncRequest.dataType || !Array.isArray(syncRequest.data)) {
        res.status(400).json({
          error: 'Invalid request structure',
          required: ['userId', 'dataType', 'data'],
          received: {
            userId: !!syncRequest.userId,
            dataType: !!syncRequest.dataType,
            data: Array.isArray(syncRequest.data),
          },
        });
        return;
      }

      // Validate data type
      const validDataTypes = [
        'sleep',
        'heart_rate',
        'steps',
        'workouts',
        'body_measurements',
        'nutrition',
        'blood_glucose',
        'hrv',
        'blood_pressure',
        'active_energy',
      ];

      if (!validDataTypes.includes(syncRequest.dataType)) {
        res.status(400).json({
          error: 'Invalid data type',
          validDataTypes,
          received: syncRequest.dataType,
        });
        return;
      }

      // Validate data array is not empty
      if (syncRequest.data.length === 0) {
        res.status(200).json({
          recordsProcessed: 0,
          recordsSaved: 0,
          recordsSkipped: 0,
          message: 'No data to sync',
        });
        return;
      }

      // Log sync attempt
      logger.info('Health data sync request received', {
        userId: syncRequest.userId,
        dataType: syncRequest.dataType,
        recordCount: syncRequest.data.length,
        source: syncRequest.source,
      });

      // Process sync
      const result = await healthDataService.syncHealthData(syncRequest);

      // Log sync result
      logger.info('Health data sync completed', {
        userId: syncRequest.userId,
        dataType: syncRequest.dataType,
        recordsProcessed: result.recordsProcessed,
        recordsSaved: result.recordsSaved,
        recordsSkipped: result.recordsSkipped,
      });

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error processing health data sync', {
        error: error.message,
        stack: error.stack,
        userId: req.body?.userId,
        dataType: req.body?.dataType,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process health data sync',
      });
    }
  }

  /**
   * Get sync status for a user
   * GET /api/health-data/sync-status/:userId
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          error: 'userId is required',
        });
        return;
      }

      const lastSyncTime = await healthDataService.getLastSyncTime(userId);
      const syncStatistics = await healthDataService.getSyncStatistics(userId);

      res.status(200).json({
        lastSyncTime,
        syncStatistics,
      });
    } catch (error: any) {
      logger.error('Error getting sync status', {
        error: error.message,
        stack: error.stack,
        userId: req.params?.userId,
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get sync status',
      });
    }
  }
}

export const healthDataControllerV1 = new HealthDataControllerV1();

import { Router, Request, Response } from 'express';
import { healthDataService } from '../services/healthDataService';

const router = Router();

/**
 * Sync health data from Apple Health
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, dataType, data, source, syncedAt } = req.body;

    if (!userId || !dataType || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, dataType, data',
      });
    }

    const result = await healthDataService.syncHealthData({
      userId,
      dataType,
      data,
      source: source || 'apple_health',
      syncedAt: syncedAt || new Date().toISOString(),
    });

    res.json({
      success: true,
      recordsProcessed: result.recordsProcessed,
      recordsSaved: result.recordsSaved,
      recordsSkipped: result.recordsSkipped,
    });
  } catch (error: any) {
    console.error('Health data sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get last sync timestamp for a user
 */
router.get('/last-sync/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const lastSync = await healthDataService.getLastSyncTime(userId);

    res.json({
      success: true,
      lastSync,
    });
  } catch (error: any) {
    console.error('Error getting last sync time:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get health data summary for a user
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const summary = await healthDataService.getHealthDataSummary(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error getting health data summary:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get sleep data for a user
 */
router.get('/sleep/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const sleepData = await healthDataService.getSleepData(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: sleepData,
    });
  } catch (error: any) {
    console.error('Error getting sleep data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get heart rate data for a user
 */
router.get('/heart-rate/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const heartRateData = await healthDataService.getHeartRateData(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: heartRateData,
    });
  } catch (error: any) {
    console.error('Error getting heart rate data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get activity data for a user
 */
router.get('/activity/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const activityData = await healthDataService.getActivityData(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: activityData,
    });
  } catch (error: any) {
    console.error('Error getting activity data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get workout data for a user
 */
router.get('/workouts/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const workoutData = await healthDataService.getWorkoutData(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: workoutData,
    });
  } catch (error: any) {
    console.error('Error getting workout data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get body measurements for a user
 */
router.get('/body/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const bodyData = await healthDataService.getBodyMeasurements(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: bodyData,
    });
  } catch (error: any) {
    console.error('Error getting body measurements:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get nutrition data for a user
 */
router.get('/nutrition/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const nutritionData = await healthDataService.getNutritionData(
      userId,
      Number(days)
    );

    res.json({
      success: true,
      data: nutritionData,
    });
  } catch (error: any) {
    console.error('Error getting nutrition data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get sync statistics for a user
 */
router.get('/sync-stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await healthDataService.getSyncStatistics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting sync statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

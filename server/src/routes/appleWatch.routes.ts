import { Router, Request, Response } from 'express';
import { appleWatchSyncService } from '../services/appleWatchSyncService';

const router = Router();

// Connect Apple Watch (HealthKit authorization)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { deviceInfo } = req.body;
    await appleWatchSyncService.connectDevice(userId, deviceInfo);
    res.json({ success: true, message: 'Apple Watch connected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Disconnect Apple Watch
router.post('/:userId/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await appleWatchSyncService.disconnectDevice(userId);
    res.json({ success: true, message: 'Apple Watch disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await appleWatchSyncService.syncUser(userId, 'manual');
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Save HealthKit data (called by iOS app)
router.post('/:userId/healthkit-data', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const healthKitData = req.body;
    await appleWatchSyncService.saveHealthKitData(userId, healthKitData);
    res.json({ success: true, message: 'HealthKit data saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest metrics
router.get('/:userId/metrics/latest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const metrics = await appleWatchSyncService.getLatestMetrics(userId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get activity rings
router.get('/:userId/activity-rings', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    const rings = await appleWatchSyncService.getTodayActivityRings(userId, date as string);
    res.json({ success: true, data: rings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workout summary
router.get('/:userId/workouts/summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const summary = await appleWatchSyncService.getWorkoutSummary(
      userId,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get HRV trend
router.get('/:userId/hrv/trend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const trend = await appleWatchSyncService.getHRVTrend(userId, Number(days));
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

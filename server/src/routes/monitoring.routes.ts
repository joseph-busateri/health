import { Router, Request, Response } from 'express';
import { deviceSyncMonitoringService } from '../services/deviceSyncMonitoringService';
import { sexualHealthMetrics } from '../utils/sexualHealthMetrics';

const router = Router();

// Get sync health metrics for all devices
router.get('/sync-health', async (req: Request, res: Response) => {
  try {
    const metrics = await deviceSyncMonitoringService.getSyncHealthMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get failing users across all devices
router.get('/failing-users', async (req: Request, res: Response) => {
  try {
    const users = await deviceSyncMonitoringService.getFailingUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync history for a specific user and device
router.get('/sync-history/:deviceType/:userId', async (req: Request, res: Response) => {
  try {
    const deviceType = req.params.deviceType as string;
    const userId = req.params.userId as string;
    const limitParam = req.query.limit;
    const limit = typeof limitParam === 'string' ? Number(limitParam) : 10;

    if (!['oura', 'apple_watch', 'sleep_number'].includes(deviceType)) {
      return res.status(400).json({ success: false, error: 'Invalid device type' });
    }

    const history = await deviceSyncMonitoringService.getUserSyncHistory(
      userId,
      deviceType as 'oura' | 'apple_watch' | 'sleep_number',
      limit
    );

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Reset consecutive failures for a user
router.post('/reset-failures/:deviceType/:userId', async (req: Request, res: Response) => {
  try {
    const deviceType = req.params.deviceType as string;
    const userId = req.params.userId as string;

    if (!['oura', 'apple_watch', 'sleep_number'].includes(deviceType)) {
      return res.status(400).json({ success: false, error: 'Invalid device type' });
    }

    await deviceSyncMonitoringService.resetConsecutiveFailures(
      userId,
      deviceType as 'oura' | 'apple_watch' | 'sleep_number'
    );

    res.json({ success: true, message: 'Consecutive failures reset' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Trigger monitoring check (can be called manually or by cron)
router.post('/check-all', async (req: Request, res: Response) => {
  try {
    await deviceSyncMonitoringService.monitorAllDevices();
    res.json({ success: true, message: 'Monitoring check completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sexual health V2 metrics
router.get('/sexual-health-v2', async (req: Request, res: Response) => {
  try {
    const metrics = sexualHealthMetrics.getAllMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Reset sexual health V2 metrics (useful for testing)
router.post('/sexual-health-v2/reset', async (req: Request, res: Response) => {
  try {
    sexualHealthMetrics.reset();
    res.json({ success: true, message: 'Sexual health V2 metrics reset' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

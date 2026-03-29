import { Router, Request, Response } from 'express';
import { sleepNumberSyncService } from '../services/sleepNumberSyncService';

const router = Router();

// Connect Sleep Number account (OAuth callback)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, password } = req.body;
    await sleepNumberSyncService.connectAccount(userId, username, password);
    res.json({ success: true, message: 'Sleep Number connected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Disconnect Sleep Number account
router.post('/:userId/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await sleepNumberSyncService.disconnectAccount(userId);
    res.json({ success: true, message: 'Sleep Number disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await sleepNumberSyncService.syncUser(userId, 'manual');
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync statistics
router.get('/:userId/sync/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const stats = await sleepNumberSyncService.getSyncStatistics(userId, Number(days));
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest sleep session
router.get('/:userId/sleep/latest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const session = await sleepNumberSyncService.getLatestSleepSession(userId);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sleep trend
router.get('/:userId/sleep/trend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    const trend = await sleepNumberSyncService.getSleepTrend(userId, Number(days));
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

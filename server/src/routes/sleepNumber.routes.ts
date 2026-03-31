import { Router, Request, Response } from 'express';
import { sleepNumberSyncService } from '../services/sleepNumberSyncService';
import { sleepNumberService } from '../services/sleepNumberService';

const router = Router();

// Connect Sleep Number account (OAuth callback)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { username, password } = req.body;
    const result = await sleepNumberSyncService.connectAccount(userId, username, password);
    res.json({ success: true, message: 'Sleep Number connected successfully', ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Disconnect Sleep Number account
router.post('/:userId/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await sleepNumberSyncService.disconnectAccount(userId);
    res.json({ success: true, message: 'Sleep Number disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await sleepNumberSyncService.runAutomaticSync();
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync statistics
router.get('/:userId/sync/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const days = Number(req.query.days) || 30;
    const stats = await sleepNumberSyncService.getSyncStatistics(userId, days);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest sleep session
router.get('/:userId/sleep/latest', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const sessions = await sleepNumberService.getRecentSessions(userId, 1);
    res.json({ success: true, data: sessions[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sleep trend
router.get('/:userId/sleep/trend', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const days = Number(req.query.days) || 7;
    const trend = await sleepNumberService.getSleepTrends(userId, days);
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

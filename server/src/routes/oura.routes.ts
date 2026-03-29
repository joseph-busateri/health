import { Router, Request, Response } from 'express';
import { ouraSyncService } from '../services/ouraSyncService';

const router = Router();

// Connect Oura account (OAuth callback)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { code, redirectUri } = req.body;
    await ouraSyncService.connectAccount(userId, code, redirectUri);
    res.json({ success: true, message: 'Oura Ring connected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Disconnect Oura account
router.post('/:userId/disconnect', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await ouraSyncService.disconnectAccount(userId);
    res.json({ success: true, message: 'Oura Ring disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await ouraSyncService.syncUser(userId, 'manual');
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
    const stats = await ouraSyncService.getSyncStatistics(userId, Number(days));
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest readiness score
router.get('/:userId/readiness/latest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const readiness = await ouraSyncService.getLatestReadiness(userId);
    res.json({ success: true, data: readiness });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sleep trend
router.get('/:userId/sleep/trend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    const trend = await ouraSyncService.getSleepTrend(userId, Number(days));
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

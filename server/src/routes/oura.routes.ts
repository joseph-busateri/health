import { Router, Request, Response } from 'express';
import { ouraSyncService } from '../services/ouraSyncService';

const router = Router();

// Connect Oura account (OAuth callback)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
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
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    await ouraSyncService.disconnectAccount(userId);
    res.json({ success: true, message: 'Oura Ring disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    await ouraSyncService.syncUser(userId, 'manual');
    res.json({ success: true, message: 'Sync completed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sync statistics
router.get('/:userId/sync/stats', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { days = 30 } = req.query as { days?: string };
    const stats = await ouraSyncService.getSyncStatistics(userId, Number(days));
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest readiness score
router.get('/:userId/readiness/latest', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const readiness = await ouraSyncService.getLatestReadiness(userId);
    res.json({ success: true, data: readiness });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get sleep trend
router.get('/:userId/sleep/trend', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { days = 7 } = req.query as { days?: string };
    const trend = await ouraSyncService.getSleepTrend(userId, Number(days));
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get latest summary (readiness + sleep + activity + SpO2)
router.get('/:userId/summary/latest', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const summary = await ouraSyncService.getLatestSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recent sessions (meditations, breathwork, etc.)
router.get('/:userId/sessions/recent', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { limit = '10' } = req.query as { limit?: string };
    const sessions = await ouraSyncService.getRecentSessions(userId, Number(limit));
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recent tags
router.get('/:userId/tags/recent', async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { limit = '10' } = req.query as { limit?: string };
    const tags = await ouraSyncService.getRecentTags(userId, Number(limit));
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;

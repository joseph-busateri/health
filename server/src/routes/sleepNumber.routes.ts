import { Router, Request, Response } from 'express';
import { sleepNumberSyncService } from '../services/sleepNumberSyncService';
import { sleepNumberService } from '../services/sleepNumberService';
import { supabase } from '../config/supabase';

const router = Router();

// Connect Sleep Number account (OAuth callback)
router.post('/:userId/connect', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    const result = await sleepNumberSyncService.connectAccount(userId, username, password);
    res.json({ success: true, message: 'Sleep Number connected successfully', ...result });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('authenticate') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      res.status(401).json({ success: false, error: 'Invalid Sleep Number credentials' });
    } else if (errorMessage.includes('No beds found')) {
      res.status(404).json({ success: false, error: 'No Sleep Number beds found for this account' });
    } else {
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
});

router.post('/:userId/upload', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { fileContent, fileType } = req.body as { fileContent?: string; fileType?: 'json' | 'csv' };

    if (!fileContent || !fileType) {
      return res.status(400).json({ success: false, error: 'fileContent and fileType are required' });
    }

    const result = await sleepNumberService.uploadSleepData(userId, fileContent, fileType);
    res.json({ success: true, data: result });
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
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found') || errorMessage.includes('No connection')) {
      res.status(404).json({ success: false, error: 'No Sleep Number connection found for this user' });
    } else {
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
});

// Manual sync trigger
router.post('/:userId/sync', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    // Get user's connection
    const { data: connection, error: connError } = await supabase
      .from('sleep_number_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .single();

    if (connError || !connection) {
      return res.status(404).json({ success: false, error: 'No active Sleep Number connection. Please connect your account first.' });
    }

    // Process sync for this specific connection
    const result = await sleepNumberSyncService.processSyncJob(
      'manual-' + Date.now(),
      connection.id,
      userId
    );

    res.json({ success: true, message: 'Sync completed successfully', data: result });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found') || errorMessage.includes('No connection') || errorMessage.includes('not connected')) {
      res.status(404).json({ success: false, error: 'No active Sleep Number connection. Please connect your account first.' });
    } else {
      res.status(500).json({ success: false, error: errorMessage });
    }
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
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found') || errorMessage.includes('No connection')) {
      res.status(404).json({ success: false, error: errorMessage });
    } else if (errorMessage.includes('function') || errorMessage.includes('schema cache')) {
      res.status(503).json({ success: false, error: 'Database function not available. Please run migrations.' });
    } else {
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
});

// Get latest sleep session
router.get('/:userId/sleep/latest', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const sessions = await sleepNumberService.getRecentSessions(userId, 1);
    res.json({ success: true, data: sessions[0] || null });
  } catch (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found') || errorMessage.includes('No sessions')) {
      res.status(404).json({ success: false, error: 'No sleep sessions found for this user' });
    } else {
      res.status(500).json({ success: false, error: errorMessage });
    }
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

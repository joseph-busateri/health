import { Request, Response } from 'express';
import {
  getCrossEngineIntelligenceToday,
  getCrossEngineIntelligenceHistory,
} from '../services/crossEngineIntelligenceService';
import { logger } from '../utils/logger';

export const getCrossEngineIntelligenceTodayHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getCrossEngineIntelligenceToday(Array.isArray(userId) ? userId[0] : userId);

    if (!data) {
      return res.status(404).json({ error: 'No cross-engine intelligence data available' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get cross-engine intelligence today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get cross-engine intelligence data',
      details: (error as Error).message,
    });
  }
};

export const getCrossEngineIntelligenceHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getCrossEngineIntelligenceHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get cross-engine intelligence history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get cross-engine intelligence history',
      details: (error as Error).message,
    });
  }
};

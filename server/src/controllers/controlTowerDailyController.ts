import { Request, Response } from 'express';

import { getControlTowerDaily, getControlTowerDailyHistory } from '../services/controlTowerDailyService';
import { logger } from '../utils/logger';

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

export const getControlTowerDailyHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getControlTowerDaily(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get control tower daily', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get control tower daily',
      details: (error as Error).message,
    });
  }
};

export const getControlTowerDailyHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getControlTowerDailyHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get control tower daily history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get control tower daily history',
      details: (error as Error).message,
    });
  }
};

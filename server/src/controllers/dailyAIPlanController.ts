import { Request, Response } from 'express';

import { getDailyAIPlan, getDailyAIPlanHistory } from '../services/dailyAIPlanService';
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

export const getDailyAIPlanHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getDailyAIPlan(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get daily AI plan', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get daily AI plan',
      details: (error as Error).message,
    });
  }
};

export const getDailyAIPlanHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getDailyAIPlanHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get daily AI plan history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get daily AI plan history',
      details: (error as Error).message,
    });
  }
};

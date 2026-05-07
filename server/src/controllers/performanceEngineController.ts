import { Request, Response } from 'express';
import { getPerformanceToday } from '../services/performanceEngineService';
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

export const getPerformanceTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getPerformanceToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get performance today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get performance today',
      details: (error as Error).message,
    });
  }
};

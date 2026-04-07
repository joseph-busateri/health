import { Request, Response } from 'express';

import { getSexualHealthToday, getSexualHealthHistory } from '../services/sexualHealthEngineService';
import { logger } from '../utils/logger';

export const getSexualHealthTodayHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getSexualHealthToday(Array.isArray(userId) ? userId[0] : userId);

    if (!data) {
      return res.status(404).json({ error: 'No sexual health data available' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get sexual health today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get sexual health data',
      details: (error as Error).message,
    });
  }
};

export const getSexualHealthHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getSexualHealthHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get sexual health history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get sexual health history',
      details: (error as Error).message,
    });
  }
};

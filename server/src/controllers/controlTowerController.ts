import type { Request, Response } from 'express';
import { getControlTowerOverallHealth } from '../services/controlTowerService';
import { logger } from '../utils/logger';

export const getOverallHealthHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'user_id query parameter is required',
      });
      return;
    }

    const data = await getControlTowerOverallHealth(userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Control Tower overall health handler failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to compute overall health',
      message: (error as Error).message,
    });
  }
};

import type { Request, Response } from 'express';
import { getAutonomousToday, getAutonomousHistory } from '../services/autonomousOptimizationService';
import { logger } from '../utils/logger';

export const getAutonomousTodayHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('📋 Autonomous optimization request', { userId, regenerate });

    const result = await getAutonomousToday(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('❌ Autonomous optimization request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get autonomous optimization',
    });
  }
};

export const getAutonomousHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Autonomous history request', { userId });

    const history = await getAutonomousHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('❌ Autonomous history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get autonomous history',
    });
  }
};

import type { Request, Response } from 'express';
import { getPredictiveToday, getPredictiveHistory } from '../services/predictiveIntelligenceService';
import { logger } from '../utils/logger';

export const getPredictiveTodayHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('📋 Predictive intelligence request', { userId, regenerate });

    const result = await getPredictiveToday(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('❌ Predictive intelligence request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get predictive intelligence',
    });
  }
};

export const getPredictiveHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Predictive history request', { userId });

    const history = await getPredictiveHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('❌ Predictive history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get predictive history',
    });
  }
};

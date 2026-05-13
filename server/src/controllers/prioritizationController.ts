import type { Request, Response } from 'express';
import { getPrioritizedRecommendations, getPrioritizationHistory } from '../services/recommendationPrioritizationService';
import { logger } from '../utils/logger';

export const getPrioritiesHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('📋 Priorities request', { userId, regenerate });

    const result = await getPrioritizedRecommendations(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('❌ Priorities request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get prioritized recommendations',
    });
  }
};

export const getPrioritizationHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Prioritization history request', { userId });

    const history = await getPrioritizationHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('❌ Prioritization history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get prioritization history',
    });
  }
};

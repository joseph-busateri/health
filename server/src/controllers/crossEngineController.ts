import type { Request, Response } from 'express';
import { getCrossEngineToday, getCrossEngineHistory } from '../services/crossEngineSynthesisService';
import { logger } from '../utils/logger';

export const getCrossEngineTodayHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('Cross-Engine today request', { userId, regenerate });

    const result = await getCrossEngineToday(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Cross-Engine today error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get cross-engine analysis',
    });
  }
};

export const getCrossEngineHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('Cross-Engine history request', { userId });

    const history = await getCrossEngineHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Cross-Engine history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get cross-engine history',
    });
  }
};

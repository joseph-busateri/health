import type { Request, Response } from 'express';
import { getAdaptiveToday, getAdaptiveHistory } from '../services/adaptiveIntelligenceService';
import { trackAdherence } from '../services/adherenceTrackingService';
import { getAdaptiveInsights } from '../services/adaptiveScoringService';
import { logger } from '../utils/logger';

export const getAdaptiveTodayHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('📋 Adaptive intelligence request', { userId, regenerate });

    const result = await getAdaptiveToday(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('❌ Adaptive intelligence request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get adaptive intelligence',
    });
  }
};

export const getAdaptiveHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Adaptive history request', { userId });

    const history = await getAdaptiveHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('❌ Adaptive history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get adaptive history',
    });
  }
};

export const getAdaptiveInsightsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Adaptive insights request', { userId });

    const insights = getAdaptiveInsights(userId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error('❌ Adaptive insights error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get adaptive insights',
    });
  }
};

export const trackAdherenceHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { recommendationId, adherenceStatus, notes } = req.body;

    logger.info('📋 Track adherence request', { userId, recommendationId, adherenceStatus });

    trackAdherence({
      userId,
      recommendationId,
      adherenceStatus,
      notes,
    });

    res.json({
      success: true,
      message: 'Adherence tracked successfully',
    });
  } catch (error) {
    logger.error('❌ Track adherence error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to track adherence',
    });
  }
};

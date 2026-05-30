import { Request, Response } from 'express';

import { getCardiovascularToday, getCardiovascularHistory } from '../services/cardiovascularEngineService';
import { logger } from '../utils/logger';

export const getCardiovascularTodayHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const regenerate = req.query.regenerate === 'true';
    const data = await getCardiovascularToday(Array.isArray(userId) ? userId[0] : userId, { regenerate });

    if (!data) {
      return res.status(404).json({ error: 'No cardiovascular data available' });
    }

    logger.info('🚀 [CARDIOVASCULAR CONTROLLER] Sending response to frontend', {
      userId,
      hasDetailedInputs: !!data.detailedInputs,
      detailedInputsCount: data.detailedInputs?.length || 0,
      responseKeys: Object.keys(data),
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get cardiovascular today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get cardiovascular data',
      details: (error as Error).message,
    });
  }
};

export const getCardiovascularHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getCardiovascularHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get cardiovascular history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get cardiovascular history',
      details: (error as Error).message,
    });
  }
};

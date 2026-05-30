import { Request, Response } from 'express';

import { getMetabolicToday, getMetabolicHistory } from '../services/metabolicEngineService';
import { getMetabolicTodayV2, getMetabolicHistoryV2 } from '../services/metabolicEngineServiceV2';
import { logger } from '../utils/logger';

export const getMetabolicTodayHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getMetabolicToday(Array.isArray(userId) ? userId[0] : userId);

    if (!data) {
      return res.status(404).json({ error: 'No metabolic data available' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get metabolic today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get metabolic data',
      details: (error as Error).message,
    });
  }
};

export const getMetabolicHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getMetabolicHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get metabolic history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get metabolic history',
      details: (error as Error).message,
    });
  }
};

// ============================================================================
// V2 HANDLERS (No hardcoded defaults, weight trend calculation, HOMA-IR)
// ============================================================================

export const getMetabolicTodayV2Handler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getMetabolicTodayV2(Array.isArray(userId) ? userId[0] : userId);

    if (!data) {
      return res.status(404).json({ error: 'No metabolic data available' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get metabolic today V2', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get metabolic data',
      details: (error as Error).message,
    });
  }
};

export const getMetabolicHistoryV2Handler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const data = await getMetabolicHistoryV2(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get metabolic history V2', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get metabolic history',
      details: (error as Error).message,
    });
  }
};

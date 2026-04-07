import { Request, Response } from 'express';

import { getNutritionTodayIntegrated, getNutritionTodayHistory, seedNutritionBaseline } from '../services/nutritionTodayIntegratedService';
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

export const getNutritionTodayIntegratedHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getNutritionTodayIntegrated(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get nutrition today integrated', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get nutrition today integrated',
      details: (error as Error).message,
    });
  }
};

export const getNutritionTodayHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getNutritionTodayHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get nutrition today history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get nutrition today history',
      details: (error as Error).message,
    });
  }
};

export const seedNutritionBaselineHandler = async (req: Request, res: Response) => {
  try {
    const baseline = req.body;
    if (!baseline.userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    await seedNutritionBaseline(baseline);
    res.status(200).json({ success: true, message: 'Nutrition baseline seeded' });
  } catch (error) {
    logger.error('Failed to seed nutrition baseline', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to seed nutrition baseline',
      details: (error as Error).message,
    });
  }
};

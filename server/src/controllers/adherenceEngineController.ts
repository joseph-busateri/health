import { Request, Response } from 'express';

import { getAdherenceHistory, getAdherenceToday } from '../services/adherenceEngineService';
import type { AdherenceInputs } from '../types/adherenceEngine';
import { logger } from '../utils/logger';

const parseNumber = (value: unknown): number | undefined => {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

export const getAdherenceTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const override: AdherenceInputs = {
      workoutAdherence: parseNumber(req.query.workout_adherence),
      nutritionAdherence: parseNumber(req.query.nutrition_adherence),
      sleepAdherence: parseNumber(req.query.sleep_adherence),
      supplementAdherence: parseNumber(req.query.supplement_adherence),
      verbalNotes: typeof req.query.notes === 'string' ? req.query.notes : undefined,
    };

    const data = await getAdherenceToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
      override,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get adherence today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get adherence today',
      details: (error as Error).message,
    });
  }
};

export const getAdherenceHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getAdherenceHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get adherence history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get adherence history',
      details: (error as Error).message,
    });
  }
};

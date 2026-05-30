import { Request, Response } from 'express';

import { getStressHistory, getStressToday } from '../services/stressEngineService';
import type { StressSourceInputs } from '../types/stressEngine';
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

export const getStressTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const override: StressSourceInputs = {
      interviewStressLevel: parseNumber(req.query.stress_level),
      hrv: parseNumber(req.query.hrv),
      sleepDurationHours: parseNumber(req.query.sleep_hours),
      workoutLoad: parseNumber(req.query.workout_load),
      recoveryScore: parseNumber(req.query.recovery_score),
    };

    const data = await getStressToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
      override,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get stress today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get stress today',
      details: (error as Error).message,
    });
  }
};

export const getStressHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getStressHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get stress history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get stress history',
      details: (error as Error).message,
    });
  }
};

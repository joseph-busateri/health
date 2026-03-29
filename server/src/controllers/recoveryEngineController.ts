import { Request, Response } from 'express';

import { getRecoveryHistory, getRecoveryToday } from '../services/recoveryEngineService';
import type { RecoverySourceInputs } from '../types/recoveryEngine';
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

export const getRecoveryTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const override: RecoverySourceInputs = {
      hrv: parseNumber(req.query.hrv),
      sleepDurationHours: parseNumber(req.query.sleep_hours),
      sleepQuality: parseNumber(req.query.sleep_quality),
      restingHr: parseNumber(req.query.resting_hr),
      stressLevel: parseNumber(req.query.stress_level),
      workoutLoad: parseNumber(req.query.workout_load),
      verbalRecoveryFeeling: parseNumber(req.query.verbal_recovery),
      adherenceScore: parseNumber(req.query.adherence_score),
    };

    const data = await getRecoveryToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
      override,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get recovery today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get recovery today',
      details: (error as Error).message,
    });
  }
};

export const getRecoveryHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getRecoveryHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get recovery history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get recovery history',
      details: (error as Error).message,
    });
  }
};

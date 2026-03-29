import { Request, Response } from 'express';

import { getJointHealthHistory, getJointHealthToday } from '../services/jointHealthEngineService';
import type { JointArea, JointHealthInputs } from '../types/jointHealthEngine';
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

const parseArea = (value: unknown): JointArea | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'shoulder' || normalized === 'knee' || normalized === 'back' || normalized === 'elbow' || normalized === 'other') {
    return normalized;
  }

  return 'other';
};

export const getJointHealthTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const override: JointHealthInputs = {
      painLevel: parseNumber(req.query.pain_level),
      tightnessLevel: parseNumber(req.query.tightness_level),
      sorenessLevel: parseNumber(req.query.soreness_level),
      affectedArea: parseArea(req.query.affected_area),
      workoutLoad: parseNumber(req.query.workout_load),
      recoveryScore: parseNumber(req.query.recovery_score),
      verbalNotes: typeof req.query.notes === 'string' ? req.query.notes : undefined,
    };

    const data = await getJointHealthToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
      override,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get joint health today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get joint health today',
      details: (error as Error).message,
    });
  }
};

export const getJointHealthHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getJointHealthHistory(Array.isArray(userId) ? userId[0] : userId);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get joint health history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get joint health history',
      details: (error as Error).message,
    });
  }
};

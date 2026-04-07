import { Request, Response } from 'express';

import { getWorkoutRecommendationToday, getWorkoutRecommendationHistory } from '../services/workoutEngineService';
import type { WorkoutSourceInputs } from '../types/workoutEngine';
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

export const getWorkoutRecommendationTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const override: WorkoutSourceInputs = {
      recoveryScore: parseNumber(req.query.recovery_score),
      stressScore: parseNumber(req.query.stress_score),
      jointRisk: typeof req.query.joint_risk === 'string' ? req.query.joint_risk : undefined,
      adherenceScore: parseNumber(req.query.adherence_score),
      predictiveRisk: typeof req.query.predictive_risk === 'string' ? req.query.predictive_risk : undefined,
      goalAlignment: parseNumber(req.query.goal_alignment),
      currentWeek: parseNumber(req.query.current_week),
      trainingStyle: typeof req.query.training_style === 'string' ? req.query.training_style : undefined,
    };

    const data = await getWorkoutRecommendationToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate: parseBoolean(req.query.regenerate),
      override,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get workout recommendation today', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get workout recommendation today',
      details: (error as Error).message,
    });
  }
};

export const getWorkoutRecommendationHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const data = await getWorkoutRecommendationHistory(Array.isArray(userId) ? userId[0] : userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get workout recommendation history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get workout recommendation history',
      details: (error as Error).message,
    });
  }
};

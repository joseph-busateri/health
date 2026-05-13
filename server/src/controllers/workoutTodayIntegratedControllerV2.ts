import { Request, Response } from 'express';
import { getWorkoutTodayV2 } from '../services/workoutTodayIntegratedServiceV2';
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

/**
 * Get workout today V2 with enhanced progressive overload
 */
export const getWorkoutTodayV2Handler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const regenerate = parseBoolean(req.query.regenerate);

    logger.info('Workout Today V2 request', { userId: normalizedUserId, regenerate });

    const data = await getWorkoutTodayV2(normalizedUserId, undefined, { regenerate });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get workout today V2', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.params.user_id,
    });
    res.status(500).json({
      error: 'Failed to get workout today V2',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

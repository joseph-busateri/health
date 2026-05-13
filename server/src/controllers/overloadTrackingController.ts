import { Request, Response } from 'express';
import {
  createOverloadTracking,
  markOverloadCompleted,
  getOverloadTrackingByDate,
  getOverloadTrackingHistory,
  getOverloadTrackingByExercise,
  getOverloadCompletionStats,
  getOverloadHistory,
  getOrCreateOverloadConfig,
  updateOverloadConfig,
} from '../services/overloadTrackingService';
import { logger } from '../utils/logger';

/**
 * Get overload tracking for a specific date
 */
export const getOverloadTrackingByDateHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId, date } = req.params;
    if (!userId || !date) {
      return res.status(400).json({ error: 'Missing required parameters: user_id, date' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const normalizedDate = Array.isArray(date) ? date[0] : date;
    const data = await getOverloadTrackingByDate(normalizedUserId, normalizedDate);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload tracking by date', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload tracking',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get overload tracking history for a user
 */
export const getOverloadTrackingHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const data = await getOverloadTrackingHistory(normalizedUserId, limit);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload tracking history', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload tracking history',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get overload tracking for a specific exercise
 */
export const getOverloadTrackingByExerciseHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId, exercise_key: exerciseKey } = req.params;
    if (!userId || !exerciseKey) {
      return res.status(400).json({ error: 'Missing required parameters: user_id, exercise_key' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const normalizedExerciseKey = Array.isArray(exerciseKey) ? exerciseKey[0] : exerciseKey;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await getOverloadTrackingByExercise(normalizedUserId, normalizedExerciseKey, limit);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload tracking by exercise', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload tracking by exercise',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Mark overload as completed
 */
export const markOverloadCompletedHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId, date, exercise_key: exerciseKey } = req.params;
    if (!userId || !date || !exerciseKey) {
      return res.status(400).json({ error: 'Missing required parameters: user_id, date, exercise_key' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const normalizedDate = Array.isArray(date) ? date[0] : date;
    const normalizedExerciseKey = Array.isArray(exerciseKey) ? exerciseKey[0] : exerciseKey;
    const { completionNotes } = req.body;

    const data = await markOverloadCompleted(normalizedUserId, normalizedDate, normalizedExerciseKey, completionNotes);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to mark overload as completed', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to mark overload as completed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get overload completion statistics
 */
export const getOverloadStatsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const data = await getOverloadCompletionStats(normalizedUserId, days);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload stats',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get overload history
 */
export const getOverloadHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const data = await getOverloadHistory(normalizedUserId, limit);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload history', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload history',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get overload config for a user
 */
export const getOverloadConfigHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const data = await getOrCreateOverloadConfig(normalizedUserId);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get overload config', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to get overload config',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update overload config for a user
 */
export const updateOverloadConfigHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }

    const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
    const data = await updateOverloadConfig(normalizedUserId, req.body);

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Failed to update overload config', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to update overload config',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

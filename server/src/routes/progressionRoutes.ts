import { Router } from 'express';
import type { Request, Response } from 'express';
import { getRecentProgressions } from '../services/progressionService';
import { generateProgressiveOverload } from '../services/overloadPlannerService';
import { logger } from '../utils/logger';
import type { OverloadContext } from '../services/overloadPlannerService';

const router = Router();

/**
 * GET /api/progression/history/:userId
 * Retrieves progression history for a user
 * Query params:
 *   - days: number of days to look back (default: 30)
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const daysParam = req.query.days;
    const daysStr = typeof daysParam === 'string' ? daysParam : Array.isArray(daysParam) ? daysParam[0] : undefined;
    const days = daysStr ? parseInt(daysStr, 10) : 30;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'Days must be between 1 and 365' });
    }

    logger.info('Fetching progression history', { userId, days });

    const progressions = await getRecentProgressions(userId, days);

    return res.status(200).json({
      userId,
      days,
      count: progressions.length,
      progressions,
    });
  } catch (error) {
    logger.error('Failed to fetch progression history', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Failed to fetch progression history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/progression/overload-recommendations
 * Generates AI-powered progressive overload recommendations
 * Body: OverloadContext
 */
router.post('/overload-recommendations', async (req: Request, res: Response) => {
  try {
    const context: OverloadContext = req.body;

    if (!context || !context.date || !context.readiness || !context.exercises) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'Required fields: date, readiness, exercises',
      });
    }

    logger.info('Generating overload recommendations', {
      date: context.date,
      exerciseCount: context.exercises.length,
      historyCount: context.history?.length || 0,
    });

    const decision = await generateProgressiveOverload(context);

    if (!decision) {
      return res.status(200).json({
        success: false,
        message: 'Unable to generate recommendations at this time',
        decision: null,
      });
    }

    return res.status(200).json({
      success: true,
      decision,
    });
  } catch (error) {
    logger.error('Failed to generate overload recommendations', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Failed to generate overload recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/progression/overload-recommendations/:userId
 * Simplified endpoint that generates recommendations based on user's recent data
 * This is a convenience endpoint that fetches context and generates recommendations
 */
router.get('/overload-recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const dateParam = req.query.date;
    const dateStr = typeof dateParam === 'string' ? dateParam : Array.isArray(dateParam) ? dateParam[0] : undefined;
    const date = dateStr || new Date().toISOString().slice(0, 10);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.info('Generating overload recommendations for user', { userId, date });

    // Fetch recent progressions to build context
    const recentProgressions = await getRecentProgressions(userId, 30);

    // Build minimal context for AI
    // In production, you'd fetch more data (readiness, exercises, etc.)
    const context: OverloadContext = {
      date,
      readiness: {
        recoveryScore: 75,
        stressScore: 70,
        jointScore: 80,
        adherenceScore: 85,
      },
      baselineDay: 'Upper A',
      exercises: [],
      history: recentProgressions.map(p => ({
        date: p.planDate,
        exerciseKey: p.exerciseKey,
        progressionStep: p.progressionStep,
        adjustmentSource: p.adjustmentSource,
        appliedPayload: p.appliedPayload,
      })),
    };

    const decision = await generateProgressiveOverload(context);

    if (!decision) {
      return res.status(200).json({
        success: false,
        message: 'Unable to generate recommendations at this time',
        decision: null,
      });
    }

    return res.status(200).json({
      success: true,
      userId,
      date,
      decision,
    });
  } catch (error) {
    logger.error('Failed to generate overload recommendations', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Failed to generate overload recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

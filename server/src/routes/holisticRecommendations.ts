import { Router, Request, Response } from 'express';
import { generateHolisticRecommendations, getHealthSummary } from '../services/holisticRecommendationEngine';
import { generateUnifiedHealthProfile } from '../services/healthProfileAggregation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/holistic/recommendations/:userId
 * Generate holistic recommendations for a user
 */
router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const forceAI = req.query.forceAI as string | undefined;

    logger.info('Generating holistic recommendations', { userId, forceAI });

    const result = await generateHolisticRecommendations({
      userId: userId as string,
      forceAI: forceAI === 'true'
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error generating holistic recommendations', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate holistic recommendations'
    });
  }
});

/**
 * GET /api/holistic/profile/:userId
 * Get unified health profile for a user
 */
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('Fetching unified health profile', { userId });

    const profile = await generateUnifiedHealthProfile(userId as string);

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    logger.error('Error fetching unified health profile', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch unified health profile'
    });
  }
});

/**
 * GET /api/holistic/summary/:userId
 * Get health summary with alerts, strengths, and areas for improvement
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('Fetching health summary', { userId });

    const summary = await getHealthSummary(userId as string);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error fetching health summary', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch health summary'
    });
  }
});

/**
 * POST /api/holistic/recommendations/generate
 * Generate holistic recommendations with options
 */
router.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { userId, forceAI = false } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    logger.info('Generating holistic recommendations via POST', { userId, forceAI });

    const result = await generateHolisticRecommendations({
      userId,
      forceAI
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error generating holistic recommendations', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.body.userId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate holistic recommendations'
    });
  }
});

export default router;

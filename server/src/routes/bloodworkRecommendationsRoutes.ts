import { Router } from 'express';
import {
  generateRecommendationsHandler,
  getRecommendationsHandler,
  getActiveRecommendationsHandler,
  createRecommendationHandler,
  updateRecommendationStatusHandler
} from '../controllers/bloodworkRecommendationsController';

const router = Router();

// POST /bloodwork/recommendations/generate/:user_id - Generate recommendations for a user
router.post('/recommendations/generate/:user_id', generateRecommendationsHandler);

// GET /bloodwork/recommendations/:user_id - Get all recommendations for a user
router.get('/recommendations/:user_id', getRecommendationsHandler);

// GET /bloodwork/recommendations/:user_id/active - Get active recommendations for a user
router.get('/recommendations/:user_id/active', getActiveRecommendationsHandler);

// POST /bloodwork/recommendations - Create a new recommendation
router.post('/recommendations', createRecommendationHandler);

// PUT /bloodwork/recommendations/:recommendation_id/status - Update recommendation status
router.put('/recommendations/:recommendation_id/status', updateRecommendationStatusHandler);

export default router;

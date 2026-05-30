import { Router } from 'express';
import {
  getBloodworkTrendsHandler,
  getBloodworkTrendSummaryHandler,
  getSupportedMarkersHandler,
  getMarkerCategoriesHandler
} from '../controllers/bloodworkTrendsController';

const router = Router();

// GET /bloodwork/trends/:user_id - Get bloodwork trends for a user
router.get('/trends/:user_id', getBloodworkTrendsHandler);

// GET /bloodwork/trends/:user_id/summary - Get bloodwork trend summary for a user
router.get('/trends/:user_id/summary', getBloodworkTrendSummaryHandler);

// GET /bloodwork/trends/supported-markers - Get all supported trend markers
router.get('/trends/supported-markers', getSupportedMarkersHandler);

// GET /bloodwork/trends/categories - Get available marker categories
router.get('/trends/categories', getMarkerCategoriesHandler);

export default router;

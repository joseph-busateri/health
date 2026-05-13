import { Router } from 'express';
import {
  getCurrentStateHandler,
  getHistoricalStateHandler,
  compareStatesHandler,
  getChangeEventsHandler,
  getAvailableDatesHandler,
  pointInTimeHealthHandler
} from '../controllers/pointInTimeController';

const router = Router();

// GET /state/current/:user_id - Get current effective state
router.get('/state/current/:user_id', getCurrentStateHandler);

// GET /state/as-of/:user_id - Get historical state as of specific date
router.get('/state/as-of/:user_id', getHistoricalStateHandler);

// GET /state/compare/:user_id - Compare current and historical states
router.get('/state/compare/:user_id', compareStatesHandler);

// GET /state/changes/:user_id - Get change events for a user
router.get('/state/changes/:user_id', getChangeEventsHandler);

// GET /state/dates/:user_id - Get available dates for state reconstruction
router.get('/state/dates/:user_id', getAvailableDatesHandler);

// GET /state/health - Health check for point-in-time service
router.get('/state/health', pointInTimeHealthHandler);

export default router;

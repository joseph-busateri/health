import { Router } from 'express';
import { 
  getAdaptiveTodayHandler, 
  getAdaptiveHistoryHandler,
  getAdaptiveInsightsHandler,
  trackAdherenceHandler
} from '../controllers/adaptiveController';

const router = Router();

// GET /adaptive/:userId/today - Get today's adaptive intelligence
router.get('/adaptive/:userId/today', getAdaptiveTodayHandler);

// GET /adaptive/:userId/history - Get adaptive history
router.get('/adaptive/:userId/history', getAdaptiveHistoryHandler);

// GET /adaptive/:userId/insights - Get adaptive insights
router.get('/adaptive/:userId/insights', getAdaptiveInsightsHandler);

// POST /adaptive/:userId/adherence - Track recommendation adherence
router.post('/adaptive/:userId/adherence', trackAdherenceHandler);

export default router;

import { Router } from 'express';
import {
  getCrossEngineIntelligenceTodayHandler,
  getCrossEngineIntelligenceHistoryHandler,
} from '../controllers/crossEngineIntelligenceController';

const router = Router();

// GET /cross-engine-intelligence/:userId/today - Get today's cross-engine intelligence
router.get('/:userId/today', getCrossEngineIntelligenceTodayHandler);

// GET /cross-engine-intelligence/:userId/history - Get cross-engine intelligence history
router.get('/:userId/history', getCrossEngineIntelligenceHistoryHandler);

export default router;

import { Router } from 'express';

import { getCrossEngineTodayHandler, getCrossEngineHistoryHandler } from '../controllers/crossEngineController';

const router = Router();

// GET /cross-engine/:userId/today - Get today's cross-engine analysis
router.get('/cross-engine/:userId/today', getCrossEngineTodayHandler);

// GET /cross-engine/:userId/history - Get cross-engine history
router.get('/cross-engine/:userId/history', getCrossEngineHistoryHandler);

export default router;

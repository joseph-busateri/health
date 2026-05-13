import { Router } from 'express';

import {
  getMetabolicTodayHandler,
  getMetabolicHistoryHandler,
  getMetabolicTodayV2Handler,
  getMetabolicHistoryV2Handler,
} from '../controllers/metabolicEngineController';

const router = Router();

// V1 routes (with hardcoded defaults)
router.get('/:userId/today', getMetabolicTodayHandler);
router.get('/:userId/history', getMetabolicHistoryHandler);

// V2 routes (no hardcoded defaults, weight trend calculation, HOMA-IR)
router.get('/v2/:userId/today', getMetabolicTodayV2Handler);
router.get('/v2/:userId/history', getMetabolicHistoryV2Handler);

export default router;

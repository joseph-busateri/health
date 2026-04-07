import { Router } from 'express';

import {
  getMetabolicTodayHandler,
  getMetabolicHistoryHandler,
} from '../controllers/metabolicEngineController';

const router = Router();

router.get('/:userId/today', getMetabolicTodayHandler);
router.get('/:userId/history', getMetabolicHistoryHandler);

export default router;

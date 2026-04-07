import { Router } from 'express';

import {
  getCardiovascularTodayHandler,
  getCardiovascularHistoryHandler,
} from '../controllers/cardiovascularEngineController';

const router = Router();

router.get('/:userId/today', getCardiovascularTodayHandler);
router.get('/:userId/history', getCardiovascularHistoryHandler);

export default router;

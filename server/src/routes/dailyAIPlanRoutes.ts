import { Router } from 'express';

import {
  getDailyAIPlanHandler,
  getDailyAIPlanHistoryHandler,
} from '../controllers/dailyAIPlanController';

const router = Router();

router.get('/:user_id/today', getDailyAIPlanHandler);
router.get('/:user_id/history', getDailyAIPlanHistoryHandler);

export default router;

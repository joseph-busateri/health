import { Router } from 'express';

import {
  getControlTowerDailyHandler,
  getControlTowerDailyHistoryHandler,
} from '../controllers/controlTowerDailyController';

const router = Router();

router.get('/:user_id/today', getControlTowerDailyHandler);
router.get('/:user_id/history', getControlTowerDailyHistoryHandler);

export default router;

import { Router } from 'express';

import {
  getSexualHealthTodayHandler,
  getSexualHealthHistoryHandler,
} from '../controllers/sexualHealthEngineController';

const router = Router();

router.get('/:userId/today', getSexualHealthTodayHandler);
router.get('/:userId/history', getSexualHealthHistoryHandler);

export default router;

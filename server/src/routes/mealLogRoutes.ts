import { Router } from 'express';

import { getMealLogs, postMealLog } from '../controllers/mealLogController';

const router = Router();

router.post('/meal-log', postMealLog);
router.get('/meal-logs/:user_id', getMealLogs);

export default router;

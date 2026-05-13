import { Router } from 'express';

import {
  getReminders,
  postCompleteReminder,
  postSeedDefaults,
} from '../controllers/reminderController';

const router = Router();

router.get('/:user_id', getReminders);
router.post('/complete', postCompleteReminder);
router.post('/seed-defaults', postSeedDefaults);

export default router;

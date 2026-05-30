import { Router } from 'express';

import {
  postStrengthSession,
  getStrengthSessions,
  getLatestStrengthSessionHandler,
} from '../controllers/strengthTrackingController';

const router = Router();

router.post('/strength/session', postStrengthSession);
router.get('/strength/sessions/:user_id', getStrengthSessions);
router.get('/strength/session/latest/:user_id', getLatestStrengthSessionHandler);

export default router;

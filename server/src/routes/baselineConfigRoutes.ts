import { Router } from 'express';

import { getBaseline, updateBaseline } from '../controllers/baselineConfigController';

const router = Router();

router.get('/baseline-config/:user_id', getBaseline);
router.post('/baseline-config', updateBaseline);

export default router;

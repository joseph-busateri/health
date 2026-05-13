import { Router } from 'express';
import { getOverallHealthHandler } from '../controllers/controlTowerController';

const router = Router();

// GET /control-tower/overall-health?user_id={userId} - Get aggregated overall health
router.get('/control-tower/overall-health', getOverallHealthHandler);

export default router;

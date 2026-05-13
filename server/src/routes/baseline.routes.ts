import { Router } from 'express';
import {
  getBaselineProfileHandler,
  updateBaselineProfileHandler,
} from '../controllers/healthDataHubController';

const router = Router();

// Direct baseline profile routes (accessible via /baseline/profile)
// These are aliases to the same handlers used by /health-data/baseline/profile
router.get('/profile', getBaselineProfileHandler);
router.post('/profile', updateBaselineProfileHandler);

export default router;

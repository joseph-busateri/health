import { Router } from 'express';
import {
  getHealthDataStatusHandler,
  getBaselineProfileHandler,
  updateBaselineProfileHandler,
} from '../controllers/healthDataHubController';

const router = Router();

// Health Data Hub status
router.get('/status', getHealthDataStatusHandler);

// Baseline Profile routes (accessible via /health-data/baseline/profile)
router.get('/baseline/profile', getBaselineProfileHandler);
router.post('/baseline/profile', updateBaselineProfileHandler);

export default router;

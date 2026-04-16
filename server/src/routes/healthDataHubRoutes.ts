import { Router } from 'express';
import {
  getHealthDataStatusHandler,
  getBaselineProfileHandler,
  updateBaselineProfileHandler,
  getWorkoutScheduleHandler,
  uploadWorkoutScheduleHandler,
  getSupplementIntakeHandler,
  uploadSupplementIntakeHandler,
  getBloodworkSummaryHandler,
} from '../controllers/healthDataHubController';

const router = Router();

// Health Data Hub status
router.get('/status', getHealthDataStatusHandler);

// Baseline Profile routes (accessible via /health-data/baseline/profile)
router.get('/baseline/profile', getBaselineProfileHandler);
router.post('/baseline/profile', updateBaselineProfileHandler);

router.get('/workout-schedule', getWorkoutScheduleHandler);
router.post('/workout-schedule/upload', uploadWorkoutScheduleHandler);

router.get('/supplement-intake', getSupplementIntakeHandler);
router.post('/supplement-intake/upload', uploadSupplementIntakeHandler);

router.get('/bloodwork/summary', getBloodworkSummaryHandler);

export default router;

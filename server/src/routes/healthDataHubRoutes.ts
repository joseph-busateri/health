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

router.get('/status', getHealthDataStatusHandler);

router.get('/baseline/profile', getBaselineProfileHandler);
router.post('/baseline/profile', updateBaselineProfileHandler);

router.get('/workout-schedule', getWorkoutScheduleHandler);
router.post('/workout-schedule/upload', uploadWorkoutScheduleHandler);

router.get('/supplement-intake', getSupplementIntakeHandler);
router.post('/supplement-intake/upload', uploadSupplementIntakeHandler);

router.get('/bloodwork/summary', getBloodworkSummaryHandler);

export default router;

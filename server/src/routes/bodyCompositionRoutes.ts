import { Router } from 'express';

import {
  uploadBodyCompositionDocumentHandler,
  uploadMiddleware,
  createBodyCompositionScanHandler,
  getLatestBodyCompositionHandler,
  getBodyCompositionHistory,
  getBodyCompositionTrendsHandler,
  createBodyCompositionGoalHandler,
  getActiveGoalsHandler,
  getGoalProgressHandler,
  detectAnomaliesHandler,
} from '../controllers/bodyCompositionController';

const router = Router();

// Document upload
router.post('/body-composition/upload', uploadMiddleware, uploadBodyCompositionDocumentHandler);

// Scan CRUD
router.post('/body-composition/scan', createBodyCompositionScanHandler);
router.get('/body-composition/latest/:user_id', getLatestBodyCompositionHandler);
router.get('/body-composition/history/:user_id', getBodyCompositionHistory);

// Trends
router.get('/body-composition/trends/:user_id', getBodyCompositionTrendsHandler);

// Goals
router.post('/body-composition/goal', createBodyCompositionGoalHandler);
router.get('/body-composition/goals/:user_id', getActiveGoalsHandler);
router.get('/body-composition/goal/:goal_id/progress', getGoalProgressHandler);

// Anomaly detection
router.get('/body-composition/anomalies/:user_id/:scan_id', detectAnomaliesHandler);

export default router;

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
  uploadBodyCompositionCSVHandler,
} from '../controllers/bodyCompositionController';

const router = Router();

// Document upload
router.post('/body-composition/upload', uploadMiddleware, uploadBodyCompositionDocumentHandler);

// CSV upload
router.post('/body-composition/:user_id/upload-csv', uploadMiddleware, (req, res, next) => {
  console.log('[CSV Route] Route matched, calling handler');
  uploadBodyCompositionCSVHandler(req, res, next);
});

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

// Test endpoint with mock data
router.get('/body-composition/test/:user_id', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.params.user_id,
      scanDate: new Date().toISOString(),
      weightLb: 185.5,
      bodyFatPercentage: 15.2,
      muscleMassLb: 157.3,
      visceralFatLevel: 8,
      bmr: 1850,
      metabolicAge: 28,
      notes: "Good progress on muscle gain"
    }
  });
});

export default router;

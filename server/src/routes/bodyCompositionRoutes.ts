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
router.post('/upload', uploadMiddleware, uploadBodyCompositionDocumentHandler);

// CSV upload
router.post('/:user_id/upload-csv', uploadMiddleware, (req, res, next) => {
  console.log('[CSV Route] Route matched, calling handler');
  uploadBodyCompositionCSVHandler(req, res, next);
});

// Scan CRUD
router.post('/scan', createBodyCompositionScanHandler);
router.get('/latest/:user_id', getLatestBodyCompositionHandler);
router.get('/history/:user_id', getBodyCompositionHistory);

// Trends
router.get('/trends/:user_id', getBodyCompositionTrendsHandler);

// Goals
router.post('/goal', createBodyCompositionGoalHandler);
router.get('/goals/:user_id', getActiveGoalsHandler);
router.get('/goal/:goal_id/progress', getGoalProgressHandler);

// Anomaly detection
router.get('/anomalies/:user_id/:scan_id', detectAnomaliesHandler);

// Test endpoint with mock data
router.get('/test/:user_id', (req, res) => {
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

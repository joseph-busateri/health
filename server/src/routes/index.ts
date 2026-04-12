import { Router } from 'express';
import bloodworkRoutes from './bloodwork.routes';
import workoutRoutes from './workouts.routes';
import workoutDocumentRoutes from './workoutDocumentRoutes';
import supplementRoutes from './supplements.routes';
import recoveryRoutes from './recovery.routes';
import injuryRoutes from './injury.routes';
import goalsRoutes from './goals.routes';
import analyticsRoutes from './analytics.routes';
import sleepNumberRoutes from './sleepNumber.routes';
import appleWatchRoutes from './appleWatch.routes';
import ouraRoutes from './oura.routes';
import bodyCompositionRoutes from './bodyComposition.routes';
import strengthRoutes from './strength.routes';
import tapeMeasurementsRoutes from './tapeMeasurements.routes';
import aiAgentRoutes from './aiAgent.routes';
import recommendationEngineRoutes from './recommendationEngineRoutes';

const router = Router();

// Health Data Routes
router.use('/bloodwork', bloodworkRoutes);
router.use('/workouts', workoutRoutes);
router.use('/workout-document', workoutDocumentRoutes);
router.use('/supplements', supplementRoutes);
router.use('/body-composition', bodyCompositionRoutes);
router.use('/strength', strengthRoutes);
router.use('/tape-measurements', tapeMeasurementsRoutes);

// Intelligence & Analytics Routes
router.use('/ai-agent', aiAgentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/recovery', recoveryRoutes);
router.use('/injury', injuryRoutes);
router.use('/goals', goalsRoutes);
router.use('/recommendations', recommendationEngineRoutes);

// Device Integration Routes
router.use('/devices/sleep-number', sleepNumberRoutes);
router.use('/devices/apple-watch', appleWatchRoutes);
router.use('/devices/oura', ouraRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health Optimization API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;

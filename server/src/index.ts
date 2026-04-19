/// <reference types="node" />
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import healthRoutes from './routes/health';
import dailyLogsRoutes from './routes/dailyLogs';
import structuredDailyLogRoutes from './routes/dailyLogRoutes';
import reminderRoutes from './routes/reminderRoutes';
import mealLogRoutes from './routes/mealLogRoutes';
import physiqueScanRoutes from './routes/physiqueScanRoutes';
import baselineConfigRoutes from './routes/baselineConfigRoutes';
import baselineDocumentRoutes from './routes/baselineDocumentRoutes';
import workoutDocumentRoutes from './routes/workoutDocumentRoutes';
import workoutsRoutes from './routes/workouts.routes';
import supplementDocumentRoutes from './routes/supplementDocumentRoutes';
import pointInTimeRoutes from './routes/pointInTimeRoutes';
import bloodworkRoutes from './routes/bloodworkRoutes';
import bloodworkResultsRoutes from './routes/bloodworkResultsRoutes';
import bloodworkTrendsRoutes from './routes/bloodworkTrendsRoutes';
import bloodworkRecommendationsRoutes from './routes/bloodworkRecommendationsRoutes';
import bodyCompositionRoutes from './routes/bodyCompositionRoutes';
import workoutBaselineRoutes from './routes/workoutBaselineRoutes';
import supplementBaselineRoutes from './routes/supplementBaselineRoutes';
import strengthTrackingRoutes from './routes/strengthTrackingRoutes';
import tapeMeasurementRoutes from './routes/tapeMeasurementRoutes';
import nutritionExtractionRoutes from './routes/nutritionExtractionRoutes';
import interviewAgentRoutes from './routes/interviewAgentRoutes';
import supplementEngineRoutes from './routes/supplementEngineRoutes';
import recoveryEngineRoutes from './routes/recoveryEngineRoutes';
import stressEngineRoutes from './routes/stressEngineRoutes';
import jointHealthEngineRoutes from './routes/jointHealthEngineRoutes';
import crossEngineRoutes from './routes/crossEngineRoutes';
import prioritizationRoutes from './routes/prioritizationRoutes';
import predictiveRoutes from './routes/predictiveRoutes';
import adaptiveRoutes from './routes/adaptiveRoutes';
import autonomousRoutes from './routes/autonomousRoutes';
import goalRoutes from './routes/goalRoutes';
import adherenceEngineRoutes from './routes/adherenceEngineRoutes';
import workoutEngineRoutes from './routes/workoutEngineRoutes';
import workoutTodayIntegratedRoutes from './routes/workoutTodayIntegratedRoutes';
import nutritionTodayIntegratedRoutes from './routes/nutritionTodayIntegratedRoutes';
import dailyAIPlanRoutes from './routes/dailyAIPlanRoutes';
import controlTowerDailyRoutes from './routes/controlTowerDailyRoutes';
import metabolicEngineRoutes from './routes/metabolicEngineRoutes';
import cardiovascularEngineRoutes from './routes/cardiovascularEngineRoutes';
import sexualHealthEngineRoutes from './routes/sexualHealthEngineRoutes';
import sexualHealthEngineRoutesV2 from './routes/sexualHealthEngineRoutesV2';
import crossEngineIntelligenceRoutes from './routes/crossEngineIntelligenceRoutes';
import notificationStateRoutes from './routes/notificationStateRoutes';
import dynamicFollowUpRoutes from './routes/dynamicFollowUpRoutes';
import healthDataHubRoutes from './routes/healthDataHubRoutes';
import controlTowerRoutes from './routes/controlTowerRoutes';
import hybridInterviewRoutes from './routes/hybridInterview.routes';
import voiceInterviewRoutes from './routes/voiceInterview';
import aiAgentRoutes from './routes/aiAgent.routes';
import healthDataRoutes from './routes/healthData.routes';
import progressionRoutes from './routes/progressionRoutes';
import supplementBulkUploadRoutes from './routes/supplementBulkUploadRoutes';
import baselineRoutes from './routes/baseline.routes';
import monitoringRoutes from './routes/monitoring.routes';

// New API Routes - Health Optimization Systems
import apiRoutes from './routes/index';

// Device Integration Cron Jobs
import { initializeOuraCronJobs } from './cron/ouraSync';
import { initializeAppleWatchCronJobs } from './cron/appleWatchSync';
import { initializeSleepNumberCronJobs } from './cron/sleepNumberSync';
import { initializeDeviceMonitoringCronJob } from './cron/deviceMonitoring';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-App-ID']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Diagnostic logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount new API routes under /api prefix FIRST to ensure they take precedence
app.use('/api', apiRoutes);

app.use('/health/metrics', healthRoutes);
app.use('/daily-logs', dailyLogsRoutes);
app.use('/reminders', reminderRoutes);
app.use('/', mealLogRoutes);
app.use('/', physiqueScanRoutes);
app.use('/', baselineConfigRoutes);
app.use('/', structuredDailyLogRoutes);
app.use('/', baselineDocumentRoutes);
app.use('/api/workout-document', workoutDocumentRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/', supplementDocumentRoutes);
app.use('/', pointInTimeRoutes);
app.use('/bloodwork', bloodworkRoutes);
app.use('/bloodwork', bloodworkResultsRoutes);
app.use('/bloodwork', bloodworkTrendsRoutes);
app.use('/bloodwork', bloodworkRecommendationsRoutes);
app.use('/', workoutBaselineRoutes);
app.use('/', supplementBaselineRoutes);
app.use('/', strengthTrackingRoutes);
app.use('/', tapeMeasurementRoutes);
app.use('/', nutritionExtractionRoutes);
app.use('/', interviewAgentRoutes);
app.use('/', supplementEngineRoutes);
app.use('/', recoveryEngineRoutes);
console.log('Loading stress engine routes...');
app.use('/', stressEngineRoutes);
console.log('Stress engine routes loaded');
app.use('/', jointHealthEngineRoutes);
app.use('/', crossEngineRoutes);
app.use('/', prioritizationRoutes);
app.use('/', predictiveRoutes);
app.use('/', adaptiveRoutes);
app.use('/', autonomousRoutes);
app.use('/', goalRoutes);
app.use('/', adherenceEngineRoutes);
app.use('/workout-engine', workoutEngineRoutes);
app.use('/workout-today', workoutTodayIntegratedRoutes);
app.use('/nutrition-today', nutritionTodayIntegratedRoutes);
app.use('/daily-plan', dailyAIPlanRoutes);
app.use('/control-tower', controlTowerDailyRoutes);
app.use('/metabolic', metabolicEngineRoutes);
app.use('/cardiovascular', cardiovascularEngineRoutes);
app.use('/sexual-health', sexualHealthEngineRoutes);
app.use('/api/sexual-health-v2', sexualHealthEngineRoutesV2);
app.use('/cross-engine-intelligence', crossEngineIntelligenceRoutes);
app.use('/', notificationStateRoutes);
app.use('/', dynamicFollowUpRoutes);
app.use('/health-data', healthDataHubRoutes);
app.use('/', controlTowerRoutes);
app.use('/hybrid-interview', hybridInterviewRoutes);
app.use('/api/voice-interview', voiceInterviewRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/health-data', healthDataRoutes);
app.use('/api/progression', progressionRoutes);
app.use('/api/supplements', supplementBulkUploadRoutes);
app.use('/baseline', baselineRoutes);
app.use('/monitoring', monitoringRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Health API Server is running!' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize device integration cron jobs
initializeOuraCronJobs();
initializeAppleWatchCronJobs();
initializeSleepNumberCronJobs();
initializeDeviceMonitoringCronJob();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health API available at http://localhost:${PORT}/health`);
});

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
import adherenceEngineRoutes from './routes/adherenceEngineRoutes';
import notificationStateRoutes from './routes/notificationStateRoutes';
import dynamicFollowUpRoutes from './routes/dynamicFollowUpRoutes';
import healthDataHubRoutes from './routes/healthDataHubRoutes';
import controlTowerRoutes from './routes/controlTowerRoutes';
import hybridInterviewRoutes from './routes/hybridInterview.routes';
import voiceInterviewRoutes from './routes/voiceInterview';
import sleepNumberRoutes from './routes/sleepNumber.routes';
import healthDataRoutes from './routes/healthData.routes';

// New API Routes - Health Optimization Systems
import apiRoutes from './routes/index';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/health/metrics', healthRoutes);
app.use('/daily-logs', dailyLogsRoutes);
app.use('/reminders', reminderRoutes);
app.use('/', mealLogRoutes);
app.use('/', physiqueScanRoutes);
app.use('/', baselineConfigRoutes);
app.use('/', structuredDailyLogRoutes);
app.use('/', baselineDocumentRoutes);
app.use('/', workoutDocumentRoutes);
app.use('/', supplementDocumentRoutes);
app.use('/', pointInTimeRoutes);
app.use('/bloodwork', bloodworkRoutes);
app.use('/bloodwork', bloodworkResultsRoutes);
app.use('/bloodwork', bloodworkTrendsRoutes);
app.use('/bloodwork', bloodworkRecommendationsRoutes);
app.use('/', bodyCompositionRoutes);
app.use('/', workoutBaselineRoutes);
app.use('/', supplementBaselineRoutes);
app.use('/', strengthTrackingRoutes);
app.use('/', tapeMeasurementRoutes);
app.use('/', nutritionExtractionRoutes);
app.use('/', interviewAgentRoutes);
app.use('/', supplementEngineRoutes);
app.use('/', recoveryEngineRoutes);
app.use('/', stressEngineRoutes);
app.use('/', jointHealthEngineRoutes);
app.use('/', adherenceEngineRoutes);
app.use('/', notificationStateRoutes);
app.use('/', dynamicFollowUpRoutes);
app.use('/health-data', healthDataHubRoutes);
app.use('/', controlTowerRoutes);
app.use('/hybrid-interview', hybridInterviewRoutes);
app.use('/api/voice-interview', voiceInterviewRoutes);
app.use('/sleep-number', sleepNumberRoutes);
app.use('/api/health-data', healthDataRoutes);

// Mount new API routes under /api prefix
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Health API Server is running!' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health API available at http://localhost:${PORT}/health`);
});

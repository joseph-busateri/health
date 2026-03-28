/// <reference types="node" />
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

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

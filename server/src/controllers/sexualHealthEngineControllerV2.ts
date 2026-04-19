import { Request, Response } from 'express';
import { getSexualHealthTodayV2, getSexualHealthHistoryV2 } from '../services/sexualHealthEngineServiceV2';
import { sexualHealthMetrics, METRIC_NAMES } from '../utils/sexualHealthMetrics';
import { logger } from '../utils/logger';

export const getSexualHealthTodayV2Handler = async (req: Request, res: Response) => {
  const requestStart = Date.now();
  sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_REQUESTS_TOTAL);
  
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    logger.info('🔵 [SEXUAL HEALTH V2 API] Getting sexual health today', { userId });

    const data = await getSexualHealthTodayV2(Array.isArray(userId) ? userId[0] : userId);

    if (!data) {
      logger.warn('⚠️ [SEXUAL HEALTH V2 API] No sexual health data available', { userId });
      return res.status(404).json({ error: 'No sexual health data available' });
    }

    logger.info('✅ [SEXUAL HEALTH V2 API] Sexual health data retrieved', { 
      userId, 
      sexualHealthStatus: data.sexualHealthStatus,
      hasTrends: !!data.trendMetadata,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V2 API] Failed to get sexual health today', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      error: 'Failed to get sexual health data',
      details: (error as Error).message,
    });
  }
};

export const getSexualHealthHistoryV2Handler = async (req: Request, res: Response) => {
  const requestStart = Date.now();
  sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_REQUESTS_TOTAL);
  const { userId } = req.params;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    logger.info('🔵 [SEXUAL HEALTH V2 API] Getting sexual health history', { userId });

    const data = await getSexualHealthHistoryV2(Array.isArray(userId) ? userId[0] : userId);

    const latency = (Date.now() - requestStart) / 1000;
    sexualHealthMetrics.record(METRIC_NAMES.SEXUAL_HEALTH_V2_LATENCY_SECONDS, latency);
    
    logger.info('✅ [SEXUAL HEALTH V2 API] Sexual health history retrieved', { 
      userId, 
      recordCount: data.length,
      latency,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const latency = (Date.now() - requestStart) / 1000;
    sexualHealthMetrics.record(METRIC_NAMES.SEXUAL_HEALTH_V2_LATENCY_SECONDS, latency);
    sexualHealthMetrics.increment(METRIC_NAMES.SEXUAL_HEALTH_V2_ERRORS_TOTAL);
    
    logger.error('❌ [SEXUAL HEALTH V2 API] Failed to get sexual health history', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId,
      latency,
    });
    return res.status(500).json({
      error: 'Failed to get sexual health history',
      details: (error as Error).message,
    });
  }
};

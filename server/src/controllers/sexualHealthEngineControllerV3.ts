import { Request, Response } from 'express';
import { getSexualHealthTodayV3, getSexualHealthHistoryV3 } from '../services/sexualHealthEngineServiceV3';
import { logger } from '../utils/logger';

export const getSexualHealthTodayV3Handler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameter: userId' 
      });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;

    logger.info('🔵 [SEXUAL HEALTH V3 API] Getting today\'s sexual health data', { userId: userIdString });

    const data = await getSexualHealthTodayV3(userIdString);

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'No sexual health data found' 
      });
    }

    logger.info('✅ [SEXUAL HEALTH V3 API] Successfully retrieved today\'s data', { 
      userId, 
      status: data.sexualHealthStatus,
      signalCount: data.evidence?.signals?.length || 0,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V3 API] Failed to get today\'s sexual health data', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get sexual health data',
      details: (error as Error).message,
    });
  }
};

export const getSexualHealthHistoryV3Handler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameter: userId' 
      });
    }

    const userIdString = Array.isArray(userId) ? userId[0] : userId;

    logger.info('🔵 [SEXUAL HEALTH V3 API] Getting sexual health history', { userId: userIdString });

    const data = await getSexualHealthHistoryV3(userIdString);

    logger.info('✅ [SEXUAL HEALTH V3 API] Successfully retrieved history', { 
      userId, 
      recordCount: data.length,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('❌ [SEXUAL HEALTH V3 API] Failed to get sexual health history', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get sexual health history',
      details: (error as Error).message,
    });
  }
};

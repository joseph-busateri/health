import type { Request, Response } from 'express';
import { 
  getHealthDataStatusService,
  getBaselineProfileService,
  updateBaselineProfileService,
} from '../services/healthDataHubService';
import { logger } from '../utils/logger';

export const getHealthDataStatusHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string || 'default-user';
    const status = await getHealthDataStatusService(userId);
    
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Failed to get health data status', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get health data status',
      details: (error as Error).message,
    });
  }
};

export const getBaselineProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string || 'default-user';
    const profile = await getBaselineProfileService(userId);
    
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Failed to get baseline profile', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get baseline profile',
      details: (error as Error).message,
    });
  }
};

export const updateBaselineProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.body.user_id || 'default-user';
    const profile = req.body;
    
    const updated = await updateBaselineProfileService(userId, profile);
    
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Failed to update baseline profile', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to update baseline profile',
      details: (error as Error).message,
    });
  }
};

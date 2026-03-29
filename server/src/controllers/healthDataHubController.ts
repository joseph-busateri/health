import type { Request, Response } from 'express';
import { 
  getHealthDataStatusService,
  getBaselineProfileService,
  updateBaselineProfileService,
  getWorkoutScheduleService,
  uploadWorkoutScheduleService,
  getSupplementIntakeService,
  uploadSupplementIntakeService,
  getBloodworkSummaryService,
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

export const getWorkoutScheduleHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string || 'default-user';
    const schedule = await getWorkoutScheduleService(userId);
    
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    logger.error('Failed to get workout schedule', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get workout schedule',
      details: (error as Error).message,
    });
  }
};

export const uploadWorkoutScheduleHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.body.user_id || 'default-user';
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file provided',
      });
    }
    
    const schedule = await uploadWorkoutScheduleService(userId, file);
    
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    logger.error('Failed to upload workout schedule', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to upload workout schedule',
      details: (error as Error).message,
    });
  }
};

export const getSupplementIntakeHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string || 'default-user';
    const intake = await getSupplementIntakeService(userId);
    
    res.status(200).json({
      success: true,
      data: intake,
    });
  } catch (error) {
    logger.error('Failed to get supplement intake', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get supplement intake',
      details: (error as Error).message,
    });
  }
};

export const uploadSupplementIntakeHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.body.user_id || 'default-user';
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file provided',
      });
    }
    
    const intake = await uploadSupplementIntakeService(userId, file);
    
    res.status(200).json({
      success: true,
      data: intake,
    });
  } catch (error) {
    logger.error('Failed to upload supplement intake', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to upload supplement intake',
      details: (error as Error).message,
    });
  }
};

export const getBloodworkSummaryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string || 'default-user';
    const summary = await getBloodworkSummaryService(userId);
    
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to get bloodwork summary', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get bloodwork summary',
      details: (error as Error).message,
    });
  }
};

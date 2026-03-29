import { Request, Response } from 'express';
import {
  generateSupplementRecommendations,
  getSupplementRecommendations,
  getCurrentSupplementStack,
} from '../services/supplementEngineService';
import { seedSupplementBaselineOverride } from '../services/supplementDocumentService';
import type { SupplementEngineContext } from '../types/supplementEngine';
import { logger } from '../utils/logger';

export const generateSupplementRecommendationsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    const context: Partial<SupplementEngineContext> = req.body ?? {};

    const result = await generateSupplementRecommendations(
      Array.isArray(userId) ? userId[0] : userId,
      context
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to generate supplement recommendations', {
      error: (error as Error).message,
    });
    res.status(500).json({
      error: 'Failed to generate supplement recommendations',
      details: (error as Error).message,
    });
  }
};

export const getSupplementRecommendationsHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    const recommendations = await getSupplementRecommendations(
      Array.isArray(userId) ? userId[0] : userId
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Failed to get supplement recommendations', {
      error: (error as Error).message,
    });
    res.status(500).json({
      error: 'Failed to get supplement recommendations',
      details: (error as Error).message,
    });
  }
};

export const getCurrentSupplementStackHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    const stack = await getCurrentSupplementStack(Array.isArray(userId) ? userId[0] : userId);

    if (!stack) {
      return res.status(404).json({
        error: 'No supplement stack found for this user',
      });
    }

    res.status(200).json({
      success: true,
      data: stack,
    });
  } catch (error) {
    logger.error('Failed to get current supplement stack', {
      error: (error as Error).message,
    });
    res.status(500).json({
      error: 'Failed to get current supplement stack',
      details: (error as Error).message,
    });
  }
};

export const seedSupplementBaselineHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: user_id' });
    }

    const baseline = req.body;
    if (!baseline || !baseline.stack_name) {
      return res.status(400).json({ error: 'Invalid baseline payload' });
    }

    seedSupplementBaselineOverride(Array.isArray(userId) ? userId[0] : userId, baseline);

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Failed to seed supplement baseline override', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to seed supplement baseline override',
      details: (error as Error).message,
    });
  }
};

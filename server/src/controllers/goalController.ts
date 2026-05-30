import type { Request, Response } from 'express';
import { 
  getGoalDrivenToday, 
  getGoalDrivenHistory, 
  setUserGoals, 
  getUserGoals 
} from '../services/goalDrivenOptimizationService';
import { logger } from '../utils/logger';
import type { UserGoal } from '../types/goalOptimization';

export const setGoalsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const goals = req.body.goals as UserGoal[];

    if (!Array.isArray(goals)) {
      return res.status(400).json({
        success: false,
        error: 'Goals must be an array',
      });
    }

    logger.info('🎯 Set goals request', { userId, goalCount: goals.length });

    setUserGoals(userId, goals);

    res.json({
      success: true,
      message: 'Goals set successfully',
      data: { goals },
    });
  } catch (error) {
    logger.error('❌ Set goals error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to set goals',
    });
  }
};

export const getGoalsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Get goals request', { userId });

    const goals = getUserGoals(userId);

    res.json({
      success: true,
      data: { goals },
    });
  } catch (error) {
    logger.error('❌ Get goals error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get goals',
    });
  }
};

export const getGoalDrivenTodayHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const regenerate = req.query.regenerate === 'true';

    logger.info('📋 Goal-driven optimization request', { userId, regenerate });

    const result = await getGoalDrivenToday(userId, { regenerate });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('❌ Goal-driven optimization request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get goal-driven optimization',
    });
  }
};

export const getGoalDrivenHistoryHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    logger.info('📋 Goal-driven history request', { userId });

    const history = await getGoalDrivenHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('❌ Goal-driven history error', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get goal-driven history',
    });
  }
};

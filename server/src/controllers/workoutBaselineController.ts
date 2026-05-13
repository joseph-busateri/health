import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import {
  uploadWorkoutBaselineDocument,
  createTrainingCycle,
  getCurrentTrainingCycle,
  createWorkoutPlanVersion,
  getCurrentWorkoutPlan,
  logWorkoutExecution,
  getWorkoutExecutionHistory,
} from '../services/workoutBaselineService';

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

export const uploadWorkoutDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const result = await uploadWorkoutBaselineDocument(
      userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(201).json({ 
      success: true, 
      documentId: result.documentId,
      message: 'Workout document uploaded successfully. Processing in background.' 
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// TRAINING CYCLE
// ============================================================================

export const createTrainingCycleHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, cycleNumber, totalWeeks, ...rest } = req.body;

    if (!userId || !cycleNumber || !totalWeeks) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, cycleNumber, and totalWeeks are required' 
      });
    }

    const cycle = await createTrainingCycle({
      userId,
      cycleNumber: parseInt(cycleNumber),
      totalWeeks: parseInt(totalWeeks),
      ...rest,
    });

    res.status(201).json({ success: true, cycle });
  } catch (error) {
    next(error);
  }
};

export const getCurrentTrainingCycleHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const cycle = await getCurrentTrainingCycle(userId);
    
    if (!cycle) {
      return res.status(404).json({ success: false, error: 'No active training cycle found' });
    }

    res.json({ success: true, data: cycle });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// WORKOUT PLAN
// ============================================================================

export const createWorkoutPlanVersionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, trainingCycleId, createdBy, createdReason, effectiveFrom, ...rest } = req.body;

    if (!userId || !trainingCycleId || !createdBy || !createdReason || !effectiveFrom) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, trainingCycleId, createdBy, createdReason, and effectiveFrom are required' 
      });
    }

    const version = await createWorkoutPlanVersion({
      userId,
      trainingCycleId,
      createdBy,
      createdReason,
      effectiveFrom,
      ...rest,
    });

    res.status(201).json({ success: true, version });
  } catch (error) {
    next(error);
  }
};

export const getCurrentWorkoutPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const plan = await getCurrentWorkoutPlan(userId);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'No current workout plan found' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// EXECUTION LOGGING
// ============================================================================

export const logWorkoutExecutionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, exerciseId, planVersionId, executionDate, ...rest } = req.body;

    if (!userId || !exerciseId || !planVersionId || !executionDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, exerciseId, planVersionId, and executionDate are required' 
      });
    }

    const log = await logWorkoutExecution({
      userId,
      exerciseId,
      planVersionId,
      executionDate,
      ...rest,
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

export const getWorkoutExecutionHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const history = await getWorkoutExecutionHistory(userId, days);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const uploadMiddleware = upload.single('file');

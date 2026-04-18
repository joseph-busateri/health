import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import {
  uploadBodyCompositionDocument,
  createBodyCompositionScan,
  getLatestBodyComposition,
  getBodyCompositionScans,
  getBodyCompositionTrends,
  createBodyCompositionGoal,
  getActiveGoals,
  calculateGoalProgress,
  detectAnomalies,
  uploadBodyCompositionCSV,
} from '../services/bodyCompositionService';

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

export const uploadBodyCompositionDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const result = await uploadBodyCompositionDocument({
      userId,
      file: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({ 
      success: true, 
      documentId: result.documentId,
      message: 'Document uploaded successfully. Processing in background.' 
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SCAN CRUD
// ============================================================================

export const createBodyCompositionScanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, scanDate, scanSource, weightLb, ...rest } = req.body;

    if (!userId || !scanDate || !scanSource || !weightLb) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, scanDate, scanSource, and weightLb are required' 
      });
    }

    const scan = await createBodyCompositionScan({
      userId,
      scanDate,
      scanSource,
      weightLb: parseFloat(weightLb),
      ...rest,
    });

    res.status(201).json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};

export const getLatestBodyCompositionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const latest = await getLatestBodyComposition(userId);
    
    if (!latest) {
      return res.status(404).json({ success: false, error: 'No body composition scans found' });
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    next(error);
  }
};

export const getBodyCompositionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const scans = await getBodyCompositionScans(userId, limit);
    res.json({ success: true, data: scans });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// TRENDS
// ============================================================================

export const getBodyCompositionTrendsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    const months = req.query.months ? parseInt(req.query.months as string) : 6;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const trends = await getBodyCompositionTrends(userId, months);
    
    // Calculate summary
    const summary = {
      totalScans: trends.length,
      dateRange: trends.length > 0 ? {
        start: trends[trends.length - 1].scanDate,
        end: trends[0].scanDate,
      } : null,
      overallChange: trends.length > 1 ? {
        weightLb: trends[0].weightLb - trends[trends.length - 1].weightLb,
        bodyFatPercentage: (trends[0].bodyFatPercentage || 0) - (trends[trends.length - 1].bodyFatPercentage || 0),
        muscleMassLb: (trends[0].skeletalMuscleMassLb || 0) - (trends[trends.length - 1].skeletalMuscleMassLb || 0),
      } : null,
    };

    res.json({ success: true, data: { trends, summary } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GOALS
// ============================================================================

export const createBodyCompositionGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, goalName, goalType, createdBy, ...rest } = req.body;

    if (!userId || !goalName || !goalType || !createdBy) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, goalName, goalType, and createdBy are required' 
      });
    }

    const goal = await createBodyCompositionGoal({
      userId,
      goalName,
      goalType,
      createdBy,
      ...rest,
    });

    res.status(201).json({ success: true, goal });
  } catch (error) {
    next(error);
  }
};

export const getActiveGoalsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const goals = await getActiveGoals(userId);
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

export const getGoalProgressHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goalId = Array.isArray(req.params.goal_id) ? req.params.goal_id[0] : req.params.goal_id;

    if (!goalId) {
      return res.status(400).json({ success: false, error: 'goal_id is required' });
    }

    const progress = await calculateGoalProgress(goalId);
    res.json({ success: true, data: { progressPercentage: progress } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export const detectAnomaliesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    const scanId = Array.isArray(req.params.scan_id) ? req.params.scan_id[0] : req.params.scan_id;
    
    if (!userId || !scanId) {
      return res.status(400).json({ success: false, error: 'user_id and scan_id are required' });
    }

    const anomalies = await detectAnomalies(userId, scanId);
    
    const summary = {
      hasAnomalies: anomalies.length > 0,
      highSeverityCount: anomalies.filter(a => a.severity === 'high').length,
    };

    res.json({ success: true, data: { anomalies, ...summary } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CSV UPLOAD
// ============================================================================

export const uploadBodyCompositionCSVHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.user_id) ? req.params.user_id[0] : req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const detectedSource = req.body.detected_source || 'other_scale';

    const result = await uploadBodyCompositionCSV({
      userId,
      file: req.file.buffer,
      fileName: req.file.originalname,
      detectedSource,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

// Export multer upload middleware
export const uploadMiddleware = upload.single('file');

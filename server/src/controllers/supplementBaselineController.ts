import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

import {
  uploadSupplementBaselineDocument,
  createSupplementStackVersion,
  getCurrentSupplementStack,
  logSupplementAdherence,
  getSupplementAdherenceHistory,
  calculateSupplementAdherence,
  checkSupplementInteractions,
  updateSupplementInventory,
  getReorderAlerts,
} from '../services/supplementBaselineService';

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

export const uploadSupplementDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const result = await uploadSupplementBaselineDocument(
      userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(201).json({ 
      success: true, 
      documentId: result.documentId,
      message: 'Supplement document uploaded successfully. Processing in background.' 
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SUPPLEMENT STACK
// ============================================================================

export const createSupplementStackVersionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, createdBy, createdReason, effectiveFrom, ...rest } = req.body;

    if (!userId || !createdBy || !createdReason || !effectiveFrom) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, createdBy, createdReason, and effectiveFrom are required' 
      });
    }

    const version = await createSupplementStackVersion({
      userId,
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

export const getCurrentSupplementStackHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const stack = await getCurrentSupplementStack(userId);
    
    if (!stack) {
      return res.status(404).json({ success: false, error: 'No current supplement stack found' });
    }

    res.json({ success: true, data: stack });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADHERENCE LOGGING
// ============================================================================

export const logSupplementAdherenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, supplementId, stackVersionId, scheduledDate, ...rest } = req.body;

    if (!userId || !supplementId || !stackVersionId || !scheduledDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, supplementId, stackVersionId, and scheduledDate are required' 
      });
    }

    const log = await logSupplementAdherence({
      userId,
      supplementId,
      stackVersionId,
      scheduledDate,
      ...rest,
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

export const getSupplementAdherenceHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const history = await getSupplementAdherenceHistory(userId, days);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const calculateSupplementAdherenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplementId = req.params.supplement_id;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    if (!supplementId) {
      return res.status(400).json({ success: false, error: 'supplement_id is required' });
    }

    const adherence = await calculateSupplementAdherence(supplementId, days);
    res.json({ success: true, data: { adherencePercentage: adherence } });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INTERACTION CHECKING
// ============================================================================

export const checkSupplementInteractionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplementNames = req.body.supplement_names;

    if (!Array.isArray(supplementNames) || supplementNames.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'supplement_names array is required' 
      });
    }

    const interactions = await checkSupplementInteractions(supplementNames);
    res.json({ success: true, data: interactions });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export const updateSupplementInventoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, supplementId, currentServings } = req.body;

    if (!userId || !supplementId || currentServings === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, supplementId, and currentServings are required' 
      });
    }

    await updateSupplementInventory(userId, supplementId, parseFloat(currentServings));
    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getReorderAlertsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const alerts = await getReorderAlerts(userId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

export const uploadMiddleware = upload.single('file');

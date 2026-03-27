import { Request, Response } from 'express';
import {
  createWorkoutDocument,
  getLatestWorkoutDocument,
  getWorkoutBaseline,
} from '../services/workoutDocumentService';
import {
  CreateWorkoutDocumentRequest,
  ManualWorkoutData,
} from '../types/workoutDocument';
import { logger } from '../utils/logger';

export const uploadWorkoutDocument = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      documentType,
      fileReference,
      storagePath,
      programStartDate,
      notes,
      manualWorkoutData,
    }: CreateWorkoutDocumentRequest = req.body;

    if (!userId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId and documentType are required',
      });
    }

    const result = await createWorkoutDocument({
      userId,
      documentType,
      fileReference,
      storagePath,
      programStartDate,
      notes,
      manualWorkoutData,
    });

    logger.info('Workout document uploaded successfully', {
      userId,
      documentId: result.document.id,
      documentType,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to upload workout document', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to upload workout document',
      details: (error as Error).message,
    });
  }
};

export const getWorkoutBaselineHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
      });
    }

    const baseline = await getWorkoutBaseline(Array.isArray(userId) ? userId[0] : userId);

    if (!baseline) {
      return res.status(404).json({
        error: 'Workout baseline not found',
      });
    }

    res.status(200).json({
      success: true,
      data: baseline,
    });
  } catch (error) {
    logger.error('Failed to get workout baseline', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get workout baseline',
      details: (error as Error).message,
    });
  }
};

export const getLatestWorkoutDocumentHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId',
      });
    }

    const document = await getLatestWorkoutDocument(Array.isArray(userId) ? userId[0] : userId);

    if (!document) {
      return res.status(404).json({
        error: 'Workout document not found',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Failed to get latest workout document', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get latest workout document',
      details: (error as Error).message,
    });
  }
};

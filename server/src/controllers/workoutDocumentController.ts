import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createWorkoutDocument,
  getLatestWorkoutDocument,
  getWorkoutBaseline,
} from '../services/workoutDocumentService';
import { getWorkoutToday, getWorkoutTodayHistory } from '../services/workoutTodayService';
import {
  CreateWorkoutDocumentRequest,
  ManualWorkoutData,
  WorkoutBaseline,
} from '../types/workoutDocument';
import { logger } from '../utils/logger';
import { uploadFileToStorage } from '../services/storageService';
import { seedWorkoutBaselineOverride } from '../services/workoutTodayService';

interface WorkoutUploadRequest extends Request {
  file?: Express.Multer.File;
}

const storage = multer.memoryStorage();
export const uploadWorkoutMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type for workout document upload'));
    }
  },
}).single('file');

export const uploadWorkoutDocument = async (req: WorkoutUploadRequest, res: Response) => {
  try {
    const {
      userId,
      documentType,
      programStartDate,
      notes,
      manualWorkoutData,
    }: CreateWorkoutDocumentRequest = req.body;
    const file = req.file;

    if (!userId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId and documentType are required',
      });
    }

    let storagePath: string | undefined;
    let fileReference: string | undefined;
    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    let originalFileName: string | undefined;

    if (file) {
      const fileExtension = path.extname(file.originalname) || '.bin';
      storagePath = `workout/${userId}/${uuidv4()}${fileExtension}`;
      const uploadResult = await uploadFileToStorage({
        path: storagePath,
        file: file.buffer,
        contentType: file.mimetype,
      });
      fileReference = uploadResult.publicUrl ?? storagePath;
      fileBuffer = file.buffer;
      mimeType = file.mimetype;
      originalFileName = file.originalname;
    }

    const result = await createWorkoutDocument({
      userId,
      documentType,
      fileReference,
      storagePath,
      programStartDate,
      notes,
      manualWorkoutData,
      fileBuffer,
      mimeType,
      originalFileName,
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

export const seedWorkoutTodayBaselineHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: user_id' });
    }

    const baseline = req.body as WorkoutBaseline;
    if (!baseline || !baseline.id || !baseline.documentId) {
      return res.status(400).json({ error: 'Invalid baseline payload' });
    }

    await seedWorkoutBaselineOverride(Array.isArray(userId) ? userId[0] : userId, {
      ...baseline,
      userId: Array.isArray(userId) ? userId[0] : userId,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('Failed to seed workout baseline override', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to seed workout baseline override',
      details: (error as Error).message,
    });
  }
};

export const getWorkoutTodayHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: user_id',
      });
    }

    const regenerate = req.query.regenerate === 'true';
    const override = req.body?.override;

    const today = await getWorkoutToday(Array.isArray(userId) ? userId[0] : userId, {
      regenerate,
      override,
    });

    res.status(200).json({
      success: true,
      data: today,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    logger.error('Failed to get workout today plan', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to generate today workout',
      details: (error as Error).message,
    });
  }
};

export const getWorkoutTodayHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: user_id',
      });
    }

    const history = await getWorkoutTodayHistory(Array.isArray(userId) ? userId[0] : userId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Failed to get workout today history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get workout history',
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

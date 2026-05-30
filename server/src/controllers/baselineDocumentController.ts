import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createBaselineDocument,
  getLatestBaselineDocument,
  getBaselineProfile,
  CreateBaselineDocumentRequest,
  ManualBaselineProfileData,
} from '../services/baselineDocumentService';
import { logger } from '../utils/logger';
import { uploadFileToStorage } from '../services/storageService';

interface BaselineUploadRequest extends Request {
  file?: Express.Multer.File;
}

const storage = multer.memoryStorage();
export const uploadBaselineMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, images, text, Word'));
    }
  },
}).single('file');

export const uploadBaselineDocument = async (req: BaselineUploadRequest, res: Response) => {
  try {
    const {
      userId,
      documentType,
      notes,
      manualProfileData,
    }: CreateBaselineDocumentRequest = req.body;
    const file = req.file;
    let manualData: ManualBaselineProfileData | undefined;

    if (typeof manualProfileData === 'string') {
      try {
        manualData = JSON.parse(manualProfileData) as ManualBaselineProfileData;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid manualProfileData JSON payload',
        });
      }
    } else if (manualProfileData) {
      manualData = manualProfileData;
    }

    if (!userId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId and documentType are required',
      });
    }

    if (!file && !manualData) {
      return res.status(400).json({
        error: 'No file or manual profile data provided. Please upload a document or include manualProfileData.',
      });
    }

    let storagePath: string | undefined;
    let fileReference: string | undefined;
    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    let originalFileName: string | undefined;

    if (file) {
      const fileExtension = path.extname(file.originalname) || '.bin';
      storagePath = `baseline/${userId}/${uuidv4()}${fileExtension}`;
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

    const result = await createBaselineDocument({
      userId,
      documentType,
      fileReference,
      storagePath,
      notes,
      manualProfileData: manualData,
      fileBuffer,
      mimeType,
      originalFileName,
    });

    logger.info('Baseline document uploaded successfully', {
      userId,
      documentId: result.document.id,
      documentType,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to upload baseline document', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to upload baseline document',
      details: (error as Error).message,
    });
  }
};

export const getBaselineProfileByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
      });
    }

    const profile = await getBaselineProfile(Array.isArray(userId) ? userId[0] : userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Baseline profile not found',
      });
    }

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

export const getLatestBaselineDocumentByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
      });
    }

    const document = await getLatestBaselineDocument(Array.isArray(userId) ? userId[0] : userId);

    if (!document) {
      return res.status(404).json({
        error: 'No baseline document found',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Failed to get latest baseline document', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to get latest baseline document',
      details: (error as Error).message,
    });
  }
};

import { Request, Response } from 'express';
import {
  createBaselineDocument,
  getLatestBaselineDocument,
  getBaselineProfile,
  CreateBaselineDocumentRequest,
  ManualBaselineProfileData,
} from '../services/baselineDocumentService';
import { logger } from '../utils/logger';

export const uploadBaselineDocument = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      documentType,
      fileReference,
      storagePath,
      notes,
      manualProfileData,
    }: CreateBaselineDocumentRequest = req.body;

    if (!userId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId and documentType are required',
      });
    }

    const result = await createBaselineDocument({
      userId,
      documentType,
      fileReference,
      storagePath,
      notes,
      manualProfileData,
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

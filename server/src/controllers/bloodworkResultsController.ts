import { Request, Response } from 'express';
import {
  parseBloodworkDocument,
  getBloodworkResultsByUser,
  getBloodworkResultsByDocument,
  getBloodworkTimeline,
  updateBloodworkResult,
  deleteBloodworkResultsByDocument
} from '../services/bloodworkExtractionService';
import type {
  ParseBloodworkRequest,
  GetBloodworkResultsRequest,
  GetBloodworkResultsByDocumentRequest,
  UpdateBloodworkResultRequest
} from '../types/bloodworkResults';
import { logger } from '../utils/logger';

/**
 * Parse a bloodwork document and extract results
 */
export const parseBloodworkDocumentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to parse bloodwork document',
      });
    }

    const request: ParseBloodworkRequest = {
      document_id: Array.isArray(id) ? id[0] : id,
      user_id: user_id || (req as any).user?.id
    };

    const result = await parseBloodworkDocument(request);

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in parseBloodworkDocumentController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to parse bloodwork document',
    });
  }
};

/**
 * Get bloodwork results for a user
 */
export const getBloodworkResultsController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const {
      document_id,
      normalized_test_name,
      category,
      start_date,
      end_date,
      page = '1',
      limit = '20',
    } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required to retrieve bloodwork results',
      });
    }

    const request: GetBloodworkResultsRequest = {
      user_id: Array.isArray(user_id) ? user_id[0] : user_id,
      document_id: document_id as string,
      normalized_test_name: normalized_test_name as string,
      category: category as string,
      start_date: start_date as string,
      end_date: end_date as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const result = await getBloodworkResultsByUser(request);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkResultsController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve bloodwork results',
    });
  }
};

/**
 * Get bloodwork results for a specific document
 */
export const getBloodworkResultsByDocumentController = async (req: Request, res: Response) => {
  try {
    const { document_id } = req.params;
    const { user_id } = req.query;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to retrieve bloodwork results',
      });
    }

    const request: GetBloodworkResultsByDocumentRequest = {
      document_id: Array.isArray(document_id) ? document_id[0] : document_id,
      user_id: user_id as string,
    };

    const result = await getBloodworkResultsByDocument(request);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkResultsByDocumentController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve bloodwork results for document',
    });
  }
};

/**
 * Get bloodwork timeline for a user
 */
export const getBloodworkTimelineController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { limit = '20' } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required to retrieve bloodwork timeline',
      });
    }

    const userId = Array.isArray(user_id) ? user_id[0] : user_id;
    const limitNum = limit ? parseInt(limit as string, 10) : 20;

    const result = await getBloodworkTimeline(userId, limitNum);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkTimelineController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve bloodwork timeline',
    });
  }
};

/**
 * Update a bloodwork result
 */
export const updateBloodworkResultController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Result ID is required',
        message: 'Result ID is required to update bloodwork result',
      });
    }

    // Validate confidence if provided
    if (updateData.confidence !== undefined) {
      if (updateData.confidence < 0 || updateData.confidence > 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid confidence score',
          message: 'Confidence score must be between 0 and 1',
        });
      }
    }

    const request: UpdateBloodworkResultRequest = updateData;

    const result = await updateBloodworkResult(Array.isArray(id) ? id[0] : id, request);

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in updateBloodworkResultController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update bloodwork result',
    });
  }
};

/**
 * Delete bloodwork results for a document
 */
export const deleteBloodworkResultsController = async (req: Request, res: Response) => {
  try {
    const { document_id } = req.params;
    const { user_id } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to delete bloodwork results',
      });
    }

    const result = await deleteBloodworkResultsByDocument(
      Array.isArray(document_id) ? document_id[0] : document_id,
      user_id
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in deleteBloodworkResultsController', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete bloodwork results',
    });
  }
};

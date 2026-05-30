import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Extend Request type to include file property
interface AuthenticatedRequest extends Request {
  file?: Express.Multer.File;
}
import {
  uploadBloodworkDocument,
  getBloodworkDocuments,
  getBloodworkDocument,
  updateBloodworkDocument,
  deleteBloodworkDocument,
  getBloodworkTimeline,
  getBloodworkStats,
  updateBloodworkParseStatus,
} from '../services/bloodworkDocumentService';
import {
  processBloodworkDocument,
  getDocumentProcessingStatus,
  resetProcessingForRetry,
} from '../services/bloodworkProcessingService';
import { uploadFileToStorage } from '../services/storageService';
import type {
  CreateBloodworkDocumentRequest,
  UpdateBloodworkDocumentRequest,
  GetBloodworkDocumentsRequest,
  GetBloodworkDocumentRequest,
  BloodworkDocumentType,
  BloodworkSource,
  BloodworkParseStatus,
} from '../types/bloodworkDocument';
import { logger } from '../utils/logger';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
      cb(new Error('Invalid file type. Allowed types: PDF, JPEG, PNG, TIFF, TXT, DOC, DOCX'));
    }
  },
});

/**
 * Upload bloodwork document
 */
export const uploadBloodworkDocumentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, test_date, notes } = req.body;
    const file = req.file;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required for uploading bloodwork documents',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload',
      });
    }

    // Set default values - AI will refine these during processing
    const document_type = 'lab_panel';
    const source = 'manual_upload';

    logger.info('Processing bloodwork upload', { 
      user_id, 
      file_name: file.originalname,
      file_size: file.size,
      document_type,
      source
    });

    const fileExtension = path.extname(file.originalname) || '.bin';
    const storagePath = `bloodwork/${user_id}/${uuidv4()}${fileExtension}`;

    const uploadResult = await uploadFileToStorage({
      path: storagePath,
      file: file.buffer,
      contentType: file.mimetype,
    });

    const fileUrl = uploadResult.publicUrl ?? storagePath;

    // Create bloodwork document record
    const createRequest: CreateBloodworkDocumentRequest = {
      user_id,
      file_url: fileUrl,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      document_type: document_type as BloodworkDocumentType,
      source: source as BloodworkSource,
      test_date: test_date || null,
      notes: notes || null,
      metadata: {
        upload_timestamp: new Date().toISOString(),
        original_filename: file.originalname,
        storage_path: storagePath,
        storage_bucket: uploadResult.bucket,
      },
    };

    const result = await uploadBloodworkDocument(createRequest);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Kick off processing pipeline asynchronously
    const documentId = result.data?.document.id;
    if (documentId) {
      // Fire and forget processing
      setImmediate(async () => {
        try {
          await processBloodworkDocument(documentId, user_id);
        } catch (processingError) {
          logger.error('Failed to process bloodwork document', {
            documentId,
            error: processingError,
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Bloodwork document uploaded successfully',
    });
  } catch (error) {
    logger.error('Error in uploadBloodworkDocumentController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to upload bloodwork document',
    });
  }
};

/**
 * Get bloodwork documents for a user
 */
export const getBloodworkDocumentsController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const {
      page = '1',
      limit = '20',
      document_type,
      source,
      parse_status,
      start_date,
      end_date,
    } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required to retrieve bloodwork documents',
      });
    }

    const request: GetBloodworkDocumentsRequest = {
      user_id: Array.isArray(user_id) ? user_id[0] : user_id,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      document_type: document_type as BloodworkDocumentType,
      source: source as BloodworkSource,
      parse_status: parse_status as BloodworkParseStatus,
      start_date: start_date as string,
      end_date: end_date as string,
    };

    const result = await getBloodworkDocuments(request);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkDocumentsController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve bloodwork documents',
    });
  }
};

/**
 * Get a specific bloodwork document
 */
export const getBloodworkDocumentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to retrieve bloodwork document',
      });
    }

    const resolvedUserId = typeof user_id === 'string'
      ? user_id
      : Array.isArray(user_id) && typeof user_id[0] === 'string'
        ? user_id[0]
        : undefined;

    const request: GetBloodworkDocumentRequest = {
      id: Array.isArray(id) ? id[0] : id,
      user_id: resolvedUserId,
    };

    const result = await getBloodworkDocument(request);

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkDocumentController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve bloodwork document',
    });
  }
};

/**
 * Update a bloodwork document
 */
export const updateBloodworkDocumentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateBloodworkDocumentRequest = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to update bloodwork document',
      });
    }

    // Validate update data
    if (updateData.document_type) {
      const validTypes: BloodworkDocumentType[] = [
        'lab_panel', 'hormone', 'metabolic', 'cardiac', 'liver', 
        'kidney', 'lipid', 'vitamin', 'comprehensive', 'other'
      ];
      
      if (!validTypes.includes(updateData.document_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document type',
          message: 'Please select a valid document type',
        });
      }
    }

    if (updateData.source) {
      const validSources: BloodworkSource[] = [
        'labcorp', 'quest', 'hospital', 'clinic', 'home_test', 'manual_upload', 'other'
      ];
      
      if (!validSources.includes(updateData.source)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid source',
          message: 'Please select a valid source',
        });
      }
    }

    if (updateData.extraction_confidence !== undefined) {
      if (updateData.extraction_confidence < 0 || updateData.extraction_confidence > 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid confidence score',
          message: 'Confidence score must be between 0 and 1',
        });
      }
    }

    const result = await updateBloodworkDocument(Array.isArray(id) ? id[0] : id, updateData);

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in updateBloodworkDocumentController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update bloodwork document',
    });
  }
};

/**
 * Delete a bloodwork document
 */
export const deleteBloodworkDocumentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to delete bloodwork document',
      });
    }

    const result = await deleteBloodworkDocument(Array.isArray(id) ? id[0] : id, Array.isArray(user_id) ? user_id[0] : user_id);

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in deleteBloodworkDocumentController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete bloodwork document',
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

    const result = await getBloodworkTimeline(Array.isArray(user_id) ? user_id[0] : user_id, parseInt(limit as string, 10));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkTimelineController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve bloodwork timeline',
    });
  }
};

/**
 * Get bloodwork statistics for a user
 */
export const getBloodworkStatsController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required to retrieve bloodwork statistics',
      });
    }

    const result = await getBloodworkStats(Array.isArray(user_id) ? user_id[0] : user_id);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getBloodworkStatsController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve bloodwork statistics',
    });
  }
};

/**
 * Update bloodwork parse status
 */
export const updateBloodworkParseStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parse_status, extraction_confidence } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to update parse status',
      });
    }

    if (!parse_status) {
      return res.status(400).json({
        success: false,
        error: 'Parse status is required',
        message: 'Parse status is required to update document',
      });
    }

    // Validate parse status
    const validStatuses: BloodworkParseStatus[] = [
      'pending', 'processing', 'parsed', 'failed', 'needs_review'
    ];

    if (!validStatuses.includes(parse_status as BloodworkParseStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parse status',
        message: 'Please select a valid parse status',
      });
    }

    // Validate confidence score if provided
    if (extraction_confidence !== undefined) {
      if (extraction_confidence < 0 || extraction_confidence > 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid confidence score',
          message: 'Confidence score must be between 0 and 1',
        });
      }
    }

    const result = await updateBloodworkParseStatus(
      Array.isArray(id) ? id[0] : id,
      parse_status as BloodworkParseStatus,
      extraction_confidence
    );

    if (!result.success) {
      if (result.error?.includes('No rows found')) {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in updateBloodworkParseStatusController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update bloodwork parse status',
    });
  }
};

/**
 * Get processing status for a specific bloodwork document
 */
export const getBloodworkDocumentStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to retrieve processing status',
      });
    }

    const status = await getDocumentProcessingStatus(Array.isArray(id) ? id[0] : id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'No processing status found for the provided document ID',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error in getBloodworkDocumentStatusController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve bloodwork processing status',
    });
  }
};

/**
 * Retry bloodwork processing pipeline
 */
export const retryBloodworkProcessingController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        message: 'Document ID is required to retry processing',
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'User ID is required to retry processing',
      });
    }

    const { documentId } = await resetProcessingForRetry(Array.isArray(id) ? id[0] : id);

    setImmediate(async () => {
      try {
        await processBloodworkDocument(documentId, Array.isArray(user_id) ? user_id[0] : user_id);
      } catch (processingError) {
        logger.error('Failed to retry bloodwork processing', {
          documentId,
          error: processingError,
        });
      }
    });

    res.json({
      success: true,
      message: 'Bloodwork processing retry started',
    });
  } catch (error) {
    logger.error('Error in retryBloodworkProcessingController', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retry bloodwork processing',
    });
  }
};

// Export the upload middleware for use in routes
export const uploadBloodworkMiddleware = upload.single('file');

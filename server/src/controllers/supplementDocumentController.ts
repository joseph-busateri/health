import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { File as MulterFile } from 'multer';
import { createSupplementDocument, getLatestSupplementDocument, getSupplementBaseline } from '../services/supplementDocumentService';
import { CreateSupplementDocumentRequest, ManualSupplementData } from '../types/supplementDocument';
import { uploadFileToStorage } from '../services/storageService';

interface SupplementUploadRequest extends Request {
  file?: MulterFile;
}

const storage = multer.memoryStorage();
export const uploadSupplementMiddleware = multer({
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, images, text, Word, Excel'));
    }
  },
}).single('file');

export const uploadSupplementDocument = async (req: SupplementUploadRequest, res: Response) => {
  try {
    const { userId, documentType, notes, manualSupplementData }: CreateSupplementDocumentRequest = req.body;
    const file = req.file;

    let manualData: ManualSupplementData | undefined;
    if (typeof manualSupplementData === 'string') {
      try {
        manualData = JSON.parse(manualSupplementData) as ManualSupplementData;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid manualSupplementData JSON payload',
        });
      }
    } else if (manualSupplementData) {
      manualData = manualSupplementData;
    }

    // Validate required fields
    if (!userId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: userId and documentType are required',
      });
    }

    if (!file && documentType !== 'manual_entry') {
      return res.status(400).json({
        error: 'No file uploaded. Please attach a supplement document.',
      });
    }

    // Validate document type
    const validTypes = ['pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        error: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate manual supplement data if provided
    if (manualData) {
      const { stackName, supplements } = manualData;
      
      if (!stackName || typeof stackName !== 'string') {
        return res.status(400).json({
          error: 'Invalid supplement data: stackName is required and must be a string',
        });
      }

      if (!Array.isArray(supplements) || supplements.length === 0) {
        return res.status(400).json({
          error: 'Invalid supplement data: supplements must be a non-empty array',
        });
      }

      // Validate each supplement
      for (const supplement of supplements) {
        const { supplementName, dosage, dosageUnit, frequency, timing, status } = supplement;
        
        if (!supplementName || typeof supplementName !== 'string') {
          return res.status(400).json({
            error: 'Invalid supplement item: supplementName is required and must be a string',
          });
        }

        if (typeof dosage !== 'number' || dosage <= 0) {
          return res.status(400).json({
            error: 'Invalid supplement item: dosage must be a positive number',
          });
        }

        if (!dosageUnit || typeof dosageUnit !== 'string') {
          return res.status(400).json({
            error: 'Invalid supplement item: dosageUnit is required and must be a string',
          });
        }

        if (!frequency || typeof frequency !== 'string') {
          return res.status(400).json({
            error: 'Invalid supplement item: frequency is required and must be a string',
          });
        }

        if (!timing || typeof timing !== 'string') {
          return res.status(400).json({
            error: 'Invalid supplement item: timing is required and must be a string',
          });
        }

        const validStatuses = ['active', 'paused', 'removed'];
        if (!status || !validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid supplement item: status must be one of: ${validStatuses.join(', ')}`,
          });
        }
      }
    }

    // Create supplement document
    let storagePath: string | undefined;
    let fileReference: string | undefined;

    if (file) {
      const fileExtension = path.extname(file.originalname) || '.bin';
      storagePath = `supplements/${userId}/${uuidv4()}${fileExtension}`;
      const uploadResult = await uploadFileToStorage({
        path: storagePath,
        file: file.buffer,
        contentType: file.mimetype,
      });
      fileReference = uploadResult.publicUrl ?? storagePath;
    }

    const result = await createSupplementDocument({
      user_id: userId,
      document_type: documentType,
      file_reference: fileReference,
      storage_path: storagePath,
      upload_date: new Date().toISOString(),
      parse_status: 'pending',
      notes,
      manualSupplementData: manualData,
      fileBuffer: file?.buffer,
      mimeType: file?.mimetype,
      originalFileName: file?.originalname,
    });

    res.status(201).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error uploading supplement document:', error);
    res.status(500).json({
      error: 'Failed to upload supplement document',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getSupplementBaselineHandler = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    const baseline = await getSupplementBaseline(Array.isArray(user_id) ? user_id[0] : user_id);

    if (!baseline) {
      return res.status(404).json({
        error: 'No supplement baseline found for this user',
      });
    }

    res.status(200).json({
      success: true,
      data: baseline,
    });

  } catch (error) {
    console.error('Error getting supplement baseline:', error);
    res.status(500).json({
      error: 'Failed to get supplement baseline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getLatestSupplementDocumentHandler = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required parameter: user_id',
      });
    }

    const document = await getLatestSupplementDocument(Array.isArray(user_id) ? user_id[0] : user_id);

    if (!document) {
      return res.status(404).json({
        error: 'No supplement document found for this user',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });

  } catch (error) {
    console.error('Error getting latest supplement document:', error);
    res.status(500).json({
      error: 'Failed to get latest supplement document',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

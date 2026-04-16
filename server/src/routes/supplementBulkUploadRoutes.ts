import { Router } from 'express';
import type { Request, Response } from 'express';
import { bulkUploadSupplements } from '../services/supplementBulkUploadService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/supplements/bulk-upload
 * Upload supplements in bulk via text parsing
 * Body: { userId: string, supplementText: string, versionName?: string }
 */
router.post('/bulk-upload', async (req: Request, res: Response) => {
  try {
    const { userId, supplementText, versionName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!supplementText || typeof supplementText !== 'string') {
      return res.status(400).json({ error: 'Supplement text is required' });
    }

    logger.info('📦 [SUPPLEMENT BULK UPLOAD] Processing request', {
      userId,
      textLength: supplementText.length,
    });

    const result = await bulkUploadSupplements(userId, supplementText, versionName);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Bulk upload failed',
        errors: result.errors,
        supplements: result.supplements,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${result.supplementsCreated} supplements`,
      stackVersionId: result.stackVersionId,
      supplementsCreated: result.supplementsCreated,
      supplements: result.supplements,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('❌ [SUPPLEMENT BULK UPLOAD] Request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Failed to process bulk upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/supplements/current/:userId
 * Get the current supplement stack for a user
 */
router.get('/current/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // This would be implemented in a separate service
    // For now, returning a placeholder response
    return res.status(200).json({
      message: 'Current supplement stack endpoint',
      userId,
    });
  } catch (error) {
    logger.error('❌ [SUPPLEMENT] Failed to fetch current stack', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      error: 'Failed to fetch current supplement stack',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

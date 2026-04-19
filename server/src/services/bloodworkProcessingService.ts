import { createClient } from '@supabase/supabase-js';
import type { BloodworkProcessingStatus, BloodworkParseStatus } from '../types/bloodworkDocument';
import { logger } from '../utils/logger';
import { parseBloodworkDocument } from './bloodworkExtractionService';
import { getBloodworkTrendsByUser } from './bloodworkTrendService';
import { generateBloodworkRecommendationsForUser } from './bloodworkRecommendationService';
import { sendBloodworkProcessingNotification } from './notificationService';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Using loose typing here to avoid supabase-js generics friction for now
const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STATUS_PROGRESS: Record<BloodworkProcessingStatus, number> = {
  uploaded: 0,
  pending: 10,
  parsing: 25,
  extracting: 45,
  generating_trends: 70,
  generating_recommendations: 90,
  complete: 100,
  failed: 100,
};

const PROCESSING_TO_PARSE_STATUS: Partial<Record<BloodworkProcessingStatus, BloodworkParseStatus>> = {
  uploaded: 'pending',
  pending: 'pending',
  parsing: 'processing',
  complete: 'parsed',
  failed: 'failed',
};

interface ProcessingUpdateOptions {
  progress?: number;
  errorMessage?: string | null;
  setStarted?: boolean;
  resetStarted?: boolean;
  setCompleted?: boolean;
  resetCompleted?: boolean;
}

interface ProcessingUpdateResult {
  documentId: string;
  userId: string;
}

function resolveProgress(status: BloodworkProcessingStatus, override?: number): number | null {
  if (override !== undefined) {
    return override;
  }
  return STATUS_PROGRESS[status] ?? null;
}

async function updateProcessingStatusInternal(
  documentId: string,
  status: BloodworkProcessingStatus,
  options: ProcessingUpdateOptions = {}
): Promise<ProcessingUpdateResult> {
  const updates: Record<string, any> = {
    processing_status: status,
    updated_at: new Date().toISOString(),
  };

  const progress = resolveProgress(status, options.progress);
  if (progress !== null) {
    updates.processing_progress = progress;
  }

  if (options.errorMessage !== undefined) {
    updates.processing_error = options.errorMessage;
  }

  if (options.setStarted) {
    updates.processing_started_at = new Date().toISOString();
  }

  if (options.resetStarted) {
    updates.processing_started_at = null;
  }

  if (options.setCompleted) {
    updates.processing_completed_at = new Date().toISOString();
  }

  if (options.resetCompleted) {
    updates.processing_completed_at = null;
  }

  const parseStatus = PROCESSING_TO_PARSE_STATUS[status];
  if (parseStatus) {
    updates.parse_status = parseStatus;
  }

  const { data, error } = await supabase
    .from('bloodwork_documents')
    .update(updates)
    .eq('id', documentId)
    .select('id, user_id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update processing status: ${error?.message || 'Unknown error'}`);
  }

  return {
    documentId: (data as any).id,
    userId: (data as any).user_id,
  };
}

function truncateError(message: string | undefined): string {
  if (!message) return 'Unknown error';
  return message.length > 500 ? `${message.slice(0, 497)}...` : message;
}

async function markProcessingFailed(
  documentId: string,
  userId: string,
  errorMessage: string
) {
  const message = truncateError(errorMessage);
  await updateProcessingStatusInternal(documentId, 'failed', {
    errorMessage: message,
    setCompleted: true,
    progress: STATUS_PROGRESS.failed,
  });

  await sendBloodworkProcessingNotification(userId, 'failed', {
    documentId,
    errorMessage: message,
  });
}

export async function resetProcessingForRetry(documentId: string): Promise<ProcessingUpdateResult> {
  return updateProcessingStatusInternal(documentId, 'pending', {
    errorMessage: null,
    setStarted: true,
    resetCompleted: true,
    progress: STATUS_PROGRESS.pending,
  });
}

export async function getDocumentProcessingStatus(documentId: string) {
  const { data, error } = await supabase
    .from('bloodwork_documents')
    .select(
      `id, processing_status, processing_progress, processing_error, created_at, updated_at, processing_started_at, processing_completed_at`
    )
    .eq('id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    document_id: data.id,
    processing_status: data.processing_status,
    processing_progress: data.processing_progress,
    processing_error: data.processing_error,
    created_at: data.created_at,
    updated_at: data.updated_at,
    processing_started_at: data.processing_started_at,
    processing_completed_at: data.processing_completed_at,
  };
}

export async function updateProcessingStatus(
  documentId: string,
  status: BloodworkProcessingStatus,
  options?: ProcessingUpdateOptions
): Promise<ProcessingUpdateResult> {
  return updateProcessingStatusInternal(documentId, status, options);
}

export async function processBloodworkDocument(documentId: string, userId: string): Promise<void> {
  try {
    await updateProcessingStatusInternal(documentId, 'pending', {
      setStarted: true,
      progress: STATUS_PROGRESS.pending,
      errorMessage: null,
    });

    await updateProcessingStatusInternal(documentId, 'parsing', {
      progress: STATUS_PROGRESS.parsing,
    });

    const parseResult = await parseBloodworkDocument({
      document_id: documentId,
      user_id: userId,
    });

    if (!parseResult.success) {
      await markProcessingFailed(documentId, userId, parseResult.error || parseResult.message || 'Parsing failed');
      return;
    }

    await updateProcessingStatusInternal(documentId, 'extracting', {
      progress: STATUS_PROGRESS.extracting,
    });

    await updateProcessingStatusInternal(documentId, 'generating_trends', {
      progress: STATUS_PROGRESS.generating_trends,
    });

    const trendsResult = await getBloodworkTrendsByUser({ user_id: userId, min_data_points: 1 });

    if (!trendsResult.success) {
      const trendError = trendsResult.error || '';
      if (trendError.includes('No bloodwork results') || trendError.includes('Insufficient data points')) {
        logger.warn('Skipping trend generation due to insufficient data', {
          documentId,
          userId,
          error: trendError,
        });
      } else {
        await markProcessingFailed(documentId, userId, trendError || 'Failed to generate trends');
        return;
      }
    }

    await updateProcessingStatusInternal(documentId, 'generating_recommendations', {
      progress: STATUS_PROGRESS.generating_recommendations,
    });

    logger.info('Generating recommendations', { documentId, userId });
    const recommendationsResult = await generateBloodworkRecommendationsForUser({ user_id: userId });
    logger.info('Recommendations result', { documentId, userId, success: recommendationsResult.success, error: recommendationsResult.error });

    if (!recommendationsResult.success) {
      const recError = recommendationsResult.error || '';
      // Allow completion even if recommendations fail due to insufficient data
      if (recError.includes('No bloodwork results') || recError.includes('Insufficient data') || recError.includes('No data available')) {
        logger.warn('Skipping recommendations due to insufficient data', {
          documentId,
          userId,
          error: recError,
        });
      } else {
        logger.error('Recommendations failed with non-insufficient-data error', {
          documentId,
          userId,
          error: recError,
        });
        await markProcessingFailed(
          documentId,
          userId,
          recommendationsResult.error || 'Failed to generate recommendations'
        );
        return;
      }
    }

    await updateProcessingStatusInternal(documentId, 'complete', {
      errorMessage: null,
      setCompleted: true,
      progress: STATUS_PROGRESS.complete,
    });

    await sendBloodworkProcessingNotification(userId, 'complete', {
      documentId,
    });
  } catch (error) {
    logger.error('Error running bloodwork processing pipeline', { error, documentId, userId });
    await markProcessingFailed(
      documentId,
      userId,
      error instanceof Error ? error.message : 'Processing pipeline failed'
    );
  }
}

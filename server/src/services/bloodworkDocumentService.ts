import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type {
  BloodworkDocument,
  CreateBloodworkDocumentRequest,
  UpdateBloodworkDocumentRequest,
  BloodworkDocumentResponse,
  BloodworkDocumentsResponse,
  BloodworkDocumentListResponse,
  BloodworkTimelineItem,
  BloodworkTimelineResponse,
  BloodworkStatsResponse,
  GetBloodworkDocumentsRequest,
  GetBloodworkDocumentRequest,
  BloodworkUploadResponse,
  BloodworkDocumentType,
  BloodworkSource,
  BloodworkParseStatus,
  BloodworkProcessingStatus,
  BloodworkProcessingStats
} from '../types/bloodworkDocument';
import { BloodworkProcessingStatusValues } from '../types/bloodworkDocument';
import { logger } from '../utils/logger';

const supabase = createClient<any>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Direct table access
const bloodworkTable = supabase.from('bloodwork_documents');

/**
 * Upload and create a bloodwork document record
 */
export async function uploadBloodworkDocument(
  request: CreateBloodworkDocumentRequest
): Promise<BloodworkUploadResponse> {
  try {
    logger.info('Uploading bloodwork document', {
      userId: request.user_id,
      fileName: request.file_name,
      documentType: request.document_type,
      source: request.source,
    });

    const { data, error } = await bloodworkTable
      .insert({
        user_id: request.user_id,
        file_url: request.file_url,
        file_name: request.file_name,
        file_size: request.file_size,
        mime_type: request.mime_type,
        document_type: request.document_type,
        source: request.source,
        test_date: request.test_date,
        upload_date: new Date().toISOString(),
        parse_status: 'pending',
        extraction_confidence: null,
        processing_status: 'uploaded',
        processing_progress: 0,
        processing_error: null,
        processing_started_at: null,
        processing_completed_at: null,
        notes: request.notes,
        metadata: request.metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upload bloodwork document', { error: error.message, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload bloodwork document',
      };
    }

    logger.info('Bloodwork document uploaded successfully', {
      documentId: data.id,
      userId: request.user_id,
    });

    return {
      success: true,
      data: {
        document: data,
        file_url: data.file_url,
      },
      message: 'Bloodwork document uploaded successfully',
    };
  } catch (error) {
    logger.error('Unexpected error uploading bloodwork document', { error, request });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while uploading bloodwork document',
    };
  }
}

/**
 * Get bloodwork documents for a user
 */
export async function getBloodworkDocuments(
  request: GetBloodworkDocumentsRequest
): Promise<BloodworkDocumentListResponse> {
  try {
    logger.info('Getting bloodwork documents', {
      userId: request.user_id,
      page: request.page,
      limit: request.limit,
      documentType: request.document_type,
      source: request.source,
      parseStatus: request.parse_status,
    });

    let query = bloodworkTable
      .select('*', { count: 'exact' })
      .eq('user_id', request.user_id);

    // Apply filters
    if (request.document_type) {
      query = query.eq('document_type', request.document_type);
    }
    if (request.source) {
      query = query.eq('source', request.source);
    }
    if (request.parse_status) {
      query = query.eq('parse_status', request.parse_status);
    }
    if (request.start_date) {
      query = query.gte('test_date', request.start_date);
    }
    if (request.end_date) {
      query = query.lte('test_date', request.end_date);
    }

    // Apply pagination and ordering
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    query = query
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to get bloodwork documents', { error: error.message, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork documents',
      };
    }

    logger.info('Bloodwork documents retrieved successfully', {
      userId: request.user_id,
      count: data?.length || 0,
      total: count || 0,
    });

    return {
      success: true,
      data: {
        documents: data || [],
        total: count || 0,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error('Unexpected error getting bloodwork documents', { error, request });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while retrieving bloodwork documents',
    };
  }
}

/**
 * Get a specific bloodwork document
 */
export async function getBloodworkDocument(
  request: GetBloodworkDocumentRequest
): Promise<BloodworkDocumentResponse> {
  try {
    logger.info('Getting bloodwork document', { documentId: request.id });

    let query = bloodworkTable
      .select('*')
      .eq('id', request.id);

    // If user_id is provided, ensure user can only access their own documents
    if (request.user_id) {
      query = query.eq('user_id', request.user_id);
    }

    const { data, error } = await query.single();

    if (error) {
      logger.error('Failed to get bloodwork document', { error: error.message, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork document',
      };
    }

    logger.info('Bloodwork document retrieved successfully', {
      documentId: data.id,
      userId: data.user_id,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Unexpected error getting bloodwork document', { error, request });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while retrieving bloodwork document',
    };
  }
}

/**
 * Update a bloodwork document
 */
export async function updateBloodworkDocument(
  id: string,
  request: UpdateBloodworkDocumentRequest
): Promise<BloodworkDocumentResponse> {
  try {
    logger.info('Updating bloodwork document', { documentId: id, request });

    const { data, error } = await bloodworkTable
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update bloodwork document', { error: error.message, id, request });
      return {
        success: false,
        error: error.message,
        message: 'Failed to update bloodwork document',
      };
    }

    logger.info('Bloodwork document updated successfully', {
      documentId: data.id,
      userId: data.user_id,
    });

    return {
      success: true,
      data,
      message: 'Bloodwork document updated successfully',
    };
  } catch (error) {
    logger.error('Unexpected error updating bloodwork document', { error, id, request });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while updating bloodwork document',
    };
  }
}

/**
 * Delete a bloodwork document
 */
export async function deleteBloodworkDocument(
  id: string,
  userId?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    logger.info('Deleting bloodwork document', { documentId: id });

    let query = bloodworkTable
      .delete()
      .eq('id', id);

    // If userId is provided, ensure user can only delete their own documents
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      logger.error('Failed to delete bloodwork document', { error: error.message, id });
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete bloodwork document',
      };
    }

    logger.info('Bloodwork document deleted successfully', { documentId: id });

    return {
      success: true,
      message: 'Bloodwork document deleted successfully',
    };
  } catch (error) {
    logger.error('Unexpected error deleting bloodwork document', { error, id });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while deleting bloodwork document',
    };
  }
}

/**
 * Get bloodwork timeline for a user
 */
export async function getBloodworkTimeline(
  userId: string,
  limit: number = 20
): Promise<BloodworkTimelineResponse> {
  try {
    logger.info('Getting bloodwork timeline', { userId, limit });

    const { data, error } = await bloodworkTable
      .select(`
        id,
        file_name,
        document_type,
        source,
        test_date,
        upload_date,
        parse_status,
        extraction_confidence,
        processing_status,
        processing_progress,
        file_url
      `)
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to get bloodwork timeline', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve bloodwork timeline',
      };
    }

    logger.info('Bloodwork timeline retrieved successfully', {
      userId,
      count: data?.length || 0,
    });

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    };
  } catch (error) {
    logger.error('Unexpected error getting bloodwork timeline', { error, userId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while retrieving bloodwork timeline',
    };
  }
}

/**
 * Get bloodwork statistics for a user
 */
export async function getBloodworkStats(
  userId: string
): Promise<BloodworkStatsResponse> {
  try {
    logger.info('Getting bloodwork stats', { userId });

    // Get basic counts
    const { data: documents, error: docsError } = await bloodworkTable
      .select('parse_status, document_type, source, extraction_confidence, upload_date, processing_status, processing_started_at, processing_completed_at')
      .eq('user_id', userId);

    if (docsError) {
      logger.error('Failed to get bloodwork documents for stats', { error: docsError.message, userId });
      return {
        success: false,
        error: docsError.message,
        message: 'Failed to retrieve bloodwork statistics',
      };
    }

    // Calculate statistics
    const totalDocuments = documents?.length || 0;
    const parsedDocuments = documents?.filter(d => d.parse_status === 'parsed').length || 0;
    const pendingDocuments = documents?.filter(d => d.parse_status === 'pending').length || 0;
    const failedDocuments = documents?.filter(d => d.parse_status === 'failed').length || 0;
    
    const latestUpload = documents?.length > 0 
      ? documents.reduce((latest, doc) => 
          new Date(doc.upload_date) > new Date(latest.upload_date) ? doc : latest
        ).upload_date
      : undefined;

    const parsedDocs = documents?.filter(d => d.extraction_confidence !== null) || [];
    const avgConfidence = parsedDocs.length > 0
      ? parsedDocs.reduce((sum, doc) => sum + (doc.extraction_confidence || 0), 0) / parsedDocs.length
      : undefined;

    // Count by document type
    const documentsByType: Record<BloodworkDocumentType, number> = {
      lab_panel: 0,
      hormone: 0,
      metabolic: 0,
      cardiac: 0,
      liver: 0,
      kidney: 0,
      lipid: 0,
      vitamin: 0,
      comprehensive: 0,
      other: 0,
    };

    documents?.forEach(doc => {
      if (doc.document_type in documentsByType) {
        documentsByType[doc.document_type]++;
      }
    });

    // Count by source
    const documentsBySource: Record<BloodworkSource, number> = {
      labcorp: 0,
      quest: 0,
      hospital: 0,
      clinic: 0,
      home_test: 0,
      manual_upload: 0,
      other: 0,
    };

    documents?.forEach(doc => {
      if (doc.source in documentsBySource) {
        documentsBySource[doc.source]++;
      }
    });

    // Processing statistics
    const processingCounts: Record<BloodworkProcessingStatus, number> = BloodworkProcessingStatusValues.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<BloodworkProcessingStatus, number>
    );

    documents?.forEach(doc => {
      const status = doc.processing_status as BloodworkProcessingStatus | undefined;
      if (status && processingCounts[status] !== undefined) {
        processingCounts[status] += 1;
      }
    });

    const inProgressStatuses: BloodworkProcessingStatus[] = [
      'pending',
      'parsing',
      'extracting',
      'generating_trends',
      'generating_recommendations',
    ];

    const inProgress = inProgressStatuses.reduce((sum, status) => sum + (processingCounts[status] || 0), 0);

    const completedDurations: number[] = (documents || [])
      .filter(doc => doc.processing_started_at && doc.processing_completed_at)
      .map(doc => {
        const start = new Date(doc.processing_started_at as string).getTime();
        const end = new Date(doc.processing_completed_at as string).getTime();
        return end - start;
      })
      .filter(duration => duration >= 0);

    const averageProcessingTimeMs = completedDurations.length
      ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
      : null;

    const processingStats: BloodworkProcessingStats = {
      counts: processingCounts,
      in_progress: inProgress,
      average_processing_time_ms: averageProcessingTimeMs,
    };

    logger.info('Bloodwork stats retrieved successfully', {
      userId,
      totalDocuments,
      parsedDocuments,
    });

    return {
      success: true,
      data: {
        total_documents: totalDocuments,
        parsed_documents: parsedDocuments,
        pending_documents: pendingDocuments,
        failed_documents: failedDocuments,
        latest_upload: latestUpload,
        avg_confidence: avgConfidence,
        documents_by_type: documentsByType,
        documents_by_source: documentsBySource,
        processing_stats: processingStats,
      },
    };
  } catch (error) {
    logger.error('Unexpected error getting bloodwork stats', { error, userId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while retrieving bloodwork statistics',
    };
  }
}

/**
 * Update parse status of a bloodwork document
 */
export async function updateBloodworkParseStatus(
  id: string,
  parseStatus: BloodworkParseStatus,
  extractionConfidence?: number
): Promise<BloodworkDocumentResponse> {
  try {
    logger.info('Updating bloodwork parse status', { 
      documentId: id, 
      parseStatus, 
      extractionConfidence 
    });

    const updateData: Partial<BloodworkDocument> = {
      parse_status: parseStatus,
    };

    if (extractionConfidence !== undefined) {
      updateData.extraction_confidence = extractionConfidence;
    }

    const { data, error } = await bloodworkTable
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update bloodwork parse status', { 
        error: error.message, 
        id, 
        parseStatus 
      });
      return {
        success: false,
        error: error.message,
        message: 'Failed to update bloodwork parse status',
      };
    }

    logger.info('Bloodwork parse status updated successfully', {
      documentId: data.id,
      parseStatus: data.parse_status,
      extractionConfidence: data.extraction_confidence,
    });

    return {
      success: true,
      data,
      message: 'Bloodwork parse status updated successfully',
    };
  } catch (error) {
    logger.error('Unexpected error updating bloodwork parse status', { 
      error, 
      id, 
      parseStatus 
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Unexpected error occurred while updating bloodwork parse status',
    };
  }
}

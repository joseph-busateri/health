import { Platform } from 'react-native';

import type {
  BloodworkDocument,
  BloodworkTimelineItem,
  BloodworkStats,
  BloodworkUploadRequest,
  BloodworkUploadResponse,
  BloodworkDocumentsResponse,
  BloodworkDocumentResponse,
  BloodworkTimelineResponse,
  BloodworkStatsResponse,
  BloodworkFilterOptions,
  BloodworkDocumentListItem,
  BloodworkUploadFormData,
  BloodworkProcessingStatus,
  BloodworkProcessingStats,
  BloodworkDocumentStatusResponse,
} from '../types/bloodwork';
import {
  getDocumentTypeLabel,
  getSourceLabel,
  getParseStatusLabel,
  getParseStatusColor,
  formatFileSize,
  formatDate,
  formatFullDate,
  formatTestDate,
  getFileTypeIcon,
} from '../types/bloodwork';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const SHOULD_INCLUDE_CREDENTIALS = Platform.OS !== 'web';

class BloodworkService {
  /**
   * Upload a bloodwork document
   */
  async uploadBloodworkDocument(
    request: BloodworkUploadRequest,
    userId: string
  ): Promise<BloodworkUploadResponse> {
    try {
      console.log('🚀 Starting upload to server...');
      console.log('📁 File:', request.file_name);
      console.log('👤 User ID:', userId);
      console.log('📄 File object:', request.file);
      
      // Create FormData properly for React Native
      const formData = new FormData();
      
      // Handle React Native file differently for web vs native
      if (typeof window !== 'undefined') {
        const maybeFile: any = request.file;
        if (maybeFile instanceof File) {
          formData.append('file', maybeFile);
        } else if (maybeFile?.uri && typeof maybeFile.uri === 'string') {
          const uri: string = maybeFile.uri;
          if (uri.startsWith('blob:') || uri.startsWith('data:')) {
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, request.file_name);
          } else {
            formData.append('file', maybeFile);
          }
        } else {
          formData.append('file', maybeFile);
        }
      } else {
        // React Native native
        formData.append('file', request.file as any);
      }
      
      formData.append('user_id', userId);
      formData.append('file_name', request.file_name);
      formData.append('document_type', request.document_type);
      formData.append('source', request.source);
      
      if (request.notes) {
        formData.append('notes', request.notes);
      }

      console.log('📤 Sending request to:', `${API_BASE_URL}/bloodwork/upload`);
      console.log('📋 FormData prepared');

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        signal: controller.signal,
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });

      clearTimeout(timeoutId);
      console.log('📥 Response received:', response.status);

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Upload failed',
          message: data.message || 'Failed to upload bloodwork document',
        };
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Bloodwork document uploaded successfully',
      };
    } catch (error) {
      console.error('💥 Upload error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          message: 'Upload timed out after 30 seconds',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to upload bloodwork document',
      };
    }
  }

  /**
   * Get bloodwork documents for a user
   */
  async getBloodworkDocuments(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: BloodworkFilterOptions
  ): Promise<BloodworkDocumentsResponse> {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.document_type) {
        params.append('document_type', filters.document_type);
      }
      if (filters?.source) {
        params.append('source', filters.source);
      }
      if (filters?.parse_status) {
        params.append('parse_status', filters.parse_status);
      }
      if (filters?.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await fetch(`${API_BASE_URL}/bloodwork/documents/${userId}?${params}`, {
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch documents',
          message: data.message || 'Failed to retrieve bloodwork documents',
        };
      }

      return {
        success: true,
        data: {
          documents: data.data?.documents || [],
          total: data.data?.total || 0,
          page: data.data?.page || page,
          limit: data.data?.limit || limit,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to retrieve bloodwork documents',
      };
    }
  }

  /**
   * Get a specific bloodwork document
   */
  async getBloodworkDocument(
    id: string,
    userId?: string
  ): Promise<BloodworkDocumentResponse> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${id}${params}`, {
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Document not found',
          message: data.message || 'Failed to retrieve bloodwork document',
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to retrieve bloodwork document',
      };
    }
  }

  /**
   * Update a bloodwork document
   */
  async updateBloodworkDocument(
    id: string,
    updateData: Partial<BloodworkDocument>
  ): Promise<BloodworkDocumentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Update failed',
          message: data.message || 'Failed to update bloodwork document',
        };
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Bloodwork document updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to update bloodwork document',
      };
    }
  }

  /**
   * Delete a bloodwork document
   */
  async deleteBloodworkDocument(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Delete failed',
          message: data.message || 'Failed to delete bloodwork document',
        };
      }

      return {
        success: true,
        message: data.message || 'Bloodwork document deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to delete bloodwork document',
      };
    }
  }

  /**
   * Get bloodwork timeline for a user
   */
  async getBloodworkTimeline(
    userId: string,
    limit: number = 20
  ): Promise<BloodworkTimelineResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/timeline/${userId}?limit=${limit}`, {
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch timeline',
          message: data.message || 'Failed to retrieve bloodwork timeline',
        };
      }

      return {
        success: true,
        data: data.data || [],
        total: data.total || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to retrieve bloodwork timeline',
      };
    }
  }

  /**
   * Get bloodwork statistics for a user
   */
  async getBloodworkStats(userId: string): Promise<BloodworkStatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/stats/${userId}`, {
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch stats',
          message: data.message || 'Failed to retrieve bloodwork statistics',
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to retrieve bloodwork statistics',
      };
    }
  }

  async getBloodworkDocumentStatus(documentId: string): Promise<BloodworkDocumentStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${documentId}/status`, {
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch processing status',
          message: data.message || 'Failed to retrieve bloodwork processing status',
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to retrieve bloodwork processing status',
      };
    }
  }

  async retryBloodworkProcessing(documentId: string, userId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${documentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
        credentials: SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'omit',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Retry failed',
          message: data.message || 'Failed to restart bloodwork processing',
        };
      }

      return {
        success: true,
        message: data.message || 'Bloodwork processing retry started',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to restart bloodwork processing',
      };
    }
  }

  /**
   * Transform bloodwork documents for UI display
   */
  transformDocumentsForUI(documents: BloodworkDocument[]): BloodworkDocumentListItem[] {
    return documents.map(doc => ({
      id: doc.id,
      file_name: doc.file_name,
      document_type: doc.document_type,
      source: doc.source,
      test_date: doc.test_date,
      upload_date: doc.upload_date,
      parse_status: doc.parse_status,
      extraction_confidence: doc.extraction_confidence,
      file_size: doc.file_size,
      status_color: getParseStatusColor(doc.parse_status),
      type_label: getDocumentTypeLabel(doc.document_type),
      source_label: getSourceLabel(doc.source),
      status_label: getParseStatusLabel(doc.parse_status),
      formatted_date: formatTestDate(doc.test_date),
      formatted_upload_date: formatDate(doc.upload_date),
      formatted_file_size: formatFileSize(doc.file_size),
      processing_status: ((doc as any).processing_status as BloodworkProcessingStatus) ?? 'uploaded',
      processing_progress: (doc as any).processing_progress ?? null,
      processing_error: (doc as any).processing_error ?? null,
      processing_started_at: (doc as any).processing_started_at ?? null,
      processing_completed_at: (doc as any).processing_completed_at ?? null,
    }));
  }

  /**
   * Validate upload form data
   */
  validateUploadFormData(formData: BloodworkUploadFormData): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!formData.document_type) {
      errors.document_type = 'Document type is required';
    }

    if (!formData.source) {
      errors.source = 'Source is required';
    }

    if (formData.test_date) {
      const testDate = new Date(formData.test_date);
      const today = new Date();
      if (testDate > today) {
        errors.test_date = 'Test date cannot be in the future';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Get file type validation
   */
  validateFileType(file: File): { isValid: boolean; error?: string } {
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

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Allowed: PDF, JPEG, PNG, TIFF, TXT, DOC, DOCX',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Format document for timeline display
   */
  formatTimelineItem(document: BloodworkDocument): BloodworkTimelineItem {
    return {
      id: document.id,
      file_name: document.file_name,
      document_type: document.document_type,
      source: document.source,
      test_date: document.test_date,
      upload_date: document.upload_date,
      parse_status: document.parse_status,
      extraction_confidence: document.extraction_confidence,
      processing_status: ((document as any).processing_status as BloodworkProcessingStatus) ?? 'uploaded',
      processing_progress: (document as any).processing_progress ?? null,
      processing_error: (document as any).processing_error ?? null,
      processing_started_at: (document as any).processing_started_at ?? null,
      processing_completed_at: (document as any).processing_completed_at ?? null,
      file_url: document.file_url,
    };
  }

  /**
   * Get status summary for display
   */
  getStatusSummary(stats: BloodworkStats): {
    total: number;
    parsed: number;
    pending: number;
    failed: number;
    successRate: number;
    inProgress: number;
    processingCounts: Record<BloodworkProcessingStatus, number>;
    averageProcessingTimeMs: number | null;
  } {
    const successRate = stats.total_documents > 0 
      ? (stats.parsed_documents / stats.total_documents) * 100 
      : 0;

    return {
      total: stats.total_documents,
      parsed: stats.parsed_documents,
      pending: stats.pending_documents,
      failed: stats.failed_documents,
      successRate: Math.round(successRate),
      inProgress: stats.processing_stats?.in_progress || 0,
      processingCounts: stats.processing_stats?.counts || {} as Record<BloodworkProcessingStatus, number>,
      averageProcessingTimeMs: stats.processing_stats?.average_processing_time_ms ?? null,
    };
  }
}

const bloodworkService = new BloodworkService();

export default bloodworkService;

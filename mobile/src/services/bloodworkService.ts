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

class BloodworkService {
  /**
   * Upload a bloodwork document
   */
  async uploadBloodworkDocument(
    request: BloodworkUploadRequest,
    userId: string
  ): Promise<BloodworkUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('user_id', userId);
      formData.append('file_name', request.file_name);
      formData.append('document_type', request.document_type);
      formData.append('source', request.source);
      
      if (request.test_date) {
        formData.append('test_date', request.test_date);
      }
      
      if (request.notes) {
        formData.append('notes', request.notes);
      }

      const response = await fetch(`${API_BASE_URL}/bloodwork/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

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

      const response = await fetch(`${API_BASE_URL}/bloodwork/documents/${userId}?${params}`);
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
      const response = await fetch(`${API_BASE_URL}/bloodwork/document/${id}${params}`);
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
      const response = await fetch(`${API_BASE_URL}/bloodwork/timeline/${userId}?limit=${limit}`);
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
      const response = await fetch(`${API_BASE_URL}/bloodwork/stats/${userId}`);
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
    };
  }
}

export const bloodworkService = new BloodworkService();
export default bloodworkService;

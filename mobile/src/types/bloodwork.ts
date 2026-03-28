// Bloodwork Document Types for Mobile App

export type BloodworkDocumentType = 
  | 'lab_panel'
  | 'hormone'
  | 'metabolic'
  | 'cardiac'
  | 'liver'
  | 'kidney'
  | 'lipid'
  | 'vitamin'
  | 'comprehensive'
  | 'other';

export type BloodworkSource = 
  | 'labcorp'
  | 'quest'
  | 'hospital'
  | 'clinic'
  | 'home_test'
  | 'manual_upload'
  | 'other';

export type BloodworkParseStatus = 
  | 'pending'
  | 'processing'
  | 'parsed'
  | 'failed'
  | 'needs_review';

export type BloodworkProcessingStatus =
  | 'uploaded'
  | 'pending'
  | 'parsing'
  | 'extracting'
  | 'generating_trends'
  | 'generating_recommendations'
  | 'complete'
  | 'failed';

export interface BloodworkDocument {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  upload_date: string;
  parse_status: BloodworkParseStatus;
  extraction_confidence?: number;
  processing_status: BloodworkProcessingStatus;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  processing_progress?: number | null;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BloodworkTimelineItem {
  id: string;
  file_name: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  upload_date: string;
  parse_status: BloodworkParseStatus;
  extraction_confidence?: number;
  processing_status: BloodworkProcessingStatus;
  processing_progress?: number | null;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  file_url: string;
}

export interface BloodworkStats {
  total_documents: number;
  parsed_documents: number;
  pending_documents: number;
  failed_documents: number;
  latest_upload?: string;
  avg_confidence?: number;
  documents_by_type: Record<BloodworkDocumentType, number>;
  documents_by_source: Record<BloodworkSource, number>;
  processing_stats: BloodworkProcessingStats;
}

export interface BloodworkUploadRequest {
  file: File;
  file_name: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  notes?: string;
}

export interface BloodworkUploadResponse {
  success: boolean;
  data?: {
    document: BloodworkDocument;
    file_url: string;
  };
  error?: string;
  message?: string;
}

export interface BloodworkDocumentsResponse {
  success: boolean;
  data?: {
    documents: BloodworkDocument[];
    total: number;
    page?: number;
    limit?: number;
  };
  error?: string;
  message?: string;
}

export interface BloodworkDocumentResponse {
  success: boolean;
  data?: BloodworkDocument;
  error?: string;
  message?: string;
}

export interface BloodworkDocumentStatus {
  document_id: string;
  processing_status: BloodworkProcessingStatus;
  processing_progress?: number | null;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
}

export interface BloodworkDocumentStatusResponse {
  success: boolean;
  data?: BloodworkDocumentStatus;
  error?: string;
  message?: string;
}

export interface BloodworkTimelineResponse {
  success: boolean;
  data?: BloodworkTimelineItem[];
  total?: number;
  error?: string;
  message?: string;
}

export interface BloodworkStatsResponse {
  success: boolean;
  data?: BloodworkStats;
  error?: string;
  message?: string;
}

// UI Helper Types
export interface BloodworkDocumentListItem {
  id: string;
  file_name: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  upload_date: string;
  parse_status: BloodworkParseStatus;
  extraction_confidence?: number;
  file_size?: number;
  status_color: string;
  type_label: string;
  source_label: string;
  status_label: string;
  formatted_date: string;
  formatted_upload_date: string;
  formatted_file_size: string;
  processing_status: BloodworkProcessingStatus;
  processing_progress?: number | null;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
}

export interface BloodworkUploadFormData {
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  notes?: string;
}

export interface BloodworkFilterOptions {
  document_type?: BloodworkDocumentType;
  source?: BloodworkSource;
  parse_status?: BloodworkParseStatus;
  start_date?: string;
  end_date?: string;
}

// Validation helpers
export const BloodworkDocumentTypeOptions = [
  { value: 'lab_panel' as BloodworkDocumentType, label: 'Lab Panel' },
  { value: 'hormone' as BloodworkDocumentType, label: 'Hormone Panel' },
  { value: 'metabolic' as BloodworkDocumentType, label: 'Metabolic Panel' },
  { value: 'cardiac' as BloodworkDocumentType, label: 'Cardiac Panel' },
  { value: 'liver' as BloodworkDocumentType, label: 'Liver Function' },
  { value: 'kidney' as BloodworkDocumentType, label: 'Kidney Function' },
  { value: 'lipid' as BloodworkDocumentType, label: 'Lipid Panel' },
  { value: 'vitamin' as BloodworkDocumentType, label: 'Vitamin Levels' },
  { value: 'comprehensive' as BloodworkDocumentType, label: 'Comprehensive Panel' },
  { value: 'other' as BloodworkDocumentType, label: 'Other' },
];

export const BloodworkSourceOptions = [
  { value: 'labcorp' as BloodworkSource, label: 'LabCorp' },
  { value: 'quest' as BloodworkSource, label: 'Quest Diagnostics' },
  { value: 'hospital' as BloodworkSource, label: 'Hospital' },
  { value: 'clinic' as BloodworkSource, label: 'Clinic' },
  { value: 'home_test' as BloodworkSource, label: 'Home Test' },
  { value: 'manual_upload' as BloodworkSource, label: 'Manual Upload' },
  { value: 'other' as BloodworkSource, label: 'Other' },
];

export const BloodworkParseStatusOptions = [
  { value: 'pending' as BloodworkParseStatus, label: 'Pending' },
  { value: 'processing' as BloodworkParseStatus, label: 'Processing' },
  { value: 'parsed' as BloodworkParseStatus, label: 'Parsed' },
  { value: 'failed' as BloodworkParseStatus, label: 'Failed' },
  { value: 'needs_review' as BloodworkParseStatus, label: 'Needs Review' },
];

export interface BloodworkProcessingStats {
  counts: Record<BloodworkProcessingStatus, number>;
  in_progress: number;
  average_processing_time_ms: number | null;
}

// Helper functions
export function getDocumentTypeLabel(type: BloodworkDocumentType): string {
  const option = BloodworkDocumentTypeOptions.find(opt => opt.value === type);
  return option?.label || type;
}

export function getSourceLabel(source: BloodworkSource): string {
  const option = BloodworkSourceOptions.find(opt => opt.value === source);
  return option?.label || source;
}

export function getParseStatusLabel(status: BloodworkParseStatus): string {
  const option = BloodworkParseStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
}

export function getParseStatusColor(status: BloodworkParseStatus): string {
  const colors: Record<BloodworkParseStatus, string> = {
    pending: '#FFA500', // Orange
    processing: '#007AFF', // Blue
    parsed: '#34C759', // Green
    failed: '#FF3B30', // Red
    needs_review: '#FF9500', // Yellow
  };
  return colors[status] || '#8E8E93';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return `${bytes} ${sizes[i]}`;
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export function formatFullDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTestDate(dateString?: string): string {
  if (!dateString) return 'No test date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isValidFileType(mimeType?: string): boolean {
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
  
  return allowedTypes.includes(mimeType || '');
}

export function getFileTypeIcon(mimeType?: string): string {
  if (!mimeType) return '📄';
  
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('text')) return '📝';
  if (mimeType.includes('word')) return '📝';
  
  return '📄';
}

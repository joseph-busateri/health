// Bloodwork Document Types for Wave 2, Step 1

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
  lab_name?: string;
  accession_number?: string;
  physician_name?: string;
  patient_sex?: string;
  patient_dob?: string;
  specimen_datetime?: string;
  final_reported_datetime?: string;
  report_status?: string;
  account_name?: string;
  panel_names_detected?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBloodworkDocumentRequest {
  user_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  notes?: string;
  metadata?: Record<string, any>;
  lab_name?: string;
  accession_number?: string;
  physician_name?: string;
  patient_sex?: string;
  patient_dob?: string;
  specimen_datetime?: string;
  final_reported_datetime?: string;
  report_status?: string;
  account_name?: string;
  panel_names_detected?: string[] | null;
}

export interface UpdateBloodworkDocumentRequest {
  document_type?: BloodworkDocumentType;
  source?: BloodworkSource;
  test_date?: string;
  parse_status?: BloodworkParseStatus;
  extraction_confidence?: number;
  processing_status?: BloodworkProcessingStatus;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  processing_progress?: number | null;
  notes?: string;
  metadata?: Record<string, any>;
  lab_name?: string;
  accession_number?: string;
  physician_name?: string;
  patient_sex?: string;
  patient_dob?: string;
  specimen_datetime?: string;
  final_reported_datetime?: string;
  report_status?: string;
  account_name?: string;
  panel_names_detected?: string[] | null;
}

export interface BloodworkDocumentResponse {
  success: boolean;
  data?: BloodworkDocument;
  error?: string;
  message?: string;
}

export interface BloodworkDocumentsResponse {
  success: boolean;
  data?: BloodworkDocument[];
  total?: number;
  error?: string;
  message?: string;
}

export interface BloodworkDocumentListResponse {
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

export interface BloodworkUploadResponse {
  success: boolean;
  data?: {
    document: BloodworkDocument;
    file_url: string;
  };
  error?: string;
  message?: string;
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
  file_url: string;
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
  data?: {
    total_documents: number;
    parsed_documents: number;
    pending_documents: number;
    failed_documents: number;
    latest_upload?: string;
    avg_confidence?: number;
    documents_by_type: Record<BloodworkDocumentType, number>;
    documents_by_source: Record<BloodworkSource, number>;
    processing_stats: BloodworkProcessingStats;
  };
  error?: string;
  message?: string;
}

export interface BloodworkProcessingStats {
  counts: Record<BloodworkProcessingStatus, number>;
  in_progress: number;
  average_processing_time_ms: number | null;
}

// API Request/Response types
export interface UploadBloodworkRequest {
  file: File | Buffer;
  file_name: string;
  document_type: BloodworkDocumentType;
  source: BloodworkSource;
  test_date?: string;
  notes?: string;
}

export interface GetBloodworkDocumentsRequest {
  user_id: string;
  page?: number;
  limit?: number;
  document_type?: BloodworkDocumentType;
  source?: BloodworkSource;
  parse_status?: BloodworkParseStatus;
  start_date?: string;
  end_date?: string;
}

export interface GetBloodworkDocumentRequest {
  id: string;
  user_id?: string;
}

// Validation schemas
export const BloodworkDocumentTypeValues = [
  'lab_panel',
  'hormone',
  'metabolic',
  'cardiac',
  'liver',
  'kidney',
  'lipid',
  'vitamin',
  'comprehensive',
  'other'
] as const;

export const BloodworkSourceValues = [
  'labcorp',
  'quest',
  'hospital',
  'clinic',
  'home_test',
  'manual_upload',
  'other'
] as const;

export const BloodworkParseStatusValues = [
  'pending',
  'processing',
  'parsed',
  'failed',
  'needs_review'
] as const;

export const BloodworkProcessingStatusValues = [
  'uploaded',
  'pending',
  'parsing',
  'extracting',
  'generating_trends',
  'generating_recommendations',
  'complete',
  'failed'
] as const;

// Helper functions
export function isValidBloodworkDocumentType(value: string): value is BloodworkDocumentType {
  return BloodworkDocumentTypeValues.includes(value as BloodworkDocumentType);
}

export function isValidBloodworkSource(value: string): value is BloodworkSource {
  return BloodworkSourceValues.includes(value as BloodworkSource);
}

export function isValidBloodworkParseStatus(value: string): value is BloodworkParseStatus {
  return BloodworkParseStatusValues.includes(value as BloodworkParseStatus);
}

export function isValidBloodworkProcessingStatus(value: string): value is BloodworkProcessingStatus {
  return BloodworkProcessingStatusValues.includes(value as BloodworkProcessingStatus);
}

export function getDocumentTypeLabel(type: BloodworkDocumentType): string {
  const labels: Record<BloodworkDocumentType, string> = {
    lab_panel: 'Lab Panel',
    hormone: 'Hormone Panel',
    metabolic: 'Metabolic Panel',
    cardiac: 'Cardiac Panel',
    liver: 'Liver Function',
    kidney: 'Kidney Function',
    lipid: 'Lipid Panel',
    vitamin: 'Vitamin Levels',
    comprehensive: 'Comprehensive Panel',
    other: 'Other'
  };
  return labels[type] || type;
}

export function getSourceLabel(source: BloodworkSource): string {
  const labels: Record<BloodworkSource, string> = {
    labcorp: 'LabCorp',
    quest: 'Quest Diagnostics',
    hospital: 'Hospital',
    clinic: 'Clinic',
    home_test: 'Home Test',
    manual_upload: 'Manual Upload',
    other: 'Other'
  };
  return labels[source] || source;
}

export function getParseStatusLabel(status: BloodworkParseStatus): string {
  const labels: Record<BloodworkParseStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    parsed: 'Parsed',
    failed: 'Failed',
    needs_review: 'Needs Review'
  };
  return labels[status] || status;
}

export function getParseStatusColor(status: BloodworkParseStatus): string {
  const colors: Record<BloodworkParseStatus, string> = {
    pending: '#FFA500', // Orange
    processing: '#007AFF', // Blue
    parsed: '#34C759', // Green
    failed: '#FF3B30', // Red
    needs_review: '#FF9500' // Yellow
  };
  return colors[status] || '#8E8E93';
}

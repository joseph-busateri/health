import { Database } from './database';

// Supplement Document Types
export type SupplementDocument = Database['public']['Tables']['supplement_documents']['Row'];
export type SupplementDocumentInsert = Database['public']['Tables']['supplement_documents']['Insert'];
export type SupplementDocumentUpdate = Database['public']['Tables']['supplement_documents']['Update'];

// Supplement Baseline Types
export type SupplementBaseline = Database['public']['Tables']['supplement_baseline']['Row'];
export type SupplementBaselineInsert = Database['public']['Tables']['supplement_baseline']['Insert'];
export type SupplementBaselineUpdate = Database['public']['Tables']['supplement_baseline']['Update'];

// Supplement Item Types
export type SupplementItem = Database['public']['Tables']['supplement_items']['Row'];
export type SupplementItemInsert = Database['public']['Tables']['supplement_items']['Insert'];
export type SupplementItemUpdate = Database['public']['Tables']['supplement_items']['Update'];

// Supplement Extracted Sections Types
export type SupplementExtractedSection = Database['public']['Tables']['supplement_extracted_sections']['Row'];
export type SupplementExtractedSectionInsert = Database['public']['Tables']['supplement_extracted_sections']['Insert'];
export type SupplementExtractedSectionUpdate = Database['public']['Tables']['supplement_extracted_sections']['Update'];

// Supplement Change Log Types
export type SupplementChangeLog = Database['public']['Tables']['supplement_change_log']['Row'];
export type SupplementChangeLogInsert = Database['public']['Tables']['supplement_change_log']['Insert'];
export type SupplementChangeLogUpdate = Database['public']['Tables']['supplement_change_log']['Update'];

// Manual Supplement Data Structure (for manual_entry uploads)
export interface ManualSupplementData {
  stackName: string;
  stackNotes?: string;
  timingNotes?: string;
  frequencyNotes?: string;
  supplements: Array<{
    supplementName: string;
    dosage: number;
    dosageUnit: string;
    frequency: string;
    timing: string;
    status: 'active' | 'paused' | 'removed';
    notes?: string;
  }>;
}

// API Request/Response Types
export interface CreateSupplementDocumentRequest {
  userId: string;
  documentType: 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';
  fileReference?: string;
  storagePath?: string;
  notes?: string;
  manualSupplementData?: ManualSupplementData;
}

export interface SupplementDocumentResult {
  document: SupplementDocument;
  baseline: SupplementBaseline;
  items: SupplementItem[];
  extractedSections: SupplementExtractedSection[];
}

export interface SupplementBaselineWithItems extends SupplementBaseline {
  items: SupplementItem[];
}

// Constants
export const SUPPLEMENT_DOCUMENT_TABLE = 'supplement_documents';
export const SUPPLEMENT_BASELINE_TABLE = 'supplement_baseline';
export const SUPPLEMENT_ITEMS_TABLE = 'supplement_items';
export const SUPPLEMENT_EXTRACTED_SECTIONS_TABLE = 'supplement_extracted_sections';
export const SUPPLEMENT_CHANGE_LOG_TABLE = 'supplement_change_log';

export const VALID_DOCUMENT_TYPES = ['pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet'] as const;
export const VALID_SUPPLEMENT_STATUSES = ['active', 'paused', 'removed'] as const;
export const VALID_CHANGE_SOURCES = ['document_upload', 'agent_refinement', 'user_correction', 'system_update'] as const;

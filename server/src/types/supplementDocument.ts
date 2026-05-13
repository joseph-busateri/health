import { Database } from './database';

// Supplement Document Types
export type SupplementDocument = Database['public']['Tables']['supplement_documents']['Row'];
export type SupplementDocumentInsert = Database['public']['Tables']['supplement_documents']['Insert'];
export type SupplementDocumentUpdate = Database['public']['Tables']['supplement_documents']['Update'];

// NEW SYSTEM: Supplement Stack Version Types
export interface SupplementStackVersion {
  id: string;
  user_id: string;
  version_number: number;
  version_name: string | null;
  is_current: boolean;
  created_by: 'user' | 'agent';
  created_reason: string | null;
  based_on_recommendation_id: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface SupplementStackVersionInsert {
  user_id: string;
  version_number: number;
  version_name?: string;
  is_current?: boolean;
  created_by: 'user' | 'agent';
  created_reason?: string;
  based_on_recommendation_id?: string;
  effective_from: string;
  effective_to?: string;
}

// NEW SYSTEM: Supplement Types
export interface Supplement {
  id: string;
  stack_version_id: string;
  supplement_name: string;
  brand: string | null;
  form: string | null;
  dosage_amount: number;
  dosage_unit: string;
  timing: string;
  frequency: string;
  times_per_day: number;
  goal: string | null;
  reason_to_take: string | null;
  take_with_food: boolean;
  take_with_water: boolean;
  avoid_with: string[] | null;
  cost_per_serving: number | null;
  servings_per_container: number | null;
  status: 'active' | 'paused' | 'discontinued';
  discontinue_reason: string | null;
  supplement_order: number;
  created_at: string;
}

export interface SupplementInsert {
  stack_version_id: string;
  supplement_name: string;
  brand?: string;
  form?: string;
  dosage_amount: number;
  dosage_unit: string;
  timing: string;
  frequency: string;
  times_per_day?: number;
  goal?: string;
  reason_to_take?: string;
  take_with_food?: boolean;
  take_with_water?: boolean;
  avoid_with?: string[];
  cost_per_serving?: number;
  servings_per_container?: number;
  status?: 'active' | 'paused' | 'discontinued';
  discontinue_reason?: string;
  supplement_order: number;
}

// NEW SYSTEM: Supplement Stack Change Types
export interface SupplementStackChange {
  id: string;
  from_version_id: string | null;
  to_version_id: string;
  change_type: 'supplement_added' | 'supplement_removed' | 'dosage_changed' | 'timing_changed' | 'frequency_changed' | 'status_changed';
  change_description: string;
  supplement_name: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  triggered_by_bloodwork: boolean;
  triggered_by_side_effects: boolean;
  triggered_by_adherence: boolean;
  triggered_by_performance: boolean;
  created_at: string;
}

// LEGACY SYSTEM: Supplement Baseline Types (deprecated)
export type SupplementBaseline = Database['public']['Tables']['supplement_baseline']['Row'];
export type SupplementBaselineInsert = Database['public']['Tables']['supplement_baseline']['Insert'];
export type SupplementBaselineUpdate = Database['public']['Tables']['supplement_baseline']['Update'];

// LEGACY SYSTEM: Supplement Item Types (deprecated)
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

// NEW SYSTEM: Document Result
export interface SupplementDocumentResult {
  document: SupplementDocument;
  stackVersion: SupplementStackVersion;
  supplements: Supplement[];
  extractedSections: SupplementExtractedSection[];
}

// NEW SYSTEM: Stack with Supplements
export interface SupplementStackWithSupplements extends SupplementStackVersion {
  supplements: Supplement[];
}

// LEGACY: Baseline with Items (deprecated)
export interface SupplementBaselineWithItems extends SupplementBaseline {
  items: SupplementItem[];
}

// Constants - NEW SYSTEM
export const SUPPLEMENT_DOCUMENT_TABLE = 'supplement_documents';
export const SUPPLEMENT_STACK_VERSIONS_TABLE = 'supplement_stack_versions';
export const SUPPLEMENTS_TABLE = 'supplements';
export const SUPPLEMENT_STACK_CHANGES_TABLE = 'supplement_stack_changes';
export const SUPPLEMENT_ADHERENCE_LOG_TABLE = 'supplement_adherence_log';
export const SUPPLEMENT_INTERACTIONS_TABLE = 'supplement_interactions';
export const SUPPLEMENT_INVENTORY_TABLE = 'supplement_inventory';
export const SUPPLEMENT_BASELINE_DOCUMENTS_TABLE = 'supplement_baseline_documents';
export const SUPPLEMENT_EXTRACTED_SECTIONS_TABLE = 'supplement_extracted_sections';

// Constants - LEGACY SYSTEM (deprecated)
export const SUPPLEMENT_BASELINE_TABLE = 'supplement_baseline';
export const SUPPLEMENT_ITEMS_TABLE = 'supplement_items';
export const SUPPLEMENT_CHANGE_LOG_TABLE = 'supplement_change_log';

export const VALID_DOCUMENT_TYPES = ['pdf', 'docx', 'txt', 'manual_entry', 'spreadsheet'] as const;
export const VALID_SUPPLEMENT_STATUSES = ['active', 'paused', 'removed'] as const;
export const VALID_CHANGE_SOURCES = ['document_upload', 'agent_refinement', 'user_correction', 'system_update'] as const;

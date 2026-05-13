// React Native types for supplement document functionality

export interface SupplementItem {
  id: string;
  supplement_baseline_id: string;
  supplement_name: string;
  dosage: number;
  dosage_unit: string;
  frequency: string;
  timing: string;
  status: 'active' | 'paused' | 'removed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplementBaseline {
  id: string;
  user_id: string;
  document_id: string;
  stack_name: string;
  stack_notes?: string;
  total_active_items: number;
  timing_notes?: string;
  frequency_notes?: string;
  extracted_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupplementBaselineWithItems extends SupplementBaseline {
  items: SupplementItem[];
}

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

export interface SupplementDocumentResult {
  document: {
    id: string;
    user_id: string;
    file_reference?: string;
    storage_path?: string;
    upload_date: string;
    document_type: 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';
    parse_status: 'pending' | 'processing' | 'completed' | 'failed';
    extraction_confidence?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
  };
  baseline: SupplementBaseline;
  items: SupplementItem[];
  extractedSections: Array<{
    id: string;
    user_id: string;
    document_id: string;
    raw_text: string;
    normalized_name: string;
    extraction_confidence: number;
    created_at: string;
  }>;
}

export interface CreateSupplementDocumentRequest {
  userId: string;
  documentType: 'pdf' | 'docx' | 'txt' | 'manual_entry' | 'spreadsheet';
  fileReference?: string;
  storagePath?: string;
  notes?: string;
  manualSupplementData?: ManualSupplementData;
}

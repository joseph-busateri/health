export interface BloodworkResult {
  id: string;
  document_id: string;
  panel_id?: string | null;
  user_id: string;
  panel_name?: string;
  raw_test_name: string;
  normalized_test_name?: string;
  category?: string;
  sub_category?: string;
  value_text?: string;
  value_numeric?: number;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  abnormal_flag?: string;
  abnormal_flag_source?: string;
  confidence?: number;
  test_date?: string;
  lab_timestamp?: string;
  source?: string;
  source_lab?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBloodworkResultRequest {
  document_id: string;
  panel_id?: string | null;
  user_id: string;
  panel_name?: string;
  raw_test_name: string;
  normalized_test_name?: string;
  category?: string;
  sub_category?: string;
  value_text?: string;
  value_numeric?: number;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  abnormal_flag?: string;
  abnormal_flag_source?: string;
  confidence?: number;
  test_date?: string;
  lab_timestamp?: string;
  source?: string;
  source_lab?: string;
  notes?: string;
}

export interface UpdateBloodworkResultRequest {
  normalized_test_name?: string;
  category?: string;
  sub_category?: string;
  value_text?: string;
  value_numeric?: number;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  abnormal_flag?: string;
  abnormal_flag_source?: string;
  confidence?: number;
  test_date?: string;
  lab_timestamp?: string;
  source?: string;
  source_lab?: string;
  notes?: string;
}

export interface BloodworkResultResponse {
  success: boolean;
  data?: BloodworkResult;
  error?: string;
  message?: string;
}

export interface BloodworkResultsResponse {
  success: boolean;
  data?: {
    results: BloodworkResult[];
    total: number;
    page?: number;
    limit?: number;
  };
  error?: string;
  message?: string;
}

export interface GetBloodworkResultsRequest {
  user_id: string;
  document_id?: string;
  normalized_test_name?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface GetBloodworkResultsByDocumentRequest {
  document_id: string;
  user_id?: string;
}

export interface ParseBloodworkRequest {
  document_id: string;
  user_id?: string;
}

export interface ParseBloodworkResponse {
  success: boolean;
  data?: {
    results_extracted: number;
    results: BloodworkResult[];
    confidence: number;
    processing_time: number;
    panels_detected: ExtractedBloodworkPanel[];
    panel_count: number;
  };
  error?: string;
  message?: string;
}

export interface BloodworkTimelineItem {
  test_date: string;
  results: {
    normalized_test_name?: string;
    raw_test_name: string;
    value: string;
    value_numeric?: number;
    unit?: string;
    abnormal_flag?: string;
    abnormal_flag_source?: string;
    confidence?: number;
    panel_name?: string;
  }[];
}

export interface BloodworkTimelineResponse {
  success: boolean;
  data?: {
    timeline: BloodworkTimelineItem[];
    total_tests: number;
    unique_markers: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  error?: string;
  message?: string;
}

// Normalization mapping types
export interface BloodworkNormalizationRule {
  raw_patterns: string[];
  normalized_name: string;
  category: string;
  sub_category?: string;
  panel_name?: string;
  panel_category?: string;
  priority: number;
}

export interface NormalizationResult {
  normalized_name?: string;
  category?: string;
  sub_category?: string;
  panel_name?: string;
  panel_category?: string;
  confidence: number;
  matched_pattern?: string;
}

// Extraction types
export interface ExtractedBloodworkResult {
  panel_name?: string;
  panel_category?: string;
  raw_test_name: string;
  value_text: string;
  value_numeric?: number;
  unit?: string;
  reference_range_text?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  abnormal_flag?: string;
  abnormal_flag_source?: string;
  notes?: string;
  lab_timestamp?: string;
  confidence: number;
}

export interface ExtractionResult {
  success: boolean;
  panels: ExtractedBloodworkPanel[];
  results: ExtractedBloodworkResult[];
  confidence: number;
  processing_time: number;
  errors?: string[];
  metadata?: {
    extraction_method?: string;
    pattern_format?: string;
    pattern_confidence?: number;
    [key: string]: any;
  };
}

export interface ExtractedBloodworkPanel {
  panel_name: string;
  panel_category?: string;
  panel_datetime?: string;
  panel_status?: string;
}

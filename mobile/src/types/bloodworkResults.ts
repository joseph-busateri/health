export interface BloodworkResult {
  id: string;
  document_id: string;
  user_id: string;
  raw_test_name: string;
  normalized_test_name?: string;
  category?: string;
  value_text?: string;
  value_numeric?: number;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  abnormal_flag?: boolean;
  confidence?: number;
  test_date?: string;
  source?: string;
  created_at: string;
  updated_at: string;
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

export interface BloodworkTimelineItem {
  test_date: string;
  results: {
    normalized_test_name?: string;
    raw_test_name: string;
    value: string;
    value_numeric?: number;
    unit?: string;
    abnormal_flag?: boolean;
    confidence?: number;
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

export interface ParseBloodworkResponse {
  success: boolean;
  data?: {
    results_extracted: number;
    results: BloodworkResult[];
    confidence: number;
    processing_time: number;
  };
  error?: string;
  message?: string;
}

// UI helper types
export interface GroupedBloodworkResult {
  normalized_test_name?: string;
  raw_test_name: string;
  category?: string;
  results: {
    test_date: string;
    value: string;
    value_numeric?: number;
    unit?: string;
    abnormal_flag?: boolean;
    confidence?: number;
    document_id: string;
  }[];
}

export interface BloodworkResultsScreenProps {
  userId: string;
}

export interface BloodworkTimelineScreenProps {
  userId: string;
}

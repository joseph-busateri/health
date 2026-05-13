export type RecommendationType = 
  | 'cardiovascular'
  | 'metabolic'
  | 'hormonal'
  | 'inflammation'
  | 'follow_up'
  | 'monitoring'
  | 'lifestyle'
  | 'supplement_review'
  | 'workout_review';

export type RecommendationSeverity = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'active' | 'superseded' | 'resolved';

export interface BloodworkRecommendation {
  id: string;
  user_id: string;
  test_name: string;
  normalized_test_name?: string;
  category?: string;
  recommendation_type: RecommendationType;
  recommendation_title: string;
  recommendation_text: string;
  rationale: string;
  confidence: number; // 0-1 scale
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  source_document_ids: string[];
  source_result_ids: string[];
  source_trend_window: {
    start_date: string;
    end_date: string;
    data_points: number;
  };
  created_at: string;
  updated_at: string;
}

export interface BloodworkRecommendationsResponse {
  success: boolean;
  data?: {
    recommendations: BloodworkRecommendation[];
    total: number;
  };
  error?: string;
}

export interface GenerateRecommendationsRequest {
  user_id: string;
  force_regenerate?: boolean;
}

export interface GenerateRecommendationsResponse {
  success: boolean;
  data?: {
    generated_count: number;
    superseded_count: number;
    recommendations: BloodworkRecommendation[];
  };
  error?: string;
}

export interface UpdateRecommendationStatusRequest {
  status: RecommendationStatus;
}

export interface UpdateRecommendationStatusResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface BloodworkRecommendationsScreenProps {
  userId: string;
}

export interface GroupedBloodworkRecommendations {
  [category: string]: BloodworkRecommendation[];
}

export interface RecommendationFilterOptions {
  status?: RecommendationStatus;
  recommendation_type?: RecommendationType;
  severity?: RecommendationSeverity;
  limit?: number;
  offset?: number;
}

export interface RecommendationStatistics {
  total: number;
  active: number;
  by_type: Record<RecommendationType, number>;
  by_severity: Record<RecommendationSeverity, number>;
  by_status: Record<RecommendationStatus, number>;
}

export type RecommendationType = 
  | 'cardiovascular'
  | 'metabolic'
  | 'hormonal'
  | 'inflammation'
  | 'liver'
  | 'kidney'
  | 'hematology'
  | 'thyroid'
  | 'nutritional'
  | 'prostate'
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

export interface CreateBloodworkRecommendationRequest {
  user_id: string;
  test_name: string;
  normalized_test_name?: string;
  category?: string;
  recommendation_type: RecommendationType;
  recommendation_title: string;
  recommendation_text: string;
  rationale: string;
  confidence: number;
  severity: RecommendationSeverity;
  source_document_ids: string[];
  source_result_ids: string[];
  source_trend_window: {
    start_date: string;
    end_date: string;
    data_points: number;
  };
}

export interface UpdateRecommendationStatusRequest {
  status: RecommendationStatus;
}

export interface GetBloodworkRecommendationsRequest {
  user_id: string;
  status?: RecommendationStatus;
  recommendation_type?: RecommendationType;
  severity?: RecommendationSeverity;
  limit?: number;
  offset?: number;
}

export interface GetBloodworkRecommendationsResponse {
  success: boolean;
  data?: {
    recommendations: BloodworkRecommendation[];
    total: number;
  };
  error?: string;
}

export interface GenerateRecommendationsRequest {
  user_id: string;
  force_regenerate?: boolean; // Override existing recommendations
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

export interface RecommendationRule {
  marker_name: string;
  recommendation_type: RecommendationType;
  conditions: {
    trend_direction?: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
    min_data_points?: number;
    value_threshold?: {
      operator: '>' | '<' | '>=' | '<=' | '==';
      value: number;
    };
    trend_threshold?: {
      operator: '>' | '<';
      value: number; // percent change
    };
  };
  recommendation: {
    title: string;
    text_template: string; // Template with placeholders like {value}, {change}, {direction}
    rationale_template: string;
    severity: RecommendationSeverity;
    base_confidence: number;
  };
}

export interface RecommendationEvaluation {
  marker_name: string;
  trend: any; // BloodworkTrend from trends service
  rule: RecommendationRule;
  matches: boolean;
  confidence: number;
  severity: RecommendationSeverity;
  recommendation_data: {
    title: string;
    text: string;
    rationale: string;
  };
}

export interface RecommendationGenerationResult {
  total_evaluated: number;
  recommendations_generated: number;
  recommendations_superseded: number;
  evaluation_results: RecommendationEvaluation[];
  generated_recommendations: BloodworkRecommendation[];
}

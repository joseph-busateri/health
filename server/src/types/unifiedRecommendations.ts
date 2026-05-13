/**
 * Unified Recommendation System
 * Consolidates all recommendations into a single, cohesive interface
 */

export type RecommendationSource = 
  | 'bloodwork'
  | 'body_composition'
  | 'device_data'
  | 'goals'
  | 'adherence'
  | 'supplements'
  | 'workout'
  | 'sleep'
  | 'nutrition'
  | 'ai_analysis';

export type RecommendationCategory = 
  | 'cardiovascular'
  | 'metabolic'
  | 'hormonal'
  | 'inflammation'
  | 'body_composition'
  | 'recovery'
  | 'performance'
  | 'lifestyle'
  | 'nutrition'
  | 'supplement'
  | 'workout'
  | 'sleep'
  | 'stress_management';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationStatus = 'active' | 'accepted' | 'dismissed' | 'superseded' | 'expired';
export type RecommendationTimeframe = 'immediate' | 'today' | 'this_week' | 'this_month' | 'long_term';

/**
 * Unified Recommendation Interface
 * All recommendations follow this structure regardless of source
 */
export interface UnifiedRecommendation {
  // Core Identity
  id: string;
  user_id: string;
  
  // Classification
  source: RecommendationSource;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  timeframe: RecommendationTimeframe;
  
  // Content
  title: string;
  description: string;
  rationale: string;
  intended_outcome: string;
  
  // Action Items
  action_items?: string[];
  
  // Metadata
  confidence: number; // 0-1 scale
  status: RecommendationStatus;
  
  // Source Data
  source_data: {
    source_type: RecommendationSource;
    source_ids: string[]; // IDs of source documents/records
    data_points: number;
    date_range?: {
      start: string;
      end: string;
    };
  };
  
  // User Interaction
  accepted_at?: string;
  dismissed_at?: string;
  dismissal_reason?: string;
  user_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // AI Enhancement
  ai_generated: boolean;
  ai_cost?: number;
  
  // Related Recommendations
  related_recommendation_ids?: string[];
  supersedes_recommendation_id?: string;
}

/**
 * Request to create a unified recommendation
 */
export interface CreateUnifiedRecommendationRequest {
  user_id: string;
  source: RecommendationSource;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  timeframe: RecommendationTimeframe;
  title: string;
  description: string;
  rationale: string;
  intended_outcome: string;
  action_items?: string[];
  confidence: number;
  source_data: {
    source_type: RecommendationSource;
    source_ids: string[];
    data_points: number;
    date_range?: {
      start: string;
      end: string;
    };
  };
  ai_generated?: boolean;
  ai_cost?: number;
  expires_at?: string;
  related_recommendation_ids?: string[];
  supersedes_recommendation_id?: string;
}

/**
 * Request to accept a recommendation
 */
export interface AcceptRecommendationRequest {
  recommendation_id: string;
  user_notes?: string;
}

/**
 * Request to dismiss a recommendation
 */
export interface DismissRecommendationRequest {
  recommendation_id: string;
  reason?: string;
  user_notes?: string;
}

/**
 * Request to get recommendations
 */
export interface GetRecommendationsRequest {
  user_id: string;
  status?: RecommendationStatus | RecommendationStatus[];
  source?: RecommendationSource | RecommendationSource[];
  category?: RecommendationCategory | RecommendationCategory[];
  priority?: RecommendationPriority | RecommendationPriority[];
  timeframe?: RecommendationTimeframe | RecommendationTimeframe[];
  limit?: number;
  offset?: number;
}

/**
 * Response with recommendations
 */
export interface GetRecommendationsResponse {
  success: boolean;
  data?: {
    recommendations: UnifiedRecommendation[];
    total: number;
    by_priority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    by_timeframe: {
      immediate: number;
      today: number;
      this_week: number;
      this_month: number;
      long_term: number;
    };
    by_source: Record<RecommendationSource, number>;
  };
  error?: string;
}

/**
 * Context for generating recommendations
 */
export interface RecommendationContext {
  user_id: string;
  
  // Bloodwork data
  latest_bloodwork?: {
    document_id: string;
    test_date: string;
    markers: Array<{
      name: string;
      value: number;
      unit: string;
      abnormal: boolean;
    }>;
  };
  
  // Body composition data
  latest_body_composition?: {
    scan_id: string;
    scan_date: string;
    weight: number;
    body_fat_percentage: number;
    muscle_mass: number;
  };
  
  // Device data (last 7 days)
  device_data?: {
    avg_sleep_hours: number;
    avg_hrv: number;
    avg_resting_hr: number;
    avg_activity_minutes: number;
    avg_steps: number;
  };
  
  // Goals
  active_goals?: Array<{
    id: string;
    name: string;
    category: string;
    progress: number;
    on_track: boolean;
  }>;
  
  // Adherence
  adherence?: {
    overall_score: number;
    workout: number;
    nutrition: number;
    sleep: number;
    supplement: number;
  };
  
  // Baseline profile
  baseline?: {
    age: number;
    gender: string;
    health_goals: string[];
  };
  
  // Supplement stack
  supplements?: Array<{
    name: string;
    dosage: number;
    dosage_unit: string;
    frequency: string;
    timing: string;
    status: 'active' | 'paused' | 'removed';
    goal?: string;
  }>;
  
  // Workout program
  workout_program?: {
    program_name: string;
    split_type: string;
    days_per_week: number;
    rest_days: number;
  };
  
  // Daily logs (last 30 days for pattern analysis)
  daily_logs?: {
    avg_sleep_hours: number;
    avg_energy_level: number;
    avg_mood: number;
    avg_stress_level: number;
    workout_adherence_avg: number;
    nutrition_adherence_avg: number;
    total_logs: number;
  };
  
  // Historical recommendations (learning from past)
  historical_recommendations?: {
    total_generated: number;
    total_accepted: number;
    total_dismissed: number;
    acceptance_rate: number;
    most_accepted_categories: string[];
    most_dismissed_categories: string[];
    recent_accepted: Array<{
      title: string;
      category: string;
      accepted_at: string;
    }>;
    recent_dismissed: Array<{
      title: string;
      category: string;
      dismissal_reason?: string;
    }>;
  };
}

/**
 * Request to generate recommendations
 */
export interface GenerateRecommendationsRequest {
  user_id: string;
  force_regenerate?: boolean;
  use_ai_enhancement?: boolean;
  sources?: RecommendationSource[];
}

/**
 * Response from generating recommendations
 */
export interface GenerateRecommendationsResponse {
  success: boolean;
  data?: {
    generated_count: number;
    superseded_count: number;
    recommendations: UnifiedRecommendation[];
    cost: number;
    processing_time_ms: number;
  };
  error?: string;
}

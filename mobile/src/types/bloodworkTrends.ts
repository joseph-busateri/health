export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'insufficient_data';

export interface BloodworkTrend {
  marker_name: string;
  category?: string;
  latest_value: number | string;
  prior_value: number | string;
  absolute_change?: number;
  percent_change?: number;
  trend_direction: TrendDirection;
  data_points: number;
  first_test_date: string;
  latest_test_date: string;
  unit?: string;
  trend_summary?: string;
}

export interface BloodworkTrendSummary {
  improving_markers: string[];
  worsening_markers: string[];
  stable_markers: string[];
  insufficient_data_markers: string[];
  total_markers: number;
  analysis_date: string;
  date_range: {
    start: string;
    end: string;
  };
}

export interface BloodworkTrendsResponse {
  success: boolean;
  data?: {
    trends: BloodworkTrend[];
    summary: BloodworkTrendSummary;
    total: number;
  };
  error?: string;
}

export interface BloodworkTrendSummaryResponse {
  success: boolean;
  data?: BloodworkTrendSummary;
  error?: string;
}

export interface SupportedMarker {
  name: string;
  category: string;
  direction: 'lower_is_better' | 'higher_is_better' | 'target_range';
  target_range?: {
    min?: number;
    max?: number;
  };
  unit?: string;
  significant_change_threshold?: number;
}

export interface SupportedMarkersResponse {
  success: boolean;
  data?: {
    markers: SupportedMarker[];
    total: number;
  };
  error?: string;
}

export interface MarkerCategoriesResponse {
  success: boolean;
  data?: {
    categories: string[];
    total: number;
  };
  error?: string;
}

export interface BloodworkTrendsScreenProps {
  userId: string;
}

export interface GroupedBloodworkTrends {
  [category: string]: BloodworkTrend[];
}

export interface TrendFilterOptions {
  category?: string;
  trend_direction?: TrendDirection;
  min_data_points?: number;
}

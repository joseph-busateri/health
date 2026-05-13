import type { InputMetadata } from './inputMetadata';

export type SexualHealthStatus = 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk' | 'reduced';

// Score breakdown types (following metabolic/cardiovascular pattern)
export interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

export interface SexualHealthScoreBreakdown {
  testosterone: ScoreComponent;      // 40 points max
  libido: ScoreComponent;            // 30 points max
  erectileFunction: ScoreComponent;  // 30 points max
  total: number;
  maxTotal: number;
  percentage: number;
}

export interface SexualHealthEvidence {
  sexualHealthStatus: string;
  signals: Array<{
    name: string;
    value: number | string | null;
    interpretation: string;
  }>;
  summary: string;
}

export interface SexualHealthRecommendation {
  type: string;
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source: 'deterministic' | 'ai_enriched';
}

export interface SexualHealthRecord {
  id: string;
  userId: string;
  date: string;
  sexualHealthScore?: number;
  sexualHealthStatus: SexualHealthStatus;
  evidence?: SexualHealthEvidence;
  recommendation: SexualHealthRecommendation;
  createdAt: string;
}

// V3: Extended signal with raw values for display
export interface SexualHealthEvidenceSignalV3 {
  name: string;
  value: number | string | null;
  interpretation: string;
  // NEW V3: Raw latest value for display
  rawValue?: number | string;
  rawUnit?: string;
  // NEW V3: Clinical context
  referenceRange?: { min: number; max: number };
  clinicalCategory?: 'optimal' | 'borderline' | 'low' | 'high';
  // Trend fields
  trendDirection?: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
  trendPercentChange?: number;
  trendDataPoints?: number;
  // NEW V3: Historical data points for transparency
  history?: Array<{
    date: string;
    value: number | string;
  }>;
}

export interface SexualHealthEvidenceV3 {
  sexualHealthStatus: SexualHealthStatus;
  signals: SexualHealthEvidenceSignalV3[];
  summary: string;
  // Trend metadata for quick access
  trendMetadata?: {
    testosterone?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
    freeTestosterone?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
    estradiol?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
    shbg?: {
      direction: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
      percentChange?: number;
      dataPoints: number;
      timespanDays: number;
    };
  };
}

export interface SexualHealthRecordV3 {
  id: string;
  userId: string;
  date: string;
  sexualHealthScore?: number;
  sexualHealthStatus: SexualHealthStatus;
  evidence?: SexualHealthEvidenceV3;
  recommendation: SexualHealthRecommendation;
  trendMetadata?: SexualHealthEvidenceV3['trendMetadata'];
  createdAt: string;
  detailedInputs?: InputMetadata[];
  scoreBreakdown?: SexualHealthScoreBreakdown;
}

// Sexual Health Engine Types V3
// Extends V2 with raw hormone values for display

import type { BloodworkTrend } from './bloodworkTrends';
import type { InputMetadata } from './inputMetadata';
import type {
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  SexualHealthStatus,
  SexualHealthRecommendation,
} from './sexualHealthEngine';

// Re-export V1/V2 types for backward compatibility
export type {
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  SexualHealthStatus,
  SexualHealthRecommendation,
} from './sexualHealthEngine';

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

export interface SexualHealthInputsV3 {
  // Legacy fields from V1
  totalTestosterone?: number;
  freeTestosterone?: number;
  libidoSelfRating?: number;
  erectileFunctionRating?: number;
  morningErectionsFrequency?: number;
  age?: number;
  stressLevel?: number;
  sleepQuality?: number;
  // New fields for AI enrichment (from V1)
  recoveryScore?: number;
  stressScore?: number;
  cardiovascularStatus?: string;
  metabolicStatus?: string;
  testosterone?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepHours?: number;
  adherenceScore?: number;
  fatigueScore?: number;
  // Trend data for hormonal markers (from V2)
  testosteroneTrend?: BloodworkTrend;
  freeTestosteroneTrend?: BloodworkTrend;
  estradiolTrend?: BloodworkTrend;
  shbgTrend?: BloodworkTrend;
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
  // Trend fields (from V2)
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
  // Trend metadata for quick access (from V2)
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
  // Legacy fields (preserved for backward compatibility)
  sexualHealthScore?: number;
  testosteroneMetrics?: TestosteroneMetrics;
  libidoMetrics?: LibidoMetrics;
  erectileMetrics?: ErectileMetrics;
  hormonalRisk?: HormonalRiskLevel;
  inputs?: SexualHealthInputsV3;
  // AI enrichment fields
  sexualHealthStatus: SexualHealthStatus;
  evidence?: SexualHealthEvidenceV3;
  recommendation: SexualHealthRecommendation;
  // Trend metadata
  trendMetadata?: SexualHealthEvidenceV3['trendMetadata'];
  createdAt: string;
  // Input transparency
  detailedInputs?: InputMetadata[];
  // Score breakdown
  scoreBreakdown?: SexualHealthScoreBreakdown;
}

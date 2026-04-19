// Sexual Health Engine Types V2
// Extends V1 with trend analysis support

import type { BloodworkTrend } from './bloodworkTrends';
import type {
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  SexualHealthStatus,
  SexualHealthEvidenceSignal,
  SexualHealthEvidence,
  SexualHealthRecommendation,
} from './sexualHealthEngine';

// Re-export V1 types for backward compatibility
export type {
  LibidoLevel,
  ErectilePerformance,
  HormonalRiskLevel,
  TestosteroneMetrics,
  LibidoMetrics,
  ErectileMetrics,
  SexualHealthStatus,
  SexualHealthEvidenceSignal,
  SexualHealthEvidence,
  SexualHealthRecommendation,
} from './sexualHealthEngine';

export interface SexualHealthInputsV2 {
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
  // NEW: Trend data for hormonal markers
  testosteroneTrend?: BloodworkTrend;
  freeTestosteroneTrend?: BloodworkTrend;
  estradiolTrend?: BloodworkTrend;
  shbgTrend?: BloodworkTrend;
}

export interface SexualHealthEvidenceSignalV2 {
  name: string;
  value: number | string | null;
  interpretation: string;
  // NEW: Trend fields
  trendDirection?: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
  trendPercentChange?: number;
  trendDataPoints?: number;
}

export interface SexualHealthEvidenceV2 {
  sexualHealthStatus: SexualHealthStatus;
  signals: SexualHealthEvidenceSignalV2[];
  summary: string;
  // NEW: Trend metadata for quick access
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
  };
}

export interface SexualHealthRecordV2 {
  id: string;
  userId: string;
  date: string;
  // Legacy fields (preserved for backward compatibility)
  sexualHealthScore?: number;
  testosteroneMetrics?: TestosteroneMetrics;
  libidoMetrics?: LibidoMetrics;
  erectileMetrics?: ErectileMetrics;
  hormonalRisk?: HormonalRiskLevel;
  inputs?: SexualHealthInputsV2;
  // New AI enrichment fields
  sexualHealthStatus: SexualHealthStatus;
  evidence?: SexualHealthEvidenceV2;
  recommendation: SexualHealthRecommendation;
  // NEW: Trend metadata
  trendMetadata?: SexualHealthEvidenceV2['trendMetadata'];
  createdAt: string;
}

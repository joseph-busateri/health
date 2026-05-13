import type { InputMetadata } from './inputMetadata';

// Metabolic Engine Types
// AI-enriched metabolic intelligence with deterministic fallback

export type MetabolicStatus = 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk';

export interface ScoreComponent {
  score: number;
  max: number;
  percentage: number;
  hasData: boolean;
}

export interface MetabolicScoreBreakdown {
  glucoseControl: ScoreComponent;
  lipidProfile: ScoreComponent;
  bodyComposition: ScoreComponent;
  vitals: ScoreComponent;
  total: number;
  maxTotal: number;
  percentage: number;
}

export interface MetabolicInputs {
  fastingGlucose?: number;
  a1c?: number;
  restingHeartRate?: number;
  bodyFat?: number;
  weightTrend?: string;
  insulinResistance?: string;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  totalCholesterol?: number;
  weight?: number;
  waistCircumference?: number;
  fastingInsulin?: number;
}

export interface MetabolicEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
  dataAge?: string | null; // V2: Data freshness tracking
}

export interface MetabolicEvidence {
  metabolicStatus: MetabolicStatus;
  signals: MetabolicEvidenceSignal[];
  summary: string;
}

export interface MetabolicRecommendation {
  type: 'metabolic';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'deterministic' | 'ai_enriched' | 'fallback';
}

export interface MetabolicRecord {
  id: string;
  userId: string;
  date: string;
  metabolicStatus: MetabolicStatus;
  metabolicScore?: number;
  scoreBreakdown?: MetabolicScoreBreakdown;
  evidence?: MetabolicEvidence;
  recommendation: MetabolicRecommendation;
  inputs?: MetabolicInputs;
  createdAt: string;
  detailedInputs?: InputMetadata[];
}

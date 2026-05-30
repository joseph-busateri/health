export type PredictiveRiskLevel = 'low' | 'moderate' | 'high';

export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface PredictiveSignal {
  name: string;
  trend: TrendDirection;
  values: number[];
  interpretation: string;
}

export interface PredictiveEvidence {
  signals: PredictiveSignal[];
  summary: string;
}

export interface PredictiveRecommendation {
  type: 'predictive';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'ai_enriched' | 'fallback';
}

export interface PredictiveRecord {
  id: string;
  userId: string;
  date: string;
  riskLevel: PredictiveRiskLevel;
  evidence: PredictiveEvidence;
  recommendation: PredictiveRecommendation;
  createdAt: string;
}

export interface TrendAnalysisInput {
  recoveryHistory: Array<{ date: string; score: number }>;
  stressHistory: Array<{ date: string; score: number }>;
  jointHistory: Array<{ date: string; riskLevel: string; painLevel?: number }>;
}

export interface TrendAnalysisResult {
  recoveryTrend: TrendDirection;
  stressTrend: TrendDirection;
  jointTrend: TrendDirection;
  signals: PredictiveSignal[];
}

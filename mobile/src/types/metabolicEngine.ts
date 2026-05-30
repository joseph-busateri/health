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

export interface MetabolicEvidence {
  signals: Array<{
    name: string;
    value: number | string | null;
    interpretation: string;
  }>;
  summary: string;
}

export interface MetabolicRecommendation {
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source: 'deterministic' | 'ai_enriched';
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
  inputs?: Record<string, any>;
  detailedInputs?: any[];
  createdAt: string;
}

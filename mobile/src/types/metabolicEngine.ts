export type MetabolicStatus = 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk';

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
  evidence?: MetabolicEvidence;
  recommendation: MetabolicRecommendation;
  createdAt: string;
}

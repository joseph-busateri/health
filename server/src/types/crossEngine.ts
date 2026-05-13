export interface CrossEngineInputs {
  recoveryScore?: number;
  recoveryStatus?: string;
  stressScore?: number;
  stressStatus?: string;
  jointRiskLevel?: string;
  jointStatus?: string;
}

export interface CrossEngineSignal {
  name: string;
  value: string | number | boolean;
  interpretation: string;
}

export type CrossEnginePriority = 'critical' | 'important' | 'optimization';

export type CrossEngineSource = 'deterministic' | 'ai_enriched' | 'fallback';

export interface CrossEngineRecommendation {
  type: 'cross_engine';
  priority: CrossEnginePriority;
  summary: string;
  rationale?: string;
  actions: string[];
  source: CrossEngineSource;
}

export type CrossEngineOverallStatus = 'optimal' | 'moderate' | 'constrained' | 'high_risk';

export interface CrossEngineEvidence {
  overallStatus: CrossEngineOverallStatus;
  signals: CrossEngineSignal[];
  summary: string;
  sourceInputs: CrossEngineInputs;
}

export interface CrossEngineResult {
  id: string;
  userId: string;
  date: string;
  overallStatus: CrossEngineOverallStatus;
  evidence: CrossEngineEvidence;
  recommendation: CrossEngineRecommendation;
  createdAt: string;
}

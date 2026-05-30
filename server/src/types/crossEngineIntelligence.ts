// Cross-Engine Intelligence Layer Types
// Unified orchestration layer that makes all 10 engines reason together

export type CrossEngineOverallStatus =
  | 'optimal'
  | 'moderate'
  | 'constrained'
  | 'high_risk';

export interface CrossEngineEngineSnapshot {
  recoveryStatus?: string;
  stressStatus?: string;
  jointStatus?: string;
  adherenceStatus?: string;
  workoutStatus?: string;
  nutritionStatus?: string;
  metabolicStatus?: string;
  cardiovascularStatus?: string;
  sexualHealthStatus?: string;
  supplementStatus?: string;
}

export interface CrossEngineEvidenceSignal {
  name: string;
  interpretation: string;
  severity?: 'low' | 'moderate' | 'high';
  sourceEngines?: string[];
}

export interface CrossEnginePattern {
  name: string;
  summary: string;
  severity: 'low' | 'moderate' | 'high';
  sourceEngines: string[];
}

export interface CrossEngineRecommendation {
  type: 'cross_engine_intelligence';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'deterministic' | 'ai_enriched' | 'fallback';
}

export interface CrossEngineIntelligenceRecord {
  id: string;
  userId: string;
  date: string;
  overallStatus: CrossEngineOverallStatus;
  engineSnapshot: CrossEngineEngineSnapshot;
  patterns: CrossEnginePattern[];
  evidence: CrossEngineEvidenceSignal[];
  recommendation: CrossEngineRecommendation;
  createdAt: string;
}

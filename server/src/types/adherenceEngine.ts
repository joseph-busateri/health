export type AdherenceStatus = 'low' | 'moderate' | 'high';
export type AdherenceTrend = 'improving' | 'stable' | 'declining';

export interface AdherenceInputs {
  workoutAdherence?: number;
  nutritionAdherence?: number;
  sleepAdherence?: number;
  supplementAdherence?: number;
  recommendationAdherence?: number;
  autonomousPlanAdherence?: number;
  goalPlanAdherence?: number;
  verbalNotes?: string;
}

export interface AdherenceDomainBreakdown {
  workout: number;
  nutrition: number;
  sleep: number;
  supplement: number;
}

export interface AdherenceEvidenceSignal {
  name: string;
  value: number | string | boolean | null;
  interpretation: string;
}

export interface AdherenceEvidence {
  adherenceScore: number;
  adherenceStatus: AdherenceStatus;
  sourceInputs: AdherenceInputs;
  signals: AdherenceEvidenceSignal[];
  summary: string;
}

export type AdherenceRecommendationPriority = 'critical' | 'important' | 'optimization';
export type AdherenceRecommendationSource = 'deterministic' | 'ai_enriched' | 'fallback';

export interface AdherenceRecommendation {
  type?: 'adherence';
  priority?: AdherenceRecommendationPriority;
  summary: string;
  rationale?: string;
  note: string;
  actions?: string[];
  source?: AdherenceRecommendationSource;
}

export interface AdherenceRecord {
  id: string;
  userId: string;
  date: string;
  adherenceScore: number;
  status: AdherenceStatus;
  breakdown: AdherenceDomainBreakdown;
  trend: AdherenceTrend;
  recommendation: AdherenceRecommendation;
  sourceInputs: AdherenceInputs;
  evidence?: AdherenceEvidence;
  createdAt: string;
}

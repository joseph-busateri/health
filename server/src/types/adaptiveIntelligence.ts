export type AdherenceStatus =
  | 'completed'
  | 'partial'
  | 'skipped'
  | 'unknown';

export interface RecommendationOutcome {
  recommendationId: string;
  adherenceStatus: AdherenceStatus;
  outcomeMetrics: {
    recoveryScore?: number;
    stressScore?: number;
    jointRisk?: string;
  };
  improvementDetected: boolean;
  timestamp: string;
}

export interface EffectivenessScore {
  recommendationType: string;
  effectiveness: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface UserPattern {
  patternType: string;
  frequency: number;
  description: string;
}

export interface AdaptiveRecommendation {
  type: 'adaptive';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'ai_enriched' | 'fallback';
  adaptiveBoost?: number;
}

export interface AdaptiveRecord {
  id: string;
  userId: string;
  date: string;
  effectiveness: EffectivenessScore[];
  userPatterns: UserPattern[];
  recommendation: AdaptiveRecommendation;
  createdAt: string;
}

export interface AdaptiveContext {
  userId: string;
  effectivenessScores: EffectivenessScore[];
  recentOutcomes: RecommendationOutcome[];
  userPatterns: UserPattern[];
}

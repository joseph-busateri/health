// Sexual Health Engine Types
// AI-enriched sexual health intelligence with deterministic fallback
// Preserves backward compatibility with existing fields

// Legacy types (preserved for backward compatibility)
export type LibidoLevel = 'high' | 'normal' | 'reduced' | 'low';
export type ErectilePerformance = 'excellent' | 'good' | 'fair' | 'poor';
export type HormonalRiskLevel = 'low' | 'moderate' | 'high';

export interface TestosteroneMetrics {
  totalTestosterone?: number;
  freeTestosterone?: number;
  testosteroneStatus: 'optimal' | 'normal' | 'low' | 'very_low';
}

export interface LibidoMetrics {
  libidoLevel: LibidoLevel;
  libidoScore: number;
  libidoTrend?: 'improving' | 'stable' | 'declining';
}

export interface ErectileMetrics {
  erectilePerformance: ErectilePerformance;
  erectileScore: number;
  morningErections?: 'frequent' | 'occasional' | 'rare' | 'none';
}

// New AI enrichment types
export type SexualHealthStatus = 'optimal' | 'moderate' | 'reduced' | 'high_risk';

export interface SexualHealthInputs {
  // Legacy fields
  totalTestosterone?: number;
  freeTestosterone?: number;
  libidoSelfRating?: number;
  erectileFunctionRating?: number;
  morningErectionsFrequency?: number;
  age?: number;
  stressLevel?: number;
  sleepQuality?: number;
  // New fields for AI enrichment
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
}

export interface SexualHealthEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export interface SexualHealthEvidence {
  sexualHealthStatus: SexualHealthStatus;
  signals: SexualHealthEvidenceSignal[];
  summary: string;
}

export interface SexualHealthRecommendation {
  type: 'sexual_health';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'deterministic' | 'ai_enriched' | 'fallback';
}

export interface SexualHealthRecord {
  id: string;
  userId: string;
  date: string;
  // Legacy fields (preserved for backward compatibility)
  sexualHealthScore?: number;
  testosteroneMetrics?: TestosteroneMetrics;
  libidoMetrics?: LibidoMetrics;
  erectileMetrics?: ErectileMetrics;
  hormonalRisk?: HormonalRiskLevel;
  inputs?: SexualHealthInputs;
  // New AI enrichment fields
  sexualHealthStatus: SexualHealthStatus;
  evidence?: SexualHealthEvidence;
  recommendation: SexualHealthRecommendation;
  createdAt: string;
}

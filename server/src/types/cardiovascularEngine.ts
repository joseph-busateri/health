// Cardiovascular Engine Types
// AI-enriched cardiovascular intelligence with deterministic fallback
// Preserves backward compatibility with existing fields

// Legacy types (preserved for backward compatibility)
export type CardiovascularRiskLevel = 'low' | 'moderate' | 'elevated' | 'high';
export type BPRiskLevel = 'optimal' | 'normal' | 'elevated' | 'stage1' | 'stage2';

export interface RestingHRAnalysis {
  restingHR?: number;
  hrStatus: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  hrTrend?: 'improving' | 'stable' | 'declining';
}

export interface BPAnalysis {
  systolic?: number;
  diastolic?: number;
  bpRisk: BPRiskLevel;
  hypertensionRisk: boolean;
}

export interface LipidPanel {
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  cholesterolRatio?: number;
  ldlHdlRatio?: number;
}

// New AI enrichment types
export type CardiovascularStatus = 'optimal' | 'moderate' | 'elevated_risk' | 'high_risk';

export interface CardiovascularInputs {
  // Existing fields
  restingHR?: number;
  hrv?: number;
  systolicBP?: number;
  diastolicBP?: number;
  lipidPanel?: LipidPanel;
  age?: number;
  smokingStatus?: 'never' | 'former' | 'current' | boolean;
  // New fields for AI enrichment
  vo2Max?: number;
  apoB?: number;
  lipoproteinA?: number;
  hsCRP?: number;
  bodyFat?: number;
  stressScore?: number;
  recoveryScore?: number;
  metabolicStatus?: string;
}

export interface CardiovascularEvidenceSignal {
  name: string;
  value: number | string | null;
  interpretation: string;
}

export interface CardiovascularEvidence {
  cardiovascularStatus: CardiovascularStatus;
  signals: CardiovascularEvidenceSignal[];
  summary: string;
}

export interface CardiovascularRecommendation {
  type: 'cardiovascular';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'deterministic' | 'ai_enriched' | 'fallback';
}

export interface CardiovascularRecord {
  id: string;
  userId: string;
  date: string;
  // Legacy fields (preserved for backward compatibility)
  cardiovascularRiskScore?: number;
  cardiovascularRiskLevel?: CardiovascularRiskLevel;
  restingHRAnalysis?: RestingHRAnalysis;
  bpAnalysis?: BPAnalysis;
  hrvCardiovascularSignal?: number;
  lipidPanel?: LipidPanel;
  inputs?: CardiovascularInputs;
  // New AI enrichment fields
  cardiovascularStatus: CardiovascularStatus;
  evidence?: CardiovascularEvidence;
  recommendation: CardiovascularRecommendation;
  createdAt: string;
}

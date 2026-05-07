import type { InputMetadata } from './inputMetadata';

export type JointHealthStatus = 'stable' | 'caution' | 'aggravated';
export type JointRiskLevel = 'low' | 'moderate' | 'high';

export type JointArea = 'shoulder' | 'knee' | 'back' | 'elbow' | 'other';

export interface JointHealthInputs {
  painLevel?: number;
  tightnessLevel?: number;
  sorenessLevel?: number;
  affectedArea?: JointArea;
  workoutLoad?: number;
  recoveryScore?: number;
  verbalNotes?: string;
}

export interface JointWorkoutModificationRecommendation {
  summary: string;
  modifications: string[];
  safetyNotes: string[];
}

export interface JointHealthRecord {
  id: string;
  userId: string;
  date: string;
  affectedArea: JointArea;
  jointHealthStatus: JointHealthStatus;
  riskLevel: JointRiskLevel;
  inputs: JointHealthInputs;
  recommendation: JointWorkoutModificationRecommendation;
  createdAt: string;
}

// AI Enrichment Types
export interface JointEvidenceSignal {
  name: string;
  value: number | string | boolean | null;
  interpretation: string;
}

export interface JointEvidence {
  riskLevel: JointRiskLevel;
  jointHealthStatus: JointHealthStatus;
  affectedArea: JointArea;
  sourceInputs: JointHealthInputs;
  signals: JointEvidenceSignal[];
  summary: string;
}

export type JointRecommendationPriority = 'critical' | 'important' | 'optimization';

export type JointRecommendationSource = 'deterministic' | 'ai_enriched' | 'fallback';

export interface JointRecommendation {
  type?: 'joint';
  priority?: JointRecommendationPriority;
  summary: string;
  rationale?: string;
  actions: string[];
  source?: JointRecommendationSource;
}

export interface JointRecordEnriched {
  id: string;
  userId: string;
  date: string;
  affectedArea: JointArea;
  jointHealthStatus: JointHealthStatus;
  riskLevel: JointRiskLevel;
  inputs: JointHealthInputs;
  evidence?: JointEvidence;
  recommendation: JointRecommendation;
  createdAt: string;
  detailedInputs?: InputMetadata[];
}

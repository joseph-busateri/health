export type StressStatus = 'low' | 'moderate' | 'high';

export interface StressSourceInputs {
  interviewStressLevel?: number;
  hrv?: number;
  sleepDurationHours?: number;
  workoutLoad?: number;
  recoveryScore?: number;
}

export interface StressEvidenceSignal {
  name: string;
  value: number | string | boolean | null;
  interpretation: string;
}

export interface StressEvidence {
  stressScore: number;
  stressStatus: StressStatus;
  cnsLoadStatus: StressStatus;
  sourceInputs: StressSourceInputs;
  signals: StressEvidenceSignal[];
  summary: string;
}

export type StressRecommendationPriority =
  | 'critical'
  | 'important'
  | 'optimization';

export type StressRecommendationSource =
  | 'deterministic'
  | 'ai_enriched'
  | 'fallback';

export interface StressRecommendation {
  type?: 'stress';
  priority?: StressRecommendationPriority;
  summary: string;
  rationale?: string;
  actions: string[];
  source?: StressRecommendationSource;
}

export interface StressRecord {
  id: string;
  userId: string;
  date: string;
  stressScore: number;
  stressStatus: StressStatus;
  cnsLoadStatus: StressStatus;
  sourceInputs: StressSourceInputs;
  evidence?: StressEvidence;
  recommendation: StressRecommendation;
  createdAt: string;
}

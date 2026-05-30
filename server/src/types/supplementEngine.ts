export type SupplementRecommendationAction = 
  | 'add' 
  | 'remove' 
  | 'adjust_dosage' 
  | 'adjust_timing' 
  | 'review';

export type SupplementRecommendationSeverity = 'low' | 'moderate' | 'high';
export type SupplementRecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'applied';

export interface SupplementRecommendation {
  id: string;
  userId: string;
  supplementName: string;
  action: SupplementRecommendationAction;
  rationale: string;
  confidence: number;
  severity: SupplementRecommendationSeverity;
  status: SupplementRecommendationStatus;
  currentDosage?: string;
  currentTiming?: string;
  recommendedDosage?: string;
  recommendedTiming?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplementEngineContext {
  userId: string;
  currentStack?: {
    stackName: string;
    items: Array<{
      supplementName: string;
      dosage: string;
      dosageUnit: string;
      frequency: string;
      timing: string;
      status: string;
    }>;
  };
  bloodworkConcerns?: Array<{
    marker: string;
    severity: string;
    recommendation?: string;
  }>;
  recoveryScore?: number;
  stressScore?: number;
  adherenceScore?: number;
  sexualHealthScore?: number;
}

export interface SupplementRecommendationResult {
  recommendations: SupplementRecommendation[];
  summary: {
    totalRecommendations: number;
    addCount: number;
    removeCount: number;
    adjustCount: number;
    reviewCount: number;
  };
}

// ============================================================================
// AI ENRICHMENT ARCHITECTURE TYPES
// ============================================================================

export type SupplementStatus =
  | 'optimal'
  | 'suboptimal'
  | 'inefficient'
  | 'conflicted';

export interface SupplementInput {
  name: string;
  dosage: number;
  unit: string;
  frequency: string;
  timing?: string;
}

export interface SupplementEngineInputs {
  supplements: SupplementInput[];
  recoveryScore?: number;
  stressScore?: number;
  metabolicStatus?: string;
  cardiovascularStatus?: string;
  sexualHealthStatus?: string;
  adherenceScore?: number;
  goals?: string[];
}

export interface SupplementEvidenceSignal {
  name: string;
  value?: any;
  interpretation: string;
}

export interface SupplementEvidence {
  supplementStatus: SupplementStatus;
  signals: SupplementEvidenceSignal[];
  summary: string;
}

export interface SupplementRecommendationEnriched {
  type: 'supplement';
  priority: 'critical' | 'important' | 'optimization';
  summary: string;
  actions: string[];
  rationale?: string;
  source?: 'deterministic' | 'ai_enriched' | 'fallback';
}

export interface SupplementRecord {
  id: string;
  userId: string;
  date: string;
  supplementStatus: SupplementStatus;
  evidence?: SupplementEvidence;
  recommendation: SupplementRecommendationEnriched;
  createdAt: string;
}

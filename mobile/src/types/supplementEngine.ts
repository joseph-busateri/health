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

export interface SupplementStackVersion {
  id: string;
  userId: string;
  versionNumber: number;
  versionName: string;
  isCurrent: boolean;
  createdBy: string;
  createdReason?: string;
  basedOnRecommendationId?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt: string;
}

export interface SupplementInventorySummary {
  current_servings: number;
  servings_per_container?: number | null;
  reorder_threshold?: number | null;
  needs_reorder?: boolean | null;
  last_purchase_date?: string | null;
  last_purchase_cost?: number | null;
  vendor?: string | null;
  expiration_date?: string | null;
  supplement_id: string;
  user_id: string;
  id: string;
}

export interface SupplementAdherenceSummary {
  windowDays: number;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  sideEffects: number;
  adherencePercentage: number | null;
}

export interface SupplementRegimenItem {
  id: string;
  supplementName: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: string;
  frequency: string;
  timesPerDay: number;
  goal?: string | null;
  reasonToTake?: string | null;
  status: 'active' | 'paused' | 'discontinued';
  takeWithFood?: boolean | null;
  takeWithWater?: boolean | null;
  createdAt: string;
  inventory: SupplementInventorySummary | null;
  adherence: SupplementAdherenceSummary;
}

export interface SupplementStackMetrics {
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  discontinuedCount: number;
}

export interface SupplementStack {
  stackVersion: SupplementStackVersion;
  supplements: SupplementRegimenItem[];
  metrics: SupplementStackMetrics;
  adherenceSummary: {
    windowDays: number;
    totalScheduled: number;
    totalTaken: number;
    totalMissed: number;
    sideEffects: number;
  };
}

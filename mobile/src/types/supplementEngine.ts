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

export interface SupplementStack {
  stackName: string;
  stackNotes?: string;
  totalActiveItems: number;
  timingNotes?: string;
  frequencyNotes?: string;
  items: Array<{
    supplementName: string;
    dosage: string;
    dosageUnit: string;
    frequency: string;
    timing: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

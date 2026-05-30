export type RecommendationPriority = 'critical' | 'important' | 'optimization';

export type RecommendationCategory =
  | 'workout_modification'
  | 'supplement_adjustment'
  | 'nutrition_change'
  | 'lifestyle_change'
  | 'medical_consultation'
  | 'recovery_protocol'
  | 'stress_management'
  | 'sleep_optimization'
  | 'performance_enhancement'
  | 'injury_prevention'
  | 'health_monitoring';

export type RecommendationState =
  | 'generated'
  | 'presented'
  | 'accepted'
  | 'rejected'
  | 'snoozed'
  | 'modified'
  | 'completed'
  | 'expired';

export interface SupportingMetric {
  name: string;
  value: string;
  status: 'low' | 'normal' | 'high' | 'optimal' | 'suboptimal' | 'concerning';
  change?: string;
  target?: string;
  unit?: string;
}

export interface RecommendationItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  rationale?: string;
  priority: RecommendationPriority;
  urgencyScore?: number;
  category: RecommendationCategory;
  state: RecommendationState;
  sourceEngine: string;
  sourceRecordId?: string;
  actionType?: string;
  actionTarget?: string;
  actionDetails?: Record<string, unknown> | null;
  confidenceLevel?: 'low' | 'medium' | 'high';
  dataQualityScore?: number | null;
  supportingMetrics?: SupportingMetric[] | null;
  requiresUserDecision?: boolean;
  isInsightOnly?: boolean;
  reasonCodes?: string[] | null;
  recommendationGroup?: string | null;
  conflictsWith?: string[] | null;
  conflictReason?: string | null;
  conflictResolved?: boolean;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  presentedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  snoozedAt?: string;
  snoozedUntil?: string;
  completedAt?: string;
  expiredAt?: string;
  userNotes?: string | null;
  userModifiedDetails?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  snoozeReason?: string | null;
  expiresAt?: string | null;
  expirationReason?: string | null;
}

export interface RecommendationConflict {
  id: string;
  recommendationAId: string;
  recommendationBId: string;
  conflictType: string;
  conflictSeverity: 'low' | 'medium' | 'high' | 'critical';
  conflictDescription: string;
  resolved: boolean;
  resolutionStrategy?: string;
  resolvedAt?: string;
  resolvedBy?: 'system' | 'user';
  detectedAt: string;
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: RecommendationItem[];
    conflicts: RecommendationConflict[];
    totalCount: number;
  };
}

export interface PrioritizedRecommendationResponse {
  success: boolean;
  data: {
    critical: RecommendationItem[];
    important: RecommendationItem[];
    optimization: RecommendationItem[];
    conflicts: RecommendationConflict[];
  };
}

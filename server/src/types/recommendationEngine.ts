/**
 * RecommendationEngine Type Definitions
 * 
 * Central type system for the unified recommendation engine.
 * Manages lifecycle, prioritization, and conflict detection for all health recommendations.
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type RecommendationState =
  | 'generated'    // Just created by engine
  | 'presented'    // Shown to user
  | 'accepted'     // User accepted
  | 'rejected'     // User rejected
  | 'snoozed'      // User snoozed for later
  | 'modified'     // User modified the recommendation
  | 'completed'    // User marked as completed
  | 'expired';     // Recommendation expired

export type RecommendationPriority =
  | 'critical'      // Health risk, immediate attention required
  | 'important'     // Significant impact on health/performance
  | 'optimization'; // Nice to have, incremental improvement

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

export type SourceEngine =
  | 'recovery'
  | 'stress'
  | 'joint_health'
  | 'adherence'
  | 'workout'
  | 'supplement'
  | 'nutrition'
  | 'cardiovascular'
  | 'metabolic'
  | 'sexual_health'
  | 'holistic'
  | 'prediction';

export type ActionType =
  | 'add'
  | 'remove'
  | 'modify'
  | 'increase'
  | 'decrease'
  | 'start'
  | 'stop'
  | 'consult'
  | 'monitor'
  | 'test';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ConflictType =
  | 'contradictory'      // Directly contradicts
  | 'mutually_exclusive' // Can't do both
  | 'resource_conflict'  // Limited resources
  | 'timing_conflict'    // Same time slot
  | 'dependency'         // One depends on the other
  | 'redundant';         // Essentially the same

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ResolutionStrategy =
  | 'keep_higher_priority'
  | 'keep_both'
  | 'merge'
  | 'user_choice'
  | 'automatic';

// ============================================================================
// RECOMMENDATION REQUEST (Engine → RecommendationEngine)
// ============================================================================

/**
 * Supporting metric for display in UI
 */
export interface SupportingMetric {
  name: string;
  value: string;
  status: 'low' | 'normal' | 'high' | 'optimal' | 'suboptimal' | 'concerning';
  change?: string; // e.g., "-40%", "+15%"
  target?: string; // e.g., "7-9h", "50-100ms"
  unit?: string; // e.g., "ms", "hours", "mg/dL"
}

/**
 * Request from an engine to create a recommendation
 * Engines emit these, RecommendationEngine processes them
 */
export interface RecommendationRequest {
  // Source
  sourceEngine: SourceEngine;
  sourceRecordId?: string;
  
  // Content
  title: string;
  description: string;
  rationale?: string;
  
  // Priority
  priority: RecommendationPriority;
  urgencyScore?: number; // 0-100
  
  // Category
  category: RecommendationCategory;
  
  // Action
  actionType?: ActionType;
  actionTarget?: string;
  actionDetails?: Record<string, any>;
  
  // Confidence
  confidenceLevel: ConfidenceLevel;
  dataQualityScore?: number; // 0-100
  
  // Expiration
  expiresAt?: Date;
  expirationReason?: string;
  
  // AI-Enriched Fields (optional, added by AI enrichment layer)
  reasonCodes?: string[]; // Structured reason codes for filtering/grouping
  recommendationGroup?: string; // Group/category for organization (e.g., 'recovery_optimization')
  supportingMetrics?: SupportingMetric[]; // Metrics to display in UI
  isInsightOnly?: boolean; // True if this is informational only, not actionable
  requiresUserDecision?: boolean; // True if user must explicitly accept/reject
}

// ============================================================================
// RECOMMENDATION (Database Model)
// ============================================================================

export interface Recommendation {
  id: string;
  userId: string;
  
  // Source
  sourceEngine: SourceEngine;
  sourceRecordId?: string;
  
  // Content
  title: string;
  description: string;
  rationale?: string;
  
  // Priority
  priority: RecommendationPriority;
  urgencyScore?: number;
  
  // Category
  category: RecommendationCategory;
  
  // Lifecycle
  state: RecommendationState;
  generatedAt: string;
  presentedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  snoozedAt?: string;
  snoozedUntil?: string;
  modifiedAt?: string;
  completedAt?: string;
  expiredAt?: string;
  
  // Action
  actionType?: ActionType;
  actionTarget?: string;
  actionDetails?: Record<string, any>;
  
  // Confidence
  confidenceLevel: ConfidenceLevel;
  dataQualityScore?: number;
  
  // Conflicts
  conflictsWith?: string[];
  conflictReason?: string;
  conflictResolved: boolean;
  
  // User interaction
  userNotes?: string;
  userModifiedDetails?: Record<string, any>;
  rejectionReason?: string;
  snoozeReason?: string;
  
  // Expiration
  expiresAt?: string;
  expirationReason?: string;
  
  // AI-Enriched Fields (optional, added by AI enrichment layer)
  reasonCodes?: string[]; // Structured reason codes for filtering/grouping
  recommendationGroup?: string; // Group/category for organization
  supportingMetrics?: SupportingMetric[]; // Metrics to display in UI
  isInsightOnly?: boolean; // True if this is informational only
  requiresUserDecision?: boolean; // True if user must explicitly accept/reject
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// RECOMMENDATION HISTORY
// ============================================================================

export interface RecommendationHistory {
  id: string;
  recommendationId: string;
  
  // Transition
  fromState: RecommendationState;
  toState: RecommendationState;
  transitionReason?: string;
  userAction: boolean;
  
  // Metadata
  transitionedAt: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// RECOMMENDATION CONFLICT
// ============================================================================

export interface RecommendationConflict {
  id: string;
  recommendationAId: string;
  recommendationBId: string;
  
  // Conflict details
  conflictType: ConflictType;
  conflictSeverity: ConflictSeverity;
  conflictDescription: string;
  
  // Resolution
  resolved: boolean;
  resolutionStrategy?: ResolutionStrategy;
  resolvedAt?: string;
  resolvedBy?: 'system' | 'user';
  
  // Metadata
  detectedAt: string;
}

// ============================================================================
// SERVICE INPUTS
// ============================================================================

/**
 * Input for creating a recommendation from a request
 */
export interface CreateRecommendationInput {
  userId: string;
  request: RecommendationRequest;
}

/**
 * Input for updating recommendation state
 */
export interface UpdateRecommendationStateInput {
  recommendationId: string;
  newState: RecommendationState;
  reason?: string;
  userNotes?: string;
  snoozedUntil?: Date;
}

/**
 * Input for accepting a recommendation
 */
export interface AcceptRecommendationInput {
  recommendationId: string;
  userNotes?: string;
}

/**
 * Input for rejecting a recommendation
 */
export interface RejectRecommendationInput {
  recommendationId: string;
  rejectionReason?: string;
}

/**
 * Input for snoozing a recommendation
 */
export interface SnoozeRecommendationInput {
  recommendationId: string;
  snoozedUntil: Date;
  snoozeReason?: string;
}

/**
 * Input for completing a recommendation
 */
export interface CompleteRecommendationInput {
  recommendationId: string;
  userNotes?: string;
}

/**
 * Input for modifying a recommendation
 */
export interface ModifyRecommendationInput {
  recommendationId: string;
  modifiedDetails: Record<string, any>;
  userNotes?: string;
}

// ============================================================================
// SERVICE OUTPUTS
// ============================================================================

/**
 * Result of creating a recommendation
 */
export interface CreateRecommendationResult {
  recommendation: Recommendation;
  conflicts: RecommendationConflict[];
}

/**
 * Result of getting active recommendations
 */
export interface GetActiveRecommendationsResult {
  recommendations: Recommendation[];
  conflicts: RecommendationConflict[];
  totalCount: number;
}

/**
 * Prioritized recommendation list
 */
export interface PrioritizedRecommendations {
  critical: Recommendation[];
  important: Recommendation[];
  optimization: Recommendation[];
  conflicts: RecommendationConflict[];
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Conflict detection rule
 */
export interface ConflictDetectionRule {
  name: string;
  description: string;
  detect: (recA: Recommendation, recB: Recommendation) => boolean;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  generateDescription: (recA: Recommendation, recB: Recommendation) => string;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  conflict: RecommendationConflict;
  strategy: ResolutionStrategy;
  keptRecommendations: string[];
  removedRecommendations: string[];
  mergedRecommendation?: Recommendation;
}

// ============================================================================
// PRIORITIZATION
// ============================================================================

/**
 * Prioritization criteria
 */
export interface PrioritizationCriteria {
  priority: RecommendationPriority;
  urgencyScore: number;
  dataQualityScore: number;
  confidenceLevel: ConfidenceLevel;
  generatedAt: Date;
}

/**
 * Prioritization result
 */
export interface PrioritizationResult {
  recommendationId: string;
  finalScore: number;
  priorityWeight: number;
  urgencyWeight: number;
  confidenceWeight: number;
  recencyWeight: number;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch create recommendations from multiple engines
 */
export interface BatchCreateRecommendationsInput {
  userId: string;
  requests: RecommendationRequest[];
}

/**
 * Batch create result
 */
export interface BatchCreateRecommendationsResult {
  created: Recommendation[];
  conflicts: RecommendationConflict[];
  errors: Array<{
    request: RecommendationRequest;
    error: string;
  }>;
}

// ============================================================================
// FILTERS AND QUERIES
// ============================================================================

/**
 * Filter for querying recommendations
 */
export interface RecommendationFilter {
  userId: string;
  states?: RecommendationState[];
  priorities?: RecommendationPriority[];
  categories?: RecommendationCategory[];
  sourceEngines?: SourceEngine[];
  includeExpired?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Sort options
 */
export interface RecommendationSortOptions {
  sortBy: 'priority' | 'urgency' | 'generated_at' | 'expires_at';
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Recommendation analytics
 */
export interface RecommendationAnalytics {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Counts by state
  countsByState: Record<RecommendationState, number>;
  
  // Counts by priority
  countsByPriority: Record<RecommendationPriority, number>;
  
  // Counts by category
  countsByCategory: Record<RecommendationCategory, number>;
  
  // Counts by source
  countsBySource: Record<SourceEngine, number>;
  
  // Acceptance rate
  acceptanceRate: number; // % of presented recommendations accepted
  
  // Completion rate
  completionRate: number; // % of accepted recommendations completed
  
  // Average time to action
  avgTimeToAccept?: number; // milliseconds
  avgTimeToComplete?: number; // milliseconds
  
  // Conflict stats
  totalConflicts: number;
  resolvedConflicts: number;
  unresolvedConflicts: number;
}

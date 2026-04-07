/**
 * RecommendationEngine Service
 * 
 * Central owner of all health recommendations.
 * 
 * Responsibilities:
 * - Collect recommendation requests from engines
 * - Prioritize recommendations
 * - Manage lifecycle states
 * - Detect conflicts
 * - Persist recommendations
 * 
 * Architecture:
 * - Engines do NOT own recommendation lifecycle
 * - RecommendationEngine is the central owner
 * - Consumes DailyHealthSnapshot and engine outputs
 * - Handles missing data and confidence levels safely
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import type {
  Recommendation,
  RecommendationRequest,
  RecommendationConflict,
  RecommendationHistory,
  CreateRecommendationInput,
  CreateRecommendationResult,
  UpdateRecommendationStateInput,
  AcceptRecommendationInput,
  RejectRecommendationInput,
  SnoozeRecommendationInput,
  CompleteRecommendationInput,
  ModifyRecommendationInput,
  GetActiveRecommendationsResult,
  PrioritizedRecommendations,
  BatchCreateRecommendationsInput,
  BatchCreateRecommendationsResult,
  RecommendationFilter,
  RecommendationSortOptions,
  ConflictDetectionRule,
  ConflictResolutionResult,
  PrioritizationCriteria,
  PrioritizationResult,
  RecommendationState,
  RecommendationPriority,
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy,
} from '../types/recommendationEngine';

// ============================================================================
// CONFLICT DETECTION RULES
// ============================================================================

/**
 * Predefined conflict detection rules
 */
const CONFLICT_DETECTION_RULES: ConflictDetectionRule[] = [
  // Rule 1: Contradictory actions on same target
  {
    name: 'contradictory_actions',
    description: 'Detects recommendations with contradictory actions on the same target',
    detect: (recA, recB) => {
      if (!recA.actionTarget || !recB.actionTarget) return false;
      if (recA.actionTarget !== recB.actionTarget) return false;
      
      const contradictoryPairs = [
        ['add', 'remove'],
        ['increase', 'decrease'],
        ['start', 'stop'],
      ];
      
      return contradictoryPairs.some(([action1, action2]) =>
        (recA.actionType === action1 && recB.actionType === action2) ||
        (recA.actionType === action2 && recB.actionType === action1)
      );
    },
    conflictType: 'contradictory',
    severity: 'high',
    generateDescription: (recA, recB) =>
      `Contradictory recommendations: "${recA.title}" (${recA.actionType}) vs "${recB.title}" (${recB.actionType}) on ${recA.actionTarget}`,
  },
  
  // Rule 2: Rest vs intense workout
  {
    name: 'rest_vs_workout',
    description: 'Detects conflict between rest recommendations and intense workout recommendations',
    detect: (recA, recB) => {
      const isRest = (rec: Recommendation) =>
        rec.category === 'workout_modification' &&
        (rec.title.toLowerCase().includes('rest') || rec.description.toLowerCase().includes('rest day'));
      
      const isIntenseWorkout = (rec: Recommendation) =>
        rec.category === 'workout_modification' &&
        (rec.description.toLowerCase().includes('heavy') || rec.description.toLowerCase().includes('intense'));
      
      return (isRest(recA) && isIntenseWorkout(recB)) || (isRest(recB) && isIntenseWorkout(recA));
    },
    conflictType: 'mutually_exclusive',
    severity: 'critical',
    generateDescription: (recA, recB) =>
      `Cannot both rest and perform intense workout: "${recA.title}" vs "${recB.title}"`,
  },
  
  // Rule 3: Supplement interactions
  {
    name: 'supplement_interactions',
    description: 'Detects potential supplement interactions',
    detect: (recA, recB) => {
      if (recA.category !== 'supplement_adjustment' || recB.category !== 'supplement_adjustment') return false;
      if (recA.actionType !== 'add' || recB.actionType !== 'add') return false;
      
      // Known interactions (simplified - should be expanded)
      const interactions: Record<string, string[]> = {
        'Iron': ['Calcium', 'Zinc'],
        'Calcium': ['Iron', 'Magnesium'],
        'Zinc': ['Iron', 'Copper'],
      };
      
      const targetA = recA.actionTarget || '';
      const targetB = recB.actionTarget || '';
      
      return interactions[targetA]?.includes(targetB) || interactions[targetB]?.includes(targetA);
    },
    conflictType: 'contradictory',
    severity: 'medium',
    generateDescription: (recA, recB) =>
      `Potential supplement interaction between ${recA.actionTarget} and ${recB.actionTarget}`,
  },
  
  // Rule 4: Redundant recommendations
  {
    name: 'redundant_recommendations',
    description: 'Detects essentially identical recommendations',
    detect: (recA, recB) => {
      if (recA.category !== recB.category) return false;
      if (recA.actionType !== recB.actionType) return false;
      if (recA.actionTarget !== recB.actionTarget) return false;
      
      // Same category, action, and target = redundant
      return true;
    },
    conflictType: 'redundant',
    severity: 'low',
    generateDescription: (recA, recB) =>
      `Redundant recommendations: "${recA.title}" and "${recB.title}" are essentially the same`,
  },
  
  // Rule 5: Medical consultation priority
  {
    name: 'medical_consultation_priority',
    description: 'Medical consultation should take priority over other recommendations',
    detect: (recA, recB) => {
      const isMedical = (rec: Recommendation) => rec.category === 'medical_consultation';
      const isOther = (rec: Recommendation) => rec.category !== 'medical_consultation';
      
      return (isMedical(recA) && isOther(recB)) || (isMedical(recB) && isOther(recA));
    },
    conflictType: 'dependency',
    severity: 'high',
    generateDescription: (recA, recB) => {
      const medical = recA.category === 'medical_consultation' ? recA : recB;
      const other = recA.category === 'medical_consultation' ? recB : recA;
      return `Medical consultation "${medical.title}" should be addressed before "${other.title}"`;
    },
  },
];

// ============================================================================
// PRIORITIZATION LOGIC
// ============================================================================

/**
 * Calculate final priority score for a recommendation
 * Higher score = higher priority
 */
function calculatePriorityScore(recommendation: Recommendation): PrioritizationResult {
  // Priority weights (0-100)
  const priorityWeights: Record<RecommendationPriority, number> = {
    critical: 100,
    important: 70,
    optimization: 40,
  };
  
  // Confidence weights (0-1 multiplier)
  const confidenceWeights = {
    high: 1.0,
    medium: 0.8,
    low: 0.6,
  };
  
  // Calculate components
  const priorityWeight = priorityWeights[recommendation.priority];
  const urgencyWeight = recommendation.urgencyScore || 50;
  const confidenceWeight = confidenceWeights[recommendation.confidenceLevel];
  const dataQualityWeight = (recommendation.dataQualityScore || 50) / 100;
  
  // Recency bonus (newer recommendations get slight boost)
  const ageInHours = (Date.now() - new Date(recommendation.generatedAt).getTime()) / (1000 * 60 * 60);
  const recencyWeight = Math.max(0, 100 - ageInHours); // Decays over time
  
  // Final score calculation
  const finalScore = (
    (priorityWeight * 0.4) +
    (urgencyWeight * 0.3) +
    (recencyWeight * 0.1)
  ) * confidenceWeight * dataQualityWeight;
  
  return {
    recommendationId: recommendation.id,
    finalScore,
    priorityWeight,
    urgencyWeight,
    confidenceWeight,
    recencyWeight,
  };
}

/**
 * Sort recommendations by priority
 */
function sortByPriority(recommendations: Recommendation[]): Recommendation[] {
  const scored = recommendations.map(rec => ({
    recommendation: rec,
    score: calculatePriorityScore(rec),
  }));
  
  scored.sort((a, b) => b.score.finalScore - a.score.finalScore);
  
  return scored.map(s => s.recommendation);
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between two recommendations
 */
function detectConflicts(recA: Recommendation, recB: Recommendation): RecommendationConflict | null {
  for (const rule of CONFLICT_DETECTION_RULES) {
    if (rule.detect(recA, recB)) {
      return {
        id: uuidv4(),
        recommendationAId: recA.id,
        recommendationBId: recB.id,
        conflictType: rule.conflictType,
        conflictSeverity: rule.severity,
        conflictDescription: rule.generateDescription(recA, recB),
        resolved: false,
        detectedAt: new Date().toISOString(),
      };
    }
  }
  
  return null;
}

/**
 * Detect all conflicts for a new recommendation against existing ones
 */
async function detectAllConflicts(
  newRecommendation: Recommendation,
  existingRecommendations: Recommendation[]
): Promise<RecommendationConflict[]> {
  const conflicts: RecommendationConflict[] = [];
  
  for (const existing of existingRecommendations) {
    const conflict = detectConflicts(newRecommendation, existing);
    if (conflict) {
      conflicts.push(conflict);
    }
  }
  
  return conflicts;
}

/**
 * Resolve a conflict automatically if possible
 */
function resolveConflictAutomatically(conflict: RecommendationConflict): ResolutionStrategy | null {
  switch (conflict.conflictType) {
    case 'redundant':
      return 'keep_higher_priority';
    
    case 'dependency':
      return 'keep_higher_priority'; // Medical consultation takes priority
    
    case 'contradictory':
      if (conflict.conflictSeverity === 'critical') {
        return 'user_choice'; // Let user decide on critical conflicts
      }
      return 'keep_higher_priority';
    
    case 'mutually_exclusive':
      return 'user_choice'; // Always let user choose
    
    default:
      return null;
  }
}

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Check if a similar active recommendation already exists (deduplication)
 */
function isDuplicateRecommendation(
  newRec: RecommendationRequest,
  existing: Recommendation
): boolean {
  // Same source engine and category
  if (newRec.sourceEngine !== existing.sourceEngine) return false;
  if (newRec.category !== existing.category) return false;
  
  // If both have action targets, they must match
  if (newRec.actionTarget && existing.actionTarget) {
    if (newRec.actionTarget !== existing.actionTarget) return false;
    if (newRec.actionType !== existing.actionType) return false;
  }
  
  // Same title (case-insensitive)
  if (newRec.title.toLowerCase() === existing.title.toLowerCase()) {
    return true;
  }
  
  return false;
}

/**
 * Supersede an existing recommendation with a newer one
 */
async function supersedeRecommendation(
  recommendationId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('recommendations')
    .update({
      state: 'expired',
      expired_at: new Date().toISOString(),
      expiration_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId);
  
  if (error) {
    logger.error('Failed to supersede recommendation', { error, recommendationId });
  } else {
    logger.info('Recommendation superseded', { recommendationId, reason });
  }
}

/**
 * Create a recommendation from an engine request
 */
export async function createRecommendation(
  input: CreateRecommendationInput
): Promise<CreateRecommendationResult> {
  try {
    logger.info('Creating recommendation', { userId: input.userId, sourceEngine: input.request.sourceEngine });
    
    // Get existing active recommendations for deduplication and conflict detection
    const { data: existingRecs, error: fetchError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', input.userId)
      .in('state', ['generated', 'presented', 'accepted', 'snoozed'])
      .is('expired_at', null);
    
    if (fetchError) {
      logger.error('Failed to fetch existing recommendations', { error: fetchError });
    }
    
    const existing: Recommendation[] = existingRecs?.map(mapDatabaseToRecommendation) || [];
    
    // DEDUPLICATION: Check if similar recommendation already exists
    const duplicate = existing.find(rec => isDuplicateRecommendation(input.request, rec));
    
    if (duplicate) {
      logger.info('Duplicate recommendation detected, returning existing', {
        existingId: duplicate.id,
        newTitle: input.request.title,
      });
      
      // Return existing recommendation (idempotent)
      return {
        recommendation: duplicate,
        conflicts: [], // Already resolved conflicts
      };
    }
    
    // Check if this should supersede an existing recommendation
    const toSupersede = existing.find(rec => 
      rec.sourceEngine === input.request.sourceEngine &&
      rec.category === input.request.category &&
      rec.actionTarget === input.request.actionTarget &&
      rec.actionTarget !== undefined
    );
    
    if (toSupersede) {
      await supersedeRecommendation(
        toSupersede.id,
        `Superseded by newer recommendation: "${input.request.title}"`
      );
      logger.info('Superseded existing recommendation', {
        supersededId: toSupersede.id,
        newTitle: input.request.title,
      });
    }
    
    // Create recommendation object
    const recommendation: Recommendation = {
      id: uuidv4(),
      userId: input.userId,
      sourceEngine: input.request.sourceEngine,
      sourceRecordId: input.request.sourceRecordId,
      title: input.request.title,
      description: input.request.description,
      rationale: input.request.rationale,
      priority: input.request.priority,
      urgencyScore: input.request.urgencyScore,
      category: input.request.category,
      state: 'generated',
      generatedAt: new Date().toISOString(),
      actionType: input.request.actionType,
      actionTarget: input.request.actionTarget,
      actionDetails: input.request.actionDetails,
      confidenceLevel: input.request.confidenceLevel,
      dataQualityScore: input.request.dataQualityScore,
      conflictResolved: false,
      expiresAt: input.request.expiresAt?.toISOString(),
      expirationReason: input.request.expirationReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Detect conflicts
    const conflicts = await detectAllConflicts(recommendation, existing);
    
    // Update conflicts_with array
    if (conflicts.length > 0) {
      recommendation.conflictsWith = conflicts.map(c =>
        c.recommendationAId === recommendation.id ? c.recommendationBId : c.recommendationAId
      );
    }
    
    // Store recommendation in database
    const { error: insertError } = await supabase
      .from('recommendations')
      .insert(mapRecommendationToDatabase(recommendation));
    
    if (insertError) {
      logger.error('Failed to store recommendation', { error: insertError });
      throw new Error(`Failed to store recommendation: ${insertError.message}`);
    }
    
    // Store conflicts
    for (const conflict of conflicts) {
      const { error: conflictError } = await supabase
        .from('recommendation_conflicts')
        .insert(mapConflictToDatabase(conflict));
      
      if (conflictError) {
        logger.error('Failed to store conflict', { error: conflictError });
      }
    }
    
    logger.info('Recommendation created', {
      recommendationId: recommendation.id,
      conflicts: conflicts.length,
    });
    
    return {
      recommendation,
      conflicts,
    };
  } catch (error) {
    logger.error('Failed to create recommendation', { error, userId: input.userId });
    throw error;
  }
}

/**
 * Batch create recommendations from multiple engines
 */
export async function batchCreateRecommendations(
  input: BatchCreateRecommendationsInput
): Promise<BatchCreateRecommendationsResult> {
  const created: Recommendation[] = [];
  const allConflicts: RecommendationConflict[] = [];
  const errors: Array<{ request: RecommendationRequest; error: string }> = [];
  
  for (const request of input.requests) {
    try {
      const result = await createRecommendation({
        userId: input.userId,
        request,
      });
      
      created.push(result.recommendation);
      allConflicts.push(...result.conflicts);
    } catch (error: any) {
      errors.push({
        request,
        error: error.message,
      });
    }
  }
  
  return {
    created,
    conflicts: allConflicts,
    errors,
  };
}

/**
 * Get active recommendations for a user
 */
export async function getActiveRecommendations(
  userId: string
): Promise<GetActiveRecommendationsResult> {
  try {
    const { data, error } = await supabase
      .rpc('get_active_recommendations', { p_user_id: userId });
    
    if (error) {
      logger.error('Failed to get active recommendations', { error, userId });
      throw error;
    }
    
    const recommendations = data.map(mapDatabaseToRecommendation);
    
    // Get conflicts
    const { data: conflictsData, error: conflictsError } = await supabase
      .rpc('get_recommendation_conflicts', { p_user_id: userId });
    
    const conflicts = conflictsError ? [] : conflictsData.map(mapDatabaseToConflict);
    
    return {
      recommendations,
      conflicts,
      totalCount: recommendations.length,
    };
  } catch (error) {
    logger.error('Failed to get active recommendations', { error, userId });
    throw error;
  }
}

/**
 * Get prioritized recommendations grouped by priority level
 */
export async function getPrioritizedRecommendations(
  userId: string
): Promise<PrioritizedRecommendations> {
  const { recommendations, conflicts } = await getActiveRecommendations(userId);
  
  // Sort all recommendations
  const sorted = sortByPriority(recommendations);
  
  // Group by priority
  const critical = sorted.filter(r => r.priority === 'critical');
  const important = sorted.filter(r => r.priority === 'important');
  const optimization = sorted.filter(r => r.priority === 'optimization');
  
  return {
    critical,
    important,
    optimization,
    conflicts,
  };
}

/**
 * Update recommendation state
 */
export async function updateRecommendationState(
  input: UpdateRecommendationStateInput
): Promise<Recommendation> {
  try {
    const updates: any = {
      state: input.newState,
      updated_at: new Date().toISOString(),
    };
    
    // Set appropriate timestamp based on new state
    switch (input.newState) {
      case 'presented':
        updates.presented_at = new Date().toISOString();
        break;
      case 'accepted':
        updates.accepted_at = new Date().toISOString();
        break;
      case 'rejected':
        updates.rejected_at = new Date().toISOString();
        if (input.reason) updates.rejection_reason = input.reason;
        break;
      case 'snoozed':
        updates.snoozed_at = new Date().toISOString();
        if (input.snoozedUntil) updates.snoozed_until = input.snoozedUntil.toISOString();
        if (input.reason) updates.snooze_reason = input.reason;
        break;
      case 'completed':
        updates.completed_at = new Date().toISOString();
        break;
      case 'expired':
        updates.expired_at = new Date().toISOString();
        if (input.reason) updates.expiration_reason = input.reason;
        break;
      case 'modified':
        updates.modified_at = new Date().toISOString();
        break;
    }
    
    if (input.userNotes) {
      updates.user_notes = input.userNotes;
    }
    
    const { data, error } = await supabase
      .from('recommendations')
      .update(updates)
      .eq('id', input.recommendationId)
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to update recommendation state', { error, recommendationId: input.recommendationId });
      throw error;
    }
    
    return mapDatabaseToRecommendation(data);
  } catch (error) {
    logger.error('Failed to update recommendation state', { error, recommendationId: input.recommendationId });
    throw error;
  }
}

/**
 * Accept a recommendation
 */
export async function acceptRecommendation(input: AcceptRecommendationInput): Promise<Recommendation> {
  return updateRecommendationState({
    recommendationId: input.recommendationId,
    newState: 'accepted',
    userNotes: input.userNotes,
  });
}

/**
 * Reject a recommendation
 */
export async function rejectRecommendation(input: RejectRecommendationInput): Promise<Recommendation> {
  return updateRecommendationState({
    recommendationId: input.recommendationId,
    newState: 'rejected',
    reason: input.rejectionReason,
  });
}

/**
 * Snooze a recommendation
 */
export async function snoozeRecommendation(input: SnoozeRecommendationInput): Promise<Recommendation> {
  return updateRecommendationState({
    recommendationId: input.recommendationId,
    newState: 'snoozed',
    snoozedUntil: input.snoozedUntil,
    reason: input.snoozeReason,
  });
}

/**
 * Complete a recommendation
 */
export async function completeRecommendation(input: CompleteRecommendationInput): Promise<Recommendation> {
  return updateRecommendationState({
    recommendationId: input.recommendationId,
    newState: 'completed',
    userNotes: input.userNotes,
  });
}

/**
 * Modify a recommendation
 */
export async function modifyRecommendation(input: ModifyRecommendationInput): Promise<Recommendation> {
  const { data, error } = await supabase
    .from('recommendations')
    .update({
      state: 'modified',
      modified_at: new Date().toISOString(),
      user_modified_details: input.modifiedDetails,
      user_notes: input.userNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.recommendationId)
    .select()
    .single();
  
  if (error) {
    logger.error('Failed to modify recommendation', { error, recommendationId: input.recommendationId });
    throw error;
  }
  
  return mapDatabaseToRecommendation(data);
}

// ============================================================================
// DATABASE MAPPING HELPERS
// ============================================================================

function mapRecommendationToDatabase(rec: Recommendation): any {
  return {
    id: rec.id,
    user_id: rec.userId,
    source_engine: rec.sourceEngine,
    source_record_id: rec.sourceRecordId,
    title: rec.title,
    description: rec.description,
    rationale: rec.rationale,
    priority: rec.priority,
    urgency_score: rec.urgencyScore,
    category: rec.category,
    state: rec.state,
    generated_at: rec.generatedAt,
    presented_at: rec.presentedAt,
    accepted_at: rec.acceptedAt,
    rejected_at: rec.rejectedAt,
    snoozed_at: rec.snoozedAt,
    snoozed_until: rec.snoozedUntil,
    modified_at: rec.modifiedAt,
    completed_at: rec.completedAt,
    expired_at: rec.expiredAt,
    action_type: rec.actionType,
    action_target: rec.actionTarget,
    action_details: rec.actionDetails,
    confidence_level: rec.confidenceLevel,
    data_quality_score: rec.dataQualityScore,
    conflicts_with: rec.conflictsWith,
    conflict_reason: rec.conflictReason,
    conflict_resolved: rec.conflictResolved,
    user_notes: rec.userNotes,
    user_modified_details: rec.userModifiedDetails,
    rejection_reason: rec.rejectionReason,
    snooze_reason: rec.snoozeReason,
    expires_at: rec.expiresAt,
    expiration_reason: rec.expirationReason,
    // AI-enriched fields
    reason_codes: rec.reasonCodes,
    recommendation_group: rec.recommendationGroup,
    supporting_metrics: rec.supportingMetrics,
    is_insight_only: rec.isInsightOnly,
    requires_user_decision: rec.requiresUserDecision,
    created_at: rec.createdAt,
    updated_at: rec.updatedAt,
  };
}

function mapDatabaseToRecommendation(data: any): Recommendation {
  return {
    id: data.id,
    userId: data.user_id,
    sourceEngine: data.source_engine,
    sourceRecordId: data.source_record_id,
    title: data.title,
    description: data.description,
    rationale: data.rationale,
    priority: data.priority,
    urgencyScore: data.urgency_score,
    category: data.category,
    state: data.state,
    generatedAt: data.generated_at,
    presentedAt: data.presented_at,
    acceptedAt: data.accepted_at,
    rejectedAt: data.rejected_at,
    snoozedAt: data.snoozed_at,
    snoozedUntil: data.snoozed_until,
    modifiedAt: data.modified_at,
    completedAt: data.completed_at,
    expiredAt: data.expired_at,
    actionType: data.action_type,
    actionTarget: data.action_target,
    actionDetails: data.action_details,
    confidenceLevel: data.confidence_level,
    dataQualityScore: data.data_quality_score,
    conflictsWith: data.conflicts_with,
    conflictReason: data.conflict_reason,
    conflictResolved: data.conflict_resolved,
    userNotes: data.user_notes,
    userModifiedDetails: data.user_modified_details,
    rejectionReason: data.rejection_reason,
    snoozeReason: data.snooze_reason,
    expiresAt: data.expires_at,
    expirationReason: data.expiration_reason,
    // AI-enriched fields
    reasonCodes: data.reason_codes,
    recommendationGroup: data.recommendation_group,
    supportingMetrics: data.supporting_metrics,
    isInsightOnly: data.is_insight_only,
    requiresUserDecision: data.requires_user_decision,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapConflictToDatabase(conflict: RecommendationConflict): any {
  return {
    id: conflict.id,
    recommendation_a_id: conflict.recommendationAId,
    recommendation_b_id: conflict.recommendationBId,
    conflict_type: conflict.conflictType,
    conflict_severity: conflict.conflictSeverity,
    conflict_description: conflict.conflictDescription,
    resolved: conflict.resolved,
    resolution_strategy: conflict.resolutionStrategy,
    resolved_at: conflict.resolvedAt,
    resolved_by: conflict.resolvedBy,
    detected_at: conflict.detectedAt,
  };
}

function mapDatabaseToConflict(data: any): RecommendationConflict {
  return {
    id: data.id || data.conflict_id,
    recommendationAId: data.recommendation_a_id,
    recommendationBId: data.recommendation_b_id,
    conflictType: data.conflict_type,
    conflictSeverity: data.conflict_severity,
    conflictDescription: data.conflict_description,
    resolved: data.resolved,
    resolutionStrategy: data.resolution_strategy,
    resolvedAt: data.resolved_at,
    resolvedBy: data.resolved_by,
    detectedAt: data.detected_at,
  };
}

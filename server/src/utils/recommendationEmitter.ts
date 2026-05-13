/**
 * Standardized Recommendation Emission Helper
 * 
 * Provides a consistent interface for all engines to emit recommendation requests.
 * Ensures confidence levels and data quality are properly tracked.
 */

import { logger } from './logger';
import { createRecommendation } from '../services/recommendationEngineService';
import type {
  RecommendationRequest,
  RecommendationPriority,
  RecommendationCategory,
  ActionType,
  ConfidenceLevel,
  SourceEngine,
  CreateRecommendationResult,
} from '../types/recommendationEngine';

// ============================================================================
// EMISSION HELPER
// ============================================================================

/**
 * Standardized interface for emitting recommendations from engines
 */
export interface EmitRecommendationInput {
  // User context
  userId: string;
  
  // Source tracking
  sourceEngine: SourceEngine;
  sourceRecordId?: string;
  
  // Recommendation content
  title: string;
  description: string;
  rationale?: string;
  
  // Priority and urgency
  priority: RecommendationPriority;
  urgencyScore?: number; // 0-100, defaults to 50
  
  // Category and action
  category: RecommendationCategory;
  actionType?: ActionType;
  actionTarget?: string;
  actionDetails?: Record<string, any>;
  
  // Confidence and data quality (REQUIRED)
  confidenceLevel: ConfidenceLevel;
  dataQualityScore: number; // 0-100, based on available data
  
  // Expiration (optional)
  expiresInHours?: number; // Auto-calculate expiresAt
  expirationReason?: string;
}

/**
 * Emit a recommendation request from an engine
 * 
 * This is the ONLY way engines should create recommendations.
 * Ensures consistency and proper tracking of confidence/data quality.
 */
export async function emitRecommendation(
  input: EmitRecommendationInput
): Promise<CreateRecommendationResult | null> {
  try {
    // Validate required fields
    if (!input.userId || !input.sourceEngine || !input.title || !input.description) {
      logger.error('Missing required fields for recommendation emission', {
        userId: input.userId,
        sourceEngine: input.sourceEngine,
        title: input.title,
      });
      return null;
    }
    
    // Validate confidence level
    if (!input.confidenceLevel) {
      logger.error('Confidence level is required for recommendation emission', {
        sourceEngine: input.sourceEngine,
        title: input.title,
      });
      return null;
    }
    
    // Validate data quality score
    if (input.dataQualityScore === undefined || input.dataQualityScore < 0 || input.dataQualityScore > 100) {
      logger.error('Data quality score must be between 0-100', {
        sourceEngine: input.sourceEngine,
        dataQualityScore: input.dataQualityScore,
      });
      return null;
    }
    
    // Calculate expiration if specified
    let expiresAt: Date | undefined;
    if (input.expiresInHours) {
      expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
    }
    
    // Build recommendation request
    const request: RecommendationRequest = {
      sourceEngine: input.sourceEngine,
      sourceRecordId: input.sourceRecordId,
      title: input.title,
      description: input.description,
      rationale: input.rationale,
      priority: input.priority,
      urgencyScore: input.urgencyScore ?? 50, // Default to medium urgency
      category: input.category,
      actionType: input.actionType,
      actionTarget: input.actionTarget,
      actionDetails: input.actionDetails,
      confidenceLevel: input.confidenceLevel,
      dataQualityScore: input.dataQualityScore,
      expiresAt,
      expirationReason: input.expirationReason,
    };
    
    // Log emission
    logger.info('Emitting recommendation', {
      userId: input.userId,
      sourceEngine: input.sourceEngine,
      title: input.title,
      priority: input.priority,
      confidenceLevel: input.confidenceLevel,
      dataQualityScore: input.dataQualityScore,
    });
    
    // Create recommendation via RecommendationEngine
    const result = await createRecommendation({
      userId: input.userId,
      request,
    });
    
    return result;
  } catch (error: any) {
    logger.error('Failed to emit recommendation', {
      error: error.message,
      userId: input.userId,
      sourceEngine: input.sourceEngine,
      title: input.title,
    });
    return null;
  }
}

// ============================================================================
// BATCH EMISSION HELPER
// ============================================================================

/**
 * Emit multiple recommendations at once
 * Useful when an engine generates multiple recommendations
 */
export async function emitRecommendations(
  inputs: EmitRecommendationInput[]
): Promise<CreateRecommendationResult[]> {
  const results: CreateRecommendationResult[] = [];
  
  for (const input of inputs) {
    const result = await emitRecommendation(input);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

// ============================================================================
// CONFIDENCE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate confidence level based on data availability
 */
export function calculateConfidenceLevel(
  requiredDataPoints: number,
  availableDataPoints: number
): ConfidenceLevel {
  const availability = availableDataPoints / requiredDataPoints;
  
  if (availability >= 0.8) return 'high';
  if (availability >= 0.5) return 'medium';
  return 'low';
}

/**
 * Calculate data quality score based on multiple factors
 */
export function calculateDataQualityScore(factors: {
  dataAvailability: number; // 0-1
  dataRecency: number; // 0-1 (1 = very recent, 0 = very old)
  dataAccuracy: number; // 0-1 (1 = highly accurate, 0 = estimated)
}): number {
  const { dataAvailability, dataRecency, dataAccuracy } = factors;
  
  // Weighted average
  const score = (
    dataAvailability * 0.5 +  // 50% weight on availability
    dataRecency * 0.3 +        // 30% weight on recency
    dataAccuracy * 0.2         // 20% weight on accuracy
  ) * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================================================
// URGENCY CALCULATION HELPER
// ============================================================================

/**
 * Calculate urgency score based on severity and time sensitivity
 */
export function calculateUrgencyScore(
  severity: number, // 0-100 (how severe the issue is)
  timeSensitivity: number // 0-100 (how time-sensitive the action is)
): number {
  // Weighted average favoring severity
  const urgency = severity * 0.7 + timeSensitivity * 0.3;
  return Math.round(Math.max(0, Math.min(100, urgency)));
}

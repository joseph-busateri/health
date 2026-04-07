import { logger } from '../utils/logger';
import { getHealthIntelligenceFusionContext, type FusionSignal } from './healthIntelligenceFusionService';
import type { PrioritizedRecommendation } from '../types/recommendationPrioritization';

/**
 * Fusion Prioritization Enhancer
 * 
 * Purpose: Enhance recommendation prioritization using cross-engine fusion intelligence
 * - Adjusts recommendation scores based on fusion signals
 * - Adds fusion-derived rationale to recommendations
 * - Elevates priorities when fusion detects compounding risks
 * - Does NOT replace existing prioritization - only enhances it
 * 
 * This is an additive enhancement layer, not a rewrite.
 */

// ============================================================================
// FUSION INFLUENCE TYPES
// ============================================================================

export interface FusionInfluence {
  scoreAdjustment: number; // -10 to +10
  reason: string;
  fusionSignalIds: string[];
  confidence: number; // 0-1
}

export interface EnhancedRecommendation extends PrioritizedRecommendation {
  fusionInfluence?: FusionInfluence;
  fusionEvidence?: string[];
  priorityReason?: string;
}

// ============================================================================
// FUSION SIGNAL PRIORITIZATION MAPPING
// ============================================================================

/**
 * Calculate fusion influence weight based on signal properties
 */
function calculateFusionWeight(signal: FusionSignal): number {
  let weight = 0;

  // Severity weight
  switch (signal.severity) {
    case 'critical':
      weight += 10;
      break;
    case 'high':
      weight += 7;
      break;
    case 'moderate':
      weight += 4;
      break;
    case 'low':
      weight += 2;
      break;
  }

  // Type weight
  switch (signal.type) {
    case 'risk':
      weight += 3; // Risks are high priority
      break;
    case 'priority':
      weight += 2; // Explicit priorities
      break;
    case 'optimization':
      weight += 1; // Optimizations are lower priority than risks
      break;
    case 'insight':
      weight += 0; // Insights don't boost priority
      break;
  }

  // Data source count weight (more sources = higher confidence)
  weight += Math.min(signal.dataSources.length - 1, 3);

  // Confidence weight
  weight *= signal.confidence;

  return weight;
}

/**
 * Determine if a fusion signal is relevant to a recommendation
 */
function isFusionSignalRelevant(signal: FusionSignal, recommendation: PrioritizedRecommendation): boolean {
  const recSource = recommendation.sourceEngine.toLowerCase();
  const recSummary = recommendation.summary.toLowerCase();
  const recRationale = recommendation.rationale?.toLowerCase() || '';
  
  const signalCategory = signal.category.toLowerCase();
  const signalTitle = signal.title.toLowerCase();
  const signalDescription = signal.description.toLowerCase();

  // Category-based relevance
  const categoryMap: Record<string, string[]> = {
    metabolic: ['metabolic', 'nutrition', 'supplement'],
    cardiovascular: ['cardiovascular', 'cardio', 'supplement'],
    hormonal: ['sexual_health', 'supplement', 'recovery'],
    nutritional: ['nutrition', 'supplement'],
    supplementation: ['supplement'],
    training: ['workout', 'recovery'],
    recovery: ['recovery', 'stress', 'joint_health'],
    body_composition: ['nutrition', 'workout', 'metabolic'],
  };

  const relevantEngines = categoryMap[signalCategory] || [];
  if (relevantEngines.some(engine => recSource.includes(engine))) {
    return true;
  }

  // Keyword-based relevance
  const keywords = [
    ...signalTitle.split(' '),
    ...signalDescription.split(' ').slice(0, 10), // First 10 words
  ].filter(word => word.length > 4); // Only meaningful words

  const matchCount = keywords.filter(keyword => 
    recSummary.includes(keyword) || recRationale.includes(keyword)
  ).length;

  return matchCount >= 2; // At least 2 keyword matches
}

/**
 * Calculate fusion influence for a recommendation
 */
function calculateFusionInfluence(
  recommendation: PrioritizedRecommendation,
  fusionSignals: FusionSignal[]
): FusionInfluence | undefined {
  const relevantSignals = fusionSignals.filter(signal => 
    isFusionSignalRelevant(signal, recommendation)
  );

  if (relevantSignals.length === 0) {
    return undefined;
  }

  // Calculate total score adjustment
  let totalWeight = 0;
  const reasons: string[] = [];
  const signalIds: string[] = [];

  for (const signal of relevantSignals) {
    const weight = calculateFusionWeight(signal);
    totalWeight += weight;
    signalIds.push(signal.id);

    // Add reason if signal is high priority
    if (signal.severity === 'critical' || signal.severity === 'high') {
      reasons.push(signal.title);
    }
  }

  // Cap score adjustment at +10
  const scoreAdjustment = Math.min(totalWeight, 10);

  // Calculate average confidence
  const avgConfidence = relevantSignals.reduce((sum, s) => sum + s.confidence, 0) / relevantSignals.length;

  return {
    scoreAdjustment,
    reason: reasons.length > 0 
      ? `Elevated due to: ${reasons.slice(0, 2).join(', ')}`
      : 'Elevated by fusion intelligence',
    fusionSignalIds: signalIds,
    confidence: avgConfidence,
  };
}

/**
 * Extract fusion evidence for a recommendation
 */
function extractFusionEvidence(
  recommendation: PrioritizedRecommendation,
  fusionSignals: FusionSignal[]
): string[] {
  const relevantSignals = fusionSignals.filter(signal => 
    isFusionSignalRelevant(signal, recommendation)
  );

  return relevantSignals
    .filter(signal => signal.actionable)
    .slice(0, 3) // Top 3 most relevant
    .map(signal => signal.description);
}

/**
 * Generate priority reason based on fusion signals
 */
function generatePriorityReason(
  recommendation: PrioritizedRecommendation,
  fusionSignals: FusionSignal[]
): string | undefined {
  const relevantSignals = fusionSignals.filter(signal => 
    isFusionSignalRelevant(signal, recommendation) &&
    (signal.severity === 'critical' || signal.severity === 'high')
  );

  if (relevantSignals.length === 0) {
    return undefined;
  }

  const signal = relevantSignals[0]; // Highest priority signal

  // Build cross-source reasoning
  if (signal.dataSources.length > 1) {
    const sources = signal.dataSources.join(' + ');
    return `Priority elevated because ${sources} both indicate ${signal.category} attention needed`;
  }

  return `Priority elevated due to ${signal.severity} ${signal.type}: ${signal.title}`;
}

// ============================================================================
// MAIN ENHANCEMENT FUNCTION
// ============================================================================

/**
 * Enhance recommendations with fusion intelligence
 * This is additive only - does not replace existing prioritization
 */
export async function enhanceRecommendationsWithFusion(
  userId: string,
  recommendations: PrioritizedRecommendation[]
): Promise<EnhancedRecommendation[]> {
  try {
    logger.info('🔵 [FUSION ENHANCER] Starting fusion enhancement', { 
      userId, 
      recommendationCount: recommendations.length 
    });

    // Load fusion context
    const fusionContext = await getHealthIntelligenceFusionContext(userId);

    if (fusionContext.totalSignals === 0) {
      logger.info('⚠️ [FUSION ENHANCER] No fusion signals available - using base recommendations', { userId });
      return recommendations.map(rec => ({ ...rec }));
    }

    logger.info('✅ [FUSION ENHANCER] Fusion context loaded', {
      userId,
      totalSignals: fusionContext.totalSignals,
      riskSignals: fusionContext.riskSignals.length,
      optimizationSignals: fusionContext.optimizationSignals.length,
      prioritySignals: fusionContext.prioritySignals.length,
      dataCompleteness: fusionContext.dataCompleteness.completenessScore,
    });

    // Enhance each recommendation
    const enhanced: EnhancedRecommendation[] = recommendations.map(rec => {
      const fusionInfluence = calculateFusionInfluence(rec, fusionContext.fusionSignals);
      const fusionEvidence = extractFusionEvidence(rec, fusionContext.fusionSignals);
      const priorityReason = generatePriorityReason(rec, fusionContext.fusionSignals);

      // Apply score adjustment if fusion influence exists
      const adjustedScore = fusionInfluence 
        ? rec.score + fusionInfluence.scoreAdjustment
        : rec.score;

      const enhancedRec: EnhancedRecommendation = {
        ...rec,
        score: adjustedScore,
        fusionInfluence,
        fusionEvidence: fusionEvidence.length > 0 ? fusionEvidence : undefined,
        priorityReason,
      };

      if (fusionInfluence) {
        logger.info('📊 [FUSION ENHANCER] Recommendation enhanced', {
          userId,
          source: rec.source,
          originalScore: rec.score,
          adjustedScore,
          scoreAdjustment: fusionInfluence.scoreAdjustment,
          reason: fusionInfluence.reason,
        });
      }

      return enhancedRec;
    });

    // Count how many were enhanced
    const enhancedCount = enhanced.filter(rec => rec.fusionInfluence).length;

    logger.info('✅ [FUSION ENHANCER] Enhancement complete', {
      userId,
      totalRecommendations: enhanced.length,
      enhancedCount,
      dataCompleteness: fusionContext.dataCompleteness.completenessScore,
    });

    return enhanced;
  } catch (error) {
    logger.error('❌ [FUSION ENHANCER] Enhancement failed - using base recommendations', { 
      userId, 
      error: (error as Error).message 
    });
    // Fallback: return original recommendations unchanged
    return recommendations.map(rec => ({ ...rec }));
  }
}

/**
 * Get top fusion-derived priorities (signals that don't map to existing recommendations)
 * These can be surfaced separately in Control Tower or Daily Plan
 */
export async function getTopFusionPriorities(userId: string, limit: number = 3): Promise<FusionSignal[]> {
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(userId);

    if (fusionContext.totalSignals === 0) {
      return [];
    }

    // Get actionable, high-priority fusion signals
    const topSignals = fusionContext.fusionSignals
      .filter(signal => 
        signal.actionable && 
        (signal.severity === 'critical' || signal.severity === 'high')
      )
      .sort((a, b) => {
        // Sort by severity first, then confidence
        const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, limit);

    logger.info('✅ [FUSION ENHANCER] Top fusion priorities extracted', {
      userId,
      count: topSignals.length,
      severities: topSignals.map(s => s.severity),
    });

    return topSignals;
  } catch (error) {
    logger.error('❌ [FUSION ENHANCER] Failed to get fusion priorities', { 
      userId, 
      error: (error as Error).message 
    });
    return [];
  }
}

/**
 * Get fusion summary for daily intelligence
 */
export async function getFusionSummary(userId: string): Promise<string | undefined> {
  try {
    const fusionContext = await getHealthIntelligenceFusionContext(userId);

    if (fusionContext.totalSignals === 0) {
      return undefined;
    }

    const criticalCount = fusionContext.criticalSignals;
    const highCount = fusionContext.highPrioritySignals;
    const riskCount = fusionContext.riskSignals.length;
    const optimizationCount = fusionContext.optimizationSignals.length;

    // Build summary based on what's detected
    if (criticalCount > 0) {
      return `${criticalCount} critical health signal${criticalCount > 1 ? 's' : ''} detected requiring immediate attention`;
    }

    if (highCount > 0 && riskCount > 0) {
      return `${highCount} high-priority signal${highCount > 1 ? 's' : ''} detected, including ${riskCount} risk factor${riskCount > 1 ? 's' : ''}`;
    }

    if (optimizationCount > 0) {
      return `${optimizationCount} optimization opportunit${optimizationCount > 1 ? 'ies' : 'y'} identified across health domains`;
    }

    return `${fusionContext.totalSignals} cross-engine intelligence signal${fusionContext.totalSignals > 1 ? 's' : ''} detected`;
  } catch (error) {
    logger.error('❌ [FUSION ENHANCER] Failed to generate fusion summary', { 
      userId, 
      error: (error as Error).message 
    });
    return undefined;
  }
}

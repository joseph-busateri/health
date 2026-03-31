import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Recommendation Learning Service
 * Automatically adjusts recommendation priorities based on user acceptance patterns
 */

interface CategoryWeights {
  category: string;
  acceptance_rate: number;
  total_generated: number;
  total_accepted: number;
  total_dismissed: number;
  weight_multiplier: number; // 0.5 to 2.0
  last_updated: string;
}

interface PriorityAdjustment {
  original_priority: string;
  adjusted_priority: string;
  reason: string;
  confidence_boost: number;
}

/**
 * Calculate acceptance rates by category for a user
 */
export async function calculateCategoryAcceptanceRates(userId: string): Promise<CategoryWeights[]> {
  try {
    const { data: recommendations, error } = await supabase
      .from('unified_recommendations')
      .select('category, status')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    if (!recommendations || recommendations.length === 0) {
      return [];
    }

    // Group by category
    const categoryStats: Record<string, { total: number; accepted: number; dismissed: number }> = {};

    recommendations.forEach(rec => {
      if (!categoryStats[rec.category]) {
        categoryStats[rec.category] = { total: 0, accepted: 0, dismissed: 0 };
      }
      categoryStats[rec.category].total++;
      if (rec.status === 'accepted') categoryStats[rec.category].accepted++;
      if (rec.status === 'dismissed') categoryStats[rec.category].dismissed++;
    });

    // Calculate weights
    const weights: CategoryWeights[] = Object.entries(categoryStats).map(([category, stats]) => {
      const acceptanceRate = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0;
      
      // Weight multiplier based on acceptance rate
      // 0-20%: 0.5x (reduce priority)
      // 20-40%: 0.75x
      // 40-60%: 1.0x (neutral)
      // 60-80%: 1.25x
      // 80-100%: 1.5x (boost priority)
      let weightMultiplier = 1.0;
      if (acceptanceRate < 20) weightMultiplier = 0.5;
      else if (acceptanceRate < 40) weightMultiplier = 0.75;
      else if (acceptanceRate < 60) weightMultiplier = 1.0;
      else if (acceptanceRate < 80) weightMultiplier = 1.25;
      else weightMultiplier = 1.5;

      return {
        category,
        acceptance_rate: acceptanceRate,
        total_generated: stats.total,
        total_accepted: stats.accepted,
        total_dismissed: stats.dismissed,
        weight_multiplier: weightMultiplier,
        last_updated: new Date().toISOString()
      };
    });

    logger.info('Calculated category acceptance rates', {
      userId,
      categories: weights.length,
      avgAcceptanceRate: weights.reduce((sum, w) => sum + w.acceptance_rate, 0) / weights.length
    });

    return weights;
  } catch (error) {
    logger.error('Error calculating category acceptance rates', { error, userId });
    return [];
  }
}

/**
 * Adjust recommendation priority based on historical patterns
 */
export async function adjustRecommendationPriority(
  userId: string,
  category: string,
  originalPriority: 'critical' | 'high' | 'medium' | 'low',
  confidence: number
): Promise<PriorityAdjustment> {
  try {
    const weights = await calculateCategoryAcceptanceRates(userId);
    const categoryWeight = weights.find(w => w.category === category);

    if (!categoryWeight || categoryWeight.total_generated < 5) {
      // Not enough data, return original priority
      return {
        original_priority: originalPriority,
        adjusted_priority: originalPriority,
        reason: 'Insufficient historical data',
        confidence_boost: 0
      };
    }

    const multiplier = categoryWeight.weight_multiplier;
    const acceptanceRate = categoryWeight.acceptance_rate;

    // Priority adjustment logic
    let adjustedPriority = originalPriority;
    let reason = '';
    let confidenceBoost = 0;

    if (acceptanceRate >= 80) {
      // High acceptance rate - boost priority
      if (originalPriority === 'medium') {
        adjustedPriority = 'high';
        reason = `Category "${category}" has ${acceptanceRate.toFixed(0)}% acceptance rate - boosting priority`;
        confidenceBoost = 0.1;
      } else if (originalPriority === 'low') {
        adjustedPriority = 'medium';
        reason = `Category "${category}" has ${acceptanceRate.toFixed(0)}% acceptance rate - boosting priority`;
        confidenceBoost = 0.1;
      }
    } else if (acceptanceRate <= 20) {
      // Low acceptance rate - reduce priority
      if (originalPriority === 'high') {
        adjustedPriority = 'medium';
        reason = `Category "${category}" has ${acceptanceRate.toFixed(0)}% acceptance rate - reducing priority`;
        confidenceBoost = -0.1;
      } else if (originalPriority === 'medium') {
        adjustedPriority = 'low';
        reason = `Category "${category}" has ${acceptanceRate.toFixed(0)}% acceptance rate - reducing priority`;
        confidenceBoost = -0.1;
      }
    } else {
      reason = `Category "${category}" has ${acceptanceRate.toFixed(0)}% acceptance rate - maintaining priority`;
    }

    // Never downgrade critical priorities
    if (originalPriority === 'critical') {
      adjustedPriority = 'critical';
      reason = 'Critical priority maintained regardless of acceptance rate';
      confidenceBoost = 0;
    }

    logger.info('Adjusted recommendation priority', {
      userId,
      category,
      originalPriority,
      adjustedPriority,
      acceptanceRate: acceptanceRate.toFixed(1),
      multiplier
    });

    return {
      original_priority: originalPriority,
      adjusted_priority: adjustedPriority,
      reason,
      confidence_boost: confidenceBoost
    };
  } catch (error) {
    logger.error('Error adjusting recommendation priority', { error, userId, category });
    return {
      original_priority: originalPriority,
      adjusted_priority: originalPriority,
      reason: 'Error during adjustment',
      confidence_boost: 0
    };
  }
}

/**
 * Get learning insights for user
 */
export async function getLearningInsights(userId: string): Promise<{
  total_recommendations: number;
  acceptance_rate: number;
  category_weights: CategoryWeights[];
  top_accepted_categories: string[];
  top_dismissed_categories: string[];
  recommendations: string[];
}> {
  try {
    const weights = await calculateCategoryAcceptanceRates(userId);
    
    const totalRecommendations = weights.reduce((sum, w) => sum + w.total_generated, 0);
    const totalAccepted = weights.reduce((sum, w) => sum + w.total_accepted, 0);
    const overallAcceptanceRate = totalRecommendations > 0 ? (totalAccepted / totalRecommendations) * 100 : 0;

    const topAccepted = weights
      .filter(w => w.total_generated >= 3)
      .sort((a, b) => b.acceptance_rate - a.acceptance_rate)
      .slice(0, 3)
      .map(w => w.category);

    const topDismissed = weights
      .filter(w => w.total_generated >= 3)
      .sort((a, b) => a.acceptance_rate - b.acceptance_rate)
      .slice(0, 3)
      .map(w => w.category);

    const recommendations: string[] = [];

    // Generate recommendations based on patterns
    if (overallAcceptanceRate < 30) {
      recommendations.push('Overall acceptance rate is low. Consider reviewing recommendation relevance.');
    }
    if (overallAcceptanceRate > 70) {
      recommendations.push('High acceptance rate indicates recommendations are well-aligned with user needs.');
    }

    weights.forEach(w => {
      if (w.acceptance_rate < 20 && w.total_generated >= 5) {
        recommendations.push(`Consider reducing frequency of "${w.category}" recommendations (${w.acceptance_rate.toFixed(0)}% acceptance).`);
      }
      if (w.acceptance_rate > 80 && w.total_generated >= 5) {
        recommendations.push(`"${w.category}" recommendations are highly valued (${w.acceptance_rate.toFixed(0)}% acceptance) - consider generating more.`);
      }
    });

    return {
      total_recommendations: totalRecommendations,
      acceptance_rate: overallAcceptanceRate,
      category_weights: weights,
      top_accepted_categories: topAccepted,
      top_dismissed_categories: topDismissed,
      recommendations
    };
  } catch (error) {
    logger.error('Error getting learning insights', { error, userId });
    throw error;
  }
}

/**
 * Apply learning adjustments to new recommendations
 */
export async function applyLearningAdjustments(
  userId: string,
  recommendations: Array<{
    category: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
  }>
): Promise<Array<{
  category: string;
  original_priority: string;
  adjusted_priority: string;
  original_confidence: number;
  adjusted_confidence: number;
  adjustment_reason: string;
}>> {
  try {
    const adjustments = [];

    for (const rec of recommendations) {
      const adjustment = await adjustRecommendationPriority(
        userId,
        rec.category,
        rec.priority,
        rec.confidence
      );

      adjustments.push({
        category: rec.category,
        original_priority: adjustment.original_priority,
        adjusted_priority: adjustment.adjusted_priority,
        original_confidence: rec.confidence,
        adjusted_confidence: Math.max(0, Math.min(1, rec.confidence + adjustment.confidence_boost)),
        adjustment_reason: adjustment.reason
      });
    }

    return adjustments;
  } catch (error) {
    logger.error('Error applying learning adjustments', { error, userId });
    return [];
  }
}

/**
 * Store learning metrics for analysis
 */
export async function storeLearningMetrics(
  userId: string,
  metrics: {
    total_recommendations: number;
    acceptance_rate: number;
    category_weights: CategoryWeights[];
  }
): Promise<void> {
  try {
    // Store in a learning_metrics table (create if needed)
    await supabase.from('recommendation_learning_metrics').insert({
      user_id: userId,
      total_recommendations: metrics.total_recommendations,
      acceptance_rate: metrics.acceptance_rate,
      category_weights: metrics.category_weights,
      calculated_at: new Date().toISOString()
    });

    logger.info('Stored learning metrics', {
      userId,
      totalRecommendations: metrics.total_recommendations,
      acceptanceRate: metrics.acceptance_rate.toFixed(1)
    });
  } catch (error) {
    logger.error('Error storing learning metrics', { error, userId });
  }
}

/**
 * Bloodwork Recommendation Service V2
 * 
 * Enhanced recommendation engine with:
 * - Expanded rule library (30+ markers)
 * - AI enhancement enabled by default
 * - Improved observability and error handling
 * - Backward compatible with V1 interface
 * 
 * Version: 2.0.0
 * Created: 2026-04-19
 */

import { createClient } from '@supabase/supabase-js';
import type {
  BloodworkRecommendation,
  CreateBloodworkRecommendationRequest,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
  RecommendationEvaluation
} from '../types/bloodworkRecommendations';
import { logger } from '../utils/logger';
import { getBloodworkTrendsByUser } from './bloodworkTrendService';
import { generateAIRecommendationText } from './bloodworkAIRecommendations';
import { RECOMMENDATION_RULES_V2, getCoveredMarkers, getRuleCoverage } from './bloodworkRecommendationRulesV2';
import type { BloodworkTrend } from '../types/bloodworkTrends';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Evaluate a condition against actual value
 */
function evaluateCondition(
  actualValue: number,
  operator: string,
  thresholdValue: number
): boolean {
  switch (operator) {
    case '>':
      return actualValue > thresholdValue;
    case '<':
      return actualValue < thresholdValue;
    case '>=':
      return actualValue >= thresholdValue;
    case '<=':
      return actualValue <= thresholdValue;
    case '==':
      return actualValue === thresholdValue;
    default:
      return false;
  }
}

/**
 * Evaluate a single marker trend against all applicable rules
 */
function evaluateMarkerTrend(
  markerName: string,
  trend: BloodworkTrend
): RecommendationEvaluation[] {
  const evaluations: RecommendationEvaluation[] = [];
  
  // Find all rules for this marker
  const applicableRules = RECOMMENDATION_RULES_V2.filter(
    rule => rule.marker_name === markerName
  );

  for (const rule of applicableRules) {
    const conditions = rule.conditions;
    let matches = true;
    let confidence = rule.recommendation.base_confidence;

    // Check trend direction
    if (conditions.trend_direction && trend.trend_direction !== conditions.trend_direction) {
      matches = false;
    }

    // Check minimum data points
    if (conditions.min_data_points && trend.data_points < conditions.min_data_points) {
      matches = false;
    }

    // Check value threshold
    if (conditions.value_threshold && trend.latest_value !== null && trend.latest_value !== undefined) {
      const latestValue = typeof trend.latest_value === 'number' 
        ? trend.latest_value 
        : parseFloat(trend.latest_value as string);
      
      if (!isNaN(latestValue)) {
        const thresholdMet = evaluateCondition(
          latestValue,
          conditions.value_threshold.operator,
          conditions.value_threshold.value
        );
        if (!thresholdMet) {
          matches = false;
        }
      } else {
        matches = false;
      }
    }

    // Check trend threshold (percent change)
    if (conditions.trend_threshold && trend.percent_change !== null && trend.percent_change !== undefined) {
      const percentChange = Math.abs(trend.percent_change);
      const thresholdMet = evaluateCondition(
        percentChange,
        conditions.trend_threshold.operator,
        conditions.trend_threshold.value
      );
      if (!thresholdMet) {
        matches = false;
      }
    }

    // If all conditions match, generate recommendation text
    if (matches) {
      // Generate recommendation text with template substitution
      const text = rule.recommendation.text_template
        .replace('{latest_value}', trend.latest_value?.toString() || 'N/A')
        .replace('{prior_value}', trend.prior_value?.toString() || 'N/A')
        .replace('{change}', trend.percent_change ? `${trend.percent_change.toFixed(1)}` : 'N/A')
        .replace('{direction}', trend.trend_direction || 'N/A')
        .replace('{data_points}', trend.data_points?.toString() || 'N/A');

      const rationale = rule.recommendation.rationale_template
        .replace('{latest_value}', trend.latest_value?.toString() || 'N/A')
        .replace('{prior_value}', trend.prior_value?.toString() || 'N/A')
        .replace('{change}', trend.percent_change ? `${trend.percent_change.toFixed(1)}` : 'N/A')
        .replace('{direction}', trend.trend_direction || 'N/A')
        .replace('{data_points}', trend.data_points?.toString() || 'N/A');

      evaluations.push({
        marker_name: markerName,
        trend,
        rule,
        matches,
        confidence,
        severity: rule.recommendation.severity,
        recommendation_data: {
          title: rule.recommendation.title,
          text,
          rationale
        }
      });
    }
  }

  return evaluations;
}

/**
 * Generate bloodwork recommendations for a user (V2)
 * 
 * Enhanced version with:
 * - Expanded rule coverage (30+ markers)
 * - AI enhancement enabled by default
 * - Improved error handling and logging
 * - Backward compatible interface
 */
export async function generateBloodworkRecommendationsForUserV2(
  request: GenerateRecommendationsRequest & { use_ai_enhancement?: boolean }
): Promise<GenerateRecommendationsResponse> {
  const startTime = Date.now();
  
  try {
    const { user_id, force_regenerate = false, use_ai_enhancement = true } = request;

    logger.info('[RECOMMENDATION V2] Starting recommendation generation', {
      userId: user_id,
      forceRegenerate: force_regenerate,
      aiEnhancement: use_ai_enhancement,
      ruleCoverage: getRuleCoverage(),
      coveredMarkers: getCoveredMarkers().length
    });

    // Get user's bloodwork trends
    const trendsResponse = await getBloodworkTrendsByUser({ user_id, min_data_points: 2 });

    if (!trendsResponse.success || !trendsResponse.data) {
      const errorMessage = trendsResponse.error || 'Failed to fetch bloodwork trends for recommendation generation';

      // Graceful handling of insufficient data
      if (errorMessage.includes('No bloodwork results') || errorMessage.includes('Insufficient data points')) {
        logger.info('[RECOMMENDATION V2] Insufficient data for recommendations', {
          userId: user_id,
          error: errorMessage,
          latencyMs: Date.now() - startTime
        });

        return {
          success: true,
          data: {
            generated_count: 0,
            superseded_count: 0,
            recommendations: [],
          },
        };
      }

      logger.error('[RECOMMENDATION V2] Failed to fetch trends', {
        userId: user_id,
        error: errorMessage,
        latencyMs: Date.now() - startTime
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const trends = trendsResponse.data.trends;

    logger.info('[RECOMMENDATION V2] Evaluating trends against rules', {
      userId: user_id,
      trendCount: trends.length,
      ruleCount: RECOMMENDATION_RULES_V2.length
    });

    // Evaluate each trend against rules
    const allEvaluations: RecommendationEvaluation[] = [];
    const matchingEvaluations: RecommendationEvaluation[] = [];

    for (const trend of trends) {
      const evaluations = evaluateMarkerTrend(trend.marker_name, trend);
      allEvaluations.push(...evaluations);
      matchingEvaluations.push(...evaluations.filter(e => e.matches));
    }

    logger.info('[RECOMMENDATION V2] Rule evaluation complete', {
      userId: user_id,
      totalEvaluations: allEvaluations.length,
      matchingEvaluations: matchingEvaluations.length,
      matchRate: allEvaluations.length > 0 
        ? (matchingEvaluations.length / allEvaluations.length * 100).toFixed(1) + '%'
        : '0%'
    });

    // If force_regenerate, supersede existing recommendations for these markers
    let supersededCount = 0;
    if (force_regenerate && matchingEvaluations.length > 0) {
      const markerNames = [...new Set(matchingEvaluations.map(e => e.marker_name))];
      
      for (const markerName of markerNames) {
        const { error: updateError } = await supabase
          .from('bloodwork_recommendations')
          .update({ status: 'superseded', updated_at: new Date().toISOString() })
          .eq('user_id', user_id)
          .eq('test_name', markerName)
          .eq('status', 'active');

        if (!updateError) {
          supersededCount++;
        }
      }

      logger.info('[RECOMMENDATION V2] Superseded existing recommendations', {
        userId: user_id,
        supersededCount
      });
    }

    // Create new recommendations for matching evaluations
    const generatedRecommendations: BloodworkRecommendation[] = [];
    let aiEnhancementSuccessCount = 0;
    let aiEnhancementFailureCount = 0;
    let totalAICost = 0;

    for (const evaluation of matchingEvaluations) {
      // Check for existing active recommendation for this marker
      const { data: existingRec, error: checkError } = await supabase
        .from('bloodwork_recommendations')
        .select('id')
        .eq('user_id', user_id)
        .eq('test_name', evaluation.marker_name)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('[RECOMMENDATION V2] Error checking existing recommendation', {
          userId: user_id,
          marker: evaluation.marker_name,
          error: checkError.message
        });
        continue;
      }

      // Skip if already exists (unless force_regenerate)
      if (existingRec && !force_regenerate) {
        logger.info('[RECOMMENDATION V2] Skipping existing recommendation', {
          userId: user_id,
          marker: evaluation.marker_name
        });
        continue;
      }

      // Get source document and result IDs
      const { data: sourceResults } = await supabase
        .from('bloodwork_results')
        .select('document_id, id')
        .eq('user_id', user_id)
        .eq('normalized_test_name', evaluation.trend.marker_name)
        .order('test_date', { ascending: false })
        .limit(evaluation.trend.data_points);

      const sourceDocumentIds = sourceResults?.map(r => r.document_id) || [];
      const sourceResultIds = sourceResults?.map(r => r.id) || [];

      // Use AI to enhance recommendation text
      let recommendationTitle = evaluation.recommendation_data.title;
      let recommendationText = evaluation.recommendation_data.text;
      let recommendationRationale = evaluation.recommendation_data.rationale;

      if (use_ai_enhancement) {
        try {
          const aiResult = await generateAIRecommendationText({
            markerName: evaluation.marker_name,
            latestValue: evaluation.trend.latest_value,
            priorValue: evaluation.trend.prior_value,
            unit: evaluation.trend.unit || '',
            trendDirection: evaluation.trend.trend_direction,
            changePercent: evaluation.trend.percent_change,
            referenceRangeLow: evaluation.trend.reference_range_low,
            referenceRangeHigh: evaluation.trend.reference_range_high,
            severity: evaluation.severity,
            recommendationType: evaluation.rule.recommendation_type
          });

          recommendationTitle = aiResult.title;
          recommendationText = aiResult.message;
          recommendationRationale = aiResult.rationale;

          // Add action items to text if present
          if (aiResult.actionItems.length > 0) {
            recommendationText += '\n\n**Action Steps:**\n' + 
              aiResult.actionItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
          }

          aiEnhancementSuccessCount++;
          totalAICost += aiResult.cost;

          logger.info('[RECOMMENDATION V2] AI enhancement successful', {
            userId: user_id,
            marker: evaluation.marker_name,
            cost: aiResult.cost
          });
        } catch (aiError) {
          aiEnhancementFailureCount++;
          logger.warn('[RECOMMENDATION V2] AI enhancement failed, using template', {
            userId: user_id,
            marker: evaluation.marker_name,
            error: (aiError as Error).message
          });
          // Fall back to template-based text
        }
      }

      const recommendationData: CreateBloodworkRecommendationRequest = {
        user_id,
        test_name: evaluation.marker_name,
        normalized_test_name: evaluation.trend.marker_name,
        category: evaluation.trend.category,
        recommendation_type: evaluation.rule.recommendation_type,
        recommendation_title: recommendationTitle,
        recommendation_text: recommendationText,
        rationale: recommendationRationale,
        confidence: evaluation.confidence,
        severity: evaluation.severity,
        source_document_ids: sourceDocumentIds,
        source_result_ids: sourceResultIds,
        source_trend_window: {
          start_date: evaluation.trend.first_test_date,
          end_date: evaluation.trend.latest_test_date,
          data_points: evaluation.trend.data_points
        }
      };

      const { data: newRec, error: insertError } = await supabase
        .from('bloodwork_recommendations')
        .insert(recommendationData)
        .select()
        .single();

      if (insertError) {
        logger.error('[RECOMMENDATION V2] Error creating recommendation', {
          userId: user_id,
          marker: evaluation.marker_name,
          error: insertError.message
        });
        continue;
      }

      if (newRec) {
        generatedRecommendations.push(newRec);
      }
    }

    const latencyMs = Date.now() - startTime;

    logger.info('[RECOMMENDATION V2] Recommendation generation complete', {
      userId: user_id,
      generatedCount: generatedRecommendations.length,
      supersededCount,
      aiEnhancementSuccessCount,
      aiEnhancementFailureCount,
      totalAICost: totalAICost.toFixed(4),
      latencyMs
    });

    return {
      success: true,
      data: {
        generated_count: generatedRecommendations.length,
        superseded_count: supersededCount,
        recommendations: generatedRecommendations
      }
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    logger.error('[RECOMMENDATION V2] Unexpected error', {
      userId: request.user_id,
      error: (error as Error).message,
      stack: (error as Error).stack,
      latencyMs
    });

    return {
      success: false,
      error: `Error generating recommendations: ${(error as Error).message}`
    };
  }
}

/**
 * Get rule coverage statistics for monitoring
 */
export function getRecommendationCoverageV2(): {
  totalRules: number;
  coveredMarkers: string[];
  rulesByCategory: Record<string, number>;
} {
  return {
    totalRules: RECOMMENDATION_RULES_V2.length,
    coveredMarkers: getCoveredMarkers(),
    rulesByCategory: getRuleCoverage()
  };
}

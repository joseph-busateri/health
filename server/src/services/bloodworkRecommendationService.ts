import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type {
  BloodworkRecommendation,
  CreateBloodworkRecommendationRequest,
  UpdateRecommendationStatusRequest,
  GetBloodworkRecommendationsRequest,
  GetBloodworkRecommendationsResponse,
  GenerateRecommendationsRequest,
  GenerateRecommendationsResponse,
  RecommendationRule,
  RecommendationEvaluation,
  RecommendationGenerationResult,
  RecommendationType,
  RecommendationSeverity,
  RecommendationStatus
} from '../types/bloodworkRecommendations';
import type { Database } from '../types/database';
import { getBloodworkTrendsByUser } from './bloodworkTrendService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Recommendation rules for common markers
const RECOMMENDATION_RULES: RecommendationRule[] = [
  // Cardiovascular Rules
  {
    marker_name: 'LDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 100 },
      trend_threshold: { operator: '>', value: 10 }
    },
    recommendation: {
      title: 'LDL Cholesterol Increasing',
      text_template: 'Your LDL cholesterol has increased from {prior_value} to {latest_value} ({change}%). Consider reviewing your cardiovascular health strategy.',
      rationale_template: 'LDL cholesterol is rising above optimal levels ({latest_value} mg/dL) with a worsening trend over {data_points} measurements.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'LDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 130 }
    },
    recommendation: {
      title: 'High LDL Cholesterol Detected',
      text_template: 'Your LDL cholesterol is elevated at {latest_value} mg/dL and has been increasing. This may require intervention.',
      rationale_template: 'LDL cholesterol is significantly elevated ({latest_value} mg/dL) with worsening trend, indicating increased cardiovascular risk.',
      severity: 'high',
      base_confidence: 0.9
    }
  },
  {
    marker_name: 'ApoB',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 90 }
    },
    recommendation: {
      title: 'ApoB Levels Rising',
      text_template: 'Your ApoB has increased to {latest_value} mg/dL, suggesting increased cardiovascular risk particles.',
      rationale_template: 'Rising ApoB levels ({latest_value} mg/dL) indicate increased atherogenic particle concentration.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'hsCRP',
    recommendation_type: 'inflammation',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 3 }
    },
    recommendation: {
      title: 'Inflammation Markers Elevated',
      text_template: 'Your hsCRP is elevated at {latest_value} mg/L and increasing, suggesting systemic inflammation.',
      rationale_template: 'Elevated and rising hsCRP ({latest_value} mg/dL) indicates active inflammation requiring follow-up.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Triglycerides',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 150 }
    },
    recommendation: {
      title: 'Triglycerides Increasing',
      text_template: 'Your triglycerides have risen to {latest_value} mg/dL, which may impact cardiovascular health.',
      rationale_template: 'Elevated triglycerides ({latest_value} mg/dL) with worsening trend may increase cardiovascular risk.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'HDL',
    recommendation_type: 'cardiovascular',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 40 }
    },
    recommendation: {
      title: 'HDL Cholesterol Declining',
      text_template: 'Your HDL cholesterol has decreased to {latest_value} mg/dL, which may reduce cardiovascular protection.',
      rationale_template: 'Declining HDL ({latest_value} mg/dL) below optimal levels may reduce protective cardiovascular benefits.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },

  // Metabolic Rules
  {
    marker_name: 'HbA1c',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 5.7 }
    },
    recommendation: {
      title: 'HbA1c Rising',
      text_template: 'Your HbA1c has increased to {latest_value}%, indicating worsening glucose control.',
      rationale_template: 'Rising HbA1c ({latest_value}%) suggests impaired glucose metabolism requiring attention.',
      severity: 'medium',
      base_confidence: 0.8
    }
  },
  {
    marker_name: 'HbA1c',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 6.5 }
    },
    recommendation: {
      title: 'High HbA1c Detected',
      text_template: 'Your HbA1c is elevated at {latest_value}%, indicating potential diabetes risk.',
      rationale_template: 'Elevated HbA1c ({latest_value}%) suggests prediabetes or diabetes requiring medical evaluation.',
      severity: 'high',
      base_confidence: 0.9
    }
  },
  {
    marker_name: 'Glucose',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 100 }
    },
    recommendation: {
      title: 'Glucose Levels Increasing',
      text_template: 'Your glucose levels have risen to {latest_value} mg/dL, suggesting metabolic changes.',
      rationale_template: 'Elevated glucose ({latest_value} mg/dL) with worsening trend may indicate insulin resistance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Fasting Glucose',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 100 }
    },
    recommendation: {
      title: 'Fasting Glucose Rising',
      text_template: 'Your fasting glucose has increased to {latest_value} mg/dL, affecting metabolic health.',
      rationale_template: 'Rising fasting glucose ({latest_value} mg/dL) may indicate developing insulin resistance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Insulin',
    recommendation_type: 'metabolic',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 25 }
    },
    recommendation: {
      title: 'Insulin Levels Increasing',
      text_template: 'Your insulin levels have risen to {latest_value} µIU/mL, suggesting insulin resistance.',
      rationale_template: 'Elevated insulin ({latest_value} µIU/mL) with worsening trend indicates developing insulin resistance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },

  // Hormonal Rules
  {
    marker_name: 'Testosterone',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 300 }
    },
    recommendation: {
      title: 'Testosterone Declining',
      text_template: 'Your testosterone has decreased to {latest_value} ng/dL, which may affect various health aspects.',
      rationale_template: 'Declining testosterone ({latest_value} ng/dL) below optimal levels may impact energy, muscle mass, and libido.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'Free Testosterone',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '<', value: 9 }
    },
    recommendation: {
      title: 'Free Testosterone Low',
      text_template: 'Your free testosterone is low at {latest_value} ng/dL, which may indicate hormonal imbalance.',
      rationale_template: 'Low free testosterone ({latest_value} ng/dL) with worsening trend may affect hormonal health.',
      severity: 'medium',
      base_confidence: 0.7
    }
  },
  {
    marker_name: 'SHBG',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 80 }
    },
    recommendation: {
      title: 'SHBG Levels High',
      text_template: 'Your SHBG has increased to {latest_value} nmol/L, which may affect hormone availability.',
      rationale_template: 'Elevated SHBG ({latest_value} nmol/L) may reduce free hormone availability.',
      severity: 'low',
      base_confidence: 0.6
    }
  },
  {
    marker_name: 'Estradiol',
    recommendation_type: 'hormonal',
    conditions: {
      trend_direction: 'worsening',
      min_data_points: 2,
      value_threshold: { operator: '>', value: 80 }
    },
    recommendation: {
      title: 'Estradiol Elevated',
      text_template: 'Your estradiol has increased to {latest_value} pg/mL, which may indicate hormonal imbalance.',
      rationale_template: 'Elevated estradiol ({latest_value} pg/mL) with worsening trend may affect hormonal balance.',
      severity: 'medium',
      base_confidence: 0.7
    }
  }
];

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

function evaluateMarkerTrend(
  markerName: string,
  trend: any
): RecommendationEvaluation[] {
  const applicableRules = RECOMMENDATION_RULES.filter(rule => 
    rule.marker_name === markerName
  );

  const evaluations: RecommendationEvaluation[] = [];

  for (const rule of applicableRules) {
    const conditions = rule.conditions;
    let matches = true;
    let confidence = rule.recommendation.base_confidence;

    // Check trend direction
    if (conditions.trend_direction && 
        trend.trend_direction !== conditions.trend_direction) {
      matches = false;
    }

    // Check minimum data points
    if (conditions.min_data_points && 
        trend.data_points < conditions.min_data_points) {
      matches = false;
    }

    // Check value threshold
    if (conditions.value_threshold && trend.latest_value !== undefined) {
      const latestValue = typeof trend.latest_value === 'number' 
        ? trend.latest_value 
        : parseFloat(trend.latest_value.toString());
      
      if (!evaluateCondition(latestValue, conditions.value_threshold.operator, conditions.value_threshold.value)) {
        matches = false;
      }
    }

    // Check trend threshold
    if (conditions.trend_threshold && trend.percent_change !== undefined) {
      if (!evaluateCondition(trend.percent_change, conditions.trend_threshold.operator, conditions.trend_threshold.value)) {
        matches = false;
      }
    }

    // Adjust confidence based on data quality
    if (trend.data_points < 3) {
      confidence *= 0.8; // Reduce confidence for limited data
    }

    if (matches) {
      // Generate recommendation text with template substitution
      const text = rule.recommendation.text_template
        .replace('{latest_value}', trend.latest_value?.toString() || 'N/A')
        .replace('{prior_value}', trend.prior_value?.toString() || 'N/A')
        .replace('{change}', trend.percent_change ? `${trend.percent_change.toFixed(1)}%` : 'N/A')
        .replace('{direction}', trend.trend_direction || 'N/A')
        .replace('{data_points}', trend.data_points?.toString() || 'N/A');

      const rationale = rule.recommendation.rationale_template
        .replace('{latest_value}', trend.latest_value?.toString() || 'N/A')
        .replace('{prior_value}', trend.prior_value?.toString() || 'N/A')
        .replace('{change}', trend.percent_change ? `${trend.percent_change.toFixed(1)}%` : 'N/A')
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

export async function generateBloodworkRecommendationsForUser(
  request: GenerateRecommendationsRequest
): Promise<GenerateRecommendationsResponse> {
  try {
    const { user_id, force_regenerate = false } = request;

    // Get user's bloodwork trends
    const trendsResponse = await getBloodworkTrendsByUser({ user_id, min_data_points: 2 });

    if (!trendsResponse.success || !trendsResponse.data) {
      return {
        success: false,
        error: 'Failed to fetch bloodwork trends for recommendation generation'
      };
    }

    const trends = trendsResponse.data.trends;

    // Evaluate each trend against rules
    const allEvaluations: RecommendationEvaluation[] = [];
    const matchingEvaluations: RecommendationEvaluation[] = [];

    for (const trend of trends) {
      const evaluations = evaluateMarkerTrend(trend.marker_name, trend);
      allEvaluations.push(...evaluations);
      matchingEvaluations.push(...evaluations.filter(e => e.matches));
    }

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
    }

    // Create new recommendations for matching evaluations
    const generatedRecommendations: BloodworkRecommendation[] = [];

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
        console.error('Error checking existing recommendation:', checkError);
        continue;
      }

      // Skip if already exists (unless force_regenerate)
      if (existingRec && !force_regenerate) {
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

      const recommendationData: CreateBloodworkRecommendationRequest = {
        user_id,
        test_name: evaluation.marker_name,
        normalized_test_name: evaluation.trend.marker_name,
        category: evaluation.trend.category,
        recommendation_type: evaluation.rule.recommendation_type,
        recommendation_title: evaluation.recommendation_data.title,
        recommendation_text: evaluation.recommendation_data.text,
        rationale: evaluation.recommendation_data.rationale,
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
        console.error('Error creating recommendation:', insertError);
        continue;
      }

      if (newRec) {
        generatedRecommendations.push(newRec);
      }
    }

    return {
      success: true,
      data: {
        generated_count: generatedRecommendations.length,
        superseded_count: supersededCount,
        recommendations: generatedRecommendations
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error generating recommendations: ${(error as Error).message}`
    };
  }
}

export async function getBloodworkRecommendationsByUser(
  request: GetBloodworkRecommendationsRequest
): Promise<GetBloodworkRecommendationsResponse> {
  try {
    const { 
      user_id, 
      status, 
      recommendation_type, 
      severity,
      limit = 50,
      offset = 0
    } = request;

    let query = supabase
      .from('bloodwork_recommendations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (recommendation_type) {
      query = query.eq('recommendation_type', recommendation_type);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: recommendations, error } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to fetch recommendations: ${error.message}`
      };
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('bloodwork_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (countError) {
      console.error('Error getting count:', countError);
    }

    return {
      success: true,
      data: {
        recommendations: recommendations || [],
        total: count || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching recommendations: ${(error as Error).message}`
    };
  }
}

export async function getActiveBloodworkRecommendationsByUser(
  user_id: string
): Promise<GetBloodworkRecommendationsResponse> {
  return getBloodworkRecommendationsByUser({
    user_id,
    status: 'active'
  });
}

export async function createBloodworkRecommendation(
  request: CreateBloodworkRecommendationRequest
): Promise<{ success: boolean; data?: BloodworkRecommendation; error?: string }> {
  try {
    const { data: recommendation, error } = await supabase
      .from('bloodwork_recommendations')
      .insert(request)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create recommendation: ${error.message}`
      };
    }

    return {
      success: true,
      data: recommendation
    };
  } catch (error) {
    return {
      success: false,
      error: `Error creating recommendation: ${(error as Error).message}`
    };
  }
}

export async function markBloodworkRecommendationStatus(
  recommendationId: string,
  request: UpdateRecommendationStatusRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('bloodwork_recommendations')
      .update({ 
        status: request.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendationId);

    if (error) {
      return {
        success: false,
        error: `Failed to update recommendation status: ${error.message}`
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Error updating recommendation status: ${(error as Error).message}`
    };
  }
}

// Helper function to get all recommendation rules
export function getRecommendationRules(): RecommendationRule[] {
  return RECOMMENDATION_RULES;
}

// Helper function to get rules by recommendation type
export function getRecommendationRulesByType(type: RecommendationType): RecommendationRule[] {
  return RECOMMENDATION_RULES.filter(rule => rule.recommendation_type === type);
}

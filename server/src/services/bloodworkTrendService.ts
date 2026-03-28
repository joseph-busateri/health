import { createClient } from '@supabase/supabase-js';
import type {
  BloodworkTrend,
  BloodworkTrendSummary,
  GetBloodworkTrendsRequest,
  GetBloodworkTrendsResponse,
  GetBloodworkTrendSummaryRequest,
  GetBloodworkTrendSummaryResponse,
  TrendCalculationResult,
  MarkerTrendRule,
  BloodworkResultForTrend,
  TrendDirection
} from '../types/bloodworkTrends';
import type { Database } from '../types/database';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Trend direction rules for common markers
const MARKER_TREND_RULES: MarkerTrendRule[] = [
  // Cardiovascular markers
  {
    name: 'LDL',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 100 },
    unit: 'mg/dL',
    significant_change_threshold: 5
  },
  {
    name: 'LDL-C',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 100 },
    unit: 'mg/dL',
    significant_change_threshold: 5
  },
  {
    name: 'HDL',
    category: 'Cardiovascular',
    direction: 'higher_is_better',
    target_range: { min: 40 },
    unit: 'mg/dL',
    significant_change_threshold: 5
  },
  {
    name: 'Triglycerides',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 150 },
    unit: 'mg/dL',
    significant_change_threshold: 10
  },
  {
    name: 'ApoB',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 90 },
    unit: 'mg/dL',
    significant_change_threshold: 5
  },
  {
    name: 'hsCRP',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 3 },
    unit: 'mg/L',
    significant_change_threshold: 15
  },
  {
    name: 'Total Cholesterol',
    category: 'Cardiovascular',
    direction: 'lower_is_better',
    target_range: { max: 200 },
    unit: 'mg/dL',
    significant_change_threshold: 5
  },

  // Metabolic markers
  {
    name: 'HbA1c',
    category: 'Metabolic',
    direction: 'lower_is_better',
    target_range: { max: 5.7 },
    unit: '%',
    significant_change_threshold: 3
  },
  {
    name: 'A1c',
    category: 'Metabolic',
    direction: 'lower_is_better',
    target_range: { max: 5.7 },
    unit: '%',
    significant_change_threshold: 3
  },
  {
    name: 'Glucose',
    category: 'Metabolic',
    direction: 'lower_is_better',
    target_range: { max: 100 },
    unit: 'mg/dL',
    significant_change_threshold: 10
  },
  {
    name: 'Fasting Glucose',
    category: 'Metabolic',
    direction: 'lower_is_better',
    target_range: { max: 100 },
    unit: 'mg/dL',
    significant_change_threshold: 10
  },
  {
    name: 'Insulin',
    category: 'Metabolic',
    direction: 'lower_is_better',
    target_range: { max: 25 },
    unit: 'µIU/mL',
    significant_change_threshold: 15
  },

  // Hormonal markers
  {
    name: 'Testosterone',
    category: 'Hormonal',
    direction: 'higher_is_better',
    target_range: { min: 300 },
    unit: 'ng/dL',
    significant_change_threshold: 10
  },
  {
    name: 'Free Testosterone',
    category: 'Hormonal',
    direction: 'higher_is_better',
    target_range: { min: 9 },
    unit: 'ng/dL',
    significant_change_threshold: 10
  },
  {
    name: 'SHBG',
    category: 'Hormonal',
    direction: 'target_range',
    target_range: { min: 10, max: 80 },
    unit: 'nmol/L',
    significant_change_threshold: 10
  },
  {
    name: 'Estradiol',
    category: 'Hormonal',
    direction: 'target_range',
    target_range: { min: 20, max: 80 },
    unit: 'pg/mL',
    significant_change_threshold: 15
  }
];

function getMarkerRule(markerName: string): MarkerTrendRule | null {
  return MARKER_TREND_RULES.find(rule => 
    rule.name.toLowerCase() === markerName.toLowerCase()
  ) || null;
}

function calculateTrendDirection(
  rule: MarkerTrendRule,
  latestValue: number,
  priorValue: number,
  percentChange: number
): TrendDirection {
  const threshold = rule.significant_change_threshold || 10;
  
  // If change is not significant, consider it stable
  if (Math.abs(percentChange) < threshold) {
    return 'stable';
  }

  switch (rule.direction) {
    case 'lower_is_better':
      return percentChange < 0 ? 'improving' : 'worsening';
    
    case 'higher_is_better':
      return percentChange > 0 ? 'improving' : 'worsening';
    
    case 'target_range':
      if (!rule.target_range) return 'stable';
      
      const latestInRange = 
        (!rule.target_range.min || latestValue >= rule.target_range.min) &&
        (!rule.target_range.max || latestValue <= rule.target_range.max);
      
      const priorInRange = 
        (!rule.target_range.min || priorValue >= rule.target_range.min) &&
        (!rule.target_range.max || priorValue <= rule.target_range.max);
      
      // Moving into range or staying in range is improving
      if (latestInRange && !priorInRange) return 'improving';
      if (!latestInRange && priorInRange) return 'worsening';
      
      // Both in range or both out of range - check direction
      if (latestInRange && priorInRange) return 'stable';
      
      // Both out of range - check if moving closer to center of range
      if (rule.target_range.min && rule.target_range.max) {
        const targetCenter = (rule.target_range.min + rule.target_range.max) / 2;
        const latestDistance = Math.abs(latestValue - targetCenter);
        const priorDistance = Math.abs(priorValue - targetCenter);
        
        return latestDistance < priorDistance ? 'improving' : 'worsening';
      }
      
      return 'stable';
    
    default:
      return 'stable';
  }
}

export async function getBloodworkTrendsByUser(
  request: GetBloodworkTrendsRequest
): Promise<GetBloodworkTrendsResponse> {
  try {
    const { user_id, category, min_data_points = 2 } = request;

    // Fetch bloodwork results for the user
    let query = supabase
      .from('bloodwork_results')
      .select(`
        normalized_test_name,
        raw_test_name,
        value_numeric,
        value_text,
        test_date,
        unit,
        category
      `)
      .eq('user_id', user_id)
      .not('test_date', 'is', null)
      .order('test_date', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: results, error } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to fetch bloodwork results: ${error.message}`
      };
    }

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'No bloodwork results found for trend analysis'
      };
    }

    // Group results by marker name (normalized first, then raw)
    const groupedResults = results.reduce((groups: Record<string, BloodworkResultForTrend[]>, result) => {
      const markerKey = result.normalized_test_name || result.raw_test_name;
      if (!groups[markerKey]) {
        groups[markerKey] = [];
      }
      groups[markerKey].push({
        normalized_test_name: result.normalized_test_name,
        raw_test_name: result.raw_test_name,
        value_numeric: result.value_numeric,
        value_text: result.value_text,
        test_date: result.test_date,
        unit: result.unit,
        category: result.category
      });
      return groups;
    }, {});

    // Calculate trends for each marker
    const trends: BloodworkTrend[] = [];
    
    for (const [markerName, markerResults] of Object.entries(groupedResults)) {
      // Skip if insufficient data points
      if (markerResults.length < min_data_points) {
        const trend: BloodworkTrend = {
          marker_name: markerName,
          category: markerResults[0].category,
          latest_value: markerResults[markerResults.length - 1].value_text,
          prior_value: markerResults[0].value_text,
          trend_direction: 'insufficient_data',
          data_points: markerResults.length,
          first_test_date: markerResults[0].test_date,
          latest_test_date: markerResults[markerResults.length - 1].test_date,
          unit: markerResults[markerResults.length - 1].unit,
          trend_summary: summarizeBloodworkTrend({
            marker_name: markerName,
            category: markerResults[0].category,
            latest_value: markerResults[markerResults.length - 1].value_text,
            prior_value: markerResults[0].value_text,
            trend_direction: 'insufficient_data',
            data_points: markerResults.length,
            first_test_date: markerResults[0].test_date,
            latest_test_date: markerResults[markerResults.length - 1].test_date,
            unit: markerResults[markerResults.length - 1].unit
          })
        };
        trends.push(trend);
        continue;
      }

      // Calculate trend
      const trendResult = calculateBloodworkTrend(markerResults);
      const rule = getMarkerRule(markerName);

      const trend: BloodworkTrend = {
        marker_name: markerName,
        category: rule?.category || markerResults[0].category,
        latest_value: trendResult.latest_value,
        prior_value: trendResult.prior_value,
        absolute_change: trendResult.absolute_change,
        percent_change: trendResult.percent_change,
        trend_direction: trendResult.trend_direction,
        data_points: trendResult.data_points,
        first_test_date: trendResult.first_test_date,
        latest_test_date: trendResult.latest_test_date,
        unit: rule?.unit || markerResults[markerResults.length - 1].unit,
        trend_summary: summarizeBloodworkTrend({
          marker_name: markerName,
          category: rule?.category || markerResults[0].category,
          latest_value: trendResult.latest_value,
          prior_value: trendResult.prior_value,
          absolute_change: trendResult.absolute_change,
          percent_change: trendResult.percent_change,
          trend_direction: trendResult.trend_direction,
          data_points: trendResult.data_points,
          first_test_date: trendResult.first_test_date,
          latest_test_date: trendResult.latest_test_date,
          unit: rule?.unit || markerResults[markerResults.length - 1].unit
        })
      };

      trends.push(trend);
    }

    // Generate summary
    const summary = await getBloodworkTrendSummary({ user_id, category });

    if (!summary.success || !summary.data) {
      return {
        success: false,
        error: 'Failed to generate trend summary'
      };
    }

    return {
      success: true,
      data: {
        trends,
        summary: summary.data,
        total: trends.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Error calculating bloodwork trends: ${(error as Error).message}`
    };
  }
}

export function calculateBloodworkTrend(resultSeries: BloodworkResultForTrend[]): TrendCalculationResult {
  if (resultSeries.length < 2) {
    throw new Error('Insufficient data points for trend calculation');
  }

  // Sort by test_date to ensure chronological order
  const sortedResults = [...resultSeries].sort((a, b) => 
    new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  );

  const priorResult = sortedResults[0];
  const latestResult = sortedResults[sortedResults.length - 1];

  // Extract numeric values for calculation
  const priorValue = priorResult.value_numeric || parseFloat(priorResult.value_text) || 0;
  const latestValue = latestResult.value_numeric || parseFloat(latestResult.value_text) || 0;

  // Calculate changes
  const absoluteChange = latestValue - priorValue;
  const percentChange = priorValue !== 0 ? (absoluteChange / priorValue) * 100 : 0;

  // Get trend rule for this marker
  const markerName = latestResult.normalized_test_name || latestResult.raw_test_name;
  const rule = getMarkerRule(markerName);

  // Determine trend direction
  let trendDirection: TrendDirection = 'stable';
  
  if (rule) {
    trendDirection = calculateTrendDirection(rule, latestValue, priorValue, percentChange);
  } else {
    // Default logic for unknown markers
    const threshold = 10; // 10% default threshold
    if (Math.abs(percentChange) >= threshold) {
      trendDirection = percentChange > 0 ? 'worsening' : 'improving';
    }
  }

  return {
    latest_value: latestResult.value_numeric || latestResult.value_text,
    prior_value: priorResult.value_numeric || priorResult.value_text,
    absolute_change: absoluteChange,
    percent_change: percentChange,
    trend_direction: trendDirection,
    data_points: sortedResults.length,
    first_test_date: sortedResults[0].test_date,
    latest_test_date: sortedResults[sortedResults.length - 1].test_date
  };
}

export async function getBloodworkTrendSummary(
  request: GetBloodworkTrendSummaryRequest
): Promise<GetBloodworkTrendSummaryResponse> {
  try {
    const { user_id, category } = request;

    // Get trends for the user
    const trendsResponse = await getBloodworkTrendsByUser({ 
      user_id, 
      category,
      min_data_points: 1 // Include all markers for summary
    });

    if (!trendsResponse.success || !trendsResponse.data) {
      return {
        success: false,
        error: 'Failed to generate trend summary'
      };
    }

    const trends = trendsResponse.data.trends;

    // Categorize trends
    const improvingMarkers = trends
      .filter(t => t.trend_direction === 'improving')
      .map(t => t.marker_name);

    const worseningMarkers = trends
      .filter(t => t.trend_direction === 'worsening')
      .map(t => t.marker_name);

    const stableMarkers = trends
      .filter(t => t.trend_direction === 'stable')
      .map(t => t.marker_name);

    const insufficientDataMarkers = trends
      .filter(t => t.trend_direction === 'insufficient_data')
      .map(t => t.marker_name);

    // Calculate date range
    const allDates = trends.flatMap(t => [t.first_test_date, t.latest_test_date]);
    const sortedDates = allDates.sort();
    const dateRange = {
      start: sortedDates[0],
      end: sortedDates[sortedDates.length - 1]
    };

    const summary: BloodworkTrendSummary = {
      improving_markers: improvingMarkers,
      worsening_markers: worseningMarkers,
      stable_markers: stableMarkers,
      insufficient_data_markers: insufficientDataMarkers,
      total_markers: trends.length,
      analysis_date: new Date().toISOString(),
      date_range: dateRange
    };

    return {
      success: true,
      data: summary
    };
  } catch (error) {
    return {
      success: false,
      error: `Error generating trend summary: ${(error as Error).message}`
    };
  }
}

export function summarizeBloodworkTrend(markerTrend: BloodworkTrend): string {
  const { trend_direction, absolute_change, percent_change, unit } = markerTrend;
  
  if (trend_direction === 'insufficient_data') {
    return 'Insufficient data for trend analysis';
  }
  
  if (trend_direction === 'stable') {
    return 'Stable over time';
  }
  
  const changeText = absolute_change !== undefined 
    ? `${absolute_change.toFixed(1)}${unit || ''}`
    : `${percent_change?.toFixed(1)}%`;
  
  return `${trend_direction === 'improving' ? 'Improving' : 'Worsening'} by ${changeText}`;
}

// Helper function to get all supported marker rules
export function getSupportedMarkers(): MarkerTrendRule[] {
  return MARKER_TREND_RULES;
}

// Helper function to get markers by category
export function getMarkersByCategory(category: string): MarkerTrendRule[] {
  return MARKER_TREND_RULES.filter(rule => rule.category === category);
}

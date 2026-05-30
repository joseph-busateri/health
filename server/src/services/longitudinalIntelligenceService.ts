import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';
import type { BodyCompositionScan } from '../types/bodyComposition';

/**
 * Longitudinal Intelligence Service
 * 
 * Purpose: Enable trend-aware intelligence across bloodwork, body composition, and adherence
 * - Tracks trends over time (improvement, decline, stable, volatile)
 * - Detects intervention effectiveness
 * - Provides simple linear predictions
 * - Prepares for Phase 7 Adaptive Intelligence and Phase 8 Goal-Weighted Intelligence
 * 
 * This is rule-based trend intelligence only - no ML models
 */

// ============================================================================
// TYPES
// ============================================================================

// Bloodwork scan type (from database)
interface BloodworkScan {
  id: string;
  user_id: string;
  test_date: string;
  parsed_data?: {
    markers?: Array<{
      name: string;
      value: number | string | null;
      unit?: string;
      referenceRange?: string;
      status?: string;
    }>;
  };
  created_at: string;
}

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile' | 'insufficient_data';
export type TrendConfidence = 'high' | 'moderate' | 'low';
export type SignalType = 'improvement' | 'decline' | 'prediction' | 'intervention_effective' | 'intervention_ineffective';

export interface DataPoint {
  value: number;
  date: string;
  source?: string;
}

export interface TrendAnalysis {
  marker: string;
  direction: TrendDirection;
  confidence: TrendConfidence;
  currentValue: number | null;
  previousValue: number | null;
  changePercent: number | null;
  changeAbsolute: number | null;
  dataPoints: DataPoint[];
  timespan: string; // e.g., "18 months", "6 months"
  summary: string;
}

export interface PredictionSignal {
  marker: string;
  predictedValue: number;
  currentValue: number;
  timeframe: string; // e.g., "3 months", "6 months"
  confidence: TrendConfidence;
  basis: string;
}

export interface LongitudinalSignal {
  id: string;
  type: SignalType;
  category: 'bloodwork' | 'body_composition' | 'adherence';
  title: string;
  description: string;
  confidence: TrendConfidence;
  dataPoints: number;
  timespan: string;
}

export interface LongitudinalIntelligenceContext {
  userId: string;
  timestamp: string;
  
  // Trend analyses
  bloodworkTrends: TrendAnalysis[];
  bodyCompositionTrends: TrendAnalysis[];
  
  // Signals
  improvementSignals: LongitudinalSignal[];
  declineSignals: LongitudinalSignal[];
  predictionSignals: PredictionSignal[];
  
  // Summary metrics
  totalTrends: number;
  improvingTrends: number;
  decliningTrends: number;
  
  // Data completeness
  dataCompleteness: {
    hasBloodworkHistory: boolean;
    hasBodyCompositionHistory: boolean;
    bloodworkDataPoints: number;
    bodyCompositionDataPoints: number;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// BLOODWORK TREND INTELLIGENCE
// ============================================================================

/**
 * Retrieve bloodwork history from database
 */
async function getBloodworkHistory(userId: string, limit: number = 50): Promise<BloodworkScan[]> {
  try {
    const { data, error } = await supabase
      .from('bloodwork_scans')
      .select('*')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('[LONGITUDINAL] Failed to fetch bloodwork history', { userId, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[LONGITUDINAL] Error fetching bloodwork history', { userId, error: (error as Error).message });
    return [];
  }
}

/**
 * Extract marker values from bloodwork scans
 */
function extractMarkerHistory(scans: BloodworkScan[], markerName: string): DataPoint[] {
  const dataPoints: DataPoint[] = [];

  for (const scan of scans) {
    if (!scan.parsed_data?.markers) continue;

    const marker = scan.parsed_data.markers.find(
      (m: any) => m.name.toLowerCase() === markerName.toLowerCase()
    );

    if (marker && marker.value !== null && marker.value !== undefined) {
      dataPoints.push({
        value: typeof marker.value === 'number' ? marker.value : parseFloat(marker.value),
        date: scan.test_date,
        source: 'bloodwork',
      });
    }
  }

  return dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate trend direction based on data points
 */
function calculateTrendDirection(dataPoints: DataPoint[], isLowerBetter: boolean = false): TrendDirection {
  if (dataPoints.length < 2) {
    return 'insufficient_data';
  }

  const values = dataPoints.map(dp => dp.value);
  const recent = values.slice(-3); // Last 3 values
  
  if (recent.length < 2) {
    return 'insufficient_data';
  }

  // Calculate average change
  let totalChange = 0;
  for (let i = 1; i < recent.length; i++) {
    totalChange += recent[i] - recent[i - 1];
  }
  const avgChange = totalChange / (recent.length - 1);

  // Check volatility
  const stdDev = calculateStdDev(recent);
  const mean = recent.reduce((sum, v) => sum + v, 0) / recent.length;
  const coefficientOfVariation = (stdDev / mean) * 100;

  if (coefficientOfVariation > 20) {
    return 'volatile';
  }

  // Determine direction
  const changeThreshold = mean * 0.05; // 5% threshold

  if (Math.abs(avgChange) < changeThreshold) {
    return 'stable';
  }

  if (isLowerBetter) {
    return avgChange < 0 ? 'improving' : 'declining';
  } else {
    return avgChange > 0 ? 'improving' : 'declining';
  }
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate trend confidence based on data quality
 */
function calculateTrendConfidence(dataPoints: DataPoint[]): TrendConfidence {
  if (dataPoints.length >= 5) {
    return 'high';
  } else if (dataPoints.length >= 3) {
    return 'moderate';
  } else {
    return 'low';
  }
}

/**
 * Calculate timespan between first and last data point
 */
function calculateTimespan(dataPoints: DataPoint[]): string {
  if (dataPoints.length < 2) {
    return 'insufficient data';
  }

  const firstDate = new Date(dataPoints[0].date);
  const lastDate = new Date(dataPoints[dataPoints.length - 1].date);
  const diffMs = lastDate.getTime() - firstDate.getTime();
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));

  if (diffMonths < 1) {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  } else if (diffMonths < 12) {
    return `${diffMonths} months`;
  } else {
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    return months > 0 ? `${years} years ${months} months` : `${years} years`;
  }
}

/**
 * Generate trend summary text
 */
function generateTrendSummary(analysis: TrendAnalysis, isLowerBetter: boolean = false): string {
  const { marker, direction, currentValue, previousValue, changePercent, timespan } = analysis;

  if (direction === 'insufficient_data') {
    return `${marker}: Insufficient data for trend analysis`;
  }

  if (direction === 'stable') {
    return `${marker} is ${currentValue} — stable over ${timespan}`;
  }

  if (direction === 'volatile') {
    return `${marker} is ${currentValue} — volatile over ${timespan}`;
  }

  const changeDirection = changePercent! > 0 ? 'increased' : 'decreased';
  const changeAbs = Math.abs(changePercent!);

  if (direction === 'improving') {
    return `${marker} ${changeDirection} from ${previousValue} → ${currentValue} over ${timespan} — ${isLowerBetter ? 'decreasing' : 'increasing'} trend (${changeAbs.toFixed(1)}% change)`;
  } else {
    return `${marker} ${changeDirection} from ${previousValue} → ${currentValue} over ${timespan} — ${isLowerBetter ? 'increasing' : 'decreasing'} trend (${changeAbs.toFixed(1)}% change)`;
  }
}

/**
 * Analyze bloodwork marker trend
 */
function analyzeBloodworkMarkerTrend(
  scans: BloodworkScan[],
  markerName: string,
  isLowerBetter: boolean = false
): TrendAnalysis | null {
  const dataPoints = extractMarkerHistory(scans, markerName);

  if (dataPoints.length === 0) {
    return null;
  }

  const direction = calculateTrendDirection(dataPoints, isLowerBetter);
  const confidence = calculateTrendConfidence(dataPoints);
  const timespan = calculateTimespan(dataPoints);

  const currentValue = dataPoints[dataPoints.length - 1]?.value || null;
  const previousValue = dataPoints.length > 1 ? dataPoints[0]?.value : null;

  let changePercent = null;
  let changeAbsolute = null;

  if (currentValue !== null && previousValue !== null && previousValue !== 0) {
    changeAbsolute = currentValue - previousValue;
    changePercent = ((currentValue - previousValue) / previousValue) * 100;
  }

  const analysis: TrendAnalysis = {
    marker: markerName,
    direction,
    confidence,
    currentValue,
    previousValue,
    changePercent,
    changeAbsolute,
    dataPoints,
    timespan,
    summary: '',
  };

  analysis.summary = generateTrendSummary(analysis, isLowerBetter);

  return analysis;
}

/**
 * Generate bloodwork trends for key markers
 */
async function generateBloodworkTrends(userId: string): Promise<TrendAnalysis[]> {
  const scans = await getBloodworkHistory(userId);

  if (scans.length === 0) {
    logger.info('[LONGITUDINAL] No bloodwork history available', { userId });
    return [];
  }

  logger.info('[LONGITUDINAL] Analyzing bloodwork trends', {
    userId,
    scanCount: scans.length,
  });

  const markerConfigs = [
    { name: 'A1C', isLowerBetter: true },
    { name: 'Glucose', isLowerBetter: true },
    { name: 'Triglycerides', isLowerBetter: true },
    { name: 'LDL', isLowerBetter: true },
    { name: 'HDL', isLowerBetter: false },
    { name: 'Testosterone', isLowerBetter: false },
    { name: 'Vitamin D', isLowerBetter: false },
    { name: 'B12', isLowerBetter: false },
    { name: 'Ferritin', isLowerBetter: false },
  ];

  const trends: TrendAnalysis[] = [];

  for (const config of markerConfigs) {
    const trend = analyzeBloodworkMarkerTrend(scans, config.name, config.isLowerBetter);
    if (trend && trend.direction !== 'insufficient_data') {
      trends.push(trend);
    }
  }

  logger.info('[LONGITUDINAL] Bloodwork trends generated', {
    userId,
    trendCount: trends.length,
  });

  return trends;
}

// ============================================================================
// BODY COMPOSITION TREND INTELLIGENCE
// ============================================================================

/**
 * Retrieve body composition history from database
 */
async function getBodyCompositionHistory(userId: string, limit: number = 50): Promise<BodyCompositionScan[]> {
  try {
    const { data, error } = await supabase
      .from('body_composition_scans')
      .select('*')
      .eq('user_id', userId)
      .order('scan_date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('[LONGITUDINAL] Failed to fetch body composition history', { userId, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[LONGITUDINAL] Error fetching body composition history', { userId, error: (error as Error).message });
    return [];
  }
}

/**
 * Extract body composition metric history
 */
function extractBodyCompMetricHistory(scans: BodyCompositionScan[], metricKey: string): DataPoint[] {
  const dataPoints: DataPoint[] = [];

  for (const scan of scans) {
    const value = (scan as any)[metricKey];

    if (value !== null && value !== undefined && typeof value === 'number') {
      dataPoints.push({
        value,
        date: scan.scanDate || (scan as any).scan_date,
        source: 'body_composition',
      });
    }
  }

  return dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Analyze body composition metric trend
 */
function analyzeBodyCompMetricTrend(
  scans: BodyCompositionScan[],
  metricKey: string,
  metricLabel: string,
  isLowerBetter: boolean = false
): TrendAnalysis | null {
  const dataPoints = extractBodyCompMetricHistory(scans, metricKey);

  if (dataPoints.length === 0) {
    return null;
  }

  const direction = calculateTrendDirection(dataPoints, isLowerBetter);
  const confidence = calculateTrendConfidence(dataPoints);
  const timespan = calculateTimespan(dataPoints);

  const currentValue = dataPoints[dataPoints.length - 1]?.value || null;
  const previousValue = dataPoints.length > 1 ? dataPoints[0]?.value : null;

  let changePercent = null;
  let changeAbsolute = null;

  if (currentValue !== null && previousValue !== null && previousValue !== 0) {
    changeAbsolute = currentValue - previousValue;
    changePercent = ((currentValue - previousValue) / previousValue) * 100;
  }

  const analysis: TrendAnalysis = {
    marker: metricLabel,
    direction,
    confidence,
    currentValue,
    previousValue,
    changePercent,
    changeAbsolute,
    dataPoints,
    timespan,
    summary: '',
  };

  analysis.summary = generateTrendSummary(analysis, isLowerBetter);

  return analysis;
}

/**
 * Generate body composition trends for key metrics
 */
async function generateBodyCompositionTrends(userId: string): Promise<TrendAnalysis[]> {
  const scans = await getBodyCompositionHistory(userId);

  if (scans.length === 0) {
    logger.info('[LONGITUDINAL] No body composition history available', { userId });
    return [];
  }

  logger.info('[LONGITUDINAL] Analyzing body composition trends', {
    userId,
    scanCount: scans.length,
  });

  const metricConfigs = [
    { key: 'weight_lb', label: 'Weight', isLowerBetter: false }, // Context-dependent
    { key: 'body_fat_percentage', label: 'Body Fat %', isLowerBetter: true },
    { key: 'dry_lean_mass_lb', label: 'Lean Mass', isLowerBetter: false },
    { key: 'visceral_fat_level', label: 'Visceral Fat', isLowerBetter: true },
    { key: 'skeletal_muscle_mass_lb', label: 'Skeletal Muscle Mass', isLowerBetter: false },
  ];

  const trends: TrendAnalysis[] = [];

  for (const config of metricConfigs) {
    const trend = analyzeBodyCompMetricTrend(scans, config.key, config.label, config.isLowerBetter);
    if (trend && trend.direction !== 'insufficient_data') {
      trends.push(trend);
    }
  }

  logger.info('[LONGITUDINAL] Body composition trends generated', {
    userId,
    trendCount: trends.length,
  });

  return trends;
}

// ============================================================================
// PREDICTION SIGNALS (Simple Linear Projection)
// ============================================================================

/**
 * Generate simple linear prediction
 */
function generateSimpleLinearPrediction(
  dataPoints: DataPoint[],
  markerName: string,
  timeframeMonths: number = 3
): PredictionSignal | null {
  if (dataPoints.length < 3) {
    return null;
  }

  // Use last 3-5 data points for prediction
  const recentPoints = dataPoints.slice(-5);
  
  // Simple linear regression
  const n = recentPoints.length;
  const dates = recentPoints.map(dp => new Date(dp.date).getTime());
  const values = recentPoints.map(dp => dp.value);

  const sumX = dates.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = dates.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = dates.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Project forward
  const currentDate = new Date(recentPoints[recentPoints.length - 1].date).getTime();
  const futureDate = currentDate + (timeframeMonths * 30 * 24 * 60 * 60 * 1000);
  const predictedValue = slope * futureDate + intercept;

  const currentValue = recentPoints[recentPoints.length - 1].value;
  const confidence = calculateTrendConfidence(recentPoints);

  return {
    marker: markerName,
    predictedValue: Math.round(predictedValue * 100) / 100,
    currentValue,
    timeframe: `${timeframeMonths} months`,
    confidence,
    basis: `Based on ${n} recent data points`,
  };
}

/**
 * Generate prediction signals for improving/declining trends
 */
function generatePredictionSignals(trends: TrendAnalysis[]): PredictionSignal[] {
  const predictions: PredictionSignal[] = [];

  for (const trend of trends) {
    if (trend.direction === 'improving' || trend.direction === 'declining') {
      const prediction = generateSimpleLinearPrediction(trend.dataPoints, trend.marker, 3);
      if (prediction) {
        predictions.push(prediction);
      }
    }
  }

  return predictions;
}

// ============================================================================
// LONGITUDINAL SIGNALS
// ============================================================================

/**
 * Generate improvement signals from trends
 */
function generateImprovementSignals(
  bloodworkTrends: TrendAnalysis[],
  bodyCompTrends: TrendAnalysis[]
): LongitudinalSignal[] {
  const signals: LongitudinalSignal[] = [];

  for (const trend of bloodworkTrends) {
    if (trend.direction === 'improving') {
      signals.push({
        id: `improvement-bloodwork-${trend.marker.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'improvement',
        category: 'bloodwork',
        title: `${trend.marker} Improving`,
        description: trend.summary,
        confidence: trend.confidence,
        dataPoints: trend.dataPoints.length,
        timespan: trend.timespan,
      });
    }
  }

  for (const trend of bodyCompTrends) {
    if (trend.direction === 'improving') {
      signals.push({
        id: `improvement-bodycomp-${trend.marker.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'improvement',
        category: 'body_composition',
        title: `${trend.marker} Improving`,
        description: trend.summary,
        confidence: trend.confidence,
        dataPoints: trend.dataPoints.length,
        timespan: trend.timespan,
      });
    }
  }

  return signals;
}

/**
 * Generate decline signals from trends
 */
function generateDeclineSignals(
  bloodworkTrends: TrendAnalysis[],
  bodyCompTrends: TrendAnalysis[]
): LongitudinalSignal[] {
  const signals: LongitudinalSignal[] = [];

  for (const trend of bloodworkTrends) {
    if (trend.direction === 'declining') {
      signals.push({
        id: `decline-bloodwork-${trend.marker.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'decline',
        category: 'bloodwork',
        title: `${trend.marker} Declining`,
        description: trend.summary,
        confidence: trend.confidence,
        dataPoints: trend.dataPoints.length,
        timespan: trend.timespan,
      });
    }
  }

  for (const trend of bodyCompTrends) {
    if (trend.direction === 'declining') {
      signals.push({
        id: `decline-bodycomp-${trend.marker.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'decline',
        category: 'body_composition',
        title: `${trend.marker} Declining`,
        description: trend.summary,
        confidence: trend.confidence,
        dataPoints: trend.dataPoints.length,
        timespan: trend.timespan,
      });
    }
  }

  return signals;
}

// ============================================================================
// MAIN LONGITUDINAL INTELLIGENCE FUNCTION
// ============================================================================

/**
 * Get longitudinal intelligence context for a user
 */
export async function getLongitudinalIntelligenceContext(
  userId: string
): Promise<LongitudinalIntelligenceContext> {
  try {
    logger.info('🔵 [LONGITUDINAL] Starting longitudinal intelligence analysis', { userId });

    // Generate trends
    const bloodworkTrends = await generateBloodworkTrends(userId);
    const bodyCompositionTrends = await generateBodyCompositionTrends(userId);

    // Generate signals
    const improvementSignals = generateImprovementSignals(bloodworkTrends, bodyCompositionTrends);
    const declineSignals = generateDeclineSignals(bloodworkTrends, bodyCompositionTrends);

    // Generate predictions
    const allTrends = [...bloodworkTrends, ...bodyCompositionTrends];
    const predictionSignals = generatePredictionSignals(allTrends);

    // Calculate summary metrics
    const totalTrends = allTrends.length;
    const improvingTrends = allTrends.filter(t => t.direction === 'improving').length;
    const decliningTrends = allTrends.filter(t => t.direction === 'declining').length;

    // Calculate data completeness
    const bloodworkDataPoints = bloodworkTrends.reduce((sum, t) => sum + t.dataPoints.length, 0);
    const bodyCompDataPoints = bodyCompositionTrends.reduce((sum, t) => sum + t.dataPoints.length, 0);
    
    const hasBloodworkHistory = bloodworkTrends.length > 0;
    const hasBodyCompositionHistory = bodyCompositionTrends.length > 0;
    
    let completenessScore = 0;
    if (hasBloodworkHistory) completenessScore += 50;
    if (hasBodyCompositionHistory) completenessScore += 50;

    const context: LongitudinalIntelligenceContext = {
      userId,
      timestamp: new Date().toISOString(),
      bloodworkTrends,
      bodyCompositionTrends,
      improvementSignals,
      declineSignals,
      predictionSignals,
      totalTrends,
      improvingTrends,
      decliningTrends,
      dataCompleteness: {
        hasBloodworkHistory,
        hasBodyCompositionHistory,
        bloodworkDataPoints,
        bodyCompositionDataPoints: bodyCompDataPoints,
        completenessScore,
      },
    };

    logger.info('✅ [LONGITUDINAL] Longitudinal intelligence analysis complete', {
      userId,
      totalTrends,
      improvingTrends,
      decliningTrends,
      improvementSignals: improvementSignals.length,
      declineSignals: declineSignals.length,
      predictionSignals: predictionSignals.length,
      completenessScore,
    });

    return context;
  } catch (error) {
    logger.error('❌ [LONGITUDINAL] Failed to generate longitudinal intelligence', {
      userId,
      error: (error as Error).message,
    });

    // Fallback: return empty context
    return {
      userId,
      timestamp: new Date().toISOString(),
      bloodworkTrends: [],
      bodyCompositionTrends: [],
      improvementSignals: [],
      declineSignals: [],
      predictionSignals: [],
      totalTrends: 0,
      improvingTrends: 0,
      decliningTrends: 0,
      dataCompleteness: {
        hasBloodworkHistory: false,
        hasBodyCompositionHistory: false,
        bloodworkDataPoints: 0,
        bodyCompositionDataPoints: 0,
        completenessScore: 0,
      },
    };
  }
}

/**
 * Get trend for specific marker
 */
export async function getMarkerTrend(
  userId: string,
  markerName: string,
  category: 'bloodwork' | 'body_composition'
): Promise<TrendAnalysis | null> {
  try {
    if (category === 'bloodwork') {
      const scans = await getBloodworkHistory(userId);
      return analyzeBloodworkMarkerTrend(scans, markerName, false);
    } else {
      const scans = await getBodyCompositionHistory(userId);
      // Map common names to database keys
      const keyMap: Record<string, string> = {
        'weight': 'weight_lb',
        'body fat': 'body_fat_percentage',
        'lean mass': 'dry_lean_mass_lb',
        'visceral fat': 'visceral_fat_level',
        'skeletal muscle': 'skeletal_muscle_mass_lb',
      };
      const key = keyMap[markerName.toLowerCase()] || markerName;
      return analyzeBodyCompMetricTrend(scans, key, markerName, false);
    }
  } catch (error) {
    logger.error('[LONGITUDINAL] Failed to get marker trend', {
      userId,
      markerName,
      category,
      error: (error as Error).message,
    });
    return null;
  }
}

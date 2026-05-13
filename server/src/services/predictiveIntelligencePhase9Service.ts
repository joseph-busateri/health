import { logger } from '../utils/logger';
import { getLongitudinalIntelligenceContext, type TrendAnalysis } from './longitudinalIntelligenceService';
import { getGoalWeightedIntelligenceContext, type UserGoal, type GoalProgress } from './goalWeightedIntelligenceService';
import { getAdaptiveIntelligenceContext } from './adaptiveIntelligencePhase7Service';
import { getDevicePredictiveSignals } from './deviceIntelligenceIntegrationService';

/**
 * Predictive Intelligence Service - Phase 9
 * 
 * Purpose: Enable forward-looking health intelligence with rule-based projections
 * - Projects future health metrics
 * - Predicts risks
 * - Predicts goal achievement
 * - Detects plateaus
 * - Predicts decline
 * 
 * This is rule-based predictive intelligence - no ML models
 * Uses linear projection from longitudinal trends
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProjectionTimeframe = '7_days' | '30_days' | '90_days';
export type PredictionConfidence = 'high' | 'moderate' | 'low';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type PlateauStatus = 'none' | 'approaching' | 'plateau';
export type DeclineStatus = 'none' | 'mild' | 'moderate' | 'severe';

export interface MetricProjection {
  metric: string;
  category: 'bloodwork' | 'body_composition';
  current: number;
  projected7Days: number | null;
  projected30Days: number | null;
  projected90Days: number | null;
  unit: string;
  direction: 'improving' | 'declining' | 'stable';
  confidence: PredictionConfidence;
  projectionMethod: 'linear' | 'insufficient_data';
  dataPoints: number;
  changeRate: number | null; // Change per day
}

export interface RiskPrediction {
  id: string;
  riskType: 'metabolic' | 'cardiovascular' | 'hormonal' | 'recovery' | 'body_composition';
  riskLevel: RiskLevel;
  description: string;
  evidence: string[];
  timeframe: ProjectionTimeframe;
  confidence: PredictionConfidence;
  recommendation: string;
}

export interface GoalPrediction {
  goal: string;
  goalCategory: string;
  currentProgress: number; // 0-100
  projectedCompletion: string | null; // Date or "Not achievable at current rate"
  daysToGoal: number | null;
  onTrack: boolean;
  confidence: PredictionConfidence;
  evidence: string[];
  recommendation: string;
}

export interface PlateauPrediction {
  metric: string;
  category: 'bloodwork' | 'body_composition';
  status: PlateauStatus;
  description: string;
  evidence: string[];
  recommendation: string;
}

export interface DeclinePrediction {
  metric: string;
  category: 'bloodwork' | 'body_composition' | 'recovery';
  status: DeclineStatus;
  description: string;
  evidence: string[];
  projectedImpact: string;
  recommendation: string;
}

export interface PredictiveIntelligenceContext {
  userId: string;
  timestamp: string;
  
  // Projections
  projections: MetricProjection[];
  
  // Risk predictions
  riskPredictions: RiskPrediction[];
  
  // Goal predictions
  goalPredictions: GoalPrediction[];
  
  // Plateau predictions
  plateauPredictions: PlateauPrediction[];
  
  // Decline predictions
  declinePredictions: DeclinePrediction[];
  
  // Prediction confidence
  predictionConfidence: {
    overall: PredictionConfidence;
    bloodwork: PredictionConfidence;
    bodyComposition: PredictionConfidence;
    goals: PredictionConfidence;
  };
  
  // Summary metrics
  totalProjections: number;
  highConfidenceProjections: number;
  upcomingRisks: number;
  goalsOnTrack: number;
  plateausDetected: number;
  declinesDetected: number;
  
  // Data completeness
  dataCompleteness: {
    hasLongitudinalData: boolean;
    hasGoalData: boolean;
    hasAdaptiveData: boolean;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// PROJECTION LOGIC
// ============================================================================

/**
 * Calculate linear projection for a metric
 */
function calculateLinearProjection(
  trend: TrendAnalysis,
  timeframeDays: number
): number | null {
  if (!trend.changePercent || trend.dataPoints.length < 2) {
    return null;
  }
  
  // Get first and last data points
  const firstPoint = trend.dataPoints[0];
  const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
  
  // Calculate days between first and last
  const firstDate = new Date(firstPoint.date);
  const lastDate = new Date(lastPoint.date);
  const daysBetween = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate rate of change per day
  const totalChange = lastPoint.value - firstPoint.value;
  const changePerDay = totalChange / daysBetween;
  
  // Project forward
  const projected = lastPoint.value + (changePerDay * timeframeDays);
  
  return projected;
}

/**
 * Determine projection confidence based on data quality
 */
function determineProjectionConfidence(trend: TrendAnalysis): PredictionConfidence {
  const dataPoints = trend.dataPoints.length;
  const trendConfidence = trend.confidence;
  
  // High confidence: 5+ data points, high trend confidence
  if (dataPoints >= 5 && trendConfidence === 'high') {
    return 'high';
  }
  
  // Moderate confidence: 3-4 data points, moderate+ trend confidence
  if (dataPoints >= 3 && (trendConfidence === 'high' || trendConfidence === 'moderate')) {
    return 'moderate';
  }
  
  // Low confidence: 2 data points or low trend confidence
  return 'low';
}

/**
 * Generate metric projections from longitudinal trends
 */
function generateMetricProjections(
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): MetricProjection[] {
  const projections: MetricProjection[] = [];
  
  // Project bloodwork metrics
  for (const trend of longitudinalContext.bloodworkTrends) {
    if (trend.dataPoints.length < 2) {
      continue;
    }
    
    const current = trend.dataPoints[trend.dataPoints.length - 1].value;
    const projected7Days = calculateLinearProjection(trend, 7);
    const projected30Days = calculateLinearProjection(trend, 30);
    const projected90Days = calculateLinearProjection(trend, 90);
    
    // Calculate change rate per day
    const firstPoint = trend.dataPoints[0];
    const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
    const firstDate = new Date(firstPoint.date);
    const lastDate = new Date(lastPoint.date);
    const daysBetween = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const changeRate = (lastPoint.value - firstPoint.value) / daysBetween;
    
    projections.push({
      metric: trend.marker,
      category: 'bloodwork',
      current,
      projected7Days,
      projected30Days,
      projected90Days,
      unit: (trend as any).unit || '',
      direction: trend.direction as any,
      confidence: determineProjectionConfidence(trend),
      projectionMethod: 'linear',
      dataPoints: trend.dataPoints.length,
      changeRate,
    });
  }
  
  // Project body composition metrics
  for (const trend of longitudinalContext.bodyCompositionTrends) {
    if (trend.dataPoints.length < 2) {
      continue;
    }
    
    const current = trend.dataPoints[trend.dataPoints.length - 1].value;
    const projected7Days = calculateLinearProjection(trend, 7);
    const projected30Days = calculateLinearProjection(trend, 30);
    const projected90Days = calculateLinearProjection(trend, 90);
    
    // Calculate change rate per day
    const firstPoint = trend.dataPoints[0];
    const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
    const firstDate = new Date(firstPoint.date);
    const lastDate = new Date(lastPoint.date);
    const daysBetween = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const changeRate = (lastPoint.value - firstPoint.value) / daysBetween;
    
    projections.push({
      metric: trend.marker,
      category: 'body_composition',
      current,
      projected7Days,
      projected30Days,
      projected90Days,
      unit: (trend as any).unit || '',
      direction: trend.direction as any,
      confidence: determineProjectionConfidence(trend),
      projectionMethod: 'linear',
      dataPoints: trend.dataPoints.length,
      changeRate,
    });
  }
  
  return projections;
}

// ============================================================================
// PLATEAU DETECTION
// ============================================================================

/**
 * Detect plateau in trend (flattening trajectory)
 */
function detectPlateau(trend: TrendAnalysis): PlateauStatus {
  if (trend.dataPoints.length < 3) {
    return 'none';
  }
  
  // Get last 3 data points
  const recentPoints = trend.dataPoints.slice(-3);
  
  // Calculate changes between consecutive points
  const changes: number[] = [];
  for (let i = 1; i < recentPoints.length; i++) {
    const change = Math.abs(recentPoints[i].value - recentPoints[i - 1].value);
    changes.push(change);
  }
  
  // Calculate average change
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  
  // Get typical change from full trend
  const firstPoint = trend.dataPoints[0];
  const lastPoint = trend.dataPoints[trend.dataPoints.length - 1];
  const totalChange = Math.abs(lastPoint.value - firstPoint.value);
  const avgChangeOverall = totalChange / (trend.dataPoints.length - 1);
  
  // Plateau if recent change is < 25% of overall average change
  if (avgChange < avgChangeOverall * 0.25) {
    return 'plateau';
  }
  
  // Approaching plateau if recent change is < 50% of overall average change
  if (avgChange < avgChangeOverall * 0.5) {
    return 'approaching';
  }
  
  return 'none';
}

/**
 * Generate plateau predictions
 */
function generatePlateauPredictions(
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): PlateauPrediction[] {
  const predictions: PlateauPrediction[] = [];
  
  // Check bloodwork trends
  for (const trend of longitudinalContext.bloodworkTrends) {
    const status = detectPlateau(trend);
    
    if (status !== 'none') {
      predictions.push({
        metric: trend.marker,
        category: 'bloodwork',
        status,
        description: status === 'plateau' ?
          `${trend.marker} has plateaued — minimal change in recent measurements` :
          `${trend.marker} is approaching a plateau — rate of change slowing`,
        evidence: [trend.summary],
        recommendation: status === 'plateau' ?
          `Consider adjusting intervention strategy for ${trend.marker}` :
          `Monitor ${trend.marker} closely — may need intervention adjustment soon`,
      });
    }
  }
  
  // Check body composition trends
  for (const trend of longitudinalContext.bodyCompositionTrends) {
    const status = detectPlateau(trend);
    
    if (status !== 'none') {
      predictions.push({
        metric: trend.marker,
        category: 'body_composition',
        status,
        description: status === 'plateau' ?
          `${trend.marker} has plateaued — minimal change in recent measurements` :
          `${trend.marker} is approaching a plateau — rate of change slowing`,
        evidence: [trend.summary],
        recommendation: status === 'plateau' ?
          `Consider progressive overload or training variation for ${trend.marker}` :
          `Monitor ${trend.marker} closely — may need training adjustment soon`,
      });
    }
  }
  
  return predictions;
}

// ============================================================================
// DECLINE PREDICTION
// ============================================================================

/**
 * Detect decline severity
 */
function detectDeclineSeverity(trend: TrendAnalysis): DeclineStatus {
  if (trend.direction !== 'declining') {
    return 'none';
  }
  
  if (!trend.changePercent) {
    return 'none';
  }
  
  const absChangePercent = Math.abs(trend.changePercent);
  
  // Severe: >20% decline
  if (absChangePercent > 20) {
    return 'severe';
  }
  
  // Moderate: 10-20% decline
  if (absChangePercent > 10) {
    return 'moderate';
  }
  
  // Mild: 5-10% decline
  if (absChangePercent > 5) {
    return 'mild';
  }
  
  return 'none';
}

/**
 * Generate decline predictions
 */
function generateDeclinePredictions(
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): DeclinePrediction[] {
  const predictions: DeclinePrediction[] = [];
  
  // Check bloodwork trends for decline
  for (const trend of longitudinalContext.bloodworkTrends) {
    const status = detectDeclineSeverity(trend);
    
    if (status !== 'none') {
      predictions.push({
        metric: trend.marker,
        category: 'bloodwork',
        status,
        description: `${trend.marker} is declining — ${trend.summary}`,
        evidence: [trend.summary],
        projectedImpact: status === 'severe' ?
          `Significant health risk if decline continues` :
          status === 'moderate' ?
          `Moderate health impact if decline continues` :
          `Mild health impact — monitor closely`,
        recommendation: status === 'severe' ?
          `Urgent: Consult healthcare provider about ${trend.marker} decline` :
          status === 'moderate' ?
          `Important: Address ${trend.marker} decline with intervention` :
          `Monitor ${trend.marker} and consider preventive action`,
      });
    }
  }
  
  // Check body composition trends for decline
  for (const trend of longitudinalContext.bodyCompositionTrends) {
    const status = detectDeclineSeverity(trend);
    
    if (status !== 'none') {
      predictions.push({
        metric: trend.marker,
        category: 'body_composition',
        status,
        description: `${trend.marker} is declining — ${trend.summary}`,
        evidence: [trend.summary],
        projectedImpact: status === 'severe' ?
          `Significant body composition impact if decline continues` :
          status === 'moderate' ?
          `Moderate body composition impact if decline continues` :
          `Mild impact — monitor closely`,
        recommendation: status === 'severe' ?
          `Urgent: Adjust training and nutrition to address ${trend.marker} decline` :
          status === 'moderate' ?
          `Important: Modify training approach for ${trend.marker}` :
          `Monitor ${trend.marker} and consider training adjustment`,
      });
    }
  }
  
  return predictions;
}

// ============================================================================
// RISK PREDICTION
// ============================================================================

/**
 * Predict metabolic risk
 */
function predictMetabolicRisk(projections: MetricProjection[]): RiskPrediction | null {
  const a1cProjection = projections.find(p => p.metric.toLowerCase().includes('a1c'));
  const glucoseProjection = projections.find(p => p.metric.toLowerCase().includes('glucose'));
  
  const evidence: string[] = [];
  let riskLevel: RiskLevel = 'low';
  
  // Check A1C projection
  if (a1cProjection && a1cProjection.projected90Days) {
    if (a1cProjection.direction === 'declining' && a1cProjection.projected90Days > 6.5) {
      riskLevel = 'high';
      evidence.push(`A1C projected to be ${a1cProjection.projected90Days.toFixed(1)} in 90 days (diabetic range)`);
    } else if (a1cProjection.direction === 'declining' && a1cProjection.projected90Days > 5.7) {
      riskLevel = 'moderate';
      evidence.push(`A1C projected to be ${a1cProjection.projected90Days.toFixed(1)} in 90 days (prediabetic range)`);
    } else if (a1cProjection.direction === 'improving') {
      evidence.push(`A1C projected to improve to ${a1cProjection.projected90Days.toFixed(1)} in 90 days`);
    }
  }
  
  // Check glucose projection
  if (glucoseProjection && glucoseProjection.projected90Days) {
    if (glucoseProjection.direction === 'declining' && glucoseProjection.projected90Days > 125) {
      riskLevel = Math.max(riskLevel === 'low' ? 0 : riskLevel === 'moderate' ? 1 : 2, 1) === 2 ? 'high' : 'moderate' as RiskLevel;
      evidence.push(`Fasting glucose projected to be ${glucoseProjection.projected90Days.toFixed(0)} in 90 days (elevated)`);
    }
  }
  
  if (evidence.length === 0) {
    return null;
  }
  
  return {
    id: `risk-metabolic-${Date.now()}`,
    riskType: 'metabolic',
    riskLevel,
    description: riskLevel === 'high' ?
      'High metabolic risk detected based on projected trends' :
      'Moderate metabolic risk detected based on projected trends',
    evidence,
    timeframe: '90_days',
    confidence: a1cProjection?.confidence || 'moderate',
    recommendation: riskLevel === 'high' ?
      'Urgent: Consult healthcare provider. Implement aggressive metabolic interventions.' :
      'Important: Implement metabolic health interventions to reverse trend.',
  };
}

/**
 * Predict cardiovascular risk
 */
function predictCardiovascularRisk(projections: MetricProjection[]): RiskPrediction | null {
  const ldlProjection = projections.find(p => p.metric.toLowerCase().includes('ldl'));
  const triglyceridesProjection = projections.find(p => p.metric.toLowerCase().includes('triglyceride'));
  
  const evidence: string[] = [];
  let riskLevel: RiskLevel = 'low';
  
  // Check LDL projection
  if (ldlProjection && ldlProjection.projected90Days) {
    if (ldlProjection.direction === 'declining' && ldlProjection.projected90Days > 160) {
      riskLevel = 'high';
      evidence.push(`LDL projected to be ${ldlProjection.projected90Days.toFixed(0)} in 90 days (high risk)`);
    } else if (ldlProjection.direction === 'declining' && ldlProjection.projected90Days > 130) {
      riskLevel = 'moderate';
      evidence.push(`LDL projected to be ${ldlProjection.projected90Days.toFixed(0)} in 90 days (borderline high)`);
    }
  }
  
  // Check triglycerides projection
  if (triglyceridesProjection && triglyceridesProjection.projected90Days) {
    if (triglyceridesProjection.direction === 'declining' && triglyceridesProjection.projected90Days > 200) {
      riskLevel = Math.max(riskLevel === 'low' ? 0 : riskLevel === 'moderate' ? 1 : 2, 1) === 2 ? 'high' : 'moderate' as RiskLevel;
      evidence.push(`Triglycerides projected to be ${triglyceridesProjection.projected90Days.toFixed(0)} in 90 days (high)`);
    }
  }
  
  if (evidence.length === 0) {
    return null;
  }
  
  return {
    id: `risk-cardiovascular-${Date.now()}`,
    riskType: 'cardiovascular',
    riskLevel,
    description: riskLevel === 'high' ?
      'High cardiovascular risk detected based on projected trends' :
      'Moderate cardiovascular risk detected based on projected trends',
    evidence,
    timeframe: '90_days',
    confidence: ldlProjection?.confidence || 'moderate',
    recommendation: riskLevel === 'high' ?
      'Urgent: Consult healthcare provider. Implement cardiovascular interventions.' :
      'Important: Implement cardiovascular health interventions.',
  };
}

/**
 * Generate risk predictions
 */
function generateRiskPredictions(projections: MetricProjection[]): RiskPrediction[] {
  const predictions: RiskPrediction[] = [];
  
  const metabolicRisk = predictMetabolicRisk(projections);
  if (metabolicRisk) {
    predictions.push(metabolicRisk);
  }
  
  const cardiovascularRisk = predictCardiovascularRisk(projections);
  if (cardiovascularRisk) {
    predictions.push(cardiovascularRisk);
  }
  
  return predictions;
}

// ============================================================================
// GOAL ACHIEVEMENT PREDICTION
// ============================================================================

/**
 * Predict goal achievement based on current progress
 */
function predictGoalAchievement(
  goal: UserGoal,
  goalProgress: GoalProgress | undefined,
  projections: MetricProjection[]
): GoalPrediction | null {
  if (!goalProgress || goalProgress.status === 'insufficient_data') {
    return null;
  }
  
  const evidence: string[] = goalProgress.evidence;
  
  // Determine if on track
  const onTrack = goalProgress.status === 'improving';
  
  // Estimate days to goal (simplified)
  let daysToGoal: number | null = null;
  let projectedCompletion: string | null = null;
  
  if (onTrack && goalProgress.metrics.length > 0) {
    // Find relevant projection
    const relevantMetric = goalProgress.metrics[0];
    const projection = projections.find(p => 
      p.metric.toLowerCase().includes(relevantMetric.marker.toLowerCase())
    );
    
    if (projection && projection.changeRate && Math.abs(projection.changeRate) > 0.001) {
      // Estimate based on change rate (simplified)
      // This is a rough estimate - would need goal targets for accurate prediction
      daysToGoal = 90; // Placeholder
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + daysToGoal);
      projectedCompletion = completionDate.toISOString().split('T')[0];
    }
  }
  
  return {
    goal: goal.description,
    goalCategory: goal.category,
    currentProgress: onTrack ? 60 : 30, // Simplified progress estimate
    projectedCompletion: onTrack ? projectedCompletion : 'Not achievable at current rate',
    daysToGoal: onTrack ? daysToGoal : null,
    onTrack,
    confidence: goalProgress.confidence as PredictionConfidence,
    evidence,
    recommendation: onTrack ?
      `Continue current approach — ${goal.category} goal is on track` :
      `Adjust strategy — ${goal.category} goal not progressing as expected`,
  };
}

/**
 * Generate goal predictions
 */
function generateGoalPredictions(
  goals: UserGoal[],
  goalProgressList: GoalProgress[],
  projections: MetricProjection[]
): GoalPrediction[] {
  const predictions: GoalPrediction[] = [];
  
  for (const goal of goals) {
    const goalProgress = goalProgressList.find(gp => gp.goal === goal.category);
    const prediction = predictGoalAchievement(goal, goalProgress, projections);
    
    if (prediction) {
      predictions.push(prediction);
    }
  }
  
  return predictions;
}

// ============================================================================
// MAIN PREDICTIVE INTELLIGENCE FUNCTION
// ============================================================================

/**
 * Get predictive intelligence context for a user
 */
export async function getPredictiveIntelligenceContext(
  userId: string
): Promise<PredictiveIntelligenceContext> {
  try {
    logger.info('🔵 [PREDICTIVE] Starting predictive intelligence analysis', { userId });
    
    // Load intelligence contexts
    const [longitudinalContext, goalContext] = await Promise.all([
      getLongitudinalIntelligenceContext(userId),
      getGoalWeightedIntelligenceContext(userId),
    ]);
    
    logger.info('✅ [PREDICTIVE] Intelligence contexts loaded', {
      userId,
      bloodworkTrends: longitudinalContext.bloodworkTrends.length,
      bodyCompositionTrends: longitudinalContext.bodyCompositionTrends.length,
      goals: goalContext.goals.length,
    });
    
    // Generate metric projections
    const projections = generateMetricProjections(longitudinalContext);
    
    logger.info('✅ [PREDICTIVE] Projections created', {
      userId,
      totalProjections: projections.length,
      highConfidence: projections.filter(p => p.confidence === 'high').length,
    });
    
    // Generate plateau predictions
    const plateauPredictions = generatePlateauPredictions(longitudinalContext);
    
    // Generate decline predictions
    const declinePredictions = generateDeclinePredictions(longitudinalContext);
    
    // Generate risk predictions
    const riskPredictions = generateRiskPredictions(projections);
    
    logger.info('✅ [PREDICTIVE] Risk predictions generated', {
      userId,
      riskCount: riskPredictions.length,
      highRisk: riskPredictions.filter(r => r.riskLevel === 'high').length,
    });
    
    // Generate goal predictions
    const goalPredictions = generateGoalPredictions(
      goalContext.goals,
      goalContext.goalProgress,
      projections
    );
    
    logger.info('✅ [PREDICTIVE] Goal predictions generated', {
      userId,
      goalPredictions: goalPredictions.length,
      onTrack: goalPredictions.filter(g => g.onTrack).length,
    });
    
    // Calculate prediction confidence
    const bloodworkProjections = projections.filter(p => p.category === 'bloodwork');
    const bodyCompositionProjections = projections.filter(p => p.category === 'body_composition');
    
    const bloodworkConfidence = bloodworkProjections.length > 0 ?
      (bloodworkProjections.filter(p => p.confidence === 'high').length / bloodworkProjections.length > 0.5 ? 'high' :
       bloodworkProjections.filter(p => p.confidence !== 'low').length / bloodworkProjections.length > 0.5 ? 'moderate' : 'low') :
      'low' as PredictionConfidence;
    
    const bodyCompositionConfidence = bodyCompositionProjections.length > 0 ?
      (bodyCompositionProjections.filter(p => p.confidence === 'high').length / bodyCompositionProjections.length > 0.5 ? 'high' :
       bodyCompositionProjections.filter(p => p.confidence !== 'low').length / bodyCompositionProjections.length > 0.5 ? 'moderate' : 'low') :
      'low' as PredictionConfidence;
    
    const goalsConfidence = goalPredictions.length > 0 ?
      (goalPredictions.filter(g => g.confidence === 'high').length / goalPredictions.length > 0.5 ? 'high' :
       goalPredictions.filter(g => g.confidence !== 'low').length / goalPredictions.length > 0.5 ? 'moderate' : 'low') :
      'low' as PredictionConfidence;
    
    const overallConfidence = 
      [bloodworkConfidence, bodyCompositionConfidence, goalsConfidence].filter(c => c === 'high').length >= 2 ? 'high' :
      [bloodworkConfidence, bodyCompositionConfidence, goalsConfidence].filter(c => c !== 'low').length >= 2 ? 'moderate' : 'low';
    
    // Calculate data completeness
    const hasLongitudinalData = longitudinalContext.totalTrends > 0;
    const hasGoalData = goalContext.totalGoals > 0;
    const hasAdaptiveData = true; // Assume available
    
    let completenessScore = 0;
    if (hasLongitudinalData) completenessScore += 50;
    if (hasGoalData) completenessScore += 30;
    if (hasAdaptiveData) completenessScore += 20;
    
    const context: PredictiveIntelligenceContext = {
      userId,
      timestamp: new Date().toISOString(),
      projections,
      riskPredictions,
      goalPredictions,
      plateauPredictions,
      declinePredictions,
      predictionConfidence: {
        overall: overallConfidence,
        bloodwork: bloodworkConfidence,
        bodyComposition: bodyCompositionConfidence,
        goals: goalsConfidence,
      },
      totalProjections: projections.length,
      highConfidenceProjections: projections.filter(p => p.confidence === 'high').length,
      upcomingRisks: riskPredictions.length,
      goalsOnTrack: goalPredictions.filter(g => g.onTrack).length,
      plateausDetected: plateauPredictions.filter(p => p.status === 'plateau').length,
      declinesDetected: declinePredictions.filter(d => d.status !== 'none').length,
      dataCompleteness: {
        hasLongitudinalData,
        hasGoalData,
        hasAdaptiveData,
        completenessScore,
      },
    };
    
    logger.info('✅ [PREDICTIVE] Predictive intelligence analysis complete', {
      userId,
      totalProjections: projections.length,
      upcomingRisks: riskPredictions.length,
      goalsOnTrack: goalPredictions.filter(g => g.onTrack).length,
      plateausDetected: plateauPredictions.filter(p => p.status === 'plateau').length,
      declinesDetected: declinePredictions.filter(d => d.status !== 'none').length,
      overallConfidence,
    });
    
    return context;
  } catch (error) {
    logger.error('❌ [PREDICTIVE] Failed to generate predictive intelligence', {
      userId,
      error: (error as Error).message,
    });
    
    // Fallback: return empty context
    return {
      userId,
      timestamp: new Date().toISOString(),
      projections: [],
      riskPredictions: [],
      goalPredictions: [],
      plateauPredictions: [],
      declinePredictions: [],
      predictionConfidence: {
        overall: 'low',
        bloodwork: 'low',
        bodyComposition: 'low',
        goals: 'low',
      },
      totalProjections: 0,
      highConfidenceProjections: 0,
      upcomingRisks: 0,
      goalsOnTrack: 0,
      plateausDetected: 0,
      declinesDetected: 0,
      dataCompleteness: {
        hasLongitudinalData: false,
        hasGoalData: false,
        hasAdaptiveData: false,
        completenessScore: 0,
      },
    };
  }
}

/**
 * Get upcoming risks
 */
export async function getUpcomingRisks(userId: string): Promise<RiskPrediction[]> {
  const context = await getPredictiveIntelligenceContext(userId);
  return context.riskPredictions;
}

/**
 * Get projected improvements
 */
export async function getProjectedImprovements(userId: string): Promise<MetricProjection[]> {
  const context = await getPredictiveIntelligenceContext(userId);
  return context.projections.filter(p => p.direction === 'improving');
}

/**
 * Get goal progress forecast
 */
export async function getGoalProgressForecast(userId: string): Promise<GoalPrediction[]> {
  const context = await getPredictiveIntelligenceContext(userId);
  return context.goalPredictions;
}

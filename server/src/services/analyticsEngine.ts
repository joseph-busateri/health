// Advanced Analytics Engine
// Correlation analysis, trend predictions, and insights generation

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface CorrelationResult {
  metricA: string;
  metricB: string;
  coefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  sampleSize: number;
  pValue: number;
  insight: string;
  recommendation: string;
}

export interface TrendPrediction {
  metricName: string;
  currentValue: number;
  currentTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendPercentage: number;
  predicted7Day: number;
  predicted30Day: number;
  predicted90Day: number;
  confidence: number;
  daysToGoal?: number;
  goalAchievable: boolean;
  summary: string;
  recommendation: string;
}

export interface HealthInsight {
  id?: string;
  type: 'correlation' | 'trend' | 'anomaly' | 'achievement' | 'warning';
  category: 'sleep' | 'recovery' | 'performance' | 'nutrition' | 'overall';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  detailedAnalysis?: string;
  primaryRecommendation: string;
  secondaryRecommendations?: string[];
  supportingMetrics?: any;
  potentialImpact: 'high' | 'medium' | 'low';
  affectedAreas: string[];
}

export interface GoalProgress {
  goalType: string;
  targetMetric: string;
  startingValue: number;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  progressStatus: 'on_track' | 'ahead' | 'behind' | 'stalled';
  daysElapsed: number;
  daysRemaining: number;
  requiredWeeklyChange: number;
  actualWeeklyChange: number;
  predictedCompletionDate: string;
  likelihoodOfSuccess: number;
  recommendations: string[];
}

export class AnalyticsEngine {
  
  /**
   * Analyze correlation between two metrics
   */
  async analyzeCorrelation(
    userId: string,
    metricA: string,
    metricB: string,
    days: number = 30
  ): Promise<CorrelationResult> {
    try {
      // Fetch data for both metrics
      const dataA = await this.getMetricData(userId, metricA, days);
      const dataB = await this.getMetricData(userId, metricB, days);

      // Calculate Pearson correlation coefficient
      const correlation = this.calculatePearsonCorrelation(dataA, dataB);
      const pValue = this.calculatePValue(correlation, dataA.length);

      // Determine strength and direction
      const strength = this.determineCorrelationStrength(correlation);
      const direction = this.determineCorrelationDirection(correlation);

      // Generate insight and recommendation
      const insight = this.generateCorrelationInsight(metricA, metricB, correlation, strength, direction);
      const recommendation = this.generateCorrelationRecommendation(metricA, metricB, correlation, strength);

      // Save correlation to database
      await this.saveCorrelation(userId, {
        metricA,
        metricB,
        coefficient: correlation,
        strength,
        direction,
        sampleSize: dataA.length,
        pValue,
        insight,
        recommendation,
        days,
      });

      logger.info('Correlation analyzed', { userId, metricA, metricB, correlation });

      return {
        metricA,
        metricB,
        coefficient: correlation,
        strength,
        direction,
        sampleSize: dataA.length,
        pValue,
        insight,
        recommendation,
      };
    } catch (error) {
      logger.error('Error analyzing correlation', { error, userId, metricA, metricB });
      throw error;
    }
  }

  /**
   * Predict trend for a metric
   */
  async predictTrend(
    userId: string,
    metricName: string,
    goalValue?: number,
    days: number = 30
  ): Promise<TrendPrediction> {
    try {
      // Fetch historical data
      const historicalData = await this.getMetricData(userId, metricName, days);

      if (historicalData.length < 3) {
        throw new Error('Insufficient data for trend prediction');
      }

      // Calculate current trend
      const currentValue = historicalData[historicalData.length - 1];
      const trend = this.calculateTrend(historicalData);
      const trendPercentage = this.calculateTrendPercentage(historicalData);

      // Make predictions using linear regression
      const predictions = this.linearRegressionPredict(historicalData, [7, 30, 90]);
      const confidence = this.calculatePredictionConfidence(historicalData);

      // Calculate goal metrics if goal provided
      let daysToGoal: number | undefined;
      let goalAchievable = false;

      if (goalValue !== undefined) {
        daysToGoal = this.calculateDaysToGoal(historicalData, goalValue);
        goalAchievable = daysToGoal !== null && daysToGoal > 0 && daysToGoal < 365;
      }

      // Generate summary and recommendation
      const summary = this.generateTrendSummary(metricName, trend, trendPercentage, predictions);
      const recommendation = this.generateTrendRecommendation(metricName, trend, goalValue, goalAchievable);

      // Save prediction to database
      await this.saveTrendPrediction(userId, {
        metricName,
        currentValue,
        trend,
        trendPercentage,
        predictions,
        confidence,
        goalValue,
        daysToGoal,
        goalAchievable,
        summary,
        recommendation,
        dataPoints: historicalData.length,
      });

      logger.info('Trend predicted', { userId, metricName, trend });

      return {
        metricName,
        currentValue,
        currentTrend: trend,
        trendPercentage,
        predicted7Day: predictions[0],
        predicted30Day: predictions[1],
        predicted90Day: predictions[2],
        confidence,
        daysToGoal,
        goalAchievable,
        summary,
        recommendation,
      };
    } catch (error) {
      logger.error('Error predicting trend', { error, userId, metricName });
      throw error;
    }
  }

  /**
   * Generate insights for user
   */
  async generateInsights(userId: string): Promise<HealthInsight[]> {
    try {
      const insights: HealthInsight[] = [];

      // Analyze sleep vs recovery correlation
      const sleepRecoveryCorr = await this.analyzeCorrelation(userId, 'sleep_quality', 'recovery_score', 30);
      if (sleepRecoveryCorr.strength === 'strong' || sleepRecoveryCorr.strength === 'moderate') {
        insights.push({
          type: 'correlation',
          category: 'recovery',
          priority: 'high',
          title: 'Sleep Quality Impacts Recovery',
          summary: sleepRecoveryCorr.insight,
          primaryRecommendation: sleepRecoveryCorr.recommendation,
          potentialImpact: 'high',
          affectedAreas: ['sleep', 'recovery'],
        });
      }

      // Analyze workout volume vs recovery
      const workoutRecoveryCorr = await this.analyzeCorrelation(userId, 'workout_volume', 'recovery_score', 30);
      if (workoutRecoveryCorr.coefficient < -0.5) {
        insights.push({
          type: 'warning',
          category: 'performance',
          priority: 'high',
          title: 'High Training Volume Affecting Recovery',
          summary: 'Your workout volume is negatively impacting recovery. Consider reducing volume or adding rest days.',
          primaryRecommendation: 'Reduce training volume by 20% for the next week and monitor recovery scores.',
          potentialImpact: 'high',
          affectedAreas: ['recovery', 'performance'],
        });
      }

      // Check for weight trend
      const weightTrend = await this.predictTrend(userId, 'body_weight', undefined, 30);
      if (Math.abs(weightTrend.trendPercentage) > 5) {
        insights.push({
          type: 'trend',
          category: 'overall',
          priority: 'medium',
          title: `Body Weight ${weightTrend.currentTrend === 'increasing' ? 'Increasing' : 'Decreasing'}`,
          summary: weightTrend.summary,
          primaryRecommendation: weightTrend.recommendation,
          potentialImpact: 'medium',
          affectedAreas: ['nutrition', 'performance'],
        });
      }

      // Save insights to database
      for (const insight of insights) {
        await this.saveInsight(userId, insight);
      }

      logger.info('Insights generated', { userId, count: insights.length });

      return insights;
    } catch (error) {
      logger.error('Error generating insights', { error, userId });
      throw error;
    }
  }

  /**
   * Track goal progress
   */
  async trackGoalProgress(userId: string, goalId: string): Promise<GoalProgress> {
    try {
      // Get goal details
      const { data: goal, error } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) throw error;

      // Get current metric value
      const currentValue = await this.getCurrentMetricValue(userId, goal.target_metric);

      // Calculate progress
      const totalChange = goal.target_value - goal.starting_value;
      const currentChange = currentValue - goal.starting_value;
      const progressPercentage = (currentChange / totalChange) * 100;

      // Calculate time metrics
      const startDate = new Date(goal.start_date);
      const targetDate = new Date(goal.target_date);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate required vs actual change
      const totalDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const requiredWeeklyChange = (totalChange / totalDays) * 7;
      const actualWeeklyChange = daysElapsed > 0 ? (currentChange / daysElapsed) * 7 : 0;

      // Determine progress status
      const paceRatio = actualWeeklyChange / requiredWeeklyChange;
      let progressStatus: 'on_track' | 'ahead' | 'behind' | 'stalled';
      if (paceRatio >= 1.1) progressStatus = 'ahead';
      else if (paceRatio >= 0.9) progressStatus = 'on_track';
      else if (paceRatio >= 0.5) progressStatus = 'behind';
      else progressStatus = 'stalled';

      // Predict completion
      const predictedDaysToComplete = actualWeeklyChange > 0 
        ? Math.ceil((goal.target_value - currentValue) / (actualWeeklyChange / 7))
        : null;
      
      const predictedCompletionDate = predictedDaysToComplete
        ? new Date(now.getTime() + predictedDaysToComplete * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      const likelihoodOfSuccess = Math.min(100, Math.max(0, paceRatio * 100));

      // Generate recommendations
      const recommendations = this.generateGoalRecommendations(
        goal.goal_type,
        progressStatus,
        paceRatio,
        daysRemaining
      );

      // Update goal progress in database
      await supabase
        .from('goal_progress')
        .update({
          current_value: currentValue,
          progress_percentage: progressPercentage,
          progress_status: progressStatus,
          days_elapsed: daysElapsed,
          days_remaining: daysRemaining,
          required_weekly_change: requiredWeeklyChange,
          actual_weekly_change: actualWeeklyChange,
          predicted_completion_date: predictedCompletionDate,
          likelihood_of_success: likelihoodOfSuccess,
          recommendations,
          last_updated: new Date().toISOString(),
        })
        .eq('id', goalId);

      logger.info('Goal progress tracked', { userId, goalId, progressPercentage });

      return {
        goalType: goal.goal_type,
        targetMetric: goal.target_metric,
        startingValue: goal.starting_value,
        targetValue: goal.target_value,
        currentValue,
        progressPercentage,
        progressStatus,
        daysElapsed,
        daysRemaining,
        requiredWeeklyChange,
        actualWeeklyChange,
        predictedCompletionDate: predictedCompletionDate || '',
        likelihoodOfSuccess,
        recommendations,
      };
    } catch (error) {
      logger.error('Error tracking goal progress', { error, userId, goalId });
      throw error;
    }
  }

  /**
   * Get metric data for analysis
   */
  private async getMetricData(userId: string, metricName: string, days: number): Promise<number[]> {
    // This would query the appropriate table based on metric name
    // For now, return mock data
    const data: number[] = [];
    for (let i = 0; i < days; i++) {
      data.push(Math.random() * 100);
    }
    return data;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(dataA: number[], dataB: number[]): number {
    const n = Math.min(dataA.length, dataB.length);
    if (n < 2) return 0;

    const meanA = dataA.reduce((sum, val) => sum + val, 0) / n;
    const meanB = dataB.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = dataA[i] - meanA;
      const diffB = dataB[i] - meanB;
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }

    const denominator = Math.sqrt(denomA * denomB);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate p-value for correlation
   */
  private calculatePValue(correlation: number, sampleSize: number): number {
    // Simplified p-value calculation
    const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    return Math.max(0.001, 1 - Math.abs(t) / 10); // Simplified
  }

  /**
   * Determine correlation strength
   */
  private determineCorrelationStrength(coefficient: number): 'strong' | 'moderate' | 'weak' | 'none' {
    const abs = Math.abs(coefficient);
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'none';
  }

  /**
   * Determine correlation direction
   */
  private determineCorrelationDirection(coefficient: number): 'positive' | 'negative' | 'none' {
    if (coefficient > 0.1) return 'positive';
    if (coefficient < -0.1) return 'negative';
    return 'none';
  }

  /**
   * Calculate trend from data
   */
  private calculateTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (data.length < 3) return 'stable';

    const slope = this.calculateSlope(data);
    const variance = this.calculateVariance(data);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation

    if (cv > 0.3) return 'volatile';
    if (slope > 0.02) return 'increasing';
    if (slope < -0.02) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate slope using linear regression
   */
  private calculateSlope(data: number[]): number {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate trend percentage
   */
  private calculateTrendPercentage(data: number[]): number {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return ((last - first) / first) * 100;
  }

  /**
   * Linear regression prediction
   */
  private linearRegressionPredict(data: number[], futureDays: number[]): number[] {
    const slope = this.calculateSlope(data);
    const yMean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const xMean = (data.length - 1) / 2;
    const intercept = yMean - slope * xMean;

    return futureDays.map(days => slope * (data.length - 1 + days) + intercept);
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(data: number[]): number {
    const variance = this.calculateVariance(data);
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const cv = Math.sqrt(variance) / mean;

    // Lower variance = higher confidence
    return Math.max(0, Math.min(100, 100 - cv * 100));
  }

  /**
   * Calculate days to goal
   */
  private calculateDaysToGoal(data: number[], goalValue: number): number | null {
    const currentValue = data[data.length - 1];
    const slope = this.calculateSlope(data);

    if (slope === 0) return null;

    const daysToGoal = (goalValue - currentValue) / slope;
    return daysToGoal > 0 ? Math.ceil(daysToGoal) : null;
  }

  /**
   * Get current metric value
   */
  private async getCurrentMetricValue(userId: string, metricName: string): Promise<number> {
    // This would query the appropriate table
    // For now, return mock value
    return Math.random() * 100;
  }

  /**
   * Generate correlation insight
   */
  private generateCorrelationInsight(
    metricA: string,
    metricB: string,
    coefficient: number,
    strength: string,
    direction: string
  ): string {
    const absCoeff = Math.abs(coefficient);
    return `There is a ${strength} ${direction} correlation (${(absCoeff * 100).toFixed(0)}%) between ${metricA} and ${metricB}.`;
  }

  /**
   * Generate correlation recommendation
   */
  private generateCorrelationRecommendation(
    metricA: string,
    metricB: string,
    coefficient: number,
    strength: string
  ): string {
    if (strength === 'strong' || strength === 'moderate') {
      if (coefficient > 0) {
        return `Improving ${metricA} is likely to improve ${metricB}. Focus on optimizing ${metricA}.`;
      } else {
        return `${metricA} and ${metricB} move in opposite directions. Balance both metrics carefully.`;
      }
    }
    return `No strong relationship found. Monitor both metrics independently.`;
  }

  /**
   * Generate trend summary
   */
  private generateTrendSummary(
    metricName: string,
    trend: string,
    percentage: number,
    predictions: number[]
  ): string {
    return `${metricName} is ${trend} (${percentage.toFixed(1)}% change). Predicted values: 7-day: ${predictions[0].toFixed(1)}, 30-day: ${predictions[1].toFixed(1)}, 90-day: ${predictions[2].toFixed(1)}.`;
  }

  /**
   * Generate trend recommendation
   */
  private generateTrendRecommendation(
    metricName: string,
    trend: string,
    goalValue?: number,
    goalAchievable?: boolean
  ): string {
    if (goalValue !== undefined && !goalAchievable) {
      return `Current trend suggests goal may not be achievable. Consider adjusting strategy or timeline.`;
    }
    if (trend === 'volatile') {
      return `High variability detected. Focus on consistency to establish clearer trends.`;
    }
    return `Continue current approach. Trend is ${trend}.`;
  }

  /**
   * Generate goal recommendations
   */
  private generateGoalRecommendations(
    goalType: string,
    status: string,
    paceRatio: number,
    daysRemaining: number
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'behind' || status === 'stalled') {
      recommendations.push('Increase effort to get back on track');
      recommendations.push('Review and adjust your strategy');
    } else if (status === 'ahead') {
      recommendations.push('Great progress! Maintain current approach');
    } else {
      recommendations.push('On track. Keep up the good work');
    }

    if (daysRemaining < 30) {
      recommendations.push('Goal deadline approaching. Focus on consistency');
    }

    return recommendations;
  }

  /**
   * Save correlation to database
   */
  private async saveCorrelation(userId: string, data: any): Promise<void> {
    await supabase.from('health_correlations').insert({
      user_id: userId,
      metric_a: data.metricA,
      metric_b: data.metricB,
      correlation_coefficient: data.coefficient,
      correlation_strength: data.strength,
      correlation_direction: data.direction,
      sample_size: data.sampleSize,
      p_value: data.pValue,
      analysis_start_date: new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      analysis_end_date: new Date().toISOString().split('T')[0],
      days_analyzed: data.days,
      insight_summary: data.insight,
      actionable_recommendation: data.recommendation,
    });
  }

  /**
   * Save trend prediction to database
   */
  private async saveTrendPrediction(userId: string, data: any): Promise<void> {
    await supabase.from('trend_predictions').insert({
      user_id: userId,
      metric_name: data.metricName,
      current_value: data.currentValue,
      current_trend: data.trend,
      trend_percentage: data.trendPercentage,
      predicted_7_day: data.predictions[0],
      predicted_30_day: data.predictions[1],
      predicted_90_day: data.predictions[2],
      prediction_confidence: data.confidence,
      prediction_method: 'linear_regression',
      data_points_used: data.dataPoints,
      goal_value: data.goalValue,
      days_to_goal: data.daysToGoal,
      goal_achievable: data.goalAchievable,
      trend_summary: data.summary,
      recommendation: data.recommendation,
    });
  }

  /**
   * Save insight to database
   */
  private async saveInsight(userId: string, insight: HealthInsight): Promise<void> {
    await supabase.from('health_insights').insert({
      user_id: userId,
      insight_type: insight.type,
      insight_category: insight.category,
      priority: insight.priority,
      title: insight.title,
      summary: insight.summary,
      detailed_analysis: insight.detailedAnalysis,
      primary_recommendation: insight.primaryRecommendation,
      secondary_recommendations: insight.secondaryRecommendations,
      supporting_metrics: insight.supportingMetrics,
      potential_impact: insight.potentialImpact,
      affected_areas: insight.affectedAreas,
      status: 'active',
    });
  }
}

export const analyticsEngine = new AnalyticsEngine();

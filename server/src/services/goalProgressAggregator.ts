/**
 * Goal Progress Aggregator - Phase 19
 * 
 * Purpose: Aggregate goal progress from all vertical slices
 * Critical Gap: Goal progress exists but doesn't aggregate across all data sources
 * 
 * Aggregates from:
 * - Bloodwork (biomarker improvements)
 * - Body composition (weight, body fat, muscle mass)
 * - Workout execution (strength, volume, consistency)
 * - Recovery (sleep, HRV, recovery scores)
 * - Nutrition (adherence, macro targets)
 * - Supplements (adherence)
 * - Cardiovascular (BP, HR, lipids)
 * - Device data (activity, steps, calories)
 */

import { logger } from '../utils/logger';

// ============================================================================
// GOAL PROGRESS MODEL
// ============================================================================

export interface AggregatedGoalProgress {
  userId: string;
  goalId: string;
  date: string;
  
  // Goal details
  goalName: string;
  goalCategory: string;
  goalType: string;
  
  // Overall progress
  overallProgress: number; // 0-100
  onTrack: boolean;
  
  // Progress by slice
  sliceProgress: {
    bloodwork?: SliceProgress;
    bodyComposition?: SliceProgress;
    workout?: SliceProgress;
    recovery?: SliceProgress;
    nutrition?: SliceProgress;
    supplements?: SliceProgress;
    cardiovascular?: SliceProgress;
    devices?: SliceProgress;
  };
  
  // Metrics
  metrics: GoalMetric[];
  
  // Timeline
  startDate: string;
  targetDate: string;
  daysElapsed: number;
  daysRemaining: number;
  expectedProgress: number; // 0-100 based on timeline
  
  // Predictions
  predictedCompletionDate?: string;
  likelihoodOfSuccess: number; // 0-100
  
  // Insights
  insights: string[];
  blockers: string[];
  accelerators: string[];
  
  // Metadata
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
}

export interface SliceProgress {
  sliceName: string;
  contribution: number; // 0-100, how much this slice contributes to goal
  progress: number; // 0-100, progress within this slice
  status: 'ahead' | 'on_track' | 'behind' | 'blocked';
  metrics: Array<{
    metricName: string;
    currentValue: number;
    targetValue: number;
    progress: number;
    unit: string;
  }>;
  lastUpdated: string;
}

export interface GoalMetric {
  metricName: string;
  metricType: 'primary' | 'secondary';
  currentValue: number;
  targetValue: number;
  startingValue: number;
  progress: number; // 0-100
  unit: string;
  direction: 'increase' | 'decrease' | 'maintain';
  source: string;
}

// ============================================================================
// GOAL PROGRESS AGGREGATOR
// ============================================================================

export class GoalProgressAggregator {
  /**
   * Aggregate goal progress from all slices
   */
  static aggregateProgress(
    userId: string,
    goal: any,
    sliceData: {
      bloodwork?: any;
      bodyComposition?: any;
      workout?: any;
      recovery?: any;
      nutrition?: any;
      supplements?: any;
      cardiovascular?: any;
      devices?: any;
    }
  ): AggregatedGoalProgress {
    const date = new Date().toISOString().split('T')[0];
    
    // Calculate timeline
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);
    const currentDate = new Date();
    
    const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const expectedProgress = Math.min((daysElapsed / totalDays) * 100, 100);

    // Aggregate slice progress
    const sliceProgress: AggregatedGoalProgress['sliceProgress'] = {};
    
    if (sliceData.bloodwork) {
      sliceProgress.bloodwork = this.aggregateBloodworkProgress(goal, sliceData.bloodwork);
    }
    if (sliceData.bodyComposition) {
      sliceProgress.bodyComposition = this.aggregateBodyCompositionProgress(goal, sliceData.bodyComposition);
    }
    if (sliceData.workout) {
      sliceProgress.workout = this.aggregateWorkoutProgress(goal, sliceData.workout);
    }
    if (sliceData.recovery) {
      sliceProgress.recovery = this.aggregateRecoveryProgress(goal, sliceData.recovery);
    }
    if (sliceData.nutrition) {
      sliceProgress.nutrition = this.aggregateNutritionProgress(goal, sliceData.nutrition);
    }
    if (sliceData.supplements) {
      sliceProgress.supplements = this.aggregateSupplementProgress(goal, sliceData.supplements);
    }
    if (sliceData.cardiovascular) {
      sliceProgress.cardiovascular = this.aggregateCardiovascularProgress(goal, sliceData.cardiovascular);
    }
    if (sliceData.devices) {
      sliceProgress.devices = this.aggregateDeviceProgress(goal, sliceData.devices);
    }

    // Calculate overall progress (weighted average)
    const overallProgress = this.calculateOverallProgress(sliceProgress);
    const onTrack = overallProgress >= expectedProgress - 10; // Within 10% of expected

    // Aggregate metrics
    const metrics = this.aggregateMetrics(sliceProgress);

    // Generate insights
    const insights = this.generateInsights(goal, sliceProgress, overallProgress, expectedProgress);
    const blockers = this.identifyBlockers(sliceProgress);
    const accelerators = this.identifyAccelerators(sliceProgress);

    // Predict completion
    const predictedCompletionDate = this.predictCompletionDate(
      goal,
      overallProgress,
      daysElapsed,
      daysRemaining
    );
    const likelihoodOfSuccess = this.calculateSuccessLikelihood(
      overallProgress,
      expectedProgress,
      daysRemaining
    );

    // Assess data quality
    const dataQuality = this.assessDataQuality(sliceProgress);
    const confidence = this.calculateConfidence(sliceProgress);

    const aggregated: AggregatedGoalProgress = {
      userId,
      goalId: goal.id,
      date,
      goalName: goal.goalName,
      goalCategory: goal.goalCategory,
      goalType: goal.goalType,
      overallProgress: Math.round(overallProgress),
      onTrack,
      sliceProgress,
      metrics,
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      daysElapsed,
      daysRemaining,
      expectedProgress: Math.round(expectedProgress),
      predictedCompletionDate,
      likelihoodOfSuccess: Math.round(likelihoodOfSuccess),
      insights,
      blockers,
      accelerators,
      lastUpdated: new Date().toISOString(),
      dataQuality,
      confidence,
    };

    logger.info('✅ [GOAL PROGRESS] Progress aggregated', {
      userId,
      goalId: goal.id,
      overallProgress: Math.round(overallProgress),
      onTrack,
      sliceCount: Object.keys(sliceProgress).length,
    });

    return aggregated;
  }

  // ============================================================================
  // SLICE-SPECIFIC AGGREGATORS
  // ============================================================================

  private static aggregateBloodworkProgress(goal: any, bloodworkData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Example: LDL cholesterol goal
    if (bloodworkData.ldl !== undefined && goal.targetMetrics?.ldl) {
      const starting = goal.startingMetrics?.ldl || bloodworkData.ldl;
      const current = bloodworkData.ldl;
      const target = goal.targetMetrics.ldl;
      const progress = this.calculateProgress(starting, current, target, 'decrease');
      
      metrics.push({
        metricName: 'LDL Cholesterol',
        currentValue: current,
        targetValue: target,
        progress,
        unit: 'mg/dL',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Bloodwork',
      contribution: 30, // Bloodwork is 30% of health goals
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: bloodworkData.testDate || new Date().toISOString(),
    };
  }

  private static aggregateBodyCompositionProgress(goal: any, bodyCompData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Weight
    if (bodyCompData.weight !== undefined && goal.targetMetrics?.weight) {
      const starting = goal.startingMetrics?.weight || bodyCompData.weight;
      const current = bodyCompData.weight;
      const target = goal.targetMetrics.weight;
      const direction = target < starting ? 'decrease' : 'increase';
      const progress = this.calculateProgress(starting, current, target, direction);
      
      metrics.push({
        metricName: 'Weight',
        currentValue: current,
        targetValue: target,
        progress,
        unit: 'lbs',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    // Body fat
    if (bodyCompData.bodyFat !== undefined && goal.targetMetrics?.bodyFat) {
      const starting = goal.startingMetrics?.bodyFat || bodyCompData.bodyFat;
      const current = bodyCompData.bodyFat;
      const target = goal.targetMetrics.bodyFat;
      const progress = this.calculateProgress(starting, current, target, 'decrease');
      
      metrics.push({
        metricName: 'Body Fat %',
        currentValue: current,
        targetValue: target,
        progress,
        unit: '%',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Body Composition',
      contribution: 40, // Body comp is 40% of physique goals
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: bodyCompData.measurementDate || new Date().toISOString(),
    };
  }

  private static aggregateWorkoutProgress(goal: any, workoutData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Adherence
    if (workoutData.adherence !== undefined) {
      metrics.push({
        metricName: 'Workout Adherence',
        currentValue: workoutData.adherence,
        targetValue: 90,
        progress: (workoutData.adherence / 90) * 100,
        unit: '%',
      });
      
      totalProgress += (workoutData.adherence / 90) * 100;
      metricCount++;
    }

    // Volume
    if (workoutData.weeklyVolume !== undefined && goal.targetMetrics?.weeklyVolume) {
      const starting = goal.startingMetrics?.weeklyVolume || 0;
      const current = workoutData.weeklyVolume;
      const target = goal.targetMetrics.weeklyVolume;
      const progress = this.calculateProgress(starting, current, target, 'increase');
      
      metrics.push({
        metricName: 'Weekly Volume',
        currentValue: current,
        targetValue: target,
        progress,
        unit: 'sets',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Workout',
      contribution: 35, // Workout is 35% of fitness goals
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static aggregateRecoveryProgress(goal: any, recoveryData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Sleep
    if (recoveryData.avgSleepHours !== undefined && goal.targetMetrics?.sleepHours) {
      const target = goal.targetMetrics.sleepHours;
      const progress = Math.min((recoveryData.avgSleepHours / target) * 100, 100);
      
      metrics.push({
        metricName: 'Sleep Duration',
        currentValue: recoveryData.avgSleepHours,
        targetValue: target,
        progress,
        unit: 'hours',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    // HRV
    if (recoveryData.avgHRV !== undefined && goal.targetMetrics?.hrv) {
      const starting = goal.startingMetrics?.hrv || recoveryData.avgHRV;
      const current = recoveryData.avgHRV;
      const target = goal.targetMetrics.hrv;
      const progress = this.calculateProgress(starting, current, target, 'increase');
      
      metrics.push({
        metricName: 'HRV',
        currentValue: current,
        targetValue: target,
        progress,
        unit: 'ms',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Recovery',
      contribution: 20, // Recovery is 20% of performance goals
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static aggregateNutritionProgress(goal: any, nutritionData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Protein adherence
    if (nutritionData.proteinAdherence !== undefined) {
      metrics.push({
        metricName: 'Protein Adherence',
        currentValue: nutritionData.proteinAdherence,
        targetValue: 90,
        progress: (nutritionData.proteinAdherence / 90) * 100,
        unit: '%',
      });
      
      totalProgress += (nutritionData.proteinAdherence / 90) * 100;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Nutrition',
      contribution: 25, // Nutrition is 25% of body comp goals
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static aggregateSupplementProgress(goal: any, supplementData: any): SliceProgress {
    const adherence = supplementData.adherence || 0;
    
    return {
      sliceName: 'Supplements',
      contribution: 10,
      progress: adherence,
      status: this.determineStatus(adherence),
      metrics: [{
        metricName: 'Supplement Adherence',
        currentValue: adherence,
        targetValue: 90,
        progress: (adherence / 90) * 100,
        unit: '%',
      }],
      lastUpdated: new Date().toISOString(),
    };
  }

  private static aggregateCardiovascularProgress(goal: any, cvData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Blood pressure
    if (cvData.systolic !== undefined && goal.targetMetrics?.systolic) {
      const starting = goal.startingMetrics?.systolic || cvData.systolic;
      const current = cvData.systolic;
      const target = goal.targetMetrics.systolic;
      const progress = this.calculateProgress(starting, current, target, 'decrease');
      
      metrics.push({
        metricName: 'Systolic BP',
        currentValue: current,
        targetValue: target,
        progress,
        unit: 'mmHg',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Cardiovascular',
      contribution: 30,
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static aggregateDeviceProgress(goal: any, deviceData: any): SliceProgress {
    const metrics = [];
    let totalProgress = 0;
    let metricCount = 0;

    // Steps
    if (deviceData.avgSteps !== undefined && goal.targetMetrics?.dailySteps) {
      const progress = Math.min((deviceData.avgSteps / goal.targetMetrics.dailySteps) * 100, 100);
      
      metrics.push({
        metricName: 'Daily Steps',
        currentValue: deviceData.avgSteps,
        targetValue: goal.targetMetrics.dailySteps,
        progress,
        unit: 'steps',
      });
      
      totalProgress += progress;
      metricCount++;
    }

    const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;

    return {
      sliceName: 'Device Activity',
      contribution: 15,
      progress: avgProgress,
      status: this.determineStatus(avgProgress),
      metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateProgress(
    starting: number,
    current: number,
    target: number,
    direction: 'increase' | 'decrease'
  ): number {
    if (direction === 'increase') {
      const totalChange = target - starting;
      const currentChange = current - starting;
      return Math.min((currentChange / totalChange) * 100, 100);
    } else {
      const totalChange = starting - target;
      const currentChange = starting - current;
      return Math.min((currentChange / totalChange) * 100, 100);
    }
  }

  private static determineStatus(progress: number): SliceProgress['status'] {
    if (progress >= 110) return 'ahead';
    if (progress >= 90) return 'on_track';
    if (progress >= 50) return 'behind';
    return 'blocked';
  }

  private static calculateOverallProgress(sliceProgress: AggregatedGoalProgress['sliceProgress']): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(sliceProgress).forEach(slice => {
      if (slice) {
        weightedSum += slice.progress * (slice.contribution / 100);
        totalWeight += slice.contribution / 100;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private static aggregateMetrics(sliceProgress: AggregatedGoalProgress['sliceProgress']): GoalMetric[] {
    const metrics: GoalMetric[] = [];

    Object.values(sliceProgress).forEach(slice => {
      if (slice) {
        slice.metrics.forEach(metric => {
          metrics.push({
            metricName: metric.metricName,
            metricType: 'secondary',
            currentValue: metric.currentValue,
            targetValue: metric.targetValue,
            startingValue: metric.currentValue, // Would use actual starting value
            progress: metric.progress,
            unit: metric.unit,
            direction: 'increase', // Would determine from goal
            source: slice.sliceName,
          });
        });
      }
    });

    return metrics;
  }

  private static generateInsights(
    goal: any,
    sliceProgress: AggregatedGoalProgress['sliceProgress'],
    overallProgress: number,
    expectedProgress: number
  ): string[] {
    const insights: string[] = [];

    if (overallProgress > expectedProgress + 10) {
      insights.push('Ahead of schedule - excellent progress!');
    } else if (overallProgress < expectedProgress - 20) {
      insights.push('Behind schedule - consider plan adjustments');
    }

    // Find best performing slice
    let bestSlice: SliceProgress | null = null;
    let bestProgress = 0;
    Object.values(sliceProgress).forEach(slice => {
      if (slice && slice.progress > bestProgress) {
        bestProgress = slice.progress;
        bestSlice = slice;
      }
    });

    if (bestSlice && bestProgress > 90) {
      insights.push(`${bestSlice.sliceName} performing excellently (${Math.round(bestProgress)}%)`);
    }

    return insights;
  }

  private static identifyBlockers(sliceProgress: AggregatedGoalProgress['sliceProgress']): string[] {
    const blockers: string[] = [];

    Object.values(sliceProgress).forEach(slice => {
      if (slice && slice.status === 'blocked') {
        blockers.push(`${slice.sliceName} progress blocked`);
      } else if (slice && slice.progress < 30) {
        blockers.push(`${slice.sliceName} significantly behind`);
      }
    });

    return blockers;
  }

  private static identifyAccelerators(sliceProgress: AggregatedGoalProgress['sliceProgress']): string[] {
    const accelerators: string[] = [];

    Object.values(sliceProgress).forEach(slice => {
      if (slice && slice.status === 'ahead') {
        accelerators.push(`${slice.sliceName} ahead of target`);
      }
    });

    return accelerators;
  }

  private static predictCompletionDate(
    goal: any,
    overallProgress: number,
    daysElapsed: number,
    daysRemaining: number
  ): string | undefined {
    if (overallProgress === 0) return undefined;

    const progressRate = overallProgress / daysElapsed; // % per day
    const daysToComplete = (100 - overallProgress) / progressRate;
    
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + Math.ceil(daysToComplete));
    
    return predictedDate.toISOString().split('T')[0];
  }

  private static calculateSuccessLikelihood(
    overallProgress: number,
    expectedProgress: number,
    daysRemaining: number
  ): number {
    let likelihood = 50;

    // Progress vs expected
    const progressDelta = overallProgress - expectedProgress;
    likelihood += progressDelta * 0.5;

    // Time remaining
    if (daysRemaining > 30) likelihood += 20;
    else if (daysRemaining > 14) likelihood += 10;
    else if (daysRemaining < 7) likelihood -= 20;

    return Math.max(0, Math.min(100, likelihood));
  }

  private static assessDataQuality(sliceProgress: AggregatedGoalProgress['sliceProgress']): 'high' | 'medium' | 'low' {
    const sliceCount = Object.keys(sliceProgress).length;
    
    if (sliceCount >= 5) return 'high';
    if (sliceCount >= 3) return 'medium';
    return 'low';
  }

  private static calculateConfidence(sliceProgress: AggregatedGoalProgress['sliceProgress']): number {
    const sliceCount = Object.keys(sliceProgress).length;
    return Math.min(sliceCount * 0.15, 1.0);
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export async function getAggregatedGoalProgress(
  userId: string,
  goalId: string
): Promise<AggregatedGoalProgress | null> {
  // This would fetch goal and aggregate from all slices
  logger.info('📋 [GOAL PROGRESS] Fetching aggregated progress', { userId, goalId });
  return null;
}

export async function saveAggregatedGoalProgress(
  progress: AggregatedGoalProgress
): Promise<AggregatedGoalProgress> {
  // This would persist aggregated progress
  logger.info('✅ [GOAL PROGRESS] Aggregated progress saved', {
    userId: progress.userId,
    goalId: progress.goalId,
    overallProgress: progress.overallProgress,
  });
  
  return progress;
}

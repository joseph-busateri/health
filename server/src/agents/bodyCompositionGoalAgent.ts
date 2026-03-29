// Body Composition Goal Agent
// Sets realistic goals and tracks progress based on body composition trends

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface GoalAnalysis {
  userId: string;
  analysisDate: string;
  recommendations: GoalRecommendation[];
  currentGoals: any[];
  overallAssessment: string;
  confidenceScore: number;
}

interface GoalRecommendation {
  type: 'create_goal' | 'adjust_goal' | 'celebrate_achievement' | 'extend_timeline' | 
        'increase_target' | 'decrease_target' | 'pause_goal' | 'focus_shift';
  goalId?: string;
  goalType?: string;
  currentTarget?: number;
  recommendedTarget?: number;
  currentTimeline?: string;
  recommendedTimeline?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  basedOn: {
    trendAnalysis?: string;
    progressRate?: string;
    timeRemaining?: string;
    feasibility?: string;
  };
}

export class BodyCompositionGoalAgent {
  
  /**
   * Analyze body composition goals and progress
   */
  async analyzeGoals(userId: string): Promise<GoalAnalysis> {
    try {
      // Get active goals
      const { data: activeGoals } = await supabase
        .from('body_composition_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Get recent scans (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: recentScans } = await supabase
        .from('body_composition_scans')
        .select('*')
        .eq('user_id', userId)
        .gte('scan_date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('scan_date', { ascending: true });

      if (!recentScans || recentScans.length < 2) {
        return {
          userId,
          analysisDate: new Date().toISOString(),
          recommendations: [{
            type: 'create_goal',
            reason: 'Insufficient scan data. Need at least 2 scans to establish baseline and set goals.',
            priority: 'low',
            basedOn: {},
          }],
          currentGoals: activeGoals || [],
          overallAssessment: 'Need more data to analyze goals. Upload more body composition scans.',
          confidenceScore: 0,
        };
      }

      const recommendations: GoalRecommendation[] = [];

      // Analyze each active goal
      if (activeGoals && activeGoals.length > 0) {
        for (const goal of activeGoals) {
          const goalRecs = await this.analyzeGoal(goal, recentScans);
          recommendations.push(...goalRecs);
        }
      } else {
        // No active goals - suggest creating some
        const suggestedGoals = this.suggestInitialGoals(recentScans);
        recommendations.push(...suggestedGoals);
      }

      // Check for unrealistic expectations
      const realismCheck = this.checkGoalRealism(activeGoals || [], recentScans);
      recommendations.push(...realismCheck);

      // Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(
        recommendations,
        activeGoals || [],
        recentScans
      );
      const confidenceScore = this.calculateConfidenceScore(recentScans.length);

      logger.info('Body composition goal analysis complete', {
        userId,
        activeGoalCount: activeGoals?.length || 0,
        recommendationCount: recommendations.length,
        confidenceScore,
      });

      return {
        userId,
        analysisDate: new Date().toISOString(),
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        currentGoals: activeGoals || [],
        overallAssessment,
        confidenceScore,
      };
    } catch (error) {
      logger.error('Error analyzing body composition goals', { error, userId });
      throw error;
    }
  }

  /**
   * Analyze individual goal progress
   */
  private async analyzeGoal(goal: any, scans: any[]): Promise<GoalRecommendation[]> {
    const recommendations: GoalRecommendation[] = [];

    // Get relevant metric from scans
    const metricField = this.getMetricField(goal.goal_type);
    if (!metricField) return recommendations;

    const values = scans
      .map(s => s[metricField])
      .filter(v => v !== null && v !== undefined);

    if (values.length < 2) return recommendations;

    const currentValue = values[values.length - 1];
    const startValue = values[0];
    const targetValue = goal.target_value;

    // Calculate progress
    const totalChange = targetValue - startValue;
    const currentChange = currentValue - startValue;
    const progressPercent = (currentChange / totalChange) * 100;

    // Calculate rate of change per week
    const daysBetween = (new Date(scans[scans.length - 1].scan_date).getTime() - 
                         new Date(scans[0].scan_date).getTime()) / (1000 * 60 * 60 * 24);
    const weeksBetween = daysBetween / 7;
    const changePerWeek = currentChange / weeksBetween;

    // Calculate time to goal at current rate
    const remainingChange = targetValue - currentValue;
    const weeksToGoal = remainingChange / changePerWeek;

    // Check if goal is achieved
    const isAchieved = this.isGoalAchieved(currentValue, targetValue, goal.goal_type);

    if (isAchieved) {
      recommendations.push({
        type: 'celebrate_achievement',
        goalId: goal.id,
        goalType: goal.goal_type,
        reason: `Goal achieved! ${goal.goal_type} reached ${currentValue.toFixed(1)} (target: ${targetValue}). Consider setting a new goal.`,
        priority: 'high',
        basedOn: {
          progressRate: `${Math.abs(changePerWeek).toFixed(2)} per week`,
          trendAnalysis: `${progressPercent.toFixed(0)}% complete`,
        },
      });
      return recommendations;
    }

    // Check if target date is approaching
    if (goal.target_date) {
      const daysToTarget = (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      const weeksToTarget = daysToTarget / 7;

      // Goal unlikely to be achieved in time
      if (weeksToGoal > weeksToTarget * 1.5 && weeksToTarget > 0) {
        recommendations.push({
          type: 'adjust_goal',
          goalId: goal.id,
          goalType: goal.goal_type,
          currentTarget: targetValue,
          recommendedTarget: startValue + (changePerWeek * weeksToTarget),
          currentTimeline: goal.target_date,
          reason: `Current progress rate (${Math.abs(changePerWeek).toFixed(2)}/week) suggests goal may not be achievable by target date. Consider adjusting target or extending timeline.`,
          priority: 'medium',
          basedOn: {
            progressRate: `${Math.abs(changePerWeek).toFixed(2)} per week`,
            timeRemaining: `${weeksToTarget.toFixed(1)} weeks`,
            feasibility: `Need ${Math.abs(remainingChange / weeksToTarget).toFixed(2)}/week, currently at ${Math.abs(changePerWeek).toFixed(2)}/week`,
          },
        });
      }

      // Goal will be achieved early
      if (weeksToGoal < weeksToTarget * 0.5 && weeksToTarget > 4) {
        recommendations.push({
          type: 'increase_target',
          goalId: goal.id,
          goalType: goal.goal_type,
          currentTarget: targetValue,
          recommendedTarget: startValue + (changePerWeek * weeksToTarget * 0.8),
          reason: `Excellent progress! On track to achieve goal ${(weeksToTarget - weeksToGoal).toFixed(1)} weeks early. Consider increasing target.`,
          priority: 'low',
          basedOn: {
            progressRate: `${Math.abs(changePerWeek).toFixed(2)} per week`,
            timeRemaining: `${weeksToTarget.toFixed(1)} weeks`,
          },
        });
      }
    }

    // Check for stalled progress
    if (values.length >= 4) {
      const recentValues = values.slice(-4);
      const recentChange = Math.abs(recentValues[recentValues.length - 1] - recentValues[0]);
      const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / recentValues.length;

      if (variance < 1 && recentChange < 1) {
        recommendations.push({
          type: 'focus_shift',
          goalId: goal.id,
          goalType: goal.goal_type,
          reason: `Progress has plateaued (variance: ${variance.toFixed(2)}). Consider adjusting workout or nutrition strategy.`,
          priority: 'medium',
          basedOn: {
            trendAnalysis: 'Minimal change in last 4 measurements',
            progressRate: `${Math.abs(changePerWeek).toFixed(2)} per week`,
          },
        });
      }
    }

    // Check for unhealthy rate of change
    const healthyRates: Record<string, { min: number; max: number }> = {
      weight_loss: { min: 0.5, max: 2 }, // lbs per week
      body_fat_reduction: { min: 0.2, max: 1 }, // % per week
      muscle_gain: { min: 0.25, max: 0.5 }, // lbs per week
    };

    const healthyRate = healthyRates[goal.goal_type];
    if (healthyRate && Math.abs(changePerWeek) > healthyRate.max) {
      recommendations.push({
        type: 'decrease_target',
        goalId: goal.id,
        goalType: goal.goal_type,
        reason: `Rate of change (${Math.abs(changePerWeek).toFixed(2)}/week) exceeds healthy maximum (${healthyRate.max}/week). Consider slowing down to maintain health.`,
        priority: 'high',
        basedOn: {
          progressRate: `${Math.abs(changePerWeek).toFixed(2)} per week`,
          feasibility: `Healthy range: ${healthyRate.min}-${healthyRate.max} per week`,
        },
      });
    }

    return recommendations;
  }

  /**
   * Suggest initial goals based on current body composition
   */
  private suggestInitialGoals(scans: any[]): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];
    const latestScan = scans[scans.length - 1];

    // Suggest weight goal if BMI is outside healthy range
    if (latestScan.bmi) {
      if (latestScan.bmi > 25) {
        const targetWeight = latestScan.weight_lb * 0.9; // 10% reduction
        recommendations.push({
          type: 'create_goal',
          goalType: 'weight_loss',
          recommendedTarget: targetWeight,
          recommendedTimeline: '12 weeks',
          reason: `BMI of ${latestScan.bmi.toFixed(1)} suggests weight loss may be beneficial. Consider 10% reduction goal.`,
          priority: 'medium',
          basedOn: {
            trendAnalysis: `Current BMI: ${latestScan.bmi.toFixed(1)}`,
          },
        });
      }
    }

    // Suggest body fat goal if percentage is high
    if (latestScan.body_fat_percentage) {
      if (latestScan.body_fat_percentage > 25) {
        const targetBF = latestScan.body_fat_percentage - 5;
        recommendations.push({
          type: 'create_goal',
          goalType: 'body_fat_reduction',
          recommendedTarget: targetBF,
          recommendedTimeline: '16 weeks',
          reason: `Body fat at ${latestScan.body_fat_percentage.toFixed(1)}%. Consider reducing to ${targetBF.toFixed(1)}% for improved health.`,
          priority: 'medium',
          basedOn: {
            trendAnalysis: `Current body fat: ${latestScan.body_fat_percentage.toFixed(1)}%`,
          },
        });
      }
    }

    // Suggest muscle gain goal if muscle mass is low
    if (latestScan.skeletal_muscle_mass_lb && latestScan.weight_lb) {
      const musclePercentage = (latestScan.skeletal_muscle_mass_lb / latestScan.weight_lb) * 100;
      if (musclePercentage < 35) {
        const targetMuscle = latestScan.skeletal_muscle_mass_lb + 5;
        recommendations.push({
          type: 'create_goal',
          goalType: 'muscle_gain',
          recommendedTarget: targetMuscle,
          recommendedTimeline: '12 weeks',
          reason: `Muscle mass at ${musclePercentage.toFixed(1)}% of body weight. Consider gaining 5 lbs of muscle.`,
          priority: 'low',
          basedOn: {
            trendAnalysis: `Current muscle: ${latestScan.skeletal_muscle_mass_lb.toFixed(1)} lbs`,
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Check if goals are realistic
   */
  private checkGoalRealism(goals: any[], scans: any[]): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    for (const goal of goals) {
      if (!goal.target_date) continue;

      const daysToTarget = (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      const weeksToTarget = daysToTarget / 7;

      if (weeksToTarget < 0) {
        recommendations.push({
          type: 'extend_timeline',
          goalId: goal.id,
          goalType: goal.goal_type,
          currentTimeline: goal.target_date,
          recommendedTimeline: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Target date has passed. Consider extending timeline or reassessing goal.',
          priority: 'high',
          basedOn: {
            timeRemaining: 'Overdue',
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Get metric field name for goal type
   */
  private getMetricField(goalType: string): string | null {
    const fieldMap: Record<string, string> = {
      'weight_loss': 'weight_lb',
      'weight_gain': 'weight_lb',
      'body_fat_reduction': 'body_fat_percentage',
      'muscle_gain': 'skeletal_muscle_mass_lb',
      'bmi_target': 'bmi',
    };
    return fieldMap[goalType] || null;
  }

  /**
   * Check if goal is achieved
   */
  private isGoalAchieved(currentValue: number, targetValue: number, goalType: string): boolean {
    const tolerance = 0.5; // Allow 0.5 unit tolerance
    
    if (goalType.includes('loss') || goalType.includes('reduction')) {
      return currentValue <= targetValue + tolerance;
    } else {
      return currentValue >= targetValue - tolerance;
    }
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    recommendations: GoalRecommendation[],
    goals: any[],
    scans: any[]
  ): string {
    if (goals.length === 0) {
      return 'No active goals set. Consider setting body composition goals based on recommendations.';
    }

    const achievements = recommendations.filter(r => r.type === 'celebrate_achievement').length;
    const adjustments = recommendations.filter(r => r.type === 'adjust_goal').length;
    const concerns = recommendations.filter(r => r.priority === 'high').length;

    if (achievements > 0) {
      return `Congratulations! ${achievements} goal(s) achieved. Excellent progress!`;
    }

    if (concerns >= 2) {
      return `${concerns} high-priority concerns detected. Goals may need significant adjustment.`;
    }

    if (adjustments > 0) {
      return `${adjustments} goal(s) need adjustment based on current progress rate.`;
    }

    return 'Goals are on track. Continue current approach.';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(scanCount: number): number {
    // Need at least 4 scans for high confidence
    return Math.min((scanCount / 4) * 100, 100);
  }

  /**
   * Create a new goal based on recommendation
   */
  async createGoalFromRecommendation(
    userId: string,
    recommendation: GoalRecommendation
  ): Promise<string> {
    try {
      const { data: goal } = await supabase
        .from('body_composition_goals')
        .insert({
          user_id: userId,
          goal_type: recommendation.goalType,
          target_value: recommendation.recommendedTarget,
          target_date: recommendation.recommendedTimeline,
          status: 'active',
          created_by: 'agent',
          notes: recommendation.reason,
        })
        .select()
        .single();

      logger.info('Goal created from agent recommendation', {
        userId,
        goalId: goal.id,
        goalType: recommendation.goalType,
      });

      return goal.id;
    } catch (error) {
      logger.error('Error creating goal from recommendation', { error, userId });
      throw error;
    }
  }
}

export const bodyCompositionGoalAgent = new BodyCompositionGoalAgent();

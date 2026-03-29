// Goal Management Engine
// Comprehensive goal tracking with templates, progress monitoring, and milestone celebrations

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface GoalTemplate {
  id?: string;
  templateName: string;
  templateCategory: string;
  description: string;
  goalType: string;
  primaryMetric: string;
  secondaryMetrics?: string[];
  defaultDurationDays: number;
  difficultyLevel: string;
  milestonePercentages: number[];
  successTips: string[];
}

export interface Goal {
  id?: string;
  userId: string;
  templateId?: string;
  goalName: string;
  goalCategory: string;
  goalType: string;
  description?: string;
  startDate: string;
  targetDate: string;
  status?: string;
  whyImportant?: string;
  motivationLevel?: number;
}

export interface GoalMetric {
  id?: string;
  goalId: string;
  metricName: string;
  metricType: string;
  metricUnit: string;
  startingValue: number;
  targetValue: number;
  currentValue?: number;
  direction: 'increase' | 'decrease' | 'maintain';
  isPrimary: boolean;
  updateFrequency?: string;
}

export interface GoalProgress {
  goalId: string;
  progressDate: string;
  overallProgressPercentage: number;
  daysElapsed: number;
  daysRemaining: number;
  onTrack: boolean;
  expectedProgress: number;
  actualProgress: number;
  paceVsTarget: number;
  predictedCompletionDate?: string;
  likelihoodOfSuccess: number;
  metricsSnapshot?: any;
  notes?: string;
  moodRating?: number;
}

export interface Milestone {
  id?: string;
  goalId: string;
  milestoneName: string;
  milestonePercentage: number;
  milestoneOrder: number;
  targetValue?: number;
  targetDate?: string;
  achieved?: boolean;
  achievedDate?: string;
  celebrationMessage?: string;
  celebrationEmoji?: string;
}

export interface GoalRecommendation {
  userId: string;
  recommendationType: string;
  recommendedGoalTemplateId?: string;
  recommendationReason: string;
  basedOnData: string[];
  confidenceScore: number;
  suggestedGoalName: string;
  suggestedCategory: string;
  suggestedDurationDays: number;
  suggestedTargetValue?: number;
  priority: 'high' | 'medium' | 'low';
  urgency: string;
  expectedBenefit: string;
  successProbability: number;
}

export interface Achievement {
  userId: string;
  goalId: string;
  achievementType: string;
  achievementName: string;
  achievementDate: string;
  achievementValue?: number;
  achievementDescription: string;
  badgeEarned?: string;
  badgeIcon?: string;
  pointsEarned?: number;
  celebrationMessage: string;
}

export class GoalManagementEngine {
  
  /**
   * Get all goal templates
   */
  async getGoalTemplates(category?: string): Promise<GoalTemplate[]> {
    try {
      let query = supabase
        .from('goal_templates')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('template_category', category);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;

      logger.info('Goal templates retrieved', { count: data?.length, category });

      return data || [];
    } catch (error) {
      logger.error('Error getting goal templates', { error, category });
      throw error;
    }
  }

  /**
   * Create a new goal from template
   */
  async createGoalFromTemplate(
    userId: string,
    templateId: string,
    customizations?: Partial<Goal>
  ): Promise<string> {
    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('goal_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create goal
      const startDate = new Date().toISOString().split('T')[0];
      const targetDate = new Date(Date.now() + template.default_duration_days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const goal: Goal = {
        userId,
        templateId,
        goalName: customizations?.goalName || template.template_name,
        goalCategory: template.template_category,
        goalType: template.goal_type,
        description: customizations?.description || template.description,
        startDate: customizations?.startDate || startDate,
        targetDate: customizations?.targetDate || targetDate,
        whyImportant: customizations?.whyImportant,
        motivationLevel: customizations?.motivationLevel || 7,
      };

      const { data: createdGoal, error: goalError } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (goalError) throw goalError;

      // Create primary metric
      if (template.primary_metric) {
        await this.createGoalMetric({
          goalId: createdGoal.id,
          metricName: template.primary_metric,
          metricType: 'numeric',
          metricUnit: this.getMetricUnit(template.primary_metric),
          startingValue: 0, // User will update
          targetValue: 0, // User will update
          direction: this.getMetricDirection(template.template_category),
          isPrimary: true,
        });
      }

      // Create milestones
      if (template.milestone_percentages) {
        for (let i = 0; i < template.milestone_percentages.length; i++) {
          await this.createMilestone({
            goalId: createdGoal.id,
            milestoneName: `${template.milestone_percentages[i]}% Complete`,
            milestonePercentage: template.milestone_percentages[i],
            milestoneOrder: i + 1,
            celebrationMessage: this.generateCelebrationMessage(template.milestone_percentages[i]),
            celebrationEmoji: this.getCelebrationEmoji(template.milestone_percentages[i]),
          });
        }
      }

      // Update template usage count
      await supabase
        .from('goal_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      logger.info('Goal created from template', { userId, goalId: createdGoal.id, templateId });

      return createdGoal.id;
    } catch (error) {
      logger.error('Error creating goal from template', { error, userId, templateId });
      throw error;
    }
  }

  /**
   * Create a custom goal
   */
  async createCustomGoal(goal: Goal, metrics: GoalMetric[]): Promise<string> {
    try {
      const { data: createdGoal, error: goalError } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (goalError) throw goalError;

      // Create metrics
      for (const metric of metrics) {
        await this.createGoalMetric({
          ...metric,
          goalId: createdGoal.id,
        });
      }

      // Create default milestones
      const defaultMilestones = [25, 50, 75, 100];
      for (let i = 0; i < defaultMilestones.length; i++) {
        await this.createMilestone({
          goalId: createdGoal.id,
          milestoneName: `${defaultMilestones[i]}% Complete`,
          milestonePercentage: defaultMilestones[i],
          milestoneOrder: i + 1,
          celebrationMessage: this.generateCelebrationMessage(defaultMilestones[i]),
          celebrationEmoji: this.getCelebrationEmoji(defaultMilestones[i]),
        });
      }

      logger.info('Custom goal created', { userId: goal.userId, goalId: createdGoal.id });

      return createdGoal.id;
    } catch (error) {
      logger.error('Error creating custom goal', { error, goal });
      throw error;
    }
  }

  /**
   * Update goal metric value
   */
  async updateGoalMetric(metricId: string, newValue: number): Promise<void> {
    try {
      // Update metric using stored procedure
      const { error } = await supabase.rpc('update_goal_metric_progress', {
        p_metric_id: metricId,
        p_new_value: newValue,
      });

      if (error) throw error;

      // Get goal ID from metric
      const { data: metric } = await supabase
        .from('goal_metrics')
        .select('goal_id')
        .eq('id', metricId)
        .single();

      if (metric) {
        // Record progress snapshot
        await this.recordProgressSnapshot(metric.goal_id);

        // Check for milestone achievements
        await this.checkMilestoneAchievements(metric.goal_id);
      }

      logger.info('Goal metric updated', { metricId, newValue });
    } catch (error) {
      logger.error('Error updating goal metric', { error, metricId, newValue });
      throw error;
    }
  }

  /**
   * Record progress snapshot
   */
  async recordProgressSnapshot(goalId: string, notes?: string, moodRating?: number): Promise<void> {
    try {
      // Calculate overall progress
      const { data: overallProgress } = await supabase.rpc('calculate_goal_progress', {
        p_goal_id: goalId,
      });

      // Check if on track
      const { data: onTrack } = await supabase.rpc('is_goal_on_track', {
        p_goal_id: goalId,
      });

      // Get goal details
      const { data: goal } = await supabase
        .from('goals')
        .select('start_date, target_date')
        .eq('id', goalId)
        .single();

      if (!goal) return;

      const startDate = new Date(goal.start_date);
      const targetDate = new Date(goal.target_date);
      const today = new Date();

      const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
      const actualProgress = overallProgress || 0;
      const paceVsTarget = expectedProgress > 0 ? ((actualProgress - expectedProgress) / expectedProgress) * 100 : 0;

      // Predict completion date
      let predictedCompletionDate = null;
      let likelihoodOfSuccess = 50;

      if (actualProgress > 0 && daysElapsed > 0) {
        const dailyProgress = actualProgress / daysElapsed;
        const remainingProgress = 100 - actualProgress;
        const daysToComplete = Math.ceil(remainingProgress / dailyProgress);
        predictedCompletionDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        // Calculate likelihood
        if (onTrack) {
          likelihoodOfSuccess = Math.min(95, 70 + (actualProgress / expectedProgress) * 25);
        } else {
          likelihoodOfSuccess = Math.max(20, 50 - Math.abs(paceVsTarget) / 2);
        }
      }

      // Get metrics snapshot
      const { data: metrics } = await supabase
        .from('goal_metrics')
        .select('*')
        .eq('goal_id', goalId);

      const progress: GoalProgress = {
        goalId,
        progressDate: today.toISOString().split('T')[0],
        overallProgressPercentage: actualProgress,
        daysElapsed,
        daysRemaining,
        onTrack: onTrack || false,
        expectedProgress,
        actualProgress,
        paceVsTarget,
        predictedCompletionDate,
        likelihoodOfSuccess,
        metricsSnapshot: metrics,
        notes,
        moodRating,
      };

      await supabase.from('goal_progress').upsert(progress, {
        onConflict: 'goal_id,progress_date',
      });

      logger.info('Progress snapshot recorded', { goalId, progress: actualProgress });
    } catch (error) {
      logger.error('Error recording progress snapshot', { error, goalId });
      throw error;
    }
  }

  /**
   * Check and celebrate milestone achievements
   */
  async checkMilestoneAchievements(goalId: string): Promise<Achievement[]> {
    try {
      const achievements: Achievement[] = [];

      // Check milestones
      const { data: milestones } = await supabase.rpc('check_milestone_achievements', {
        p_goal_id: goalId,
      });

      if (!milestones) return achievements;

      // Get goal and user info
      const { data: goal } = await supabase
        .from('goals')
        .select('user_id, goal_name')
        .eq('id', goalId)
        .single();

      if (!goal) return achievements;

      // Process newly achieved milestones
      for (const milestone of milestones) {
        if (milestone.newly_achieved) {
          // Mark milestone as achieved
          await supabase
            .from('goal_milestones')
            .update({
              achieved: true,
              achieved_date: new Date().toISOString().split('T')[0],
              days_to_achieve: Math.floor(
                (new Date().getTime() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24)
              ),
            })
            .eq('id', milestone.milestone_id);

          // Create achievement
          const achievement: Achievement = {
            userId: goal.user_id,
            goalId,
            achievementType: 'milestone_reached',
            achievementName: `${milestone.milestone_name} - ${goal.goal_name}`,
            achievementDate: new Date().toISOString().split('T')[0],
            achievementDescription: `Reached ${milestone.milestone_percentage}% of your goal!`,
            badgeEarned: this.getMilestoneBadge(milestone.milestone_percentage),
            badgeIcon: this.getCelebrationEmoji(milestone.milestone_percentage),
            pointsEarned: milestone.milestone_percentage,
            celebrationMessage: this.generateCelebrationMessage(milestone.milestone_percentage),
          };

          await this.createAchievement(achievement);
          achievements.push(achievement);
        }
      }

      // Check for goal completion
      const { data: progress } = await supabase.rpc('calculate_goal_progress', {
        p_goal_id: goalId,
      });

      if (progress >= 100) {
        await this.completeGoal(goalId);
      }

      logger.info('Milestone achievements checked', { goalId, newAchievements: achievements.length });

      return achievements;
    } catch (error) {
      logger.error('Error checking milestone achievements', { error, goalId });
      throw error;
    }
  }

  /**
   * Complete a goal
   */
  async completeGoal(goalId: string): Promise<void> {
    try {
      const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (!goal || goal.status === 'completed') return;

      // Update goal status
      await supabase
        .from('goals')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', goalId);

      // Create completion achievement
      const achievement: Achievement = {
        userId: goal.user_id,
        goalId,
        achievementType: 'goal_completed',
        achievementName: `Completed: ${goal.goal_name}`,
        achievementDate: new Date().toISOString().split('T')[0],
        achievementDescription: `Congratulations! You completed your goal: ${goal.goal_name}`,
        badgeEarned: 'Goal Champion',
        badgeIcon: '🏆',
        pointsEarned: 500,
        celebrationMessage: '🎉 Amazing work! You crushed this goal! 🎉',
      };

      await this.createAchievement(achievement);

      logger.info('Goal completed', { goalId, userId: goal.user_id });
    } catch (error) {
      logger.error('Error completing goal', { error, goalId });
      throw error;
    }
  }

  /**
   * Generate goal recommendations
   */
  async generateGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    try {
      const recommendations: GoalRecommendation[] = [];

      // Get user's goal statistics
      const { data: stats } = await supabase.rpc('get_goal_statistics', {
        p_user_id: userId,
      });

      if (!stats || stats.length === 0) return recommendations;

      const userStats = stats[0];

      // Recommend first goal if user has none
      if (userStats.total_goals === 0) {
        recommendations.push({
          userId,
          recommendationType: 'new_goal',
          recommendationReason: 'Start your fitness journey with a goal!',
          basedOnData: ['No active goals'],
          confidenceScore: 95,
          suggestedGoalName: 'Lose 10 Pounds',
          suggestedCategory: 'weight_loss',
          suggestedDurationDays: 90,
          priority: 'high',
          urgency: 'immediate',
          expectedBenefit: 'Build momentum and establish healthy habits',
          successProbability: 85,
        });
      }

      // Recommend stretch goal if user is successful
      if (userStats.completion_rate > 75 && userStats.active_goals < 3) {
        recommendations.push({
          userId,
          recommendationType: 'stretch_goal',
          recommendationReason: 'You have a great track record! Time for a challenge.',
          basedOnData: [`${userStats.completion_rate}% completion rate`, `${userStats.completed_goals} goals completed`],
          confidenceScore: 85,
          suggestedGoalName: 'Advanced Strength Goal',
          suggestedCategory: 'strength',
          suggestedDurationDays: 120,
          priority: 'medium',
          urgency: 'within_week',
          expectedBenefit: 'Push your limits and achieve new personal bests',
          successProbability: 75,
        });
      }

      // Recommend maintenance goal if user completed a goal
      if (userStats.completed_goals > 0 && userStats.active_goals === 0) {
        recommendations.push({
          userId,
          recommendationType: 'maintenance_goal',
          recommendationReason: 'Maintain your progress with a new goal',
          basedOnData: [`${userStats.completed_goals} goals completed`, 'No active goals'],
          confidenceScore: 80,
          suggestedGoalName: 'Maintain Current Weight',
          suggestedCategory: 'health',
          suggestedDurationDays: 90,
          priority: 'medium',
          urgency: 'within_month',
          expectedBenefit: 'Keep your hard-earned progress',
          successProbability: 90,
        });
      }

      // Save recommendations
      for (const rec of recommendations) {
        await this.saveGoalRecommendation(rec);
      }

      logger.info('Goal recommendations generated', { userId, count: recommendations.length });

      return recommendations;
    } catch (error) {
      logger.error('Error generating goal recommendations', { error, userId });
      throw error;
    }
  }

  /**
   * Get active goals for user
   */
  async getActiveGoals(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_active_goals', {
        p_user_id: userId,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting active goals', { error, userId });
      throw error;
    }
  }

  /**
   * Get goal details with metrics and progress
   */
  async getGoalDetails(goalId: string): Promise<any> {
    try {
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      const { data: metrics } = await supabase
        .from('goal_metrics')
        .select('*')
        .eq('goal_id', goalId);

      const { data: milestones } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goalId)
        .order('milestone_order');

      const { data: progress } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('progress_date', { ascending: false })
        .limit(30);

      return {
        ...goal,
        metrics,
        milestones,
        progressHistory: progress,
      };
    } catch (error) {
      logger.error('Error getting goal details', { error, goalId });
      throw error;
    }
  }

  /**
   * Helper: Create goal metric
   */
  private async createGoalMetric(metric: GoalMetric): Promise<void> {
    await supabase.from('goal_metrics').insert(metric);
  }

  /**
   * Helper: Create milestone
   */
  private async createMilestone(milestone: Milestone): Promise<void> {
    await supabase.from('goal_milestones').insert(milestone);
  }

  /**
   * Helper: Create achievement
   */
  private async createAchievement(achievement: Achievement): Promise<void> {
    await supabase.from('goal_achievements').insert(achievement);
  }

  /**
   * Helper: Save goal recommendation
   */
  private async saveGoalRecommendation(recommendation: GoalRecommendation): Promise<void> {
    await supabase.from('goal_recommendations').insert(recommendation);
  }

  /**
   * Helper: Get metric unit
   */
  private getMetricUnit(metricName: string): string {
    const unitMap: { [key: string]: string } = {
      body_weight: 'lb',
      body_fat_percent: '%',
      bench_press_1rm: 'lb',
      squat_1rm: 'lb',
      deadlift_1rm: 'lb',
      pullup_max_reps: 'reps',
      running_distance: 'miles',
      sleep_duration_hours: 'hours',
      resting_heart_rate: 'bpm',
      flexibility_score: 'score',
    };

    return unitMap[metricName] || 'units';
  }

  /**
   * Helper: Get metric direction
   */
  private getMetricDirection(category: string): 'increase' | 'decrease' | 'maintain' {
    const directionMap: { [key: string]: 'increase' | 'decrease' | 'maintain' } = {
      weight_loss: 'decrease',
      muscle_gain: 'increase',
      strength: 'increase',
      endurance: 'increase',
      health: 'maintain',
      performance: 'increase',
    };

    return directionMap[category] || 'increase';
  }

  /**
   * Helper: Generate celebration message
   */
  private generateCelebrationMessage(percentage: number): string {
    const messages: { [key: number]: string } = {
      25: "Great start! You're 25% there! Keep up the momentum! 💪",
      50: "Halfway there! You're crushing it! 🎯",
      75: "Almost there! 75% complete! The finish line is in sight! 🏃",
      100: "🎉 GOAL ACHIEVED! You did it! Incredible work! 🏆",
    };

    return messages[percentage] || `${percentage}% complete! Keep going!`;
  }

  /**
   * Helper: Get celebration emoji
   */
  private getCelebrationEmoji(percentage: number): string {
    const emojiMap: { [key: number]: string } = {
      25: '🌟',
      50: '🔥',
      75: '⚡',
      100: '🏆',
    };

    return emojiMap[percentage] || '✨';
  }

  /**
   * Helper: Get milestone badge
   */
  private getMilestoneBadge(percentage: number): string {
    const badgeMap: { [key: number]: string } = {
      25: 'Quarter Master',
      50: 'Halfway Hero',
      75: 'Almost There',
      100: 'Goal Champion',
    };

    return badgeMap[percentage] || 'Progress Maker';
  }
}

export const goalManagementEngine = new GoalManagementEngine();

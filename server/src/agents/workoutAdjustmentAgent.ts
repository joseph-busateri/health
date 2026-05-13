// Workout Adjustment Agent
// Analyzes workout execution data and recommends plan adjustments

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

interface WorkoutAnalysis {
  userId: string;
  planVersionId: string;
  analysisDate: string;
  recommendations: WorkoutRecommendation[];
  overallAssessment: string;
  confidenceScore: number;
}

interface WorkoutRecommendation {
  type: 'increase_weight' | 'decrease_weight' | 'increase_reps' | 'decrease_reps' | 
        'add_sets' | 'remove_sets' | 'deload_week' | 'exercise_substitution' | 
        'rest_day' | 'intensity_adjustment';
  exerciseId?: string;
  exerciseName?: string;
  currentValue?: string;
  recommendedValue?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  basedOn: {
    rpePattern?: string;
    formQualityPattern?: string;
    adherencePattern?: string;
    performanceTrend?: string;
  };
}

export class WorkoutAdjustmentAgent {
  
  /**
   * Analyze recent workout execution and generate recommendations
   */
  async analyzeWorkoutPerformance(userId: string, days: number = 14): Promise<WorkoutAnalysis> {
    try {
      // Get current workout plan
      const { data: currentPlan } = await supabase
        .from('workout_plan_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (!currentPlan) {
        throw new Error('No current workout plan found');
      }

      // Get recent execution logs
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: executionLogs } = await supabase
        .from('workout_execution_log')
        .select(`
          *,
          workout_exercises (
            exercise_name,
            sets,
            reps,
            weight
          )
        `)
        .eq('user_id', userId)
        .eq('plan_version_id', currentPlan.id)
        .gte('execution_date', startDate.toISOString().split('T')[0])
        .order('execution_date', { ascending: false });

      if (!executionLogs || executionLogs.length === 0) {
        return {
          userId,
          planVersionId: currentPlan.id,
          analysisDate: new Date().toISOString(),
          recommendations: [],
          overallAssessment: 'Insufficient data for analysis. Need at least 2 weeks of execution logs.',
          confidenceScore: 0,
        };
      }

      // Analyze patterns
      const recommendations: WorkoutRecommendation[] = [];

      // Group logs by exercise
      const exerciseGroups = this.groupByExercise(executionLogs);

      for (const [exerciseId, logs] of Object.entries(exerciseGroups)) {
        const exerciseRecs = this.analyzeExercise(logs);
        recommendations.push(...exerciseRecs);
      }

      // Check for deload needs
      const deloadRec = this.checkDeloadNeeds(executionLogs);
      if (deloadRec) {
        recommendations.push(deloadRec);
      }

      // Check adherence patterns
      const adherenceRec = this.checkAdherence(executionLogs, days);
      if (adherenceRec) {
        recommendations.push(adherenceRec);
      }

      // Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(recommendations, executionLogs);
      const confidenceScore = this.calculateConfidenceScore(executionLogs.length, days);

      logger.info('Workout performance analysis complete', {
        userId,
        recommendationCount: recommendations.length,
        confidenceScore,
      });

      return {
        userId,
        planVersionId: currentPlan.id,
        analysisDate: new Date().toISOString(),
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
        overallAssessment,
        confidenceScore,
      };
    } catch (error) {
      logger.error('Error analyzing workout performance', { error, userId });
      throw error;
    }
  }

  /**
   * Analyze individual exercise performance
   */
  private analyzeExercise(logs: any[]): WorkoutRecommendation[] {
    const recommendations: WorkoutRecommendation[] = [];
    
    if (logs.length < 3) {
      return recommendations; // Need at least 3 sessions for pattern
    }

    const exerciseName = logs[0].workout_exercises?.exercise_name || 'Unknown';
    const exerciseId = logs[0].exercise_id;

    // Analyze RPE pattern
    const rpeValues = logs.map(l => l.rpe).filter(r => r !== null);
    if (rpeValues.length >= 3) {
      const avgRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
      const recentRPE = rpeValues.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

      // Consistently low RPE → increase weight
      if (recentRPE < 6.5 && avgRPE < 7) {
        recommendations.push({
          type: 'increase_weight',
          exerciseId,
          exerciseName,
          currentValue: logs[0].completed_weight || 'current',
          recommendedValue: 'Increase by 5-10%',
          reason: `RPE consistently low (avg ${avgRPE.toFixed(1)}). Room for progressive overload.`,
          priority: 'high',
          basedOn: {
            rpePattern: `Average RPE: ${avgRPE.toFixed(1)}, Recent: ${recentRPE.toFixed(1)}`,
          },
        });
      }

      // Consistently high RPE → decrease weight or deload
      if (recentRPE > 9 && avgRPE > 8.5) {
        recommendations.push({
          type: 'decrease_weight',
          exerciseId,
          exerciseName,
          currentValue: logs[0].completed_weight || 'current',
          recommendedValue: 'Decrease by 5-10%',
          reason: `RPE consistently too high (avg ${avgRPE.toFixed(1)}). Risk of overtraining.`,
          priority: 'high',
          basedOn: {
            rpePattern: `Average RPE: ${avgRPE.toFixed(1)}, Recent: ${recentRPE.toFixed(1)}`,
          },
        });
      }
    }

    // Analyze form quality
    const formScores = logs.map(l => l.form_quality).filter(f => f !== null);
    if (formScores.length >= 3) {
      const avgForm = formScores.reduce((a, b) => a + b, 0) / formScores.length;
      
      if (avgForm < 6) {
        recommendations.push({
          type: 'decrease_weight',
          exerciseId,
          exerciseName,
          reason: `Form quality declining (avg ${avgForm.toFixed(1)}/10). Reduce weight to maintain proper technique.`,
          priority: 'high',
          basedOn: {
            formQualityPattern: `Average form: ${avgForm.toFixed(1)}/10`,
          },
        });
      }
    }

    // Analyze completion rates
    const completionRates = logs.map(l => {
      if (!l.planned_reps || !l.completed_reps) return null;
      return (l.completed_reps / l.planned_reps) * 100;
    }).filter(r => r !== null);

    if (completionRates.length >= 3) {
      const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
      
      if (avgCompletion < 80) {
        recommendations.push({
          type: 'decrease_reps',
          exerciseId,
          exerciseName,
          reason: `Consistently unable to complete planned reps (${avgCompletion.toFixed(0)}% completion). Adjust rep targets.`,
          priority: 'medium',
          basedOn: {
            performanceTrend: `Average completion: ${avgCompletion.toFixed(0)}%`,
          },
        });
      }
    }

    return recommendations;
  }

  /**
   * Check if deload week is needed
   */
  private checkDeloadNeeds(logs: any[]): WorkoutRecommendation | null {
    // Check for signs of overtraining
    const recentLogs = logs.slice(0, 7); // Last 7 sessions
    
    if (recentLogs.length < 5) return null;

    const highRPECount = recentLogs.filter(l => l.rpe && l.rpe >= 9).length;
    const skippedCount = recentLogs.filter(l => l.skipped).length;
    const poorFormCount = recentLogs.filter(l => l.form_quality && l.form_quality < 6).length;

    const overtrainingScore = (highRPECount * 2) + (skippedCount * 3) + (poorFormCount * 2);

    if (overtrainingScore >= 10) {
      return {
        type: 'deload_week',
        reason: `Signs of overtraining detected. High RPE (${highRPECount}), skipped sessions (${skippedCount}), poor form (${poorFormCount}). Recommend deload week.`,
        priority: 'high',
        basedOn: {
          rpePattern: `${highRPECount} high RPE sessions`,
          formQualityPattern: `${poorFormCount} poor form sessions`,
          adherencePattern: `${skippedCount} skipped sessions`,
        },
      };
    }

    return null;
  }

  /**
   * Check adherence patterns
   */
  private checkAdherence(logs: any[], days: number): WorkoutRecommendation | null {
    const expectedSessions = Math.floor(days / 7) * 4; // Assuming 4 sessions/week
    const actualSessions = logs.length;
    const adherenceRate = (actualSessions / expectedSessions) * 100;

    if (adherenceRate < 60) {
      return {
        type: 'rest_day',
        reason: `Low adherence rate (${adherenceRate.toFixed(0)}%). Consider if program is too demanding or life circumstances require adjustment.`,
        priority: 'medium',
        basedOn: {
          adherencePattern: `${actualSessions}/${expectedSessions} sessions completed`,
        },
      };
    }

    return null;
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(recommendations: WorkoutRecommendation[], logs: any[]): string {
    if (recommendations.length === 0) {
      return 'Excellent progress! Current program is well-suited. Continue as planned.';
    }

    const highPriority = recommendations.filter(r => r.priority === 'high').length;
    const mediumPriority = recommendations.filter(r => r.priority === 'medium').length;

    if (highPriority >= 3) {
      return `Significant adjustments needed. ${highPriority} high-priority recommendations detected. Consider implementing changes to optimize progress and prevent overtraining.`;
    }

    if (highPriority > 0) {
      return `Good progress with room for optimization. ${highPriority} high-priority and ${mediumPriority} medium-priority adjustments recommended.`;
    }

    return `Solid performance. ${mediumPriority} minor adjustments recommended to continue progress.`;
  }

  /**
   * Calculate confidence score based on data availability
   */
  private calculateConfidenceScore(logCount: number, days: number): number {
    const expectedSessions = Math.floor(days / 7) * 4;
    const dataCompleteness = Math.min(logCount / expectedSessions, 1);
    return Math.round(dataCompleteness * 100);
  }

  /**
   * Group execution logs by exercise
   */
  private groupByExercise(logs: any[]): Record<string, any[]> {
    return logs.reduce((groups, log) => {
      const exerciseId = log.exercise_id;
      if (!groups[exerciseId]) {
        groups[exerciseId] = [];
      }
      groups[exerciseId].push(log);
      return groups;
    }, {} as Record<string, any[]>);
  }

  /**
   * Apply recommendations to create new workout plan version
   */
  async applyRecommendations(
    userId: string,
    recommendations: WorkoutRecommendation[],
    reason: string
  ): Promise<string> {
    try {
      // Get current plan
      const { data: currentPlan } = await supabase
        .from('workout_plan_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (!currentPlan) {
        throw new Error('No current workout plan found');
      }

      // Create new version
      const { data: newVersion } = await supabase
        .from('workout_plan_versions')
        .insert({
          user_id: userId,
          training_cycle_id: currentPlan.training_cycle_id,
          version_number: currentPlan.version_number + 1,
          created_by: 'agent',
          created_reason: reason,
          effective_from: new Date().toISOString().split('T')[0],
          is_current: true,
        })
        .select()
        .single();

      // Mark old version as not current
      await supabase
        .from('workout_plan_versions')
        .update({ is_current: false, effective_to: new Date().toISOString().split('T')[0] })
        .eq('id', currentPlan.id);

      // Log changes
      for (const rec of recommendations) {
        await supabase
          .from('workout_plan_changes')
          .insert({
            from_version_id: currentPlan.id,
            to_version_id: newVersion.id,
            change_type: rec.type,
            change_description: rec.reason,
            exercise_name: rec.exerciseName,
            old_value: rec.currentValue,
            new_value: rec.recommendedValue,
            reason: rec.reason,
            triggered_by_performance: true,
          });
      }

      logger.info('Workout recommendations applied', {
        userId,
        newVersionId: newVersion.id,
        recommendationCount: recommendations.length,
      });

      return newVersion.id;
    } catch (error) {
      logger.error('Error applying workout recommendations', { error, userId });
      throw error;
    }
  }
}

export const workoutAdjustmentAgent = new WorkoutAdjustmentAgent();

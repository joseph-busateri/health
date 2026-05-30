// Agent Coordinator
// Orchestrates all three agents and manages cross-system recommendations

import { workoutAdjustmentAgent } from './workoutAdjustmentAgent';
import { supplementOptimizationAgent } from './supplementOptimizationAgent';
import { bodyCompositionGoalAgent } from './bodyCompositionGoalAgent';
import { logger } from '../utils/logger';

interface ComprehensiveAnalysis {
  userId: string;
  analysisDate: string;
  workoutAnalysis: any;
  supplementAnalysis: any;
  goalAnalysis: any;
  crossSystemRecommendations: CrossSystemRecommendation[];
  overallHealthScore: number;
  priorityActions: string[];
}

interface CrossSystemRecommendation {
  type: 'nutrition_adjustment' | 'recovery_focus' | 'intensity_reduction' | 
        'supplement_timing' | 'goal_alignment' | 'holistic_approach';
  affectedSystems: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export class AgentCoordinator {
  
  /**
   * Run comprehensive analysis across all systems
   */
  async runComprehensiveAnalysis(userId: string): Promise<ComprehensiveAnalysis> {
    try {
      logger.info('Starting comprehensive analysis', { userId });

      // Run all three agents in parallel
      const [workoutAnalysis, supplementAnalysis, goalAnalysis] = await Promise.all([
        workoutAdjustmentAgent.analyzeWorkoutPerformance(userId, 14),
        supplementOptimizationAgent.analyzeSupplementStack(userId, 30),
        bodyCompositionGoalAgent.analyzeGoals(userId),
      ]);

      // Analyze cross-system patterns
      const crossSystemRecommendations = this.analyzeCrossSystemPatterns(
        workoutAnalysis,
        supplementAnalysis,
        goalAnalysis
      );

      // Calculate overall health score
      const overallHealthScore = this.calculateOverallHealthScore(
        workoutAnalysis,
        supplementAnalysis,
        goalAnalysis
      );

      // Generate priority actions
      const priorityActions = this.generatePriorityActions(
        workoutAnalysis,
        supplementAnalysis,
        goalAnalysis,
        crossSystemRecommendations
      );

      logger.info('Comprehensive analysis complete', {
        userId,
        healthScore: overallHealthScore,
        priorityActionCount: priorityActions.length,
      });

      return {
        userId,
        analysisDate: new Date().toISOString(),
        workoutAnalysis,
        supplementAnalysis,
        goalAnalysis,
        crossSystemRecommendations,
        overallHealthScore,
        priorityActions,
      };
    } catch (error) {
      logger.error('Error running comprehensive analysis', { error, userId });
      throw error;
    }
  }

  /**
   * Analyze patterns across multiple systems
   */
  private analyzeCrossSystemPatterns(
    workoutAnalysis: any,
    supplementAnalysis: any,
    goalAnalysis: any
  ): CrossSystemRecommendation[] {
    const recommendations: CrossSystemRecommendation[] = [];

    // Check for overtraining + inadequate recovery supplements
    const hasDeloadRec = workoutAnalysis.recommendations.some(
      (r: any) => r.type === 'deload_week'
    );
    const hasMagnesium = supplementAnalysis.recommendations.some(
      (r: any) => r.supplementName?.toLowerCase().includes('magnesium')
    );

    if (hasDeloadRec && !hasMagnesium) {
      recommendations.push({
        type: 'recovery_focus',
        affectedSystems: ['workout', 'supplement'],
        reason: 'Signs of overtraining detected. Consider adding recovery-focused supplements (magnesium, zinc, vitamin D) and implementing deload week.',
        priority: 'high',
        actionItems: [
          'Schedule deload week',
          'Add magnesium supplement (400mg before bed)',
          'Ensure adequate sleep (7-9 hours)',
          'Consider reducing training volume by 40-50%',
        ],
      });
    }

    // Check for weight loss goal + high training intensity
    const hasWeightLossGoal = goalAnalysis.currentGoals.some(
      (g: any) => g.goal_type === 'weight_loss'
    );
    const hasHighIntensity = workoutAnalysis.recommendations.some(
      (r: any) => r.basedOn?.rpePattern?.includes('9') || r.basedOn?.rpePattern?.includes('10')
    );

    if (hasWeightLossGoal && hasHighIntensity) {
      recommendations.push({
        type: 'nutrition_adjustment',
        affectedSystems: ['workout', 'goal', 'supplement'],
        reason: 'High training intensity during caloric deficit may lead to muscle loss. Consider protein supplementation and moderate intensity.',
        priority: 'high',
        actionItems: [
          'Increase protein intake (1g per lb body weight)',
          'Consider whey protein supplement post-workout',
          'Reduce workout intensity (RPE 7-8 instead of 9-10)',
          'Add BCAAs if training fasted',
        ],
      });
    }

    // Check for muscle gain goal + low protein supplementation
    const hasMuscleGainGoal = goalAnalysis.currentGoals.some(
      (g: any) => g.goal_type === 'muscle_gain'
    );
    const hasProteinSupplement = supplementAnalysis.recommendations.some(
      (r: any) => r.supplementName?.toLowerCase().includes('protein') ||
                  r.supplementName?.toLowerCase().includes('creatine')
    );

    if (hasMuscleGainGoal && !hasProteinSupplement) {
      recommendations.push({
        type: 'supplement_timing',
        affectedSystems: ['supplement', 'goal', 'workout'],
        reason: 'Muscle gain goal detected without protein/creatine supplementation. These are highly effective for muscle building.',
        priority: 'medium',
        actionItems: [
          'Add whey protein (25-30g post-workout)',
          'Add creatine monohydrate (5g daily)',
          'Ensure total protein intake of 0.8-1g per lb body weight',
          'Time protein intake around workouts',
        ],
      });
    }

    // Check for poor adherence across systems
    const lowWorkoutAdherence = workoutAnalysis.recommendations.some(
      (r: any) => r.basedOn?.adherencePattern?.includes('Low adherence')
    );
    const lowSupplementAdherence = supplementAnalysis.recommendations.some(
      (r: any) => r.basedOn?.adherencePattern && 
                  parseFloat(r.basedOn.adherencePattern) < 60
    );

    if (lowWorkoutAdherence && lowSupplementAdherence) {
      recommendations.push({
        type: 'holistic_approach',
        affectedSystems: ['workout', 'supplement', 'goal'],
        reason: 'Low adherence across multiple systems suggests lifestyle or motivation challenges. Consider simplifying routines.',
        priority: 'high',
        actionItems: [
          'Reduce workout frequency to 3x per week',
          'Simplify supplement stack to 3-5 core supplements',
          'Set smaller, more achievable short-term goals',
          'Consider working with a coach or accountability partner',
        ],
      });
    }

    // Check for goal misalignment
    const hasConflictingGoals = this.checkGoalConflicts(goalAnalysis.currentGoals);
    if (hasConflictingGoals) {
      recommendations.push({
        type: 'goal_alignment',
        affectedSystems: ['goal', 'workout', 'supplement'],
        reason: 'Conflicting goals detected (e.g., simultaneous muscle gain and fat loss). Focus on one primary goal.',
        priority: 'medium',
        actionItems: [
          'Choose primary goal (muscle gain OR fat loss)',
          'Align workout program with primary goal',
          'Adjust supplement stack to support primary goal',
          'Set secondary goal for next phase (12-16 weeks later)',
        ],
      });
    }

    // Check for supplement-workout timing optimization
    const hasPreWorkoutSupplement = supplementAnalysis.recommendations.some(
      (r: any) => r.currentTiming?.toLowerCase().includes('pre-workout') ||
                  r.supplementName?.toLowerCase().includes('caffeine')
    );

    if (!hasPreWorkoutSupplement && workoutAnalysis.recommendations.length > 0) {
      recommendations.push({
        type: 'supplement_timing',
        affectedSystems: ['supplement', 'workout'],
        reason: 'Workout performance could benefit from pre-workout supplementation for energy and focus.',
        priority: 'low',
        actionItems: [
          'Consider caffeine (200mg) 30-45 min pre-workout',
          'Add beta-alanine for endurance (3-5g daily)',
          'Time carbohydrate intake 1-2 hours pre-workout',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Check for conflicting goals
   */
  private checkGoalConflicts(goals: any[]): boolean {
    const goalTypes = goals.map(g => g.goal_type);
    
    // Muscle gain + weight loss are conflicting
    if (goalTypes.includes('muscle_gain') && goalTypes.includes('weight_loss')) {
      return true;
    }

    // Body fat reduction + muscle gain can conflict
    if (goalTypes.includes('body_fat_reduction') && goalTypes.includes('muscle_gain')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateOverallHealthScore(
    workoutAnalysis: any,
    supplementAnalysis: any,
    goalAnalysis: any
  ): number {
    let score = 100;

    // Deduct for high-priority issues
    const totalHighPriority = 
      workoutAnalysis.recommendations.filter((r: any) => r.priority === 'high').length +
      supplementAnalysis.recommendations.filter((r: any) => r.priority === 'high').length +
      goalAnalysis.recommendations.filter((r: any) => r.priority === 'high').length;

    score -= totalHighPriority * 10;

    // Deduct for medium-priority issues
    const totalMediumPriority = 
      workoutAnalysis.recommendations.filter((r: any) => r.priority === 'medium').length +
      supplementAnalysis.recommendations.filter((r: any) => r.priority === 'medium').length +
      goalAnalysis.recommendations.filter((r: any) => r.priority === 'medium').length;

    score -= totalMediumPriority * 5;

    // Bonus for goal achievements
    const achievements = goalAnalysis.recommendations.filter(
      (r: any) => r.type === 'celebrate_achievement'
    ).length;
    score += achievements * 10;

    // Factor in confidence scores
    const avgConfidence = (
      workoutAnalysis.confidenceScore +
      supplementAnalysis.confidenceScore +
      goalAnalysis.confidenceScore
    ) / 3;

    // Adjust score based on data confidence
    score = score * (avgConfidence / 100);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate priority action list
   */
  private generatePriorityActions(
    workoutAnalysis: any,
    supplementAnalysis: any,
    goalAnalysis: any,
    crossSystemRecs: CrossSystemRecommendation[]
  ): string[] {
    const actions: string[] = [];

    // Add cross-system high-priority actions first
    crossSystemRecs
      .filter(r => r.priority === 'high')
      .forEach(r => {
        actions.push(`[CROSS-SYSTEM] ${r.reason}`);
        r.actionItems.forEach(item => actions.push(`  → ${item}`));
      });

    // Add individual system high-priority actions
    [workoutAnalysis, supplementAnalysis, goalAnalysis].forEach((analysis, index) => {
      const systemName = ['Workout', 'Supplement', 'Goal'][index];
      analysis.recommendations
        .filter((r: any) => r.priority === 'high')
        .slice(0, 2) // Top 2 per system
        .forEach((r: any) => {
          actions.push(`[${systemName.toUpperCase()}] ${r.reason}`);
        });
    });

    return actions.slice(0, 10); // Top 10 actions
  }

  /**
   * Auto-apply all agent recommendations
   */
  async autoApplyRecommendations(userId: string, analysis: ComprehensiveAnalysis): Promise<void> {
    try {
      logger.info('Auto-applying agent recommendations', { userId });

      // Apply workout recommendations
      const workoutHighPriority = analysis.workoutAnalysis.recommendations.filter(
        (r: any) => r.priority === 'high'
      );
      if (workoutHighPriority.length > 0) {
        await workoutAdjustmentAgent.applyRecommendations(
          userId,
          workoutHighPriority,
          'Agent auto-adjustment based on performance analysis'
        );
      }

      // Apply supplement recommendations
      const supplementHighPriority = analysis.supplementAnalysis.recommendations.filter(
        (r: any) => r.priority === 'high'
      );
      if (supplementHighPriority.length > 0) {
        await supplementOptimizationAgent.applyRecommendations(
          userId,
          supplementHighPriority,
          'Agent auto-optimization based on adherence and bloodwork'
        );
      }

      // Create goals from recommendations
      const goalCreationRecs = analysis.goalAnalysis.recommendations.filter(
        (r: any) => r.type === 'create_goal'
      );
      for (const rec of goalCreationRecs) {
        await bodyCompositionGoalAgent.createGoalFromRecommendation(userId, rec);
      }

      logger.info('Agent recommendations applied successfully', { userId });
    } catch (error) {
      logger.error('Error auto-applying recommendations', { error, userId });
      throw error;
    }
  }

  /**
   * Schedule periodic analysis (to be called by cron job)
   */
  async runScheduledAnalysis(userId: string): Promise<void> {
    try {
      const analysis = await this.runComprehensiveAnalysis(userId);

      // Auto-apply if health score is below threshold
      if (analysis.overallHealthScore < 70) {
        await this.autoApplyRecommendations(userId, analysis);
      }

      // TODO: Send notification to user with analysis summary
      logger.info('Scheduled analysis complete', {
        userId,
        healthScore: analysis.overallHealthScore,
        autoApplied: analysis.overallHealthScore < 70,
      });
    } catch (error) {
      logger.error('Error in scheduled analysis', { error, userId });
    }
  }
}

export const agentCoordinator = new AgentCoordinator();

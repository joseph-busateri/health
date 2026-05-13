import { logger } from '../utils/logger';
import { generateGoalOptimizations } from './goalOptimizationService';
import { scoreGoals, getPrimaryGoal } from './goalScoringService';
import { detectGoalConflicts, resolveGoalConflicts, calculateGoalAlignment } from './goalConflictResolver';
import type { GoalDrivenPlan, GoalOptimizationContext } from '../types/goalOptimization';

export function buildGoalDrivenPlan(context: GoalOptimizationContext): GoalDrivenPlan {
  logger.info('🔵 Building goal-driven plan', { userId: context.userId, goalCount: context.goals.length });

  if (context.goals.length === 0) {
    logger.warn('⚠️  No goals provided, returning default plan');
    return {
      adjustments: [],
      summary: 'No goals set. Set your health goals to receive personalized optimization.',
      goalAlignment: 0,
      source: 'fallback',
    };
  }

  // Step 1: Score goals against current state
  const goalScores = scoreGoals(context);
  const primaryGoal = getPrimaryGoal(context.goals, goalScores);

  logger.info('📊 Goal scoring complete', {
    primaryGoal,
    scores: goalScores.map(s => ({ goal: s.goal, overall: s.overallScore })),
  });

  // Step 2: Detect conflicts
  const conflicts = detectGoalConflicts(context.goals);
  
  if (conflicts.length > 0) {
    logger.info('⚠️  Goal conflicts detected', { conflictCount: conflicts.length });
  }

  // Step 3: Resolve conflicts
  const conflictResolutions = resolveGoalConflicts(context.goals, conflicts, context);

  // Step 4: Generate goal-specific optimizations
  const adjustments = generateGoalOptimizations(context);

  // Step 5: Calculate goal alignment
  const goalAlignment = calculateGoalAlignment(context.goals, adjustments, context);

  // Step 6: Generate summary
  const summary = generatePlanSummary(context, adjustments, primaryGoal, conflicts, goalAlignment);

  const plan: GoalDrivenPlan = {
    adjustments,
    summary,
    primaryGoal,
    goalAlignment,
    source: 'fallback',
  };

  logger.info('✅ Goal-driven plan built', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
    primaryGoal,
    goalAlignment,
    conflictCount: conflicts.length,
  });

  return plan;
}

function generatePlanSummary(
  context: GoalOptimizationContext,
  adjustments: any[],
  primaryGoal: string | undefined,
  conflicts: any[],
  goalAlignment: number
): string {
  if (!primaryGoal) {
    return 'Set your health goals to receive personalized optimization.';
  }

  const goalName = formatGoalName(primaryGoal);
  const alignmentLevel = goalAlignment > 75 ? 'excellent' : goalAlignment > 60 ? 'good' : goalAlignment > 40 ? 'moderate' : 'limited';

  let summary = `Optimizing for ${goalName}. `;

  // Add alignment context
  if (goalAlignment > 75) {
    summary += `Current state provides ${alignmentLevel} conditions for this goal. `;
  } else if (goalAlignment > 60) {
    summary += `Current state supports this goal with ${alignmentLevel} alignment. `;
  } else if (goalAlignment > 40) {
    summary += `Current state has ${alignmentLevel} alignment - adjustments recommended. `;
  } else {
    summary += `Current state has ${alignmentLevel} alignment - significant adjustments needed. `;
  }

  // Add adjustment count
  summary += `Implementing ${adjustments.length} goal-driven adjustment${adjustments.length !== 1 ? 's' : ''}`;

  // Add conflict note if present
  if (conflicts.length > 0) {
    summary += ` with ${conflicts.length} goal conflict${conflicts.length !== 1 ? 's' : ''} managed`;
  }

  summary += '.';

  return summary;
}

function formatGoalName(goal: string): string {
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function prioritizeGoalAdjustments(adjustments: any[]): any[] {
  // Sort by priority: critical > important > optimization
  const priorityOrder = { critical: 0, important: 1, optimization: 2 };
  
  return adjustments.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

export function getTopGoalAdjustments(adjustments: any[], limit: number = 5): any[] {
  const prioritized = prioritizeGoalAdjustments(adjustments);
  return prioritized.slice(0, limit);
}

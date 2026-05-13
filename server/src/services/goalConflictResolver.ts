import { logger } from '../utils/logger';
import type { UserGoal, GoalType, GoalConflict, GoalOptimizationContext } from '../types/goalOptimization';

export function detectGoalConflicts(goals: UserGoal[]): GoalConflict[] {
  logger.info('🔵 Detecting goal conflicts', { goalCount: goals.length });

  const conflicts: GoalConflict[] = [];

  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      const conflict = checkConflict(goals[i].type, goals[j].type);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  logger.info('✅ Conflict detection complete', { conflictCount: conflicts.length });

  return conflicts;
}

function checkConflict(goal1: GoalType, goal2: GoalType): GoalConflict | null {
  // Direct conflicts - goals that oppose each other
  if ((goal1 === 'muscle_gain' && goal2 === 'fat_loss') || 
      (goal1 === 'fat_loss' && goal2 === 'muscle_gain')) {
    return {
      goal1,
      goal2,
      conflictType: 'direct',
      severity: 'high',
      resolution: 'Prioritize primary goal, use body recomposition approach for secondary',
    };
  }

  if ((goal1 === 'performance' && goal2 === 'recovery') || 
      (goal1 === 'recovery' && goal2 === 'performance')) {
    return {
      goal1,
      goal2,
      conflictType: 'direct',
      severity: 'medium',
      resolution: 'Periodize training - alternate performance and recovery emphasis',
    };
  }

  if ((goal1 === 'performance' && goal2 === 'injury_prevention') || 
      (goal1 === 'injury_prevention' && goal2 === 'performance')) {
    return {
      goal1,
      goal2,
      conflictType: 'indirect',
      severity: 'medium',
      resolution: 'Use conservative performance progression with injury prevention protocols',
    };
  }

  // Resource conflicts - goals competing for same resources
  if ((goal1 === 'muscle_gain' && goal2 === 'cardiovascular') || 
      (goal1 === 'cardiovascular' && goal2 === 'muscle_gain')) {
    return {
      goal1,
      goal2,
      conflictType: 'resource',
      severity: 'medium',
      resolution: 'Separate cardio and strength training, prioritize based on goal priority',
    };
  }

  if ((goal1 === 'performance' && goal2 === 'fat_loss') || 
      (goal1 === 'fat_loss' && goal2 === 'performance')) {
    return {
      goal1,
      goal2,
      conflictType: 'resource',
      severity: 'medium',
      resolution: 'Moderate caloric deficit, maintain performance-critical nutrition timing',
    };
  }

  // Indirect conflicts - goals that may interfere
  if ((goal1 === 'muscle_gain' && goal2 === 'recovery') || 
      (goal1 === 'recovery' && goal2 === 'muscle_gain')) {
    return {
      goal1,
      goal2,
      conflictType: 'indirect',
      severity: 'low',
      resolution: 'Ensure adequate recovery between muscle-building sessions',
    };
  }

  return null;
}

export function resolveGoalConflicts(
  goals: UserGoal[],
  conflicts: GoalConflict[],
  context: GoalOptimizationContext
): string[] {
  logger.info('🔵 Resolving goal conflicts', { conflictCount: conflicts.length });

  const resolutions: string[] = [];

  conflicts.forEach(conflict => {
    const goal1 = goals.find(g => g.type === conflict.goal1);
    const goal2 = goals.find(g => g.type === conflict.goal2);

    if (!goal1 || !goal2) return;

    // Determine which goal has higher priority
    const primaryGoal = goal1.priority >= goal2.priority ? goal1 : goal2;
    const secondaryGoal = goal1.priority >= goal2.priority ? goal2 : goal1;

    // Generate resolution based on conflict type and priorities
    let resolution = '';

    if (conflict.conflictType === 'direct') {
      if (conflict.severity === 'high') {
        resolution = `${formatGoalName(primaryGoal.type)} is primary. ${conflict.resolution}. Monitor ${formatGoalName(secondaryGoal.type)} progress and adjust if needed.`;
      } else {
        resolution = `Balance ${formatGoalName(primaryGoal.type)} and ${formatGoalName(secondaryGoal.type)}. ${conflict.resolution}`;
      }
    } else if (conflict.conflictType === 'resource') {
      resolution = `Allocate resources: 70% to ${formatGoalName(primaryGoal.type)}, 30% to ${formatGoalName(secondaryGoal.type)}. ${conflict.resolution}`;
    } else {
      resolution = `Manage ${formatGoalName(primaryGoal.type)} and ${formatGoalName(secondaryGoal.type)} compatibility. ${conflict.resolution}`;
    }

    resolutions.push(resolution);
  });

  logger.info('✅ Conflict resolution complete', { resolutionCount: resolutions.length });

  return resolutions;
}

function formatGoalName(goal: GoalType): string {
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function calculateGoalAlignment(
  goals: UserGoal[],
  adjustments: any[],
  context: GoalOptimizationContext
): number {
  if (goals.length === 0) return 50; // Neutral alignment

  // Calculate how well adjustments align with goals
  let totalAlignment = 0;
  let totalWeight = 0;

  goals.forEach(goal => {
    const weight = goal.priority / 10; // Normalize to 0-1
    const alignment = calculateGoalSpecificAlignment(goal.type, adjustments, context);
    
    totalAlignment += alignment * weight;
    totalWeight += weight;
  });

  const overallAlignment = totalWeight > 0 ? (totalAlignment / totalWeight) : 50;

  return Math.round(overallAlignment);
}

function calculateGoalSpecificAlignment(
  goal: GoalType,
  adjustments: any[],
  context: GoalOptimizationContext
): number {
  // Check if adjustments support the goal
  const supportiveAdjustments = adjustments.filter(adj => {
    const text = `${adj.adjustment} ${adj.rationale}`.toLowerCase();
    
    switch (goal) {
      case 'muscle_gain':
        return text.includes('volume') || text.includes('intensity') || text.includes('protein') || text.includes('progressive');
      case 'fat_loss':
        return text.includes('calori') || text.includes('cardio') || text.includes('deficit');
      case 'performance':
        return text.includes('performance') || text.includes('intensity') || text.includes('progressive');
      case 'recovery':
        return text.includes('recovery') || text.includes('rest') || text.includes('sleep');
      case 'injury_prevention':
        return text.includes('joint') || text.includes('mobility') || text.includes('substitute') || text.includes('prevent');
      case 'metabolic':
        return text.includes('metabolic') || text.includes('nutrition') || text.includes('insulin');
      case 'cardiovascular':
        return text.includes('cardio') || text.includes('aerobic') || text.includes('heart');
      case 'sexual_health':
        return text.includes('stress') || text.includes('recovery') || text.includes('hormone');
      default:
        return false;
    }
  });

  // More supportive adjustments = higher alignment
  const alignmentRatio = adjustments.length > 0 ? supportiveAdjustments.length / adjustments.length : 0.5;
  
  return alignmentRatio * 100;
}

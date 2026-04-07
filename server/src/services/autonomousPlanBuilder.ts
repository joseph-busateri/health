import { logger } from '../utils/logger';
import { generateWorkoutOptimizations } from './workoutOptimizationService';
import { generateRecoveryOptimizations } from './recoveryOptimizationService';
import { generateStressOptimizations } from './stressOptimizationService';
import { generateJointOptimizations } from './jointOptimizationService';
import type { AutonomousPlan, AutonomousAdjustment, OptimizationContext } from '../types/autonomousOptimization';

export function buildAutonomousPlan(context: OptimizationContext): AutonomousPlan {
  logger.info('🔵 Building autonomous plan', { userId: context.userId });

  // Generate optimizations from all services
  const workoutAdjustments = generateWorkoutOptimizations(context);
  const recoveryAdjustments = generateRecoveryOptimizations(context);
  const stressAdjustments = generateStressOptimizations(context);
  const jointAdjustments = generateJointOptimizations(context);

  // Combine all adjustments
  const allAdjustments: AutonomousAdjustment[] = [
    ...workoutAdjustments,
    ...recoveryAdjustments,
    ...stressAdjustments,
    ...jointAdjustments,
  ];

  // Determine overall priority
  const hasCritical = allAdjustments.some(a => a.priority === 'critical');
  const hasImportant = allAdjustments.some(a => a.priority === 'important');
  const overallPriority = hasCritical ? 'critical' : hasImportant ? 'important' : 'optimization';

  // Generate summary
  const summary = generatePlanSummary(context, allAdjustments, overallPriority);

  const plan: AutonomousPlan = {
    adjustments: allAdjustments,
    summary,
    priority: overallPriority,
    source: 'fallback',
  };

  logger.info('✅ Autonomous plan built', {
    userId: context.userId,
    adjustmentCount: allAdjustments.length,
    priority: overallPriority,
    workoutCount: workoutAdjustments.length,
    recoveryCount: recoveryAdjustments.length,
    stressCount: stressAdjustments.length,
    jointCount: jointAdjustments.length,
  });

  return plan;
}

function generatePlanSummary(
  context: OptimizationContext,
  adjustments: AutonomousAdjustment[],
  priority: string
): string {
  if (adjustments.length === 0) {
    return 'All systems optimal. Continue current approach with standard monitoring.';
  }

  const criticalCount = adjustments.filter(a => a.priority === 'critical').length;
  const importantCount = adjustments.filter(a => a.priority === 'important').length;

  if (criticalCount > 0) {
    const signals: string[] = [];
    if (context.recoveryScore && context.recoveryScore < 50) signals.push('critically low recovery');
    if (context.stressScore && context.stressScore > 75) signals.push('critically high stress');
    if (context.jointRiskLevel === 'high') signals.push('high joint risk');

    return `Critical intervention required: ${signals.join(', ')}. Implementing ${criticalCount} critical adjustment${criticalCount > 1 ? 's' : ''} to prevent breakdown.`;
  }

  if (importantCount > 0) {
    const signals: string[] = [];
    if (context.recoveryScore && context.recoveryScore < 70) signals.push('suboptimal recovery');
    if (context.stressScore && context.stressScore > 60) signals.push('elevated stress');
    if (context.jointRiskLevel === 'moderate') signals.push('moderate joint risk');
    if (context.predictiveTrends?.recoveryTrend === 'declining') signals.push('declining recovery trend');

    return `Proactive adjustments recommended: ${signals.join(', ')}. Implementing ${importantCount} important adjustment${importantCount > 1 ? 's' : ''} to optimize outcomes.`;
  }

  return `System is performing well. Implementing ${adjustments.length} optimization${adjustments.length > 1 ? 's' : ''} to maintain and enhance performance.`;
}

export function prioritizeAdjustments(adjustments: AutonomousAdjustment[]): AutonomousAdjustment[] {
  // Sort by priority: critical > important > optimization
  const priorityOrder = { critical: 0, important: 1, optimization: 2 };
  
  return adjustments.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by category
    const categoryOrder = { workout: 0, recovery: 1, stress: 2, joint: 3, nutrition: 4 };
    return categoryOrder[a.category] - categoryOrder[b.category];
  });
}

export function getTopAdjustments(adjustments: AutonomousAdjustment[], limit: number = 5): AutonomousAdjustment[] {
  const prioritized = prioritizeAdjustments(adjustments);
  return prioritized.slice(0, limit);
}

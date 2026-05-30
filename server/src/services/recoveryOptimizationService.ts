import { logger } from '../utils/logger';
import type { AutonomousAdjustment, OptimizationContext } from '../types/autonomousOptimization';

export function generateRecoveryOptimizations(context: OptimizationContext): AutonomousAdjustment[] {
  logger.info('🔵 Generating recovery optimizations', { userId: context.userId });

  const adjustments: AutonomousAdjustment[] = [];

  // Rule 1: Low recovery → add recovery day
  if (context.recoveryScore && context.recoveryScore < 60) {
    adjustments.push({
      category: 'recovery',
      adjustment: context.recoveryScore < 50 ? 'Schedule full rest day tomorrow' : 'Schedule active recovery day',
      rationale: `Recovery score ${context.recoveryScore} indicates accumulated fatigue. Rest day prevents overtraining cascade.`,
      priority: context.recoveryScore < 50 ? 'critical' : 'important',
    });
  }

  // Rule 2: Declining recovery trend → increase sleep target
  if (context.predictiveTrends?.recoveryTrend === 'declining') {
    adjustments.push({
      category: 'recovery',
      adjustment: 'Increase sleep target by 30-60 minutes',
      rationale: 'Recovery trend is declining over multiple days. Additional sleep supports recovery restoration.',
      priority: 'important',
    });
  }

  // Rule 3: Low recovery + high stress → prioritize recovery protocols
  if (context.recoveryScore && context.recoveryScore < 70 && context.stressScore && context.stressScore > 60) {
    adjustments.push({
      category: 'recovery',
      adjustment: 'Prioritize recovery protocols: foam rolling, stretching, cold therapy',
      rationale: 'Combined recovery and stress signals require enhanced recovery emphasis.',
      priority: 'important',
    });
  }

  // Rule 4: Moderate recovery → load management
  if (context.recoveryScore && context.recoveryScore >= 60 && context.recoveryScore < 75) {
    adjustments.push({
      category: 'recovery',
      adjustment: 'Monitor load accumulation - avoid back-to-back high-intensity sessions',
      rationale: `Recovery score ${context.recoveryScore} is moderate. Strategic load management prevents decline.`,
      priority: 'optimization',
    });
  }

  // Rule 5: Good recovery → maintain protocols
  if (context.recoveryScore && context.recoveryScore >= 80) {
    adjustments.push({
      category: 'recovery',
      adjustment: 'Maintain current recovery protocols - they are working well',
      rationale: `Recovery score ${context.recoveryScore} indicates excellent recovery. Continue current approach.`,
      priority: 'optimization',
    });
  }

  // Rule 6: Recovery declining + joint risk → enhanced recovery focus
  if (context.predictiveTrends?.recoveryTrend === 'declining' && 
      (context.jointRiskLevel === 'moderate' || context.jointRiskLevel === 'high')) {
    adjustments.push({
      category: 'recovery',
      adjustment: 'Add mobility work and tissue quality focus',
      rationale: 'Declining recovery with joint risk requires proactive mobility and tissue health.',
      priority: 'important',
    });
  }

  logger.info('✅ Recovery optimizations generated', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
  });

  return adjustments;
}

export function calculateSleepTarget(recoveryScore: number, baseTarget: number = 8): number {
  if (recoveryScore < 50) return baseTarget + 1.5; // +1.5 hours
  if (recoveryScore < 60) return baseTarget + 1.0; // +1 hour
  if (recoveryScore < 70) return baseTarget + 0.5; // +30 min
  return baseTarget;
}

export function shouldScheduleRestDay(recoveryScore: number, consecutiveTrainingDays: number): boolean {
  if (recoveryScore < 50) return true;
  if (recoveryScore < 60 && consecutiveTrainingDays >= 4) return true;
  if (recoveryScore < 70 && consecutiveTrainingDays >= 6) return true;
  return false;
}

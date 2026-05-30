import { logger } from '../utils/logger';
import type { AutonomousAdjustment, OptimizationContext } from '../types/autonomousOptimization';

export function generateWorkoutOptimizations(context: OptimizationContext): AutonomousAdjustment[] {
  logger.info('🔵 Generating workout optimizations', { userId: context.userId });

  const adjustments: AutonomousAdjustment[] = [];

  // Rule 1: Low recovery → reduce volume
  if (context.recoveryScore && context.recoveryScore < 65) {
    adjustments.push({
      category: 'workout',
      adjustment: `Reduce training volume by ${context.recoveryScore < 50 ? '30-40%' : '20-25%'}`,
      rationale: `Recovery score is ${context.recoveryScore}, indicating insufficient recovery. Volume reduction prevents overtraining.`,
      priority: context.recoveryScore < 50 ? 'critical' : 'important',
    });
  }

  // Rule 2: High stress → reduce intensity
  if (context.stressScore && context.stressScore > 60) {
    adjustments.push({
      category: 'workout',
      adjustment: `Lower intensity cap to ${context.stressScore > 75 ? '70-75%' : '75-80%'} of max`,
      rationale: `Stress score is ${context.stressScore}, indicating elevated CNS fatigue. Intensity reduction protects nervous system.`,
      priority: context.stressScore > 75 ? 'critical' : 'important',
    });
  }

  // Rule 3: Joint risk → modify exercises
  if (context.jointRiskLevel === 'high' || context.jointRiskLevel === 'moderate') {
    adjustments.push({
      category: 'workout',
      adjustment: 'Substitute high-risk movements with joint-friendly alternatives',
      rationale: `Joint risk level is ${context.jointRiskLevel}. Exercise modifications prevent injury escalation.`,
      priority: context.jointRiskLevel === 'high' ? 'critical' : 'important',
    });
  }

  // Rule 4: Combined low recovery + high stress → extend rest periods
  if (context.recoveryScore && context.recoveryScore < 70 && context.stressScore && context.stressScore > 55) {
    adjustments.push({
      category: 'workout',
      adjustment: 'Extend rest periods between sets by 30-60 seconds',
      rationale: 'Combined recovery and stress signals indicate need for extended recovery between efforts.',
      priority: 'important',
    });
  }

  // Rule 5: Good recovery + low stress → optimization opportunity
  if (context.recoveryScore && context.recoveryScore > 80 && context.stressScore && context.stressScore < 40) {
    adjustments.push({
      category: 'workout',
      adjustment: 'Consider progressive overload opportunity - increase volume or intensity by 5-10%',
      rationale: `Recovery score ${context.recoveryScore} and stress score ${context.stressScore} indicate optimal training capacity.`,
      priority: 'optimization',
    });
  }

  logger.info('✅ Workout optimizations generated', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
  });

  return adjustments;
}

export function calculateVolumeReduction(recoveryScore: number): number {
  if (recoveryScore < 50) return 35; // 35% reduction
  if (recoveryScore < 60) return 25; // 25% reduction
  if (recoveryScore < 70) return 15; // 15% reduction
  return 0; // No reduction needed
}

export function calculateIntensityCap(stressScore: number): number {
  if (stressScore > 75) return 72; // 72% of max
  if (stressScore > 65) return 77; // 77% of max
  if (stressScore > 55) return 82; // 82% of max
  return 100; // No cap
}

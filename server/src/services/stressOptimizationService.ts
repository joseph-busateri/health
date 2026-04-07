import { logger } from '../utils/logger';
import type { AutonomousAdjustment, OptimizationContext } from '../types/autonomousOptimization';

export function generateStressOptimizations(context: OptimizationContext): AutonomousAdjustment[] {
  logger.info('🔵 Generating stress optimizations', { userId: context.userId });

  const adjustments: AutonomousAdjustment[] = [];

  // Rule 1: High stress → reduce CNS load
  if (context.stressScore && context.stressScore > 70) {
    adjustments.push({
      category: 'stress',
      adjustment: 'Reduce CNS-intensive exercises (heavy compounds, explosive movements)',
      rationale: `Stress score ${context.stressScore} indicates elevated CNS fatigue. Reducing neural demand supports recovery.`,
      priority: context.stressScore > 80 ? 'critical' : 'important',
    });
  }

  // Rule 2: Stress rising trend → add stress management
  if (context.predictiveTrends?.stressTrend === 'declining') {
    adjustments.push({
      category: 'stress',
      adjustment: 'Add daily stress management: 10-15 minutes breathing exercises or meditation',
      rationale: 'Stress trend is rising over multiple days. Proactive stress management prevents escalation.',
      priority: 'important',
    });
  }

  // Rule 3: Moderate stress → recovery emphasis
  if (context.stressScore && context.stressScore >= 55 && context.stressScore <= 70) {
    adjustments.push({
      category: 'stress',
      adjustment: 'Emphasize recovery between training sessions - avoid high-frequency training',
      rationale: `Stress score ${context.stressScore} is moderate. Strategic recovery prevents stress accumulation.`,
      priority: 'important',
    });
  }

  // Rule 4: High stress + low recovery → critical intervention
  if (context.stressScore && context.stressScore > 65 && context.recoveryScore && context.recoveryScore < 65) {
    adjustments.push({
      category: 'stress',
      adjustment: 'Implement deload week - reduce all training stress by 40-50%',
      rationale: 'Combined high stress and low recovery indicate overtraining risk. Deload prevents breakdown.',
      priority: 'critical',
    });
  }

  // Rule 5: Low stress → maintain approach
  if (context.stressScore && context.stressScore < 45) {
    adjustments.push({
      category: 'stress',
      adjustment: 'Stress levels are well-managed - continue current approach',
      rationale: `Stress score ${context.stressScore} indicates good stress management. Current protocols are effective.`,
      priority: 'optimization',
    });
  }

  // Rule 6: Stress + joint risk → conservative approach
  if (context.stressScore && context.stressScore > 60 && 
      (context.jointRiskLevel === 'moderate' || context.jointRiskLevel === 'high')) {
    adjustments.push({
      category: 'stress',
      adjustment: 'Use conservative training approach - avoid pushing through discomfort',
      rationale: 'Elevated stress with joint risk increases injury susceptibility. Conservative approach protects health.',
      priority: 'important',
    });
  }

  logger.info('✅ Stress optimizations generated', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
  });

  return adjustments;
}

export function calculateTrainingFrequency(stressScore: number): number {
  if (stressScore > 75) return 3; // 3 days per week
  if (stressScore > 65) return 4; // 4 days per week
  if (stressScore > 55) return 5; // 5 days per week
  return 6; // 6 days per week
}

export function shouldImplementDeload(stressScore: number, recoveryScore: number): boolean {
  if (stressScore > 75 && recoveryScore < 60) return true;
  if (stressScore > 70 && recoveryScore < 55) return true;
  if (stressScore > 65 && recoveryScore < 50) return true;
  return false;
}

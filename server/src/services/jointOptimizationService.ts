import { logger } from '../utils/logger';
import type { AutonomousAdjustment, OptimizationContext } from '../types/autonomousOptimization';

export function generateJointOptimizations(context: OptimizationContext): AutonomousAdjustment[] {
  logger.info('🔵 Generating joint optimizations', { userId: context.userId });

  const adjustments: AutonomousAdjustment[] = [];

  // Rule 1: High joint risk → exercise substitutions
  if (context.jointRiskLevel === 'high') {
    adjustments.push({
      category: 'joint',
      adjustment: 'Substitute all high-impact movements with joint-friendly alternatives',
      rationale: 'High joint risk level requires immediate exercise modifications to prevent injury.',
      priority: 'critical',
    });
  }

  // Rule 2: Moderate joint risk → load reduction
  if (context.jointRiskLevel === 'moderate') {
    adjustments.push({
      category: 'joint',
      adjustment: 'Reduce load on affected joints by 20-30%',
      rationale: 'Moderate joint risk indicates early warning signs. Load reduction prevents escalation.',
      priority: 'important',
    });
  }

  // Rule 3: Joint risk + low recovery → mobility emphasis
  if ((context.jointRiskLevel === 'moderate' || context.jointRiskLevel === 'high') && 
      context.recoveryScore && context.recoveryScore < 70) {
    adjustments.push({
      category: 'joint',
      adjustment: 'Add 15-20 minutes daily mobility work targeting affected areas',
      rationale: 'Joint risk with low recovery requires proactive mobility and tissue quality work.',
      priority: 'important',
    });
  }

  // Rule 4: Joint trend declining → preventive measures
  if (context.predictiveTrends?.jointTrend === 'declining') {
    adjustments.push({
      category: 'joint',
      adjustment: 'Implement preventive measures: warm-up extension, movement quality focus',
      rationale: 'Joint health trend is declining. Preventive measures stop progression to injury.',
      priority: 'important',
    });
  }

  // Rule 5: Low joint risk → maintain movement quality
  if (context.jointRiskLevel === 'low') {
    adjustments.push({
      category: 'joint',
      adjustment: 'Maintain movement quality and proper form throughout training',
      rationale: 'Joint risk is low. Continue current movement patterns with quality emphasis.',
      priority: 'optimization',
    });
  }

  // Rule 6: Joint risk + high stress → conservative loading
  if ((context.jointRiskLevel === 'moderate' || context.jointRiskLevel === 'high') && 
      context.stressScore && context.stressScore > 65) {
    adjustments.push({
      category: 'joint',
      adjustment: 'Use conservative loading - avoid testing limits or pushing through discomfort',
      rationale: 'Joint risk with elevated stress increases injury susceptibility. Conservative approach protects joints.',
      priority: 'critical',
    });
  }

  logger.info('✅ Joint optimizations generated', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
  });

  return adjustments;
}

export function calculateLoadReduction(jointRiskLevel: string): number {
  if (jointRiskLevel === 'high') return 40; // 40% reduction
  if (jointRiskLevel === 'moderate') return 25; // 25% reduction
  return 0; // No reduction
}

export function shouldAvoidMovement(jointRiskLevel: string, movementType: string): boolean {
  if (jointRiskLevel === 'high') {
    return ['overhead', 'heavy_compound', 'explosive', 'high_impact'].includes(movementType);
  }
  if (jointRiskLevel === 'moderate') {
    return ['explosive', 'high_impact'].includes(movementType);
  }
  return false;
}

export function getMobilityRecommendations(jointRiskLevel: string): string[] {
  if (jointRiskLevel === 'high') {
    return [
      'Daily mobility work 20+ minutes',
      'Foam rolling affected areas',
      'Gentle stretching',
      'Consider physical therapy consultation',
    ];
  }
  if (jointRiskLevel === 'moderate') {
    return [
      'Daily mobility work 15 minutes',
      'Targeted stretching',
      'Movement quality drills',
    ];
  }
  return ['Maintain regular mobility work'];
}

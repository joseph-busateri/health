import { logger } from '../utils/logger';
import type { UserGoal, GoalType, GoalOptimizationContext } from '../types/goalOptimization';

export interface GoalScore {
  goal: GoalType;
  alignmentScore: number; // 0-100
  feasibilityScore: number; // 0-100
  riskScore: number; // 0-100, higher = more risk
  overallScore: number; // 0-100
}

export function scoreGoals(context: GoalOptimizationContext): GoalScore[] {
  logger.info('🔵 Scoring goals against current state', { userId: context.userId });

  const scores: GoalScore[] = context.goals.map(goal => {
    const alignment = calculateAlignmentScore(goal, context);
    const feasibility = calculateFeasibilityScore(goal, context);
    const risk = calculateRiskScore(goal, context);
    
    // Overall score weighted: alignment 40%, feasibility 40%, risk 20% (inverted)
    const overall = (alignment * 0.4) + (feasibility * 0.4) + ((100 - risk) * 0.2);

    return {
      goal: goal.type,
      alignmentScore: alignment,
      feasibilityScore: feasibility,
      riskScore: risk,
      overallScore: overall,
    };
  });

  logger.info('✅ Goal scoring complete', {
    userId: context.userId,
    goalCount: scores.length,
  });

  return scores;
}

function calculateAlignmentScore(goal: UserGoal, context: GoalOptimizationContext): number {
  const { recoveryScore = 65, stressScore = 50, jointRiskLevel = 'low' } = context;

  switch (goal.type) {
    case 'muscle_gain':
      // High recovery + low stress = good alignment
      if (recoveryScore > 75 && stressScore < 45) return 90;
      if (recoveryScore > 65 && stressScore < 55) return 75;
      if (recoveryScore > 55) return 60;
      return 40;

    case 'fat_loss':
      // Moderate recovery sufficient, stress matters less
      if (recoveryScore > 70) return 85;
      if (recoveryScore > 60) return 70;
      if (recoveryScore > 50) return 55;
      return 40;

    case 'performance':
      // Requires high recovery + low stress + low joint risk
      if (recoveryScore > 80 && stressScore < 40 && jointRiskLevel === 'low') return 95;
      if (recoveryScore > 70 && stressScore < 50 && jointRiskLevel !== 'high') return 75;
      if (recoveryScore > 60) return 55;
      return 35;

    case 'recovery':
      // Always aligned - recovery is the goal
      return 100;

    case 'injury_prevention':
      // Better alignment when risks are present
      if (jointRiskLevel === 'high' || recoveryScore < 60) return 95;
      if (jointRiskLevel === 'moderate' || recoveryScore < 70) return 80;
      return 65;

    case 'metabolic':
      // Moderate recovery sufficient
      if (recoveryScore > 65 && stressScore < 60) return 80;
      if (recoveryScore > 55) return 65;
      return 50;

    case 'cardiovascular':
      // Requires good recovery
      if (recoveryScore > 70 && stressScore < 55) return 85;
      if (recoveryScore > 60) return 70;
      return 50;

    case 'sexual_health':
      // Requires low stress + good recovery
      if (stressScore < 45 && recoveryScore > 70) return 90;
      if (stressScore < 55 && recoveryScore > 60) return 75;
      return 55;

    default:
      return 50;
  }
}

function calculateFeasibilityScore(goal: UserGoal, context: GoalOptimizationContext): number {
  const { recoveryScore = 65, stressScore = 50, jointRiskLevel = 'low' } = context;

  switch (goal.type) {
    case 'muscle_gain':
      // Feasible if recovery supports volume
      if (recoveryScore < 50) return 30; // Too fatigued
      if (recoveryScore < 60) return 50; // Limited capacity
      if (recoveryScore < 70) return 70; // Moderate capacity
      return 90; // High capacity

    case 'fat_loss':
      // Generally feasible
      if (recoveryScore < 45) return 50; // Need some recovery
      return 85; // Usually feasible

    case 'performance':
      // Requires optimal state
      if (recoveryScore < 60 || stressScore > 65 || jointRiskLevel === 'high') return 40;
      if (recoveryScore < 70 || stressScore > 55) return 60;
      return 85;

    case 'recovery':
      // Always feasible
      return 100;

    case 'injury_prevention':
      // Always feasible
      return 95;

    case 'metabolic':
      if (recoveryScore < 50) return 55;
      return 80;

    case 'cardiovascular':
      if (recoveryScore < 55 || jointRiskLevel === 'high') return 50;
      return 80;

    case 'sexual_health':
      if (stressScore > 70) return 50; // High stress limits feasibility
      return 80;

    default:
      return 60;
  }
}

function calculateRiskScore(goal: UserGoal, context: GoalOptimizationContext): number {
  const { recoveryScore = 65, stressScore = 50, jointRiskLevel = 'low' } = context;

  switch (goal.type) {
    case 'muscle_gain':
      // Risk if pushing hard with low recovery
      if (recoveryScore < 50) return 80; // High risk
      if (recoveryScore < 60) return 60; // Moderate risk
      if (jointRiskLevel === 'high') return 70;
      return 30; // Low risk

    case 'fat_loss':
      // Lower risk overall
      if (recoveryScore < 45) return 50;
      return 25;

    case 'performance':
      // High risk if state not optimal
      if (recoveryScore < 60 || stressScore > 65) return 75;
      if (jointRiskLevel === 'high') return 80;
      return 40;

    case 'recovery':
      // Minimal risk
      return 10;

    case 'injury_prevention':
      // Minimal risk
      return 5;

    case 'metabolic':
      return 20;

    case 'cardiovascular':
      if (jointRiskLevel === 'high') return 50;
      return 25;

    case 'sexual_health':
      return 15;

    default:
      return 30;
  }
}

export function getPrimaryGoal(goals: UserGoal[], scores: GoalScore[]): GoalType | undefined {
  if (goals.length === 0) return undefined;

  // Combine user priority with calculated scores
  const weightedScores = goals.map((goal, index) => {
    const score = scores.find(s => s.goal === goal.type);
    const userWeight = goal.priority / 10; // Normalize to 0-1
    const systemWeight = (score?.overallScore ?? 50) / 100; // Normalize to 0-1
    
    // 60% user priority, 40% system score
    const combined = (userWeight * 0.6) + (systemWeight * 0.4);
    
    return {
      goal: goal.type,
      combinedScore: combined * 100,
    };
  });

  weightedScores.sort((a, b) => b.combinedScore - a.combinedScore);
  
  return weightedScores[0]?.goal;
}

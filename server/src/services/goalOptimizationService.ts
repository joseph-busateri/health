import { logger } from '../utils/logger';
import type { UserGoal, GoalAdjustment, GoalOptimizationContext, GoalType } from '../types/goalOptimization';

export function generateGoalOptimizations(context: GoalOptimizationContext): GoalAdjustment[] {
  logger.info('🔵 Generating goal-driven optimizations', { userId: context.userId });

  const adjustments: GoalAdjustment[] = [];

  context.goals.forEach(goal => {
    const goalAdjustments = generateGoalSpecificAdjustments(goal, context);
    adjustments.push(...goalAdjustments);
  });

  logger.info('✅ Goal optimizations generated', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
  });

  return adjustments;
}

function generateGoalSpecificAdjustments(
  goal: UserGoal,
  context: GoalOptimizationContext
): GoalAdjustment[] {
  const { recoveryScore = 65, stressScore = 50, jointRiskLevel = 'low' } = context;

  switch (goal.type) {
    case 'muscle_gain':
      return generateMuscleGainAdjustments(goal, recoveryScore, stressScore, jointRiskLevel);
    
    case 'fat_loss':
      return generateFatLossAdjustments(goal, recoveryScore, stressScore);
    
    case 'performance':
      return generatePerformanceAdjustments(goal, recoveryScore, stressScore, jointRiskLevel);
    
    case 'recovery':
      return generateRecoveryAdjustments(goal, recoveryScore, stressScore);
    
    case 'injury_prevention':
      return generateInjuryPreventionAdjustments(goal, recoveryScore, jointRiskLevel);
    
    case 'metabolic':
      return generateMetabolicAdjustments(goal, recoveryScore);
    
    case 'cardiovascular':
      return generateCardiovascularAdjustments(goal, recoveryScore, jointRiskLevel);
    
    case 'sexual_health':
      return generateSexualHealthAdjustments(goal, stressScore, recoveryScore);
    
    default:
      return [];
  }
}

function generateMuscleGainAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  stressScore: number,
  jointRiskLevel: string
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  // Volume optimization
  if (recoveryScore > 75 && stressScore < 50) {
    adjustments.push({
      goal: 'muscle_gain',
      adjustment: 'Increase training volume by 10-15% to maximize hypertrophy stimulus',
      rationale: `Recovery score ${recoveryScore} and stress score ${stressScore} indicate capacity for increased volume.`,
      priority: 'important',
      impact: 'high',
    });
  } else if (recoveryScore > 65) {
    adjustments.push({
      goal: 'muscle_gain',
      adjustment: 'Maintain current volume with focus on progressive overload',
      rationale: `Recovery score ${recoveryScore} supports current volume with gradual progression.`,
      priority: 'optimization',
      impact: 'medium',
    });
  } else {
    adjustments.push({
      goal: 'muscle_gain',
      adjustment: 'Reduce volume slightly but maintain intensity for muscle retention',
      rationale: `Recovery score ${recoveryScore} requires volume reduction to prevent overtraining while preserving gains.`,
      priority: 'important',
      impact: 'medium',
    });
  }

  // Nutrition
  adjustments.push({
    goal: 'muscle_gain',
    adjustment: 'Increase protein intake to 1.6-2.2g per kg bodyweight',
    rationale: 'Optimal protein intake supports muscle protein synthesis for hypertrophy.',
    priority: 'important',
    impact: 'high',
  });

  // Recovery for growth
  if (recoveryScore < 70) {
    adjustments.push({
      goal: 'muscle_gain',
      adjustment: 'Prioritize sleep 8-9 hours for growth hormone optimization',
      rationale: 'Muscle growth occurs during recovery. Adequate sleep maximizes anabolic response.',
      priority: 'important',
      impact: 'high',
    });
  }

  return adjustments;
}

function generateFatLossAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  stressScore: number
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  // Caloric management
  adjustments.push({
    goal: 'fat_loss',
    adjustment: 'Maintain moderate caloric deficit (300-500 calories)',
    rationale: 'Moderate deficit promotes fat loss while preserving lean mass and performance.',
    priority: 'critical',
    impact: 'high',
  });

  // Training approach
  if (recoveryScore > 65) {
    adjustments.push({
      goal: 'fat_loss',
      adjustment: 'Maintain strength training volume to preserve muscle mass',
      rationale: 'Resistance training during deficit prevents muscle loss and maintains metabolic rate.',
      priority: 'important',
      impact: 'high',
    });
  } else {
    adjustments.push({
      goal: 'fat_loss',
      adjustment: 'Reduce training volume but maintain intensity',
      rationale: `Recovery score ${recoveryScore} in deficit requires volume management while preserving intensity.`,
      priority: 'important',
      impact: 'medium',
    });
  }

  // Cardio
  adjustments.push({
    goal: 'fat_loss',
    adjustment: 'Add 2-3 moderate cardio sessions per week',
    rationale: 'Cardiovascular exercise increases energy expenditure and supports fat loss.',
    priority: 'optimization',
    impact: 'medium',
  });

  return adjustments;
}

function generatePerformanceAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  stressScore: number,
  jointRiskLevel: string
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  if (recoveryScore > 75 && stressScore < 45 && jointRiskLevel === 'low') {
    adjustments.push({
      goal: 'performance',
      adjustment: 'Implement progressive overload - increase intensity by 5-10%',
      rationale: 'Optimal state supports performance progression without injury risk.',
      priority: 'important',
      impact: 'high',
    });
  } else if (recoveryScore > 65) {
    adjustments.push({
      goal: 'performance',
      adjustment: 'Maintain current performance level with technique refinement',
      rationale: `Recovery score ${recoveryScore} supports maintenance with quality focus.`,
      priority: 'optimization',
      impact: 'medium',
    });
  } else {
    adjustments.push({
      goal: 'performance',
      adjustment: 'Implement deload week to restore performance capacity',
      rationale: `Recovery score ${recoveryScore} indicates accumulated fatigue limiting performance.`,
      priority: 'critical',
      impact: 'high',
    });
  }

  return adjustments;
}

function generateRecoveryAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  stressScore: number
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  adjustments.push({
    goal: 'recovery',
    adjustment: 'Prioritize sleep quality and duration (8-9 hours)',
    rationale: 'Sleep is the primary recovery mechanism for all physiological systems.',
    priority: 'critical',
    impact: 'high',
  });

  if (stressScore > 60) {
    adjustments.push({
      goal: 'recovery',
      adjustment: 'Implement daily stress management practices (meditation, breathing)',
      rationale: `Stress score ${stressScore} impairs recovery. Active stress reduction accelerates restoration.`,
      priority: 'important',
      impact: 'high',
    });
  }

  adjustments.push({
    goal: 'recovery',
    adjustment: 'Reduce training frequency to allow full recovery between sessions',
    rationale: 'Recovery goal requires adequate rest periods for adaptation.',
    priority: 'important',
    impact: 'high',
  });

  return adjustments;
}

function generateInjuryPreventionAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  jointRiskLevel: string
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  if (jointRiskLevel === 'high' || jointRiskLevel === 'moderate') {
    adjustments.push({
      goal: 'injury_prevention',
      adjustment: 'Implement comprehensive movement screening and correction',
      rationale: `Joint risk level ${jointRiskLevel} requires proactive movement quality assessment.`,
      priority: 'critical',
      impact: 'high',
    });
  }

  adjustments.push({
    goal: 'injury_prevention',
    adjustment: 'Add daily mobility work (15-20 minutes)',
    rationale: 'Mobility work maintains joint health and reduces injury risk.',
    priority: 'important',
    impact: 'high',
  });

  adjustments.push({
    goal: 'injury_prevention',
    adjustment: 'Use conservative loading - avoid testing limits',
    rationale: 'Injury prevention requires sustainable loading patterns.',
    priority: 'important',
    impact: 'medium',
  });

  return adjustments;
}

function generateMetabolicAdjustments(
  goal: UserGoal,
  recoveryScore: number
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  adjustments.push({
    goal: 'metabolic',
    adjustment: 'Optimize meal timing around training for insulin sensitivity',
    rationale: 'Nutrient timing enhances metabolic health and body composition.',
    priority: 'important',
    impact: 'medium',
  });

  adjustments.push({
    goal: 'metabolic',
    adjustment: 'Include resistance training 3-4x per week',
    rationale: 'Resistance training improves insulin sensitivity and metabolic rate.',
    priority: 'important',
    impact: 'high',
  });

  return adjustments;
}

function generateCardiovascularAdjustments(
  goal: UserGoal,
  recoveryScore: number,
  jointRiskLevel: string
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  if (jointRiskLevel === 'low') {
    adjustments.push({
      goal: 'cardiovascular',
      adjustment: 'Include 3-4 cardio sessions per week (mix of moderate and high intensity)',
      rationale: 'Varied intensity training optimizes cardiovascular adaptations.',
      priority: 'important',
      impact: 'high',
    });
  } else {
    adjustments.push({
      goal: 'cardiovascular',
      adjustment: 'Focus on low-impact cardio (cycling, swimming, rowing)',
      rationale: `Joint risk level ${jointRiskLevel} requires joint-friendly cardiovascular options.`,
      priority: 'important',
      impact: 'high',
    });
  }

  return adjustments;
}

function generateSexualHealthAdjustments(
  goal: UserGoal,
  stressScore: number,
  recoveryScore: number
): GoalAdjustment[] {
  const adjustments: GoalAdjustment[] = [];

  if (stressScore > 65) {
    adjustments.push({
      goal: 'sexual_health',
      adjustment: 'Reduce stress through relaxation practices and workload management',
      rationale: `Stress score ${stressScore} negatively impacts hormonal balance and sexual function.`,
      priority: 'critical',
      impact: 'high',
    });
  }

  adjustments.push({
    goal: 'sexual_health',
    adjustment: 'Ensure adequate sleep (7-9 hours) for hormonal optimization',
    rationale: 'Sleep quality directly affects testosterone and sexual health markers.',
    priority: 'important',
    impact: 'high',
  });

  if (recoveryScore < 65) {
    adjustments.push({
      goal: 'sexual_health',
      adjustment: 'Reduce training volume to prevent overtraining-induced hormonal suppression',
      rationale: `Recovery score ${recoveryScore} suggests overtraining may be affecting hormonal balance.`,
      priority: 'important',
      impact: 'medium',
    });
  }

  return adjustments;
}

/**
 * Autonomous Adjustment Adapter - Phase 17
 * 
 * Purpose: Generate autonomous plan adjustments based on:
 * - Execution drift
 * - Behavior predictions
 * - Device intelligence
 * - Real-time data
 * 
 * Rules:
 * - All adjustments are reversible
 * - High-impact adjustments require confirmation
 * - Never throw runtime errors
 */

import type { ExecutionIntelligence, ExecutionTask } from '../types/execution';
import type { PredictiveBehaviorIntelligence, BehaviorRisk } from '../types/predictiveBehavior';
import type {
  AutonomousAdjustmentIntelligence,
  AutonomousAdjustment,
  AdjustmentTrigger,
  PlanSimplification,
  AdjustmentType,
} from '../types/autonomousAdjustment';

// ============================================================================
// MAIN ADAPTER: GENERATE AUTONOMOUS ADJUSTMENTS
// ============================================================================

/**
 * Generate complete autonomous adjustment intelligence
 */
export function generateAutonomousAdjustments(
  execution: ExecutionIntelligence | null,
  predictiveBehavior: PredictiveBehaviorIntelligence | null
): AutonomousAdjustmentIntelligence {
  if (!execution) {
    return getEmptyAutonomousAdjustments();
  }

  const triggers = identifyAdjustmentTriggers(execution, predictiveBehavior);
  const pendingAdjustments = generateAdjustmentsFromTriggers(triggers, execution);
  const simplifications = generatePlanSimplifications(execution, predictiveBehavior);

  return {
    userId: execution.userId,
    date: execution.date,
    pendingAdjustments,
    appliedAdjustments: [],
    dismissedAdjustments: [],
    triggers,
    simplifications,
    history: [],
    rulesApplied: [],
    adjustmentCount: pendingAdjustments.length,
    autoAppliedCount: 0,
    userConfirmedCount: 0,
    successRate: 0,
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// IDENTIFY ADJUSTMENT TRIGGERS
// ============================================================================

/**
 * Identify conditions that trigger autonomous adjustments
 */
function identifyAdjustmentTriggers(
  execution: ExecutionIntelligence,
  predictiveBehavior: PredictiveBehaviorIntelligence | null
): AdjustmentTrigger[] {
  const triggers: AdjustmentTrigger[] = [];

  // Adherence risk triggers
  if (execution.adherence.overallScore < 50) {
    triggers.push({
      type: 'adherenceRisk',
      severity: execution.adherence.overallScore < 30 ? 'high' : 'medium',
      description: `Overall adherence at ${execution.adherence.overallScore}% - plan simplification recommended`,
      dataPoint: {
        metric: 'adherence',
        value: execution.adherence.overallScore,
        threshold: 50,
      },
    });
  }

  // Domain-specific adherence triggers
  execution.adherence.domains.forEach(domain => {
    if (domain.score < 40) {
      triggers.push({
        type: 'adherenceRisk',
        severity: domain.score < 20 ? 'high' : 'medium',
        description: `${domain.domain} adherence at ${domain.score}% - adjustment needed`,
        dataPoint: {
          metric: `${domain.domain}_adherence`,
          value: domain.score,
          threshold: 40,
        },
      });
    }
  });

  // Execution drift triggers
  if (predictiveBehavior?.driftPredictions && predictiveBehavior.driftPredictions.length > 0) {
    triggers.push({
      type: 'executionDrift',
      severity: 'medium',
      description: `${predictiveBehavior.driftPredictions.length} tasks drifting from schedule`,
    });
  }

  // High-risk behavior triggers
  if (predictiveBehavior?.overallRiskLevel === 'high' || predictiveBehavior?.overallRiskLevel === 'critical') {
    triggers.push({
      type: 'adherenceRisk',
      severity: 'high',
      description: 'High behavioral risk detected - proactive adjustment recommended',
    });
  }

  // Time constraint triggers
  const hour = new Date().getHours();
  const pendingCritical = execution.plan.tasks.filter(
    t => t.status === 'pending' && t.priority === 'critical'
  ).length;

  if (hour >= 18 && pendingCritical > 0) {
    triggers.push({
      type: 'timeConstraint',
      severity: 'high',
      description: `${pendingCritical} critical tasks still pending in evening`,
    });
  }

  return triggers;
}

// ============================================================================
// GENERATE ADJUSTMENTS FROM TRIGGERS
// ============================================================================

/**
 * Generate specific adjustments based on identified triggers
 */
function generateAdjustmentsFromTriggers(
  triggers: AdjustmentTrigger[],
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];

  triggers.forEach(trigger => {
    switch (trigger.type) {
      case 'adherenceRisk':
        adjustments.push(...generateAdherenceAdjustments(trigger, execution));
        break;
      case 'executionDrift':
        adjustments.push(...generateDriftAdjustments(trigger, execution));
        break;
      case 'timeConstraint':
        adjustments.push(...generateTimeConstraintAdjustments(trigger, execution));
        break;
      case 'fatigueDetected':
        adjustments.push(...generateFatigueAdjustments(trigger, execution));
        break;
      case 'recoveryDeficit':
        adjustments.push(...generateRecoveryAdjustments(trigger, execution));
        break;
    }
  });

  return deduplicateAdjustments(adjustments);
}

// ============================================================================
// ADHERENCE ADJUSTMENTS
// ============================================================================

/**
 * Generate adjustments for low adherence
 */
function generateAdherenceAdjustments(
  trigger: AdjustmentTrigger,
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];

  // Find low-adherence domains
  const lowDomains = execution.adherence.domains.filter(d => d.score < 50);

  lowDomains.forEach(domain => {
    // Simplify plan for low-adherence domains
    adjustments.push({
      id: `adj-simplify-${domain.domain}`,
      domain: domain.domain,
      adjustmentType: 'simplifyPlan',
      reason: `${domain.domain} adherence is ${domain.score}% - simplifying to improve completion rate`,
      confidence: 0.8,
      impact: 'moderate',
      status: 'pending',
      triggers: [trigger.description],
      expectedOutcome: `Increase ${domain.domain} adherence by 20-30%`,
      reversible: true,
      requiresConfirmation: true,
      createdAt: new Date().toISOString(),
    });

    // Domain-specific adjustments
    if (domain.domain === 'workout' && domain.score < 40) {
      adjustments.push({
        id: `adj-reduce-workout`,
        domain: 'workout',
        adjustmentType: 'reduceIntensity',
        reason: 'Workout adherence low - reducing volume to maintain consistency',
        confidence: 0.85,
        impact: 'moderate',
        status: 'pending',
        originalValue: 'Current workout plan',
        adjustedValue: 'Reduced volume workout',
        triggers: [trigger.description],
        expectedOutcome: 'Maintain workout consistency with achievable targets',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (domain.domain === 'recovery' && domain.score < 40) {
      adjustments.push({
        id: `adj-increase-recovery`,
        domain: 'recovery',
        adjustmentType: 'increaseRecovery',
        reason: 'Recovery adherence low - adding structured recovery time',
        confidence: 0.8,
        impact: 'moderate',
        status: 'pending',
        triggers: [trigger.description],
        expectedOutcome: 'Improve recovery adherence and overall energy',
        reversible: true,
        requiresConfirmation: true,
        createdAt: new Date().toISOString(),
      });
    }

    if (domain.domain === 'nutrition' && domain.score < 40) {
      adjustments.push({
        id: `adj-simplify-nutrition`,
        domain: 'nutrition',
        adjustmentType: 'adjustNutrition',
        reason: 'Nutrition adherence low - simplifying targets',
        confidence: 0.75,
        impact: 'minor',
        status: 'pending',
        triggers: [trigger.description],
        expectedOutcome: 'Easier nutrition targets to improve adherence',
        reversible: true,
        requiresConfirmation: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return adjustments;
}

// ============================================================================
// DRIFT ADJUSTMENTS
// ============================================================================

/**
 * Generate adjustments for execution drift
 */
function generateDriftAdjustments(
  trigger: AdjustmentTrigger,
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];
  const hour = new Date().getHours();

  // If evening and tasks pending, simplify
  if (hour >= 18) {
    const pendingTasks = execution.plan.tasks.filter(t => t.status === 'pending');
    
    if (pendingTasks.length > 3) {
      adjustments.push({
        id: 'adj-evening-simplify',
        domain: 'workout', // Default domain
        adjustmentType: 'simplifyPlan',
        reason: `${pendingTasks.length} tasks still pending in evening - simplifying to essential tasks only`,
        confidence: 0.85,
        impact: 'moderate',
        status: 'pending',
        triggers: [trigger.description],
        expectedOutcome: 'Complete essential tasks before end of day',
        reversible: true,
        requiresConfirmation: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return adjustments;
}

// ============================================================================
// TIME CONSTRAINT ADJUSTMENTS
// ============================================================================

/**
 * Generate adjustments for time constraints
 */
function generateTimeConstraintAdjustments(
  trigger: AdjustmentTrigger,
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];
  const criticalPending = execution.plan.tasks.filter(
    t => t.status === 'pending' && t.priority === 'critical'
  );

  if (criticalPending.length > 0) {
    adjustments.push({
      id: 'adj-prioritize-critical',
      domain: criticalPending[0].domain,
      adjustmentType: 'simplifyPlan',
      reason: 'Limited time remaining - focusing on critical tasks only',
      confidence: 0.9,
      impact: 'major',
      status: 'pending',
      triggers: [trigger.description],
      expectedOutcome: 'Complete critical tasks before end of day',
      reversible: true,
      requiresConfirmation: false,
      createdAt: new Date().toISOString(),
    });
  }

  return adjustments;
}

// ============================================================================
// FATIGUE ADJUSTMENTS
// ============================================================================

/**
 * Generate adjustments for detected fatigue
 */
function generateFatigueAdjustments(
  trigger: AdjustmentTrigger,
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];

  // Reduce workout intensity if fatigue detected
  const workoutTasks = execution.plan.tasks.filter(
    t => t.domain === 'workout' && t.status === 'pending'
  );

  if (workoutTasks.length > 0) {
    adjustments.push({
      id: 'adj-fatigue-reduce',
      domain: 'workout',
      adjustmentType: 'reduceIntensity',
      reason: 'Fatigue detected - reducing workout intensity to prevent overtraining',
      confidence: 0.85,
      impact: 'moderate',
      status: 'pending',
      triggers: [trigger.description],
      expectedOutcome: 'Maintain training consistency while managing fatigue',
      reversible: true,
      requiresConfirmation: true,
      createdAt: new Date().toISOString(),
    });
  }

  return adjustments;
}

// ============================================================================
// RECOVERY ADJUSTMENTS
// ============================================================================

/**
 * Generate adjustments for recovery deficit
 */
function generateRecoveryAdjustments(
  trigger: AdjustmentTrigger,
  execution: ExecutionIntelligence
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];

  adjustments.push({
    id: 'adj-recovery-increase',
    domain: 'recovery',
    adjustmentType: 'increaseRecovery',
    reason: 'Recovery deficit detected - adding recovery time',
    confidence: 0.8,
    impact: 'moderate',
    status: 'pending',
    triggers: [trigger.description],
    expectedOutcome: 'Improved recovery and reduced fatigue',
    reversible: true,
    requiresConfirmation: true,
    createdAt: new Date().toISOString(),
  });

  return adjustments;
}

// ============================================================================
// PLAN SIMPLIFICATIONS
// ============================================================================

/**
 * Generate plan simplifications for low adherence
 */
function generatePlanSimplifications(
  execution: ExecutionIntelligence,
  predictiveBehavior: PredictiveBehaviorIntelligence | null
): PlanSimplification[] {
  const simplifications: PlanSimplification[] = [];

  // If overall adherence is low, suggest simplification
  if (execution.adherence.overallScore < 50) {
    const lowPriorityTasks = execution.plan.tasks.filter(
      t => t.status === 'pending' && t.priority === 'low'
    );

    if (lowPriorityTasks.length > 0) {
      simplifications.push({
        id: 'simplify-remove-low-priority',
        reason: 'Low adherence - removing low-priority tasks to focus on essentials',
        tasksRemoved: lowPriorityTasks.map(t => t.title),
        tasksMerged: [],
        tasksSimplified: [],
        expectedAdherenceImprovement: 20,
      });
    }
  }

  // If high behavioral risk, simplify further
  if (predictiveBehavior?.overallRiskLevel === 'high' || predictiveBehavior?.overallRiskLevel === 'critical') {
    const moderateTasks = execution.plan.tasks.filter(
      t => t.status === 'pending' && t.priority === 'moderate'
    );

    if (moderateTasks.length > 2) {
      simplifications.push({
        id: 'simplify-high-risk',
        reason: 'High behavioral risk - simplifying to critical tasks only',
        tasksRemoved: moderateTasks.slice(2).map(t => t.title),
        tasksMerged: [],
        tasksSimplified: moderateTasks.slice(0, 2).map(t => ({
          taskId: t.id,
          originalComplexity: 8,
          simplifiedComplexity: 5,
        })),
        expectedAdherenceImprovement: 30,
      });
    }
  }

  return simplifications;
}

// ============================================================================
// SPECIFIC ADJUSTMENT GENERATORS
// ============================================================================

/**
 * Adjust workout plan based on adherence and fatigue
 */
export function adjustWorkoutPlan(
  execution: ExecutionIntelligence,
  reductionFactor: number = 0.7
): AutonomousAdjustment {
  return {
    id: 'adj-workout-reduce',
    domain: 'workout',
    adjustmentType: 'reduceIntensity',
    reason: 'Reducing workout volume to improve adherence',
    confidence: 0.8,
    impact: 'moderate',
    status: 'pending',
    originalValue: '100% volume',
    adjustedValue: `${Math.round(reductionFactor * 100)}% volume`,
    triggers: ['Low workout adherence'],
    expectedOutcome: 'Improved consistency with reduced volume',
    reversible: true,
    requiresConfirmation: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Adjust recovery plan to add more rest
 */
export function adjustRecoveryPlan(execution: ExecutionIntelligence): AutonomousAdjustment {
  return {
    id: 'adj-recovery-add',
    domain: 'recovery',
    adjustmentType: 'increaseRecovery',
    reason: 'Adding structured recovery time',
    confidence: 0.85,
    impact: 'moderate',
    status: 'pending',
    triggers: ['Recovery adherence low'],
    expectedOutcome: 'Better recovery and reduced fatigue',
    reversible: true,
    requiresConfirmation: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Adjust nutrition plan to simplify targets
 */
export function adjustNutritionPlan(execution: ExecutionIntelligence): AutonomousAdjustment {
  return {
    id: 'adj-nutrition-simplify',
    domain: 'nutrition',
    adjustmentType: 'adjustNutrition',
    reason: 'Simplifying nutrition targets for better adherence',
    confidence: 0.75,
    impact: 'minor',
    status: 'pending',
    triggers: ['Nutrition adherence low'],
    expectedOutcome: 'Easier targets improve adherence',
    reversible: true,
    requiresConfirmation: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Simplify overall execution plan
 */
export function simplifyExecutionPlan(
  execution: ExecutionIntelligence,
  keepOnlyCritical: boolean = false
): AutonomousAdjustment {
  const pendingTasks = execution.plan.tasks.filter(t => t.status === 'pending');
  const criticalTasks = pendingTasks.filter(t => t.priority === 'critical');
  
  return {
    id: 'adj-plan-simplify',
    domain: 'workout', // Default
    adjustmentType: 'simplifyPlan',
    reason: keepOnlyCritical 
      ? 'Focusing on critical tasks only'
      : 'Simplifying plan to improve completion rate',
    confidence: 0.85,
    impact: keepOnlyCritical ? 'major' : 'moderate',
    status: 'pending',
    originalValue: `${pendingTasks.length} tasks`,
    adjustedValue: keepOnlyCritical 
      ? `${criticalTasks.length} critical tasks`
      : `${Math.ceil(pendingTasks.length * 0.7)} tasks`,
    triggers: ['Low overall adherence'],
    expectedOutcome: 'Higher completion rate with focused plan',
    reversible: true,
    requiresConfirmation: !keepOnlyCritical,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function deduplicateAdjustments(adjustments: AutonomousAdjustment[]): AutonomousAdjustment[] {
  const seen = new Set<string>();
  return adjustments.filter(adj => {
    const key = `${adj.domain}-${adj.adjustmentType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getEmptyAutonomousAdjustments(): AutonomousAdjustmentIntelligence {
  return {
    userId: 'unknown',
    date: new Date().toISOString().split('T')[0],
    pendingAdjustments: [],
    appliedAdjustments: [],
    dismissedAdjustments: [],
    triggers: [],
    simplifications: [],
    history: [],
    rulesApplied: [],
    adjustmentCount: 0,
    autoAppliedCount: 0,
    userConfirmedCount: 0,
    successRate: 0,
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Execution Adapter - Phase 15
 * 
 * Purpose: Convert Control Tower recommendations into executable tasks
 * Rules:
 * - Tolerate missing fields
 * - Provide safe defaults
 * - Never throw runtime errors
 * - Generate actionable tasks from recommendations
 */

import type { ControlTowerPayload, TodayPlan, PriorityAlert } from '../types/controlTower';
import type {
  DailyExecutionPlan,
  ExecutionTask,
  ExecutionIntelligence,
  AdherenceSummary,
  DomainAdherence,
  ExecutionScore,
  LearningInsight,
  LearningSignal,
  Intervention,
  OutcomeFeedback,
  ExecutionCheckpoint,
} from '../types/execution';

// ============================================================================
// MAIN ADAPTER: CONTROL TOWER → EXECUTION PLAN
// ============================================================================

/**
 * Convert Control Tower payload into executable tasks
 */
export function generateExecutionPlan(
  controlTower: ControlTowerPayload | null
): DailyExecutionPlan {
  if (!controlTower) {
    return getEmptyExecutionPlan();
  }

  const tasks: ExecutionTask[] = [];

  // Generate tasks from Today's Plan
  const planTasks = generateTasksFromPlan(controlTower.todayPlan);
  tasks.push(...planTasks);

  // Generate tasks from Priority Alerts
  const alertTasks = generateTasksFromAlerts(controlTower.priorityAlerts);
  tasks.push(...alertTasks);

  // Generate tasks from Today's Decision adjustments
  const decisionTasks = generateTasksFromDecision(controlTower.todayDecision);
  tasks.push(...decisionTasks);

  return {
    id: `exec-${controlTower.userId}-${controlTower.timestamp}`,
    userId: controlTower.userId,
    date: new Date(controlTower.timestamp).toISOString().split('T')[0],
    decisionType: controlTower.todayDecision.decisionType,
    confidence: controlTower.todayDecision.confidence === 'high' ? 0.9 : 
                 controlTower.todayDecision.confidence === 'medium' ? 0.7 : 0.5,
    tasks: deduplicateTasks(tasks),
    createdAt: controlTower.timestamp,
    updatedAt: controlTower.lastUpdated,
  };
}

/**
 * Generate tasks from Today's Plan
 */
function generateTasksFromPlan(plan: TodayPlan): ExecutionTask[] {
  const tasks: ExecutionTask[] = [];

  // Workout tasks
  if (plan.workout) {
    tasks.push({
      id: `task-workout-${Date.now()}`,
      domain: 'workout',
      title: plan.workout.title,
      description: plan.workout.recommendation,
      priority: 'high',
      status: 'pending',
      expectedImpact: plan.workout.reason,
    });

    // Add adjustment tasks
    if (plan.workout.adjustments) {
      plan.workout.adjustments.forEach((adjustment, idx) => {
        tasks.push({
          id: `task-workout-adj-${idx}`,
          domain: 'workout',
          title: `Adjustment: ${adjustment.substring(0, 50)}`,
          description: adjustment,
          priority: 'moderate',
          status: 'pending',
        });
      });
    }
  }

  // Recovery tasks
  if (plan.recovery) {
    tasks.push({
      id: `task-recovery-${Date.now()}`,
      domain: 'recovery',
      title: plan.recovery.title,
      description: plan.recovery.recommendation,
      priority: 'high',
      status: 'pending',
      expectedImpact: plan.recovery.reason,
    });
  }

  // Nutrition tasks
  if (plan.nutrition) {
    tasks.push({
      id: `task-nutrition-${Date.now()}`,
      domain: 'nutrition',
      title: plan.nutrition.title,
      description: plan.nutrition.recommendation,
      priority: 'high',
      status: 'pending',
      expectedImpact: plan.nutrition.reason,
    });

    // Extract specific nutrition targets
    const nutritionTasks = extractNutritionTargets(plan.nutrition.recommendation);
    tasks.push(...nutritionTasks);
  }

  // Supplement tasks
  if (plan.supplements) {
    tasks.push({
      id: `task-supplements-${Date.now()}`,
      domain: 'supplements',
      title: plan.supplements.title,
      description: plan.supplements.recommendation,
      priority: 'moderate',
      status: 'pending',
      expectedImpact: plan.supplements.reason,
    });
  }

  return tasks;
}

/**
 * Generate tasks from Priority Alerts
 */
function generateTasksFromAlerts(alerts: PriorityAlert[]): ExecutionTask[] {
  return alerts
    .filter(alert => alert.action) // Only alerts with actions
    .map((alert, idx) => ({
      id: `task-alert-${idx}`,
      domain: inferDomainFromAlert(alert),
      title: alert.title,
      description: alert.action,
      priority: alert.priority === 'critical' ? 'critical' : 
                alert.priority === 'important' ? 'high' : 'moderate',
      status: 'pending',
      expectedImpact: alert.description,
    }));
}

/**
 * Generate tasks from Today's Decision adjustments
 */
function generateTasksFromDecision(decision: any): ExecutionTask[] {
  if (!decision.adjustments || decision.adjustments.length === 0) {
    return [];
  }

  return decision.adjustments.slice(0, 3).map((adjustment: string, idx: number) => ({
    id: `task-decision-${idx}`,
    domain: inferDomainFromText(adjustment),
    title: `AI Adjustment: ${adjustment.substring(0, 40)}`,
    description: adjustment,
    priority: 'moderate',
    status: 'pending',
  }));
}

// ============================================================================
// ADHERENCE INTELLIGENCE
// ============================================================================

/**
 * Calculate adherence summary from execution plan
 */
export function calculateAdherence(plan: DailyExecutionPlan): AdherenceSummary {
  const domainScores = calculateDomainAdherence(plan.tasks);
  const overallScore = calculateOverallScore(plan.tasks);

  return {
    userId: plan.userId,
    date: plan.date,
    overallScore,
    domains: domainScores,
    streak: 0, // TODO: Calculate from historical data
    weeklyAverage: overallScore,
    monthlyAverage: overallScore,
  };
}

function calculateDomainAdherence(tasks: ExecutionTask[]): DomainAdherence[] {
  const domains: Array<'workout' | 'recovery' | 'nutrition' | 'supplements'> = 
    ['workout', 'recovery', 'nutrition', 'supplements'];

  return domains.map(domain => {
    const domainTasks = tasks.filter(t => t.domain === domain);
    const completed = domainTasks.filter(t => t.status === 'completed').length;
    const total = domainTasks.length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      domain,
      score,
      completedTasks: completed,
      totalTasks: total,
      trend: 'stable', // TODO: Calculate from historical data
    };
  });
}

function calculateOverallScore(tasks: ExecutionTask[]): number {
  if (tasks.length === 0) return 0;

  // Weighted scoring by priority
  const weights = {
    critical: 4,
    high: 3,
    moderate: 2,
    low: 1,
  };

  let totalWeight = 0;
  let completedWeight = 0;

  tasks.forEach(task => {
    const weight = weights[task.priority];
    totalWeight += weight;
    if (task.status === 'completed') {
      completedWeight += weight;
    } else if (task.status === 'partial') {
      completedWeight += weight * 0.5;
    }
  });

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

/**
 * Calculate execution score with multiple dimensions
 */
export function calculateExecutionScore(plan: DailyExecutionPlan): ExecutionScore {
  const tasks = plan.tasks;
  const overall = calculateOverallScore(tasks);
  const weighted = overall; // Same for now

  const byDomain: Record<string, number> = {};
  const domainAdherence = calculateDomainAdherence(tasks);
  domainAdherence.forEach(d => {
    byDomain[d.domain] = d.score;
  });

  const byPriority: Record<string, number> = {};
  ['critical', 'high', 'moderate', 'low'].forEach(priority => {
    const priorityTasks = tasks.filter(t => t.priority === priority);
    const completed = priorityTasks.filter(t => t.status === 'completed').length;
    byPriority[priority] = priorityTasks.length > 0 
      ? Math.round((completed / priorityTasks.length) * 100) 
      : 0;
  });

  return {
    overall,
    weighted,
    byDomain: byDomain as any,
    byPriority: byPriority as any,
    trend: 'stable',
  };
}

// ============================================================================
// INTERVENTION INTELLIGENCE
// ============================================================================

/**
 * Generate interventions based on execution status
 */
export function generateInterventions(
  plan: DailyExecutionPlan,
  currentTime: Date
): Intervention[] {
  const interventions: Intervention[] = [];
  const hour = currentTime.getHours();

  // Check for off-track tasks
  plan.tasks.forEach(task => {
    if (task.status === 'pending' && task.priority === 'critical') {
      // Critical task still pending
      if (hour >= 12) {
        interventions.push({
          id: `intervention-${task.id}`,
          type: 'warning',
          urgency: 'high',
          title: `Critical task pending: ${task.title}`,
          description: `This critical task should be completed soon to stay on track.`,
          taskId: task.id,
          domain: task.domain,
          suggestedAction: `Complete ${task.title} now`,
          timing: 'immediate',
          dismissed: false,
        });
      }
    }

    if (task.status === 'pending' && task.priority === 'high') {
      // High priority task still pending in evening
      if (hour >= 18) {
        interventions.push({
          id: `intervention-${task.id}`,
          type: 'reminder',
          urgency: 'medium',
          title: `Reminder: ${task.title}`,
          description: `Don't forget to complete this task today.`,
          taskId: task.id,
          domain: task.domain,
          suggestedAction: `Complete ${task.title} before bed`,
          timing: 'evening',
          dismissed: false,
        });
      }
    }
  });

  return interventions;
}

// ============================================================================
// LEARNING INTELLIGENCE
// ============================================================================

/**
 * Generate learning insights from execution patterns
 */
export function generateLearningInsights(
  plan: DailyExecutionPlan,
  adherence: AdherenceSummary
): LearningSignal {
  const insights: LearningInsight[] = [];

  // Pattern: High adherence in specific domain
  adherence.domains.forEach(domain => {
    if (domain.score >= 90) {
      insights.push({
        id: `insight-${domain.domain}-high`,
        type: 'pattern',
        title: `Excellent ${domain.domain} adherence`,
        description: `You consistently complete ${domain.domain} tasks with ${domain.score}% success.`,
        evidence: [`${domain.completedTasks}/${domain.totalTasks} tasks completed`],
        confidence: 0.9,
        actionable: false,
      });
    }

    if (domain.score < 50) {
      insights.push({
        id: `insight-${domain.domain}-low`,
        type: 'warning',
        title: `${domain.domain} adherence needs attention`,
        description: `Only ${domain.score}% of ${domain.domain} tasks are being completed.`,
        evidence: [`${domain.completedTasks}/${domain.totalTasks} tasks completed`],
        confidence: 0.8,
        actionable: true,
        recommendation: `Consider simplifying ${domain.domain} tasks or adjusting targets`,
      });
    }
  });

  return {
    userId: plan.userId,
    date: plan.date,
    insights,
    adaptations: [], // TODO: Track AI adaptations
  };
}

// ============================================================================
// OUTCOME INTELLIGENCE
// ============================================================================

/**
 * Generate outcome feedback (placeholder for future ML integration)
 */
export function generateOutcomeFeedback(
  plan: DailyExecutionPlan
): OutcomeFeedback[] {
  // Placeholder - will be populated by outcome attribution engine
  return [];
}

// ============================================================================
// CHECKPOINT INTELLIGENCE
// ============================================================================

/**
 * Generate execution checkpoint
 */
export function generateCheckpoint(
  plan: DailyExecutionPlan,
  currentTime: Date
): ExecutionCheckpoint {
  const hour = currentTime.getHours();
  const checkpointType = 
    hour < 12 ? 'morning' : 
    hour < 17 ? 'midday' : 
    hour < 21 ? 'evening' : 'bedtime';

  const completed = plan.tasks.filter(t => t.status === 'completed').length;
  const pending = plan.tasks.filter(t => t.status === 'pending').length;
  const interventions = generateInterventions(plan, currentTime);

  // Determine if on track based on time of day
  const expectedCompletion = 
    checkpointType === 'morning' ? 0.2 :
    checkpointType === 'midday' ? 0.5 :
    checkpointType === 'evening' ? 0.8 : 1.0;

  const actualCompletion = plan.tasks.length > 0 
    ? completed / plan.tasks.length 
    : 0;

  const onTrack = actualCompletion >= expectedCompletion * 0.8;

  return {
    type: checkpointType,
    time: currentTime.toISOString(),
    completedTasks: completed,
    pendingTasks: pending,
    interventions,
    onTrack,
  };
}

// ============================================================================
// UNIFIED EXECUTION INTELLIGENCE
// ============================================================================

/**
 * Generate complete execution intelligence
 */
export function generateExecutionIntelligence(
  controlTower: ControlTowerPayload | null
): ExecutionIntelligence {
  if (!controlTower) {
    return getEmptyExecutionIntelligence();
  }

  const plan = generateExecutionPlan(controlTower);
  const adherence = calculateAdherence(plan);
  const learning = generateLearningInsights(plan, adherence);
  const currentTime = new Date();
  const checkpoint = generateCheckpoint(plan, currentTime);
  const interventions = generateInterventions(plan, currentTime);
  const outcomes = generateOutcomeFeedback(plan);

  return {
    userId: controlTower.userId,
    date: new Date(controlTower.timestamp).toISOString().split('T')[0],
    plan,
    events: [],
    adherence,
    assessments: [],
    outcomes,
    learning,
    interventions,
    checkpoints: [checkpoint],
    lastUpdated: controlTower.lastUpdated,
    dataQuality: controlTower.dataQuality,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractNutritionTargets(recommendation: string): ExecutionTask[] {
  const tasks: ExecutionTask[] = [];
  
  // Extract protein target
  const proteinMatch = recommendation.match(/(\d+)g?\s*protein/i);
  if (proteinMatch) {
    tasks.push({
      id: `task-nutrition-protein`,
      domain: 'nutrition',
      title: 'Protein Target',
      targetValue: parseInt(proteinMatch[1]),
      targetUnit: 'g',
      priority: 'high',
      status: 'pending',
    });
  }

  // Extract hydration target
  const hydrationMatch = recommendation.match(/(\d+)\s*(oz|ounces)/i);
  if (hydrationMatch) {
    tasks.push({
      id: `task-nutrition-hydration`,
      domain: 'nutrition',
      title: 'Hydration Target',
      targetValue: parseInt(hydrationMatch[1]),
      targetUnit: 'oz',
      priority: 'moderate',
      status: 'pending',
    });
  }

  return tasks;
}

function inferDomainFromAlert(alert: PriorityAlert): 'workout' | 'recovery' | 'nutrition' | 'supplements' {
  const text = (alert.title + ' ' + alert.description).toLowerCase();
  
  if (text.includes('workout') || text.includes('training') || text.includes('exercise')) {
    return 'workout';
  }
  if (text.includes('recovery') || text.includes('sleep') || text.includes('rest')) {
    return 'recovery';
  }
  if (text.includes('nutrition') || text.includes('protein') || text.includes('hydration')) {
    return 'nutrition';
  }
  if (text.includes('supplement')) {
    return 'supplements';
  }
  
  return 'recovery'; // Default
}

function inferDomainFromText(text: string): 'workout' | 'recovery' | 'nutrition' | 'supplements' {
  const lower = text.toLowerCase();
  
  if (lower.includes('workout') || lower.includes('training') || lower.includes('volume')) {
    return 'workout';
  }
  if (lower.includes('recovery') || lower.includes('sleep') || lower.includes('rest')) {
    return 'recovery';
  }
  if (lower.includes('nutrition') || lower.includes('protein') || lower.includes('calorie')) {
    return 'nutrition';
  }
  if (lower.includes('supplement')) {
    return 'supplements';
  }
  
  return 'recovery';
}

function deduplicateTasks(tasks: ExecutionTask[]): ExecutionTask[] {
  const seen = new Set<string>();
  return tasks.filter(task => {
    const key = `${task.domain}-${task.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getEmptyExecutionPlan(): DailyExecutionPlan {
  return {
    id: 'empty',
    userId: 'unknown',
    date: new Date().toISOString().split('T')[0],
    decisionType: 'maintain_plan',
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getEmptyExecutionIntelligence(): ExecutionIntelligence {
  const emptyPlan = getEmptyExecutionPlan();
  
  return {
    userId: 'unknown',
    date: new Date().toISOString().split('T')[0],
    plan: emptyPlan,
    events: [],
    adherence: {
      userId: 'unknown',
      date: new Date().toISOString().split('T')[0],
      overallScore: 0,
      domains: [],
      streak: 0,
      weeklyAverage: 0,
      monthlyAverage: 0,
    },
    assessments: [],
    outcomes: [],
    learning: {
      userId: 'unknown',
      date: new Date().toISOString().split('T')[0],
      insights: [],
      adaptations: [],
    },
    interventions: [],
    checkpoints: [],
    lastUpdated: new Date().toISOString(),
    dataQuality: 'none',
  };
}

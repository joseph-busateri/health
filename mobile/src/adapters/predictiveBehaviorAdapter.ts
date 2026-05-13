/**
 * Predictive Behavior Adapter - Phase 16
 * 
 * Purpose: Generate behavior predictions from execution history and patterns
 * Rules:
 * - Tolerate missing data
 * - Provide safe defaults
 * - Never throw runtime errors
 * - Generate actionable predictions
 */

import type { ExecutionIntelligence, ExecutionTask, AdherenceSummary } from '../types/execution';
import type {
  PredictiveBehaviorIntelligence,
  BehaviorPrediction,
  BehaviorRisk,
  BehaviorInsight,
  AdherencePrediction,
  ExecutionDriftPrediction,
  CompletionLikelihood,
  InterventionTiming,
  BehaviorPattern,
  RiskLevel,
} from '../types/predictiveBehavior';

// ============================================================================
// MAIN ADAPTER: GENERATE PREDICTIVE BEHAVIOR INTELLIGENCE
// ============================================================================

/**
 * Generate complete predictive behavior intelligence
 */
export function generatePredictiveBehaviorIntelligence(
  execution: ExecutionIntelligence | null,
  historicalAdherence?: number[]
): PredictiveBehaviorIntelligence {
  if (!execution) {
    return getEmptyPredictiveBehavior();
  }

  const currentTime = new Date();
  const predictions = generateBehaviorPredictions(execution, currentTime);
  const risks = generateBehaviorRisks(execution);
  const insights = generateBehaviorInsights(execution);
  const adherencePredictions = predictAdherenceByDomain(execution);
  const driftPredictions = predictExecutionDrift(execution, currentTime);
  const completionLikelihoods = predictCompletionLikelihood(execution, currentTime);
  const interventionTimings = predictOptimalInterventionTiming(execution, currentTime);
  const patterns = detectBehaviorPatterns(execution);
  
  const overallRiskLevel = calculateOverallRiskLevel(risks);
  const predictedDayScore = predictDayScore(execution, adherencePredictions);
  const confidence = calculatePredictionConfidence(execution);

  return {
    userId: execution.userId,
    date: execution.date,
    predictions,
    risks,
    insights,
    adherencePredictions,
    driftPredictions,
    completionLikelihoods,
    interventionTimings,
    patterns,
    overallRiskLevel,
    predictedDayScore,
    confidence,
    generatedAt: new Date().toISOString(),
    dataQuality: execution.dataQuality === 'none' ? 'insufficient' : execution.dataQuality,
  };
}

// ============================================================================
// BEHAVIOR PREDICTIONS
// ============================================================================

/**
 * Generate behavior predictions for tasks and overall execution
 */
function generateBehaviorPredictions(
  execution: ExecutionIntelligence,
  currentTime: Date
): BehaviorPrediction[] {
  const predictions: BehaviorPrediction[] = [];
  const hour = currentTime.getHours();

  // Predict adherence risk for pending tasks
  execution.plan.tasks
    .filter(task => task.status === 'pending')
    .forEach(task => {
      const adherenceRisk = calculateAdherenceRisk(task, execution.adherence, hour);
      
      if (adherenceRisk > 0.4) {
        predictions.push({
          id: `pred-adherence-${task.id}`,
          taskId: task.id,
          predictionType: 'adherenceRisk',
          probability: adherenceRisk,
          confidence: 0.75,
          timeframe: getTimeframe(hour),
          explanation: `${task.title} has ${Math.round(adherenceRisk * 100)}% risk of being skipped based on time of day and historical adherence.`,
          recommendedAction: `Complete ${task.title} now to avoid evening fatigue.`,
          timestamp: currentTime.toISOString(),
        });
      }
    });

  // Predict execution drift
  if (hour >= 12 && execution.adherence.overallScore < 50) {
    predictions.push({
      id: 'pred-drift-overall',
      predictionType: 'executionDrift',
      probability: 0.7,
      confidence: 0.8,
      timeframe: 'evening',
      explanation: 'Current execution pace suggests evening tasks are at risk.',
      recommendedAction: 'Prioritize critical tasks now.',
      timestamp: currentTime.toISOString(),
    });
  }

  return predictions;
}

/**
 * Calculate adherence risk for a specific task
 */
function calculateAdherenceRisk(
  task: ExecutionTask,
  adherence: AdherenceSummary,
  hour: number
): number {
  let risk = 0;

  // Domain adherence factor
  const domainAdherence = adherence.domains.find(d => d.domain === task.domain);
  if (domainAdherence && domainAdherence.score < 60) {
    risk += 0.3;
  }

  // Time of day factor
  if (hour >= 18 && task.priority === 'moderate') {
    risk += 0.3; // Evening fatigue
  }
  if (hour >= 20) {
    risk += 0.2; // Late evening
  }

  // Priority factor
  if (task.priority === 'low') {
    risk += 0.2;
  }

  return Math.min(risk, 1.0);
}

// ============================================================================
// BEHAVIOR RISKS
// ============================================================================

/**
 * Generate behavior risks by domain
 */
function generateBehaviorRisks(execution: ExecutionIntelligence): BehaviorRisk[] {
  const risks: BehaviorRisk[] = [];

  execution.adherence.domains.forEach(domain => {
    if (domain.score < 50) {
      const riskLevel: RiskLevel = 
        domain.score < 30 ? 'critical' :
        domain.score < 50 ? 'high' : 'moderate';

      risks.push({
        id: `risk-${domain.domain}`,
        domain: domain.domain,
        riskLevel,
        predictedFailure: `${domain.domain} adherence likely to remain low (${domain.score}%)`,
        recommendedMitigation: getMitigation(domain.domain, domain.score),
        probability: (100 - domain.score) / 100,
        confidence: 0.75,
        evidence: [
          `Current adherence: ${domain.score}%`,
          `Completed: ${domain.completedTasks}/${domain.totalTasks}`,
          `Trend: ${domain.trend}`,
        ],
        urgency: domain.score < 30 ? 'high' : 'medium',
      });
    }
  });

  return risks;
}

function getMitigation(domain: string, score: number): string {
  if (score < 30) {
    return `Simplify ${domain} tasks or reduce targets`;
  }
  if (score < 50) {
    return `Break ${domain} tasks into smaller steps`;
  }
  return `Add reminders for ${domain} tasks`;
}

// ============================================================================
// BEHAVIOR INSIGHTS
// ============================================================================

/**
 * Generate behavior insights from patterns
 */
function generateBehaviorInsights(execution: ExecutionIntelligence): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];

  // High adherence domains
  execution.adherence.domains
    .filter(d => d.score >= 80)
    .forEach(domain => {
      insights.push({
        id: `insight-high-${domain.domain}`,
        type: 'pattern',
        description: `Strong adherence pattern in ${domain.domain} (${domain.score}%)`,
        confidence: 0.85,
        evidence: [`${domain.completedTasks}/${domain.totalTasks} tasks completed`],
        actionable: false,
        impact: 'medium',
      });
    });

  // Low adherence warning
  execution.adherence.domains
    .filter(d => d.score < 50)
    .forEach(domain => {
      insights.push({
        id: `insight-low-${domain.domain}`,
        type: 'warning',
        description: `${domain.domain} adherence needs attention (${domain.score}%)`,
        confidence: 0.8,
        evidence: [`Only ${domain.completedTasks}/${domain.totalTasks} tasks completed`],
        actionable: true,
        recommendation: `Consider simplifying ${domain.domain} tasks`,
        impact: 'high',
      });
    });

  // Time-based pattern
  const currentHour = new Date().getHours();
  if (currentHour < 12 && execution.adherence.overallScore > 70) {
    insights.push({
      id: 'insight-morning-success',
      type: 'pattern',
      description: 'Morning execution is strong - maintain this momentum',
      confidence: 0.75,
      evidence: ['High completion rate in morning hours'],
      actionable: true,
      recommendation: 'Schedule critical tasks in morning',
      impact: 'medium',
    });
  }

  return insights;
}

// ============================================================================
// ADHERENCE PREDICTION BY DOMAIN
// ============================================================================

/**
 * Predict adherence score by domain for end of day
 */
function predictAdherenceByDomain(execution: ExecutionIntelligence): AdherencePrediction[] {
  return execution.adherence.domains.map(domain => {
    const currentScore = domain.score;
    const pendingTasks = execution.plan.tasks.filter(
      t => t.domain === domain.domain && t.status === 'pending'
    ).length;
    
    // Simple prediction: assume 50% of pending tasks will be completed
    const expectedCompletions = Math.floor(pendingTasks * 0.5);
    const totalTasks = domain.totalTasks;
    const predictedCompletedTasks = domain.completedTasks + expectedCompletions;
    const predictedScore = totalTasks > 0 
      ? Math.round((predictedCompletedTasks / totalTasks) * 100)
      : currentScore;

    const trend: 'improving' | 'stable' | 'declining' = 
      predictedScore > currentScore + 10 ? 'improving' :
      predictedScore < currentScore - 10 ? 'declining' : 'stable';

    return {
      domain: domain.domain,
      predictedScore,
      currentScore,
      trend,
      confidence: 0.65,
      factors: [
        `${pendingTasks} tasks remaining`,
        `Current completion rate: ${currentScore}%`,
        `Historical trend: ${domain.trend}`,
      ],
    };
  });
}

// ============================================================================
// EXECUTION DRIFT PREDICTION
// ============================================================================

/**
 * Predict which tasks will drift from expected completion time
 */
function predictExecutionDrift(
  execution: ExecutionIntelligence,
  currentTime: Date
): ExecutionDriftPrediction[] {
  const predictions: ExecutionDriftPrediction[] = [];
  const hour = currentTime.getHours();

  execution.plan.tasks
    .filter(task => task.status === 'pending' && task.priority === 'high')
    .forEach(task => {
      // High priority tasks should be done by evening
      const expectedHour = 18;
      const driftMinutes = (hour - expectedHour) * 60;

      if (hour >= expectedHour) {
        predictions.push({
          taskId: task.id,
          taskTitle: task.title,
          driftProbability: 0.8,
          expectedCompletionTime: `${expectedHour}:00`,
          currentTime: currentTime.toTimeString().slice(0, 5),
          driftMinutes,
          severity: driftMinutes > 120 ? 'major' : driftMinutes > 60 ? 'moderate' : 'minor',
          intervention: `Complete ${task.title} immediately to avoid further drift`,
        });
      }
    });

  return predictions;
}

// ============================================================================
// COMPLETION LIKELIHOOD
// ============================================================================

/**
 * Predict likelihood of task completion
 */
function predictCompletionLikelihood(
  execution: ExecutionIntelligence,
  currentTime: Date
): CompletionLikelihood[] {
  const hour = currentTime.getHours();

  return execution.plan.tasks
    .filter(task => task.status === 'pending')
    .map(task => {
      const domainAdherence = execution.adherence.domains.find(d => d.domain === task.domain);
      const domainScore = domainAdherence ? domainAdherence.score / 100 : 0.5;

      // Factors affecting completion
      const timeOfDayFactor = hour < 12 ? 0.3 : hour < 18 ? 0.1 : -0.3;
      const adherenceFactor = (domainScore - 0.5) * 2; // -1 to 1
      const priorityFactor = 
        task.priority === 'critical' ? 0.4 :
        task.priority === 'high' ? 0.2 : 
        task.priority === 'moderate' ? 0 : -0.2;

      const likelihood = Math.max(0, Math.min(1, 
        0.5 + timeOfDayFactor + adherenceFactor * 0.3 + priorityFactor
      ));

      return {
        taskId: task.id,
        taskTitle: task.title,
        domain: task.domain,
        likelihood,
        confidence: 0.7,
        factors: {
          timeOfDay: timeOfDayFactor,
          historicalAdherence: adherenceFactor,
          currentFatigue: hour >= 20 ? -0.3 : 0,
          taskComplexity: task.description ? -0.1 : 0,
        },
        recommendation: likelihood < 0.5 
          ? `Consider simplifying or rescheduling ${task.title}`
          : `Good time to complete ${task.title}`,
      };
    });
}

// ============================================================================
// INTERVENTION TIMING
// ============================================================================

/**
 * Predict optimal intervention timing for pending tasks
 */
function predictOptimalInterventionTiming(
  execution: ExecutionIntelligence,
  currentTime: Date
): InterventionTiming[] {
  const hour = currentTime.getHours();
  const timings: InterventionTiming[] = [];

  execution.plan.tasks
    .filter(task => task.status === 'pending' && task.priority !== 'low')
    .forEach(task => {
      // Optimal times by domain
      const optimalHour = 
        task.domain === 'workout' ? 10 :
        task.domain === 'nutrition' ? 12 :
        task.domain === 'recovery' ? 20 : 14;

      const minutesUntilOptimal = (optimalHour - hour) * 60;

      if (minutesUntilOptimal > -60 && minutesUntilOptimal < 180) {
        timings.push({
          taskId: task.id,
          optimalTime: `${optimalHour}:00`,
          currentTime: currentTime.toTimeString().slice(0, 5),
          minutesUntilOptimal,
          reason: `${task.domain} tasks typically have highest completion rate at ${optimalHour}:00`,
          urgency: minutesUntilOptimal < 0 ? 'high' : minutesUntilOptimal < 60 ? 'medium' : 'low',
        });
      }
    });

  return timings;
}

// ============================================================================
// BEHAVIOR PATTERNS
// ============================================================================

/**
 * Detect behavior patterns from execution data
 */
function detectBehaviorPatterns(execution: ExecutionIntelligence): BehaviorPattern[] {
  const patterns: BehaviorPattern[] = [];

  // Morning completion pattern
  const morningTasks = execution.plan.tasks.filter(
    t => t.status === 'completed' && t.completedAt && 
    new Date(t.completedAt).getHours() < 12
  );
  
  if (morningTasks.length >= 2) {
    patterns.push({
      id: 'pattern-morning-completion',
      patternType: 'time',
      description: 'Strong morning execution pattern detected',
      frequency: morningTasks.length / execution.plan.tasks.length,
      strength: 0.8,
      examples: morningTasks.slice(0, 3).map(t => t.title),
      predictivePower: 0.75,
    });
  }

  // Domain preference pattern
  execution.adherence.domains
    .filter(d => d.score >= 80)
    .forEach(domain => {
      patterns.push({
        id: `pattern-domain-${domain.domain}`,
        patternType: 'condition',
        description: `High adherence in ${domain.domain} domain`,
        frequency: domain.score / 100,
        strength: 0.85,
        examples: [`${domain.completedTasks}/${domain.totalTasks} completed`],
        predictivePower: 0.8,
      });
    });

  return patterns;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateOverallRiskLevel(risks: BehaviorRisk[]): RiskLevel {
  if (risks.length === 0) return 'low';
  
  const hasCritical = risks.some(r => r.riskLevel === 'critical');
  const hasHigh = risks.some(r => r.riskLevel === 'high');
  const hasModerate = risks.some(r => r.riskLevel === 'moderate');

  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  if (hasModerate) return 'moderate';
  return 'low';
}

function predictDayScore(
  execution: ExecutionIntelligence,
  adherencePredictions: AdherencePrediction[]
): number {
  if (adherencePredictions.length === 0) {
    return execution.adherence.overallScore;
  }

  const avgPredicted = adherencePredictions.reduce(
    (sum, pred) => sum + pred.predictedScore, 0
  ) / adherencePredictions.length;

  return Math.round(avgPredicted);
}

function calculatePredictionConfidence(execution: ExecutionIntelligence): number {
  // Confidence based on data quality and sample size
  const taskCount = execution.plan.tasks.length;
  const dataQualityScore = 
    execution.dataQuality === 'high' ? 0.9 :
    execution.dataQuality === 'medium' ? 0.7 :
    execution.dataQuality === 'low' ? 0.5 : 0.3;

  const sampleSizeScore = Math.min(taskCount / 10, 1.0);

  return (dataQualityScore + sampleSizeScore) / 2;
}

function getTimeframe(hour: number): 'morning' | 'midday' | 'evening' | 'day' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'midday';
  if (hour < 21) return 'evening';
  return 'day';
}

function getEmptyPredictiveBehavior(): PredictiveBehaviorIntelligence {
  return {
    userId: 'unknown',
    date: new Date().toISOString().split('T')[0],
    predictions: [],
    risks: [],
    insights: [],
    adherencePredictions: [],
    driftPredictions: [],
    completionLikelihoods: [],
    interventionTimings: [],
    patterns: [],
    overallRiskLevel: 'low',
    predictedDayScore: 0,
    confidence: 0,
    generatedAt: new Date().toISOString(),
    dataQuality: 'insufficient',
  };
}

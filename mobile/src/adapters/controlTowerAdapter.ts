/**
 * Control Tower Adapter - Production-Safe Data Normalization
 * 
 * Purpose: Safely normalize backend responses into ControlTowerViewModel
 * Rules:
 * - Tolerate missing fields
 * - Provide safe defaults
 * - Never throw runtime errors
 * - Maintain backward compatibility
 */

import type { ControlTowerDailyResponse } from '../services/controlTowerDailyService';
import type {
  ControlTowerPayload,
  TodayDecision,
  PriorityAlert,
  TodayPlan,
  TodayPlanItem,
  PredictiveInsight,
  DeviceIntelligence,
  GoalProgress,
  AdvancedIntelligenceSection,
  DecisionType,
  ConfidenceLevel,
  RiskLevel,
} from '../types/controlTower';

// ============================================================================
// SAFE ADAPTERS
// ============================================================================

/**
 * Normalize Control Tower Daily response into unified ViewModel
 */
export function normalizeControlTowerPayload(
  dailyResponse: ControlTowerDailyResponse | null
): ControlTowerPayload {
  if (!dailyResponse) {
    return getEmptyControlTowerPayload();
  }

  return {
    userId: dailyResponse.userId || 'unknown',
    timestamp: dailyResponse.date || new Date().toISOString(),
    
    todayDecision: normalizeTodayDecision(dailyResponse),
    priorityAlerts: normalizePriorityAlerts(dailyResponse),
    todayPlan: normalizeTodayPlan(dailyResponse),
    predictiveInsights: normalizePredictiveInsights(dailyResponse),
    deviceIntelligence: normalizeDeviceIntelligence(),
    goalProgress: normalizeGoalProgress(),
    advancedIntelligence: normalizeAdvancedIntelligence(),
    
    dataQuality: normalizeDataQuality(dailyResponse.trust?.dataAvailabilityState),
    lastUpdated: dailyResponse.trust?.lastUpdated || new Date().toISOString(),
  };
}

/**
 * Normalize Today's Decision from headline and status
 */
function normalizeTodayDecision(response: ControlTowerDailyResponse): TodayDecision {
  const decisionType = inferDecisionType(response.headline, response.overallStatus);
  const confidence = inferConfidence(response.trust?.dataAvailabilityState);
  
  return {
    decisionType,
    title: response.headline || 'Maintain Current Plan',
    summary: response.headline || 'Continue with your current health plan',
    rationale: response.reasoning || 'Insufficient data to generate specific recommendations',
    confidence,
    
    recoveryStatus: {
      score: inferRecoveryScore(response.overallStatus),
      label: mapStatusToRecoveryLabel(response.overallStatus),
    },
    
    fatigueRisk: inferFatigueRisk(response.overallStatus),
    
    adjustments: extractAdjustments(response),
    
    canAccept: true,
    canModify: true,
  };
}

/**
 * Normalize priority alerts from existing priorities
 */
function normalizePriorityAlerts(response: ControlTowerDailyResponse): PriorityAlert[] {
  if (!response.priorities || response.priorities.length === 0) {
    return [];
  }

  return response.priorities.map((priority, index) => ({
    id: `priority-${index}`,
    priority: priority.priority,
    type: inferAlertType(priority.priority),
    title: priority.title,
    description: priority.title,
    evidence: priority.actions || [],
    source: priority.source,
    action: priority.actions?.[0],
  }));
}

/**
 * Normalize today's plan from workout and nutrition
 */
function normalizeTodayPlan(response: ControlTowerDailyResponse): TodayPlan {
  const plan: TodayPlan = {};

  if (response.workout) {
    plan.workout = {
      domain: 'workout',
      title: response.workout.title,
      recommendation: response.workout.summary,
      adjustments: response.workout.topAdjustments,
      reason: `${response.workout.workoutType || 'Training'} - Week ${response.workout.cycleWeek || '?'}`,
    };
  }

  if (response.nutrition) {
    plan.nutrition = {
      domain: 'nutrition',
      title: response.nutrition.title,
      recommendation: response.nutrition.summary,
      adjustments: response.nutrition.topAdjustments,
      reason: formatNutritionReason(response.nutrition),
    };
  }

  // Add recovery placeholder
  plan.recovery = {
    domain: 'recovery',
    title: 'Recovery Focus',
    recommendation: 'Prioritize sleep quality and stress management',
    reason: 'Based on current recovery status',
  };

  // Add supplements placeholder
  plan.supplements = {
    domain: 'supplements',
    title: 'Supplement Stack',
    recommendation: 'Continue current supplement protocol',
    reason: 'No changes recommended today',
  };

  return plan;
}

/**
 * Normalize predictive insights from predictive alerts
 */
function normalizePredictiveInsights(response: ControlTowerDailyResponse): PredictiveInsight[] {
  if (!response.predictiveAlerts || response.predictiveAlerts.length === 0) {
    return [];
  }

  return response.predictiveAlerts.map((alert) => ({
    timeframe: '24h', // Default to 24h, can be enhanced later
    type: inferPredictiveType(alert.title),
    prediction: alert.title,
    riskLevel: alert.level as RiskLevel,
    confidence: 'medium' as ConfidenceLevel,
    preventiveAction: alert.rationale,
  }));
}

/**
 * Normalize device intelligence (placeholder for future device integration)
 */
function normalizeDeviceIntelligence(): DeviceIntelligence {
  return {
    devices: [],
    hasData: false,
    dataQuality: 'none',
  };
}

/**
 * Normalize goal progress (placeholder for future goal integration)
 */
function normalizeGoalProgress(): GoalProgress[] {
  return [
    {
      goalType: 'bodybuilding',
      goalName: 'Large & Lean Bodybuilding',
      status: 'on_track',
      progress: 0,
      trend: 'stable',
      explanation: 'Goal tracking will be available soon',
    },
  ];
}

/**
 * Normalize advanced intelligence sections
 */
function normalizeAdvancedIntelligence(): AdvancedIntelligenceSection[] {
  return [
    {
      id: 'longitudinal',
      title: 'Longitudinal Trends',
      description: 'View long-term health trends and patterns',
      available: true,
      navigationTarget: 'Trends',
    },
    {
      id: 'adaptive',
      title: 'Adaptive Intelligence',
      description: 'See how the AI learns from your patterns',
      available: false,
    },
    {
      id: 'cross-engine',
      title: 'Cross-Engine Insights',
      description: 'Multi-domain health correlations',
      available: false,
    },
    {
      id: 'autonomous',
      title: 'Autonomous Optimization',
      description: 'AI-driven automatic adjustments',
      available: false,
    },
  ];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function inferDecisionType(headline: string, status: string): DecisionType {
  const lower = headline.toLowerCase();
  
  if (lower.includes('rest') || lower.includes('recovery day')) {
    return 'rest_day';
  }
  if (lower.includes('reduce') || lower.includes('lower')) {
    return 'train_reduced';
  }
  if (lower.includes('recovery focus')) {
    return 'recovery_focus';
  }
  if (lower.includes('maintain')) {
    return 'maintain_plan';
  }
  if (status === 'high_risk' || status === 'constrained') {
    return 'reduce_intensity';
  }
  
  return 'train_normal';
}

function inferConfidence(dataState?: string): ConfidenceLevel {
  if (dataState === 'complete') return 'high';
  if (dataState === 'partial') return 'medium';
  return 'low';
}

function inferRecoveryScore(status: string): number {
  const scoreMap: Record<string, number> = {
    optimal: 85,
    moderate: 65,
    constrained: 45,
    high_risk: 25,
  };
  return scoreMap[status] || 50;
}

function mapStatusToRecoveryLabel(status: string): string {
  const labelMap: Record<string, string> = {
    optimal: 'Excellent',
    moderate: 'Good',
    constrained: 'Fair',
    high_risk: 'Poor',
  };
  return labelMap[status] || 'Unknown';
}

function inferFatigueRisk(status: string): RiskLevel {
  if (status === 'high_risk') return 'critical';
  if (status === 'constrained') return 'high';
  if (status === 'moderate') return 'moderate';
  return 'low';
}

function extractAdjustments(response: ControlTowerDailyResponse): string[] {
  const adjustments: string[] = [];
  
  if (response.workout?.topAdjustments) {
    adjustments.push(...response.workout.topAdjustments);
  }
  
  if (response.nutrition?.topAdjustments) {
    adjustments.push(...response.nutrition.topAdjustments);
  }
  
  return adjustments.slice(0, 5); // Limit to top 5
}

function inferAlertType(priority: string): 'risk' | 'opportunity' | 'optimization' {
  if (priority === 'critical') return 'risk';
  if (priority === 'important') return 'risk';
  return 'optimization';
}

function inferPredictiveType(title: string): PredictiveInsight['type'] {
  const lower = title.toLowerCase();
  
  if (lower.includes('recovery')) return 'recovery';
  if (lower.includes('fatigue') || lower.includes('overtrain')) return 'fatigue';
  if (lower.includes('performance') || lower.includes('strength')) return 'performance';
  if (lower.includes('cardiovascular') || lower.includes('heart')) return 'cardiovascular';
  if (lower.includes('metabolic') || lower.includes('glucose')) return 'metabolic';
  
  return 'recovery';
}

function formatNutritionReason(nutrition: any): string {
  const parts: string[] = [];
  
  if (nutrition.calories) parts.push(`${nutrition.calories} cal`);
  if (nutrition.protein) parts.push(`${nutrition.protein}g protein`);
  
  return parts.length > 0 ? parts.join(' • ') : 'Nutrition targets';
}

function normalizeDataQuality(dataState?: string): 'high' | 'medium' | 'low' | 'none' {
  if (dataState === 'complete') return 'high';
  if (dataState === 'partial') return 'medium';
  if (dataState === 'minimal') return 'low';
  return 'none';
}

function getEmptyControlTowerPayload(): ControlTowerPayload {
  return {
    userId: 'unknown',
    timestamp: new Date().toISOString(),
    
    todayDecision: {
      decisionType: 'maintain_plan',
      title: 'No Data Available',
      summary: 'Complete your daily check-in to receive AI recommendations',
      rationale: 'Insufficient data to generate personalized guidance',
      confidence: 'low',
      recoveryStatus: {
        score: 0,
        label: 'Unknown',
      },
      fatigueRisk: 'low',
      adjustments: [],
      canAccept: false,
      canModify: false,
    },
    
    priorityAlerts: [],
    todayPlan: {},
    predictiveInsights: [],
    deviceIntelligence: {
      devices: [],
      hasData: false,
      dataQuality: 'none',
    },
    goalProgress: [],
    advancedIntelligence: normalizeAdvancedIntelligence(),
    
    dataQuality: 'none',
    lastUpdated: new Date().toISOString(),
  };
}

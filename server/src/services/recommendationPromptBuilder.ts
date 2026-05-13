/**
 * Recommendation Prompt Builder
 * 
 * Builds AI prompts from structured evidence for recommendation enrichment.
 * 
 * Responsibilities:
 * - Convert structured evidence to natural language prompts
 * - Include user context and preferences
 * - Format for AI consumption
 * - Does NOT generate recommendations (AI does that)
 */

import type { 
  RecommendationEvidence, 
  AIPromptContext,
  AIRecommendationResponse,
  AIEnrichedFields,
} from '../types/recommendationSchema';

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

const SYSTEM_PROMPT = `You are a health and fitness recommendation assistant. Your role is to generate clear, actionable, and personalized health recommendations based on structured health data.

Guidelines:
1. Be direct and actionable
2. Use clear, non-technical language unless user prefers technical details
3. Focus on the most important factors
4. Provide specific, measurable actions when possible
5. Be empathetic but not alarmist
6. Keep titles concise (under 100 characters)
7. Keep descriptions focused (under 500 characters)
8. Provide rationale that explains the "why"

Output Format:
Return a JSON object with these fields:
- title: Short, actionable title (e.g., "Take a recovery day")
- description: Clear explanation of what to do and why
- rationale: Detailed reasoning based on the health data
- reasonCodes: Array of reason codes (e.g., ["low_hrv", "insufficient_sleep"])
- recommendationGroup: Logical group (e.g., "recovery_optimization")
- supportingMetrics: Array of key metrics to display
- isInsightOnly: true if just informational, false if actionable
- requiresUserDecision: true if user needs to make a choice`;

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build AI prompt from recommendation evidence
 */
export function buildRecommendationPrompt(
  evidence: RecommendationEvidence,
  context?: AIPromptContext
): string {
  const parts: string[] = [];
  
  // Add user context if available
  if (context?.userProfile) {
    parts.push(buildUserContextSection(context.userProfile));
  }
  
  // Add health data
  parts.push(buildHealthDataSection(evidence));
  
  // Add contributing factors
  if (evidence.contributingFactors.length > 0) {
    parts.push(buildContributingFactorsSection(evidence.contributingFactors));
  }
  
  // Add recommendation context
  parts.push(buildRecommendationContextSection(evidence));
  
  // Add user preferences if available
  if (context?.historicalData?.userPreferences) {
    parts.push(buildPreferencesSection(context.historicalData.userPreferences));
  }
  
  // Add task instruction
  parts.push(buildTaskInstruction(evidence));
  
  return parts.join('\n\n');
}

/**
 * Build user context section
 */
function buildUserContextSection(userProfile: NonNullable<AIPromptContext['userProfile']>): string {
  const lines: string[] = ['## User Context'];
  
  if (userProfile.name) {
    lines.push(`Name: ${userProfile.name}`);
  }
  if (userProfile.age) {
    lines.push(`Age: ${userProfile.age}`);
  }
  if (userProfile.gender) {
    lines.push(`Gender: ${userProfile.gender}`);
  }
  if (userProfile.fitnessLevel) {
    lines.push(`Fitness Level: ${userProfile.fitnessLevel}`);
  }
  if (userProfile.goals && userProfile.goals.length > 0) {
    lines.push(`Goals: ${userProfile.goals.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Build health data section
 */
function buildHealthDataSection(evidence: RecommendationEvidence): string {
  const lines: string[] = ['## Health Data'];
  
  lines.push(`Primary Metric: ${evidence.primaryMetric.name}`);
  lines.push(`Value: ${evidence.primaryMetric.value}`);
  lines.push(`Status: ${evidence.primaryMetric.status}`);
  
  if (evidence.primaryMetric.threshold !== undefined) {
    lines.push(`Threshold: ${evidence.primaryMetric.threshold}`);
    
    const deviation = typeof evidence.primaryMetric.value === 'number' && typeof evidence.primaryMetric.threshold === 'number'
      ? Math.round(((evidence.primaryMetric.value - evidence.primaryMetric.threshold) / evidence.primaryMetric.threshold) * 100)
      : null;
    
    if (deviation !== null) {
      lines.push(`Deviation: ${deviation > 0 ? '+' : ''}${deviation}%`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Build contributing factors section
 */
function buildContributingFactorsSection(
  factors: RecommendationEvidence['contributingFactors']
): string {
  const lines: string[] = ['## Contributing Factors'];
  
  // Sort by importance
  const sorted = [...factors].sort((a, b) => {
    const importanceOrder = { primary: 0, secondary: 1, tertiary: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
  
  sorted.forEach((factor, index) => {
    lines.push(`\n${index + 1}. ${factor.metric.replace(/_/g, ' ').toUpperCase()}`);
    lines.push(`   Value: ${factor.value}`);
    lines.push(`   Status: ${factor.status}`);
    if (factor.threshold !== undefined) {
      lines.push(`   Threshold: ${factor.threshold}`);
    }
    lines.push(`   Importance: ${factor.importance}`);
  });
  
  return lines.join('\n');
}

/**
 * Build recommendation context section
 */
function buildRecommendationContextSection(evidence: RecommendationEvidence): string {
  const lines: string[] = ['## Recommendation Context'];
  
  lines.push(`Type: ${evidence.recommendationType}`);
  lines.push(`Category: ${evidence.category}`);
  lines.push(`Priority: ${evidence.priority}`);
  lines.push(`Urgency Score: ${evidence.urgencyScore}/100`);
  lines.push(`Confidence Level: ${evidence.confidenceLevel}`);
  lines.push(`Data Quality: ${evidence.dataQualityScore}/100`);
  
  if (evidence.actionType && evidence.actionTarget) {
    lines.push(`Suggested Action: ${evidence.actionType} ${evidence.actionTarget}`);
  }
  
  if (evidence.userContext) {
    if (evidence.userContext.currentGoal) {
      lines.push(`Current Goal: ${evidence.userContext.currentGoal}`);
    }
    if (evidence.userContext.recentActivity) {
      lines.push(`Recent Activity: ${evidence.userContext.recentActivity}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Build preferences section
 */
function buildPreferencesSection(
  preferences: NonNullable<AIPromptContext['historicalData']>['userPreferences']
): string {
  const lines: string[] = ['## User Preferences'];
  
  if (preferences?.communicationStyle) {
    lines.push(`Communication Style: ${preferences.communicationStyle}`);
  }
  if (preferences?.technicalLevel) {
    lines.push(`Technical Level: ${preferences.technicalLevel}`);
  }
  
  return lines.join('\n');
}

/**
 * Build task instruction
 */
function buildTaskInstruction(evidence: RecommendationEvidence): string {
  return `## Task

Based on the health data and context above, generate a personalized health recommendation.

The recommendation should:
1. Address the primary health concern (${evidence.primaryMetric.name}: ${evidence.primaryMetric.status})
2. Consider the contributing factors
3. Be appropriate for the priority level (${evidence.priority})
4. Be actionable and specific
5. Include supporting metrics that the user should monitor

Return your response as a JSON object with the following structure:
{
  "title": "Short, actionable title (max 100 chars)",
  "description": "Clear explanation of what to do (max 500 chars)",
  "rationale": "Detailed reasoning based on the data (max 1000 chars)",
  "reasonCodes": ["array", "of", "reason", "codes"],
  "recommendationGroup": "logical_group_name",
  "supportingMetrics": [
    {
      "name": "Metric Name",
      "value": "Current Value",
      "status": "low|normal|high|optimal",
      "change": "±X%",
      "target": "Target Range"
    }
  ],
  "isInsightOnly": false,
  "requiresUserDecision": true
}`;
}

// ============================================================================
// AI INTERACTION (REAL OPENAI INTEGRATION)
// ============================================================================

/**
 * AI enrichment function using OpenAI
 * 
 * Calls OpenAI service to enrich recommendation with natural language
 * Falls back to mock if OpenAI is not available (for testing)
 */
export async function enrichRecommendationWithAI(
  evidence: RecommendationEvidence
): Promise<AIEnrichedFields> {
  // Try real OpenAI first
  try {
    const { enrichRecommendationWithOpenAI } = await import('./openAIService');
    return await enrichRecommendationWithOpenAI(evidence);
  } catch (error: any) {
    // If OpenAI fails, log and fall back to mock
    console.warn('OpenAI enrichment failed, using mock fallback:', error.message);
    return enrichRecommendationWithAIMock(evidence);
  }
}

/**
 * Mock AI enrichment function for testing/fallback
 * 
 * Returns deterministic responses based on evidence.
 */
function enrichRecommendationWithAIMock(
  evidence: RecommendationEvidence
): AIEnrichedFields {
  // Generate title based on recommendation type
  const titles: Record<string, string> = {
    workout_modification: evidence.priority === 'important' 
      ? 'Take a recovery day'
      : 'Reduce training intensity',
    medical_consultation: 'Consult your healthcare provider',
    health_monitoring: 'Monitor your health metrics',
    lifestyle_change: 'Adjust your lifestyle habits',
    recovery_protocol: 'Start a recovery protocol',
  };
  
  const title = titles[evidence.recommendationType] || 'Review your health data';
  
  // Generate description
  const description = `Your ${evidence.primaryMetric.name.replace(/_/g, ' ')} is ${evidence.primaryMetric.status}. ${
    evidence.contributingFactors.length > 0
      ? `Key factors include ${evidence.contributingFactors.slice(0, 2).map(f => f.metric.replace(/_/g, ' ')).join(' and ')}.`
      : ''
  } Taking action now will help you ${evidence.priority === 'critical' ? 'address this health concern' : 'optimize your performance'}.`;
  
  // Generate rationale
  const rationale = `Based on your health data, your ${evidence.primaryMetric.name.replace(/_/g, ' ')} is ${evidence.primaryMetric.value}${
    evidence.primaryMetric.threshold !== undefined ? ` (threshold: ${evidence.primaryMetric.threshold})` : ''
  }. ${
    evidence.contributingFactors.length > 0
      ? `Contributing factors include: ${evidence.contributingFactors.map(f => 
          `${f.metric.replace(/_/g, ' ')} (${f.value}, ${f.status})`
        ).join(', ')}.`
      : ''
  } This ${evidence.priority} priority recommendation will help you maintain optimal health.`;
  
  // Generate reason codes
  const reasonCodes: string[] = [];
  evidence.contributingFactors.forEach(factor => {
    if (factor.status === 'low') {
      reasonCodes.push(`low_${factor.metric}`);
    } else if (factor.status === 'high') {
      reasonCodes.push(`high_${factor.metric}`);
    }
  });
  if (reasonCodes.length === 0) {
    reasonCodes.push(evidence.trigger);
  }
  
  // Generate supporting metrics
  const supportingMetrics = evidence.contributingFactors.slice(0, 3).map(factor => ({
    name: factor.metric.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: String(factor.value),
    status: factor.status,
    change: undefined,
    target: factor.threshold !== undefined ? `Target: ${factor.threshold}` : undefined,
  }));
  
  // Determine if insight-only or actionable
  const isInsightOnly = evidence.priority === 'optimization' && evidence.dataQualityScore < 60;
  
  // Determine if requires user decision
  const requiresUserDecision = evidence.category === 'workout_modification' || 
                                evidence.category === 'supplement_adjustment' ||
                                evidence.category === 'lifestyle_change';
  
  // Return AI-enriched fields
  return {
    title,
    description,
    rationale,
    reasonCodes,
    recommendationGroup: mapCategoryToGroup(evidence.category),
    supportingMetrics,
    isInsightOnly,
    requiresUserDecision,
  };
}

/**
 * Map category to recommendation group
 */
function mapCategoryToGroup(category: string): string {
  const mapping: Record<string, string> = {
    workout_modification: 'recovery_optimization',
    recovery_protocol: 'recovery_optimization',
    supplement_adjustment: 'supplement_optimization',
    nutrition_change: 'nutrition_optimization',
    lifestyle_change: 'lifestyle_optimization',
    medical_consultation: 'health_monitoring',
    stress_management: 'stress_management',
    sleep_optimization: 'sleep_optimization',
    performance_enhancement: 'performance_enhancement',
    injury_prevention: 'injury_prevention',
    health_monitoring: 'health_monitoring',
  };
  
  return mapping[category] || 'health_monitoring';
}

// ============================================================================
// EXPORT SYSTEM PROMPT FOR REFERENCE
// ============================================================================

export { SYSTEM_PROMPT };

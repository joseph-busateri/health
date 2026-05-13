/**
 * Stress AI Enrichment Service
 * 
 * Mirrors Recovery Engine AI enrichment architecture.
 * Enriches deterministic stress recommendations with AI-generated content.
 */

import type {
  StressEvidence,
  StressRecommendation,
} from '../types/stressEngine';

interface AIStressResponse {
  title: string;
  description: string;
  rationale: string;
  reasonCodes: string[];
  recommendationGroup: string;
  supportingMetrics: Array<{
    name: string;
    value: string;
    status?: string;
    change?: string;
    target?: string;
    unit?: string;
  }>;
  isInsightOnly: boolean;
  requiresUserDecision: boolean;
}

/**
 * Build AI prompt from stress evidence
 */
function buildStressPrompt(evidence: StressEvidence): string {
  const parts: string[] = [];

  parts.push('## Stress and CNS Load Assessment');
  parts.push(`Stress Score: ${evidence.stressScore}/100 (${evidence.stressStatus})`);
  parts.push(`CNS Load: ${evidence.cnsLoadStatus}`);
  parts.push('');

  if (evidence.signals.length > 0) {
    parts.push('## Contributing Signals');
    evidence.signals.forEach((signal) => {
      parts.push(`- ${signal.name}: ${signal.value}`);
      parts.push(`  ${signal.interpretation}`);
    });
    parts.push('');
  }

  parts.push('## Task');
  parts.push(
    'Generate a personalized stress management recommendation based on this data.'
  );
  parts.push('');
  parts.push('Focus on:');
  parts.push('1. Clear, actionable guidance');
  parts.push('2. Specific recovery and training adjustments');
  parts.push('3. Practical stress management strategies');
  parts.push('');
  parts.push('Return JSON with:');
  parts.push('- title: Short actionable title (under 100 chars)');
  parts.push('- description: Clear explanation (under 500 chars)');
  parts.push('- rationale: Detailed reasoning based on the data');
  parts.push('- reasonCodes: Array of reason codes (e.g., ["high_stress", "low_hrv"])');
  parts.push('- recommendationGroup: "stress_management"');
  parts.push(
    '- supportingMetrics: Array of key metrics [{name, value, status, unit}]'
  );
  parts.push('- isInsightOnly: false (this is actionable)');
  parts.push('- requiresUserDecision: true if user needs to choose an action');

  return parts.join('\n');
}

/**
 * Call OpenAI to enrich stress recommendation
 */
async function enrichWithOpenAI(
  evidence: StressEvidence
): Promise<AIStressResponse> {
  const { enrichRecommendationWithOpenAI } = await import('./openAIService');

  const prompt = buildStressPrompt(evidence);

  const mockEvidence = {
    sourceEngine: 'stress' as const,
    sourceRecordId: 'stress-temp',
    userId: 'temp',
    trigger: evidence.stressStatus,
    recommendationType: 'proactive' as const,
    primaryMetric: {
      name: 'stress_score',
      value: evidence.stressScore,
      status: evidence.stressStatus,
    },
    contributingFactors: evidence.signals.map((signal) => ({
      metric: signal.name,
      value: typeof signal.value === 'boolean' ? String(signal.value) : signal.value,
      threshold: undefined,
      status: 'normal' as const,
      importance: 'secondary' as const,
    })),
    priority: 'important' as const,
    urgencyScore: evidence.stressScore,
    category: 'stress_management' as const,
    confidenceLevel: 'medium' as const,
    dataQualityScore: 85,
  };

  const aiResponse = await enrichRecommendationWithOpenAI(mockEvidence);

  return {
    title: aiResponse.title || 'Manage stress and recovery',
    description: aiResponse.description || 'Focus on stress reduction',
    rationale: aiResponse.rationale || 'Based on current stress levels',
    reasonCodes: aiResponse.reasonCodes || [],
    recommendationGroup: aiResponse.recommendationGroup || 'stress_management',
    supportingMetrics: aiResponse.supportingMetrics || [],
    isInsightOnly: aiResponse.isInsightOnly ?? false,
    requiresUserDecision: aiResponse.requiresUserDecision ?? true,
  };
}

/**
 * Mock AI enrichment for fallback
 */
function enrichWithMock(evidence: StressEvidence): AIStressResponse {
  const reasonCodes: string[] = [];

  if (evidence.stressStatus === 'high') {
    reasonCodes.push('high_stress');
  }
  if (evidence.cnsLoadStatus === 'high') {
    reasonCodes.push('high_cns_load');
  }

  const hrvSignal = evidence.signals.find((s) => s.name === 'hrv');
  if (hrvSignal && typeof hrvSignal.value === 'number' && hrvSignal.value <= 35) {
    reasonCodes.push('low_hrv');
  }

  const sleepSignal = evidence.signals.find((s) => s.name === 'sleepDuration');
  if (
    sleepSignal &&
    typeof sleepSignal.value === 'number' &&
    sleepSignal.value < 6
  ) {
    reasonCodes.push('insufficient_sleep');
  }

  const supportingMetrics = evidence.signals.map((signal) => ({
    name: signal.name,
    value: String(signal.value),
    status: signal.interpretation.includes('elevated') ? 'high' : 'normal',
  }));

  return {
    title: `Stress is ${evidence.stressStatus} — adjust training load`,
    description: `Your stress score is ${evidence.stressScore}/100 with ${evidence.cnsLoadStatus} CNS load. Prioritize recovery and reduce training intensity today.`,
    rationale: evidence.summary,
    reasonCodes,
    recommendationGroup: 'stress_management',
    supportingMetrics,
    isInsightOnly: false,
    requiresUserDecision: true,
  };
}

/**
 * Main enrichment function
 */
export async function enrichStressRecommendationWithAI(
  evidence: StressEvidence,
  fallback: StressRecommendation
): Promise<AIStressResponse> {
  try {
    return await enrichWithOpenAI(evidence);
  } catch (error: any) {
    console.warn(
      'OpenAI stress enrichment failed, using mock fallback:',
      error.message
    );
    return enrichWithMock(evidence);
  }
}

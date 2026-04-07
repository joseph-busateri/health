/**
 * Stress Recommendation Normalizer
 * 
 * Mirrors Recovery Engine normalization architecture.
 * Ensures AI-generated stress recommendations conform to system schema.
 */

import type { StressRecommendation } from '../types/stressEngine';

interface AIStressOutput {
  title?: string;
  description?: string;
  rationale?: string;
  reasonCodes?: string[];
  recommendationGroup?: string;
  supportingMetrics?: any[];
  isInsightOnly?: boolean;
  requiresUserDecision?: boolean;
}

/**
 * Normalize AI output to StressRecommendation format
 */
export function normalizeStressRecommendation(
  aiOutput: AIStressOutput,
  fallback: StressRecommendation
): StressRecommendation {
  return {
    type: 'stress',
    priority: aiOutput.rationale ? fallback.priority : 'important',
    summary: sanitizeText(aiOutput.description) || fallback.summary,
    rationale: sanitizeText(aiOutput.rationale),
    actions: normalizeActions(aiOutput) || fallback.actions,
    source: 'ai_enriched',
  };
}

/**
 * Extract actions from AI output
 */
function normalizeActions(aiOutput: AIStressOutput): string[] | undefined {
  // AI output doesn't have explicit actions field
  // We rely on the description containing actionable guidance
  // Return undefined to use fallback actions
  return undefined;
}

/**
 * Sanitize text content
 */
function sanitizeText(text: string | undefined): string | undefined {
  if (!text) return undefined;

  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * OpenAI Service
 * 
 * Isolated AI integration for recommendation enrichment.
 * Provider can be swapped later without affecting the rest of the system.
 * 
 * Architecture:
 * - Single responsibility: AI enrichment only
 * - Accepts structured evidence, returns enriched recommendation
 * - Robust error handling and timeout protection
 * - Metrics tracking for monitoring
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger';
import type { AIEnrichedFields } from '../types/recommendationSchema';
import type { RecommendationEvidence } from '../types/recommendationSchema';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10);
const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10);

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT_MS,
    });
  }
  
  return openaiClient;
}

// ============================================================================
// METRICS TRACKING
// ============================================================================

export interface AIEnrichmentMetrics {
  attempted: number;
  succeeded: number;
  failed: number;
  timeouts: number;
  parseErrors: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
}

const metrics: AIEnrichmentMetrics = {
  attempted: 0,
  succeeded: 0,
  failed: 0,
  timeouts: 0,
  parseErrors: 0,
  totalLatencyMs: 0,
  avgLatencyMs: 0,
};

export function getAIEnrichmentMetrics(): AIEnrichmentMetrics {
  return { ...metrics };
}

export function resetAIEnrichmentMetrics(): void {
  metrics.attempted = 0;
  metrics.succeeded = 0;
  metrics.failed = 0;
  metrics.timeouts = 0;
  metrics.parseErrors = 0;
  metrics.totalLatencyMs = 0;
  metrics.avgLatencyMs = 0;
}

// ============================================================================
// AI ENRICHMENT
// ============================================================================

/**
 * Enrich recommendation with AI-generated content
 * 
 * @param evidence - Structured evidence from analysis layer
 * @returns AI-enriched fields
 * @throws Error if AI enrichment fails
 */
export async function enrichRecommendationWithOpenAI(
  evidence: RecommendationEvidence
): Promise<AIEnrichedFields> {
  const startTime = Date.now();
  metrics.attempted++;
  
  try {
    logger.info('Starting AI enrichment', {
      sourceEngine: evidence.sourceEngine,
      trigger: evidence.trigger,
      priority: evidence.priority,
    });
    
    // Build prompt from evidence
    const prompt = buildPromptFromEvidence(evidence);
    
    // Call OpenAI with timeout protection
    const client = getOpenAIClient();
    
    const completion = await Promise.race([
      client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI request timeout')), OPENAI_TIMEOUT_MS)
      ),
    ]);
    
    const latencyMs = Date.now() - startTime;
    metrics.totalLatencyMs += latencyMs;
    metrics.avgLatencyMs = metrics.totalLatencyMs / metrics.attempted;
    
    // Parse response
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    const enrichedFields = parseAIResponse(content);
    
    metrics.succeeded++;
    
    logger.info('AI enrichment succeeded', {
      sourceEngine: evidence.sourceEngine,
      latencyMs,
      title: enrichedFields.title,
      reasonCodeCount: enrichedFields.reasonCodes.length,
    });
    
    return enrichedFields;
    
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    metrics.totalLatencyMs += latencyMs;
    metrics.avgLatencyMs = metrics.totalLatencyMs / metrics.attempted;
    metrics.failed++;
    
    if (error.message === 'OpenAI request timeout') {
      metrics.timeouts++;
      logger.warn('AI enrichment timeout', {
        sourceEngine: evidence.sourceEngine,
        latencyMs,
        timeoutMs: OPENAI_TIMEOUT_MS,
      });
    } else if (error.message?.includes('parse')) {
      metrics.parseErrors++;
      logger.error('AI enrichment parse error', {
        sourceEngine: evidence.sourceEngine,
        error: error.message,
        latencyMs,
      });
    } else {
      logger.error('AI enrichment failed', {
        sourceEngine: evidence.sourceEngine,
        error: error.message,
        latencyMs,
      });
    }
    
    throw error;
  }
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function getSystemPrompt(): string {
  return `You are a health recommendation assistant. Your role is to generate personalized, actionable health recommendations based on structured health data.

Your response must be a JSON object with the following fields:
- title: A clear, concise title (5-100 characters)
- description: A detailed explanation of what the user should do (20-500 characters)
- rationale: Why this recommendation matters, with specific data points (max 1000 characters)
- reasonCodes: Array of 1-10 structured reason codes (e.g., "low_hrv", "insufficient_sleep")
- recommendationGroup: A category for grouping (e.g., "recovery_optimization", "stress_management")
- supportingMetrics: Array of up to 5 metrics with name, value, status, and optional target
- isInsightOnly: Boolean - true if informational only, false if actionable
- requiresUserDecision: Boolean - true if user must explicitly accept/reject

Guidelines:
- Be specific and data-driven
- Use natural, encouraging language
- Focus on actionable steps
- Explain the "why" with data
- Keep it concise but informative
- Use metric values from the evidence provided`;
}

function buildPromptFromEvidence(evidence: RecommendationEvidence): string {
  let prompt = '## Health Data\n\n';
  
  // Primary metric
  prompt += `**Primary Metric:** ${evidence.primaryMetric.name}\n`;
  prompt += `**Value:** ${evidence.primaryMetric.value}\n`;
  prompt += `**Status:** ${evidence.primaryMetric.status}\n`;
  if (evidence.primaryMetric.threshold !== undefined) {
    prompt += `**Threshold:** ${evidence.primaryMetric.threshold}\n`;
    const deviation = ((evidence.primaryMetric.value - evidence.primaryMetric.threshold) / evidence.primaryMetric.threshold * 100).toFixed(1);
    prompt += `**Deviation:** ${deviation}%\n`;
  }
  prompt += '\n';
  
  // Contributing factors
  if (evidence.contributingFactors.length > 0) {
    prompt += '## Contributing Factors\n\n';
    evidence.contributingFactors.forEach((factor, index) => {
      prompt += `${index + 1}. **${factor.metric.toUpperCase().replace(/_/g, ' ')}**\n`;
      prompt += `   - Value: ${factor.value}\n`;
      prompt += `   - Status: ${factor.status}\n`;
      if (factor.threshold !== undefined) {
        prompt += `   - Threshold: ${factor.threshold}\n`;
      }
      prompt += `   - Importance: ${factor.importance}\n`;
      prompt += '\n';
    });
  }
  
  // Recommendation context
  prompt += '## Recommendation Context\n\n';
  prompt += `**Type:** ${evidence.recommendationType}\n`;
  prompt += `**Category:** ${evidence.category}\n`;
  prompt += `**Priority:** ${evidence.priority}\n`;
  prompt += `**Urgency Score:** ${evidence.urgencyScore}/100\n`;
  prompt += `**Confidence Level:** ${evidence.confidenceLevel}\n`;
  prompt += `**Data Quality:** ${evidence.dataQualityScore}/100\n`;
  if (evidence.actionType && evidence.actionTarget) {
    prompt += `**Suggested Action:** ${evidence.actionType} ${evidence.actionTarget}\n`;
  }
  prompt += '\n';
  
  // User context (if available)
  if (evidence.userContext) {
    prompt += '## User Context\n\n';
    if (evidence.userContext.currentGoal) {
      prompt += `**Current Goal:** ${evidence.userContext.currentGoal}\n`;
    }
    if (evidence.userContext.recentActivity) {
      prompt += `**Recent Activity:** ${evidence.userContext.recentActivity}\n`;
    }
    prompt += '\n';
  }
  
  // Task
  prompt += '## Task\n\n';
  prompt += 'Based on the health data and context above, generate a personalized health recommendation. ';
  prompt += 'Return a JSON object with all required fields. Be specific, data-driven, and actionable.';
  
  return prompt;
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parseAIResponse(content: string): AIEnrichedFields {
  try {
    const parsed = JSON.parse(content);
    
    // Validate required fields
    if (!parsed.title || typeof parsed.title !== 'string') {
      throw new Error('Missing or invalid title');
    }
    if (!parsed.description || typeof parsed.description !== 'string') {
      throw new Error('Missing or invalid description');
    }
    if (!Array.isArray(parsed.reasonCodes)) {
      throw new Error('Missing or invalid reasonCodes');
    }
    if (typeof parsed.isInsightOnly !== 'boolean') {
      throw new Error('Missing or invalid isInsightOnly');
    }
    if (typeof parsed.requiresUserDecision !== 'boolean') {
      throw new Error('Missing or invalid requiresUserDecision');
    }
    
    return {
      title: parsed.title,
      description: parsed.description,
      rationale: parsed.rationale || undefined,
      reasonCodes: parsed.reasonCodes,
      recommendationGroup: parsed.recommendationGroup || undefined,
      supportingMetrics: parsed.supportingMetrics || undefined,
      isInsightOnly: parsed.isInsightOnly,
      requiresUserDecision: parsed.requiresUserDecision,
    };
    
  } catch (error: any) {
    logger.error('Failed to parse AI response', {
      error: error.message,
      content: content.substring(0, 200),
    });
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if OpenAI service is available
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    if (!OPENAI_API_KEY) {
      return false;
    }
    
    const client = getOpenAIClient();
    
    // Simple test request with timeout
    await Promise.race([
      client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      ),
    ]);
    
    return true;
  } catch (error) {
    logger.error('OpenAI health check failed', { error });
    return false;
  }
}

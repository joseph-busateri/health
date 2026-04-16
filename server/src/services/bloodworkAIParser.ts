import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';
import { logger } from '../utils/logger';
import type { ExtractedBloodworkResult, ExtractedBloodworkPanel } from '../types/bloodworkResults';
import { withAIFallback } from './aiServiceWrapper';
import { validateAIOutput, BloodworkParseSchema } from './aiOutputValidator';
import { redactPII, restorePII } from './piiProtection';
import { trackAICost } from './aiCostMonitor';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface AIParseResult {
  markers: ExtractedBloodworkResult[];
  panels: ExtractedBloodworkPanel[];
  confidence: number;
  tokensUsed: number;
  cost: number;
  model: string;
  requiresManualReview?: boolean;
  validationErrors?: string[];
  source: 'ai' | 'fallback';
}

interface AIParseResponse {
  panels: Array<{
    name: string;
    category: string;
  }>;
  markers: Array<{
    panel?: string;
    test_name: string;
    value: string;
    value_numeric?: number;
    unit?: string;
    reference_range?: string;
    reference_range_low?: number;
    reference_range_high?: number;
    abnormal_flag?: string;
  }>;
}

/**
 * Calculate cost based on token usage
 * GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
 */
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1000) * 0.03;
  const outputCost = (usage.completion_tokens / 1000) * 0.06;
  return inputCost + outputCost;
}

/**
 * Parse bloodwork document using OpenAI GPT-4 with full safety layers
 * This is the fallback when pattern matching fails or has low confidence
 * 
 * Safety layers:
 * - PII redaction before sending to OpenAI
 * - Output validation against schema
 * - Cost tracking per call
 * - Fallback to manual review on failure
 * - PII restoration after processing
 */
export async function parseWithAI(text: string, userId: string = 'system'): Promise<AIParseResult> {
  const startTime = Date.now();
  
  logger.info('[BLOODWORK PARSER] Starting AI parsing with safety layers', { 
    textLength: text.length,
    userId 
  });

  // Step 1: Redact PII before sending to OpenAI
  const { redactedText, piiMap, piiDetected } = await redactPII(text, {
    userId,
    serviceName: 'bloodwork-parser',
  });

  if (piiDetected) {
    logger.warn('[BLOODWORK PARSER] PII detected and redacted', {
      piiCount: Object.keys(piiMap).length,
    });
  }

  // Step 2: Call AI with fallback pattern
  return await withAIFallback(
    async () => {
      const openai = getOpenAIClient();
    
    const systemPrompt = `You are a medical lab report parser. Extract all biomarkers from the provided lab report text.

IMPORTANT INSTRUCTIONS:
1. Extract ALL test names, values, units, and reference ranges you can find
2. Identify panel names (e.g., "Lipid Panel", "CBC", "Metabolic Panel")
3. Categorize panels: cardiovascular, metabolic, hormonal, hematology, liver, kidney, vitamin, other
4. Parse reference ranges into low/high numeric values when possible
5. Detect abnormal flags (High, Low, Critical, Abnormal)
6. Return ONLY valid JSON, no additional text

Return JSON with this EXACT structure:
{
  "panels": [
    {
      "name": "Lipid Panel",
      "category": "cardiovascular"
    }
  ],
  "markers": [
    {
      "panel": "Lipid Panel",
      "test_name": "LDL Cholesterol",
      "value": "95 mg/dL",
      "value_numeric": 95,
      "unit": "mg/dL",
      "reference_range": "0-129",
      "reference_range_low": 0,
      "reference_range_high": 129,
      "abnormal_flag": null
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Extract all biomarkers from this lab report:\n\n${redactedText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const firstChoice = response.choices[0];
      const content = firstChoice.message.content;
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }

      // Strip markdown code blocks if present (more robust)
      let jsonContent = content.trim();
    
      // Remove markdown code blocks
      if (jsonContent.includes('```')) {
        const lines = jsonContent.split('\n');
        const startIdx = lines.findIndex(l => l.trim().startsWith('```'));
        const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === '```');
      
        if (startIdx !== -1 && endIdx !== -1) {
          jsonContent = lines.slice(startIdx + 1, endIdx).join('\n');
        } else if (startIdx !== -1) {
          // Only opening block found, remove it
          jsonContent = lines.slice(startIdx + 1).join('\n');
        }
      }
    
      // Remove any trailing commas before closing braces/brackets (common JSON error)
      jsonContent = jsonContent.replace(/,\s*([\]}])/g, '$1');

      let parsed: AIParseResponse;

      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        logger.warn('[BLOODWORK PARSER] Initial JSON.parse failed, attempting repair', {
          error: parseError instanceof Error ? parseError.message : 'unknown',
          textPreview: jsonContent.slice(0, 200),
        });

        const repaired = jsonrepair(jsonContent);
        parsed = JSON.parse(repaired);
      }

      // Step 3: Validate AI output against schema
      const validation = await validateAIOutput(parsed, {
        serviceName: 'bloodwork-parser',
        schema: BloodworkParseSchema,
        strictMode: true,
        confidenceThreshold: 0.7,
      });

      if (!validation.valid) {
        logger.error('[BLOODWORK PARSER] Invalid AI output', {
          errors: validation.errors,
          warnings: validation.warnings,
        });
        throw new Error(`Invalid AI output: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const processingTime = Date.now() - startTime;

      // Convert AI response to our internal format
      const panels: ExtractedBloodworkPanel[] = (parsed.panels || []).map(p => ({
        panel_name: p.name,
        panel_category: p.category
      }));

      const markers: ExtractedBloodworkResult[] = (parsed.markers || []).map(m => ({
        panel_name: m.panel,
        panel_category: panels.find(p => p.panel_name === m.panel)?.panel_category,
        raw_test_name: m.test_name,
        value_text: m.value,
        value_numeric: m.value_numeric,
        unit: m.unit,
        reference_range_text: m.reference_range,
        reference_range_low: m.reference_range_low,
        reference_range_high: m.reference_range_high,
        abnormal_flag: m.abnormal_flag,
        confidence: validation.confidence // Use validation confidence
      }));

      const tokensUsed = response.usage?.total_tokens || 0;
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const cost = response.usage ? calculateCost(response.usage) : 0;

      // Step 4: Track cost
      await trackAICost({
        timestamp: new Date(),
        serviceName: 'bloodwork-parser',
        userId,
        model: 'gpt-4o',
        inputTokens,
        outputTokens,
        latencyMs: processingTime,
        success: true,
      });

      logger.info('[BLOODWORK PARSER] AI parsing complete', {
        panelsFound: panels.length,
        markersFound: markers.length,
        tokensUsed,
        cost: cost.toFixed(4),
        processingTimeMs: processingTime,
        finishReason: firstChoice.finish_reason,
        validationConfidence: validation.confidence,
        requiresManualReview: validation.requiresManualReview,
      });

      // Step 5: Restore PII if needed
      const restoredMarkers = await Promise.all(
        markers.map(async (marker) => ({
          ...marker,
          raw_test_name: await restorePII(marker.raw_test_name || '', piiMap, {
            userId,
            serviceName: 'bloodwork-parser',
          }),
          value_text: await restorePII(marker.value_text || '', piiMap, {
            userId,
            serviceName: 'bloodwork-parser',
          }),
        }))
      );

      return {
        markers: restoredMarkers,
        panels,
        confidence: validation.confidence,
        tokensUsed,
        cost,
        model: 'gpt-4o',
        requiresManualReview: validation.requiresManualReview,
        validationErrors: validation.errors.map(e => e.message),
        source: 'ai' as const,
      };
    },
    // Fallback: Return empty result for manual review
    {
      markers: [],
      panels: [],
      confidence: 0,
      tokensUsed: 0,
      cost: 0,
      model: 'gpt-4o',
      requiresManualReview: true,
      validationErrors: ['AI parsing failed - manual review required'],
      source: 'fallback' as const,
    },
    {
      serviceName: 'bloodwork-parser',
      maxRetries: 2,
      timeoutMs: 30000,
    }
  );

}

/**
 * Test if OpenAI API is configured and accessible
 */
export async function testAIConnection(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured');
      return false;
    }

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });

    logger.info('OpenAI connection test successful');
    return true;
  } catch (error) {
    logger.error('OpenAI connection test failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
}

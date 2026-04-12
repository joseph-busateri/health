import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';
import { logger } from '../utils/logger';
import type { ExtractedBloodworkResult, ExtractedBloodworkPanel } from '../types/bloodworkResults';

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
 * Parse bloodwork document using OpenAI GPT-4
 * This is the fallback when pattern matching fails or has low confidence
 */
export async function parseWithAI(text: string): Promise<AIParseResult> {
  const startTime = Date.now();
  
  logger.info('Starting AI parsing', { textLength: text.length });

  try {
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
          content: `Extract all biomarkers from this lab report:\n\n${text}`
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
      logger.warn('Initial JSON.parse failed, attempting repair', {
        error: parseError instanceof Error ? parseError.message : 'unknown',
        textPreview: jsonContent.slice(0, 200),
      });

      const repaired = jsonrepair(jsonContent);
      parsed = JSON.parse(repaired);
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
      confidence: 0.85 // AI parsing generally high confidence
    }));

    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = response.usage ? calculateCost(response.usage) : 0;

    logger.info('AI parsing complete', {
      panelsFound: panels.length,
      markersFound: markers.length,
      tokensUsed,
      cost: cost.toFixed(4),
      processingTimeMs: processingTime,
      finishReason: firstChoice.finish_reason
    });

    return {
      markers,
      panels,
      confidence: markers.length > 0 ? 0.85 : 0.3,
      tokensUsed,
      cost,
      model: 'gpt-4'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('AI parsing failed', { 
      error: errorMessage,
      textLength: text.length,
      errorType: error instanceof SyntaxError ? 'JSON Parse Error' : 'Other Error'
    });

    // Return empty result on error
    return {
      markers: [],
      panels: [],
      confidence: 0,
      tokensUsed: 0,
      cost: 0,
      model: 'gpt-4'
    };
  }
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
